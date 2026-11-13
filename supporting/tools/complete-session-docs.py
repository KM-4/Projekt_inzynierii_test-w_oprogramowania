from pathlib import Path
from datetime import datetime,timedelta,timezone
import json,zipfile,hashlib
root=Path('QA-Project');ev=root/'evidence/exploratory'
s=json.loads((ev/'session.json').read_text(encoding='utf-8'))
assert s['id']=='EXP-02' and s['dedicated'] and 30<=s['durationMinutes']<=45
def dump(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2),encoding='utf-8')
def stamp(x):return datetime.fromisoformat(x.replace('Z','+00:00')).astimezone(timezone(timedelta(hours=1))).strftime('%d.%m.%Y %H:%M:%S CET')
def replace(p,a,b):
    t=p.read_text(encoding='utf-8');p.write_text(t.replace(a,b),encoding='utf-8')

# Redakcja syntetycznego błędnego hasła także w opcjonalnym trace, bez zmiany obrazów/statusów.
redaction=[]
for p in [ev/'EXP-02-main-trace.zip',ev/'EXP-02-timezone-trace.zip']:
    temp=p.with_suffix('.redacted.zip');changed=[]
    with zipfile.ZipFile(p) as src,zipfile.ZipFile(temp,'w',zipfile.ZIP_DEFLATED,compresslevel=7) as out:
        for info in src.infolist():
            data=src.read(info.filename)
            try:
                text=data.decode('utf-8')
                if 'syntetyczne-bledne' in text:
                    data=text.replace('syntetyczne-bledne','[MASKED]').encode('utf-8');changed.append(info.filename)
            except UnicodeDecodeError:pass
            out.writestr(info,data)
    temp.replace(p)
    redaction.append({'file':p.name,'redactedTextEntries':changed,'imagesUnchanged':True,'reason':'Maskowanie syntetycznego hasła testowego. Rzeczywiste logowanie API odbywało się poza trace UI.'})
dump(ev/'trace-redaction.json',redaction)

