import { test, contact, marker, login, firstListedRoom, futureDates } from '../helpers/audit';

// Konwencja: a.check = twarda asercja (przerywa test), a.checkSoft = asercja miękka
// (rejestrowana w evidence, test biegnie dalej, ale kończy się FAIL). Miękkie asercje
// stosujemy tam, gdzie chcemy wykonać kolejne kroki sekwencji mimo wcześniejszej niezgodności.

// API-01 | R-02 | walidacja kontraktu | GET /api/room
test('API-01 Lista pokoi: schemat i unikalne identyfikatory', async ({ audit: a }) => {
  const r = await a.call('GET', '/api/room');
  a.check(r.status, 200, 'HTTP 200');
  a.check(Array.isArray(r.body.rooms), true, 'rooms jest tablicą');
  a.check(r.body.rooms.length > 0, true, 'Katalog niepusty');
  const ids = r.body.rooms.map((x: any) => x.roomid);
  a.check(new Set(ids).size, ids.length, 'Unikalne ID');
  for (const room of r.body.rooms) {
    a.check(typeof room.roomid, 'number', 'roomid jest liczbą');
    a.check(typeof room.roomName, 'string', 'roomName jest tekstem');
    a.check(typeof room.type, 'string', 'Typ pokoju jest tekstem');
    a.check(typeof room.accessible, 'boolean', 'accessible jest wartością logiczną');
    a.check(Array.isArray(room.features), true, 'features jest tablicą');
    a.check(typeof room.roomPrice, 'number', 'Cena jest liczbą');
    a.check(room.roomPrice > 0, true, 'Cena dodatnia');
  }
});

// API-02 | R-01, R-02 | spójność listy i szczegółów | GET /api/room/{id}
test('API-02 Szczegóły pokoju zgodne z listą', async ({ audit: a }) => {
  const room = await firstListedRoom(a);
  const r = await a.call('GET', `/api/room/${room.roomid}`);
  a.check(r.status, 200, 'Istniejący pokój: HTTP 200');
  a.check(r.body.roomid, room.roomid, 'ID zgodny z listą');
  a.check(r.body.roomPrice, room.roomPrice, 'Cena zgodna z listą');
  a.check(r.body.type, room.type, 'Typ zgodny z listą');
});

// API-03 | R-02 | EP: zasób nieistniejący | GET /api/room/{id spoza listy}
test('API-03 Nieistniejący pokój: HTTP 404', async ({ audit: a }) => {
  const list = await a.call('GET', '/api/room');
  a.check(list.status, 200, 'Odczyt ID');
  const id = Math.max(...list.body.rooms.map((x: any) => x.roomid)) + 100000;
  a.note({ missingId: id, basis: 'ID poza aktualną listą; brak zapisu do SUT' });
  const r = await a.call('GET', `/api/room/${id}`);
  a.check(r.status, 404, 'Brak zasobu: HTTP 404');
});

// API-04 | R-03 | EP: brak wymaganych pól | POST /api/message
test('API-04 Wiadomość bez wymaganych pól', async ({ audit: a }) => {
  const r = await a.call('POST', '/api/message', {});
  a.check(r.status, 400, 'Brak pól: HTTP 400');
  a.check(Array.isArray(r.body), true, 'Tablica walidacji');
  for (const field of ['Name', 'Email', 'Phone', 'Subject', 'Message']) {
    a.check(r.body.includes(`${field} must be set`), true, `Błąd wymaganego pola ${field}`);
  }
});

// Wspólny krok API-05/06: odrzucony payload nie może pojawić się na publicznej liście wiadomości.
async function assertNotStored(a: any, name: string) {
  const list = await a.call('GET', '/api/message');
  a.check(list.status, 200, 'Lista wiadomości');
  a.check(list.body.messages.some((x: any) => x.name === name), false, 'Odrzucony rekord nie został zapisany');
}

