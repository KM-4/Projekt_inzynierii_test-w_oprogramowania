import { test, expect } from '../pages';
import { cleanupUiMessage, evidenceRoot } from '../helpers/audit';
import { buildMessage, uniqueMarker, futureStay } from '../api';
import path from 'node:path';

// Testy UI w modelu Page Object Model (05_Automation/pages): test opisuje scenariusz,
// a lokatory i akcje na stronach są w klasach HomePage, ContactForm, ReservationPage, AdminLoginPage.
// Każdy test zapisuje screeny kroków (a.step) w evidence/ui/<ID>/krok-NN.png.
test.afterEach(async ({ page, audit: a }, info) => {
  const id = info.title.match(/UI-\d+/)?.[0];
  if (page.isClosed() || !id) return;
  a.note({ url: page.url(), visibleText: await page.locator('body').innerText().catch(() => '(strona zamknięta)') });
  const file = path.join(evidenceRoot, 'ui', `${id}.png`);
  await page.screenshot({ path: file, fullPage: true });
  await info.attach('Pełny zrzut strony', { path: file, contentType: 'image/png' });
});

// Preflight rezerwacji: bez działających szczegółów pokoju kroki rezerwacji są niewykonalne -> BLOCKED (DEF-01).
async function openReservation(page: any, reservation: any, api: any, a: any, info: any) {
  const room = await api.rooms.firstListed();
  const dates = futureStay();
  const r = await api.rooms.get(room.roomid);
  await reservation.open(room.roomid, dates.checkin, dates.checkout);
  if (r.status !== 200) {
    await a.step(page, `Strona rezerwacji pokoju ${room.roomid}: brak formularza (GET /api/room/${room.roomid} → ${r.status})`);
    info.annotations.push({ type: 'blocked', description: `Szczegóły pokoju HTTP ${r.status}; DEF-01. Brak formularza rezerwacji.` });
    a.note({ blockedBy: 'DEF-01', detailStatus: r.status, roomid: room.roomid, dates });
    test.skip(true, `BLOCKED: szczegóły pokoju HTTP ${r.status}; DEF-01`);
  }
  await expect(reservation.reserveButton).toBeVisible();
  await a.step(page, 'Strona rezerwacji z formularzem', [reservation.reserveButton]);
  return { room, dates };
}

// UI-01 | R-02 | porównanie UI z API | katalog pokoi
test('UI-01 Katalog pokoi zgodny z API', async ({ page, audit: a, api, home }) => {
  const r = await api.rooms.list();
  a.check(r.status, 200, 'Katalog API HTTP 200');
  await home.open();
  for (const room of r.body.rooms) {
    await expect(home.roomHeading(room.type)).toBeVisible();
    await expect(home.roomPrice(room.roomPrice)).toBeVisible();
    await expect(home.bookLink(room.roomid)).toBeVisible();
  }
  await a.step(page, 'Katalog: typy, ceny i linki zgodne z GET /api/room', [home.roomsHeading, ...r.body.rooms.map((room: any) => home.bookLink(room.roomid))]);
  a.note('Nazwy typów, ceny i linki rezerwacji odpowiadają bieżącej liście API.');
});

// UI-02 | R-03, R-06 | EP poprawne dane, DT reguła 1 | formularz kontaktowy
test('UI-02 Poprawna wiadomość kontaktowa', async ({ page, audit: a, home, contactForm }) => {
  // Sprzątanie po teście jest informacyjne (helpers/audit.ts: cleanupUiMessage) i nie decyduje o werdykcie.
  await home.open();
  const name = uniqueMarker();
  try {
    await contactForm.fill(buildMessage(name));
    await a.step(page, 'Formularz wypełniony poprawnymi danymi', contactForm.allFields);
    const r = await contactForm.submit(a);
    a.check(r.status, 200, 'POST kontakt HTTP 200');
    await expect(contactForm.confirmation(name)).toBeVisible();
    await a.step(page, 'Potwierdzenie wysłania z własnym imieniem (HTTP 200)', [contactForm.confirmation(name)]);
  } finally {
    await cleanupUiMessage(a, name);
  }
});

// UI-03 | R-03 | EP brak wymaganych danych | formularz kontaktowy
test('UI-03 Pusty formularz kontaktowy', async ({ page, audit: a, home, contactForm }) => {
  await home.open();
  await a.step(page, 'Pusty formularz przed wysłaniem', contactForm.allFields);
  const r = await contactForm.submit(a);
  a.check(r.status, 400, 'Brak wymaganych pól HTTP 400');
  await expect(contactForm.errorText('Name may not be blank')).toBeVisible();
  await expect(contactForm.name).toBeVisible();
  await a.step(page, 'Komunikaty wymaganych pól (HTTP 400) pod formularzem', [contactForm.submitButton, contactForm.errors]);
});

