# Projekt zespołowy - Inżynieria testów oprogramowania

**Na obronę:** [`00_Prezentacja.html`](00_Prezentacja.html) – raport z projektu w prostym języku, rozdziały według osób, z ilustracjami i słowniczkiem.

SUT: **Restful-Booker-Platform**, https://automationintesting.online/ (UI v2.2). Projekt obejmuje analizę ryzyka, autorskie przypadki, testy UI/API, dowody, eksplorację, defekty i rekomendację. Nie jest to odrębny Restful-Booker.

## Wynik ostatniego pełnego uruchomienia

| Planowane | Wykonane (PASS+FAIL) | PASS | FAIL | BLOCKED | NOT RUN |
|---:|---:|---:|---:|---:|---:|
| 22 | 19 | 14 | 5 | 3 | 0 |

**Raport z testów w przeglądarce:** [`05_Automation/reports/raport-testow.html`](05_Automation/reports/raport-testow.html) (otwórz dwuklikiem; filtry statusów, asercje, request/response, screeny, defekty). Techniczny raport runnera: `npm.cmd run report` w `05_Automation`.

Pełny przebieg: **14.11.2026 09:54:18–09:54:48 CET (Europe/Warsaw)**. Podstawa metryk: `supporting/metrics.json` oraz `05_Automation/reports/case-results.json`.

12 przypadków UI, 10 API, 12 negatywnych. Cztery unikalne raporty defektów: S1=1, S2=1, S3=2, S4=0 (DEF-01 i DEF-02 z przypadków testowych, DEF-03 i DEF-04 z eksploracji). Rekomendacja **NO-GO**: trasy API z identyfikatorem (`/{id}`) zwracają HTTP 500, co blokuje rezerwację gościa (DEF-01, S1). Automatyzacja uruchamia się na czystym środowisku i wykrywa awarie SUT; kod wyjścia 1 oznacza wykryte FAIL, a nie niedziałające testy.

### Zmiany projektu testów 14.11.2026 (względem migawki z 13.11.2026: 12/7/3)

- **API-09/API-10:** odczyt po ID jest asercją miękką, więc krok **PUT (zmień → potwierdź zmianę)** jest teraz wykonywany i weryfikowany przez listę. Wynik: PUT zwraca 500, zmiana nie jest utrwalona (FAIL, DEF-01).
- **UI-02/UI-06:** sprzątanie własnej wiadomości po teście UI jest **kontrolą informacyjną**. Wynik DELETE (500) jest zapisany w evidence, ale nie decyduje o werdykcie testu formularza. Usuwanie rekordów weryfikuje API-09. Stąd zmiana FAIL → PASS dla UI-02 i UI-06; to zmiana wyroczni testu, a nie korekta wyniku SUT.
- **Asercje API dopasowane do oczekiwanego rezultatu TC:** API-01 sprawdza typy wszystkich kluczowych pól, API-04 komunikaty dla pięciu wymaganych pól, API-05/06 brak zapisu odrzuconego rekordu.
- Reporter zapisuje wszystkie niezgodności przypadku, a nie tylko pierwszą.

## Skład zespołu i wkład

| Imię i nazwisko | Nr albumu | Rola | Odpowiada za | Na obronie przedstawia |
|---|---|---|---|---|
| Kamil Andrzejewski | 83741 | Test lead i koordynacja | Plan testów (zakres, środowisko, kryteria wejścia i zakończenia), analiza ryzyka P×I, spójność wszystkich artefaktów, Test Summary i rekomendacja NO-GO (`01_TestPlan.pdf`, `06_TestSummaryReport.pdf`, `supporting/risk-matrix.md`) | Rozdział 1 „Co testowaliśmy i gdzie widzieliśmy największe ryzyko” oraz rozdział 5 „Decyzja i jej uzasadnienie” |
| Karol Myszkowski | 77514 | Projekt testów | 22 przypadki testowe i ich powiązanie z ryzykami, techniki EP / BVA / DT, charter i notatka z testów eksploracyjnych (`02_TestCases.xlsx`, `supporting/test-design-techniques.md`, `03_Exploratory`) | Rozdział 2 „Jak zaprojektowaliśmy testy” |
| Kacper Walkowiak | 77519 | Wykonanie testów, evidence i defekty | Statusy wszystkich przypadków, dowody wykonania (evidence UI/API), raporty defektów z severity i priority (`04_Defects.xlsx`, `evidence/`, `05_Automation/reports/raport-testow.html`) | Rozdział 3 „Co wyszło z testów i jakie błędy znaleźliśmy” |
| Mateusz Krzyzak | 77862 | API i automatyzacja | 10 przypadków API i automatyzacja w Playwright (`05_Automation/`). Weryfikacja projektu i uruchomienie automatyzacji na czystym środowisku, rozszerzenie testów API (krok PUT w API-09/10, asercje zgodne z przypadkami), screeny kroków UI, finalny przebieg 14.11.2026 i odtworzenie dokumentów | Rozdział 4 „Testy API i automatyzacja” |

