# Przeliczanie danych i dokumentów

Pierwotną migawkę wygenerowano automatycznie z ostatniego pełnego przebiegu. Dane wejściowe i narzędzia znajdują się w `supporting/tools/`; wymagania merytoryczne mają źródło w prezentacji i analizie SUT. Zmiana samych liczb w PDF bez nowego runnera jest nieprawidłowa.

1. Wykonaj pełne `npm.cmd test` zgodnie z 05_Automation/README.md. Podzbiory nie wystarczą do metryk 22 TC.
2. Z folderu nadrzędnego zawierającego QA-Project uruchom `node QA-Project/supporting/tools/collect-results.mjs`. Skrypt wymaga kompletu ID i wylicza metryki, a także generuje macierz śledzenia i ryzyk. Nie zamienia awarii na PASS. Dwa defekty w skrypcie oraz dwa z exploration-defects.json odpowiadają tej migawce: po zmianie objawów trzeba zweryfikować zgłoszenia i rekomendację merytorycznie.
3. Do budowy PDF potrzebny jest Python z ReportLab i fonty Arial w Windows. `python QA-Project/supporting/tools/build-pdf.py` odczytuje JSON, nie wpisuje wyników ręcznie. Przed tym trzeba zamknąć i opisać rzeczywistą sesję eksploracyjną.
4. XLSX utworzono przy użyciu dostarczonego środowiska `@oai/artifact-tool`. Skrypt `build-xlsx.mjs` korzysta z tego pakietu. Nie jest to dodatkowa zależność automatyzacji testów. Do odtworzenia w Codex użyj bundlowanego runtime; poza nim potrzebny jest dostęp do tej biblioteki albo jawna konwersja danych JSON do arkusza innym narzędziem. Nie wymagamy jej do `npm ci` i wykonania testów.
5. `audit.py` używa pypdf i openpyxl wyłącznie do odczytu/weryfikacji oraz JSON. Sprawdza identyfikatory, wyniki, linki, formuły, filtry, metryki i strony PDF. Wizualne rendery należy sprawdzić osobno.

Skrypty dokumentacyjne uruchamiaj z folderu nadrzędnego wobec QA-Project. Node może otrzymać `QA_PROJECT_DIR` dla innej ścieżki w builderze XLSX; pozostałe skrypty zachowują domyślną strukturę paczki. Nie są potrzebne do zwykłego uruchomienia testów na czystym środowisku.

Przy pracach nad eksploracją nie uruchamiaj `start` na istniejącym dzienniku, jeśli chcesz zachować historię. Zachowaj starą sesję i utwórz osobną nazwę/ścieżkę. Dziennika nie należy cofać w czasie. Wszystkie dane zespołu i wkład muszą odzwierciedlać rzeczywistość.

Aktualna zakończona sesja to EXP-02 (30 min 36 s), evidence/exploratory/session.json. EXP-01 i jej starsze narzędzia zachowano jako archiwum. Nie uruchamiaj starego generatora EXP-01 na pliku EXP-02. Aktualne opracowanie i dane studenta są w 03_Exploratory.md, team.json oraz exploration-report.json.
