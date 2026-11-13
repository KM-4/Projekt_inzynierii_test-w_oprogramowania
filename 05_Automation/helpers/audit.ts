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
  note(value:any){this.observations.push(redact(value))}
  async save() {
    const id=this.info.title.match(/(?:UI|API)-\d+/)?.[0]||'unknown';
    const folder=id.startsWith('UI')?'ui':'api';
    await fs.mkdir(path.join(evidenceRoot,folder),{recursive:true});
    const file=path.join(evidenceRoot,folder,`${id}.json`);
    const data={caseId:id,executedAt:this.startedAt,finishedAt:new Date().toISOString(),runnerStatus:this.info.status,annotations:this.info.annotations,requests:this.calls,assertions:this.assertions,observations:this.observations,error:redact(this.info.error?.message||null)};
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
  const call=async(method:string,url:string,data?:any,headers:any={})=>{
    const r=await fetch(new URL(url,baseURL),{method,headers:{'Content-Type':'application/json',...headers},body:data?JSON.stringify(data):undefined,signal:AbortSignal.timeout(20000)});
    const text=await r.text();let body:any;try{body=JSON.parse(text)}catch{body=text}
    a.calls.push(redact({startedAt:new Date().toISOString(),request:{method,url,body:data,headers},response:{status:r.status,body},transport:'Node fetch - cleanup poza trace UI'}));return {status:r.status,body};
  };
  const auth=await call('POST','/api/auth/login',{username:process.env.QA_USERNAME,password:process.env.QA_PASSWORD});
  a.check(auth.status,200,'Sprzątanie: zalogowano');
  const list=await call('GET','/api/message');
  for(const m of list.body.messages.filter((x:any)=>x.name===name)){
    const d=await call('DELETE',`/api/message/${m.id}`,undefined,{Cookie:`token=${auth.body.token}`});
    a.checkSoft(d.status,200,'Usunięto własną wiadomość UI');
  }
}
export async function availableRoom(a:Audit){const r=await a.call('GET','/api/room');a.check(r.status,200,'Lista pokoi HTTP 200');a.check(r.body.rooms.length>0,true,'Jest pokój do testu');return r.body.rooms[0]}
export function futureDates(){const start=new Date();start.setUTCDate(start.getUTCDate()+60);const end=new Date(start);end.setUTCDate(end.getUTCDate()+2);return {checkin:start.toISOString().slice(0,10),checkout:end.toISOString().slice(0,10)}}
