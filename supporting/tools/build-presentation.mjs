// Strona do prezentowania na obronie w formie raportu-artykułu: rozdziały per osoba, prosty język,
// 1–2 ilustracje na rozdział, ramka z najważniejszym wnioskiem, słowniczek. Szczegóły jako linki do plików.
// Źródła liczb: supporting/*.json i evidence/. Uruchom: node supporting/tools/build-presentation.mjs -> 00_Prezentacja.html
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.env.QA_PROJECT_DIR || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const json = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
// Przykład testu w modelu POM: blok UI-05 z tests/ui.spec.ts (bez komentarza nagłówkowego).
const uiSrc = fs.readFileSync(path.join(root, '05_Automation/tests/ui.spec.ts'), 'utf8').replace(/\r/g, '');
const pomExample = (uiSrc.split(/\n(?=\/\/ UI-\d+)/).find((b) => b.startsWith('// UI-05')) || '').split('\n').filter((l) => !l.startsWith('//')).join('\n').trim();
const cases = json('supporting/test-cases.json');
const metrics = json('supporting/metrics.json');
const defects = json('supporting/defects.json');
const risks = json('supporting/risks.json');
const team = json('supporting/team.json');
const ev = (id) => { try { return json(`evidence/${id.startsWith('UI') ? 'ui' : 'api'}/${id}.json`); } catch { return {}; } };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const when = new Date(metrics.finishedAt).toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const m = (i) => (team.members || [])[i] || { name: `[Osoba ${i + 1}]`, studentNumber: '', role: '' };
const count = (type, status) => cases.filter((c) => (!type || c.type === type) && c.status === status).length;

const figSteps = (id, caption) => {
  const steps = ev(id).steps || [];
  return `<figure class="fig"><div class="shots n${Math.min(steps.length, 3)}">${steps.map((s) => `<a href="${esc(s.file)}" target="_blank"><img src="${esc(s.file)}" alt="${esc(s.label)}"><span>${s.no}. ${esc(s.label)}</span></a>`).join('')}</div><figcaption>${caption}</figcaption></figure>`;
};
const takeaway = (t) => `<aside class="take"><b>Najważniejszy wniosek</b><p>${t}</p></aside>`;
const chapter = (no, who, id, title, body) => `<section class="ch" id="${id}"><div class="chhead"><span class="chno">${no}</span><div><h2>${title}</h2><p class="by p${who + 1}">Przedstawia: <b>${esc(m(who).name)}</b> · ${esc(m(who).role)}</p></div></div>${body}</section>`;

// Poziomy słownie.
const pWord = { 1: 'małe', 2: 'średnie', 3: 'duże' };
const iWord = { 1: 'drobne', 2: 'istotne', 3: 'poważne' };
const lvl = (s) => (s >= 6 ? ['wysokie', 'hi'] : s >= 3 ? ['średnie', 'mid'] : ['niskie', 'lo']);
const riskPlain = {
  'R-01': 'Gość nie może zarezerwować pokoju',
  'R-02': 'Lista pokoi i szczegóły pokoju się nie zgadzają',
  'R-03': 'Formularze przyjmują błędne dane albo psują się na nich',
  'R-04': 'Osoba bez uprawnień widzi rezerwacje lub panel admina',
  'R-05': 'Wybrane daty zmieniają się po drodze albo cena jest źle liczona',
  'R-06': 'Testy psują sobie dane (reset środowiska, brak sprzątania)',
};
const riskRows = risks.slice().sort((a, b) => b.score - a.score || b.I - a.I).map((r) => { const [w, c] = lvl(r.score); return `<tr><td><b>${esc(riskPlain[r.id] || r.description)}</b></td><td>${pWord[r.P]}</td><td>${iWord[r.I]}</td><td><span class="lv ${c}">${w}</span></td></tr>`; }).join('');

