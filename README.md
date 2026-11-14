# Projekt zespołowy – Inżynieria testów oprogramowania

Projekt testowy aplikacji **Restful-Booker-Platform** (https://automationintesting.online/, UI v2.2) – strony pensjonatu, na której gość przegląda pokoje, rezerwuje pobyt i wysyła wiadomość, a administrator loguje się do panelu.

Cel: ocenić, czy gość może znaleźć i zarezerwować pokój, czy aplikacja poprawnie waliduje dane i czy panel administratora jest chroniony, oraz wydać rekomendację Go / Conditional Go / No-Go opartą na wynikach testów.

## Zespół

| Imię i nazwisko | Nr albumu | Rola | Odpowiada za |
|---|---|---|---|
| Kamil Andrzejewski | 83741 | Test lead i koordynacja | Plan testów, analiza ryzyka, spójność artefaktów, Test Summary i rekomendacja |
| Karol Myszkowski | 77514 | Projekt testów | Przypadki testowe, techniki EP / BVA / DT, testy eksploracyjne |
| Kacper Walkowiak | 77519 | Wykonanie testów | Statusy przypadków, evidence, raporty defektów |
| Mateusz Krzyzak | 77862 | API i automatyzacja | Testy API, automatyzacja w Playwright, raporty z uruchomień |

Materiały i kod automatyzacji przygotowano z pomocą asystenta AI.

## Zawartość repozytorium

| Plik / katalog | Zawartość |
|---|---|
| [`00_Prezentacja.html`](00_Prezentacja.html) | Raport z projektu do prezentacji na zajęciach |
| [`01_TestPlan.pdf`](01_TestPlan.pdf) | Plan testów: zakres, środowisko, kryteria, 6 ryzyk ocenionych P × I |
| [`02_TestCases.md`](02_TestCases.md) | 22 przypadki testowe (12 UI, 10 API) z wynikami i odsyłaczami do evidence |
| [`03_Exploratory.md`](03_Exploratory.md) / `.pdf` | Charter i notatka z sesji eksploracyjnej |
| [`04_Defects.md`](04_Defects.md) | 4 unikalne raporty defektów ze skalą severity / priority |
| [`05_Automation/`](05_Automation/README.md) | Testy automatyczne (Playwright + TypeScript): 10 testów API i 12 testów UI w modelu Page Object Model, raporty z uruchomień |
| [`06_TestSummaryReport.pdf`](06_TestSummaryReport.pdf) | Raport końcowy: metryki, ryzyka, rekomendacja |
| [`RUNBOOK.md`](RUNBOOK.md) | Jak uruchomić testy, pokazać wyniki i odtworzyć dokumenty |
| `evidence/` | Dowody wykonania: request / response / asercje (API), screeny kroków (UI), eksploracja |
| `supporting/` | Ryzyka, techniki, macierz śledzenia, dane JSON, źródła SUT, skrypty generujące dokumenty |

## Wyniki

| Planowane | Wykonane | PASS | FAIL | BLOCKED | NOT RUN |
|---:|---:|---:|---:|---:|---:|
| 22 | 19 | 14 | 5 | 3 | 0 |

Pełny przebieg: 14.11.2026, Chrome, Playwright 1.62.1. Wyniki z dowodami: [`05_Automation/reports/raport-testow.html`](05_Automation/reports/raport-testow.html).

Znalezione defekty: 4 (krytyczny 1, poważny 1, średni 2). Najważniejszy: trasy API z identyfikatorem (`/{id}`) zwracają HTTP 500, przez co strona rezerwacji się nie otwiera.

**Rekomendacja: NO-GO** – gość nie może zarezerwować pokoju, więc nie działa główna funkcja aplikacji. Uzasadnienie i warunki zmiany decyzji: [`06_TestSummaryReport.pdf`](06_TestSummaryReport.pdf).

## Uruchomienie

Instrukcja krok po kroku: [`RUNBOOK.md`](RUNBOOK.md). W skrócie, w folderze `05_Automation`: `npm.cmd ci`, ustawienie `QA_USERNAME` i `QA_PASSWORD` w sesji terminala, `npm.cmd test`.
