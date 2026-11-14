# Przypadki testowe

Zespół: Kamil Andrzejewski (83741), Karol Myszkowski (77514), Kacper Walkowiak (77519), Mateusz Krzyzak (77862). Wyniki z pełnego przebiegu 14.11.2026, 10:54:25 – 14.11.2026, 10:54:52 (Chrome, Playwright 1.62.1, Europe/Warsaw).

## Podsumowanie

| Status | UI | API | Razem |
|---|---:|---:|---:|
| PASS | 9 | 5 | 14 |
| FAIL | 0 | 5 | 5 |
| BLOCKED | 3 | 0 | 3 |
| NOT RUN | 0 | 0 | 0 |
| **Planowane** | 12 | 10 | **22** |

Wykonane (PASS + FAIL): **19** · pokrycie wykonaniem 86,4% · PASS wśród wykonanych 73,7% · przypadki negatywne: 12 · unikalne defekty: 4.

Rekomendacja: **NO-GO** – otwarty defekt krytyczny DEF-01 blokuje rezerwację (ryzyko R-01). Uzasadnienie: [06_TestSummaryReport.pdf](06_TestSummaryReport.pdf).

Statusy: **PASS** – wynik zgodny z oczekiwanym; **FAIL** – potwierdzona niezgodność; **BLOCKED** – kroków nie da się wykonać z powodu przeszkody (jawny powód); **NOT RUN** – niewykonany.

## Lista przypadków

