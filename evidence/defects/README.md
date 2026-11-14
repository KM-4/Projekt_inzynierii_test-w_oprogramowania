# Dowody defektów

Zgłoszenia nie duplikują tych samych plików binarnych. Kanoniczne dowody:

- **DEF-01:** [API-02](../api/API-02.json), [API-03](../api/API-03.json), [API-09](../api/API-09.json), [API-10](../api/API-10.json), [spinner rezerwacji](../ui/UI-08.png). Objaw potwierdzają też informacyjne kontrole sprzątania w [UI-02](../ui/UI-02.json) i [UI-06](../ui/UI-06.json) (DELETE 500, bez wpływu na werdykt).
- **DEF-02:** [błędny typ email](../api/API-06.json).

Reprodukcja, expected/actual, środowisko, czas oraz severity/priority: `../../04_Defects.xlsx`. Pełna macierz powiązań: [traceability-matrix.md](../../supporting/traceability-matrix.md).

- **DEF-03:** [nieważna sesja](../exploratory/DEF-03-auth.json).
- **DEF-04:** [daty i strefy](../exploratory/DEF-04-dates.json), [panel UTC+14](../exploratory/EXP-02-20-date-panel-utc14.png).
