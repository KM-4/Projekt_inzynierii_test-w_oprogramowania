# Raporty defektów

Zespół: Kamil Andrzejewski (83741), Karol Myszkowski (77514), Kacper Walkowiak (77519), Mateusz Krzyzak (77862). Unikalne defekty: **4** (S1: 1, S2: 1, S3: 2, S4: 0). Kilka przypadków z tym samym objawem raportujemy jako jeden defekt.

| ID | Tytuł | Severity | Priority | Stan | Powiązane |
|---|---|---|---|---|---|
| [DEF-01](#def-01) | Trasy zasobów z ID zwracają 500; rezerwacja UI i sprzątanie danych zablokowane | S1 Critical | P1 | Otwarty; powtarzalny symptom wdrożenia; root cause niepotwierdzony | UI-08, UI-09, UI-10, API-02, API-03, API-09, API-10 |
| [DEF-02](#def-02) | Email jako obiekt JSON w wiadomości powoduje HTTP 500 | S3 Medium | P3 | Otwarty | API-06 |
| [DEF-03](#def-03) | Niepoprawny lub wycofany token odczytu rezerwacji daje HTTP 500 | S3 Medium | P3 | Otwarty; powtórzony z kontrolami pozytywną i negatywną | EXP-02 |
| [DEF-04](#def-04) | W UTC+14 dostępność jest wyszukiwana dla dat o dzień wcześniejszych niż wybór | S2 High | P2 | Otwarty; potwierdzony wpisywaniem i wyborem z kalendarza | EXP-02 |

## Skala severity i priority

| Severity | Znaczenie | Priority | Znaczenie |
|---|---|---|---|
| S1 Critical | blokada kluczowego procesu / utrata danych | P1 | naprawić natychmiast |
| S2 High | istotna funkcja nie działa, brak sensownego obejścia | P2 | wysoki priorytet |
| S3 Medium | problem ograniczony; obejście istnieje | P3 | normalny backlog |
| S4 Low | drobna wada, UX / kosmetyka | P4 | niski priorytet |

## Szczegóły defektów

### DEF-01

**Trasy zasobów z ID zwracają 500; rezerwacja UI i sprzątanie danych zablokowane** · S1 Critical · P1 · Otwarty; powtarzalny symptom wdrożenia; root cause niepotwierdzony

- **Środowisko:** Windows 11; Chrome 157.0.8103.78; Playwright 1.62.1; Node 22.16.0; Europe/Warsaw; publiczne proxy /api/*; UI v2.2
- **URL:** https://automationintesting.online
- **Data (UTC):** 2026-11-14 09:54:25
- **Warunki wstępne:** Publiczna lista pokoi dostępna; roomid pobrany dynamicznie. Dla wiadomości/rezerwacji: utworzony własny rekord i bieżący token.
- **Kroki reprodukcji:**
  1. GET /api/room, wybierz istniejący roomid.
  2. GET /api/room/&lt;roomid&gt;: porównaj status.
  3. Otwórz /reservation/&lt;roomid&gt;?checkin=&lt;przyszła data&gt;&checkout=&lt;data+2&gt;.
  4. Dodatkowe reprodukcje tego samego symptomu: utwórz własny message lub booking, znajdź jego ID na liście, wykonaj GET, PUT i DELETE własnego ID z tokenem.
- **Oczekiwany rezultat:** GET istniejącego pokoju/rekordu 200; nieistniejący pokój 404; UI pokazuje szczegóły i rezerwację; PUT i DELETE własnego rekordu 200 w proxy.
- **Rzeczywisty rezultat:** HTTP 500 i tekst Internal Server Error na dynamicznych trasach (GET, PUT, DELETE). UI pozostaje na spinnerze; poprawne POST i listy działają. Aktualizacja i sprzątanie własnych danych również kończą się 500.
- **Wpływ i uzasadnienie severity:** Blokada głównego procesu rezerwacji gościa (S1 według skali prowadzącego). Brak sensownego obejścia w zwykłym UI. Pozostałości danych testowych do resetu.
- **Powiązane przypadki / sesja:** [UI-08](02_TestCases.md#ui-08), [UI-09](02_TestCases.md#ui-09), [UI-10](02_TestCases.md#ui-10), [API-02](02_TestCases.md#api-02), [API-03](02_TestCases.md#api-03), [API-09](02_TestCases.md#api-09), [API-10](02_TestCases.md#api-10)
- **Evidence:** [UI-08.json](evidence/ui/UI-08.json), [krok-01.png](evidence/ui/UI-08/krok-01.png), [UI-08.png](evidence/ui/UI-08.png), [UI-09.json](evidence/ui/UI-09.json), [krok-01.png](evidence/ui/UI-09/krok-01.png), [UI-09.png](evidence/ui/UI-09.png), [UI-10.json](evidence/ui/UI-10.json), [krok-01.png](evidence/ui/UI-10/krok-01.png), [UI-10.png](evidence/ui/UI-10.png), [API-02.json](evidence/api/API-02.json), [API-03.json](evidence/api/API-03.json), [API-09.json](evidence/api/API-09.json), [API-10.json](evidence/api/API-10.json)
- **Deduplikacja:** Jeden raport grupuje wspólny, powtarzalny symptom tras z ID w kilku usługach. Nie twierdzimy, że znamy wspólną przyczynę. Po diagnozie właściciel może rozdzielić zakres naprawy; nie liczymy każdego HTTP 500 jako nowego defektu.

### DEF-02

**Email jako obiekt JSON w wiadomości powoduje HTTP 500** · S3 Medium · P3 · Otwarty

- **Środowisko:** Windows 11; Chrome 157.0.8103.78; Playwright 1.62.1; Node 22.16.0; Europe/Warsaw; publiczne proxy /api/*; UI v2.2
- **URL:** https://automationintesting.online/api/message
- **Data (UTC):** 2026-11-14 09:54:26
- **Warunki wstępne:** Publiczny POST /api/message dostępny, pozostałe pola poprawne.
- **Kroki reprodukcji:**
  1. Przygotuj poprawny payload wiadomości jak w API-06.
  2. Zastąp email obiektem {"value":"qa@example.test"}.
  3. Wyślij POST /api/message z Content-Type application/json.
  4. Sprawdź status i treść odpowiedzi.
- **Oczekiwany rezultat:** Błędny typ pola String jest błędem danych klienta i powinien być odrzucony 400; brak zapisu. Wymaganie 400 jest kryterium jakości projektu, nie cytatem specyfikacji wdrożenia.
- **Rzeczywisty rezultat:** HTTP 500, JSON {"error":"Failed to create message"}. Zwykły niepoprawny format tekstowego email daje 400 w API-05. Odrzucony rekord nie pojawia się na liście wiadomości.
- **Wpływ i uzasadnienie severity:** Ograniczona wada obsługi niepoprawnych danych; poprawne formularze nadal działają. Rekord nie został zapisany; brak dowodu awarii całej usługi.
- **Powiązane przypadki / sesja:** [API-06](02_TestCases.md#api-06)
- **Evidence:** [API-06.json](evidence/api/API-06.json)
- **Deduplikacja:** Odrębny objaw POST przy złym typie, niezależny od dynamicznych tras z ID.

### DEF-03

**Niepoprawny lub wycofany token odczytu rezerwacji daje HTTP 500** · S3 Medium · P3 · Otwarty; powtórzony z kontrolami pozytywną i negatywną

- **Środowisko:** Windows; Chrome 157.0.8103.52; Playwright APIRequestContext 1.62.1; EXP-02; publiczne /api/*
- **URL:** https://automationintesting.online/api/booking
- **Data (UTC):** 2026-11-13 16:56:34
- **Warunki wstępne:** Bieżący roomid pobrany z GET /api/room. Żądania odczytu, bez tworzenia rezerwacji. Do kontroli pozytywnej token z aktualnego logowania szkoleniowego.
- **Kroki reprodukcji:**
  1. GET /api/room: pobierz istniejący roomid.
  2. GET /api/booking?roomid=&lt;roomid&gt; bez Cookie: kontrola 401.
  3. Wyślij ten sam GET z Cookie: token=invalid-exp02-controlled.
  4. Powtórz z poprawnym tokenem z aktualnego POST /api/auth/login.
  5. Porównaj z POST /api/auth/validate dla niepoprawnego tokenu; opcjonalnie sprawdź pusty Cookie token=.
- **Oczekiwany rezultat:** Niepoprawny/nieważny token powinien dać odpowiedź autoryzacji 401 lub 403, bez danych rezerwacji. Poprawny token: 200. Sam validate dla niepoprawnego tokenu daje 403.
- **Rzeczywisty rezultat:** Błędny token i pusty Cookie w GET kolekcji dają 500 oraz []; brak tokenu 401, poprawny token 200. Powtórzenie potwierdziło wynik. Wcześniej poprawny token później dostał 403 w validate i 500 w kolekcji.
- **Wpływ i uzasadnienie severity:** Błąd danych/sesji jest przedstawiany jako awaria serwera. Ponowne logowanie działa jako obejście. Nie wykryto ujawnienia danych ani obejścia kontroli dostępu.
- **Powiązane przypadki / sesja:** [EXP-02](03_Exploratory.md)
- **Evidence:** [DEF-03-auth.json](evidence/exploratory/DEF-03-auth.json), [session.json](evidence/exploratory/session.json)
- **Deduplikacja:** Jeden raport dla niepoprawnego, pustego i później odrzuconego tokenu w tej samej operacji kolekcji. Odrębny od DEF-01: URL nie zawiera ID zasobu w ścieżce.

### DEF-04

**W UTC+14 dostępność jest wyszukiwana dla dat o dzień wcześniejszych niż wybór** · S2 High · P2 · Otwarty; potwierdzony wpisywaniem i wyborem z kalendarza

- **Środowisko:** Windows; Chrome 157.0.8103.52; Pacific/Kiritimati (UTC+14); rzeczywisty zegar, bez mocków; kontrola UTC i Europe/Warsaw; EXP-02
- **URL:** https://automationintesting.online/
- **Data (UTC):** 2026-11-13 16:48:22
- **Warunki wstępne:** Kontekst Chrome timezoneId=Pacific/Kiritimati; bieżąca lokalna data ma być dzień późniejsza od UTC (badano ok. 06:48 czasu lokalnego, 16:48 UTC poprzedniego dnia). Identyczna wersja Chrome/format dat w kontekście kontrolnym UTC.
- **Kroki reprodukcji:**
  1. Otwórz stronę w kontekście Pacific/Kiritimati przy podanym warunku czasu. Zweryfikuj strefę przez Intl.DateTimeFormat().resolvedOptions().timeZone.
  2. Wpisz Check In=12/01/2027, Check Out=14/01/2027, zatwierdź Tab.
  3. Kliknij Check Availability i odczytaj request GET /api/room?checkin=...&checkout=... oraz linki Book now.
  4. Powtórz wyborem 18 i 20 stycznia 2027 z kalendarza.
  5. Kontrola: te same 12–14 stycznia w UTC. Jeżeli warunek różnicy dat UTC/lokalnej nie jest spełniony, odtwórz w odpowiednim oknie czasu; nie oczekuj tej samej reprodukcji o każdej godzinie.
- **Oczekiwany rezultat:** Daty wyszukiwania i linków odpowiadają datom widocznym w polach, niezależnie od strefy klienta: 12–14 stycznia -&gt; 2027-01-12/2027-01-14.
- **Rzeczywisty rezultat:** W UTC+14 pola/linki: 12–14 stycznia; request: 11–13 stycznia. Kalendarz: pola/linki 18–20, request 17–19. Domyślne daty też przesunięte. W kontroli UTC te same wpisane 12–14 przechodzą poprawnie.
- **Wpływ i uzasadnienie severity:** Wynik dostępności dotyczy innego okresu niż wybór i link rezerwacji. Może powodować błędną ofertę dostępności. Końcowy zapis i cena nie zostały sprawdzone z powodu DEF-01; nie twierdzimy, że utworzono błędny pobyt.
- **Powiązane przypadki / sesja:** [EXP-02](03_Exploratory.md)
- **Evidence:** [DEF-04-dates.json](evidence/exploratory/DEF-04-dates.json), [session.json](evidence/exploratory/session.json), [EXP-02-16-timezone-default.png](evidence/exploratory/EXP-02-16-timezone-default.png), [EXP-02-17-timezone-chosen.png](evidence/exploratory/EXP-02-17-timezone-chosen.png), [EXP-02-20-date-panel-utc14.png](evidence/exploratory/EXP-02-20-date-panel-utc14.png), [EXP-02-21-date-panel-utc.png](evidence/exploratory/EXP-02-21-date-panel-utc.png), [EXP-02-19-timezone-calendar.png](evidence/exploratory/EXP-02-19-timezone-calendar.png)
- **Deduplikacja:** Jeden problem konwersji dat dla trzech wariantów wejścia. UI-12 zachowuje historyczny PASS w Europe/Warsaw; nowy defekt dotyczy rozszerzenia środowiska podczas eksploracji.
