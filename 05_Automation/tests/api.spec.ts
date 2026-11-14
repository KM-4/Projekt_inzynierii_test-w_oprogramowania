import { test, BookingClient, buildMessage, buildBooking, uniqueMarker, futureStay, findFreeStay } from '../api';

// Testy API: scenariusz i jawne asercje. Wywołania HTTP wykonują klienci z 05_Automation/api/clients
// (każde wywołanie trafia do evidence), dane testowe tworzą buildery z 05_Automation/api/data.
// a.check = asercja twarda (przerywa test); a.checkSoft = asercja miękka (zapisana, test biegnie dalej
// i kończy się FAIL) – stosowana tam, gdzie kolejne kroki sekwencji mają się wykonać mimo niezgodności.

// API-01 | R-02 | walidacja kontraktu | GET /api/room
test('API-01 Lista pokoi: schemat i unikalne identyfikatory', async ({ audit: a, api }) => {
  const r = await api.rooms.list();
  a.check(r.status, 200, 'HTTP 200');
  a.check(Array.isArray(r.body.rooms), true, 'rooms jest tablicą');
  a.check(r.body.rooms.length > 0, true, 'Katalog niepusty');
  const ids = r.body.rooms.map((x) => x.roomid);
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
test('API-02 Szczegóły pokoju zgodne z listą', async ({ audit: a, api }) => {
  const room = await api.rooms.firstListed();
  const r = await api.rooms.get(room.roomid);
  a.check(r.status, 200, 'Istniejący pokój: HTTP 200');
  a.check(r.body.roomid, room.roomid, 'ID zgodny z listą');
  a.check(r.body.roomPrice, room.roomPrice, 'Cena zgodna z listą');
  a.check(r.body.type, room.type, 'Typ zgodny z listą');
});

// API-03 | R-02 | EP: zasób nieistniejący | GET /api/room/{id spoza listy}
test('API-03 Nieistniejący pokój: HTTP 404', async ({ audit: a, api }) => {
  const list = await api.rooms.list();
  a.check(list.status, 200, 'Odczyt ID');
  const missingId = Math.max(...list.body.rooms.map((x) => x.roomid)) + 100000;
  a.note({ missingId, basis: 'ID poza aktualną listą; brak zapisu do SUT' });
  const r = await api.rooms.get(missingId);
  a.check(r.status, 404, 'Brak zasobu: HTTP 404');
});

// API-04 | R-03 | EP: brak wymaganych pól | POST /api/message
test('API-04 Wiadomość bez wymaganych pól', async ({ audit: a, api }) => {
  const r = await api.messages.create({});
  a.check(r.status, 400, 'Brak pól: HTTP 400');
  a.check(Array.isArray(r.body), true, 'Tablica walidacji');
  for (const field of ['Name', 'Email', 'Phone', 'Subject', 'Message']) {
    a.check(r.body.includes(`${field} must be set`), true, `Błąd wymaganego pola ${field}`);
  }
});

// API-05 | R-03 | EP: niepoprawny format | POST /api/message
test('API-05 Niepoprawny format email wiadomości', async ({ audit: a, api }) => {
  const name = uniqueMarker();
  const r = await api.messages.create(buildMessage(name, { email: 'nie-jest-mailem' }));
  a.check(r.status, 400, 'Błędny email: HTTP 400');
  a.check(r.body.includes('must be a well-formed email address'), true, 'Komunikat walidacji email');
  const list = await api.messages.list();
  a.check(list.status, 200, 'Lista wiadomości');
  a.check(list.body.messages.some((x) => x.name === name), false, 'Odrzucony rekord nie został zapisany');
});

// API-06 | R-03 | EP: błędny typ danych | POST /api/message
test('API-06 Email jako obiekt zamiast tekstu', async ({ audit: a, api }) => {
  const name = uniqueMarker();
  const r = await api.messages.create(buildMessage(name, { email: { value: 'qa@example.test' } }));
  a.checkSoft(r.status, 400, 'Błędny typ: HTTP 400');
  const list = await api.messages.list();
  a.check(list.status, 200, 'Lista wiadomości');
  a.check(list.body.messages.some((x) => x.name === name), false, 'Odrzucony rekord nie został zapisany');
});

// API-07 | R-04 | EP: brak uwierzytelnienia | GET /api/booking?roomid=
test('API-07 Rezerwacje bez uwierzytelnienia', async ({ audit: a, api }) => {
  const room = await api.rooms.firstListed();
  const r = await api.bookings.listForRoom(room.roomid);
  a.check(r.status, 401, 'Brak tokenu: HTTP 401');
  a.check(r.body.error, 'Authentication required', 'Komunikat autoryzacji');
});

// API-08 | R-04 | EP: niepoprawne dane logowania | POST /api/auth/login
test('API-08 Nieprawidłowe dane logowania', async ({ audit: a, api }) => {
  const r = await api.auth.login(uniqueMarker(), 'nieprawidlowe-dane-testowe');
  a.check(r.status, 401, 'Odrzucenie logowania: HTTP 401');
  a.check(r.body.error, 'Invalid credentials', 'Komunikat błędu');
  a.check('token' in r.body, false, 'Brak tokenu');
});

// API-09 | R-03, R-04, R-06 | test przejść stanu | POST, GET, PUT, DELETE /api/message
// Utwórz -> znajdź na liście -> odczytaj -> oznacz jako przeczytaną (PUT) -> potwierdź na liście -> posprzątaj.
test('API-09 Wiadomość: utwórz, odczytaj, oznacz przeczytaną', async ({ audit: a, api }) => {
  const session = await api.auth.loginAsAdmin();
  const payload = buildMessage();
  let id: number | undefined;
  try {
    const created = await api.messages.create(payload);
    a.check(created.status, 200, 'Proxy POST message: HTTP 200');
    a.check(created.body.success, true, 'Potwierdzenie utworzenia');

    const list = await api.messages.list();
    a.check(list.status, 200, 'Lista wiadomości');
    const own = list.body.messages.filter((x) => x.name === payload.name && x.subject === payload.subject);
    a.check(own.length, 1, 'Jednoznaczna identyfikacja własnego rekordu');
    id = own[0].id;

    const read = await api.messages.get(id, session);
    a.checkSoft(read.status, 200, 'Odczyt utworzonej wiadomości');
    if (read.status === 200) {
      a.checkSoft(read.body.description, payload.description, 'Opis zachowany');
      a.checkSoft(read.body.email, payload.email, 'Email zachowany');
    }

    const update = await api.messages.markRead(id, session);
    a.checkSoft(update.status, 200, 'Oznaczenie read: HTTP 200');

    const after = await api.messages.list();
    a.check(after.body.messages.find((x) => x.id === id)?.read, true, 'Zmiana read utrwalona (potwierdzenie z listy)');
  } finally {
    id ??= (await api.messages.findByName(payload.name))[0]?.id;
    if (id) {
      const d = await api.messages.delete(id, session);
      a.checkSoft(d.status, 200, 'Sprzątanie własnej wiadomości');
      const l = await api.messages.list();
      a.checkSoft(l.body.messages.some((x) => x.id === id), false, 'Wiadomość usunięta');
    }
  }
});

// API-10 | R-01, R-04, R-06 | test przejść stanu | POST, GET, PUT, DELETE /api/booking
// Wolny termin z aktualnego stanu -> utwórz (jak gość) -> znajdź na liście -> odczytaj -> zmień nazwisko (PUT)
// -> potwierdź na liście -> posprzątaj.
test('API-10 Rezerwacja: utwórz, odczytaj i zmień nazwisko', async ({ audit: a, api }) => {
  const session = await api.auth.loginAsAdmin();
  const room = await api.rooms.firstListed();

  const existing = await api.bookings.listForRoom(room.roomid, session);
  a.check(existing.status, 200, 'Pobrano aktualne rezerwacje');
  const dates = findFreeStay(BookingClient.bookingsOf(existing.body), futureStay());
  test.skip(!dates, 'BLOCKED: nie znaleziono wolnego terminu na podstawie aktualnego stanu.');

  const payload = buildBooking(room.roomid, dates!);
  let id: number | undefined;
  try {
    const created = await api.bookings.create(payload);
    a.check(created.status, 201, 'Utworzenie rezerwacji HTTP 201');

    const list = await api.bookings.listForRoom(room.roomid, session);
    const own = BookingClient.bookingsOf(list.body).filter((x) => x.firstname === payload.firstname);
    a.check(own.length, 1, 'Własna rezerwacja rozpoznana dynamicznie');
    id = own[0].bookingid;
    a.check(own[0].bookingdates, dates, 'Daty na liście bez zmian');

    const read = await api.bookings.get(id, session);
    a.checkSoft(read.status, 200, 'Odczyt HTTP 200');
    if (read.status === 200) a.checkSoft(read.body.bookingdates, dates, 'Daty bez zmiany');

    const updated = { ...payload, lastname: 'ZmienioneNazwisko' };
    const put = await api.bookings.update(id, updated, session);
    a.checkSoft(put.status, 200, 'PUT HTTP 200');

    const after = await api.bookings.listForRoom(room.roomid, session);
    const mine = BookingClient.bookingsOf(after.body).find((x) => x.bookingid === id);
    a.check(mine?.lastname, updated.lastname, 'Nowe nazwisko utrwalone (potwierdzenie z listy)');
  } finally {
    if (!id) {
      const list = await api.bookings.listForRoom(room.roomid, session);
      id = BookingClient.bookingsOf(list.body).find((x) => x.firstname === payload.firstname)?.bookingid;
    }
    if (id) {
      const d = await api.bookings.delete(id, session);
      a.checkSoft(d.status, 200, 'Usunięto wyłącznie własną rezerwację');
      const list = await api.bookings.listForRoom(room.roomid, session);
      a.checkSoft(BookingClient.bookingsOf(list.body).some((x) => x.bookingid === id), false, 'Potwierdzono sprzątanie');
    }
  }
});