// UI-04 | R-03 | EP zły format, DT reguły 3 i 4 | formularz kontaktowy
test('UI-04 Niepoprawny email w kontakcie', async ({ page, audit: a, home, contactForm }) => {
  await home.open();
  await contactForm.fill(buildMessage(uniqueMarker(), { email: 'bledny-email' }));
  await a.step(page, 'Email w złym formacie: „bledny-email”', [contactForm.email]);
  const r = await contactForm.submit(a);
  a.check(r.status, 400, 'Niepoprawny email odrzucony przez API');
  await expect(contactForm.errors).toContainText(/email/i);
  await expect(contactForm.email).toHaveValue('bledny-email');
  await a.step(page, 'Reguła 3: błędny email odrzucony (HTTP 400)', [contactForm.email, contactForm.errors]);
  await contactForm.subject.fill('ABCD');
  const both = await contactForm.submit(a);
  a.check(both.status, 400, 'Błędny email i temat odrzucone');
  await expect(contactForm.errors).toContainText('Subject must be between 5 and 100 characters.');
  await expect(contactForm.errors).toContainText(/email/i);
  await a.step(page, 'Reguła 4: błędny email i temat „ABCD” – oba komunikaty', [contactForm.subject, contactForm.errors]);
});

// UI-05 | R-03 | BVA min−1, DT reguła 2 | temat 4 znaki
test('UI-05 Temat 4 znaki: poniżej minimum', async ({ page, audit: a, home, contactForm }) => {
  await home.open();
  await contactForm.fill(buildMessage(uniqueMarker(), { subject: 'ABCD' }));
  await a.step(page, 'Temat „ABCD” (4 znaki, min. 5), pozostałe pola poprawne', [contactForm.subject]);
  const r = await contactForm.submit(a);
  a.check(r.status, 400, 'Temat 4 znaki odrzucony');
  await expect(contactForm.errorText('Subject must be between 5 and 100 characters.')).toBeVisible();
  await a.step(page, 'Odrzucenie (HTTP 400): „Subject must be between 5 and 100 characters.”', [contactForm.subject, contactForm.errors]);
});

// UI-06 | R-03, R-06 | BVA min | temat 5 znaków
test('UI-06 Temat 5 znaków: dolna granica', async ({ page, audit: a, home, contactForm }) => {
  // Sprzątanie po teście jest informacyjne i nie decyduje o werdykcie.
  await home.open();
  const name = uniqueMarker();
  try {
    await contactForm.fill(buildMessage(name, { subject: 'ABCDE' }));
    await a.step(page, 'Temat „ABCDE” (5 znaków – dolna granica)', [contactForm.subject]);
    const r = await contactForm.submit(a);
    a.check(r.status, 200, 'Temat 5 znaków przyjęty');
    await expect(contactForm.confirmation(name)).toBeVisible();
    await a.step(page, 'Wiadomość przyjęta (HTTP 200), potwierdzenie widoczne', [contactForm.confirmation(name)]);
  } finally {
    await cleanupUiMessage(a, name);
  }
});

// UI-07 | R-03 | BVA min−1 | telefon 10 znaków
test('UI-07 Telefon 10 znaków: poniżej minimum', async ({ page, audit: a, home, contactForm }) => {
  await home.open();
  await contactForm.fill(buildMessage(uniqueMarker(), { phone: '1234567890' }));
  await a.step(page, 'Telefon „1234567890” (10 znaków, min. 11)', [contactForm.phone]);
  const r = await contactForm.submit(a);
  a.check(r.status, 400, 'Telefon 10 znaków odrzucony');
  await expect(contactForm.errorText('Phone must be between 11 and 21 characters.')).toBeVisible();
  await a.step(page, 'Odrzucenie (HTTP 400): „Phone must be between 11 and 21 characters.”', [contactForm.phone, contactForm.errors]);
});

// UI-08 | R-01, R-05 | reguła biznesowa: cena dwóch nocy
test('UI-08 Cena rezerwacji dwóch nocy', async ({ page, audit: a, api, reservation }, info) => {
  const { room } = await openReservation(page, reservation, api, a, info);
  await expect(reservation.priceLine(room.roomPrice, 2)).toBeVisible();
  await expect(reservation.total(room.roomPrice * 2 + 40)).toBeVisible();
  await a.step(page, 'Podsumowanie ceny: 2 noce + opłaty', [reservation.priceLine(room.roomPrice, 2), reservation.total(room.roomPrice * 2 + 40)]);
  a.note('Cena noclegu razy dwie noce plus widoczne opłaty 25 i 15 GBP.');
});