const sevWord = { S1: 'krytyczny', S2: 'poważny', S3: 'średni', S4: 'drobny' };
const defectPlain = {
  'DEF-01': ['Strona pokoju i rezerwacja w ogóle się nie otwierają', 'Każde zapytanie o konkretny pokój, wiadomość czy rezerwację (po numerze) kończy się błędem serwera. Gość widzi tylko kręcące się kółko i nie może zarezerwować pokoju.'],
  'DEF-02': ['Nietypowo wysłany email powoduje awarię zamiast komunikatu', 'Gdy email zostanie wysłany w złym formacie technicznym (jako obiekt zamiast tekstu), serwer zgłasza awarię zamiast grzecznie odrzucić dane.'],
  'DEF-03': ['Wygasłe logowanie powoduje awarię zamiast prośby o zalogowanie', 'Z nieważnym „biletem” logowania system zgłasza błąd serwera, zamiast odpowiedzieć „zaloguj się ponownie”.'],
  'DEF-04': ['Dla osób w innej strefie czasowej wyszukiwarka szuka o dzień wcześniej', 'Gdy komputer gościa ma strefę czasową UTC+14, wyszukiwarka wysyła daty przesunięte o jeden dzień względem tych, które wybrał.'],
};
const defectRows = defects.map((d) => { const [t, desc] = defectPlain[d.id] || [d.title, d.actual]; return `<tr><td><b>${esc(t)}</b><br><span class="muted">${esc(desc)}</span></td><td><span class="sev ${esc(d.severity)}">${sevWord[d.severity] || d.severity}</span></td><td>${d.cases.includes('EXP-02') ? 'testy eksploracyjne' : `${d.cases.length} ${d.cases.length === 1 ? 'przypadek' : 'przypadków'}`}</td></tr>`; }).join('');

// Przebieg API-09 słownie.
const e9 = ev('API-09');
const plain9 = ['Logujemy się jako administrator', 'Wysyłamy nową wiadomość', 'Szukamy jej na liście wiadomości', 'Otwieramy ją po numerze', 'Oznaczamy jako przeczytaną (zmiana)', 'Sprawdzamy na liście, czy zmiana się zapisała', 'Usuwamy naszą wiadomość', 'Sprawdzamy, czy zniknęła'];
const flow9 = (e9.requests || []).map((r, i) => { const s = r.response.status; const a = (e9.assertions || []).filter((x) => x.requestIndex === i && !x.informational); const ok = s < 400 && a.every((x) => x.pass); return `<li class="${ok ? 'ok' : 'bad'}"><span class="mark">${ok ? '✓' : '✗'}</span>${esc(plain9[i] || '')}<span class="muted"> – ${ok ? 'działa' : s >= 500 ? `błąd serwera (kod ${s})` : 'wynik niezgodny z oczekiwanym'}</span></li>`; }).join('');