**Wykorzystanie asystenta AI:** materiały, kod automatyzacji, pierwsze przebiegi i uzupełniająca sesja EXP-02 powstały z pomocą asystenta AI. Każda osoba odpowiada za swój obszar: rozumie jego treść, potrafi go odtworzyć i obronić.

## Pliki i kolejność czytania

1. `01_TestPlan.pdf`: plan i sześć ryzyk P×I, 2 strony.
2. `02_TestCases.xlsx`: podsumowanie, 12 UI i 10 API z danymi, krokami, oczekiwanym i rzeczywistym wynikiem, statusem, defektem i odsyłaczem do evidence.
3. `03_Exploratory.md` i `.pdf`: sesja eksploracyjna zespołu oraz uzupełniająca EXP-02.
4. `04_Defects.xlsx`: cztery unikalne raporty i skale severity/priority.
5. `05_Automation/README.md`: instalacja i uruchomienie; `reports/html/`, JSON/JUnit i artefakty runnera.
6. `06_TestSummaryReport.pdf`: metryki, ograniczenia, ryzyka i decyzja, 3 strony.
7. `evidence/`: JSON z request/response/asercjami (API), screeny i JSON (UI), eksploracja.
8. `supporting/`: ryzyka, techniki EP/BVA/DT, macierz śledzenia, źródła SUT, dane JSON i skrypty odtwarzające dokumenty (`supporting/generation.md`).

`PASS` oznacza zgodność wykonanych asercji; `FAIL` potwierdzoną niezgodność; `BLOCKED` niedostępny warunek potrzebny do wykonania kroków (runnerowy skip z jawnym powodem); `NOT RUN` brak wykonania. Eksploracja nie jest doliczana do minimum przypadków.

## Szybki start (PowerShell)

W folderze `05_Automation`:

```powershell
npm.cmd ci --ignore-scripts --no-audit --no-fund
$env:QA_USERNAME='<login z oficjalnej dokumentacji>'
$env:QA_PASSWORD='<hasło z oficjalnej dokumentacji>'
npm.cmd test
npm.cmd run report
```

Wymagane Node >=22, Chrome i Internet. Opis zmiennych: `05_Automation/.env.example`; szczegóły w [instrukcji automatyzacji](05_Automation/README.md). Brak zależności od lokalnych ścieżek, instalacji globalnych i stałych ID; wersje przypięte w `package-lock.json`.

## Ograniczenia

- Publiczny SUT pozostaje uszkodzony (stan potwierdzony 14.11.2026). Po naprawie trzeba wykonać UI-08..10 i ponowić API-09/API-10. Nie wpisywać PASS bez nowego evidence.
- Sekrety i tokeny są maskowane w evidence i raportach. Używane są wyłącznie syntetyczne dane i własne rekordy QA.
- DELETE własnych rekordów zwraca 500, więc dane testowe pozostają do okresowego resetu środowiska.
- Przetestowano Chrome desktop; w eksploracji także strefy UTC i UTC+14. Brak macierzy urządzeń, testów obciążenia, płatności i pentestu.
- Każdy nowy przebieg zastępuje raport runnera i evidence; dokumenty odtwarza się skryptami opisanymi w `supporting/generation.md`.

## Nazwa paczki

Konwencja prowadzącego: `Z##_Nazwisko1_Nazwisko2_Nazwisko3[_Nazwisko4].zip`. Zespół nie ma przydzielonego numeru, więc paczka: `Andrzejewski_Myszkowski_Walkowiak_Krzyzak.zip`. Paczka nie zawiera `node_modules`, `.venv`, cache ani prywatnych plików `.env`.
