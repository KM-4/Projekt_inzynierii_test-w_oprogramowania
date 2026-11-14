import { test, expect, marker, contact, firstListedRoom, futureDates, cleanupUiMessage, evidenceRoot } from '../helpers/audit';
import path from 'node:path';

// Każdy test UI zapisuje screeny kroków (a.step: wycinek wskazanych elementów) w evidence/ui/<ID>/krok-NN.png.
// Pełny zrzut strony po teście (evidence/ui/<ID>.png) zostaje jako materiał pomocniczy.
test.afterEach(async ({ page, audit: a }, info) => {
  const id = info.title.match(/UI-\d+/)?.[0];
  if (page.isClosed() || !id) return;
  a.note({ url: page.url(), visibleText: await page.locator('body').innerText().catch(() => '(strona zamknięta)') });
  const file = path.join(evidenceRoot, 'ui', `${id}.png`);
  await page.screenshot({ path: file, fullPage: true });
  await info.attach('Pełny zrzut strony', { path: file, contentType: 'image/png' });
});

// --- Kroki pomocnicze ---
const FIELDS = ['name', 'email', 'phone', 'subject', 'description'];
const formFields = (page: any) => FIELDS.map((f) => page.locator(`#${f}`));
const submitBtn = (page: any) => page.getByRole('button', { name: 'Submit', exact: true });

async function home(page: any) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Our Rooms', exact: true })).toBeVisible();
}

async function fillContact(page: any, payload: any) {
  for (const field of FIELDS) await page.locator(`#${field}`).fill(payload[field]);
}

async function submitContact(page: any, a: any) {
  const waiting = page.waitForResponse((r: any) => r.url().endsWith('/api/message') && r.request().method() === 'POST');
  await submitBtn(page).click();
  const r = await waiting;
  const body = await r.json();
  a.calls.push({ startedAt: new Date().toISOString(), request: { method: 'POST', url: r.url(), body: r.request().postDataJSON() }, response: { status: r.status(), body } });
  return { status: r.status(), body };
}

// Preflight rezerwacji: bez działających szczegółów pokoju kroki rezerwacji są niewykonalne -> BLOCKED (DEF-01).
async function reservePage(page: any, a: any, info: any) {
  const room = await firstListedRoom(a);
  const dates = futureDates();
  const r = await a.call('GET', `/api/room/${room.roomid}`);
  await page.goto(`/reservation/${room.roomid}?checkin=${dates.checkin}&checkout=${dates.checkout}`);
  if (r.status !== 200) {
    await a.step(page, `Strona rezerwacji pokoju ${room.roomid}: brak formularza (GET /api/room/${room.roomid} → ${r.status})`);
    info.annotations.push({ type: 'blocked', description: `Szczegóły pokoju HTTP ${r.status}; DEF-01. Brak formularza rezerwacji.` });
    a.note({ blockedBy: 'DEF-01', detailStatus: r.status, roomid: room.roomid, dates });
    test.skip(true, `BLOCKED: szczegóły pokoju HTTP ${r.status}; DEF-01`);
  }
  await expect(page.getByRole('button', { name: 'Reserve Now', exact: true })).toBeVisible();
  await a.step(page, 'Strona rezerwacji z formularzem', [page.getByRole('button', { name: 'Reserve Now', exact: true })]);
  return { room, dates };
}

// UI-01 | R-02 | porównanie UI z API | katalog pokoi
test('UI-01 Katalog pokoi zgodny z API', async ({ page, audit: a }) => {
  const r = await a.call('GET', '/api/room');
  a.check(r.status, 200, 'Katalog API HTTP 200');
  await home(page);
  for (const room of r.body.rooms) {
    await expect(page.getByRole('heading', { name: room.type, exact: true })).toBeVisible();
    await expect(page.getByText(`£${room.roomPrice} per night`, { exact: true })).toBeVisible();
    await expect(page.locator(`a[href^="/reservation/${room.roomid}?"]`)).toBeVisible();
  }
  await a.step(page, 'Katalog: typy, ceny i linki zgodne z GET /api/room', [
    page.getByRole('heading', { name: 'Our Rooms', exact: true }),
    ...r.body.rooms.map((room: any) => page.locator(`a[href^="/reservation/${room.roomid}?"]`)),
  ]);
  a.note('Nazwy typów, ceny i linki rezerwacji odpowiadają bieżącej liście API.');
});

