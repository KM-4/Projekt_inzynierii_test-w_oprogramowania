import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const root='QA-Project/evidence/exploratory';await fs.mkdir(root,{recursive:true});
const mode=process.argv[2]||'observe';const file=`${root}/session.json`;
const redact=x=>{if(Array.isArray(x))return x.map(redact);if(x&&typeof x==='object')return Object.fromEntries(Object.entries(x).map(([k,v])=>[k,/token|password|cookie/i.test(k)?'[MASKED]':redact(v)]));return x};
if(mode==='start'){
  const charter=JSON.parse(await fs.readFile('QA-Project/supporting/exploration-charter.json','utf8'));
  await fs.writeFile(file,JSON.stringify({charter,startedAt:new Date().toISOString(),events:[],finishedAt:null},null,2));console.log('Uruchomiono sesję eksploracyjną');process.exit(0);
}
const session=JSON.parse(await fs.readFile(file,'utf8'));
const event={startedAt:new Date().toISOString(),mode,actions:[],reflection:process.argv[3]||''};
async function call(method,p,data,headers={}){const r=await fetch('https://automationintesting.online'+p,{method,headers:{'Content-Type':'application/json',...headers},body:data?JSON.stringify(data):undefined,signal:AbortSignal.timeout(15000)});const text=await r.text();let body;try{body=JSON.parse(text)}catch{body=text}event.actions.push(redact({time:new Date().toISOString(),request:{method,path:p,data,headers},response:{status:r.status,body}}));return {status:r.status,body};}
if(mode==='observe'){
  const rooms=await call('GET','/api/room');await call('GET',`/api/room/${rooms.body.rooms[0].roomid}`);
  await call('GET','/api/message');
  if(process.env.QA_USERNAME&&process.env.QA_PASSWORD){const auth=await call('POST','/api/auth/login',{username:process.env.QA_USERNAME,password:process.env.QA_PASSWORD});await call('GET',`/api/booking?roomid=${rooms.body.rooms[0].roomid}`,undefined,{Cookie:`token=${auth.body.token}`})}
}
if(mode==='dates'){
  // Dwa kontrolowane odczyty: odwrócony i zerowy okres. Bez tworzenia rezerwacji.
  await call('GET','/api/room?checkin=2027-01-14&checkout=2027-01-12');
  await call('GET','/api/room?checkin=2027-01-12&checkout=2027-01-12');
}
if(mode==='validation'){
  const valid={name:'QA eksploracja',email:'qa-project@example.test',phone:'12345678901',subject:'ABCDE',description:'A'.repeat(20)};
  for(const overrides of [{email:'bad',subject:'ABCD'},{subject:'A'.repeat(101)},{phone:'1'.repeat(22)},{description:'A'.repeat(19)}])await call('POST','/api/message',{...valid,...overrides});
}
if(mode==='booking-invalid'){
  const rooms=await call('GET','/api/room');
  const base={roomid:rooms.body.rooms[0].roomid,firstname:'QAExplore',lastname:'TylkoNegatywne',depositpaid:false,email:'qa-project@example.test',phone:'12345678901'};
  await call('POST','/api/booking',{...base,bookingdates:{checkin:'2027-01-14',checkout:'2027-01-12'}});
  await call('POST','/api/booking',{...base,bookingdates:{checkin:'2027-01-12',checkout:'2027-01-12'}});
  await call('POST','/api/booking',{...base,bookingdates:{checkin:'not-a-date',checkout:'2027-01-12'}});
  await call('POST','/api/booking',{});
}
if(mode==='ui-dates'){
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try{const page=await browser.newPage({viewport:{width:1440,height:1000},timezoneId:'Europe/Warsaw'});
    await page.goto('https://automationintesting.online/');await page.getByRole('heading',{name:'Our Rooms',exact:true}).waitFor();
    const fields=page.locator('.react-datepicker__input-container input');
    for(const [checkin,checkout] of [['14/01/2027','12/01/2027'],['12/01/2027','12/01/2027']]){
      await fields.nth(0).fill(checkin);await fields.nth(0).press('Tab');await fields.nth(1).fill(checkout);await fields.nth(1).press('Tab');
      const waiting=page.waitForResponse(r=>r.url().includes('/api/room?'));await page.getByRole('button',{name:'Check Availability',exact:true}).click();const r=await waiting;
      event.actions.push({time:new Date().toISOString(),input:{checkin,checkout},request:{url:r.url()},response:{status:r.status(),body:await r.json()},links:await page.locator('a[href^="/reservation/"]').evaluateAll(es=>es.map(e=>e.getAttribute('href'))),body:await page.locator('body').innerText()});
      await page.screenshot({path:`${root}/dates-${checkin.slice(0,2)}-${checkout.slice(0,2)}.png`,fullPage:true});
    }
  }finally{await browser.close()}
}
if(mode==='finish'){session.finishedAt=new Date().toISOString();session.durationMinutes=(new Date(session.finishedAt)-new Date(session.startedAt))/60000;}
event.finishedAt=new Date().toISOString();session.events.push(event);await fs.writeFile(file,JSON.stringify(session,null,2));console.log(JSON.stringify(event,null,2));
