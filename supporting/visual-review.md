# Kontrola wizualna artefaktów

Wykonano renderowanie i ocenę wszystkich stron PDF oraz wszystkich arkuszy XLSX w środowisku realizacji. Dodatkowo sprawdzono szczegółowe kolumny warunków, danych, kroków, expected/actual i statusów oraz reprodukcję defektu.

- Plan: 2 strony, polskie znaki, tabela 6 ryzyk mieści się na stronie; brak uciętych komórek.
- Summary: 3 strony, czytelne metryki 22/19/12/7/3/0, defekty i rekomendacja NO-GO.
- Eksploracja: 3 strony, zakończona wydzielona EXP-02 30 min 36 s; rzeczywiste czasy, oś działań, granice i reguły dostępu. Brak osieroconych wierszy. Dane Kamila i nr 83741 we wszystkich PDF oraz na każdym arkuszu.
- Przypadki: Podsumowanie, UI i API. Nagłówki czytelne, tekst zawijany, identyfikatory i nagłówki zamrożone, filtry; kolumny ze szczegółami wymagają przewijania poziomego. Warunkowe formatowanie wyróżnia FAIL/BLOCKED, brak błędów formuł.
- Defekty: cztery raporty (w tym dwa nowe z EXP-02), arkusze Defekty i Skale. Reprodukcja, expected/actual i uzasadnienie mieszczą się w komórkach. Arkusze są przeznaczone przede wszystkim do odczytu cyfrowego.
- Raport HTML: otwarto lokalny serwer raportu, HTTP 200; widoczne 12 passed, 7 failed i 3 skipped. Screenshot znajduje się w evidence/automation/report-overview.png.

Nie deklarujemy ręcznej weryfikacji edycji w natywnym Microsoft Excel. Odczyt zapisanego XLSX przez niezależną bibliotekę potwierdził formuły, zapisane wartości, filtry, zamrożenia i hiperlinki. Rendery robocze pozostały poza paczką, ponieważ nie stanowią dowodów działania SUT.
