# Uruchomienie automatyzacji

Student: **Kamil Andrzejewski, nr studenta 83741**.

Wymagane: Node.js 22 lub nowszy, npm, Internet i zainstalowany Google Chrome. Testy napisano autorsko w TypeScript. Runner i APIRequestContext pochodzą z `playwright/test`, zależność `playwright` przypięta do 1.62.1 wraz z `playwright-core` 1.62.1. Nie potrzeba osobnej instalacji TypeScript. Brak dodatkowych narzędzi SaaS.

## Czyste środowisko Windows / PowerShell

Otwórz terminal w rozpakowanym folderze `QA-Project/05_Automation`:

```powershell
node --version
npm.cmd --version
npm.cmd ci --ignore-scripts --no-audit --no-fund
$env:BASE_URL='https://automationintesting.online'
$env:BROWSER_CHANNEL='chrome'
$env:TEST_TIMEZONE='Europe/Warsaw'
$env:QA_USERNAME='<login>'
$env:QA_PASSWORD='<hasło>'
npm.cmd test
npm.cmd run report
```

Dane szkoleniowego administratora uzyskaj z sekcji Login oficjalnego repozytorium: https://github.com/mwinteringham/restful-booker-platform#login. Nie zapisuj prawdziwego hasła w plikach raportu ani w Git. `.env.example` jest opisem zmiennych; plik nie jest automatycznie ładowany. Bez zmiennych QA testy wymagające logowania lub sprzątania danych mają status BLOCKED. Zwykłe testy negatywnego logowania używają niepoprawnych, syntetycznych danych.

Na komputerze bez Chrome można zainstalować silnik Chromium z Playwright (`npx playwright install chromium`), co pobiera osobną przeglądarkę. Aby jej użyć, ustaw `BROWSER_CHANNEL=chromium`. Pobieranie nie było potrzebne w środowisku realizacji. Dla Linux ewentualne biblioteki systemowe Chrome/Chromium należy zapewnić osobno.

## Wybór zakresu i odczyt wyników

```powershell
npm.cmd run test:api
npm.cmd run test:ui
npx.cmd playwright test --list
```

Pełny przebieg obejmuje 22 przypadki: 10 API i 12 UI. Raporty pojedynczego podzbioru zastępują ostatni raport, dlatego do odświeżenia metryk całego projektu uruchom `npm.cmd test`. Zwrócony kod 1 oznacza wykryte FAIL, a nie brak uruchamialności automatyzacji. Nie zmieniaj asercji na HTTP 500 tylko po to, aby uzyskać zielony raport.

- `reports/html/index.html`: raport Playwright do otwarcia poleceniem `npm.cmd run report`.
- `reports/results.json`, `junit.xml`, `case-results.json`: rzeczywisty wynik ostatniego przebiegu.
- `reports/artifacts/`: screenshot i trace przy FAIL UI; otwarcie: `npx.cmd playwright show-trace '<ścieżka-do-trace.zip>'`.
- `../evidence/api/API-xx.json`: zredagowane request/response/status i asercje.
- `../evidence/ui/UI-xx.json` i `.png`: obserwacje UI, dane i rzeczywiste screeny.

Zweryfikowano także uruchomienie serwera raportu i odpowiedź HTTP 200; dowód w `../evidence/automation/report-verification.json`. W użytej wersji widok HTML pokazuje `All 19` dla PASS+FAIL i osobno `Skipped 3`; razem odpowiada to 22 planowanym przypadkom. Źródłem metryk pozostaje JSON pełnego przebiegu.

## Izolacja i ograniczenia publicznego SUT

Jeden worker, zero retry, brak sztucznych sleep i brak obciążenia. Zasoby są wybierane z bieżącej listy. Testy tworzą tylko rekordy z jednoznacznym markerem QA i usuwają wyłącznie te rekordy. Konflikt dat lub reset nie uruchamia bezwarunkowego ponawiania zapisu. Dane są odczytywane na nowo w każdym teście. Reset w trakcie sekwencji może spowodować rzeczywisty FAIL i wymaga analizy timestampów.

Podczas realizacji trasy z parametrem ID zwracały 500. Dlatego sprzątanie części własnych danych również nie działało, co pozostaje jawnie błędem testu; zapisano próby i późniejsze obserwacje stanu. Po teście API-09/API-10 nie wykonuje się dalszych kroków biznesowych, jeżeli wcześniejsza jawna asercja nie przejdzie. PUT ma kod i jest uruchamialny, lecz nie jest raportowany jako wykonany, jeśli GET go zablokował.

UI-08..10 sprawdzają dostępność szczegółów przed rozpoczęciem zależnego procesu. Awaria zależności daje skip runnera i BLOCKED w metrykach, z powodem DEF-01. To nie jest PASS. UI-10 kontroluje daty payloadu, przechwytując i przerywając POST przed zapisem; nie jest pełnym E2E potwierdzenia rezerwacji. Pełny cykl utworzenie/odczyt/zmiana jest zaplanowany w API-10.

Sekrety maskuje `helpers/audit.ts`. API nie zapisuje trace, aby nie utrwalać tokenów. UI nie loguje się prawdziwym kontem w przeglądarce; sprzątanie używa oddzielnego transportu Node, poza trace UI. Screenshot/trace przy awarii UI pozostają włączone. Nigdy nie uruchamiaj testów przeciw produkcji lub innemu systemowi bez uprawnienia.

## Odtwarzanie dokumentacji

Artefakty wynikowe są migawką przebiegu z datą w raporcie. Kolejne uruchomienie testów nie przepisuje automatycznie PDF/XLSX. Po zmianie wyników trzeba ponownie przeliczyć dokumentację na podstawie `case-results.json` i `supporting/test-cases.json`; nie należy ręcznie zmieniać tylko liczników w PDF.