const fail = metrics.FAIL, pass = metrics.PASS, blk = metrics.BLOCKED;
const html = `<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Projekt testowy – Restful-Booker-Platform</title>
<style>
:root{--bg:#f7f5f0;--paper:#fffdf9;--ink:#1d2433;--muted:#5b6475;--line:#e4ddcf;--accent:#2f5fd0;--ok:#1f7a4a;--okbg:#e2f2e8;--bad:#b13d1c;--badbg:#fbe5dc;--mid:#8a6400;--midbg:#f8efcf;--c1:#2f5fd0;--c2:#7a3fb0;--c3:#b4501e;--c4:#1f7a6a}
@media (prefers-color-scheme:dark){:root{--bg:#12172a;--paper:#1a2034;--ink:#eceff6;--muted:#aab3c6;--line:#2d3753;--accent:#8fb0ff;--ok:#82d4a4;--okbg:#1d3a2a;--bad:#ff9f7a;--badbg:#45251c;--mid:#f0cf6a;--midbg:#3b3217;--c1:#8fb0ff;--c2:#c79bf0;--c3:#f39a6b;--c4:#6fd3c0}}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--ink);font:clamp(17px,0.45vw + 12px,21px)/1.7 Georgia,"Times New Roman",serif}
.page{width:min(1500px,94vw);margin:0 auto;background:var(--paper);padding:clamp(28px,3.5vw,64px) clamp(20px,4.5vw,80px) 80px;box-shadow:0 0 40px rgba(0,0,0,.06);min-height:100vh}
h1,h2,h3,.sans,figcaption,table,.by,.toc,.take b,.facts,.lv,.sev,.muted{font-family:"Segoe UI",system-ui,-apple-system,Arial,sans-serif}
h1{font-size:clamp(30px,2.6vw,46px);line-height:1.15;margin:0 0 8px}h2{font-size:clamp(24px,1.9vw,34px);line-height:1.2;margin:0}h3{font-size:21px;margin:30px 0 8px}
.sub{color:var(--muted);font-size:17px;margin:0 0 30px}.muted{color:var(--muted);font-size:15px}
p{margin:0 0 16px}a{color:var(--accent)}
.lead{font-size:21px}
.facts{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:24px 0 10px}.facts div{border:1px solid var(--line);border-radius:12px;padding:12px 14px;background:var(--bg)}.facts b{display:block;font-size:34px;line-height:1.1}.facts span{font-size:14px;color:var(--muted);line-height:1.35;display:block}
.facts .ok b{color:var(--ok)}.facts .bad b{color:var(--bad)}.facts .mid b{color:var(--muted)}
.verdict{border-left:6px solid var(--bad);background:var(--badbg);padding:14px 20px;border-radius:0 12px 12px 0;margin:20px 0}.verdict b{font-family:"Segoe UI",system-ui,sans-serif;color:var(--bad);font-size:22px}
.team{display:grid;grid-template-columns:1fr 1fr;gap:10px 24px;font-family:"Segoe UI",system-ui,sans-serif;font-size:16px;margin:10px 0 0}.team div{border-left:5px solid var(--pc);padding:4px 12px}.p1{--pc:var(--c1)}.p2{--pc:var(--c2)}.p3{--pc:var(--c3)}.p4{--pc:var(--c4)}
.toc{border:1px solid var(--line);border-radius:12px;padding:16px 22px;margin:28px 0 10px;font-size:16px}.toc ol{margin:6px 0 0;padding-left:22px}.toc li{margin:3px 0}
.ch{border-top:1px solid var(--line);margin-top:48px;padding-top:36px}.chhead{display:flex;gap:16px;align-items:flex-start;margin-bottom:18px}.chno{flex:none;width:46px;height:46px;border-radius:50%;background:var(--ink);color:var(--paper);display:flex;align-items:center;justify-content:center;font:700 22px "Segoe UI",sans-serif}
.by{margin:4px 0 0;font-size:15px;color:var(--muted);border-left:4px solid var(--pc);padding-left:8px}
.fig{margin:22px 0 26px}.fig figcaption{font-size:14.5px;color:var(--muted);margin-top:8px;line-height:1.5}
.shots{display:grid;gap:12px}.shots.n1 img{max-height:190px;object-position:top center}.shots.n1{grid-template-columns:1fr}.shots.n2{grid-template-columns:1fr 1fr}.shots.n3{grid-template-columns:1fr 1fr 1fr}
.shots a{display:flex;flex-direction:column;gap:6px;text-decoration:none;color:var(--ink);border:1px solid var(--line);border-radius:10px;padding:8px;background:var(--bg);font:14px/1.4 "Segoe UI",sans-serif}.shots img{width:100%;max-height:clamp(240px,24vw,380px);object-fit:contain;object-position:top left;background:#fff;border-radius:6px;border:1px solid var(--line)}
table{border-collapse:collapse;width:100%;font-size:16px;line-height:1.45;margin:6px 0}th,td{text-align:left;padding:10px 10px;border-bottom:1px solid var(--line);vertical-align:top}th{font-size:13px;color:var(--muted);text-transform:uppercase;letter-spacing:.4px}
.lv,.sev{display:inline-block;font-size:13px;font-weight:700;padding:2px 10px;border-radius:12px;white-space:nowrap}.lv.hi,.sev.S1,.sev.S2{background:var(--badbg);color:var(--bad)}.lv.mid,.sev.S3{background:var(--midbg);color:var(--mid)}.lv.lo,.sev.S4{background:var(--okbg);color:var(--ok)}
.take{background:var(--bg);border:1px solid var(--line);border-left:6px solid var(--pc,var(--accent));border-radius:0 12px 12px 0;padding:14px 20px;margin:24px 0 6px}.take b{font-size:14px;text-transform:uppercase;letter-spacing:.6px;color:var(--muted)}.take p{margin:6px 0 0;font-size:20px}
.ch:nth-of-type(1) .take{--pc:var(--c1)}#ch2 .take{--pc:var(--c2)}#ch3 .take{--pc:var(--c3)}#ch4 .take{--pc:var(--c4)}#ch5 .take{--pc:var(--c1)}
.tc{border:1px solid var(--line);border-radius:12px;padding:6px 18px;background:var(--bg);font:16px/1.5 "Segoe UI",sans-serif;margin:10px 0 20px}.tc dl{display:grid;grid-template-columns:150px 1fr;gap:8px 14px;margin:10px 0}.tc dt{color:var(--muted)}.tc dd{margin:0}
.bar{display:flex;height:34px;border-radius:10px;overflow:hidden;font:600 14px "Segoe UI",sans-serif;margin:8px 0 4px}.bar div{display:flex;align-items:center;padding-left:12px;color:#1d2433;white-space:nowrap}.b-ok{background:#9fd8b6}.b-bad{background:#f3ad8e}.b-mid{background:#c3c9d6}
.life{list-style:none;padding:0;margin:10px 0 20px;font:17px/1.5 "Segoe UI",sans-serif;counter-reset:s}.life li{padding:8px 12px;border-bottom:1px solid var(--line);display:flex;gap:10px;align-items:baseline}.life .mark{font-weight:700;width:18px}.life li.ok .mark{color:var(--ok)}.life li.bad .mark{color:var(--bad)}.life li.bad{background:var(--badbg)}
.links{font:15px/1.6 "Segoe UI",sans-serif;color:var(--muted)}
.gloss dt{font:700 16px "Segoe UI",sans-serif;margin-top:12px}.gloss dd{margin:2px 0 0;font-size:17px}
.placeholder{border:2px dashed var(--c3);border-radius:12px;padding:10px 16px;background:var(--badbg);font:16px "Segoe UI",sans-serif}
pre.code{background:#1d2433;color:#e8ecf4;border-radius:12px;padding:16px 18px;font:14px/1.55 Consolas,"Cascadia Mono",monospace;overflow-x:auto;white-space:pre;margin:0}
code{font-family:Consolas,monospace;font-size:.85em;background:var(--bg);padding:1px 5px;border-radius:4px}
@media (max-width:760px){.page{padding:28px 20px}.facts{grid-template-columns:1fr 1fr}.team,.shots.n2,.shots.n3{grid-template-columns:1fr}}
@media print{body{background:#fff}.page{box-shadow:none}.ch{break-before:page}}
</style></head><body><main class="page">

<p class="muted">Inżynieria testów oprogramowania · projekt zespołowy</p>
<h1>Czy system rezerwacji Restful-Booker-Platform jest gotowy dla gości?</h1>
<p class="sub">Raport z projektu testowego · ostatnie pełne uruchomienie testów: ${esc(when)}</p>

<p class="lead">Przetestowaliśmy publiczną aplikację <b>Restful-Booker-Platform</b> (<a href="https://automationintesting.online" target="_blank">automationintesting.online</a>) – stronę pensjonatu, na której gość przegląda pokoje, rezerwuje pobyt i może wysłać wiadomość, a administrator loguje się do panelu.</p>
<div class="facts sans"><div><b>${metrics.planned}</b><span>przypadki testowe zaprojektowane i uruchomione</span></div><div class="ok"><b>${pass}</b><span>zakończyły się zgodnie z oczekiwaniami</span></div><div class="bad"><b>${fail}</b><span>wykazały błąd aplikacji</span></div><div class="mid"><b>${blk}</b><span>nie dało się wykonać przez błąd, który blokuje rezerwację</span></div></div>
<div class="verdict"><b>Nasza rekomendacja: system nie jest gotowy (NO-GO).</b><br>Gość nie może zarezerwować pokoju – strona rezerwacji w ogóle się nie otwiera. Pozostałe funkcje (formularz kontaktowy, sprawdzanie danych, ochrona panelu administratora) działają, ale nie równoważą tego, że główna funkcja pensjonatu nie działa.</div>

<div class="team">${(team.members || []).map((x, i) => `<div class="p${i + 1}"><b>${esc(x.name)}</b> (${esc(x.studentNumber)})<br><span class="muted">${esc(x.role)}</span></div>`).join('')}</div>

<nav class="toc"><b>Spis treści</b><ol><li><a href="#ch1">Co testowaliśmy i gdzie widzieliśmy największe ryzyko</a> – ${esc(m(0).name)}</li><li><a href="#ch2">Jak zaprojektowaliśmy testy</a> – ${esc(m(1).name)}</li><li><a href="#ch3">Co wyszło z testów i jakie błędy znaleźliśmy</a> – ${esc(m(2).name)}</li><li><a href="#ch4">Testy API i automatyzacja</a> – ${esc(m(3).name)}</li><li><a href="#ch5">Decyzja i jej uzasadnienie</a> – ${esc(m(0).name)}</li><li><a href="#gloss">Słowniczek</a></li></ol></nav>

${chapter(1, 0, 'ch1', 'Co testowaliśmy i gdzie widzieliśmy największe ryzyko', `
<p>Celem było sprawdzenie trzech rzeczy: czy <b>gość może znaleźć pokój i go zarezerwować</b>, czy aplikacja <b>poprawnie sprawdza wpisywane dane</b> (np. w formularzu kontaktowym) i czy <b>panel administratora jest chroniony</b> przed osobami bez uprawnień.</p>
<p>Świadomie <b>nie testowaliśmy</b> wydajności (to publiczna aplikacja szkoleniowa, której nie wolno obciążać), płatności ani bezpieczeństwa w sensie testów penetracyjnych. Testy prowadziliśmy w przeglądarce Chrome na komputerze.</p>
<h3>Jak wybraliśmy, co testować najpierw</h3>
<p>Zanim napisaliśmy testy, zastanowiliśmy się, <b>co może pójść źle i jak bardzo by to zabolało</b>. Dla każdego zagrożenia oceniliśmy, jak jest prawdopodobne i jak poważne byłyby skutki. Im wyższa ocena, tym wcześniej i dokładniej to testowaliśmy.</p>
<table><tr><th>Co może pójść źle</th><th>Prawdopodobieństwo</th><th>Skutki</th><th>Ocena ryzyka</th></tr>${riskRows}</table>
<p class="muted">Ocena = prawdopodobieństwo × skutki (każde w skali 1–3). Pełna analiza: <a href="01_TestPlan.pdf">01_TestPlan.pdf</a>.</p>
${takeaway('Najważniejsze dla pensjonatu jest to, żeby gość mógł zarezerwować pokój – dlatego rezerwacja dostała najwyższy priorytet. To właśnie ona okazała się zepsuta.')}`)}

${chapter(2, 1, 'ch2', 'Jak zaprojektowaliśmy testy', `
<p>Przygotowaliśmy <b>${cases.length} przypadków testowych</b>: ${metrics.ui} sprawdza aplikację tak, jak korzysta z niej człowiek w przeglądarce, a ${metrics.api} sprawdza bezpośrednio serwer (API – część, z którą rozmawia strona). <b>${metrics.negative}</b> z nich to testy „negatywne”, czyli celowo podajemy złe dane i sprawdzamy, czy aplikacja je odrzuci.</p>
<p>Każdy przypadek testowy to dokładny przepis, który ktoś inny może powtórzyć. Oto jeden z nich:</p>
<div class="tc"><dl><dt>Nazwa</dt><dd>Temat wiadomości ma 4 znaki – o jeden za mało</dd><dt>Cel</dt><dd>Sprawdzić, czy formularz kontaktowy odrzuci za krótki temat (dozwolone 5–100 znaków).</dd><dt>Dane</dt><dd>Poprawne imię, email i telefon; temat „ABCD”.</dd><dt>Kroki</dt><dd>Wypełnić formularz → kliknąć „Submit”.</dd><dt>Oczekujemy</dt><dd>Wiadomość odrzucona, widoczny komunikat o długości tematu.</dd><dt>Wynik</dt><dd><b style="color:var(--ok)">Zgodny z oczekiwaniami</b></dd></dl></div>
${figSteps('UI-05', 'Ten sam przypadek w trakcie wykonania – zrzuty zrobione automatycznie po każdym kroku.')}
<h3>Skąd wiedzieliśmy, jakie dane wybrać</h3>
<p>Nie wybieraliśmy danych na chybił trafił. Użyliśmy trzech technik wymaganych w projekcie:</p>
<p><b>Klasy równoważności</b> – dzielimy możliwe dane na grupy, w których aplikacja powinna zachować się tak samo, i z każdej grupy bierzemy jeden przykład. Dla adresu email: poprawny adres, zły format („bledny-email”), zły typ danych i brak adresu.</p>
<p><b>Wartości brzegowe</b> – błędy najczęściej czają się na granicach. Skoro temat musi mieć od 5 do 100 znaków, sprawdzamy 4 znaki (powinno odrzucić) i 5 znaków (powinno przyjąć). Tak samo telefon: 10 i 11 cyfr.</p>
<p><b>Tablica decyzyjna</b> – gdy wynik zależy od kilku warunków naraz, rozpisujemy wszystkie kombinacje. W formularzu: email dobry lub zły × temat dobry lub zły – wiadomość ma zostać wysłana tylko wtedy, gdy oba są dobre.</p>
<h3>Testy eksploracyjne</h3>
<p>Oprócz zaplanowanych przypadków przeprowadziliśmy swobodną, ograniczoną czasowo sesję, w której szukaliśmy problemów „na wyczucie” – z jasno określonym celem: nietypowe daty i dane w rezerwacji. Tak znaleźliśmy dwa dodatkowe błędy (opisane w rozdziale 3).</p>
<div class="tc"><dl><dt>Sesja</dt><dd>EXP-02, 13 listopada 2026, 30 minut 36 sekund</dd><dt>Cel (charter)</dt><dd>Znaleźć problemy w rezerwacji przy nietypowych datach i danych, sprawdzić powiązania strony z serwerem i zachowanie danych przy resecie środowiska.</dd><dt>Pomysły</dt><dd>Śledzenie danych od formularza do serwera, cykl utwórz–odczytaj–zmień–usuń, granice długości pól, różne strefy czasowe.</dd><dt>Wynik</dt><dd>Dwa nowe błędy (wyszukiwanie w strefie UTC+14, wygasłe logowanie) i potwierdzone granice trzech pól formularza.</dd><dt>Jak</dt><dd>Z pomocą narzędzi (Playwright, asystent AI); ustalenia sprawdzone ponownie na żywo 14 listopada.</dd></dl></div>
<p class="muted" style="margin-top:12px">Wszystkie przypadki: <a href="02_TestCases.md">02_TestCases.md</a> · notatki z eksploracji: <a href="03_Exploratory.pdf">03_Exploratory.pdf</a></p>
${takeaway('Każdy test ma konkretny powód: wynika z ryzyka i z techniki doboru danych. Dzięki temu przy małej liczbie testów sprawdzamy najbardziej podatne miejsca.')}`)}

${chapter(3, 2, 'ch3', 'Co wyszło z testów i jakie błędy znaleźliśmy', `
<p>Uruchomiliśmy wszystkie ${metrics.planned} przypadki. <b>${pass}</b> zakończyło się tak, jak oczekiwaliśmy, <b>${fail}</b> wykazało błąd aplikacji, a <b>${blk}</b> w ogóle nie dało się wykonać – to testy rezerwacji, do których nie da się dojść, bo strona rezerwacji się nie otwiera. Żaden przypadek nie został pominięty bez wyjaśnienia.</p>
<div class="bar"><div class="b-ok" style="flex:${pass}">${pass} zgodnie z oczekiwaniami</div><div class="b-bad" style="flex:${fail}">${fail} błąd</div><div class="b-mid" style="flex:${blk}">${blk} zablokowane</div></div>
<p class="muted">Testy w przeglądarce: ${count('UI', 'PASS')} zgodnie, ${count('UI', 'BLOCKED')} zablokowane. Testy serwera (API): ${count('API', 'PASS')} zgodnie, ${count('API', 'FAIL')} z błędem.</p>
<h3>Każdy wynik ma dowód</h3>
<p>Dla każdego testu zapisaliśmy dowód: przy testach w przeglądarce – zrzuty ekranu po każdym kroku, przy testach serwera – dokładnie, co wysłaliśmy, co dostaliśmy i co sprawdziliśmy. Dzięki temu każdy wynik może zweryfikować ktoś, kto nie był przy testach.</p>
${figSteps('UI-04', 'Przypadek „niepoprawny email w formularzu kontaktowym”: najpierw zły email, potem dodatkowo za krótki temat. Za każdym razem aplikacja poprawnie odrzuca dane i pokazuje komunikat.')}
${figSteps('UI-08', 'Przypadek „cena rezerwacji za dwie noce”: zamiast formularza rezerwacji strona pokazuje tylko kręcące się kółko. Testu nie da się wykonać – dlatego ma status „zablokowany”.')}
<h3>Znalezione błędy</h3>
<p>Znaleźliśmy <b>${defects.length} różne błędy</b>. Jeśli kilka testów trafiało na ten sam problem, zgłaszaliśmy go raz – dlatego jeden błąd może dotyczyć wielu przypadków.</p>
<table><tr><th>Błąd</th><th>Waga</th><th>Gdzie wykryty</th></tr>${defectRows}</table>
<p class="muted">Każde zgłoszenie zawiera dokładne kroki, dzięki którym ktoś inny może błąd powtórzyć: <a href="04_Defects.md">04_Defects.md</a> · wszystkie wyniki z dowodami: <a href="05_Automation/reports/raport-testow.html">raport z testów</a></p>
${takeaway('Najpoważniejszy błąd jest krytyczny: gość nie może zarezerwować pokoju. Pozostałe błędy są mniejsze – aplikacja źle reaguje na nietypowe sytuacje, ale nie blokuje to jej używania.')}`)}

${chapter(4, 3, 'ch4', 'Testy API i automatyzacja', `
<p><b>API</b> to „zaplecze” aplikacji – strona internetowa wysyła do serwera zapytania (np. „pokaż listę pokoi”, „zapisz wiadomość”) i dostaje odpowiedzi. Testując API, sprawdzamy serwer bezpośrednio, bez przeglądarki. Każda odpowiedź ma kod: <b>200</b> oznacza sukces, <b>400</b> – odrzucenie złych danych, <b>401</b> – brak uprawnień, <b>404</b> – brak zasobu, a <b>500</b> – awarię serwera.</p>
<p>Napisaliśmy ${metrics.api} testów API i ${metrics.ui} testów w przeglądarce. Sprawdzają m.in.: czy lista pokoi ma poprawne dane, czy serwer odrzuca wiadomość bez wymaganych pól lub ze złym emailem, czy odmawia logowania złym hasłem i czy nie pokazuje rezerwacji osobie niezalogowanej.</p>
<h3>Pełny cykl życia danych</h3>
<p>Najważniejszy jest test, który przechodzi cały „cykl życia” wiadomości: tworzy ją, odczytuje, zmienia i usuwa – i po każdym kroku sprawdza, czy wszystko się zgadza. Tak wyglądał w ostatnim uruchomieniu:</p>
<ol class="life">${flow9}</ol>
<p>Tworzenie wiadomości działa, ale każda operacja na konkretnej wiadomości (otwarcie, zmiana, usunięcie) kończy się awarią serwera. To ten sam błąd, który blokuje rezerwację. Analogiczny test przeprowadziliśmy dla rezerwacji – z takim samym wynikiem.</p>
<h3>Testy w przeglądarce: Page Object Model</h3>
<p>Testy w przeglądarce napisaliśmy w modelu <b>Page Object Model</b> (POM). Każda strona aplikacji ma własną klasę, która wie, gdzie są przyciski i pola i jak ich używać. Sam test nie szuka już elementów na stronie – opisuje tylko scenariusz, jak instrukcję dla człowieka. Gdy zmieni się wygląd strony, poprawia się jedną klasę, a nie każdy test.</p>
<table><tr><th>Klasa (obiekt strony)</th><th>Co reprezentuje</th><th>Przykładowe akcje</th></tr>
<tr><td><b>HomePage</b></td><td>Strona główna: katalog pokoi i wyszukiwarka dostępności</td><td>otwórz stronę, wybierz daty, sprawdź dostępność</td></tr>
<tr><td><b>ContactForm</b></td><td>Formularz kontaktowy</td><td>wypełnij pola, wyślij, odczytaj komunikat błędu lub potwierdzenie</td></tr>
<tr><td><b>ReservationPage</b></td><td>Strona rezerwacji pokoju</td><td>otwórz rezerwację, wpisz dane gościa, wyślij rezerwację</td></tr>
<tr><td><b>AdminLoginPage</b></td><td>Logowanie do panelu administratora</td><td>wpisz login i hasło, zaloguj, odczytaj błąd</td></tr></table>
<p>Tak wygląda prawdziwy test „temat wiadomości ma 4 znaki” – czyta się go prawie jak opis kroków z przypadku testowego:</p>
<figure class="fig"><pre class="code">${esc(pomExample)}</pre><figcaption><b>home</b> i <b>contactForm</b> to obiekty stron. Test: otwiera stronę, wypełnia formularz tematem „ABCD”, robi zrzut ekranu kroku, wysyła i sprawdza, że serwer odrzucił dane (kod 400), a na stronie widać komunikat o długości tematu.</figcaption></figure>
<h3>Automatyzacja</h3>
<p>Wszystkie ${metrics.planned} testów są zautomatyzowane: komputer wykonuje je sam, w około pół minuty, jednym poleceniem (<code>npm test</code>), i za każdym razem w ten sam sposób. Po uruchomieniu powstaje raport z wynikami i dowodami. Instrukcja uruchomienia na czystym komputerze jest w <a href="05_Automation/README.md">05_Automation/README.md</a>.</p>
<p>Testy nie opierają się na stałych danych – za każdym razem pobierają aktualny stan aplikacji i tworzą własne, oznaczone dane testowe. Nie powtarzają się automatycznie przy błędzie, żeby nie ukrywać problemów i nie obciążać publicznej aplikacji.</p>
<p class="muted">Kod testów: <a href="05_Automation/tests/api.spec.ts">api.spec.ts</a>, <a href="05_Automation/tests/ui.spec.ts">ui.spec.ts</a>, <a href="05_Automation/pages/">pages/ (Page Object Model)</a> · <a href="05_Automation/reports/raport-testow.html">raport z ostatniego uruchomienia</a></p>
${takeaway('Testy uruchamia się jednym poleceniem i dają za każdym razem ten sam, udokumentowany wynik. Czerwony wynik oznacza błąd aplikacji, a nie zepsute testy – i właśnie to miały wykryć.')}`)}

${chapter(5, 0, 'ch5', 'Decyzja i jej uzasadnienie', `
<p>Rekomendujemy <b>NO-GO</b> – system w obecnym stanie nie jest gotowy do obsługi gości. Uzasadnienie jest proste: najważniejsze ryzyko, które zidentyfikowaliśmy na początku (gość nie może zarezerwować pokoju), <b>sprawdziło się</b>. Potwierdzają to wyniki testów w przeglądarce, testy serwera i powtórna weryfikacja.</p>
<p>Nie oznacza to, że cała aplikacja jest zła. Formularz kontaktowy, sprawdzanie danych i ochrona panelu administratora działają poprawnie. Ale bez działającej rezerwacji pensjonat nie spełnia swojego podstawowego zadania.</p>
<h3>Co musiałoby się zmienić, żeby decyzja brzmiała „tak”</h3>
<p>Naprawa błędu blokującego otwieranie pokoi i rezerwacji, ponowne uruchomienie trzech zablokowanych testów rezerwacji oraz testów zmiany danych, poprawienie obsługi nietypowych danych i wygasłego logowania, a na koniec pełne ponowne uruchomienie wszystkich testów.</p>
<p class="muted">Pełny raport końcowy: <a href="06_TestSummaryReport.pdf">06_TestSummaryReport.pdf</a></p>
${takeaway('Na pytanie „na jakiej podstawie twierdzicie, że system nie jest gotowy?” odpowiadamy: na podstawie 22 udokumentowanych testów, 4 powtarzalnych błędów i tego, że sprawdziło się największe ryzyko – brak możliwości rezerwacji.')}`)}

<section class="ch" id="gloss"><h2>Słowniczek</h2><dl class="gloss">
<dt>Przypadek testowy</dt><dd>Dokładny przepis na jeden test: cel, dane, kroki i oczekiwany wynik.</dd>
<dt>Zgodny z oczekiwaniami / błąd / zablokowany (PASS / FAIL / BLOCKED)</dt><dd>Wynik testu: aplikacja zachowała się tak, jak powinna / nie tak, jak powinna / testu nie dało się wykonać z powodu przeszkody.</dd>
<dt>API</dt><dd>Zaplecze aplikacji, z którym rozmawia strona internetowa. Testy API sprawdzają serwer bez przeglądarki.</dd>
<dt>Kody odpowiedzi</dt><dd>200 – sukces, 400 – złe dane, 401 – brak uprawnień, 404 – nie ma takiego zasobu, 500 – awaria serwera.</dd>
<dt>Ryzyko</dt><dd>Coś, co może pójść źle, ocenione według prawdopodobieństwa i skutków. Nie musi być znanym błędem.</dd>
<dt>Waga błędu</dt><dd>Jak poważny jest błąd: krytyczny (blokuje kluczową funkcję), poważny, średni, drobny.</dd>
<dt>Dowód (evidence)</dt><dd>Zapis z wykonania testu: zrzuty ekranu albo zapis zapytań i odpowiedzi serwera.</dd>
<dt>Automatyzacja</dt><dd>Testy zapisane jako program, który komputer wykonuje sam i powtarzalnie.</dd>
<dt>Testy eksploracyjne</dt><dd>Swobodne, ograniczone czasowo szukanie błędów z jasno określonym celem.</dd>
</dl>
<p class="links" style="margin-top:28px">Pliki projektu: <a href="README.md">README</a> · <a href="01_TestPlan.pdf">plan testów</a> · <a href="02_TestCases.md">przypadki testowe</a> · <a href="03_Exploratory.pdf">eksploracja</a> · <a href="04_Defects.md">zgłoszenia błędów</a> · <a href="05_Automation/reports/raport-testow.html">raport z testów</a> · <a href="06_TestSummaryReport.pdf">raport końcowy</a></p>
</section>
</main></body></html>`;
fs.writeFileSync(path.join(root, '00_Prezentacja.html'), html);
console.log('Zapisano 00_Prezentacja.html', `(${Math.round(html.length / 1024)} KB)`);