| ID | Nazwa | Typ | Charakter | Priorytet | Ryzyko | Technika | Status | Defekt |
|---|---|---|---|---|---|---|---|---|
| [UI-01](#ui-01) | Katalog pokoi zgodny z aktualnym API | UI | Pozytywny | P2 | R-02 | Porównanie między interfejsami | **PASS** | – |
| [UI-02](#ui-02) | Wysłanie poprawnej wiadomości kontaktowej | UI | Pozytywny | P2 | R-03,R-06 | EP; DT reguła 1; BVA telefon=11 | **PASS** | – |
| [UI-03](#ui-03) | Pusty formularz kontaktowy | UI | Negatywny | P2 | R-03 | EP: brak wymaganych danych | **PASS** | – |
| [UI-04](#ui-04) | Email niepoprawny i kombinacja dwóch błędów | UI | Negatywny | P2 | R-03 | EP; DT reguły 3 i 4 | **PASS** | – |
| [UI-05](#ui-05) | Temat 4 znaki poniżej minimum | UI | Negatywny | P2 | R-03 | BVA: min-1; DT reguła 2 | **PASS** | – |
| [UI-06](#ui-06) | Temat 5 znaków na dolnej granicy | UI | Pozytywny | P2 | R-03,R-06 | BVA: min; EP: poprawne dane | **PASS** | – |
| [UI-07](#ui-07) | Telefon 10 znaków poniżej minimum | UI | Negatywny | P2 | R-03 | BVA: min-1 | **PASS** | – |
| [UI-08](#ui-08) | Cena rezerwacji dwóch nocy | UI | Pozytywny | P1 | R-01,R-05 | Reguła biznesowa / obliczenie ceny | **BLOCKED** | [DEF-01](04_Defects.md#def-01) |
| [UI-09](#ui-09) | Rezerwacja z pustymi danymi gościa | UI | Negatywny | P1 | R-01,R-03 | EP: puste dane obowiązkowe | **BLOCKED** | [DEF-01](04_Defects.md#def-01) |
| [UI-10](#ui-10) | Daty payloadu rezerwacji zgodne z wyborem | UI | Pozytywny | P1 | R-01,R-05 | Spójność danych UI→request | **BLOCKED** | [DEF-01](04_Defects.md#def-01) |
| [UI-11](#ui-11) | Odrzucenie błędnego logowania administratora | UI | Negatywny | P1 | R-04 | EP: niepoprawne credentials | **PASS** | – |
| [UI-12](#ui-12) | Wyszukanie dostępności w poprawnym okresie | UI | Pozytywny | P1 | R-01,R-05 | Spójność parametrów i odpowiedzi | **PASS** | – |
| [API-01](#api-01) | Lista pokoi: schemat, ceny i ID | API | Pozytywny | P2 | R-02 | Walidacja kontraktu | **PASS** | – |
| [API-02](#api-02) | Odczyt szczegółów istniejącego pokoju | API | Pozytywny | P1 | R-01,R-02 | Spójność listy i szczegółów | **FAIL** | [DEF-01](04_Defects.md#def-01) |
| [API-03](#api-03) | Nieistniejący pokój | API | Negatywny | P2 | R-02 | EP: zasób nieistniejący | **FAIL** | [DEF-01](04_Defects.md#def-01) |
| [API-04](#api-04) | Wiadomość bez wymaganych pól | API | Negatywny | P2 | R-03 | EP: brak pól | **PASS** | – |
| [API-05](#api-05) | Niepoprawny format email | API | Negatywny | P2 | R-03 | EP: niepoprawny format | **PASS** | – |
| [API-06](#api-06) | Email jako obiekt JSON zamiast tekstu | API | Negatywny | P2 | R-03 | EP: błędny typ | **FAIL** | [DEF-02](04_Defects.md#def-02) |
| [API-07](#api-07) | Odczyt rezerwacji bez tokenu | API | Negatywny | P1 | R-04 | EP: brak uwierzytelnienia | **PASS** | – |
| [API-08](#api-08) | Niepoprawne credentials | API | Negatywny | P1 | R-04 | EP: odrzucenie dostępu | **PASS** | – |
| [API-09](#api-09) | Wiadomość: create/read/update i sprzątanie | API | Pozytywny | P1 | R-03,R-04,R-06 | Test przejść stanu CRUD | **FAIL** | [DEF-01](04_Defects.md#def-01) |
| [API-10](#api-10) | Rezerwacja: create/read/update i sprzątanie | API | Pozytywny | P1 | R-01,R-04,R-06 | Test przejść stanu CRUD | **FAIL** | [DEF-01](04_Defects.md#def-01) |

## Szczegóły przypadków

### UI-01

**Katalog pokoi zgodny z aktualnym API** · UI · Pozytywny · priorytet P2 · ryzyko R-02 · status **PASS**

- **Cel:** Katalog pokoi zgodny z aktualnym API
- **Obszar:** Katalog
- **Technika:** Porównanie między interfejsami
- **Warunki wstępne:** Publiczna instancja dostępna. Nowy, izolowany kontekst. Brak wymagania stałych ID; pokoje pobierz z aktualnej listy.
- **Dane testowe:** Pokoje z GET /api/room. Ceny i typy pobrane dynamicznie.
- **Kroki:**
  1. GET /api/room: potwierdź 200 i pobierz rooms.
  2. Otwórz stronę główną, poczekaj na sekcję Our Rooms.
  3. Dla pokoi z listy sprawdź typ, cenę za noc i link /reservation/&lt;roomid&gt;.
- **Oczekiwany rezultat:** Widoczne typy i ceny odpowiadają API; linki używają bieżących ID.
- **Rzeczywisty rezultat:**

  ```
  GET /api/room → 200
  Wszystkie jawne asercje i kontrole runnera zakończone pomyślnie.
  ```

- **Evidence:** [UI-01.json](evidence/ui/UI-01.json), [krok-01.png](evidence/ui/UI-01/krok-01.png), [UI-01.png](evidence/ui/UI-01.png)
- **Wykonano:** 14.11.2026, 10:54:29 (2595 ms)

### UI-02

**Wysłanie poprawnej wiadomości kontaktowej** · UI · Pozytywny · priorytet P2 · ryzyko R-03,R-06 · status **PASS**

- **Cel:** Wysłanie poprawnej wiadomości i izolacja danych
- **Obszar:** Kontakt
- **Technika:** EP; DT reguła 1; BVA telefon=11
- **Warunki wstępne:** Publiczna instancja dostępna. Nowy, izolowany kontekst. Brak wymagania stałych ID; pokoje pobierz z aktualnej listy. Ustawione QA_USERNAME/QA_PASSWORD do sprzątania.
- **Dane testowe:** Name=unikalny QA-&lt;czas&gt;-&lt;losowe&gt;; Email=qa-project@example.test; Phone=12345678901 (11 znaków); Subject=Zapytanie &lt;marker&gt;; Message=Wiadomość testowa projektu akademickiego. Dane syntetyczne.
- **Kroki:**
  1. Otwórz stronę główną.
  2. Wypełnij Name, Email, Phone, Subject i Message poprawnymi danymi.
  3. Kliknij Submit; sprawdź odpowiedź POST /api/message.
  4. Sprawdź Thanks for getting in touch &lt;Name&gt;!.
  5. Odczytaj listę i usuń wyłącznie wiadomość o własnym markerze.
- **Oczekiwany rezultat:** POST 200 i success=true; widoczne potwierdzenie z własnym imieniem. Sprzątanie własnej wiadomości jest kontrolą informacyjną: wynik zapisany w evidence, bez wpływu na werdykt (decyzja projektowa 14.11.2026; DELETE pokrywa API-09).
- **Rzeczywisty rezultat:**

  ```
  POST /api/message → 200
  POST /api/auth/login → 200
  GET /api/message → 200
  DELETE /api/message/10 → 500
  Wszystkie jawne asercje i kontrole runnera zakończone pomyślnie.
  Kontrola informacyjna (nie wpływa na werdykt): Sprzątanie: usunięto własną wiadomość UI: oczekiwano 200, otrzymano 500. Objaw DEF-01; własny rekord testowy pozostaje do resetu środowiska.
  ```

- **Evidence:** [UI-02.json](evidence/ui/UI-02.json), [krok-01.png](evidence/ui/UI-02/krok-01.png), [krok-02.png](evidence/ui/UI-02/krok-02.png), [UI-02.png](evidence/ui/UI-02.png)
- **Wykonano:** 14.11.2026, 10:54:32 (2699 ms)

### UI-03

**Pusty formularz kontaktowy** · UI · Negatywny · priorytet P2 · ryzyko R-03 · status **PASS**

- **Cel:** Pusty formularz kontaktowy
- **Obszar:** Kontakt
- **Technika:** EP: brak wymaganych danych
- **Warunki wstępne:** Publiczna instancja dostępna. Nowy, izolowany kontekst. Brak wymagania stałych ID; pokoje pobierz z aktualnej listy.
- **Dane testowe:** Wszystkie pola formularza puste.
- **Kroki:**
  1. Otwórz stronę główną.
  2. Pozostaw Name, Email, Phone, Subject i Message puste.
  3. Kliknij Submit.
  4. Sprawdź odpowiedź i widoczny komunikat Name may not be blank.
- **Oczekiwany rezultat:** POST /api/message 400; komunikaty wymaganych pól; formularz nadal widoczny.
- **Rzeczywisty rezultat:**

  ```
  POST /api/message → 400
  Wszystkie jawne asercje i kontrole runnera zakończone pomyślnie.
  ```

- **Evidence:** [UI-03.json](evidence/ui/UI-03.json), [krok-01.png](evidence/ui/UI-03/krok-01.png), [krok-02.png](evidence/ui/UI-03/krok-02.png), [UI-03.png](evidence/ui/UI-03.png)
- **Wykonano:** 14.11.2026, 10:54:35 (2295 ms)

### UI-04

**Email niepoprawny i kombinacja dwóch błędów** · UI · Negatywny · priorytet P2 · ryzyko R-03 · status **PASS**

- **Cel:** Email niepoprawny i kombinacja dwóch błędów
- **Obszar:** Kontakt
- **Technika:** EP; DT reguły 3 i 4
- **Warunki wstępne:** Publiczna instancja dostępna. Nowy, izolowany kontekst. Brak wymagania stałych ID; pokoje pobierz z aktualnej listy.
- **Dane testowe:** Name=unikalny QA-&lt;czas&gt;-&lt;losowe&gt;; Email=qa-project@example.test; Phone=12345678901 (11 znaków); Subject=Zapytanie &lt;marker&gt;; Message=Wiadomość testowa projektu akademickiego. Dane syntetyczne. Zmień Email na bledny-email; w drugiej próbie Subject=ABCD.
- **Kroki:**
  1. Wypełnij poprawne dane poza Email=bledny-email.
  2. Kliknij Submit; sprawdź HTTP 400 i błąd email.
  3. Bez zmiany pozostałych pól zmień Subject na ABCD.
  4. Ponownie kliknij Submit; sprawdź HTTP 400 oraz jednoczesne błędy email i subject.
- **Oczekiwany rezultat:** Każda próba odrzucona; po drugiej próbie oba pola mają komunikat walidacji; email nie jest usunięty z formularza.
- **Rzeczywisty rezultat:**

  ```
  POST /api/message → 400
  POST /api/message → 400
  Wszystkie jawne asercje i kontrole runnera zakończone pomyślnie.
  ```

- **Evidence:** [UI-04.json](evidence/ui/UI-04.json), [krok-01.png](evidence/ui/UI-04/krok-01.png), [krok-02.png](evidence/ui/UI-04/krok-02.png), [krok-03.png](evidence/ui/UI-04/krok-03.png), [UI-04.png](evidence/ui/UI-04.png)
- **Wykonano:** 14.11.2026, 10:54:37 (2316 ms)

### UI-05

**Temat 4 znaki poniżej minimum** · UI · Negatywny · priorytet P2 · ryzyko R-03 · status **PASS**

- **Cel:** Temat 4 znaki poniżej minimum
- **Obszar:** Kontakt
- **Technika:** BVA: min-1; DT reguła 2
- **Warunki wstępne:** Publiczna instancja dostępna. Nowy, izolowany kontekst. Brak wymagania stałych ID; pokoje pobierz z aktualnej listy.
- **Dane testowe:** Name=unikalny QA-&lt;czas&gt;-&lt;losowe&gt;; Email=qa-project@example.test; Phone=12345678901 (11 znaków); Subject=Zapytanie &lt;marker&gt;; Message=Wiadomość testowa projektu akademickiego. Dane syntetyczne. Subject=ABCD (4 znaki).
- **Kroki:**
  1. Wypełnij formularz poprawnymi danymi, temat ABCD.
  2. Kliknij Submit.
  3. Sprawdź status odpowiedzi i komunikat Subject must be between 5 and 100 characters.
- **Oczekiwany rezultat:** HTTP 400; temat poniżej limitu odrzucony; widoczny komunikat.
- **Rzeczywisty rezultat:**

  ```
  POST /api/message → 400
  Wszystkie jawne asercje i kontrole runnera zakończone pomyślnie.
  ```

- **Evidence:** [UI-05.json](evidence/ui/UI-05.json), [krok-01.png](evidence/ui/UI-05/krok-01.png), [krok-02.png](evidence/ui/UI-05/krok-02.png), [UI-05.png](evidence/ui/UI-05.png)
- **Wykonano:** 14.11.2026, 10:54:39 (3040 ms)

### UI-06

**Temat 5 znaków na dolnej granicy** · UI · Pozytywny · priorytet P2 · ryzyko R-03,R-06 · status **PASS**

- **Cel:** Temat 5 znaków na dolnej granicy
- **Obszar:** Kontakt
- **Technika:** BVA: min; EP: poprawne dane
- **Warunki wstępne:** Publiczna instancja dostępna. Nowy, izolowany kontekst. Brak wymagania stałych ID; pokoje pobierz z aktualnej listy. Dane do sprzątania dostępne.
- **Dane testowe:** Name=unikalny QA-&lt;czas&gt;-&lt;losowe&gt;; Email=qa-project@example.test; Phone=12345678901 (11 znaków); Subject=Zapytanie &lt;marker&gt;; Message=Wiadomość testowa projektu akademickiego. Dane syntetyczne. Subject=ABCDE (5 znaków).
- **Kroki:**
  1. Wypełnij formularz poprawnymi danymi z tematem ABCDE.
  2. Kliknij Submit; sprawdź HTTP 200.
  3. Sprawdź potwierdzenie zawierające własne Name.
  4. Usuń wyłącznie własną wiadomość przez dynamicznie rozpoznany ID.
- **Oczekiwany rezultat:** HTTP 200 i potwierdzenie; brak błędu długości tematu. Sprzątanie własnej wiadomości jest kontrolą informacyjną: wynik zapisany w evidence, bez wpływu na werdykt (decyzja projektowa 14.11.2026; DELETE pokrywa API-09).
- **Rzeczywisty rezultat:**

  ```
  POST /api/message → 200
  POST /api/auth/login → 200
  GET /api/message → 200
  DELETE /api/message/11 → 500
  Wszystkie jawne asercje i kontrole runnera zakończone pomyślnie.
  Kontrola informacyjna (nie wpływa na werdykt): Sprzątanie: usunięto własną wiadomość UI: oczekiwano 200, otrzymano 500. Objaw DEF-01; własny rekord testowy pozostaje do resetu środowiska.
  ```

- **Evidence:** [UI-06.json](evidence/ui/UI-06.json), [krok-01.png](evidence/ui/UI-06/krok-01.png), [krok-02.png](evidence/ui/UI-06/krok-02.png), [UI-06.png](evidence/ui/UI-06.png)
- **Wykonano:** 14.11.2026, 10:54:42 (3170 ms)

### UI-07

**Telefon 10 znaków poniżej minimum** · UI · Negatywny · priorytet P2 · ryzyko R-03 · status **PASS**

- **Cel:** Telefon 10 znaków poniżej minimum
- **Obszar:** Kontakt
- **Technika:** BVA: min-1
- **Warunki wstępne:** Publiczna instancja dostępna. Nowy, izolowany kontekst. Brak wymagania stałych ID; pokoje pobierz z aktualnej listy.
- **Dane testowe:** Name=unikalny QA-&lt;czas&gt;-&lt;losowe&gt;; Email=qa-project@example.test; Phone=12345678901 (11 znaków); Subject=Zapytanie &lt;marker&gt;; Message=Wiadomość testowa projektu akademickiego. Dane syntetyczne. Phone=1234567890 (10 znaków).
- **Kroki:**
  1. Wypełnij dane, telefon 1234567890.
  2. Kliknij Submit.
  3. Sprawdź HTTP 400 i Phone must be between 11 and 21 characters.
- **Oczekiwany rezultat:** HTTP 400; komunikat długości telefonu; brak potwierdzenia wysłania.
- **Rzeczywisty rezultat:**

  ```
  POST /api/message → 400
  Wszystkie jawne asercje i kontrole runnera zakończone pomyślnie.
  ```

- **Evidence:** [UI-07.json](evidence/ui/UI-07.json), [krok-01.png](evidence/ui/UI-07/krok-01.png), [krok-02.png](evidence/ui/UI-07/krok-02.png), [UI-07.png](evidence/ui/UI-07.png)
- **Wykonano:** 14.11.2026, 10:54:45 (2003 ms)

### UI-08

**Cena rezerwacji dwóch nocy** · UI · Pozytywny · priorytet P1 · ryzyko R-01,R-05 · status **BLOCKED** · defekt [DEF-01](04_Defects.md#def-01)

- **Cel:** Cena rezerwacji dwóch nocy
- **Obszar:** Rezerwacja
- **Technika:** Reguła biznesowa / obliczenie ceny
- **Warunki wstępne:** Publiczna instancja dostępna. Nowy, izolowany kontekst. Brak wymagania stałych ID; pokoje pobierz z aktualnej listy. Szczegóły pokoju muszą zwracać 200.
- **Dane testowe:** Pokój z listy; checkin=dzisiaj UTC+60 dni; checkout=checkin+2 dni; cena p=roomPrice.
- **Kroki:**
  1. Pobierz aktualny pokój i zweryfikuj GET /api/room/&lt;id&gt;.
  2. Otwórz /reservation/&lt;id&gt;?checkin=&lt;data&gt;&checkout=&lt;data+2&gt;.
  3. Sprawdź Price Summary, p x 2 nights i Total.
- **Oczekiwany rezultat:** Dwie noce; cena p*2+40 GBP, zgodna z widocznymi opłatami cleaning 25 i service 15. Awaria szczegółów blokuje wykonanie asercji ceny.
- **Rzeczywisty rezultat:**

  ```
  Zablokowany przed właściwymi krokami: Szczegóły pokoju HTTP 500; DEF-01. Brak formularza rezerwacji..
  GET /api/room → 200
  GET /api/room/1 → 500
  ```

- **Evidence:** [UI-08.json](evidence/ui/UI-08.json), [krok-01.png](evidence/ui/UI-08/krok-01.png), [UI-08.png](evidence/ui/UI-08.png)
- **Wykonano:** 14.11.2026, 10:54:47 (579 ms)

### UI-09

**Rezerwacja z pustymi danymi gościa** · UI · Negatywny · priorytet P1 · ryzyko R-01,R-03 · status **BLOCKED** · defekt [DEF-01](04_Defects.md#def-01)

- **Cel:** Rezerwacja z pustymi danymi gościa
- **Obszar:** Rezerwacja
- **Technika:** EP: puste dane obowiązkowe
- **Warunki wstępne:** Publiczna instancja dostępna. Nowy, izolowany kontekst. Brak wymagania stałych ID; pokoje pobierz z aktualnej listy. Dostępne szczegóły pokoju i formularz rezerwacji.
- **Dane testowe:** Pokój dynamiczny; poprawny przyszły okres; puste Firstname, Lastname, Email i Phone.
- **Kroki:**
  1. Otwórz stronę rezerwacji dla przyszłego okresu.
  2. Kliknij Reserve Now, aby przejść do danych gościa.
  3. Pozostaw pola gościa puste i kliknij Reserve Now.
  4. Sprawdź status POST /api/booking i alert o Firstname.
- **Oczekiwany rezultat:** HTTP 400, widoczny błąd danych gościa; brak Booking Confirmed.
- **Rzeczywisty rezultat:**

  ```
  Zablokowany przed właściwymi krokami: Szczegóły pokoju HTTP 500; DEF-01. Brak formularza rezerwacji..
  GET /api/room → 200
  GET /api/room/1 → 500
  ```

- **Evidence:** [UI-09.json](evidence/ui/UI-09.json), [krok-01.png](evidence/ui/UI-09/krok-01.png), [UI-09.png](evidence/ui/UI-09.png)
- **Wykonano:** 14.11.2026, 10:54:48 (591 ms)

### UI-10

**Daty payloadu rezerwacji zgodne z wyborem** · UI · Pozytywny · priorytet P1 · ryzyko R-01,R-05 · status **BLOCKED** · defekt [DEF-01](04_Defects.md#def-01)

- **Cel:** Daty payloadu rezerwacji zgodne z wyborem
- **Obszar:** Rezerwacja
- **Technika:** Spójność danych UI→request
- **Warunki wstępne:** Publiczna instancja dostępna. Nowy, izolowany kontekst. Brak wymagania stałych ID; pokoje pobierz z aktualnej listy. Dostępne szczegóły pokoju. Przechwycenie POST włączone przed drugim Reserve Now.
- **Dane testowe:** checkin=dzisiaj UTC+60 dni, checkout=+2; QATester / ProjektTestowy / qa-project@example.test / 12345678901.
- **Kroki:**
  1. Otwórz rezerwację dla wybranych dat.
  2. Kliknij Reserve Now, wpisz dane gościa.
  3. Przechwyć POST /api/booking i przerwij go przed serwerem.
  4. Kliknij Reserve Now i porównaj bookingdates w payloadzie z datami w URL.
- **Oczekiwany rezultat:** Payload zachowuje checkin i checkout dokładnie. Brak zapisu do serwera jest celowy. Przypadek nie dowodzi pełnego E2E potwierdzenia rezerwacji.
- **Rzeczywisty rezultat:**

  ```
  Zablokowany przed właściwymi krokami: Szczegóły pokoju HTTP 500; DEF-01. Brak formularza rezerwacji..
  GET /api/room → 200
  GET /api/room/1 → 500
  ```

- **Evidence:** [UI-10.json](evidence/ui/UI-10.json), [krok-01.png](evidence/ui/UI-10/krok-01.png), [UI-10.png](evidence/ui/UI-10.png)
- **Wykonano:** 14.11.2026, 10:54:49 (588 ms)

### UI-11

**Odrzucenie błędnego logowania administratora** · UI · Negatywny · priorytet P1 · ryzyko R-04 · status **PASS**

- **Cel:** Odrzucenie błędnego logowania administratora
- **Obszar:** Uwierzytelnienie
- **Technika:** EP: niepoprawne credentials
- **Warunki wstępne:** Publiczna instancja dostępna. Nowy, izolowany kontekst. Brak wymagania stałych ID; pokoje pobierz z aktualnej listy.
- **Dane testowe:** Username=unikalny marker QA; Password=syntetyczna niepoprawna wartość.
- **Kroki:**
  1. Otwórz /admin w nowym kontekście.
  2. Wpisz niepoprawne Username i Password.
  3. Kliknij Login.
  4. Sprawdź HTTP 401, komunikat Invalid credentials i pozostanie pola Username.
- **Oczekiwany rezultat:** Brak dostępu do panelu; HTTP 401 i widoczny błąd.
- **Rzeczywisty rezultat:**

  ```
  
  Wszystkie jawne asercje i kontrole runnera zakończone pomyślnie.
  ```

- **Evidence:** [UI-11.json](evidence/ui/UI-11.json), [krok-01.png](evidence/ui/UI-11/krok-01.png), [krok-02.png](evidence/ui/UI-11/krok-02.png), [UI-11.png](evidence/ui/UI-11.png)
- **Wykonano:** 14.11.2026, 10:54:49 (723 ms)

### UI-12

**Wyszukanie dostępności w poprawnym okresie** · UI · Pozytywny · priorytet P1 · ryzyko R-01,R-05 · status **PASS**

- **Cel:** Wyszukanie dostępności w poprawnym okresie
- **Obszar:** Dostępność
- **Technika:** Spójność parametrów i odpowiedzi
- **Warunki wstępne:** Publiczna instancja dostępna. Nowy, izolowany kontekst. Brak wymagania stałych ID; pokoje pobierz z aktualnej listy.
- **Dane testowe:** Strefa Europe/Warsaw; checkin=UTC dzisiaj+60, checkout=+2; wpis DD/MM/YYYY.
- **Kroki:**
  1. Otwórz stronę główną.
  2. Wpisz przyszłe daty Check In i Check Out; zatwierdź Tab.
  3. Kliknij Check Availability.
  4. Sprawdź status GET /api/room?checkin=...&checkout=..., dokładne daty i linki wynikowych pokoi.
- **Oczekiwany rezultat:** HTTP 200; request używa wybranych dat; każdy zwrócony pokój ma widoczny link.
- **Rzeczywisty rezultat:**

  ```
  
  Wszystkie jawne asercje i kontrole runnera zakończone pomyślnie.
  ```

- **Evidence:** [UI-12.json](evidence/ui/UI-12.json), [krok-01.png](evidence/ui/UI-12/krok-01.png), [krok-02.png](evidence/ui/UI-12/krok-02.png), [UI-12.png](evidence/ui/UI-12.png)
- **Wykonano:** 14.11.2026, 10:54:50 (1848 ms)

### API-01

**Lista pokoi: schemat, ceny i ID** · API · Pozytywny · priorytet P2 · ryzyko R-02 · status **PASS**

- **Cel:** Lista pokoi: schemat, ceny i ID
- **Obszar:** Katalog
- **Technika:** Walidacja kontraktu
- **Warunki wstępne:** Publiczna instancja dostępna. Nowy, izolowany kontekst. Brak wymagania stałych ID; pokoje pobierz z aktualnej listy.
- **Dane testowe:** GET /api/room bez uwierzytelnienia.
- **Kroki:**
  1. Wyślij GET /api/room.
  2. Sprawdź 200, niepustą tablicę rooms i unikalne roomid.
  3. Dla każdego rekordu sprawdź liczbową dodatnią cenę i tekstowy type.
- **Oczekiwany rezultat:** HTTP 200; niepusta tablica rooms z unikalnymi ID; każdy pokój ma roomid (liczba), roomName i type (tekst), accessible (logiczna), features (tablica) i dodatnią cenę.
- **Rzeczywisty rezultat:**

  ```
  GET /api/room → 200
  Wszystkie jawne asercje i kontrole runnera zakończone pomyślnie.
  ```

- **Evidence:** [API-01.json](evidence/api/API-01.json)
- **Wykonano:** 14.11.2026, 10:54:25 (196 ms)

### API-02

**Odczyt szczegółów istniejącego pokoju** · API · Pozytywny · priorytet P1 · ryzyko R-01,R-02 · status **FAIL** · defekt [DEF-01](04_Defects.md#def-01)

- **Cel:** Odczyt szczegółów istniejącego pokoju
- **Obszar:** Katalog
- **Technika:** Spójność listy i szczegółów
- **Warunki wstępne:** Publiczna instancja dostępna. Nowy, izolowany kontekst. Brak wymagania stałych ID; pokoje pobierz z aktualnej listy.
- **Dane testowe:** roomid wybrany z GET /api/room.
- **Kroki:**
  1. Pobierz listę i pierwszy bieżący roomid.
  2. GET /api/room/&lt;roomid&gt;.
  3. Porównaj roomid i roomPrice ze stanem listy.
- **Oczekiwany rezultat:** HTTP 200; identyfikator, cena i typ zgodne z listą.
- **Rzeczywisty rezultat:**

  ```
  GET /api/room → 200
  GET /api/room/1 → 500
  Niezgodności: Istniejący pokój: HTTP 200: oczekiwano 200, otrzymano 500
  ```

- **Evidence:** [API-02.json](evidence/api/API-02.json)
- **Wykonano:** 14.11.2026, 10:54:25 (140 ms)

### API-03

**Nieistniejący pokój** · API · Negatywny · priorytet P2 · ryzyko R-02 · status **FAIL** · defekt [DEF-01](04_Defects.md#def-01)

- **Cel:** Nieistniejący pokój
- **Obszar:** Katalog
- **Technika:** EP: zasób nieistniejący
- **Warunki wstępne:** Publiczna instancja dostępna. Nowy, izolowany kontekst. Brak wymagania stałych ID; pokoje pobierz z aktualnej listy.
- **Dane testowe:** missingId=max(roomid z bieżącej listy)+100000; brak zapisu pod tym ID.
- **Kroki:**
  1. GET /api/room i wyznacz ID poza listą.
  2. GET /api/room/&lt;missingId&gt;.
  3. Sprawdź kod odpowiedzi.
- **Oczekiwany rezultat:** HTTP 404, zgodnie z RoomService.getSpecificRoom. Brak stałego ID zasobu.
- **Rzeczywisty rezultat:**

  ```
  GET /api/room → 200
  GET /api/room/100003 → 500
  Niezgodności: Brak zasobu: HTTP 404: oczekiwano 404, otrzymano 500
  ```

- **Evidence:** [API-03.json](evidence/api/API-03.json)
- **Wykonano:** 14.11.2026, 10:54:25 (232 ms)

### API-04

**Wiadomość bez wymaganych pól** · API · Negatywny · priorytet P2 · ryzyko R-03 · status **PASS**

- **Cel:** Wiadomość bez wymaganych pól
- **Obszar:** Kontakt
- **Technika:** EP: brak pól
- **Warunki wstępne:** Publiczna instancja dostępna. Nowy, izolowany kontekst. Brak wymagania stałych ID; pokoje pobierz z aktualnej listy.
- **Dane testowe:** POST /api/message; Content-Type application/json; body={}.
- **Kroki:**
  1. Wyślij pusty obiekt JSON.
  2. Sprawdź HTTP 400.
  3. Sprawdź tablicę błędów i Name must be set.
- **Oczekiwany rezultat:** 400; tablica błędów walidacji zawiera komunikat „must be set” dla każdego z pięciu wymaganych pól: Name, Email, Phone, Subject, Message.
- **Rzeczywisty rezultat:**

  ```
  POST /api/message → 400
  Wszystkie jawne asercje i kontrole runnera zakończone pomyślnie.
  ```

- **Evidence:** [API-04.json](evidence/api/API-04.json)
- **Wykonano:** 14.11.2026, 10:54:26 (186 ms)

### API-05

**Niepoprawny format email** · API · Negatywny · priorytet P2 · ryzyko R-03 · status **PASS**

- **Cel:** Niepoprawny format email
- **Obszar:** Kontakt
- **Technika:** EP: niepoprawny format
- **Warunki wstępne:** Publiczna instancja dostępna. Nowy, izolowany kontekst. Brak wymagania stałych ID; pokoje pobierz z aktualnej listy.
- **Dane testowe:** Name=unikalny QA-&lt;czas&gt;-&lt;losowe&gt;; Email=qa-project@example.test; Phone=12345678901 (11 znaków); Subject=Zapytanie &lt;marker&gt;; Message=Wiadomość testowa projektu akademickiego. Dane syntetyczne. Email=nie-jest-mailem.
- **Kroki:**
  1. Wyślij POST /api/message z poprawnymi polami poza email.
  2. Sprawdź 400 i komunikat walidacji email.
  3. GET /api/message: rekord z unikalnym markerem nie został zapisany.
- **Oczekiwany rezultat:** HTTP 400; komunikat „must be a well-formed email address”; rekord z markerem nie pojawia się na liście wiadomości.
- **Rzeczywisty rezultat:**

  ```
  POST /api/message → 400
  GET /api/message → 200
  Wszystkie jawne asercje i kontrole runnera zakończone pomyślnie.
  ```

- **Evidence:** [API-05.json](evidence/api/API-05.json)
- **Wykonano:** 14.11.2026, 10:54:26 (127 ms)

### API-06

**Email jako obiekt JSON zamiast tekstu** · API · Negatywny · priorytet P2 · ryzyko R-03 · status **FAIL** · defekt [DEF-02](04_Defects.md#def-02)

- **Cel:** Email jako obiekt JSON zamiast tekstu
- **Obszar:** Kontakt
- **Technika:** EP: błędny typ
- **Warunki wstępne:** Publiczna instancja dostępna. Nowy, izolowany kontekst. Brak wymagania stałych ID; pokoje pobierz z aktualnej listy.
- **Dane testowe:** Name=unikalny QA-&lt;czas&gt;-&lt;losowe&gt;; Email=qa-project@example.test; Phone=12345678901 (11 znaków); Subject=Zapytanie &lt;marker&gt;; Message=Wiadomość testowa projektu akademickiego. Dane syntetyczne. email={value:"qa@example.test"}.
- **Kroki:**
  1. Wyślij POST /api/message z email jako obiektem.
  2. Sprawdź HTTP 400.
  3. GET /api/message: rekord z unikalnym markerem nie został zapisany.
- **Oczekiwany rezultat:** Błędny typ danych klienta odrzucony HTTP 400; rekord z markerem nie pojawia się na liście. Kontrakt tekstowego pola wynika z modelu Message; oczekiwanie klient-błąd stanowi kryterium projektu.
- **Rzeczywisty rezultat:**

  ```
  POST /api/message → 500
  GET /api/message → 200
  Niezgodności: Błędny typ: HTTP 400: oczekiwano 400, otrzymano 500
  ```

- **Evidence:** [API-06.json](evidence/api/API-06.json)
- **Wykonano:** 14.11.2026, 10:54:26 (143 ms)

### API-07

**Odczyt rezerwacji bez tokenu** · API · Negatywny · priorytet P1 · ryzyko R-04 · status **PASS**

- **Cel:** Odczyt rezerwacji bez tokenu
- **Obszar:** Uwierzytelnienie
- **Technika:** EP: brak uwierzytelnienia
- **Warunki wstępne:** Publiczna instancja dostępna. Nowy, izolowany kontekst. Brak wymagania stałych ID; pokoje pobierz z aktualnej listy.
- **Dane testowe:** GET /api/booking?roomid=&lt;dynamiczne ID&gt;; bez Cookie.
- **Kroki:**
  1. GET /api/room i wybierz roomid.
  2. W nowym kontekście bez cookie wyślij GET /api/booking?roomid=&lt;id&gt;.
  3. Sprawdź status i komunikat.
- **Oczekiwany rezultat:** HTTP 401; error=Authentication required; brak listy rezerwacji.
- **Rzeczywisty rezultat:**

  ```
  GET /api/room → 200
  GET /api/booking?roomid=1 → 401
  Wszystkie jawne asercje i kontrole runnera zakończone pomyślnie.
  ```

- **Evidence:** [API-07.json](evidence/api/API-07.json)
- **Wykonano:** 14.11.2026, 10:54:27 (203 ms)

### API-08

**Niepoprawne credentials** · API · Negatywny · priorytet P1 · ryzyko R-04 · status **PASS**

- **Cel:** Niepoprawne credentials
- **Obszar:** Uwierzytelnienie
- **Technika:** EP: odrzucenie dostępu
- **Warunki wstępne:** Publiczna instancja dostępna. Nowy, izolowany kontekst. Brak wymagania stałych ID; pokoje pobierz z aktualnej listy.
- **Dane testowe:** POST /api/auth/login; unikalny niepoprawny username; niepoprawne syntetyczne password.
- **Kroki:**
  1. Wyślij POST /api/auth/login z błędnym kontem.
  2. Sprawdź status 401, error Invalid credentials i brak pola token.
- **Oczekiwany rezultat:** HTTP 401; brak tokenu.
- **Rzeczywisty rezultat:**

  ```
  POST /api/auth/login → 401
  Wszystkie jawne asercje i kontrole runnera zakończone pomyślnie.
  ```

- **Evidence:** [API-08.json](evidence/api/API-08.json)
- **Wykonano:** 14.11.2026, 10:54:27 (138 ms)

### API-09

**Wiadomość: create/read/update i sprzątanie** · API · Pozytywny · priorytet P1 · ryzyko R-03,R-04,R-06 · status **FAIL** · defekt [DEF-01](04_Defects.md#def-01)

- **Cel:** Wiadomość: create/read/update i sprzątanie
- **Obszar:** Kontakt i administracja
- **Technika:** Test przejść stanu CRUD
- **Warunki wstępne:** Publiczna instancja dostępna. Nowy, izolowany kontekst. Brak wymagania stałych ID; pokoje pobierz z aktualnej listy. QA_USERNAME/QA_PASSWORD ustawione; token pobierany i maskowany.
- **Dane testowe:** Name=unikalny QA-&lt;czas&gt;-&lt;losowe&gt;; Email=qa-project@example.test; Phone=12345678901 (11 znaków); Subject=Zapytanie &lt;marker&gt;; Message=Wiadomość testowa projektu akademickiego. Dane syntetyczne. Cookie token z aktualnego logowania.
- **Kroki:**
  1. Zaloguj się przez POST /api/auth/login.
  2. Utwórz wiadomość POST /api/message; sprawdź 200 i success=true.
  3. GET /api/message: znajdź dokładnie jeden własny marker i jego id.
  4. GET /api/message/&lt;id&gt; z tokenem; porównaj description i email (asercja miękka).
  5. PUT /api/message/&lt;id&gt; z tokenem: oznacz jako przeczytaną.
  6. GET listy: własne read=true.
  7. W finally DELETE tylko własne id i potwierdź nieobecność na liście.
- **Oczekiwany rezultat:** Create 200; dokładnie jeden własny rekord na liście; read 200 ze spójnymi danymi; PUT 200 i flaga read=true potwierdzona na liście; cleanup 200 i brak własnego rekordu. Odczyt po ID jest asercją miękką, aby PUT i jego potwierdzenie zostały wykonane niezależnie.
- **Rzeczywisty rezultat:**

  ```
  POST /api/auth/login → 200
  POST /api/message → 200
  GET /api/message → 200
  GET /api/message/8 → 500
  PUT /api/message/8 → 500
  GET /api/message → 200
  DELETE /api/message/8 → 500
  GET /api/message → 200
  Niezgodności: Odczyt utworzonej wiadomości: oczekiwano 200, otrzymano 500; Oznaczenie read: HTTP 200: oczekiwano 200, otrzymano 500; Zmiana read utrwalona (potwierdzenie z listy): oczekiwano true, otrzymano false; Sprzątanie własnej wiadomości: oczekiwano 200, otrzymano 500; Wiadomość usunięta: oczekiwano false, otrzymano true
  Utworzenie i obecność na liście potwierdzone. Odczyt po ID, PUT i DELETE wykonane: każde zwraca 500, a lista potwierdza brak utrwalonej zmiany.
  ```

- **Evidence:** [API-09.json](evidence/api/API-09.json)
- **Wykonano:** 14.11.2026, 10:54:27 (531 ms)

### API-10

**Rezerwacja: create/read/update i sprzątanie** · API · Pozytywny · priorytet P1 · ryzyko R-01,R-04,R-06 · status **FAIL** · defekt [DEF-01](04_Defects.md#def-01)

- **Cel:** Rezerwacja: create/read/update i sprzątanie
- **Obszar:** Rezerwacja
- **Technika:** Test przejść stanu CRUD
- **Warunki wstępne:** Publiczna instancja dostępna. Nowy, izolowany kontekst. Brak wymagania stałych ID; pokoje pobierz z aktualnej listy. Aktualny token; lista rezerwacji dostępna; wolny termin wybrany bez konfliktu.
- **Dane testowe:** roomid z listy; unikalne firstname=QA&lt;czas&gt;; lastname=ProjektTestowy; depositpaid=false; przyszłe daty; email qa-project@example.test; phone 12345678901.
- **Kroki:**
  1. Zaloguj się i pobierz pokoje oraz bieżące rezerwacje pokoju.
  2. Wyznacz wolny dwudniowy okres z aktualnego stanu; nie ponawiaj zapisu w razie konfliktu.
  3. POST /api/booking: sprawdź 201.
  4. Znajdź własne bookingid na liście po unikalnym firstname.
  5. GET /api/booking/&lt;id&gt;: porównaj daty.
  6. PUT /api/booking/&lt;id&gt;: lastname=ZmienioneNazwisko; GET potwierdza zmianę.
  7. W finally DELETE tylko własny bookingid; lista nie zawiera rekordu.
- **Oczekiwany rezultat:** Create 201; własna rezerwacja na liście z niezmienionymi datami; read 200; PUT 200 i nowe nazwisko potwierdzone na liście; cleanup 200. Odczyt po ID jest asercją miękką, aby PUT i jego potwierdzenie zostały wykonane niezależnie.
- **Rzeczywisty rezultat:**

  ```
  POST /api/auth/login → 200
  GET /api/room → 200
  GET /api/booking?roomid=1 → 200
  POST /api/booking → 201
  GET /api/booking?roomid=1 → 200
  GET /api/booking/6 → 500
  PUT /api/booking/6 → 500
  GET /api/booking?roomid=1 → 200
  DELETE /api/booking/6 → 500
  GET /api/booking?roomid=1 → 200
  Niezgodności: Odczyt HTTP 200: oczekiwano 200, otrzymano 500; PUT HTTP 200: oczekiwano 200, otrzymano 500; Nowe nazwisko utrwalone (potwierdzenie z listy): oczekiwano "ZmienioneNazwisko", otrzymano "ProjektTestowy"; Usunięto wyłącznie własną rezerwację: oczekiwano 200, otrzymano 500; Potwierdzono sprzątanie: oczekiwano false, otrzymano true
  Utworzenie i obecność na liście potwierdzone. Odczyt po ID, PUT i DELETE wykonane: każde zwraca 500, a lista potwierdza brak utrwalonej zmiany.
  ```

- **Evidence:** [API-10.json](evidence/api/API-10.json)
- **Wykonano:** 14.11.2026, 10:54:28 (933 ms)
