# Macierz śledzenia

Źródło: executed-cases.json, risks.json i rzeczywisty raport ostatniego pełnego uruchomienia. Eksploracja nie jest doliczana do test cases.

| TC | Obszar | Ryzyko | Technika | Status | Defekt | Evidence |
|---|---|---|---|---|---|---|
| UI-01 | Katalog | R-02 | Porównanie między interfejsami | PASS | - | [UI-01.json](../evidence/ui/UI-01.json), [krok-01.png](../evidence/ui/UI-01/krok-01.png), [UI-01.png](../evidence/ui/UI-01.png) |
| UI-02 | Kontakt | R-03,R-06 | EP; DT reguła 1; BVA telefon=11 | PASS | - | [UI-02.json](../evidence/ui/UI-02.json), [krok-01.png](../evidence/ui/UI-02/krok-01.png), [krok-02.png](../evidence/ui/UI-02/krok-02.png), [UI-02.png](../evidence/ui/UI-02.png) |
| UI-03 | Kontakt | R-03 | EP: brak wymaganych danych | PASS | - | [UI-03.json](../evidence/ui/UI-03.json), [krok-01.png](../evidence/ui/UI-03/krok-01.png), [krok-02.png](../evidence/ui/UI-03/krok-02.png), [UI-03.png](../evidence/ui/UI-03.png) |
| UI-04 | Kontakt | R-03 | EP; DT reguły 3 i 4 | PASS | - | [UI-04.json](../evidence/ui/UI-04.json), [krok-01.png](../evidence/ui/UI-04/krok-01.png), [krok-02.png](../evidence/ui/UI-04/krok-02.png), [krok-03.png](../evidence/ui/UI-04/krok-03.png), [UI-04.png](../evidence/ui/UI-04.png) |
| UI-05 | Kontakt | R-03 | BVA: min-1; DT reguła 2 | PASS | - | [UI-05.json](../evidence/ui/UI-05.json), [krok-01.png](../evidence/ui/UI-05/krok-01.png), [krok-02.png](../evidence/ui/UI-05/krok-02.png), [UI-05.png](../evidence/ui/UI-05.png) |
| UI-06 | Kontakt | R-03,R-06 | BVA: min; EP: poprawne dane | PASS | - | [UI-06.json](../evidence/ui/UI-06.json), [krok-01.png](../evidence/ui/UI-06/krok-01.png), [krok-02.png](../evidence/ui/UI-06/krok-02.png), [UI-06.png](../evidence/ui/UI-06.png) |
| UI-07 | Kontakt | R-03 | BVA: min-1 | PASS | - | [UI-07.json](../evidence/ui/UI-07.json), [krok-01.png](../evidence/ui/UI-07/krok-01.png), [krok-02.png](../evidence/ui/UI-07/krok-02.png), [UI-07.png](../evidence/ui/UI-07.png) |
| UI-08 | Rezerwacja | R-01,R-05 | Reguła biznesowa / obliczenie ceny | BLOCKED | DEF-01 | [UI-08.json](../evidence/ui/UI-08.json), [krok-01.png](../evidence/ui/UI-08/krok-01.png), [UI-08.png](../evidence/ui/UI-08.png) |
| UI-09 | Rezerwacja | R-01,R-03 | EP: puste dane obowiązkowe | BLOCKED | DEF-01 | [UI-09.json](../evidence/ui/UI-09.json), [krok-01.png](../evidence/ui/UI-09/krok-01.png), [UI-09.png](../evidence/ui/UI-09.png) |
| UI-10 | Rezerwacja | R-01,R-05 | Spójność danych UI→request | BLOCKED | DEF-01 | [UI-10.json](../evidence/ui/UI-10.json), [krok-01.png](../evidence/ui/UI-10/krok-01.png), [UI-10.png](../evidence/ui/UI-10.png) |
| UI-11 | Uwierzytelnienie | R-04 | EP: niepoprawne credentials | PASS | - | [UI-11.json](../evidence/ui/UI-11.json), [krok-01.png](../evidence/ui/UI-11/krok-01.png), [krok-02.png](../evidence/ui/UI-11/krok-02.png), [UI-11.png](../evidence/ui/UI-11.png) |
| UI-12 | Dostępność | R-01,R-05 | Spójność parametrów i odpowiedzi | PASS | - | [UI-12.json](../evidence/ui/UI-12.json), [krok-01.png](../evidence/ui/UI-12/krok-01.png), [krok-02.png](../evidence/ui/UI-12/krok-02.png), [UI-12.png](../evidence/ui/UI-12.png) |
| API-01 | Katalog | R-02 | Walidacja kontraktu | PASS | - | [API-01.json](../evidence/api/API-01.json) |
| API-02 | Katalog | R-01,R-02 | Spójność listy i szczegółów | FAIL | DEF-01 | [API-02.json](../evidence/api/API-02.json) |
| API-03 | Katalog | R-02 | EP: zasób nieistniejący | FAIL | DEF-01 | [API-03.json](../evidence/api/API-03.json) |
| API-04 | Kontakt | R-03 | EP: brak pól | PASS | - | [API-04.json](../evidence/api/API-04.json) |
| API-05 | Kontakt | R-03 | EP: niepoprawny format | PASS | - | [API-05.json](../evidence/api/API-05.json) |
| API-06 | Kontakt | R-03 | EP: błędny typ | FAIL | DEF-02 | [API-06.json](../evidence/api/API-06.json) |
| API-07 | Uwierzytelnienie | R-04 | EP: brak uwierzytelnienia | PASS | - | [API-07.json](../evidence/api/API-07.json) |
| API-08 | Uwierzytelnienie | R-04 | EP: odrzucenie dostępu | PASS | - | [API-08.json](../evidence/api/API-08.json) |
| API-09 | Kontakt i administracja | R-03,R-04,R-06 | Test przejść stanu CRUD | FAIL | DEF-01 | [API-09.json](../evidence/api/API-09.json) |
| API-10 | Rezerwacja | R-01,R-04,R-06 | Test przejść stanu CRUD | FAIL | DEF-01 | [API-10.json](../evidence/api/API-10.json) |

## Osobna sesja eksploracyjna

EXP-02: 30 minut 36 sekund wydzielonej eksploracji. R-03/R-04/R-05/R-06; nowe DEF-03 i DEF-04, potwierdzenia DEF-01/DEF-02. [Dziennik](../03_Exploratory.md), [auth](../evidence/exploratory/DEF-03-auth.json), [daty](../evidence/exploratory/DEF-04-dates.json). Wyniki EXP-02 nie zwiększają 22 TC ani nie zmieniają historycznego PASS UI-12 w Europe/Warsaw.
