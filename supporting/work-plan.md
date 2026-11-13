# Realizacja projektu

Źródło nadrzędne: prezentacja prowadzącego, przeczytane strony 1–19. Zlecenie użytkownika rozszerza wymagania o 8 API, XLSX i materiały obrony.

- [x] A: analiza wszystkich stron, dostępność SUT, rozpoznanie UI i kodu proxy API.
- [x] B: 12 przypadków UI + 10 API, 6 ryzyk, EP/BVA/DT i jawne powiązania.
- [x] C: Playwright Test / TypeScript, kontrola żądań, redakcja danych, raportowanie; npm ci i pełny przebieg.
- [x] D: pełny przebieg oraz wykonana wydzielona EXP-02 (30 min 36 s); 114 wpisów, bez prac nad innymi artefaktami. EXP-01 zachowana jako archiwum.
- [x] E: wyniki 12 PASS / 7 FAIL / 3 BLOCKED / 0 NOT RUN, dowody i cztery unikalne raporty defektów (dwa z TC, dwa z EXP-02).
- [x] F: PDF/XLSX i ich rendery, audyt spójności, odtworzenie uruchomienia według README, ZIP z manifestem SHA-256 i kontrolą CRC.

Decyzja narzędziowa: istniejący Playwright 1.62.1 (`playwright/test`) zapewnia runner i APIRequestContext. Nie wymaga osobnego @playwright/test ani instalacji TypeScript do transformacji testów. Chrome jest już zainstalowany. Generowanie dokumentów: istniejący ReportLab i @oai/artifact-tool. Repozytorium SUT służy wyłącznie do analizy kontraktów; żaden gotowy test nie został pobrany.

Po utworzeniu lockfile wykonano także rzeczywiste npm ci z rejestru npm: Playwright 1.62.1 i playwright-core 1.62.1 (dwa pakiety). Nie pobierano dodatkowej przeglądarki. Kontrola otwarcia raportu HTML: HTTP 200; widoczne 12 PASS, 7 FAIL i 3 skipped. EXP-02 ma oddzielny rzeczywisty start/koniec, jawnego operatora i nie jest przeplatana generowaniem dokumentów. Obowiązek sesji został wykonany.
