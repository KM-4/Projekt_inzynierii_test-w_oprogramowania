import { test as base, expect, APIRequestContext, APIResponse, TestInfo } from 'playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export const evidenceRoot = path.resolve(process.env.EVIDENCE_DIR || '../evidence');
export const baseURL = process.env.BASE_URL || 'https://automationintesting.online';
export const marker = () => `QA-${Date.now()}-${randomUUID().slice(0,6)}`;
export function redact(v: any): any {
  if (Array.isArray(v)) return v.map(redact);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k,x]) => [k, /password|token|cookie|authorization/i.test(k) ? '[MASKED]' : redact(x)]));
  if (typeof v === 'string') {
    for (const secret of [process.env.QA_PASSWORD, process.env.QA_USERNAME]) if (secret) v=v.replaceAll(secret,'[MASKED]');
  }
  return v;
}
export class Audit {
  startedAt=new Date().toISOString();
  calls: any[]=[]; assertions: any[]=[]; observations: any[]=[];
  constructor(public api: APIRequestContext, public info: TestInfo) {}
  async call(method: string, url: string, data?: any, headers?: any) {
    const startedAt=new Date().toISOString();
    const r=await this.api.fetch(url,{method,data,headers,timeout:20000,maxRetries:0});
    const text=await r.text(); let body:any; try{body=JSON.parse(text)}catch{body=text}
    this.calls.push(redact({startedAt,request:{method,url:new URL(url,baseURL).toString(),headers:headers||{},body:data??null},response:{status:r.status(),headers:r.headers(),body}}));
    return {response:r,status:r.status(),body};
  }
  check(actual:any, expected:any, label:string) {
    const pass=JSON.stringify(actual)===JSON.stringify(expected);
    this.assertions.push({requestIndex:this.calls.length-1,label,actual:redact(actual),expected:redact(expected),pass});
    expect(actual,label).toEqual(expected);
  }
  checkSoft(actual:any,expected:any,label:string){this.assertions.push({requestIndex:this.calls.length-1,label,actual:redact(actual),expected:redact(expected),pass:JSON.stringify(actual)===JSON.stringify(expected)});expect.soft(actual,label).toEqual(expected)}
  // Kontrola informacyjna (np. sprzątanie danych po teście UI): zapisana w evidence i jako adnotacja,
  // ale nie wpływa na werdykt testu. Werdykt UI dotyczy zachowania, które test sprawdza.
  inform(actual:any,expected:any,label:string){
    const pass=JSON.stringify(actual)===JSON.stringify(expected);
    this.assertions.push({requestIndex:this.calls.length-1,label,actual:redact(actual),expected:redact(expected),pass,informational:true});
    if(!pass)this.info.annotations.push({type:'cleanup',description:`${label}: oczekiwano ${JSON.stringify(expected)}, otrzymano ${JSON.stringify(actual)} (nie wpływa na werdykt)`});
  }
  note(value:any){this.observations.push(redact(value))}
  // Screenshot kroku: wycinek obejmujący wskazane elementy (z marginesem), zapisany jako evidence/ui/<ID>/krok-NN.png.
  // Bez elementów zapisuje górny fragment widoku. Przewija tak, aby stały pasek nawigacji nie zasłaniał wycinka.
  steps: {no:number,label:string,file:string}[]=[];
  async step(page:any,label:string,targets:any[]=[]){
    const id=this.info.title.match(/UI-\d+/)?.[0]||'unknown';
    const no=this.steps.length+1;
    const dir=path.join(evidenceRoot,'ui',id);
    await fs.mkdir(dir,{recursive:true});
    const file=path.join(dir,`krok-${String(no).padStart(2,'0')}.png`);
    const els:any[]=[];
    for(const t of targets)for(const el of await t.all())if(await el.isVisible())els.push(el);
    const rects=async()=>Promise.all(els.map((el)=>el.evaluate((e:any)=>{const r=e.getBoundingClientRect();return {x:r.left,y:r.top+window.scrollY,w:r.width,h:r.height,vy:r.top}})));
    let clip={x:420,y:0,width:600,height:200}; // bez elementów: kadr górnej części strony (np. wskaźnik ładowania)
    if(els.length){
      const first=await rects();const top=Math.min(...first.map((r)=>r.y));
      await page.evaluate((y:number)=>window.scrollTo(0,Math.max(0,y-130)),top);
      await page.evaluate(()=>new Promise((r)=>requestAnimationFrame(()=>requestAnimationFrame(r))));
      const rs=await rects();const vp=page.viewportSize();const padX=20,padTop=44,padBottom=16;
      const x0=Math.max(0,Math.min(...rs.map((r)=>r.x))-padX),y0=Math.max(0,Math.min(...rs.map((r)=>r.vy))-padTop);
      const x1=Math.min(vp.width,Math.max(...rs.map((r)=>r.x+r.w))+padX),y1=Math.min(vp.height,Math.max(...rs.map((r)=>r.vy+r.h))+padBottom);
      clip={x:x0,y:y0,width:Math.max(1,x1-x0),height:Math.max(1,y1-y0)};
    }else{
      await page.evaluate(()=>window.scrollTo(0,0));
    }
    await page.screenshot({path:file,clip,animations:'disabled'});
    const rel=path.relative(path.resolve(evidenceRoot,'..'),file).replaceAll('\\','/');
    this.steps.push({no,label,file:rel});
    await this.info.attach(`Krok ${no}: ${label}`,{path:file,contentType:'image/png'});
  }
  async save() {
    const id=this.info.title.match(/(?:UI|API)-\d+/)?.[0]||'unknown';
    const folder=id.startsWith('UI')?'ui':'api';
    await fs.mkdir(path.join(evidenceRoot,folder),{recursive:true});
    const file=path.join(evidenceRoot,folder,`${id}.json`);
    const data={caseId:id,executedAt:this.startedAt,finishedAt:new Date().toISOString(),runnerStatus:this.info.status,annotations:this.info.annotations,steps:this.steps,requests:this.calls,assertions:this.assertions,observations:this.observations,error:redact(this.info.error?.message||null)};
    await fs.writeFile(file,JSON.stringify(data,null,2));
    await this.info.attach('Dowód wykonania',{path:file,contentType:'application/json'});
  }
}
export const test = base.extend<{ audit: Audit }>({
  audit: [async ({request},use,info)=>{const audit=new Audit(request,info);try{await use(audit)}finally{await audit.save()}},{auto:true}],
});
export {expect};
export async function login(a:Audit) {
  base.skip(!process.env.QA_USERNAME||!process.env.QA_PASSWORD,'BLOCKED: ustaw QA_USERNAME i QA_PASSWORD dla odczytu i sprzątania własnych danych.');
  const r=await a.call('POST','/api/auth/login',{username:process.env.QA_USERNAME,password:process.env.QA_PASSWORD});
  a.check(r.status,200,'Logowanie API: HTTP 200');
  a.check(typeof r.body.token,'string','Otrzymano token');
  return {Cookie:`token=${r.body.token}`};
}
export const contact=(name:string, overrides:any={})=>({name,email:'qa-project@example.test',phone:'12345678901',subject:`Zapytanie ${name}`,description:'Wiadomość testowa projektu akademickiego. Dane syntetyczne.',...overrides});
export async function cleanupMessage(a:Audit,name:string){
  const headers=await login(a);const list=await a.call('GET','/api/message');
  for(const m of list.body.messages.filter((x:any)=>x.name===name)){
    const d=await a.call('DELETE',`/api/message/${m.id}`,undefined,headers);
    a.check(d.status,200,'Usunięto wyłącznie własną wiadomość');
  }
}
// Odrębny transport Node dla sprzątania po UI: prawdziwy sekret nie trafia do browser trace.
export async function cleanupUiMessage(a:Audit,name:string){
  if(!process.env.QA_USERNAME||!process.env.QA_PASSWORD){
    a.info.annotations.push({type:'cleanup',description:'Sprzątanie pominięte: brak QA_USERNAME/QA_PASSWORD (nie wpływa na werdykt).'});
    return;
  }
  const call=async(method:string,url:string,data?:any,headers:any={})=>{
    const r=await fetch(new URL(url,baseURL),{method,headers:{'Content-Type':'application/json',...headers},body:data?JSON.stringify(data):undefined,signal:AbortSignal.timeout(20000)});
    const text=await r.text();let body:any;try{body=JSON.parse(text)}catch{body=text}
    a.calls.push(redact({startedAt:new Date().toISOString(),request:{method,url,body:data,headers},response:{status:r.status,body},transport:'Node fetch - cleanup poza trace UI'}));return {status:r.status,body};
  };
  const auth=await call('POST','/api/auth/login',{username:process.env.QA_USERNAME,password:process.env.QA_PASSWORD});
  a.inform(auth.status,200,'Sprzątanie: zalogowano');
  if(auth.status!==200)return;
  const list=await call('GET','/api/message');
  for(const m of list.body.messages.filter((x:any)=>x.name===name)){
    const d=await call('DELETE',`/api/message/${m.id}`,undefined,{Cookie:`token=${auth.body.token}`});
    a.inform(d.status,200,'Sprzątanie: usunięto własną wiadomość UI');
  }
}
// Pierwszy pokój z bieżącej listy (bez stałych ID). Nie sprawdza dostępności terminu.
export async function firstListedRoom(a:Audit){const r=await a.call('GET','/api/room');a.check(r.status,200,'Lista pokoi HTTP 200');a.check(r.body.rooms.length>0,true,'Jest pokój do testu');return r.body.rooms[0]}
export function futureDates(){const start=new Date();start.setUTCDate(start.getUTCDate()+60);const end=new Date(start);end.setUTCDate(end.getUTCDate()+2);return {checkin:start.toISOString().slice(0,10),checkout:end.toISOString().slice(0,10)}}
