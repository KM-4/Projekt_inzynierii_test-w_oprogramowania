# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api.spec.ts >> API-06 Email jako obiekt zamiast tekstu
- Location: tests\api.spec.ts:27:5

# Error details

```
Error: Błędny typ: HTTP 400

expect(received).toEqual(expected) // deep equality

Expected: 400
Received: 500
```

# Test source

```ts
  1  | import { test as base, expect, APIRequestContext, APIResponse, TestInfo } from 'playwright/test';
  2  | import fs from 'node:fs/promises';
  3  | import path from 'node:path';
  4  | import { randomUUID } from 'node:crypto';
  5  | 
  6  | export const evidenceRoot = path.resolve(process.env.EVIDENCE_DIR || '../evidence');
  7  | export const baseURL = process.env.BASE_URL || 'https://automationintesting.online';
  8  | export const marker = () => `QA-${Date.now()}-${randomUUID().slice(0,6)}`;
  9  | export function redact(v: any): any {
  10 |   if (Array.isArray(v)) return v.map(redact);
  11 |   if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k,x]) => [k, /password|token|cookie|authorization/i.test(k) ? '[MASKED]' : redact(x)]));
  12 |   if (typeof v === 'string') {
  13 |     for (const secret of [process.env.QA_PASSWORD, process.env.QA_USERNAME]) if (secret) v=v.replaceAll(secret,'[MASKED]');
  14 |   }
  15 |   return v;
  16 | }
  17 | export class Audit {
  18 |   startedAt=new Date().toISOString();
  19 |   calls: any[]=[]; assertions: any[]=[]; observations: any[]=[];
  20 |   constructor(public api: APIRequestContext, public info: TestInfo) {}
  21 |   async call(method: string, url: string, data?: any, headers?: any) {
  22 |     const startedAt=new Date().toISOString();
  23 |     const r=await this.api.fetch(url,{method,data,headers,timeout:20000,maxRetries:0});
  24 |     const text=await r.text(); let body:any; try{body=JSON.parse(text)}catch{body=text}
  25 |     this.calls.push(redact({startedAt,request:{method,url:new URL(url,baseURL).toString(),headers:headers||{},body:data??null},response:{status:r.status(),headers:r.headers(),body}}));
  26 |     return {response:r,status:r.status(),body};
  27 |   }
  28 |   check(actual:any, expected:any, label:string) {
  29 |     const pass=JSON.stringify(actual)===JSON.stringify(expected);
  30 |     this.assertions.push({requestIndex:this.calls.length-1,label,actual:redact(actual),expected:redact(expected),pass});
> 31 |     expect(actual,label).toEqual(expected);
     |                          ^ Error: Błędny typ: HTTP 400
  32 |   }
  33 |   checkSoft(actual:any,expected:any,label:string){this.assertions.push({requestIndex:this.calls.length-1,label,actual:redact(actual),expected:redact(expected),pass:JSON.stringify(actual)===JSON.stringify(expected)});expect.soft(actual,label).toEqual(expected)}
  34 |   note(value:any){this.observations.push(redact(value))}
  35 |   async save() {
  36 |     const id=this.info.title.match(/(?:UI|API)-\d+/)?.[0]||'unknown';
  37 |     const folder=id.startsWith('UI')?'ui':'api';
  38 |     await fs.mkdir(path.join(evidenceRoot,folder),{recursive:true});
  39 |     const file=path.join(evidenceRoot,folder,`${id}.json`);
  40 |     const data={caseId:id,executedAt:this.startedAt,finishedAt:new Date().toISOString(),runnerStatus:this.info.status,annotations:this.info.annotations,requests:this.calls,assertions:this.assertions,observations:this.observations,error:redact(this.info.error?.message||null)};
  41 |     await fs.writeFile(file,JSON.stringify(data,null,2));
  42 |     await this.info.attach('Dowód wykonania',{path:file,contentType:'application/json'});
  43 |   }
  44 | }
  45 | export const test = base.extend<{ audit: Audit }>({
  46 |   audit: [async ({request},use,info)=>{const audit=new Audit(request,info);try{await use(audit)}finally{await audit.save()}},{auto:true}],
  47 | });
  48 | export {expect};
  49 | export async function login(a:Audit) {
  50 |   base.skip(!process.env.QA_USERNAME||!process.env.QA_PASSWORD,'BLOCKED: ustaw QA_USERNAME i QA_PASSWORD dla odczytu i sprzątania własnych danych.');
  51 |   const r=await a.call('POST','/api/auth/login',{username:process.env.QA_USERNAME,password:process.env.QA_PASSWORD});
  52 |   a.check(r.status,200,'Logowanie API: HTTP 200');
  53 |   a.check(typeof r.body.token,'string','Otrzymano token');
  54 |   return {Cookie:`token=${r.body.token}`};
  55 | }
  56 | export const contact=(name:string, overrides:any={})=>({name,email:'qa-project@example.test',phone:'12345678901',subject:`Zapytanie ${name}`,description:'Wiadomość testowa projektu akademickiego. Dane syntetyczne.',...overrides});
  57 | export async function cleanupMessage(a:Audit,name:string){
  58 |   const headers=await login(a);const list=await a.call('GET','/api/message');
  59 |   for(const m of list.body.messages.filter((x:any)=>x.name===name)){
  60 |     const d=await a.call('DELETE',`/api/message/${m.id}`,undefined,headers);
  61 |     a.check(d.status,200,'Usunięto wyłącznie własną wiadomość');
  62 |   }
  63 | }
  64 | // Odrębny transport Node dla sprzątania po UI: prawdziwy sekret nie trafia do browser trace.
  65 | export async function cleanupUiMessage(a:Audit,name:string){
  66 |   const call=async(method:string,url:string,data?:any,headers:any={})=>{
  67 |     const r=await fetch(new URL(url,baseURL),{method,headers:{'Content-Type':'application/json',...headers},body:data?JSON.stringify(data):undefined,signal:AbortSignal.timeout(20000)});
  68 |     const text=await r.text();let body:any;try{body=JSON.parse(text)}catch{body=text}
  69 |     a.calls.push(redact({startedAt:new Date().toISOString(),request:{method,url,body:data,headers},response:{status:r.status,body},transport:'Node fetch - cleanup poza trace UI'}));return {status:r.status,body};
  70 |   };
  71 |   const auth=await call('POST','/api/auth/login',{username:process.env.QA_USERNAME,password:process.env.QA_PASSWORD});
  72 |   a.check(auth.status,200,'Sprzątanie: zalogowano');
  73 |   const list=await call('GET','/api/message');
  74 |   for(const m of list.body.messages.filter((x:any)=>x.name===name)){
  75 |     const d=await call('DELETE',`/api/message/${m.id}`,undefined,{Cookie:`token=${auth.body.token}`});
  76 |     a.checkSoft(d.status,200,'Usunięto własną wiadomość UI');
  77 |   }
  78 | }
  79 | export async function availableRoom(a:Audit){const r=await a.call('GET','/api/room');a.check(r.status,200,'Lista pokoi HTTP 200');a.check(r.body.rooms.length>0,true,'Jest pokój do testu');return r.body.rooms[0]}
  80 | export function futureDates(){const start=new Date();start.setUTCDate(start.getUTCDate()+60);const end=new Date(start);end.setUTCDate(end.getUTCDate()+2);return {checkin:start.toISOString().slice(0,10),checkout:end.toISOString().slice(0,10)}}
  81 | 
```