// UI-02 | R-03, R-06 | EP poprawne dane, DT reguła 1 | formularz kontaktowy
test('UI-02 Poprawna wiadomość kontaktowa', async ({ page, audit: a }) => {
  // Sprzątanie po teście jest informacyjne (helpers/audit.ts: cleanupUiMessage) i nie decyduje o werdykcie.
  await home(page);
  const name = marker();
  try {
    await fillContact(page, contact(name));
    await a.step(page, 'Formularz wypełniony poprawnymi danymi', [...formFields(page), submitBtn(page)]);
    const r = await submitContact(page, a);
    a.check(r.status, 200, 'POST kontakt HTTP 200');
    const thanks = page.getByText(`Thanks for getting in touch ${name}!`, { exact: true });
    await expect(thanks).toBeVisible();
    await a.step(page, 'Potwierdzenie wysłania z własnym imieniem (HTTP 200)', [thanks]);
  } finally {
    await cleanupUiMessage(a, name);
  }
});

// UI-03 | R-03 | EP brak wymaganych danych | formularz kontaktowy
test('UI-03 Pusty formularz kontaktowy', async ({ page, audit: a }) => {
  await home(page);
  await a.step(page, 'Pusty formularz przed wysłaniem', [...formFields(page), submitBtn(page)]);
  const r = await submitContact(page, a);
  a.check(r.status, 400, 'Brak wymaganych pól HTTP 400');
  await expect(page.getByText('Name may not be blank', { exact: true })).toBeVisible();
  await expect(page.locator('#name')).toBeVisible();
  await a.step(page, 'Komunikaty wymaganych pól (HTTP 400) pod formularzem', [submitBtn(page), page.locator('.alert-danger')]);
});

// UI-04 | R-03 | EP zły format, DT reguły 3 i 4 | formularz kontaktowy
test('UI-04 Niepoprawny email w kontakcie', async ({ page, audit: a }) => {
  await home(page);
  await fillContact(page, contact(marker(), { email: 'bledny-email' }));
  await a.step(page, 'Email w złym formacie: „bledny-email”', [page.locator('#email')]);
  const r = await submitContact(page, a);
  a.check(r.status, 400, 'Niepoprawny email odrzucony przez API');
  await expect(page.locator('.alert-danger')).toContainText(/email/i);
  await expect(page.locator('#email')).toHaveValue('bledny-email');
  await a.step(page, 'Reguła 3: błędny email odrzucony (HTTP 400)', [page.locator('#email'), page.locator('.alert-danger')]);
  await page.locator('#subject').fill('ABCD');
  const both = await submitContact(page, a);
  a.check(both.status, 400, 'Błędny email i temat odrzucone');
  await expect(page.locator('.alert-danger')).toContainText('Subject must be between 5 and 100 characters.');
  await expect(page.locator('.alert-danger')).toContainText(/email/i);
  await a.step(page, 'Reguła 4: błędny email i temat „ABCD” – oba komunikaty', [page.locator('#subject'), page.locator('.alert-danger')]);
});

// UI-05 | R-03 | BVA min−1, DT reguła 2 | temat 4 znaki
test('UI-05 Temat 4 znaki: poniżej minimum', async ({ page, audit: a }) => {
  await home(page);
  await fillContact(page, contact(marker(), { subject: 'ABCD' }));
  await a.step(page, 'Temat „ABCD” (4 znaki, min. 5), pozostałe pola poprawne', [page.locator('#subject')]);
  const r = await submitContact(page, a);
  a.check(r.status, 400, 'Temat 4 znaki odrzucony');
  await expect(page.getByText('Subject must be between 5 and 100 characters.', { exact: true })).toBeVisible();
  await a.step(page, 'Odrzucenie (HTTP 400): „Subject must be between 5 and 100 characters.”', [page.locator('#subject'), page.locator('.alert-danger')]);
});