auth=json.loads((ev/'DEF-03-auth.json').read_text(encoding='utf-8'))
f3=next(x for x in s['findings'] if x['needsDefect']=='DEF-03')
f4=next(x for x in s['findings'] if x['needsDefect']=='DEF-04')
defects=[
{'id':'DEF-03','title':'Niepoprawny lub wycofany token odczytu rezerwacji daje HTTP 500',
 'environment':'Windows; Chrome 157.0.8103.52; Playwright APIRequestContext 1.62.1; EXP-02; publiczne /api/*',
 'url':'https://automationintesting.online/api/booking',
 'date':auth['observations'][1]['startedAt'],'severity':'S3','priority':'P3','state':'Otwarty; powtórzony z kontrolami pozytywną i negatywną',
 'preconditions':'Bieżący roomid pobrany z GET /api/room. Żądania odczytu, bez tworzenia rezerwacji. Do kontroli pozytywnej token z aktualnego logowania szkoleniowego.',
 'steps':['GET /api/room: pobierz istniejący roomid.','GET /api/booking?roomid=<roomid> bez Cookie: kontrola 401.','Wyślij ten sam GET z Cookie: token=invalid-exp02-controlled.','Powtórz z poprawnym tokenem z aktualnego POST /api/auth/login.','Porównaj z POST /api/auth/validate dla niepoprawnego tokenu; opcjonalnie sprawdź pusty Cookie token=.'],
 'expected':'Niepoprawny/nieważny token powinien dać odpowiedź autoryzacji 401 lub 403, bez danych rezerwacji. Poprawny token: 200. Sam validate dla niepoprawnego tokenu daje 403.',
 'actual':'Błędny token i pusty Cookie w GET kolekcji dają 500 oraz []; brak tokenu 401, poprawny token 200. Powtórzenie potwierdziło wynik. Wcześniej poprawny token później dostał 403 w validate i 500 w kolekcji.',
 'impact':'Błąd danych/sesji jest przedstawiany jako awaria serwera. Ponowne logowanie działa jako obejście. Nie wykryto ujawnienia danych ani obejścia kontroli dostępu.',
 'evidence':f3['evidence'],'cases':['EXP-02'],'deduplication':'Jeden raport dla niepoprawnego, pustego i później odrzuconego tokenu w tej samej operacji kolekcji. Odrębny od DEF-01: URL nie zawiera ID zasobu w ścieżce.'},
{'id':'DEF-04','title':'W UTC+14 dostępność jest wyszukiwana dla dat o dzień wcześniejszych niż wybór',
 'environment':'Windows; Chrome 157.0.8103.52; Pacific/Kiritimati (UTC+14); rzeczywisty zegar, bez mocków; kontrola UTC i Europe/Warsaw; EXP-02',
 'url':'https://automationintesting.online/',
 'date':next(e['startedAt'] for e in s['events'] if e['title'].startswith('Hipoteza daty lokalnej:')),
 'severity':'S2','priority':'P2','state':'Otwarty; potwierdzony wpisywaniem i wyborem z kalendarza',
 'preconditions':'Kontekst Chrome timezoneId=Pacific/Kiritimati; bieżąca lokalna data ma być dzień późniejsza od UTC (badano ok. 06:48 czasu lokalnego, 16:48 UTC poprzedniego dnia). Identyczna wersja Chrome/format dat w kontekście kontrolnym UTC.',
 'steps':['Otwórz stronę w kontekście Pacific/Kiritimati przy podanym warunku czasu. Zweryfikuj strefę przez Intl.DateTimeFormat().resolvedOptions().timeZone.','Wpisz Check In=12/01/2027, Check Out=14/01/2027, zatwierdź Tab.','Kliknij Check Availability i odczytaj request GET /api/room?checkin=...&checkout=... oraz linki Book now.','Powtórz wyborem 18 i 20 stycznia 2027 z kalendarza.','Kontrola: te same 12–14 stycznia w UTC. Jeżeli warunek różnicy dat UTC/lokalnej nie jest spełniony, odtwórz w odpowiednim oknie czasu; nie oczekuj tej samej reprodukcji o każdej godzinie.'],
 'expected':'Daty wyszukiwania i linków odpowiadają datom widocznym w polach, niezależnie od strefy klienta: 12–14 stycznia -> 2027-01-12/2027-01-14.',
 'actual':'W UTC+14 pola/linki: 12–14 stycznia; request: 11–13 stycznia. Kalendarz: pola/linki 18–20, request 17–19. Domyślne daty też przesunięte. W kontroli UTC te same wpisane 12–14 przechodzą poprawnie.',
 'impact':'Wynik dostępności dotyczy innego okresu niż wybór i link rezerwacji. Może powodować błędną ofertę dostępności. Końcowy zapis i cena nie zostały sprawdzone z powodu DEF-01; nie twierdzimy, że utworzono błędny pobyt.',
 'evidence':f4['evidence']+['evidence/exploratory/EXP-02-19-timezone-calendar.png'],'cases':['EXP-02'],'deduplication':'Jeden problem konwersji dat dla trzech wariantów wejścia. UI-12 zachowuje historyczny PASS w Europe/Warsaw; nowy defekt dotyczy rozszerzenia środowiska podczas eksploracji.'}
]
dump(root/'supporting/exploration-defects.json',defects)
dump(root/'supporting/exploration-charter.json',{**s['charter'],'status':'Wykonano','actualMinutes':s['durationMinutes'],'startedAt':s['startedAt'],'finishedAt':s['finishedAt'],'operator':s['operator'],'student':s['student']})

milestone_specs=[
('Strona i katalog','Rozpoznanie aktualnego stanu strony głównej','Katalog 200; po załadowaniu zgodne typy/ceny/linki.'),
('Rezerwacja UI','Przejście z katalogu do rezerwacji wybranego pokoju','Szczegóły 500; wszystkie 3 bieżące ID też 500. DEF-01.'),
('Daty w UI','04-poprawne-dwie-noce','Poprawne, równe, odwrócone i nieistniejące dni; bez zapisu pobytu.'),
('Dolne granice','Kontakt: izolowany temat min-1 przy poprawnych pozostałych danych','Subject 4 odrzucony, 5 przyjęty; własny rekord potwierdzony na liście.'),
('Górne granice','Górna granica tematu: max+1 przy innych polach na maksimum','101 odrzucone, 100 przyjęte; phone 21 i description 2000 przyjęte.'),
('UTF-8 i poprawa','Poprawa błędu i trzeci własny rekord z polskimi znakami','Email/phone odrzucone; poprawa przyjęta; nazwa i temat z polskimi znakami na liście.'),
('Kontrola dostępu','Potwierdzony nowy problem: klasyfikacja niepoprawnego tokenu','Błędny Cookie: 500; poprawny: 200; brak: 401. Nowe DEF-03.'),
('Kalendarz i strefy','Hipoteza daty lokalnej: aktualny zegar w Pacific/Kiritimati (UTC+14)','Pola/linki i request różnią się o dzień. Nowe DEF-04; kontrola UTC poprawna.'),
('Białe znaki i JSON','EP a BVA: długość nie wystarcza przy białych znakach','Whitespace odrzucony 400; obiekt email/phone array i błędny JSON: 500, powiązane z DEF-02.'),
('Pełne granice','Zamknięcie macierzy wartości brzegowych kontaktu','Uzupełniono Phone 22 oraz Description 19/2001: wszystkie 400.'),
('Odzyskanie ścieżki','Odtwarzanie przepływu po błędzie','Front Page i Back działają; drugi pokój też blokuje się na 500.'),
('Zamknięcie','Zamknięcie zakresu sesji','Ostatni odczyt: lista 200, szczegóły 500. Zapisano trace i zakończono przeglądarki.')]
milestones=[]
for label,title,description in milestone_specs:
    e=next(e for e in s['events'] if e['title']==title)
    milestones.append({'time':e['startedAt'],'label':label,'description':description})
