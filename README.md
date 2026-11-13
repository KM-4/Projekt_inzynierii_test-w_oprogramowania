# Projekt zespołowy - Inżynieria testów oprogramowania

SUT: **Restful-Booker-Platform**, https://automationintesting.online/. Data migawki: **13 listopada 2026**. Projekt obejmuje analizę ryzyka, autorskie przypadki, testy UI/API, dowody, eksplorację, defekty i rekomendację. Nie jest to odrębny Restful-Booker.

## Wynik rzeczywistego pełnego uruchomienia

| Planowane | Wykonane (PASS+FAIL) | PASS | FAIL | BLOCKED | NOT RUN |
|---:|---:|---:|---:|---:|---:|
| 22 | 19 | 12 | 7 | 3 | 0 |

12 przypadków UI, 10 API, 12 negatywnych. Cztery unikalne raporty defektów: S1=1, S2=1, S3=2, S4=0. Dwa nowe ustalenia pochodzą z osobnej sesji EXP-02, bez zmiany liczników 22 TC. Rekomendacja **NO-GO**: szczegóły zasobów zwracają 500 i blokują rezerwację gościa. W UI-02/UI-06 wiadomość została przyjęta; FAIL wynika z nieskutecznego cleanup. Szczegóły w raporcie końcowym i actual result arkusza. Automatyzacja rzeczywiście uruchamia się i wykrywa awarie SUT; nie wszystkie testy mają być zielone.

Pełny przebieg: **13.11.2026 16:52:56–16:55:29 CET (Europe/Warsaw)**. Podstawa metryk: `supporting/metrics.json` oraz `05_Automation/reports/case-results.json`. Wcześniejsze diagnostyki w `evidence/automation/` nie są doliczane do licznika ostatniego przebiegu.

## Dane studenta i skład zespołu

Student wskazany do projektu: **Kamil Andrzejewski, nr studenta 83741**.

Numer zespołu: **Z## [UZUPEŁNIĆ]**.

| Osoba | Imię i nazwisko | Odpowiedzialność proponowana | Rzeczywisty wkład / wykonane działania |
|---|---|---|---|
| 1 | Kamil Andrzejewski, nr studenta 83741 | Test lead, ryzyka, spójność, rekomendacja | [WPISAĆ FAKTY] |
| 2 | [UZUPEŁNIĆ] | Projekt przypadków, EP/BVA/DT | [WPISAĆ FAKTY] |
| 3 | [UZUPEŁNIĆ] | Wykonanie, evidence, defekty | [WPISAĆ FAKTY] |
| 4, opcjonalna | [UZUPEŁNIĆ / USUNĄĆ WIERSZ] | API i automatyzacja | [WPISAĆ FAKTY] |

W zespole 3-osobowym API/automatyzację współdzielą osoby 2 i 3. Materiały oraz wykonanie zarejestrowanych przebiegów przygotowano z pomocą asystenta. Nie przypisano studentom fikcyjnej historii pracy. Każdy członek powinien samodzielnie odtworzyć i zrozumieć własną część.

## Pliki i kolejność czytania

1. `01_TestPlan.pdf`: plan i sześć ryzyk, 2 strony.
2. `02_TestCases.xlsx`: podsumowanie formułowe, 12 UI i 10 API z danymi, krokami, wynikiem, statusem, defektem i odsyłaczem JSON. Szczegółowe arkusze są szerokie; identyfikatory i nagłówki są zamrożone, a tabele mają filtry.
3. `03_Exploratory.md` i `.pdf`: charter, rzeczywisty dziennik, obserwacje, czas i ograniczenia sesji asystowanej.
4. `04_Defects.xlsx`: cztery unikalne raporty i skale severity/priority.
5. `05_Automation/README.md`: instalacja i uruchomienie; `reports/html/`, JSON/JUnit i artefakty runnera.
6. `06_TestSummaryReport.pdf`: metryki, ograniczenia, ryzyka i decyzja, 3 strony.
7. `supporting/`: checklista wszystkich 19 stron, ryzyka, techniki, śledzenie wymagań, źródła, dane JSON i scenariusz obrony 5–7 minut.

Evidence to prawdziwe screenshoty, logi i odpowiedzi. `PASS` oznacza zgodność wykonanych asercji; `FAIL` potwierdzoną niezgodność; `BLOCKED` niedostępny warunek potrzebny do wykonania kroków; `NOT RUN` brak wykonania. Runnerowy skip jest mapowany na BLOCKED wyłącznie z jawnym powodem. Eksploracja nie jest doliczana do minimum przypadków.

## Szybki start (PowerShell)

W rozpakowanym folderze 05_Automation:

```powershell
npm.cmd ci --ignore-scripts --no-audit --no-fund
$env:QA_USERNAME='<login z oficjalnej dokumentacji>'
$env:QA_PASSWORD='<hasło z oficjalnej dokumentacji>'
npm.cmd test
npm.cmd run report
```

Wymagane Node >=22, Chrome i Internet. Szczegółowe opcje BASE_URL, BROWSER_CHANNEL i TEST_TIMEZONE oraz sposób otwarcia trace są w [instrukcji automatyzacji](05_Automation/README.md). Nie ma zależności od lokalnego folderu autora, instalacji globalnych ani stałych ID. Zależności przypięto w package-lock.json. Nie trzeba pobierać Chromium, jeśli dostępny jest Chrome.

## Ograniczenia i obowiązki przed oddaniem

- Dane wskazanego studenta: Kamil Andrzejewski, nr 83741. Uzupełnić numer zespołu, pozostałych członków, faktyczny wkład i podział obrony.
- Publiczny SUT pozostawał uszkodzony. Po naprawie trzeba wykonać UI-08..10 i nieosiągnięte kroki PUT API-09/API-10. Nie wpisywać PASS bez nowego evidence.
- Sekrety i tokeny są maskowane w raportach. Prawdziwe dane gości nie są używane; modyfikowano wyłącznie własne rekordy QA.
- DELETE własnych danych zwracał 500. Dziennik pokazuje próby i zmiany stanu w czasie; reset nie jest traktowany jako dowód skutecznego cleanup.
- Przetestowano Chrome desktop, w eksploracji także trzy strefy klienta (Europe/Warsaw, UTC+14, UTC). Brak pełnej macierzy urządzeń, testów obciążenia, płatności i pełnego pentestu.
- Sesja EXP-02 została wykonana: **30 minut 36 sekund wydzielonej eksploracji**, 13.11.2026 17:31:56–18:02:32 CET. Obejmuje UI/API, analizę i notatki, bez pracy nad pozostałymi artefaktami. Nie pozostaje obowiązkiem do wykonania. Operator narzędziowy i dane studenta są jawne w dzienniku.
- Przy każdym nowym przebiegu raport runnera i evidence są zastępowane. PDF/XLSX stanowią oddaną migawkę; po retestach trzeba przeliczyć wszystkie dokumenty, a nie zmienić wyłącznie kilku liczb.

## Nazwa paczki

Plik `Z##_Andrzejewski_Nazwisko2_Nazwisko3.zip` jest paczką z jawnymi placeholderami wymaganymi dla niepodanych danych pozostałych członków i numeru zespołu. Przed oddaniem zmień nazwę na prawdziwe `Z##_Nazwisko1_Nazwisko2_Nazwisko3[_Nazwisko4].zip`, zastępując numer i nazwiska, oraz uzupełnij README. Paczka zawiera folder QA-Project, kod i dowody; wyklucza node_modules, cache i prywatne .env.