// UI-09 | R-01, R-03 | EP puste dane obowiązkowe gościa
test('UI-09 Puste dane gościa w rezerwacji', async ({ page, audit: a, api, reservation }, info) => {
  await openReservation(page, reservation, api, a, info);
  await reservation.reserveButton.click();
  const r = await reservation.submitBooking();
  const body = await r.json();
  a.calls.push({ request: { method: 'POST', url: r.url(), body: r.request().postDataJSON() }, response: { status: r.status(), body } });
  a.check(r.status(), 400, 'Puste dane gościa HTTP 400');
  await expect(reservation.alerts.filter({ hasText: 'Firstname' })).toBeVisible();
  await a.step(page, 'Komunikaty o brakujących danych gościa (HTTP 400)', [reservation.alerts]);
});

// UI-10 | R-01, R-05 | spójność danych UI → request (POST przerwany przed zapisem)
test('UI-10 Rezerwacja zachowuje wybrane daty', async ({ page, audit: a, api, reservation }, info) => {
  // Przypadek jest bezpiecznym sprawdzeniem payloadu przed zapisem. Finalne utworzenie pokrywa API-10.
  const { dates } = await openReservation(page, reservation, api, a, info);
  await reservation.reserveButton.click();
  await reservation.fillGuest({ Firstname: 'QATester', Lastname: 'ProjektTestowy', Email: 'qa-project@example.test', Phone: '12345678901' });
  let sent: any;
  await page.route('**/api/booking', async (route) => {
    if (route.request().method() === 'POST') { sent = route.request().postDataJSON(); await route.abort('blockedbyclient'); }
    else await route.continue();
  });
  const pending = page.waitForRequest((r) => r.url().endsWith('/api/booking') && r.method() === 'POST');
  await reservation.reserveButton.click();
  await pending;
  a.note({ mode: 'Kontrola payloadu UI. POST przerwany przed serwerem, bez deklaracji pełnego E2E.', sent });
  a.check(sent.bookingdates, dates, 'Daty wysyłane zgodne z wyborem użytkownika');
});

// UI-11 | R-04 | EP niepoprawne dane logowania | panel administratora
test('UI-11 Błędne logowanie administratora', async ({ page, audit: a, adminLogin }) => {
  await adminLogin.open();
  await adminLogin.fill(uniqueMarker(), 'nieprawidlowe-dane-testowe');
  await a.step(page, 'Logowanie z niepoprawnymi danymi', [adminLogin.username, adminLogin.password, adminLogin.loginButton]);
  const r = await adminLogin.submit();
  a.check(r.status(), 401, 'Błędne logowanie HTTP 401');
  await expect(adminLogin.error).toBeVisible();
  await expect(adminLogin.username).toBeVisible();
  await a.step(page, 'Odmowa dostępu (HTTP 401): „Invalid credentials”, brak panelu', [adminLogin.error, adminLogin.username, adminLogin.loginButton]);
});

// UI-12 | R-01, R-05 | spójność parametrów i odpowiedzi | wyszukiwanie dostępności
test('UI-12 Wyszukanie dostępności dla poprawnego okresu', async ({ page, audit: a, home }) => {
  await home.open();
  const dates = futureStay();
  await home.setDates(dates.checkin, dates.checkout);
  await a.step(page, `Wybrany okres ${dates.checkin} – ${dates.checkout}`, [home.dateInputs, home.checkAvailabilityButton]);
  const r = await home.checkAvailability();
  a.check(r.status(), 200, 'Dostępność HTTP 200');
  const body = await r.json();
  const url = new URL(r.url());
  a.note({ requestUrl: r.url(), response: body });
  a.check(url.searchParams.get('checkin'), dates.checkin, 'Wybrany checkin wysłany');
  a.check(url.searchParams.get('checkout'), dates.checkout, 'Wybrany checkout wysłany');
  for (const room of body.rooms) await expect(home.bookLink(room.roomid)).toBeVisible();
  await a.step(page, 'Wyniki: dostępne pokoje z linkami rezerwacji dla wybranych dat', [home.roomsHeading, ...body.rooms.map((room: any) => home.bookLink(room.roomid))]);
});