milestones.sort(key=lambda x:x['time'])
report={'sessionId':s['id'],'student':s['student'],'operator':s['operator'],'plannedMinutes':s['charter']['plannedMinutes'],'actualMinutes':s['durationMinutes'],'startedAt':s['startedAt'],'finishedAt':s['finishedAt'],'events':len(s['events']),'explicitApiRequests':s['explicitApiRequests'],'milestones':milestones,'boundaries':s['boundaries'],'authDecisionTable':s['authDecisionTable'],'newDefects':['DEF-03','DEF-04'],'confirmedExisting':['DEF-01','DEF-02'],'interruptions':s['interruptions'],'dedicated':s['dedicated'],'blockedActions':s['blockedActions'],'environments':s['environments']}
dump(root/'supporting/exploration-report.json',report)
timeline='\n'.join(f"| {stamp(e['time'])} | {e['label']} | {e['description']} |" for e in milestones)
boundaries='\n'.join(f"| {b['field']} | {b['minMinusOne']['length']} / {b['minMinusOne']['status']} | {b['min']['length']} / {b['min']['status']} | {b['max']['length']} / {b['max']['status']} | {b['maxPlusOne']['length']} / {b['maxPlusOne']['status']} |" for b in s['boundaries'])
decision='\n'.join(f"| {r['rule']} | {r['authClass']} | {r['roomid']} | {' lub '.join(map(str,r['expected']))} | {r['actual']} | {'zgodny' if r['pass'] else 'niezgodny'} |" for r in s['authDecisionTable'])
notes=f'''# EXP-02 - wykonana sesja eksploracyjna

Student: **Kamil Andrzejewski, nr studenta 83741**. Wykonanie narzędziowe: asystent przez Playwright. Dane studenta oznaczają właściciela projektu, nie przypisanie mu kliknięć narzędzi.

## Charter i rzeczywisty czas

**Misja:** {s['charter']['mission']}

Plan: **35 minut**. Start: **{stamp(s['startedAt'])}**. Koniec: **{stamp(s['finishedAt'])}**. Rzeczywisty czas: **30 minut 36 sekund ({s['durationMinutes']:.2f} min)**. Sesję zamknięto po zbadaniu dostępnego zakresu w wymaganym przedziale 30–45 minut.

Była to osobna, ciągła sesja poświęcona wyłącznie UI/API, analizie kodu i obserwacji, notatkom oraz oczekiwaniu na odpowiedzi i krótkim obserwacjom trwałości danych. **Nie wykonywano w jej trakcie generowania PDF/XLSX, pakowania projektu ani innych zadań.** Brak przerw na inne prace. Zapisano **{len(s['events'])} wpisów** i **{s['explicitApiRequests']} jawnych żądań API SUT**, oprócz ruchu strony wywołanego normalnymi interakcjami.

Zakres: dostępność i nietypowe daty, walidacja danych kontaktowych, zależności list/szczegółów, auth i utrata własnego stanu. Heurystyki: Follow the data, CRUD, EP/BVA/DT, stany i przejścia oraz zależności usług. Jeden operator; brak load i modyfikacji cudzych danych. Utworzono trzy własne syntetyczne wiadomości z markerami QAEXP02. Nie utworzono rezerwacji w tej sesji.

Środowiska: Windows, Chrome 157.0.8103.52; podstawowe Europe/Warsaw oraz kontrolowane konteksty Pacific/Kiritimati i UTC. Zegar i odpowiedzi API były rzeczywiste, bez mockowania. Zmiana strefy to jawna konfiguracja klienta.

## Dziennik głównych działań

| Czas Europe/Warsaw | Obszar | Działania i obserwacja |
|---|---|---|
{timeline}

Pełne wejścia, odpowiedzi, czasy i notatki: [session.json](evidence/exploratory/session.json). Poprzednia przeplatana obserwacja EXP-01 jest zachowana jako [archiwum](evidence/exploratory/archive/EXP-01-interleaved-session.json) i **nie zastępuje tej sesji**. Jedną wstępną interpretację tokenu skorygowano jawnie po odczycie 403; oryginalna odpowiedź pozostała niezmieniona.

## Techniki i konkretne dane

Każda liczba w poniższej tabeli to **długość / status HTTP**. Punkty poprawne potwierdzono zapisem i obecnością własnego markera na liście; negatywne zmieniały wskazane pole. Długości dotyczą ASCII, aby uniknąć niejednoznaczności Unicode/grapheme.

| Pole | min-1 | min | max | max+1 |
|---|---|---|---|---|
{boundaries}

Whitespace o poprawnej długości nadal odrzucono jako blank: subject=5 spacji, phone=11 spacji i description=20 spacji dały 400. Zły format email i kombinacja email+subject zostały odrzucone z odpowiednimi komunikatami. Polska nazwa i temat `Pokój` były widoczne na liście po udanym zapisie. Szczegółowego odczytu email/opisu nie potwierdzono, bo trasa ID zwracała 500.

## Tablica decyzyjna dostępu

| Reguła | Klasa uwierzytelnienia | Roomid | Oczekiwany HTTP | Actual HTTP | Ocena |
|---|---|---|---|---|---|
{decision}

Weryfikacja `/api/auth/validate` potwierdziła: 200 dla nowego poprawnego tokenu, 403 dla niepoprawnego/odrzuconego, 401 przy braku. Ten sam rodzaj nieważnej sesji dawał 500 w GET kolekcji rezerwacji. [Dowód DEF-03](evidence/exploratory/DEF-03-auth.json).

## Ustalenia i deduplikacja

- **DEF-01, potwierdzenie:** wszystkie trzy bieżące ID pokoi dały 500; kliknięcia dwóch prawdziwych linków też nie otworzyły Reserve Now. Powrót Front Page/Back odzyskiwał kontakt i katalog. Nie liczono kolejnych pokoi jako nowych defektów.
- **DEF-02, potwierdzenie/rozszerzenie:** obiekt email, tablica phone i niepoprawna składnia JSON w POST wiadomości dały 500; null i blank prawidłowo 400. To warianty tej samej kategorii obsługi złych wejść w POST wiadomości, nie trzy nowe zgłoszenia.
- **DEF-03, nowy:** błędny, pusty i później odrzucony token przy GET kolekcji rezerwacji daje 500 zamiast odpowiedzi auth 401/403. Poprawne konto/token działają. S3/P3, bez dowodu ujawnienia danych.
- **DEF-04, nowy:** w UTC+14 pola i linki 12–14.01.2027, request 11–13.01; kalendarz 18–20 -> request 17–19. Kontrola UTC zachowuje 12–14. S2/P2. [Dowód i porównania](evidence/exploratory/DEF-04-dates.json). Warunek odtworzenia: lokalna data klienta ma różnić się od UTC, jak w badanym oknie 06:48 UTC+14. Nie twierdzimy, że błąd wystąpi o każdej godzinie/strefie.

Wyniki 22 zaplanowanych TC pozostają historycznym przebiegiem 12 PASS / 7 FAIL / 3 BLOCKED / 0 NOT RUN. **Eksploracja nie zwiększa tych liczników.** UI-12 pozostał PASS w Europe/Warsaw; nowy błąd ujawniono w dodatkowej strefie.

## Stan, ograniczenia i pytania

Jedyny DELETE własnej wiadomości dał 500, a rekord nadal był na liście. Dwa własne markery później zniknęły, trzeci był widoczny do 16:47:09 UTC i nieobecny o 16:49:52 UTC. Końcowy odczyt nie zawierał trzech znanych markerów ani nazwy użytej w negatywnych payloadach. To jest zgodne z resetem; **nie oznacza udanego cleanup ani dowodu wspólnego harmonogramu usług**.

Automatyczna kontrola narzędzi odrzuciła dodatkowy blok POST rezerwacji przed wykonaniem, wskazując możliwość utworzenia pobytu mimo błędnych danych. Nie obchodzono tej blokady. Próby te są BLOCKED i nie mają statusów HTTP; nie są zaliczane do wykonanych. Archiwalne 409 z EXP-01 pozostają wyraźnie archiwalne.

Q-01: wymagana walidacja relacji dat już w wyszukiwaniu? Q-02: rzeczywisty commit wdrożenia? Q-03: harmonogram utraty danych/tokenów? Q-04: root cause błędów ID? Q-05: czy przywrócenie poprzedniej daty po niemożliwym wpisie powinno dawać komunikat? Te pytania nie są zgłoszeniami potwierdzonych defektów.

## Zakończenie i dalsze działania

**Obowiązkowa sesja 30–45 minut została wykonana i udokumentowana; nie pozostaje zadaniem do zrobienia przez zespół.** Do przygotowania obrony należy przeczytać i zrozumieć ustalenia. Po naprawie SUT pozostaje retest UI-08..10 oraz nieosiągniętych PUT, auth i dat w strefach. Dane pozostałych członków, numer zespołu oraz rzeczywisty wkład uzupełnia zespół.

Trace: [sesja główna](evidence/exploratory/EXP-02-main-trace.zip), [daty UTC+14](evidence/exploratory/EXP-02-timezone-trace.zip). W trace zredagowano syntetyczne błędne hasło; screenshotów i wyników nie zmieniano.
'''
(root/'03_Exploratory.md').write_text(notes,encoding='utf-8')

