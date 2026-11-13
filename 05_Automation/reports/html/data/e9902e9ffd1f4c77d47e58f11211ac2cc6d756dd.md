# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui.spec.ts >> UI-02 Poprawna wiadomość kontaktowa
- Location: tests\ui.spec.ts:35:5

# Error details

```
Error: Usunięto własną wiadomość UI

expect(received).toEqual(expected) // deep equality

Expected: 200
Received: 500
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - navigation [ref=e4]:
      - generic [ref=e5]:
        - link "Shady Meadows B&B" [ref=e6] [cursor=pointer]:
          - /url: /
        - list [ref=e9]:
          - listitem [ref=e10]:
            - link "Rooms" [ref=e11] [cursor=pointer]:
              - /url: /#rooms
          - listitem [ref=e12]:
            - link "Booking" [ref=e13] [cursor=pointer]:
              - /url: /#booking
          - listitem [ref=e14]:
            - link "Amenities" [ref=e15] [cursor=pointer]:
              - /url: /#amenities
          - listitem [ref=e16]:
            - link "Location" [ref=e17] [cursor=pointer]:
              - /url: /#location
          - listitem [ref=e18]:
            - link "Contact" [ref=e19] [cursor=pointer]:
              - /url: /#contact
          - listitem [ref=e20]:
            - link "Admin" [ref=e21] [cursor=pointer]:
              - /url: /admin
    - generic [ref=e25]:
      - heading "Welcome to Shady Meadows B&B" [level=1] [ref=e26]
      - paragraph [ref=e27]: Welcome to Shady Meadows, a delightful Bed & Breakfast nestled in the hills on Newingtonfordburyshire. A place so beautiful you will never want to leave. All our rooms have comfortable beds and we provide breakfast from the locally sourced supermarket. It is a delightful place.
      - link "Book Now" [ref=e28] [cursor=pointer]:
        - /url: "#booking"
    - generic [ref=e29]:
      - generic [ref=e33]:
        - heading "Check Availability & Book Your Stay" [level=3] [ref=e34]
        - generic [ref=e36]:
          - generic [ref=e37]:
            - generic [ref=e38]: Check In
            - textbox [ref=e41]: 13/11/2026
          - generic [ref=e42]:
            - generic [ref=e43]: Check Out
            - textbox [ref=e46]: 14/11/2026
          - button "Check Availability" [ref=e49] [cursor=pointer]
      - generic [ref=e52]:
        - generic [ref=e53]:
          - heading "Our Rooms" [level=2] [ref=e54]
          - paragraph [ref=e55]: Comfortable beds and delightful breakfast from locally sourced ingredients
        - generic [ref=e56]:
          - generic [ref=e58]:
            - img "Single Room" [ref=e60]
            - generic [ref=e61]:
              - heading "Single" [level=5] [ref=e62]
              - paragraph [ref=e63]: Aenean porttitor mauris sit amet lacinia molestie. In posuere accumsan aliquet. Maecenas sit amet nisl massa. Interdum et malesuada fames ac ante.
              - generic [ref=e65]:
                - generic [ref=e66]:
                  - generic [ref=e67]: 
                  - text: TV
                - generic [ref=e68]:
                  - generic [ref=e69]: 
                  - text: WiFi
                - generic [ref=e70]:
                  - generic [ref=e71]: 
                  - text: Safe
            - generic [ref=e72]:
              - generic [ref=e73]: £100 per night
              - link "Book now" [ref=e74] [cursor=pointer]:
                - /url: /reservation/1?checkin=2026-11-13&checkout=2026-11-14
          - generic [ref=e76]:
            - img "Single Room" [ref=e78]
            - generic [ref=e79]:
              - heading "Double" [level=5] [ref=e80]
              - paragraph [ref=e81]: Vestibulum sollicitudin, lectus ac mollis consequat, lorem orci ultrices tellus, eleifend euismod tortor dui egestas erat. Phasellus et ipsum nisl.
              - generic [ref=e83]:
                - generic [ref=e84]:
                  - generic [ref=e85]: 
                  - text: TV
                - generic [ref=e86]:
                  - generic [ref=e87]: 
                  - text: Radio
                - generic [ref=e88]:
                  - generic [ref=e89]: 
                  - text: Safe
            - generic [ref=e90]:
              - generic [ref=e91]: £150 per night
              - link "Book now" [ref=e92] [cursor=pointer]:
                - /url: /reservation/2?checkin=2026-11-13&checkout=2026-11-14
          - generic [ref=e94]:
            - img "Single Room" [ref=e96]
            - generic [ref=e97]:
              - heading "Suite" [level=5] [ref=e98]
              - paragraph [ref=e99]: Etiam metus metus, fringilla ac sagittis id, consequat vel neque. Nunc commodo quis nisl nec posuere. Etiam at accumsan ex.
              - generic [ref=e101]:
                - generic [ref=e102]:
                  - generic [ref=e103]: 
                  - text: Radio
                - generic [ref=e104]:
                  - generic [ref=e105]: 
                  - text: WiFi
                - generic [ref=e106]:
                  - generic [ref=e107]: 
                  - text: Safe
            - generic [ref=e108]:
              - generic [ref=e109]: £225 per night
              - link "Book now" [ref=e110] [cursor=pointer]:
                - /url: /reservation/3?checkin=2026-11-13&checkout=2026-11-14
    - generic [ref=e112]:
      - generic [ref=e113]:
        - heading "Our Location" [level=2] [ref=e114]
        - paragraph [ref=e115]: Find us in the beautiful Newingtonfordburyshire countryside
      - generic [ref=e116]:
        - generic [ref=e120]:
          - generic [ref=e123]:
            - generic:
              - img:
                - generic [ref=e124] [cursor=pointer]
          - generic [ref=e127]:
            - generic [ref=e128]:
              - link "Pigeon" [ref=e129] [cursor=pointer]:
                - /url: https://pigeon-maps.js.org/
              - text: "|"
            - generic [ref=e130]:
              - text: ©
              - link "OpenStreetMap" [ref=e131] [cursor=pointer]:
                - /url: https://www.openstreetmap.org/copyright
              - text: contributors
        - generic [ref=e134]:
          - heading "Contact Information" [level=3] [ref=e135]
          - generic [ref=e136]:
            - generic [ref=e137]: 
            - generic [ref=e139]:
              - heading "Address" [level=5] [ref=e140]
              - paragraph [ref=e141]: Shady Meadows B&B, Shadows valley, Newingtonfordburyshire, Dilbery, N1 1AA
          - generic [ref=e142]:
            - generic [ref=e143]: 
            - generic [ref=e145]:
              - heading "Phone" [level=5] [ref=e146]
              - paragraph [ref=e147]: "012345678901"
          - generic [ref=e148]:
            - generic [ref=e149]: 
            - generic [ref=e151]:
              - heading "Email" [level=5] [ref=e152]
              - paragraph [ref=e153]: fake@fakeemail.com
          - separator [ref=e154]
          - heading "Getting Here" [level=4] [ref=e155]
          - paragraph [ref=e156]: Welcome to Shady Meadows, a delightful Bed & Breakfast nestled in the hills on Newingtonfordburyshire. A place so beautiful you will never want to leave. All our rooms have comfortable beds and we provide breakfast from the locally sourced supermarket. It is a delightful place.
    - generic [ref=e162]:
      - heading "Thanks for getting in touch QA-1794585221298-833b4f!" [level=3] [ref=e163]
      - paragraph [ref=e164]: We'll get back to you about
      - paragraph [ref=e165]: Zapytanie QA-1794585221298-833b4f
      - paragraph [ref=e166]: as soon as possible.
    - contentinfo [ref=e167]:
      - generic [ref=e168]:
        - generic [ref=e169]:
          - generic [ref=e170]:
            - heading "Shady Meadows B&B" [level=5] [ref=e171]
            - paragraph [ref=e172]: Welcome to Shady Meadows, a delightful Bed & Breakfast nestled in the hills on Newingtonfordburyshire. A place so beautiful you will never want to leave. All our rooms have comfortable beds and we provide breakfast from the locally sourced supermarket. It is a delightful place.
            - generic [ref=e173]:
              - link "" [ref=e174] [cursor=pointer]:
                - /url: "#"
              - link "" [ref=e176] [cursor=pointer]:
                - /url: "#"
              - link "" [ref=e178] [cursor=pointer]:
                - /url: "#"
          - generic [ref=e180]:
            - heading "Contact Us" [level=5] [ref=e181]
            - list [ref=e182]:
              - listitem [ref=e183]:
                - generic [ref=e184]: 
                - text: Shady Meadows B&B, Shadows valley, Newingtonfordburyshire, Dilbery, N1 1AA
              - listitem [ref=e185]:
                - generic [ref=e186]: 
                - text: "012345678901"
              - listitem [ref=e187]:
                - generic [ref=e188]: 
                - text: fake@fakeemail.com
          - generic [ref=e189]:
            - heading "Quick Links" [level=5] [ref=e190]
            - list [ref=e191]:
              - listitem [ref=e192]:
                - link "Home" [ref=e193] [cursor=pointer]:
                  - /url: "#"
              - listitem [ref=e194]:
                - link "Rooms" [ref=e195] [cursor=pointer]:
                  - /url: "#"
              - listitem [ref=e196]:
                - link "Booking" [ref=e197] [cursor=pointer]:
                  - /url: "#"
              - listitem [ref=e198]:
                - link "Contact" [ref=e199] [cursor=pointer]:
                  - /url: "#"
        - separator [ref=e200]
        - generic [ref=e202]:
          - text: restful-booker-platform v2.2 Created by
          - link "Mark Winteringham" [ref=e203] [cursor=pointer]:
            - /url: http://www.mwtestconsultancy.co.uk
          - text: "- © 2019-26"
          - link "Cookie-Policy" [ref=e204] [cursor=pointer]:
            - /url: /cookie
          - text: "-"
          - link "Privacy-Policy" [ref=e205] [cursor=pointer]:
            - /url: /privacy
          - text: "-"
          - link "Admin panel" [ref=e206] [cursor=pointer]:
            - /url: /admin
  - alert [ref=e207]
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
  31 |     expect(actual,label).toEqual(expected);
  32 |   }
> 33 |   checkSoft(actual:any,expected:any,label:string){this.assertions.push({requestIndex:this.calls.length-1,label,actual:redact(actual),expected:redact(expected),pass:JSON.stringify(actual)===JSON.stringify(expected)});expect.soft(actual,label).toEqual(expected)}
     |                                                                                                                                                                                                                                                   ^ Error: Usunięto własną wiadomość UI
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