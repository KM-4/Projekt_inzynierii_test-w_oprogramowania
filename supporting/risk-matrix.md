# Analiza ryzyka

Skala P: 1 mało prawdopodobne, 2 możliwe, 3 prawdopodobne. I: 1 ograniczony UX, 2 istotna funkcja/dane, 3 kluczowy proces lub uprawnienia. P×I: 1–2 niski, 3–4 średni, 6–9 wysoki. P1 obejmuje ryzyka o I=3 (rezerwacja, daty, uprawnienia) i niezbędne zależności procesu. P2 obejmuje lokalną walidację kontaktu i katalog o I=2. Przy równym P×I wyższy wpływ ma pierwszeństwo. R-06 ma wspólne zabezpieczenia w każdym teście zapisu; nie zmienia automatycznie priorytetu podstawowego celu przypadku.

| ID | Obszar / potencjalna awaria | P | I | P×I | Priorytet i uzasadnienie | Przypadki |
|---|---|---|---|---|---|---|
| R-01 | Rezerwacja: Gość nie może otworzyć formularza lub zakończyć rezerwacji mimo dostępnego pokoju. | 3 | 3 | 9 | Główny cel biznesowy B&B. Najpierw testy P1 dostępności, szczegółów i cyklu rezerwacji. | UI-08, UI-09, UI-10, UI-12, API-02, API-10 |
| R-02 | Katalog: Lista, szczegóły i ceny pokoju są niespójne lub błędnie obsługują brak zasobu. | 2 | 2 | 4 | Błędna oferta utrudnia wybór; szczegóły są też zależnością rezerwacji. | UI-01, API-01, API-02, API-03 |
| R-03 | Walidacja danych: Puste, za krótkie lub źle typowane dane są akceptowane albo powodują błąd serwera. | 3 | 2 | 6 | P2 dla lokalnej walidacji kontaktu (I=2); przy tym samym P×I wyższy wpływ I=3 rezerwacji i uprawnień daje P1. EP/BVA/DT ograniczają ryzyko błędnego zapisu. | UI-02, UI-03, UI-04, UI-05, UI-06, UI-07, UI-09, API-04, API-05, API-06, API-09 |
| R-04 | Uprawnienia: Osoba bez poprawnego konta uzyskuje dostęp do rezerwacji lub operacji administracyjnych. | 2 | 3 | 6 | Dane gości i stan administracyjny wymagają kontroli dostępu. Negatywne testy P1. | UI-11, API-07, API-08, API-09, API-10 |
| R-05 | Daty i naliczenia: Wybrany okres zmienia się pomiędzy UI, requestem i rezerwacją albo cena używa złej liczby nocy. | 2 | 3 | 6 | Błąd daty lub ceny dotyka terminu pobytu i płatności. Weryfikacja w strefie Europe/Warsaw. | UI-08, UI-10, UI-12 |
| R-06 | Stan i izolacja: Reset usuwa dane w połowie testu; awaria sprzątania pozostawia rekordy; współbieżny użytkownik zmienia stan. | 3 | 2 | 6 | Ryzyko przekrojowe: świeży stan, jeden worker, markery QA i cleanup w każdym teście zapisu. Priorytet przypadku wynika z procesu: rezerwacja P1, kontakt P2. | UI-02, UI-06, API-09, API-10 |

Ryzyko jest hipotezą planistyczną; potwierdzone defekty są osobno w 04_Defects.xlsx. Kolejność wykonania techniczna może zaczynać od odczytów API, które przygotowują stan do testów P1.