// UI-06 | R-03, R-06 | BVA min | temat 5 znaków
test('UI-06 Temat 5 znaków: dolna granica', async ({ page, audit: a }) => {
  // Sprzątanie po teście jest informacyjne i nie decyduje o werdykcie.
  await home(page);
  const name = marker();
  try {
    await fillContact(page, contact(name, { subject: 'ABCDE' }));
    await a.step(page, 'Temat „ABCDE” (5 znaków – dolna granica)', [page.locator('#subject')]);
    const r = await submitContact(page, a);
    a.check(r.status, 200, 'Temat 5 znaków przyjęty');
    const thanks = page.getByText(`Thanks for getting in touch ${name}!`, { exact: true });
    await expect(thanks).toBeVisible();
    await a.step(page, 'Wiadomość przyjęta (HTTP 200), potwierdzenie widoczne', [thanks]);
  } finally {
    await cleanupUiMessage(a, name);
  }
});

// UI-07 | R-03 | BVA min−1 | telefon 10 znaków
test('UI-07 Telefon 10 znaków: poniżej minimum', async ({ page, audit: a }) => {
  await home(page);
  await fillContact(page, contact(marker(), { phone: '1234567890' }));
  await a.step(page, 'Telefon „1234567890” (10 znaków, min. 11)', [page.locator('#phone')]);
  const r = await submitContact(page, a);
  a.check(r.status, 400, 'Telefon 10 znaków odrzucony');
  await expect(page.getByText('Phone must be between 11 and 21 characters.', { exact: true })).toBeVisible();
  await a.step(page, 'Odrzucenie (HTTP 400): „Phone must be between 11 and 21 characters.”', [page.locator('#phone'), page.locator('.alert-danger')]);
});

// UI-08 | R-01, R-05 | reguła biznesowa: cena dwóch nocy
test('UI-08 Cena rezerwacji dwóch nocy', async ({ page, audit: a }, info) => {
  const { room } = await reservePage(page, a, info);
  await expect(page.getByText(`£${room.roomPrice} x 2 nights`, { exact: true })).toBeVisible();
  await expect(page.getByText(`£${room.roomPrice * 2 + 40}`, { exact: true })).toBeVisible();
  await a.step(page, 'Podsumowanie ceny: 2 noce + opłaty', [page.getByText(`£${room.roomPrice} x 2 nights`, { exact: true }), page.getByText(`£${room.roomPrice * 2 + 40}`, { exact: true })]);
  a.note('Cena noclegu razy dwie noce plus widoczne opłaty 25 i 15 GBP.');
});

