# Obrona projektu - scenariusz na 6 minut

Student: **Kamil Andrzejewski, nr studenta 83741**.

Skład i faktyczny wkład: uzupełnia zespół; nie przypisano fikcyjnie autorstwa ani wykonania. Materiały i automatyzację przygotowano z pomocą asystenta. Każda osoba powinna samodzielnie odtworzyć przypisaną część i umieć wyjaśnić ograniczenia.

## Podział wypowiedzi

| Czas | Osoba | Treść i materiał do pokazania |
|---|---|---|
| 0:00–0:50 | Kamil Andrzejewski (83741) | Cel i SUT: publiczny Restful-Booker-Platform, nie Restful-Booker. Zakres obejmuje pokoje, kontakt, rezerwacje i auth. Pokaż 01_TestPlan.pdf. |
| 0:50–1:40 | Kamil Andrzejewski (83741) | Ryzyko R-01: bez rezerwacji gość nie osiąga celu. Dlatego szczegóły, daty i proces rezerwacji mają P1. Publiczne resety wymagają dynamicznego stanu. |
| 1:40–2:40 | Osoba 2: [imię i nazwisko] | EP: email poprawny, błędny format, błędny typ. BVA: temat 4/5 znaków, limit 5–100 z modelu i komunikatu walidacji. DT: cztery kombinacje poprawności email i subject w UI-02, UI-04 i UI-05. Pokaż tabelę technik i XLSX. |
| 2:40–3:40 | Osoba 3: [imię i nazwisko] | Pokaż API-04: POST /api/message z {}, HTTP 400, błędy wymaganych pól i jawne asercje w evidence/api/API-04.json. Następnie API-02: ID z listy, oczekiwane 200, faktyczne 500. |
| 3:40–4:40 | Osoba 3 lub 4: [imię i nazwisko] | Pokaż kod Playwright, worker=1, retries=0, raport HTML, screenshot i trace. Wyjaśnij różnicę FAIL a BLOCKED. Uruchom wcześniej przygotowane polecenie z README. |
| 4:40–5:30 | Osoba 4 lub 2 | Wyniki: 22 planowane, 19 wykonane, 12 PASS, 7 FAIL, 3 BLOCKED, 0 NOT RUN. Cztery unikalne defekty: S1=1, S2=1, S3=2. EXP-02 trwała 30 minut 36 sekund; nowy problem dat ujawnił się w UTC+14. Nie liczysz każdego 500 osobno. W UI-02/UI-06 przyjęcie wiadomości przeszło; status FAIL wynika z cleanup. |
| 5:30–6:10 | Kamil Andrzejewski (83741) | Rekomendacja NO-GO dla gotowości funkcjonalnej tego wdrożenia. Warunki zmiany decyzji: naprawa tras ID, retest rezerwacji i nieosiągniętych PUT, weryfikacja sprzątania oraz akceptacja ryzyk. |

W zespole 3-osobowym osoba 3 łączy API i automatyzację; osoba 2 prezentuje wyniki. Nie skracaj dyskusji ograniczeń tylko po to, aby przedstawić wszystkie screeny.

## Pokaz techniczny

1. Przed obroną rozpakuj paczkę i wykonaj `npm.cmd ci --ignore-scripts --no-audit --no-fund` z folderu 05_Automation. Ustaw zmienne z README. Pełny bieżący raport zarchiwizuj osobno, jeśli chcesz zachować migawkę oddaną do oceny.
2. Otwórz `npm.cmd run report`. Przejdź do pozytywnego UI-01, negatywnego API-04, walidacji API-01 i błędu API-02.
3. Do krótkiego pokazu uruchom `npx.cmd playwright test --project=api --grep 'API-01|API-04'`. Uwaga: to nadpisuje raport ostatniego uruchomienia podzbiorem. Nie aktualizuj po takim pokazie metryk całego projektu bez pełnego przebiegu.
4. W evidence API pokaż request, status, response i listę assertions. Dane logowania i tokeny są maskowane. Nie odczytuj ani nie pokazuj tokenów na żywo.

## Najważniejsze odpowiedzi

**Czy FAIL automatyzacji oznacza, że automatyzacja nie działa?** Nie. Runner uruchomił test, zapisał odpowiedź i wykazał niezgodność z kontraktem. Kod 1 jest oczekiwanym rezultatem wykrycia awarii SUT. Błędu testu nie ukrywamy; odróżniamy go na podstawie dowodów.

