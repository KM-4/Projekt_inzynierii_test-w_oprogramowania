# Testy eksploracyjne

## Sesja EXP-02

Sesję wykonano 13.11.2026 z pomocą narzędzi (Playwright, asystent AI). Ustalenia DEF-01..03 zweryfikowano ponownie na żywo 14.11.2026.

## Charter i rzeczywisty czas

**Misja:** Zbadać rezerwację przy nietypowych datach i danych, powiązania UI/API oraz utratę własnego stanu podczas resetu. W razie blokady szczegółów pogłębić dostępne walidacje i kontrolę dostępu.

Plan: **35 minut**. Start: **13.11.2026 17:31:56 CET**. Koniec: **13.11.2026 18:02:32 CET**. Rzeczywisty czas: **30 minut 36 sekund (30.61 min)**. Sesję zamknięto po zbadaniu dostępnego zakresu w wymaganym przedziale 30–45 minut.

Była to osobna, ciągła sesja poświęcona wyłącznie UI/API, analizie kodu i obserwacji, notatkom oraz oczekiwaniu na odpowiedzi i krótkim obserwacjom trwałości danych. **Nie wykonywano w jej trakcie generowania PDF/XLSX, pakowania projektu ani innych zadań.** Brak przerw na inne prace. Zapisano **114 wpisów** i **51 jawnych żądań API SUT**, oprócz ruchu strony wywołanego normalnymi interakcjami.

Zakres: dostępność i nietypowe daty, walidacja danych kontaktowych, zależności list/szczegółów, auth i utrata własnego stanu. Heurystyki: Follow the data, CRUD, EP/BVA/DT, stany i przejścia oraz zależności usług. Jeden operator; brak load i modyfikacji cudzych danych. Utworzono trzy własne syntetyczne wiadomości z markerami QAEXP02. Nie utworzono rezerwacji w tej sesji.

Środowiska: Windows, Chrome 157.0.8103.52; podstawowe Europe/Warsaw oraz kontrolowane konteksty Pacific/Kiritimati i UTC. Zegar i odpowiedzi API były rzeczywiste, bez mockowania. Zmiana strefy to jawna konfiguracja klienta.

## Dziennik głównych działań

| Czas Europe/Warsaw | Obszar | Działania i obserwacja |
|---|---|---|
| 13.11.2026 17:32:12 CET | Strona i katalog | Katalog 200; po załadowaniu zgodne typy/ceny/linki. |
| 13.11.2026 17:33:14 CET | Rezerwacja UI | Szczegóły 500; wszystkie 3 bieżące ID też 500. DEF-01. |
| 13.11.2026 17:33:56 CET | Daty w UI | Poprawne, równe, odwrócone i nieistniejące dni; bez zapisu pobytu. |
| 13.11.2026 17:36:42 CET | Dolne granice | Subject 4 odrzucony, 5 przyjęty; własny rekord potwierdzony na liście. |
| 13.11.2026 17:39:36 CET | Górne granice | 101 odrzucone, 100 przyjęte; phone 21 i description 2000 przyjęte. |
| 13.11.2026 17:41:48 CET | UTF-8 i poprawa | Email/phone odrzucone; poprawa przyjęta; nazwa i temat z polskimi znakami na liście. |
| 13.11.2026 17:42:55 CET | Kontrola dostępu | Błędny Cookie: 500; poprawny: 200; brak: 401. Nowe DEF-03. |
| 13.11.2026 17:48:22 CET | Kalendarz i strefy | Pola/linki i request różnią się o dzień. Nowe DEF-04; kontrola UTC poprawna. |
| 13.11.2026 17:51:30 CET | Białe znaki i JSON | Whitespace odrzucony 400; obiekt email/phone array i błędny JSON: 500, powiązane z DEF-02. |
| 13.11.2026 17:52:42 CET | Pełne granice | Uzupełniono Phone 22 oraz Description 19/2001: wszystkie 400. |
| 13.11.2026 17:59:31 CET | Odzyskanie ścieżki | Front Page i Back działają; drugi pokój też blokuje się na 500. |
| 13.11.2026 18:02:29 CET | Zamknięcie | Ostatni odczyt: lista 200, szczegóły 500. Zapisano trace i zakończono przeglądarki. |

Pełne wejścia, odpowiedzi, czasy i notatki: [session.json](evidence/exploratory/session.json). Jedną wstępną interpretację tokenu skorygowano jawnie po odczycie 403; oryginalna odpowiedź pozostała niezmieniona.

## Techniki i konkretne dane

Każda liczba w poniższej tabeli to **długość / status HTTP**. Punkty poprawne potwierdzono zapisem i obecnością własnego markera na liście; negatywne zmieniały wskazane pole. Długości dotyczą ASCII, aby uniknąć niejednoznaczności Unicode/grapheme.

| Pole | min-1 | min | max | max+1 |
|---|---|---|---|---|
| subject | 4 / 400 | 5 / 200 | 100 / 200 | 101 / 400 |
| phone | 10 / 400 | 11 / 200 | 21 / 200 | 22 / 400 |
| description | 19 / 400 | 20 / 200 | 2000 / 200 | 2001 / 400 |