// API-05 | R-03 | EP: niepoprawny format | POST /api/message
test('API-05 Niepoprawny format email wiadomości', async ({ audit: a }) => {
  const name = marker();
  const r = await a.call('POST', '/api/message', contact(name, { email: 'nie-jest-mailem' }));
  a.check(r.status, 400, 'Błędny email: HTTP 400');
  a.check(r.body.includes('must be a well-formed email address'), true, 'Komunikat walidacji email');
  await assertNotStored(a, name);
});

// API-06 | R-03 | EP: błędny typ danych | POST /api/message
test('API-06 Email jako obiekt zamiast tekstu', async ({ audit: a }) => {
  const name = marker();
  const r = await a.call('POST', '/api/message', contact(name, { email: { value: 'qa@example.test' } }));
  a.checkSoft(r.status, 400, 'Błędny typ: HTTP 400');
  await assertNotStored(a, name);
});

// API-07 | R-04 | EP: brak uwierzytelnienia | GET /api/booking?roomid=
test('API-07 Rezerwacje bez uwierzytelnienia', async ({ audit: a }) => {
  const room = await firstListedRoom(a);
  const r = await a.call('GET', `/api/booking?roomid=${room.roomid}`);
  a.check(r.status, 401, 'Brak tokenu: HTTP 401');
  a.check(r.body.error, 'Authentication required', 'Komunikat autoryzacji');
});

// API-08 | R-04 | EP: niepoprawne dane logowania | POST /api/auth/login
test('API-08 Nieprawidłowe dane logowania', async ({ audit: a }) => {
  const r = await a.call('POST', '/api/auth/login', { username: marker(), password: 'nieprawidlowe-dane-testowe' });
  a.check(r.status, 401, 'Odrzucenie logowania: HTTP 401');
  a.check(r.body.error, 'Invalid credentials', 'Komunikat błędu');
  a.check('token' in r.body, false, 'Brak tokenu');
});

// API-09 | R-03, R-04, R-06 | test przejść stanu | POST, GET, PUT, DELETE /api/message
// Utwórz -> znajdź na liście -> odczytaj -> oznacz jako przeczytaną (PUT) -> potwierdź na liście -> posprzątaj.
// Odczyt po ID jest miękki, aby krok PUT i jego potwierdzenie zostały wykonane niezależnie od wyniku odczytu.
test('API-09 Wiadomość: utwórz, odczytaj, oznacz przeczytaną', async ({ audit: a }) => {
  const headers = await login(a);
  const name = marker();
  const payload = contact(name);
  let id: number | undefined;
  try {
    const created = await a.call('POST', '/api/message', payload);
    a.check(created.status, 200, 'Proxy POST message: HTTP 200');
    a.check(created.body.success, true, 'Potwierdzenie utworzenia');

    const list = await a.call('GET', '/api/message');
    a.check(list.status, 200, 'Lista wiadomości');
    const own = list.body.messages.filter((x: any) => x.name === name && x.subject === payload.subject);
    a.check(own.length, 1, 'Jednoznaczna identyfikacja własnego rekordu');
    id = own[0].id;

    const read = await a.call('GET', `/api/message/${id}`, undefined, headers);
    a.checkSoft(read.status, 200, 'Odczyt utworzonej wiadomości');
    if (read.status === 200) {
      a.checkSoft(read.body.description, payload.description, 'Opis zachowany');
      a.checkSoft(read.body.email, payload.email, 'Email zachowany');
    }

    const update = await a.call('PUT', `/api/message/${id}`, undefined, headers);
    a.checkSoft(update.status, 200, 'Oznaczenie read: HTTP 200');

    const after = await a.call('GET', '/api/message');
    a.check(after.body.messages.find((x: any) => x.id === id)?.read, true, 'Zmiana read utrwalona (potwierdzenie z listy)');
  } finally {
    if (!id) {
      const l = await a.call('GET', '/api/message');
      id = l.body.messages?.find((x: any) => x.name === name)?.id;
    }
    if (id) {
      const d = await a.call('DELETE', `/api/message/${id}`, undefined, headers);
      a.checkSoft(d.status, 200, 'Sprzątanie własnej wiadomości');
      const l = await a.call('GET', '/api/message');
      a.checkSoft(l.body.messages.some((x: any) => x.id === id), false, 'Wiadomość usunięta');
    }
  }
});