**Dlaczego 3 BLOCKED, skoro runner pokazał skipped?** Skip jest technicznym sposobem zatrzymania testu zależnego. Dla UI-08..10 wykonano preflight, który potwierdził 500 szczegółów pokoju. Własne kroki rezerwacji nie były osiągalne. Raport domenowy mapuje ten uzasadniony skip na BLOCKED, nie na PASS.

**Dlaczego metryka executed wynosi 19, a nie 22?** Executed zdefiniowano jako PASS+FAIL. Trzy zablokowane przypadki miały próbę wejścia, ale nie wykonano właściwych kroków. Suma PASS+FAIL+BLOCKED+NOT RUN daje planned.

**Dlaczego UI-06 jest FAIL mimo przyjęcia 5 znaków?** Asercja granicy i potwierdzenie zadziałały. Scenariusz obejmuje też izolację danych; DELETE własnego rekordu dał 500. Actual result pokazuje obie obserwacje. Nie zmieniliśmy statusu na PASS, aby poprawić wynik.

**Skąd limit 5–100 znaków?** Z adnotacji Size modelu Message w referencyjnym kodzie i z komunikatów żywego API. Nie wybraliśmy arbitralnej długości.

**Jakie granice zostały sprawdzone?** W TC mamy temat 4/5 i telefon 10/11. Sesja EXP-02 uzupełniła oba końce trzech przedziałów: temat 4/5/100/101, telefon 10/11/21/22, opis 19/20/2000/2001. To nadal nie oznacza pełnego pokrycia wszystkich pól i Unicode.

**Skąd cztery defekty?** DEF-01 grupuje trasy z ID, DEF-02 złe wejścia POST wiadomości, DEF-03 niepoprawny token kolekcji, DEF-04 różnicę dat między polami/linkami i wyszukiwaniem w UTC+14. Nie liczymy powtórzeń jako nowych bugów. Dwa ostatnie odkryto w oddzielnej EXP-02; 22 TC zachowują wyniki wcześniejszego pełnego przebiegu.

**Czy API-09 i API-10 dowodzą aktualizacji?** Kod PUT istnieje, lecz w wykonaniu nie został osiągnięty po FAIL GET. Utworzenie i obecność na liście potwierdzono; aktualizacja pozostaje ryzykiem do retestu.

**Czy reverse dates oznaczają potwierdzony błąd rezerwacji?** Nie. Wyszukiwanie przyjęło taki zakres, ale nie utworzono rezerwacji z odwróconymi datami. To obserwacja i pytanie o wymagania. Nie utożsamiamy braku blokady w wyszukiwaniu z utrwaleniem błędnej rezerwacji.

**Dlaczego NO-GO w aplikacji szkoleniowej?** Jest to ocena gotowości funkcjonalnej badanej migawki, nie decyzja o zamknięciu serwisu szkoleniowego. Główny proces gościa nie działał. Zielone testy kontaktu nie równoważą tej blokady.

**Jak poradziliście sobie z resetami?** Pobieranie ID z bieżących list, unikalne markery i aktualny token, jeden worker, brak ponawiania zapisów. Zniknięcia rekordu nie tłumaczymy automatycznie skutecznym DELETE: sprawdzamy status oraz czas.

**Kto co wykonał?** Zespół powinien uzupełnić README na podstawie rzeczywiście wykonanej pracy i przygotowania do obrony. Nie przypisano członkom wykonania testów przez asystenta.

## Checklista przed obroną

- [ ] Uzupełniony numer zespołu i prawdziwe dane 3–4 osób.
- [ ] Każda osoba potrafi samodzielnie uruchomić przypisane testy.
- [ ] Znana różnica pomiędzy wynikami oddanej migawki a bieżącym stanem publicznego SUT.
- [ ] Pełna sekwencja rezerwacji i PUT powtórzona po naprawie środowiska, jeśli naprawa nastąpi.
- [x] Wydzielona EXP-02 wykonana i opisana: 30 minut 36 sekund. Przed obroną zespół zapoznaje się z rzeczywistym dziennikiem i operatorem sesji.
- [ ] Nazwa paczki zmieniona zgodnie z konwencją prowadzącego.
