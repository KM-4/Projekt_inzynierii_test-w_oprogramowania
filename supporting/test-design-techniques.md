# Techniki projektowania testów

Źródło limitów: `sources/message__src__main__java__com__automationintesting__model__db__Message.java`, commit wskazany w `sources/repository.json`. To kontrakt kodu referencyjnego, nie dowód zgodności wersji wdrożonej. Dolne granice i komunikaty potwierdzono odpowiedziami żywej aplikacji. Wynik testu zależy też od sprzątania danych, co wyjaśnia FAIL pozytywnego UI-06 mimo przyjęcia tematu.

## EP - klasy równoważności

| Pole / obszar | Klasa poprawna | Klasa niepoprawna | Reprezentant i przypadki |
|---|---|---|---|
| Email | niepusty String w formacie adresu | brak / pusty; zły format; zły typ JSON | qa-project@example.test: UI-02; bledny-email: UI-04; brak: API-04; obiekt: API-06 |
| Temat | tekst długości 5–100 | 0–4; >100 | ABCDE: UI-06; ABCD: UI-05; 101 znaków: EXP-01 |
| Telefon | niepusty tekst długości 11–21 | 0–10; >21 | 11: UI-02; 10: UI-07; 22: EXP-01 |
| Zasób | ID z bieżącej listy | ID poza bieżącą listą | API-02 / API-03 |
| Dostęp | aktualne poprawne credentials i token | brak tokenu / błędne credentials | API-09, API-10 / API-07, API-08 |

Podział „zły typ” jest odrębny od „zły format”. Obiekt JSON nie jest niepoprawnie zapisanym adresem, tylko naruszeniem typu String.

## BVA - analiza wartości brzegowych

Udokumentowana dwuwartościowa BVA dla dolnej granicy tematu: **4 i 5**. Pozostałe pola są poprawne i niezmienione; różni się tylko długość tematu. UI-05 sprawdza min−1, UI-06 min. Drugi przykład: telefon 10 / 11 znaków w UI-07 i UI-02.

| Pole | Wymagany przedział | min−1 | min | max | max+1 | Pokrycie |
|---|---|---|---|---|---|---|
| Subject | 5–100 znaków | 4 | 5 | 100 | 101 | UI-05/UI-06 oraz EXP-02: wszystkie 4 punkty wykonane; górne granice poza licznikiem TC |
| Phone | 11–21 znaków | 10 | 11 | 21 | 22 | UI-07/UI-02 oraz EXP-02: wszystkie 4 punkty wykonane; górne granice poza licznikiem TC |
| Description | 20–2000 znaków | 19 | 20 | 2000 | 2001 | EXP-02: 19/20/2000/2001 rzeczywiście wykonane; poza licznikiem TC |

Nie twierdzimy, że sama długość telefonu potwierdza poprawność numeru w świecie rzeczywistym. Maksymalny termin przyszłej rezerwacji i zakres dopuszczalnych znaków nie zostały wymyślone. Dla zapisu dat potwierdzono regułę checkin < checkout w DateCheckValidator i HTTP 409 dla dat równych/odwróconych w eksploracji. Pełna specyfikacja polityki dat i walidacji wyszukiwania nie jest znana.

## DT - tablica decyzyjna

Zakres: email i subject formularza kontaktowego. Założenie kontrolne: Name, Phone i Message są poprawne; stan początkowy formularza jest nowy, a limit długości tematu pochodzi z modelu Message. Liczą się wyniki głównej walidacji; osobny cleanup może zakończyć cały TC jako FAIL.

| Warunek / akcja | Reguła 1 | Reguła 2 | Reguła 3 | Reguła 4 |
|---|---|---|---|---|
| Email poprawny | T | T | N | N |
| Subject poprawny | T | N | T | N |
| Utworzyć wiadomość | T | N | N | N |
| Błąd email | N | N | T | T |
| Błąd subject | N | T | N | T |
| Oczekiwany HTTP proxy | 200 | 400 | 400 | 400 |
| Przypadek | UI-02 | UI-05 | UI-04, próba 1 | UI-04, próba 2 |

Nie utożsamiamy `POST /api/message` interfejsu Next.js (200, `{success:true}`) z backendem Spring (201 i obiekt Message). Projekt testuje publiczne `/api/*`, dlatego oczekiwania pochodzą także z kodu proxy.

## Reprodukowalność danych

Podstawowy poprawny kontakt: Name z unikalnym markerem QA, Email `qa-project@example.test`, Phone `12345678901`, Subject `Zapytanie <marker>`, Description `Wiadomość testowa projektu akademickiego. Dane syntetyczne.`. Negatywne próby zmieniają tylko wskazane pole, poza celowym testem kombinacji w DT.

Eksploracja jest osobną aktywnością. Dodatkowe payloady z sesji EXP-01 nie zwiększają minimum 22 udokumentowanych przypadków.

## Uzupełnienie z wykonanej EXP-02

W osobnej sesji 30 min 36 s wykonano obie granice trzech pól: Subject 4/5/100/101, Phone 10/11/21/22, Description 19/20/2000/2001. Punkty poprawne dały 200 i własny rekord na liście, niepoprawne 400. Dodano EP whitespace oraz DT braku/błędnego/poprawnego auth. To pokrycie eksploracyjne nie zwiększa liczników 22 TC. Szczegóły i dowody w 03_Exploratory.md oraz evidence/exploratory/session.json.
