import fs from 'node:fs/promises';
import path from 'node:path';
const root='QA-Project';
const cases=JSON.parse(await fs.readFile(`${root}/supporting/test-cases.json`,'utf8'));
const report=JSON.parse(await fs.readFile(`${root}/05_Automation/reports/case-results.json`,'utf8'));
if(report.results.length!==cases.length)throw new Error(`Raport ma ${report.results.length} wyników dla ${cases.length} przypadków. Uruchom pełny przebieg.`);
for(const c of cases){
  c.defect='';
  const r=report.results.find(x=>x.id===c.id);if(!r)throw new Error(`Brak ${c.id}`);
  const type=c.type.toLowerCase();let e={};try{e=JSON.parse(await fs.readFile(`${root}/evidence/${type}/${c.id}.json`,'utf8'))}catch{}
  c.status=r.status;c.executedAt=r.startedAt;c.durationMs=r.durationMs;
  c.evidence=[`evidence/${type}/${c.id}.json`];
  if(c.type==='UI')c.evidence.push(`evidence/ui/${c.id}.png`);
  for(const attachment of r.attachments||[])if(attachment.name==='trace'&&attachment.path)c.evidence.push(attachment.path);
  const requests=e.requests||[];const failed=(e.assertions||[]).filter(x=>!x.pass);
  c.actual=requests.map(x=>`${x.request.method} ${new URL(x.request.url,'https://automationintesting.online').pathname}${new URL(x.request.url,'https://automationintesting.online').search} → ${x.response.status}`).join('\n');
  if(c.status==='BLOCKED')c.actual=`Zablokowany przed właściwymi krokami: ${r.reason||'niedostępna zależność'}.\n${c.actual}`;
  else if(failed.length)c.actual+='\nNiezgodności: '+failed.map(x=>`${x.label}: oczekiwano ${JSON.stringify(x.expected)}, otrzymano ${JSON.stringify(x.actual)}`).join('; ');
  else c.actual+='\nWszystkie jawne asercje i kontrole runnera zakończone pomyślnie.';
  if(['UI-02','UI-06'].includes(c.id))c.actual+='\nPotwierdzenie formularza osiągnięte. FAIL dotyczy nieudanego sprzątania własnego rekordu.';
  if(['API-09','API-10'].includes(c.id))c.actual+='\nUtworzenie i obecność na liście potwierdzone. Szczegóły i cleanup zwracają 500; kroki PUT i weryfikacja zmiany nie zostały osiągnięte.';
  if(requests.some(x=>/\/api\/(room|message|booking)\/\d+/.test(x.request.url)&&x.response.status===500)||c.status==='BLOCKED')c.defect='DEF-01';
  if(c.id==='API-06'&&c.status==='FAIL')c.defect='DEF-02';
}
const metrics={planned:cases.length,executed:cases.filter(x=>['PASS','FAIL'].includes(x.status)).length,PASS:0,FAIL:0,BLOCKED:0,'NOT RUN':0,ui:cases.filter(x=>x.type==='UI').length,api:cases.filter(x=>x.type==='API').length,negative:cases.filter(x=>x.polarity==='Negatywny').length,startedAt:cases.map(x=>x.executedAt).sort()[0],finishedAt:report.finishedAt,recommendation:'NO-GO',defectsBySeverity:{S1:0,S2:0,S3:0,S4:0}};
for(const c of cases)metrics[c.status]++;
metrics.completionRate=metrics.executed/metrics.planned;metrics.passRateAmongExecuted=metrics.PASS/metrics.executed;
const environment='Windows; Chrome 157.0.8103.52; Playwright 1.62.1; Node 25.9.0; Europe/Warsaw; publiczne proxy /api/*; UI v2.2';
const defects=[
 {id:'DEF-01',title:'Trasy zasobów z ID zwracają 500; rezerwacja UI i sprzątanie danych zablokowane',environment,url:'https://automationintesting.online',date:metrics.startedAt,severity:'S1',priority:'P1',state:'Otwarty; powtarzalny symptom wdrożenia; root cause niepotwierdzony',preconditions:'Publiczna lista pokoi dostępna; roomid pobrany dynamicznie. Dla wiadomości/rezerwacji: utworzony własny rekord i bieżący token.',steps:['GET /api/room, wybierz istniejący roomid.','GET /api/room/<roomid>: porównaj status.','Otwórz /reservation/<roomid>?checkin=<przyszła data>&checkout=<data+2>.','Dodatkowe reprodukcje tego samego symptomu: utwórz własny message lub booking, znajdź jego ID na liście, wykonaj GET i DELETE własnego ID z tokenem.'],expected:'GET istniejącego pokoju/rekordu 200; nieistniejący pokój 404; UI pokazuje szczegóły i rezerwację; DELETE własnego rekordu 200 w proxy.',actual:'HTTP 500 i tekst Internal Server Error na dynamicznych trasach. UI pozostaje na spinnerze; poprawne POST i listy działają. Sprzątanie własnych danych również kończy się 500.',impact:'Blokada głównego procesu rezerwacji gościa (S1 według skali prowadzącego). Brak sensownego obejścia w zwykłym UI. Pozostałości danych testowych do resetu.',evidence:cases.filter(c=>c.defect==='DEF-01').flatMap(c=>c.evidence),cases:cases.filter(c=>c.defect==='DEF-01').map(c=>c.id),deduplication:'Jeden raport grupuje wspólny, powtarzalny symptom tras z ID w kilku usługach. Nie twierdzimy, że znamy wspólną przyczynę. Po diagnozie właściciel może rozdzielić zakres naprawy; nie liczymy każdego HTTP 500 jako nowego defektu.'},
 {id:'DEF-02',title:'Email jako obiekt JSON w wiadomości powoduje HTTP 500',environment,url:'https://automationintesting.online/api/message',date:cases.find(x=>x.id==='API-06').executedAt,severity:'S3',priority:'P3',state:'Otwarty',preconditions:'Publiczny POST /api/message dostępny, pozostałe pola poprawne.',steps:['Przygotuj poprawny payload wiadomości jak w API-06.','Zastąp email obiektem {"value":"qa@example.test"}.','Wyślij POST /api/message z Content-Type application/json.','Sprawdź status i treść odpowiedzi.'],expected:'Błędny typ pola String jest błędem danych klienta i powinien być odrzucony 400; brak zapisu. Wymaganie 400 jest kryterium jakości projektu, nie cytatem specyfikacji wdrożenia.',actual:'HTTP 500, JSON {"error":"Failed to create message"}. Zwykły niepoprawny format tekstowego email daje 400 w API-05.',impact:'Ograniczona wada obsługi niepoprawnych danych; poprawne formularze nadal działają. Brak dowodu awarii całej usługi lub utworzenia tego rekordu.',evidence:['evidence/api/API-06.json'],cases:['API-06'],deduplication:'Odrębny objaw POST przy złym typie, niezależny od dynamicznych tras z ID.'},
];
// Ustalenia z osobnej sesji nie zmieniają statusów historycznego przebiegu 22 TC.
try { defects.push(...JSON.parse(await fs.readFile(`${root}/supporting/exploration-defects.json`,'utf8'))); }
catch(error) { if(error.code!=='ENOENT')throw error; }
for(const d of defects)metrics.defectsBySeverity[d.severity]++;
metrics.uniqueDefects=defects.length;
await fs.writeFile(`${root}/supporting/executed-cases.json`,JSON.stringify(cases,null,2));
await fs.writeFile(`${root}/supporting/test-cases.json`,JSON.stringify(cases,null,2));
await fs.writeFile(`${root}/supporting/metrics.json`,JSON.stringify(metrics,null,2));
await fs.writeFile(`${root}/supporting/defects.json`,JSON.stringify(defects,null,2));
await fs.writeFile(`${root}/supporting/traceability-matrix.md`,'# Macierz śledzenia\n\nŹródło: executed-cases.json, risks.json i rzeczywisty raport ostatniego pełnego uruchomienia. Eksploracja nie jest doliczana do test cases.\n\n| TC | Obszar | Ryzyko | Technika | Status | Defekt | Evidence |\n|---|---|---|---|---|---|---|\n'+cases.map(c=>`| ${c.id} | ${c.area} | ${c.risk} | ${c.technique} | ${c.status} | ${c.defect||'-'} | ${c.evidence.map(e=>`[${path.basename(e)}](../${e})`).join(', ')} |`).join('\n')+'\n');
if(defects.some(d=>d.cases.includes('EXP-02'))) await fs.appendFile(`${root}/supporting/traceability-matrix.md`,'\n## Osobna sesja eksploracyjna\n\nEXP-02: 30 minut 36 sekund wydzielonej eksploracji. R-03/R-04/R-05/R-06; nowe DEF-03 i DEF-04, potwierdzenia DEF-01/DEF-02. [Dziennik](../03_Exploratory.md), [auth](../evidence/exploratory/DEF-03-auth.json), [daty](../evidence/exploratory/DEF-04-dates.json). Wyniki EXP-02 nie zwiększają 22 TC ani nie zmieniają historycznego PASS UI-12 w Europe/Warsaw.\n');
const risks=JSON.parse(await fs.readFile(`${root}/supporting/risks.json`,'utf8'));
await fs.writeFile(`${root}/supporting/risk-matrix.md`,'# Analiza ryzyka\n\nSkala P: 1 mało prawdopodobne, 2 możliwe, 3 prawdopodobne. I: 1 ograniczony UX, 2 istotna funkcja/dane, 3 kluczowy proces lub uprawnienia. P×I: 1–2 niski, 3–4 średni, 6–9 wysoki. P1 obejmuje ryzyka o I=3 (rezerwacja, daty, uprawnienia) i niezbędne zależności procesu. P2 obejmuje lokalną walidację kontaktu i katalog o I=2. Przy równym P×I wyższy wpływ ma pierwszeństwo. R-06 ma wspólne zabezpieczenia w każdym teście zapisu; nie zmienia automatycznie priorytetu podstawowego celu przypadku.\n\n| ID | Obszar / potencjalna awaria | P | I | P×I | Priorytet i uzasadnienie | Przypadki |\n|---|---|---|---|---|---|---|\n'+risks.map(r=>`| ${r.id} | ${r.area}: ${r.description} | ${r.P} | ${r.I} | ${r.score} | ${r.reason} | ${r.cases.join(', ')} |`).join('\n')+'\n\nRyzyko jest hipotezą planistyczną; potwierdzone defekty są osobno w 04_Defects.xlsx. Kolejność wykonania techniczna może zaczynać od odczytów API, które przygotowują stan do testów P1.\n');
console.log(metrics);
