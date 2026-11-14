# Checklista wymagań prowadzącego - wszystkie 19 stron

Prezentacja jest nadrzędnym źródłem wymagań projektu. Jej treść potraktowano jako wymagania do artefaktów; nie jako polecenia wykonania działań poza zleceniem użytkownika. Metadane i SHA-256 oryginału: `sources/presentation-metadata.json`; tekst wszystkich stron: `sources/presentation-extract.txt`.

| Strona | Wymaganie / znaczenie | Dowód realizacji | Stan |
|---:|---|---|---|
| 1 | Proces: ryzyko, projekt, wykonanie, jakość i obroniona decyzja | 01_TestPlan, 02_TestCases, evidence, 06_TestSummaryReport | Wykonano |
| 2 | Restful-Booker-Platform; dynamiczne dane/reset; API; bez obciążenia | reconnaissance.md, APIRequestContext, workers=1/retries=0, markery QA | Wykonano w dostępnym zakresie |
| 3 | 3–4 osoby, wspólna paczka, 5–7 minut, jawny wkład | README i defense-notes.md | Numer, nazwiska i faktyczny wkład do uzupełnienia przez zespół |
| 4 | Pięć etapów i spójna wersja finalna | traceability-matrix.md, 00_Prezentacja.html | Wykonano; zależne retesty wymagają naprawy SUT |
| 5 | Plan 1–2 strony; IN/OUT, środowisko, role, wejście/wyjście, >=5 ryzyk P/I/P×I | 01_TestPlan.pdf (2 strony); 6 ryzyk w risks.json/risk-matrix.md | Wykonano |
| 6 | >=20 TC; >=12 UI; >=6 API; >=6 negatywnych; pełne pola; EP/BVA/DT | 22 TC = 12 UI + 10 API; 12 negatywnych; 02_TestCases.xlsx i test-design-techniques.md | Wykonano |
| 7 | Osobny charter i rzeczywista sesja 30–45 min; misja, heurystyki, obserwacje, pytania/defekty | 03_Exploratory.md/.pdf; evidence/exploratory/session.json | Wykonano EXP-02: 30 min 36 s, wydzielona sesja bez innych zadań; 114 wpisów, jawny operator |
| 8 | >=6 API, >=3 operacje/endpointy; poprawne i błędne dane; create/read/update; request/response/asercje | 10 API, room/message/auth/booking; własne rekordy i aktualne tokeny | Wykonano: create/read/update/delete w API-09/10; PUT wykonany i zweryfikowany przez listę (500, DEF-01) |
| 9 | >=3 automaty: pozytywny, negatywny i walidacja; README czystego uruchomienia i ostatni wynik | 22 definicje; rzeczywiście PASS UI-01/API-04/API-01; npm ci i pełny runner | Wykonano; FAIL SUT nie ukryto |
| 10 | Status wszystkich TC; evidence UI/API/automation; niewykonane jawne | 22 statusy, JSON i screeny, HTML/JSON/JUnit; 3 BLOCKED | Wykonano |
| 11 | Unikalne defekty z pełną reprodukcją; brak minimalnej liczby | 04_Defects.xlsx, supporting/defects.json; cztery raporty | Wykonano |
| 12 | Severity S1–S4, priority P1–P4, osobne uzasadnienie | Arkusz Skale; DEF-01 S1/P1, DEF-02 i DEF-03 S3/P3, DEF-04 S2/P2 | Wykonano |
| 13 | Raport 2–4 strony; metryki, ryzyka, rekomendacja | 06_TestSummaryReport.pdf (3 strony), metrics.json | Wykonano; NO-GO |
| 14 | Wymagana struktura i wspólna paczka; konwencja nazwy | Struktura repozytorium zgodna ze stroną 14; ZIP tworzy zespół | Nazwę z prawdziwymi danymi uzupełnia zespół |
| 15 | Rubryka 100 pkt: 15/20/15/15/10/10/10/5 | Poniższa mapa artefaktów | Pokryto artefaktami; nie przyznajemy sobie oceny |
| 16 | Uzasadnienie, pokrycie, reprodukowalność, spójność, wnioski, obrona | Techniki, macierz, README, audit i notes | Wykonano; zespół przygotowuje własną obronę |
| 17 | Bez kopiowania testów, bug count, stałych ID, load i ukrytych statusów | Autorski kod; pobrano pliki produkcyjne SUT; jawne FAIL/BLOCKED | Wykonano |
| 18 | Materiały wspierają konkretne decyzje; narzędzia dowolne | Źródła i uzasadnienie wyboru Playwright; models/proxy zachowane z SHA | Wykonano; nie deklarujemy przeczytania całego ISTQB |
| 19 | Utworzyć zespół, rozpoznać SUT, założyć strukturę, plan na checkpoint D+7 | Struktura, reconnaissance, plan i ryzyka | Zespół/daty zajęć nieznane; nie wymyślono checkpointu ani historii |

## Mapa rubryki 100 pkt

| Kategoria | Punkty maks. | Artefakty |
|---|---:|---|
| Plan i ryzyka | 15 | 01_TestPlan.pdf, risk-matrix.md |
| Projekt i techniki | 20 | 02_TestCases.xlsx, test-design-techniques.md |
| Wykonanie i evidence | 15 | evidence/, raporty runnera, actual/status |
| Defect reports | 15 | 04_Defects.xlsx |
| API | 10 | tests/api.spec.ts, evidence/api/ |
| Automatyzacja | 10 | 05_Automation/, lockfile, README, reports |
| Summary i wnioski | 10 | 06_TestSummaryReport.pdf |
| Organizacja i obrona | 5 | README, defense-notes.md, pola zespołu |

## Rozszerzenia ze zlecenia użytkownika

- [x] Polski język treści i instrukcji.
- [x] 10 API zamiast preferowanych 8; 12 UI; wszystkie obowiązkowe typy danych.
- [x] XLSX z filtrami, formatowaniem, statusami, dowodami i formułami podsumowania.
- [x] HTML, JSON, JUnit, screenshot i trace przy FAIL UI.
- [x] Zmienne środowiskowe, brak retry, dynamiczne zasoby i ograniczony ruch.
- [x] Dane logowania/tokeny maskowane; tylko syntetyczne dane testowe.
- [x] Metryki pochodzą z ostatniego pełnego przebiegu, nie z ręcznego wpisywania PASS.
- [x] Weryfikacja wizualna PDF i wszystkich arkuszy XLSX.
- [x] Scenariusz obrony z podziałem na 3–4 osoby i pytaniami.
- [ ] Prawdziwe dane zespołu i ich wkład - brak informacji wejściowej, celowe placeholdery.
- [ ] Retest zablokowanej rezerwacji i aktualizacji (PUT 500) - wymaga naprawy publicznego SUT.