# Aktywne dokumenty: aktualny zakres i brak nieukończonego obowiązku eksploracji.
p=root/'README.md'
replace(p,'Dwa unikalne raporty defektów: S1/P1 i S3/P3.','Cztery unikalne raporty defektów: S1=1, S2=1, S3=2, S4=0. Dwa nowe ustalenia pochodzą z osobnej sesji EXP-02, bez zmiany liczników 22 TC.')
replace(p,'`04_Defects.xlsx`: dwa unikalne raporty','`04_Defects.xlsx`: cztery unikalne raporty')
replace(p,'- Sesja eksploracyjna jest pracą asystowaną, z jawną osią czasu i analizą. Jeżeli prowadzący wymaga własnej wspólnej sesji studentów, należy wykonać i udokumentować ją oddzielnie, bez przypisywania sobie sesji asystenta.','- Sesja EXP-02 została wykonana: **30 minut 36 sekund wydzielonej eksploracji**, 13.11.2026 17:31:56–18:02:32 CET. Obejmuje UI/API, analizę i notatki, bez pracy nad pozostałymi artefaktami. Nie pozostaje obowiązkiem do wykonania. Operator narzędziowy i dane studenta są jawne w dzienniku.')
replace(p,'- Przetestowano jedną przeglądarkę desktop.','- Przetestowano Chrome desktop, w eksploracji także trzy strefy klienta (Europe/Warsaw, UTC+14, UTC).')
p=root/'supporting/defense-notes.md'
replace(p,'Dwa unikalne defekty: S1 i S3.','Cztery unikalne defekty: S1=1, S2=1, S3=2. EXP-02 trwała 30 minut 36 sekund; nowy problem dat ujawnił się w UTC+14.')
replace(p,'**Czy wszystkie granice zostały sprawdzone?** Nie. Mamy obowiązkowy przykład BVA 4/5 oraz telefon 10/11. Dodatkowe negatywne granice z eksploracji nie zastępują pełnej macierzy obu końców każdego pola. Nie deklarujemy pełnego pokrycia.','**Jakie granice zostały sprawdzone?** W TC mamy temat 4/5 i telefon 10/11. Sesja EXP-02 uzupełniła oba końce trzech przedziałów: temat 4/5/100/101, telefon 10/11/21/22, opis 19/20/2000/2001. To nadal nie oznacza pełnego pokrycia wszystkich pól i Unicode.')
replace(p,'**Dlaczego tylko dwa defekty?** Jeden raport grupuje wspólny symptom 500 na trasach z ID i jego skutki; drugi dotyczy złego typu email. Wspólny root cause pierwszego problemu pozostaje hipotezą. Liczba raportów nie jest miarą jakości projektu.','**Skąd cztery defekty?** DEF-01 grupuje trasy z ID, DEF-02 złe wejścia POST wiadomości, DEF-03 niepoprawny token kolekcji, DEF-04 różnicę dat między polami/linkami i wyszukiwaniem w UTC+14. Nie liczymy powtórzeń jako nowych bugów. Dwa ostatnie odkryto w oddzielnej EXP-02; 22 TC zachowują wyniki wcześniejszego pełnego przebiegu.')
replace(p,'- [ ] Wyniki ewentualnej własnej sesji zespołu opisane osobno z rzeczywistym czasem i autorami.','- [x] Wydzielona EXP-02 wykonana i opisana: 30 minut 36 sekund. Przed obroną zespół zapoznaje się z rzeczywistym dziennikiem i operatorem sesji.')
replace(p,'| 0:50–1:40 | Osoba 1 |','| 0:50–1:40 | Kamil Andrzejewski (83741) |')
replace(p,'| 5:30–6:10 | Osoba 1 |','| 5:30–6:10 | Kamil Andrzejewski (83741) |')
p=root/'supporting/requirements-checklist.md'
replace(p,'Jawny rzeczywisty czas i charakter asystowany w notatce; sesji nie przypisano studentom','Wykonano EXP-02: 30 min 36 s, wydzielona sesja bez innych zadań; 114 wpisów, jawny operator')
replace(p,'dwa raporty','cztery raporty')
replace(p,'DEF-01 S1/P1, DEF-02 S3/P3','DEF-01 S1/P1, DEF-02 i DEF-03 S3/P3, DEF-04 S2/P2')
p=root/'supporting/work-plan.md'
replace(p,'pełny przebieg i osobna sesja eksploracyjna asystowana z jawną osią czasu. Jej charakter przeplatany dokumentacją opisano w 03_Exploratory; ciągła sesja manualna studentów pozostaje zadaniem zespołu, jeśli wymaga jej prowadzący.','pełny przebieg oraz wykonana wydzielona EXP-02 (30 min 36 s); 114 wpisów, bez prac nad innymi artefaktami. EXP-01 zachowana jako archiwum.')
replace(p,'dwa unikalne raporty defektów','cztery unikalne raporty defektów (dwa z TC, dwa z EXP-02)')
replace(p,'Dziennik eksploracji wyraźnie odróżnia czas kalendarzowy i pracę asystowaną od ciągłej sesji manualnej studentów.','EXP-02 ma oddzielny rzeczywisty start/koniec, jawnego operatora i nie jest przeplatana generowaniem dokumentów. Obowiązek sesji został wykonany.')
p=root/'05_Automation/README.md';text=p.read_text(encoding='utf-8');text=text.replace('# Uruchomienie automatyzacji','# Uruchomienie automatyzacji\n\nStudent: **Kamil Andrzejewski, nr studenta 83741**.',1);p.write_text(text,encoding='utf-8')
(root/'05_Automation/reports/README.md').write_text('# Raport ostatniego pełnego przebiegu\n\nStudent: Kamil Andrzejewski, nr studenta 83741.\n\nNatywne pliki HTML/JSON/JUnit zachowują rzeczywisty przebieg 22 TC (12 PASS, 7 FAIL, 3 skipped/BLOCKED). Nie zmieniono historycznych wyników. Późniejsza EXP-02 i nowe DEF-03/DEF-04 znajdują się w 03_Exploratory i 04_Defects; nie doliczono ich do licznika TC.\n',encoding='utf-8')
p=root/'evidence/defects/README.md';text=p.read_text(encoding='utf-8');text+='\n- **DEF-03:** [nieważna sesja](../exploratory/DEF-03-auth.json).\n- **DEF-04:** [daty i strefy](../exploratory/DEF-04-dates.json), [panel UTC+14](../exploratory/EXP-02-20-date-panel-utc14.png).\n';p.write_text(text,encoding='utf-8')
p=root/'supporting/test-design-techniques.md';text=p.read_text(encoding='utf-8');text+='\n## Uzupełnienie z wykonanej EXP-02\n\nW osobnej sesji 30 min 36 s wykonano obie granice trzech pól: Subject 4/5/100/101, Phone 10/11/21/22, Description 19/20/2000/2001. Punkty poprawne dały 200 i własny rekord na liście, niepoprawne 400. Dodano EP whitespace oraz DT braku/błędnego/poprawnego auth. To pokrycie eksploracyjne nie zwiększa liczników 22 TC. Szczegóły i dowody w 03_Exploratory.md oraz evidence/exploratory/session.json.\n';p.write_text(text,encoding='utf-8')
print(json.dumps({'session':s['id'],'minutes':s['durationMinutes'],'newDefects':len(defects),'traceRedaction':redaction},ensure_ascii=False,indent=2))
