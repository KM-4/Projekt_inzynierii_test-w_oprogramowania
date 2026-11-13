import { test, expect, marker, contact, availableRoom, futureDates, cleanupUiMessage, evidenceRoot } from '../helpers/audit';
import fs from 'node:fs/promises';
import path from 'node:path';

test.afterEach(async({page,audit:a},info)=>{
  const id=info.title.match(/UI-\d+/)?.[0];
  if(page.isClosed()||!id)return;
  a.note({url:page.url(),visibleText:await page.locator('body').innerText().catch(()=>'(strona zamknięta)')});
  const file=path.join(evidenceRoot,'ui',`${id}.png`);
  await page.screenshot({path:file,fullPage:true});await info.attach('Rzeczywisty screenshot',{path:file,contentType:'image/png'});
});
async function home(page:any){await page.goto('/');await expect(page.getByRole('heading',{name:'Our Rooms',exact:true})).toBeVisible()}
async function fillContact(page:any,payload:any){for(const field of ['name','email','phone','subject','description'])await page.locator(`#${field}`).fill(payload[field])}
async function submitContact(page:any,a:any){
  const waiting=page.waitForResponse((r:any)=>r.url().endsWith('/api/message')&&r.request().method()==='POST');
  await page.getByRole('button',{name:'Submit',exact:true}).click();const r=await waiting;
  const body=await r.json();a.calls.push({startedAt:new Date().toISOString(),request:{method:'POST',url:r.url(),body:r.request().postDataJSON()},response:{status:r.status(),body}});return {status:r.status(),body};
}
async function reservePage(page:any,a:any,info:any){
  const room=await availableRoom(a),dates=futureDates();
  const r=await a.call('GET',`/api/room/${room.roomid}`);
  await page.goto(`/reservation/${room.roomid}?checkin=${dates.checkin}&checkout=${dates.checkout}`);
  if(r.status!==200){
    info.annotations.push({type:'blocked',description:`Szczegóły pokoju HTTP ${r.status}; DEF-01. Brak formularza rezerwacji.`});
    a.note({blockedBy:'DEF-01',detailStatus:r.status,roomid:room.roomid,dates});
    test.skip(true,`BLOCKED: szczegóły pokoju HTTP ${r.status}; DEF-01`);
  }
  await expect(page.getByRole('button',{name:'Reserve Now',exact:true})).toBeVisible();return {room,dates};
}
test('UI-01 Katalog pokoi zgodny z API',async({page,audit:a})=>{
  const r=await a.call('GET','/api/room');a.check(r.status,200,'Katalog API HTTP 200');await home(page);
  for(const room of r.body.rooms){await expect(page.getByRole('heading',{name:room.type,exact:true})).toBeVisible();await expect(page.getByText(`£${room.roomPrice} per night`,{exact:true})).toBeVisible();await expect(page.locator(`a[href^="/reservation/${room.roomid}?"]`)).toBeVisible()}
  a.note('Nazwy typów, ceny i linki rezerwacji odpowiadają bieżącej liście API.');
});
test('UI-02 Poprawna wiadomość kontaktowa',async({page,audit:a})=>{
  test.skip(!process.env.QA_USERNAME||!process.env.QA_PASSWORD,'BLOCKED: dane do sprzątania własnej wiadomości nieustawione.');
  await home(page);const name=marker();try{await fillContact(page,contact(name));const r=await submitContact(page,a);a.check(r.status,200,'POST kontakt HTTP 200');await expect(page.getByText(`Thanks for getting in touch ${name}!`,{exact:true})).toBeVisible()}finally{await cleanupUiMessage(a,name)}
});
test('UI-03 Pusty formularz kontaktowy',async({page,audit:a})=>{
  await home(page);const r=await submitContact(page,a);a.check(r.status,400,'Brak wymaganych pól HTTP 400');await expect(page.getByText('Name may not be blank',{exact:true})).toBeVisible();await expect(page.locator('#name')).toBeVisible();
});
test('UI-04 Niepoprawny email w kontakcie',async({page,audit:a})=>{
  await home(page);await fillContact(page,contact(marker(),{email:'bledny-email'}));
  const r=await submitContact(page,a);a.check(r.status,400,'Niepoprawny email odrzucony przez API');
  await expect(page.locator('.alert-danger')).toContainText(/email/i);await expect(page.locator('#email')).toHaveValue('bledny-email');
  await page.locator('#subject').fill('ABCD');const both=await submitContact(page,a);a.check(both.status,400,'Błędny email i temat odrzucone');await expect(page.locator('.alert-danger')).toContainText('Subject must be between 5 and 100 characters.');await expect(page.locator('.alert-danger')).toContainText(/email/i);
});
test('UI-05 Temat 4 znaki: poniżej minimum',async({page,audit:a})=>{
  await home(page);await fillContact(page,contact(marker(),{subject:'ABCD'}));const r=await submitContact(page,a);a.check(r.status,400,'Temat 4 znaki odrzucony');await expect(page.getByText('Subject must be between 5 and 100 characters.',{exact:true})).toBeVisible();
});
test('UI-06 Temat 5 znaków: dolna granica',async({page,audit:a})=>{
  test.skip(!process.env.QA_USERNAME||!process.env.QA_PASSWORD,'BLOCKED: brak danych do sprzątania.');
  await home(page);const name=marker();try{await fillContact(page,contact(name,{subject:'ABCDE'}));const r=await submitContact(page,a);a.check(r.status,200,'Temat 5 znaków przyjęty');await expect(page.getByText(`Thanks for getting in touch ${name}!`,{exact:true})).toBeVisible()}finally{await cleanupUiMessage(a,name)}
});
test('UI-07 Telefon 10 znaków: poniżej minimum',async({page,audit:a})=>{
  await home(page);await fillContact(page,contact(marker(),{phone:'1234567890'}));const r=await submitContact(page,a);a.check(r.status,400,'Telefon 10 znaków odrzucony');await expect(page.getByText('Phone must be between 11 and 21 characters.',{exact:true})).toBeVisible();
});
test('UI-08 Cena rezerwacji dwóch nocy',async({page,audit:a},info)=>{
  const {room}=await reservePage(page,a,info);await expect(page.getByText(`£${room.roomPrice} x 2 nights`,{exact:true})).toBeVisible();await expect(page.getByText(`£${room.roomPrice*2+40}`,{exact:true})).toBeVisible();a.note('Cena noclegu razy dwie noce plus widoczne opłaty 25 i 15 GBP.');
});
test('UI-09 Puste dane gościa w rezerwacji',async({page,audit:a},info)=>{
  await reservePage(page,a,info);await page.getByRole('button',{name:'Reserve Now',exact:true}).click();
  const response=page.waitForResponse(r=>r.url().endsWith('/api/booking')&&r.request().method()==='POST');await page.getByRole('button',{name:'Reserve Now',exact:true}).click();const r=await response;const body=await r.json();a.calls.push({request:{method:'POST',url:r.url(),body:r.request().postDataJSON()},response:{status:r.status(),body}});a.check(r.status(),400,'Puste dane gościa HTTP 400');await expect(page.getByRole('alert').filter({hasText:'Firstname'})).toBeVisible();
});
test('UI-10 Rezerwacja zachowuje wybrane daty',async({page,audit:a},info)=>{
  // Przypadek jest bezpiecznym sprawdzeniem payloadu przed zapisem. Finalne utworzenie pokrywa API-10.
  const {dates}=await reservePage(page,a,info);await page.getByRole('button',{name:'Reserve Now',exact:true}).click();
  for(const [field,value] of Object.entries({Firstname:'QATester',Lastname:'ProjektTestowy',Email:'qa-project@example.test',Phone:'12345678901'}))await page.getByRole('textbox',{name:field,exact:true}).fill(value);
  let sent:any;await page.route('**/api/booking',async route=>{if(route.request().method()==='POST'){sent=route.request().postDataJSON();await route.abort('blockedbyclient')}else await route.continue()});
  const pending=page.waitForRequest(r=>r.url().endsWith('/api/booking')&&r.method()==='POST');await page.getByRole('button',{name:'Reserve Now',exact:true}).click();await pending;
  a.note({mode:'Kontrola payloadu UI. POST przerwany przed serwerem, bez deklaracji pełnego E2E.',sent});a.check(sent.bookingdates,dates,'Daty wysyłane zgodne z wyborem użytkownika');
});
test('UI-11 Błędne logowanie administratora',async({page,audit:a})=>{
  await page.goto('/admin');await page.getByRole('textbox',{name:'Username',exact:true}).fill(marker());await page.locator('#password').fill('nieprawidlowe-dane-testowe');
  const pending=page.waitForResponse(r=>r.url().includes('/api/auth/login'));await page.getByRole('button',{name:'Login',exact:true}).click();const r=await pending;a.check(r.status(),401,'Błędne logowanie HTTP 401');await expect(page.getByText(/Invalid credentials/i)).toBeVisible();await expect(page.locator('#username')).toBeVisible();
});
test('UI-12 Wyszukanie dostępności dla poprawnego okresu',async({page,audit:a})=>{
  await home(page);const dates=futureDates();const fields=page.locator('.react-datepicker__input-container input');
  await fields.nth(0).fill(dates.checkin.split('-').reverse().join('/'));await fields.nth(0).press('Tab');
  await fields.nth(1).fill(dates.checkout.split('-').reverse().join('/'));await fields.nth(1).press('Tab');
  const pending=page.waitForResponse(r=>r.url().includes('/api/room?'));await page.getByRole('button',{name:'Check Availability',exact:true}).click();const r=await pending;
  a.check(r.status(),200,'Dostępność HTTP 200');const body=await r.json();const url=new URL(r.url());a.note({requestUrl:r.url(),response:body});a.check(url.searchParams.get('checkin'),dates.checkin,'Wybrany checkin wysłany');a.check(url.searchParams.get('checkout'),dates.checkout,'Wybrany checkout wysłany');
  for(const room of body.rooms){await expect(page.locator(`a[href^="/reservation/${room.roomid}?"]`)).toBeVisible()}
});