// UI-09 | R-01, R-03 | EP puste dane obowiązkowe gościa
test('UI-09 Puste dane gościa w rezerwacji', async ({ page, audit: a }, info) => {
  await reservePage(page, a, info);
  await page.getByRole('button', { name: 'Reserve Now', exact: true }).click();
  const response = page.waitForResponse((r) => r.url().endsWith('/api/booking') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Reserve Now', exact: true }).click();
  const r = await response;
  const body = await r.json();
  a.calls.push({ request: { method: 'POST', url: r.url(), body: r.request().postDataJSON() }, response: { status: r.status(), body } });
  a.check(r.status(), 400, 'Puste dane gościa HTTP 400');
  await expect(page.getByRole('alert').filter({ hasText: 'Firstname' })).toBeVisible();
  await a.step(page, 'Komunikaty o brakujących danych gościa (HTTP 400)', [page.getByRole('alert')]);
});

// UI-10 | R-01, R-05 | spójność danych UI → request (POST przerwany przed zapisem)
test('UI-10 Rezerwacja zachowuje wybrane daty', async ({ page, audit: a }, info) => {
  // Przypadek jest bezpiecznym sprawdzeniem payloadu przed zapisem. Finalne utworzenie pokrywa API-10.
  const { dates } = await reservePage(page, a, info);
  await page.getByRole('button', { name: 'Reserve Now', exact: true }).click();
  for (const [field, value] of Object.entries({ Firstname: 'QATester', Lastname: 'ProjektTestowy', Email: 'qa-project@example.test', Phone: '12345678901' })) {
    await page.getByRole('textbox', { name: field, exact: true }).fill(value);
  }
  let sent: any;
  await page.route('**/api/booking', async (route) => {
    if (route.request().method() === 'POST') { sent = route.request().postDataJSON(); await route.abort('blockedbyclient'); }
    else await route.continue();
  });
  const pending = page.waitForRequest((r) => r.url().endsWith('/api/booking') && r.method() === 'POST');
  await page.getByRole('button', { name: 'Reserve Now', exact: true }).click();
  await pending;
  a.note({ mode: 'Kontrola payloadu UI. POST przerwany przed serwerem, bez deklaracji pełnego E2E.', sent });
  a.check(sent.bookingdates, dates, 'Daty wysyłane zgodne z wyborem użytkownika');
});

// UI-11 | R-04 | EP niepoprawne dane logowania | panel administratora
test('UI-11 Błędne logowanie administratora', async ({ page, audit: a }) => {
  await page.goto('/admin');
  await page.getByRole('textbox', { name: 'Username', exact: true }).fill(marker());
  await page.locator('#password').fill('nieprawidlowe-dane-testowe');
  const loginBtn = page.getByRole('button', { name: 'Login', exact: true });
  await a.step(page, 'Logowanie z niepoprawnymi danymi', [page.locator('#username'), page.locator('#password'), loginBtn]);
  const pending = page.waitForResponse((r) => r.url().includes('/api/auth/login'));
  await loginBtn.click();
  const r = await pending;
  a.check(r.status(), 401, 'Błędne logowanie HTTP 401');
  await expect(page.getByText(/Invalid credentials/i)).toBeVisible();
  await expect(page.locator('#username')).toBeVisible();
  await a.step(page, 'Odmowa dostępu (HTTP 401): „Invalid credentials”, brak panelu', [page.getByText(/Invalid credentials/i), page.locator('#username'), loginBtn]);
});

// UI-12 | R-01, R-05 | spójność parametrów i odpowiedzi | wyszukiwanie dostępności
test('UI-12 Wyszukanie dostępności dla poprawnego okresu', async ({ page, audit: a }) => {
  await home(page);
  const dates = futureDates();
  const fields = page.locator('.react-datepicker__input-container input');
  await fields.nth(0).fill(dates.checkin.split('-').reverse().join('/'));
  await fields.nth(0).press('Tab');
  await fields.nth(1).fill(dates.checkout.split('-').reverse().join('/'));
  await fields.nth(1).press('Tab');
  const checkBtn = page.getByRole('button', { name: 'Check Availability', exact: true });
  await a.step(page, `Wybrany okres ${dates.checkin} – ${dates.checkout}`, [fields, checkBtn]);
  const pending = page.waitForResponse((r) => r.url().includes('/api/room?'));
  await checkBtn.click();
  const r = await pending;
  a.check(r.status(), 200, 'Dostępność HTTP 200');
  const body = await r.json();
  const url = new URL(r.url());
  a.note({ requestUrl: r.url(), response: body });
  a.check(url.searchParams.get('checkin'), dates.checkin, 'Wybrany checkin wysłany');
  a.check(url.searchParams.get('checkout'), dates.checkout, 'Wybrany checkout wysłany');
  for (const room of body.rooms) await expect(page.locator(`a[href^="/reservation/${room.roomid}?"]`)).toBeVisible();
  await a.step(page, 'Wyniki: dostępne pokoje z linkami rezerwacji dla wybranych dat', [
    page.getByRole('heading', { name: 'Our Rooms', exact: true }),
    ...body.rooms.map((room: any) => page.locator(`a[href^="/reservation/${room.roomid}?"]`)),
  ]);
});
