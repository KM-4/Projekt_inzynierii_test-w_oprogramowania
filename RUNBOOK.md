# Runbook – uruchomienie testów i pokaz wyników

## 1. Przygotowanie (jednorazowo)

Wymagane: Node.js 22+, Google Chrome, dostęp do Internetu.

```powershell
git clone https://github.com/KM-4/Projekt_inzynierii_test-w_oprogramowania.git
cd Projekt_inzynierii_test-w_oprogramowania\05_Automation
npm.cmd ci --ignore-scripts --no-audit --no-fund
```

## 2. Uruchomienie testów

Dane administratora: sekcja Login w https://github.com/mwinteringham/restful-booker-platform#login. Ustaw je tylko w bieżącej sesji terminala, nie zapisuj w plikach.

```powershell
$env:QA_USERNAME='<login>'
$env:QA_PASSWORD='<hasło>'
npm.cmd test            # wszystkie 22 testy
npm.cmd run test:api    # tylko 10 testów API
npm.cmd run test:ui     # tylko 12 testów UI
```

Oczekiwany wynik pełnego przebiegu (ok. 30 s): **14 passed, 5 failed, 3 skipped**. Kod wyjścia 1 jest prawidłowy: oznacza błędy aplikacji wykryte przez testy, a nie niedziałające testy. „Skipped” to 3 testy rezerwacji ze statusem BLOCKED (strona rezerwacji się nie otwiera, DEF-01).

## 3. Gdzie jest kod testów

| Katalog (w `05_Automation`) | Zawartość |
|---|---|
| `tests/api.spec.ts`, `tests/ui.spec.ts` | Scenariusze testów i jawne asercje |
| `api/clients/` | Klienci API: logowanie, pokoje, wiadomości, rezerwacje |
| `api/data/` | Buildery danych testowych, wyszukiwanie wolnego terminu |
| `api/endpoints.ts`, `api/types.ts` | Ścieżki API i typy odpowiedzi |
| `pages/` | Page Object Model: strona główna, formularz kontaktowy, rezerwacja, logowanie admina |
| `helpers/audit.ts` | Zapis evidence (request, response, asercje, screeny kroków), maskowanie sekretów |

## 4. Pokazanie wyników

```powershell
npm.cmd run report:project   # odświeża 05_Automation/reports/raport-testow.html
npm.cmd run report           # techniczny raport Playwright w przeglądarce
```

`raport-testow.html` otwiera się dwuklikiem: statusy, asercje, request/response i screeny kroków. Prezentacja na zajęcia: `00_Prezentacja.html` (strona główna z odnośnikami do podstron w `prezentacja/`). Przypadki i defekty: `02_TestCases.md`, `04_Defects.md` (katalog główny).

## 5. Krótki pokaz na żywo

```powershell
npx.cmd playwright test --project=api --grep "API-05|API-09"
npx.cmd playwright test --project=ui-chrome --grep "UI-05"
```

- **API-05** – wiadomość ze złym emailem: odrzucona (400) i niezapisana – PASS.
- **API-09** – pełny cykl wiadomości: tworzenie działa, odczyt, zmiana i usunięcie po ID zwracają 500 – FAIL.
- **UI-05** – test w modelu Page Object Model: temat z 4 znaków odrzucony z komunikatem – PASS.

Pokaz podzbioru nadpisuje raport ostatniego uruchomienia – po pokazie uruchom ponownie `npm.cmd test`.

## 6. Odtworzenie dokumentów po nowym przebiegu

Z katalogu głównego repozytorium (Python z pakietem `reportlab`):

```powershell
node supporting/tools/collect-results.mjs        # metryki, przypadki, defekty, macierze
python supporting/tools/build-pdf.py             # 01, 03, 06 (PDF)
node supporting/tools/build-tables-md.mjs        # 02, 04 (Markdown)
node supporting/tools/build-html-report.mjs      # raport z testów
node supporting/tools/build-presentation.mjs     # 00_Prezentacja.html + prezentacja/*.html
```

## 7. Gdy coś nie działa

| Objaw | Rozwiązanie |
|---|---|
| Brak Google Chrome | `npx.cmd playwright install chromium`, potem `$env:BROWSER_CHANNEL='chromium'` |
| API-09 i API-10 mają status BLOCKED | Nie ustawiono `QA_USERNAME` / `QA_PASSWORD` w bieżącej sesji |
| Inne wyniki niż 14 / 5 / 3 | Publiczna aplikacja jest resetowana i może się zmieniać – sprawdź raport, nie zmieniaj asercji pod wynik |
| `npm test` zmienił pliki w `evidence/` i `reports/` | To normalne – każdy przebieg nadpisuje dowody; commituj tylko przebieg, który ma być wynikiem projektu |
