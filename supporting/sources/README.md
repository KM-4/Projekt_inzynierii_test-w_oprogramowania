# Źródła analizy

- `presentation-extract.txt`: pełna ekstrakcja wszystkich 19 stron dokumentu przekazanego przez użytkownika. Metadane i SHA-256 w `presentation-metadata.json`. Wymagania prowadzącego mają pierwszeństwo przy projekcie artefaktów.
- `repository.json`: adres oficjalnego repozytorium Restful-Booker-Platform i faktycznie odczytany SHA referencyjnego kodu. Nie znamy SHA publicznego wdrożenia.
- Pliki o nazwach z `__` są wybranymi plikami **produkcyjnymi** z repozytorium. Nazwa koduje oryginalną ścieżkę, `__` oznacza `/`. Oryginalny URL: `https://raw.githubusercontent.com/mwinteringham/restful-booker-platform/<SHA>/<ścieżka>`.
- `SUT-LICENSE.txt`: licencja GPL-3.0 oficjalnego repozytorium, dołączona do kopii materiałów referencyjnych. Gotowych testów repozytorium nie pobierano ani nie kopiowano. Testy projektu w 05_Automation są autorskie.
- Postman: https://www.postman.com/automation-in-testing/restful-booker-collections/overview, odczyt 13.11.2026. Źródło rozróżnienia Restful-Booker vs Restful-Booker-Platform i deklaracji resetowania; rzeczywiste obserwacje stanu zapisano osobno.

Kod referencyjny pomaga określić kontrakt i hipotezy. Wyniki pochodzą z rzeczywistego SUT i runnera, a nie z samego odczytania kodu.