// API-10 | R-01, R-04, R-06 | test przejść stanu | POST, GET, PUT, DELETE /api/booking
// Wolny termin wybierany z aktualnego stanu -> utwórz (jak gość) -> znajdź na liście -> odczytaj ->
// zmień nazwisko (PUT) -> potwierdź na liście -> posprzątaj. Odczyt po ID miękki, aby PUT został wykonany.
test('API-10 Rezerwacja: utwórz, odczytaj i zmień nazwisko', async ({ audit: a }) => {
  const headers = await login(a);
  const room = await firstListedRoom(a);
  const dates = futureDates();
  const ownBookings = (body: any) => body.bookings || body;

  // Unikalny termin wybrany z aktualnego stanu, bez ponawiania zapisu w razie konfliktu.
  const existing = await a.call('GET', `/api/booking?roomid=${room.roomid}`, undefined, headers);
  a.check(existing.status, 200, 'Pobrano aktualne rezerwacje');
  const bookings = ownBookings(existing.body);
  let free = false;
  for (let day = 0; day < 120; day++) {
    const overlaps = bookings.some((b: any) => b.bookingdates.checkin < dates.checkout && b.bookingdates.checkout > dates.checkin);
    if (!overlaps) { free = true; break; }
    for (const key of ['checkin', 'checkout'] as const) {
      const d = new Date(dates[key]);
      d.setUTCDate(d.getUTCDate() + 3);
      dates[key] = d.toISOString().slice(0, 10);
    }
  }
  test.skip(!free, 'BLOCKED: nie znaleziono wolnego terminu na podstawie aktualnego stanu.');

  const firstname = `QA${Date.now().toString().slice(-9)}`;
  const payload = {
    roomid: room.roomid, firstname, lastname: 'ProjektTestowy', depositpaid: false,
    bookingdates: dates, email: 'qa-project@example.test', phone: '12345678901',
  };
  let id: number | undefined;
  try {
    const created = await a.call('POST', '/api/booking', payload);
    a.check(created.status, 201, 'Utworzenie rezerwacji HTTP 201');

    const list = await a.call('GET', `/api/booking?roomid=${room.roomid}`, undefined, headers);
    const own = ownBookings(list.body).filter((x: any) => x.firstname === firstname);
    a.check(own.length, 1, 'Własna rezerwacja rozpoznana dynamicznie');
    id = own[0].bookingid;
    a.check(own[0].bookingdates, dates, 'Daty na liście bez zmian');

    const read = await a.call('GET', `/api/booking/${id}`, undefined, headers);
    a.checkSoft(read.status, 200, 'Odczyt HTTP 200');
    if (read.status === 200) a.checkSoft(read.body.bookingdates, dates, 'Daty bez zmiany');

    const updated = { ...payload, lastname: 'ZmienioneNazwisko' };
    const put = await a.call('PUT', `/api/booking/${id}`, updated, headers);
    a.checkSoft(put.status, 200, 'PUT HTTP 200');

    const after = await a.call('GET', `/api/booking?roomid=${room.roomid}`, undefined, headers);
    const mine = ownBookings(after.body).find((x: any) => x.bookingid === id);
    a.check(mine?.lastname, updated.lastname, 'Nowe nazwisko utrwalone (potwierdzenie z listy)');
  } finally {
    if (!id) {
      const list = await a.call('GET', `/api/booking?roomid=${room.roomid}`, undefined, headers);
      id = ownBookings(list.body).find((x: any) => x.firstname === firstname)?.bookingid;
    }
    if (id) {
      const d = await a.call('DELETE', `/api/booking/${id}`, undefined, headers);
      a.checkSoft(d.status, 200, 'Usunięto wyłącznie własną rezerwację');
      const list = await a.call('GET', `/api/booking?roomid=${room.roomid}`, undefined, headers);
      a.checkSoft(ownBookings(list.body).some((x: any) => x.bookingid === id), false, 'Potwierdzono sprzątanie');
    }
  }
});
