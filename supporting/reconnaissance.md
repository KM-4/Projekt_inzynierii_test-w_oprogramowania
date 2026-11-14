# Rozpoznanie SUT

Data: 13.11.2026, Europe/Warsaw. SUT: https://automationintesting.online/; stopka aplikacji podaje restful-booker-platform v2.2. Wersja wdrożonego backendu i jej commit nie są publicznie potwierdzone. Referencyjny commit kodu: `sources/repository.json`.

## Przepływy użytkownika

1. Gość otwiera stronę, przegląda typy Single, Double i Suite, ceny oraz udogodnienia. Wybiera daty, uruchamia Check Availability i przechodzi linkiem Book now do dynamicznego ID pokoju.
2. Strona rezerwacji powinna prezentować kalendarz i cenę; pierwsze Reserve Now otwiera dane gościa, drugie wysyła rezerwację. W badanym wdrożeniu odczyt szczegółów zwracał 500 i blokował ten przepływ. Dalszy przebieg zrekonstruowano z kodu; nie twierdzimy, że został wykonany w UI.
3. Formularz Send Us a Message wysyła Name, Email, Phone, Subject i Message. Działa wysłanie poprawnej wiadomości, walidacja błędnych danych i ekran potwierdzenia.
4. Administrator otwiera /admin i loguje się. Odrzucenie błędnych danych potwierdzono w UI. Poprawne logowanie potwierdzono przez API. Operacje list oraz szczegółów rozpatrujemy osobno, ponieważ ich zachowanie się różni.

## Zweryfikowane operacje publicznego proxy

| Operacja | Dane / auth | Oczekiwanie kontraktu | Obserwacja w przebiegach |
|---|---|---|---|
| GET /api/room | brak auth | 200, obiekt rooms | 200 |
| GET /api/room?checkin=&checkout= | YYYY-MM-DD | 200, rooms | 200 również dla zerowego i odwróconego okresu; pytanie o wymagania |
| GET /api/room/<id> | aktualne ID / nieistniejące ID | 200 / 404 | 500 tekst Internal Server Error |
| POST /api/message | name,email,phone,subject,description | 200 success=true; 400 walidacji | poprawne i brakujące pola zgodne; email jako obiekt daje 500 |
| GET /api/message | brak auth | 200, messages z id,name,read,subject | 200; nie pobieramy szczegółów cudzych wiadomości |
| GET /api/message/<id> | Cookie token, własny zasób | 200, Message | 500 |
| PUT /api/message/<id> | Cookie token, własny zasób | 200, success=true | zaplanowane; wcześniejszy GET blokuje krok w API-09 |
| DELETE /api/message/<id> | Cookie token, tylko własne ID | 200, success=true | 500 w cleanup |
| POST /api/auth/login | username,password | 200 token / 401 błędne dane | oba warianty potwierdzone; token maskowany |
| GET /api/booking?roomid= | Cookie token i parametr roomid | 200; bez tokenu 401 | oba warianty potwierdzone |
| POST /api/booking | roomid,firstname,lastname,depositpaid,bookingdates,email,phone | 201 z rezerwacją | 201, własny rekord obecny na liście |
| POST /api/booking, błędne daty | poprawne pola gościa; checkout <= checkin | 409 według DateCheckValidator i BookingService | 409 dla dat równych i odwróconych; zły format daty oraz pusty payload dają 400 w eksploracji |
| GET /api/booking/<id> | Cookie token, własne ID | 200 | 500 |
| PUT /api/booking/<id> | Cookie token, pełny payload | 200 success=true | 500 w API-10 (14.11.2026); zmiana nieutrwalona |
| DELETE /api/booking/<id> | Cookie token, tylko własny zasób | 200 success=true | 500 w cleanup |

Początkowy sondaż GET /api/auth/validate dał 405. Nie używamy go do logowania i nie uznajemy nieobsługiwanej metody za defekt. Nie testujemy odrębnego projektu restful-booker.herokuapp.com.

## Źródła i granice wiedzy

- Prezentacja prowadzącego, 19 stron, wymagania projektu i rubryka oceny.
- Oficjalne repozytorium https://github.com/mwinteringham/restful-booker-platform: kontrakty modeli, kontrolery i proxy Next.js. Pobrano jedynie pliki produkcyjne; testów internetowych nie kopiowano.
- https://www.postman.com/automation-in-testing/restful-booker-collections/overview: rozróżnienie projektów i deklaracja resetowania co 10 minut. Nie traktujemy tej informacji jako pomiaru częstotliwości dla każdego mikroserwisu.
- Rzeczywiste request/response, timestampy, screenshoty i trace w evidence oraz raportach runnera są źródłem wyników.

Publiczny stan jest współdzielony, reset może przebiegać osobno dla usług. Nie znamy SLA, konfiguracji wdrożenia ani pełnej specyfikacji domenowej. Kod `trunk` może wyprzedzać wdrożenie. Wnioski o wspólnej przyczynie błędów tras ID są hipotezą diagnostyczną, nie potwierdzonym root cause.

Eksploracja potwierdziła istotną różnicę: wyszukiwanie akceptuje checkout <= checkin (200), natomiast próba utworzenia pobytu z takimi datami jest odrzucana 409. Nie stwierdzono utrwalenia niepoprawnego okresu. Q-01 dotyczy więc ergonomii i wymagań wyszukiwania, a nie braku walidacji zapisu.
