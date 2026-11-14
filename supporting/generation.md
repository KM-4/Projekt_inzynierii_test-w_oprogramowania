# Przeliczanie danych i dokumentów

Dokumenty wynikowe (PDF, XLSX, metryki, macierze) odtwarza się z ostatniego pełnego przebiegu skryptami z `supporting/tools/`. Zmiana samych liczb w PDF bez nowego przebiegu jest nieprawidłowa. Wszystkie polecenia uruchamiaj z katalogu głównego repozytorium (inny katalog: zmienna `QA_PROJECT_DIR`).

1. Pełny przebieg: `npm.cmd test` w `05_Automation` zgodnie z `05_Automation/README.md`. Podzbiory testów nie wystarczają do metryk 22 TC. Przebieg nadpisuje `evidence/api`, `evidence/ui` i `05_Automation/reports`.
2. `node supporting/tools/collect-results.mjs`: z `case-results.json` i evidence przelicza `test-cases.json`, `executed-cases.json`, `metrics.json`, `defects.json` (DEF-01/02 z przebiegu, DEF-03/04 z `exploration-defects.json`) oraz macierze śledzenia i ryzyk. Nie zamienia awarii na PASS.
3. `python supporting/tools/build-pdf.py` (Python + ReportLab, fonty Arial z Windows): generuje 01, 03 i 06 z plików JSON, w tym skład zespołu z `team.json`.
4. `python supporting/tools/update-xlsx.py` (openpyxl): aktualizuje 02_TestCases.xlsx i 04_Defects.xlsx na miejscu, zachowując układ, style, tabele i formuły.
5. `node supporting/tools/build-html-report.mjs`: raport z testów w HTML (`05_Automation/reports/raport-testow.html`) z tych samych danych.
6. `node supporting/tools/build-presentation.mjs`: raport-artykuł do prezentowania na obronie `00_Prezentacja.html`.

Zmiana objawów SUT wymaga merytorycznej weryfikacji zgłoszeń defektów i rekomendacji, a nie tylko przeliczenia liczb. Dane zespołu i wkład muszą odzwierciedlać rzeczywistość.

Sesja eksploracyjna EXP-02: `03_Exploratory.md` oraz dziennik `evidence/exploratory/session.json`.