Whitespace o poprawnej długości nadal odrzucono jako blank: subject=5 spacji, phone=11 spacji i description=20 spacji dały 400. Zły format email i kombinacja email+subject zostały odrzucone z odpowiednimi komunikatami. Polska nazwa i temat `Pokój` były widoczne na liście po udanym zapisie. Szczegółowego odczytu email/opisu nie potwierdzono, bo trasa ID zwracała 500.

## Tablica decyzyjna dostępu

| Reguła | Klasa uwierzytelnienia | Roomid | Oczekiwany HTTP | Actual HTTP | Ocena |
|---|---|---|---|---|---|
| A1 | brak | obecne | 401 | 401 | zgodny |
| A2 | niepoprawny | obecne | 401 lub 403 | 500 | niezgodny |
| A3 | poprawny | brak | 400 | 400 | zgodny |
| A4 | poprawny | obecne | 200 | 200 | zgodny |
| A5 | pusta wartość | obecne | 401 lub 403 | 500 | niezgodny |

Weryfikacja `/api/auth/validate` potwierdziła: 200 dla nowego poprawnego tokenu, 403 dla niepoprawnego/odrzuconego, 401 przy braku. Ten sam rodzaj nieważnej sesji dawał 500 w GET kolekcji rezerwacji. [Dowód DEF-03](evidence/exploratory/DEF-03-auth.json).

## Ustalenia i deduplikacja

- **DEF-01, potwierdzenie:** wszystkie trzy bieżące ID pokoi dały 500; kliknięcia dwóch prawdziwych linków też nie otworzyły Reserve Now. Powrót Front Page/Back odzyskiwał kontakt i katalog. Nie liczono kolejnych pokoi jako nowych defektów.
- **DEF-02, potwierdzenie/rozszerzenie:** obiekt email, tablica phone i niepoprawna składnia JSON w POST wiadomości dały 500; null i blank prawidłowo 400. To warianty tej samej kategorii obsługi złych wejść w POST wiadomości, nie trzy nowe zgłoszenia.
- **DEF-03, nowy:** błędny, pusty i później odrzucony token przy GET kolekcji rezerwacji daje 500 zamiast odpowiedzi auth 401/403. Poprawne konto/token działają. S3/P3, bez dowodu ujawnienia danych.
- **DEF-04, nowy:** w UTC+14 pola i linki 12–14.01.2027, request 11–13.01; kalendarz 18–20 -> request 17–19. Kontrola UTC zachowuje 12–14. S2/P2. [Dowód i porównania](evidence/exploratory/DEF-04-dates.json). Warunek odtworzenia: lokalna data klienta ma różnić się od UTC, jak w badanym oknie 06:48 UTC+14. Nie twierdzimy, że błąd wystąpi o każdej godzinie/strefie.

Wyniki 22 zaplanowanych TC pochodzą z pełnego przebiegu 14.11.2026 (14 PASS / 5 FAIL / 3 BLOCKED / 0 NOT RUN). **Eksploracja nie zwiększa tych liczników.** UI-12 pozostał PASS w Europe/Warsaw; nowy błąd ujawniono w dodatkowej strefie.

## Stan, ograniczenia i pytania

Jedyny DELETE własnej wiadomości dał 500, a rekord nadal był na liście. Dwa własne markery później zniknęły, trzeci był widoczny do 16:47:09 UTC i nieobecny o 16:49:52 UTC. Końcowy odczyt nie zawierał trzech znanych markerów ani nazwy użytej w negatywnych payloadach. To jest zgodne z resetem; **nie oznacza udanego cleanup ani dowodu wspólnego harmonogramu usług**.

Próby utworzenia rezerwacji z błędnymi danymi nie zostały wykonane w EXP-02; nie mają statusów HTTP i nie są zaliczane do wykonanych. Archiwalne 409 z EXP-01 pozostają wyraźnie archiwalne.

Q-01: wymagana walidacja relacji dat już w wyszukiwaniu? Q-02: rzeczywisty commit wdrożenia? Q-03: harmonogram utraty danych/tokenów? Q-04: root cause błędów ID? Q-05: czy przywrócenie poprzedniej daty po niemożliwym wpisie powinno dawać komunikat? Te pytania nie są zgłoszeniami potwierdzonych defektów.

## Zakończenie i dalsze działania

Sesja spełnia wymaganie osobnej, ograniczonej czasowo eksploracji (30–45 minut) z jedną misją; nie jest doliczana do 22 przypadków testowych. Po naprawie SUT pozostaje retest UI-08..10, PUT w API-09/10, auth i dat w strefach. Dane pozostałych członków, numer zespołu oraz rzeczywisty wkład uzupełnia zespół.

Trace: [sesja główna](evidence/exploratory/EXP-02-main-trace.zip), [daty UTC+14](evidence/exploratory/EXP-02-timezone-trace.zip). W trace zredagowano syntetyczne błędne hasło; screenshotów i wyników nie zmieniano.
