import { test, expect, contact, marker, login, availableRoom, futureDates } from '../helpers/audit';

test('API-01 Lista pokoi: schemat i unikalne identyfikatory',async({audit:a})=>{
  const r=await a.call('GET','/api/room');a.check(r.status,200,'HTTP 200');
  a.check(Array.isArray(r.body.rooms),true,'rooms jest tablicą');
  a.check(r.body.rooms.length>0,true,'Katalog niepusty');
  const ids=r.body.rooms.map((x:any)=>x.roomid);a.check(new Set(ids).size,ids.length,'Unikalne ID');
  for(const room of r.body.rooms){a.check(typeof room.roomPrice,'number','Cena jest liczbą');a.check(room.roomPrice>0,true,'Cena dodatnia');a.check(typeof room.type,'string','Typ pokoju jest tekstem')}
});
test('API-02 Szczegóły pokoju zgodne z listą',async({audit:a})=>{
  const room=await availableRoom(a);const r=await a.call('GET',`/api/room/${room.roomid}`);
  a.check(r.status,200,'Istniejący pokój: HTTP 200');a.check(r.body.roomid,room.roomid,'ID zgodny z listą');a.check(r.body.roomPrice,room.roomPrice,'Cena zgodna z listą');
});
test('API-03 Nieistniejący pokój: HTTP 404',async({audit:a})=>{
  const list=await a.call('GET','/api/room');a.check(list.status,200,'Odczyt ID');
  const id=Math.max(...list.body.rooms.map((x:any)=>x.roomid))+100000;
  a.note({missingId:id,basis:'ID poza aktualną listą; brak zapisu do SUT'});
  const r=await a.call('GET',`/api/room/${id}`);a.check(r.status,404,'Brak zasobu: HTTP 404');
});
test('API-04 Wiadomość bez wymaganych pól',async({audit:a})=>{
  const r=await a.call('POST','/api/message',{});a.check(r.status,400,'Brak pól: HTTP 400');
  a.check(Array.isArray(r.body),true,'Tablica walidacji');a.check(r.body.some((x:string)=>/Name must be set/.test(x)),true,'Błąd pola name');
});
test('API-05 Niepoprawny format email wiadomości',async({audit:a})=>{
  const r=await a.call('POST','/api/message',contact(marker(),{email:'nie-jest-mailem'}));a.check(r.status,400,'Błędny email: HTTP 400');a.check(JSON.stringify(r.body).toLowerCase().includes('email'),true,'Wskazanie email');
});
test('API-06 Email jako obiekt zamiast tekstu',async({audit:a})=>{
  const r=await a.call('POST','/api/message',contact(marker(),{email:{value:'qa@example.test'}}));a.check(r.status,400,'Błędny typ: HTTP 400');
});
test('API-07 Rezerwacje bez uwierzytelnienia',async({audit:a})=>{
  const room=await availableRoom(a);const r=await a.call('GET',`/api/booking?roomid=${room.roomid}`);a.check(r.status,401,'Brak tokenu: HTTP 401');a.check(r.body.error,'Authentication required','Komunikat autoryzacji');
});
test('API-08 Nieprawidłowe dane logowania',async({audit:a})=>{
  const r=await a.call('POST','/api/auth/login',{username:marker(),password:'nieprawidlowe-dane-testowe'});a.check(r.status,401,'Odrzucenie logowania: HTTP 401');a.check(r.body.error,'Invalid credentials','Komunikat błędu');a.check('token' in r.body,false,'Brak tokenu');
});
test('API-09 Wiadomość: utwórz, odczytaj, oznacz przeczytaną',async({audit:a})=>{
  const headers=await login(a);const name=marker();const payload=contact(name);let id:number|undefined;
  try{
    const created=await a.call('POST','/api/message',payload);a.check(created.status,200,'Proxy POST message: HTTP 200');a.check(created.body.success,true,'Potwierdzenie utworzenia');
    const list=await a.call('GET','/api/message');a.check(list.status,200,'Lista wiadomości');
    const own=list.body.messages.filter((x:any)=>x.name===name&&x.subject===payload.subject);a.check(own.length,1,'Jednoznaczna identyfikacja własnego rekordu');id=own[0].id;
    const read=await a.call('GET',`/api/message/${id}`,undefined,headers);a.check(read.status,200,'Odczyt utworzonej wiadomości');a.check(read.body.description,payload.description,'Opis zachowany');a.check(read.body.email,payload.email,'Email zachowany');
    const update=await a.call('PUT',`/api/message/${id}`,undefined,headers);a.check(update.status,200,'Oznaczenie read: HTTP 200');
    const after=await a.call('GET','/api/message');a.check(after.body.messages.find((x:any)=>x.id===id)?.read,true,'Zmiana read utrwalona');
  }finally{
    if(!id){const l=await a.call('GET','/api/message');id=l.body.messages?.find((x:any)=>x.name===name)?.id}
    if(id){const d=await a.call('DELETE',`/api/message/${id}`,undefined,headers);a.checkSoft(d.status,200,'Sprzątanie własnej wiadomości');const l=await a.call('GET','/api/message');a.checkSoft(l.body.messages.some((x:any)=>x.id===id),false,'Wiadomość usunięta')}
  }
});
test('API-10 Rezerwacja: utwórz, odczytaj i zmień nazwisko',async({audit:a})=>{
  const headers=await login(a);const room=await availableRoom(a);const dates=futureDates();
  // Unikalny termin wybrany z aktualnego stanu, bez ponawiania zapisu w razie konfliktu.
  const existing=await a.call('GET',`/api/booking?roomid=${room.roomid}`,undefined,headers);a.check(existing.status,200,'Pobrano aktualne rezerwacje');
  const bookings=existing.body.bookings||existing.body;
  let free=false;
  for(let day=0;day<120;day++){
    if(!bookings.some((b:any)=>b.bookingdates.checkin<dates.checkout&&b.bookingdates.checkout>dates.checkin)){free=true;break}
    for(const key of ['checkin','checkout'] as const){const d=new Date(dates[key]);d.setUTCDate(d.getUTCDate()+3);dates[key]=d.toISOString().slice(0,10)}
  }
  test.skip(!free,'BLOCKED: nie znaleziono wolnego terminu na podstawie aktualnego stanu.');
  const firstname=`QA${Date.now().toString().slice(-9)}`;
  const payload={roomid:room.roomid,firstname,lastname:'ProjektTestowy',depositpaid:false,bookingdates:dates,email:'qa-project@example.test',phone:'12345678901'};let id:number|undefined;
  try{
    const created=await a.call('POST','/api/booking',payload);a.check(created.status,201,'Utworzenie rezerwacji HTTP 201');
    const list=await a.call('GET',`/api/booking?roomid=${room.roomid}`,undefined,headers);const own=(list.body.bookings||list.body).filter((x:any)=>x.firstname===firstname);a.check(own.length,1,'Własna rezerwacja rozpoznana dynamicznie');id=own[0].bookingid;
    const read=await a.call('GET',`/api/booking/${id}`,undefined,headers);a.check(read.status,200,'Odczyt HTTP 200');a.check(read.body.bookingdates,dates,'Daty bez zmiany');
    const updated={...payload,lastname:'ZmienioneNazwisko'};const put=await a.call('PUT',`/api/booking/${id}`,updated,headers);a.check(put.status,200,'PUT HTTP 200');
    const after=await a.call('GET',`/api/booking/${id}`,undefined,headers);a.check(after.body.lastname,updated.lastname,'Nowe nazwisko utrwalone');
  }finally{
    if(!id){const list=await a.call('GET',`/api/booking?roomid=${room.roomid}`,undefined,headers);id=(list.body.bookings||list.body).find((x:any)=>x.firstname===firstname)?.bookingid}
    if(id){const d=await a.call('DELETE',`/api/booking/${id}`,undefined,headers);a.checkSoft(d.status,200,'Usunięto wyłącznie własną rezerwację');const list=await a.call('GET',`/api/booking?roomid=${room.roomid}`,undefined,headers);a.checkSoft((list.body.bookings||list.body).some((x:any)=>x.bookingid===id),false,'Potwierdzono sprzątanie')}
  }
});
