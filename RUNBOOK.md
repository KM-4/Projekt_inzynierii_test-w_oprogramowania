# Runbook – uruchomienie testów i pokaz wyników

## 1. Przygotowanie (jednorazowo)

Wymagane: Node.js 22+, Google Chrome, dostęp do Internetu.

```powershell
git clone https://github.com/KM-4/Projekt_inzynierii_test-w_oprogramowania.git
cd Projekt_inzynierii_test-w_oprogramowania\05_Automation
npm.cmd ci --ignore-scripts --no-audit --no-fund
```

## 2. Uruchomienie wszystkich testów

Dane administratora: sekcja Login w https://github.com/mwinteringham/restful-booker-platform#login. Ustaw je tylko w bieżącej sesji terminala, nie zapisuj w plikach.

```powershell
$env:QA_USERNAME='<login>'
$env:QA_PASSWORD='<hasło>'
npm.cmd test
```

Oczekiwany wynik (ok. 30 s): **14 passed, 5 failed, 3 skipped**. Kod wyjścia 1 jest prawidłowy: oznacza błędy aplikacji wykryte przez testy, a nie niedziałające testy. „Skipped” to 3 testy rezerwacji ze statusem BLOCKED (strona rezerwacji się nie otwiera, DEF-01).

## 3. Pokazanie wyników

```powershell
npm.cmd run report:project   # odświeża 05_Automation/reports/raport-testow.html
npm.cmd run report           # techniczny raport Playwright w przeglądarce
```

`raport-testow.html` otwiera się dwuklikiem: statusy, asercje, request/response i screeny kroków. Prezentacja na zajęcia: `00_Prezentacja.html` w katalogu głównym.

## 4. Krótki pokaz na żywo

```powershell
npx.cmd playwright test --project=api --grep "API-04|API-09"
```

API-04 (pusta wiadomość, odrzucona – PASS) i API-09 (pełny cykl wiadomości, PUT i DELETE zwracają 500 – FAIL). Uwaga: pokaz podzbioru nadpisuje raport ostatniego uruchomienia – po pokazie uruchom ponownie `npm.cmd test`.

## 5. Odtworzenie dokumentów po nowym przebiegu

Z katalogu głównego repozytorium (Python z pakietami `reportlab` i `openpyxl`):

```powershell
node supporting/tools/collect-results.mjs        # metryki, przypadki, defekty, macierze
python supporting/tools/build-pdf.py             # 01, 03, 06 (PDF)
python supporting/tools/update-xlsx.py           # 02, 04 (XLSX)
node supporting/tools/build-html-report.mjs      # raport z testów
node supporting/tools/build-presentation.mjs     # 00_Prezentacja.html
```

## 6. Gdy coś nie działa

| Objaw | Rozwiązanie |
|---|---|
| Brak Google Chrome | `npx.cmd playwright install chromium`, potem `$env:BROWSER_CHANNEL='chromium'` |
| API-09 i API-10 mają status BLOCKED | Nie ustawiono `QA_USERNAME` / `QA_PASSWORD` w bieżącej sesji |
| Inne wyniki niż 14 / 5 / 3 | Publiczna aplikacja jest resetowana i może się zmieniać – sprawdź raport, nie zmieniaj asercji pod wynik |
| `npm test` zmienił pliki w `evidence/` i `reports/` | To normalne – każdy przebieg nadpisuje dowody; commituj tylko przebieg, który ma być wynikiem projektu |
