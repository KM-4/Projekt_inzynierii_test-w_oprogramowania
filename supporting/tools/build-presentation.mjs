// Raport projektu do prezentacji na zajęciach (00_Prezentacja.html): rozdziały według ról w zespole,
// treść generowana z danych projektu (supporting/*.json, evidence, 03_Exploratory.md, kod testów).
// Uruchom: node supporting/tools/build-presentation.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.env.QA_PROJECT_DIR || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8').replace(/\r/g, '');
const json = (p) => JSON.parse(read(p));
const cases = json('supporting/test-cases.json');
const metrics = json('supporting/metrics.json');
const defects = json('supporting/defects.json');
const risks = json('supporting/risks.json');
const team = json('supporting/team.json');
const session = json('evidence/exploratory/session.json');
const ev = (id) => { try { return json(`evidence/${id.startsWith('UI') ? 'ui' : 'api'}/${id}.json`); } catch { return {}; } };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nl = (s) => esc(s).replace(/\n/g, '<br>');
const fmt = (iso, o = { dateStyle: 'short', timeStyle: 'short' }) => new Date(iso).toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw', ...o });
const m = (i) => (team.members || [])[i] || { name: `[Osoba ${i + 1}]`, studentNumber: '', role: '' };
const byId = (id) => cases.find((c) => c.id === id);
const count = (f) => cases.filter(f).length;
const pct = (x) => (x * 100).toFixed(1).replace('.', ',') + '%';
const st = (s) => `<span class="st ${esc(s)}">${esc(s)}</span>`;
const table = (head, rows, cls = '') => `<div class="tw"><table class="${cls}"><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</table></div>`;
const code = (src, cap) => `<figure class="fig"><pre class="code">${esc(src)}</pre>${cap ? `<figcaption>${cap}</figcaption>` : ''}</figure>`;
const block = (src, prefix) => (src.split(/\n(?=\/\/ (?:API|UI)-\d+)/).find((b) => b.startsWith(prefix)) || '').trim();
const noHeader = (b) => b.split('\n').filter((l) => !l.startsWith('//')).join('\n').trim();
const steps = (id, only, cap) => { const s = (ev(id).steps || []).filter((x) => !only || only.includes(x.no)); return s.length ? `<figure class="fig"><div class="shots n${Math.min(s.length, 3)}">${s.map((x) => `<a href="${esc(x.file)}" target="_blank"><img src="${esc(x.file)}" alt="${esc(id)} krok ${x.no}"><span><b>${esc(id)} · krok ${x.no}</b> – ${esc(x.label)}</span></a>`).join('')}</div>${cap ? `<figcaption>${cap}</figcaption>` : ''}</figure>` : ''; };
const take = (t) => `<aside class="take"><b>Wniosek</b><p>${t}</p></aside>`;
const chapter = (no, who, id, title, body) => `<section class="ch p${who + 1}" id="${id}"><div class="chhead"><span class="chno">${no}</span><div><h2>${title}</h2><p class="by">${esc(m(who).name)} · ${esc(m(who).role)}</p></div></div>${body}</section>`;

// Proste parsowanie tabel z 03_Exploratory.md.
const mdTable = (md, heading) => {
  const lines = md.split('\n'); const i = lines.findIndex((l) => l.startsWith(heading)); if (i < 0) return [];
  const rows = []; for (let j = i + 1; j < lines.length && !lines[j].startsWith('## '); j++) if (lines[j].startsWith('|') && !/^\|[\s:|-]+\|$/.test(lines[j])) rows.push(lines[j].replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
  return rows;
};
const expMd = read('03_Exploratory.md');
const journal = mdTable(expMd, '## Dziennik');
const authDt = mdTable(expMd, '## Tablica decyzyjna dostępu');
const questions = (expMd.match(/Q-01:[^\n]*/) || [''])[0].split(/\s(?=Q-\d+:)/).filter(Boolean);
const apiSrc = read('05_Automation/tests/api.spec.ts');
const uiSrc = read('05_Automation/tests/ui.spec.ts');

// ---------- dane pochodne ----------
const lvl = (s) => (s >= 6 ? 'wysokie' : s >= 3 ? 'średnie' : 'niskie');
const riskRows = risks.slice().sort((a, b) => b.score - a.score || b.I - a.I).map((r) => [`<b>${r.id}</b>`, esc(r.area), esc(r.description), r.P, r.I, `<b>${r.score}</b> <span class="lv ${lvl(r.score)}">${lvl(r.score)}</span>`, esc(r.reason), esc(r.cases.join(', '))]);
const tcRows = cases.map((c) => [`<a href="02_TestCases.md#${c.id.toLowerCase()}">${c.id}</a>`, esc(c.name), c.type, c.polarity, c.priority, esc(c.risk), esc(c.technique), st(c.status), c.defect ? `<a href="04_Defects.md#${c.defect.toLowerCase()}">${c.defect}</a>` : '–']);
const reasonOf = (c) => (c.actual.split('\n').find((l) => /^Niezgodności|^Zablokowany/.test(l)) || '').replace(/^Niezgodności: /, '');
const notPass = cases.filter((c) => c.status !== 'PASS').map((c) => [`<b>${c.id}</b>`, esc(c.name), st(c.status), esc(reasonOf(c)), c.defect || '–']);
const statusRow = (s) => [s, count((c) => c.type === 'UI' && c.status === s), count((c) => c.type === 'API' && c.status === s), metrics[s]];
const flow = (id, labels) => { const e = ev(id); return `<ol class="life">${(e.requests || []).map((r, i) => { const s = r.response.status; const a = (e.assertions || []).filter((x) => x.requestIndex === i && !x.informational); const ok = s < 400 && a.every((x) => x.pass); const u = new URL(r.request.url, 'https://x'); return `<li class="${ok ? 'ok' : 'bad'}"><code>${esc(r.request.method)} ${esc(u.pathname + u.search)}</code><span class="http">${s}</span><span class="lbl">${esc(labels[i] || '')}</span>${a.length ? `<span class="muted">${a.filter((x) => x.pass).length}/${a.length} asercji</span>` : '<span></span>'}</li>`; }).join('')}</ol>`; };
const ev04 = ev('API-04');
const evSnippet = JSON.stringify({ caseId: 'API-04', request: { method: ev04.requests?.[0]?.request.method, url: '/api/message', body: {} }, response: { status: ev04.requests?.[0]?.response.status, body: (ev04.requests?.[0]?.response.body || []).slice(0, 3).concat(['…']) }, assertions: (ev04.assertions || []).slice(0, 4).map((a) => ({ label: a.label, expected: a.expected, actual: a.actual, pass: a.pass })) }, null, 2);
const sevFull = { S1: 'S1 Critical', S2: 'S2 High', S3: 'S3 Medium', S4: 'S4 Low' };
const defectBlocks = defects.map((d) => `<div class="def ${d.severity}"><div class="dhead"><span class="sev ${d.severity}">${sevFull[d.severity]} · ${d.priority}</span><b>${esc(d.id)}</b> ${esc(d.title)}</div>
<div class="cols2 tight"><div><p><b>Warunki wstępne.</b> ${esc(d.preconditions)}</p><p><b>Kroki reprodukcji</b></p><ol>${d.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol></div>
<div><p><b>Oczekiwane.</b> ${esc(d.expected)}</p><p><b>Rzeczywiste.</b> ${esc(d.actual)}</p><p><b>Wpływ / uzasadnienie severity.</b> ${esc(d.impact)}</p><p><b>Deduplikacja.</b> ${esc(d.deduplication)}</p></div></div>
<p class="muted">Środowisko: ${esc(d.environment)} · powiązane: ${esc(d.cases.join(', '))} · evidence: ${d.evidence.slice(0, 3).map((e) => `<a href="${esc(e)}">${esc(path.basename(e))}</a>`).join(', ')}</p></div>`).join('');

const apiCoverage = [
  ['<code>/api/room</code>', 'GET', 'API-01, API-03, API-07*'],
  ['<code>/api/room/{id}</code>', 'GET', 'API-02, API-03'],
  ['<code>/api/message</code>', 'POST, GET', 'API-04, API-05, API-06, API-09'],
  ['<code>/api/message/{id}</code>', 'GET, PUT, DELETE', 'API-09'],
  ['<code>/api/auth/login</code>', 'POST', 'API-08, API-09, API-10'],
  ['<code>/api/booking?roomid=</code>', 'GET', 'API-07, API-10'],
  ['<code>/api/booking</code>', 'POST', 'API-10'],
  ['<code>/api/booking/{id}</code>', 'GET, PUT, DELETE', 'API-10'],
];
const archRows = [
  ['<code>tests/api.spec.ts</code>', 'Scenariusze i jawne asercje (<code>a.check</code> / <code>a.checkSoft</code>); brak logiki HTTP.'],
  ['<code>api/clients/BaseClient.ts</code>', 'Wspólne wywołanie HTTP przez <code>Audit</code> (zapis request/response do evidence), obsługa sesji.'],
  ['<code>api/clients/*Client.ts</code>', 'Klient per zasób: <code>AuthClient</code> (login, sesja admina), <code>RoomClient</code>, <code>MessageClient</code>, <code>BookingClient</code>. Bez asercji – ocena wyniku należy do testu.'],
  ['<code>api/data/builders.ts</code>', 'Test Data Builder: <code>buildMessage()</code>, <code>buildBooking()</code> – poprawne dane domyślne, test nadpisuje wyłącznie badane pole; unikalny znacznik QA.'],
  ['<code>api/data/dates.ts</code>', 'Wyznaczanie terminu i wyszukiwanie wolnego okresu z aktualnych rezerwacji (bez ponawiania zapisu przy konflikcie).'],
  ['<code>api/endpoints.ts</code>, <code>api/types.ts</code>', 'Ścieżki API w jednym miejscu; typy domenowe (<code>Room</code>, <code>Booking</code>, <code>ApiResult</code>, <code>AuthSession</code>).'],
  ['<code>api/index.ts</code>', 'Fixture Playwright: test otrzymuje <code>api.auth</code>, <code>api.rooms</code>, <code>api.messages</code>, <code>api.bookings</code>.'],
  ['<code>helpers/audit.ts</code>', 'Rdzeń evidence: asercje twarde, miękkie i informacyjne, screeny kroków UI, maskowanie sekretów.'],
];
const dur = `${Math.floor(session.durationMinutes)} min ${Math.round((session.durationMinutes % 1) * 60)} s`;
const reqRows = [
  ['Plan testów: cel, IN/OUT, środowisko, role, kryteria, ograniczenia (str. 5)', '01_TestPlan.pdf, rozdział 1'],
  ['Min. 5 ryzyk z P, I, P×I i wpływem na priorytet (str. 5)', '6 ryzyk – macierz w rozdziale 1, supporting/risk-matrix.md'],
  ['≥ 20 TC, ≥ 12 UI, ≥ 6 API, ≥ 6 negatywnych, pełne pola (str. 6)', `${cases.length} TC: ${metrics.ui} UI, ${metrics.api} API, ${metrics.negative} negatywnych – 02_TestCases.md`],
  ['Techniki EP, BVA, DT – min. 1 przykład każdej (str. 6)', 'Rozdział 2, supporting/test-design-techniques.md'],
  ['Sesja eksploracyjna 30–45 min z charterem (str. 7)', `EXP-02, ${dur} – 03_Exploratory.md`],
  ['≥ 6 API, ≥ 3 endpointy, poz./neg., utwórz→odczytaj, zmień→potwierdź (str. 8)', '10 TC API, 8 endpointów, CRUD w API-09/10 – rozdział 4'],
  ['≥ 3 automaty: pozytywny, negatywny, walidacja; README; wynik (str. 9)', '22 automaty (np. UI-01, API-08, API-01), RUNBOOK.md, raport-testow.html'],
  ['Status każdego TC, evidence (str. 10)', `${metrics.planned}/${metrics.planned} ze statusem, evidence/ (JSON + screeny kroków)`],
  ['Raporty defektów z pełną reprodukcją, severity/priority (str. 11–12)', '04_Defects.md, rozdział 3'],
  ['Test Summary: metryki, defekty, ryzyka, rekomendacja (str. 13)', '06_TestSummaryReport.pdf, rozdział 5'],
];

// ---------- strona ----------
const html = `<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Projekt testowy – Restful-Booker-Platform</title>
<style>
:root{--bg:#f6f4ef;--paper:#fffdf9;--ink:#1d2433;--muted:#5b6475;--line:#e4ddcf;--accent:#2f5fd0;--ok:#1f7a4a;--okbg:#e2f2e8;--bad:#b13d1c;--badbg:#fbe5dc;--mid:#8a6400;--midbg:#f8efcf;--blk:#5d6576;--blkbg:#e6e8ee;--c1:#2f5fd0;--c2:#7a3fb0;--c3:#b4501e;--c4:#1f7a6a}
@media (prefers-color-scheme:dark){:root{--bg:#12172a;--paper:#1a2034;--ink:#eceff6;--muted:#aab3c6;--line:#2d3753;--accent:#8fb0ff;--ok:#82d4a4;--okbg:#1d3a2a;--bad:#ff9f7a;--badbg:#45251c;--mid:#f0cf6a;--midbg:#3b3217;--blk:#c3cbda;--blkbg:#283046;--c1:#8fb0ff;--c2:#c79bf0;--c3:#f39a6b;--c4:#6fd3c0}}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--ink);font:clamp(15px,0.35vw + 11px,18px)/1.6 "Segoe UI",system-ui,-apple-system,Arial,sans-serif}
.page{width:min(1500px,95vw);margin:0 auto;background:var(--paper);padding:clamp(24px,3vw,56px) clamp(18px,4vw,72px) 72px;box-shadow:0 0 40px rgba(0,0,0,.06);min-height:100vh}
h1{font-size:clamp(28px,2.4vw,42px);line-height:1.15;margin:0 0 6px}h2{font-size:clamp(22px,1.7vw,30px);line-height:1.2;margin:0}h3{font-size:clamp(17px,1.15vw,21px);margin:30px 0 10px;padding-top:4px}
p{margin:0 0 12px}a{color:var(--accent)}ul,ol{margin:0 0 12px;padding-left:22px}li{margin:3px 0}.muted{color:var(--muted);font-size:.9em}
.meta{color:var(--muted);margin:0 0 20px}
.kpi{display:grid;grid-template-columns:repeat(7,1fr);gap:10px;margin:16px 0}.kpi div{border:1px solid var(--line);border-radius:12px;padding:10px 14px;background:var(--bg)}.kpi b{display:block;font-size:clamp(24px,2vw,34px);line-height:1.1}.kpi span{font-size:.82em;color:var(--muted)}.kpi .ok b{color:var(--ok)}.kpi .bad b{color:var(--bad)}.kpi .blk b{color:var(--blk)}
.verdict{border-left:6px solid var(--bad);background:var(--badbg);padding:12px 18px;border-radius:0 12px 12px 0;margin:16px 0}.verdict b{color:var(--bad)}
.toc{border:1px solid var(--line);border-radius:12px;padding:12px 20px;margin:18px 0}.toc ol{margin:6px 0 0}
.tw{overflow-x:auto;margin:6px 0 14px}table{border-collapse:collapse;width:100%;font-size:.92em;line-height:1.45}th,td{text-align:left;padding:7px 9px;border-bottom:1px solid var(--line);vertical-align:top}th{font-size:.78em;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;white-space:nowrap}td:first-child{white-space:nowrap}
table.wrap td:first-child{white-space:normal}
.st,.lv,.sev{display:inline-block;font-size:.78em;font-weight:700;padding:1px 8px;border-radius:10px;white-space:nowrap}.st.PASS{background:var(--okbg);color:var(--ok)}.st.FAIL{background:var(--badbg);color:var(--bad)}.st.BLOCKED{background:var(--blkbg);color:var(--blk)}
.lv.wysokie,.sev.S1,.sev.S2{background:var(--badbg);color:var(--bad)}.lv.średnie,.sev.S3{background:var(--midbg);color:var(--mid)}.lv.niskie,.sev.S4{background:var(--okbg);color:var(--ok)}
.ch{border-top:1px solid var(--line);margin-top:44px;padding-top:30px}.chhead{display:flex;gap:14px;align-items:center;margin-bottom:14px}.chno{flex:none;width:42px;height:42px;border-radius:50%;background:var(--pc);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:20px}.by{margin:2px 0 0;color:var(--muted)}
.p1{--pc:var(--c1)}.p2{--pc:var(--c2)}.p3{--pc:var(--c3)}.p4{--pc:var(--c4)}.p0{--pc:#4b5566}
.cols2{display:grid;grid-template-columns:1fr 1fr;gap:22px}.cols2.tight{gap:16px}.cols3{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.cols2>*,.cols3>*{min-width:0}
.card{border:1px solid var(--line);border-radius:12px;padding:12px 16px;background:var(--bg)}.card h4{margin:0 0 6px;font-size:1em}
.take{border-left:5px solid var(--pc);background:var(--bg);border-radius:0 10px 10px 0;padding:10px 16px;margin:18px 0 4px}.take b{font-size:.78em;text-transform:uppercase;letter-spacing:.6px;color:var(--muted)}.take p{margin:4px 0 0}
.fig{margin:10px 0 18px}.fig figcaption{font-size:.86em;color:var(--muted);margin-top:6px}
.shots{display:grid;gap:12px}.shots.n1{grid-template-columns:minmax(0,560px)}.shots.n2{grid-template-columns:1fr 1fr}.shots.n3{grid-template-columns:repeat(3,1fr)}
.shots a{display:flex;flex-direction:column;gap:6px;text-decoration:none;color:var(--ink);border:1px solid var(--line);border-radius:10px;padding:8px;background:var(--bg);font-size:.85em}.shots img{width:100%;max-height:clamp(200px,20vw,340px);object-fit:contain;object-position:top left;background:#fff;border-radius:6px;border:1px solid var(--line)}
pre.code{background:#1d2433;color:#e8ecf4;border-radius:12px;padding:14px 16px;font:13.5px/1.55 Consolas,"Cascadia Mono",monospace;overflow-x:auto;margin:0;white-space:pre}
code{font-family:Consolas,monospace;font-size:.88em;background:var(--bg);padding:1px 5px;border-radius:4px}pre code{background:none}
.life{list-style:none;padding:0;margin:6px 0 16px}.life li{display:grid;grid-template-columns:minmax(200px,1.2fr) 54px 1.6fr auto;gap:10px;align-items:center;padding:6px 10px;border-bottom:1px solid var(--line)}.life li.bad{background:var(--badbg)}.life .http{font:700 .9em Consolas,monospace;text-align:center;border-radius:6px;padding:1px 0;background:var(--okbg);color:var(--ok)}.life li.bad .http{background:var(--badbg);color:var(--bad)}.life code{background:none}
.def{border:1px solid var(--line);border-left:6px solid var(--blk);border-radius:0 12px 12px 0;padding:12px 18px;margin:12px 0;background:var(--bg)}.def.S1{border-left-color:var(--bad)}.def.S2{border-left-color:#e07a45}.def.S3{border-left-color:var(--mid)}.dhead{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:8px}.def ol{margin:0 0 10px}
@media (max-width:900px){.kpi{grid-template-columns:repeat(3,1fr)}.cols2,.cols3,.shots.n2,.shots.n3{grid-template-columns:1fr}.life li{grid-template-columns:1fr 54px}}
@media print{body{background:#fff}.page{box-shadow:none}.ch{break-before:page}}
</style></head><body><main class="page">

<p class="muted">Inżynieria testów oprogramowania · projekt zespołowy</p>
<h1>Restful-Booker-Platform – projekt testowy</h1>
<p class="meta">SUT: <a href="https://automationintesting.online">automationintesting.online</a> (UI v2.2, publiczne proxy <code>/api/*</code>) · pełny przebieg ${esc(fmt(metrics.startedAt))}–${esc(fmt(metrics.finishedAt, { timeStyle: 'short' }))} · Chrome 157, Playwright 1.62.1, Europe/Warsaw</p>

<div class="kpi"><div><b>${metrics.planned}</b><span>planned</span></div><div><b>${metrics.executed}</b><span>executed (PASS+FAIL)</span></div><div class="ok"><b>${metrics.PASS}</b><span>PASS</span></div><div class="bad"><b>${metrics.FAIL}</b><span>FAIL</span></div><div class="blk"><b>${metrics.BLOCKED}</b><span>BLOCKED</span></div><div><b>${metrics['NOT RUN']}</b><span>NOT RUN</span></div><div class="bad"><b>${metrics.uniqueDefects}</b><span>defekty (S1:${metrics.defectsBySeverity.S1} S2:${metrics.defectsBySeverity.S2} S3:${metrics.defectsBySeverity.S3})</span></div></div>
<div class="verdict"><b>Rekomendacja: ${esc(metrics.recommendation)}.</b> Wszystkie trasy API z identyfikatorem zasobu (<code>/{id}</code>) zwracają HTTP 500 (DEF-01, S1/P1), co uniemożliwia otwarcie strony rezerwacji i zarezerwowanie pokoju. Zmaterializowało się ryzyko o najwyższej ocenie (R-01, P×I = 9); kryterium GO (brak otwartych S1/S2 w kluczowym zakresie) nie jest spełnione.</div>

${table(['Osoba', 'Nr albumu', 'Rola', 'Rozdział'], (team.members || []).map((x, i) => [`<b>${esc(x.name)}</b>`, esc(x.studentNumber), esc(x.role), ['1, 5', '2', '3', '4'][i] || '']))}

<nav class="toc"><b>Spis treści</b><ol><li><a href="#ch1">Plan testów i analiza ryzyka</a></li><li><a href="#ch2">Projekt testów i testy eksploracyjne</a></li><li><a href="#ch3">Wykonanie, evidence i defekty</a></li><li><a href="#ch4">Testy API i automatyzacja</a></li><li><a href="#ch5">Podsumowanie i rekomendacja</a></li><li><a href="#ch6">Pokrycie wymagań projektu</a></li></ol></nav>

${chapter(1, 0, 'ch1', 'Plan testów i analiza ryzyka', `
<h3>Przedmiot i cel testów</h3>
<p>Restful-Booker-Platform to aplikacja pensjonatu: frontend Next.js wystawia publiczne proxy <code>/api/*</code> przed usługami Spring (room, booking, message, auth). Testujemy publiczne wdrożenie (UI v2.2, commit wdrożenia nieznany), a kontrakty weryfikujemy względem kodu referencyjnego z oficjalnego repozytorium (supporting/sources).</p>
<p>Cel: ocenić, czy gość może znaleźć i zarezerwować pokój, czy dane wejściowe są poprawnie walidowane i czy dostęp administracyjny jest chroniony – oraz wydać rekomendację opartą na śledzalnych wynikach.</p>
<div class="cols2"><div class="card"><h4>Zakres IN</h4><ul><li>Katalog pokoi, szczegóły pokoju, dostępność i daty, cena pobytu</li><li>Rezerwacja: dane gościa, payload, zapis</li><li>Formularz kontaktowy: wymagane pola, format i typ danych, długości pól</li><li>API: room, message, booking, auth – odczyt, tworzenie, modyfikacja, usuwanie własnych rekordów</li><li>Kontrola dostępu: brak tokenu, błędne dane logowania, nieważna sesja</li></ul></div>
<div class="card"><h4>Zakres OUT</h4><ul><li>Wydajność i obciążenie (publiczna instancja szkoleniowa)</li><li>Testy penetracyjne, płatności, SLA</li><li>Pełna macierz przeglądarek i urządzeń mobilnych, audyt dostępności</li><li>Modyfikacje cudzych danych, pełna regresja panelu administratora</li></ul></div></div>
<h3>Środowisko i kryteria</h3>
${table(['Element', 'Wartość'], [['Platforma', 'Windows 11, Google Chrome 157 (desktop 1440×1000), strefa Europe/Warsaw; w eksploracji także UTC i UTC+14'], ['Narzędzia', 'Playwright 1.62.1 + TypeScript (UI i API), Node.js 22; raporty HTML, JSON, JUnit; evidence JSON i screeny kroków'], ['Kryteria wejścia', 'Dostępna strona i lista pokoi, rozpoznany kontrakt operacji, przypadki z danymi i oczekiwaniami, możliwość zapisu evidence; testy zapisu wymagają konta szkoleniowego'], ['Kryteria zakończenia', 'Każdy TC ma status PASS/FAIL/BLOCKED/NOT RUN z uzasadnieniem, defekty i ryzyka zapisane, metryki zgodne z runnerem'], ['Kryterium GO', 'Brak otwartych defektów S1/S2 w kluczowym zakresie, potwierdzona rezerwacja i krytyczne zależności']], 'wrap')}
<h3>Analiza ryzyka</h3>
<p>Każde ryzyko oceniono w skali 1–3 dla prawdopodobieństwa (P) i wpływu (I); poziom = P × I (6–9 wysokie, 3–4 średnie, 1–2 niskie). Ryzyka o wpływie 3 (rezerwacja, uprawnienia, daty) i niezbędne zależności procesu dostały priorytet P1; lokalna walidacja kontaktu i katalog – P2. Przy równym P×I pierwszeństwo ma wyższy wpływ.</p>
${table(['ID', 'Obszar', 'Ryzyko', 'P', 'I', 'P×I', 'Wpływ na priorytet testów', 'Przypadki'], riskRows, 'wrap')}
<h3>Założenia i ograniczenia</h3>
<ul><li>Instancja jest publiczna, współdzielona i okresowo resetowana – identyfikatory, stan i token pobieramy na nowo w każdym teście; brak stałych ID.</li><li>Tworzymy wyłącznie własne, syntetyczne rekordy z unikalnym znacznikiem QA i próbujemy usuwać tylko je.</li><li>Brak dostępu do logów backendu; limity BVA pochodzą z modelu <code>Message</code> i komunikatów walidacji, a nieudokumentowane reguły dat traktujemy jako pytania, nie wymagania.</li></ul>
${take('Zakres i kolejność testów wynikają z ryzyk: rezerwacja (R-01, P×I = 9) dostała najwyższy priorytet – i właśnie tam znaleźliśmy defekt krytyczny.')}`)}

${chapter(2, 1, 'ch2', 'Projekt testów i testy eksploracyjne', `
<h3>Struktura zestawu</h3>
${table(['', 'UI / E2E', 'API', 'Razem', 'Minimum'], [['Przypadki', metrics.ui, metrics.api, `<b>${metrics.planned}</b>`, '20 (≥ 12 UI, ≥ 6 API)'], ['Pozytywne', count((c) => c.type === 'UI' && c.polarity === 'Pozytywny'), count((c) => c.type === 'API' && c.polarity === 'Pozytywny'), count((c) => c.polarity === 'Pozytywny'), '–'], ['Negatywne', count((c) => c.type === 'UI' && c.polarity === 'Negatywny'), count((c) => c.type === 'API' && c.polarity === 'Negatywny'), metrics.negative, '6'], ['Priorytet P1', count((c) => c.type === 'UI' && c.priority === 'P1'), count((c) => c.type === 'API' && c.priority === 'P1'), count((c) => c.priority === 'P1'), '–']])}
<p>Każdy przypadek zawiera ID, cel, priorytet, powiązane ryzyko, warunki wstępne, dane testowe, kroki, oczekiwany rezultat, a po wykonaniu rzeczywisty rezultat, status, evidence i powiązany defekt (<a href="02_TestCases.md">02_TestCases.md</a>).</p>
<h3>Techniki projektowania</h3>
<div class="cols3"><div class="card"><h4>EP – klasy równoważności</h4>${table(['Obszar', 'Klasa', 'TC'], [['Email', 'poprawny', 'UI-02'], ['Email', 'zły format', 'UI-04, API-05'], ['Email', 'zły typ (obiekt JSON)', 'API-06'], ['Pola wymagane', 'brak danych', 'UI-03, API-04'], ['Pokój', 'ID z listy / spoza listy', 'API-02 / API-03'], ['Dostęp', 'brak tokenu / błędne dane', 'API-07 / API-08, UI-11']], 'wrap')}<p class="muted">Zły format i zły typ to osobne klasy – system reaguje na nie odpowiednio 400 i 500.</p></div>
<div class="card"><h4>BVA – wartości brzegowe</h4>${table(['Pole', 'min−1', 'min', 'max', 'max+1'], [['Temat 5–100', '4 → 400<br>UI-05', '5 → 200<br>UI-06', '100 → 200', '101 → 400'], ['Telefon 11–21', '10 → 400<br>UI-07', '11 → 200<br>UI-02', '21 → 200', '22 → 400'], ['Opis 20–2000', '19 → 400', '20 → 200', '2000 → 200', '2001 → 400']], 'wrap')}<p class="muted">Dolne granice w TC; granice górne i pole opisu w sesji EXP-02. Limity z adnotacji <code>@Size</code> modelu <code>Message</code>.</p></div>
<div class="card"><h4>DT – tablica decyzyjna</h4>${table(['Warunek', 'R1', 'R2', 'R3', 'R4'], [['Email poprawny', 'T', 'T', 'N', 'N'], ['Temat poprawny', 'T', 'N', 'T', 'N'], ['Oczekiwany HTTP', '200', '400', '400', '400'], ['TC', 'UI-02', 'UI-05', 'UI-04', 'UI-04']], 'wrap')}<p class="muted">Druga tablica (kontrola dostępu: brak / błędny / pusty / poprawny token) – w sesji eksploracyjnej.</p></div></div>
<p>Uzupełniająco: <b>testy przejść stanu</b> (API-09, API-10: utworzenie → odczyt → modyfikacja → usunięcie z potwierdzeniem każdego stanu), <b>porównanie interfejsów</b> (UI-01: katalog w UI zgodny z <code>GET /api/room</code>) i <b>spójność danych UI → request</b> (UI-10, UI-12: daty wybrane w UI = parametry wysłane do API).</p>
<h3>Przykład przypadku testowego</h3>
${(() => { const c = byId('UI-05'); return table(['Pole', 'Wartość'], [['ID / nazwa', `<b>${c.id}</b> – ${esc(c.name)}`], ['Priorytet / ryzyko / technika', `${c.priority} / ${esc(c.risk)} / ${esc(c.technique)}`], ['Warunki wstępne', esc(c.preconditions)], ['Dane testowe', esc(c.data)], ['Kroki', `<ol>${c.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>`], ['Oczekiwany rezultat', esc(c.expected)], ['Rzeczywisty rezultat', nl(c.actual)], ['Status', st(c.status)]], 'wrap'); })()}
${steps('UI-05', null, 'Screeny kroków zapisane automatycznie w trakcie wykonania (evidence/ui/UI-05/).')}
<h3>Lista przypadków</h3>
${table(['ID', 'Nazwa', 'Typ', 'Charakter', 'Prio', 'Ryzyko', 'Technika', 'Status', 'Defekt'], tcRows)}
<h3>Testy eksploracyjne – sesja EXP-02</h3>
${table(['Element', 'Wartość'], [['Charter', esc(session.charter.mission)], ['Czas', `${dur} (plan ${session.charter.plannedMinutes} min), ${fmt(session.startedAt)}`], ['Zakres', esc(session.charter.scope.join(' · '))], ['Heurystyki', esc(session.charter.heuristics.join(' · '))], ['Ograniczenia', esc(session.charter.limits)], ['Środowiska', 'Chrome; Europe/Warsaw, Pacific/Kiritimati (UTC+14), UTC – rzeczywisty zegar i żywe API'], ['Wykonanie', 'Z pomocą narzędzi (Playwright, asystent AI); ustalenia DEF-01..03 zweryfikowane ponownie na żywo 14.11.2026']], 'wrap')}
<p><b>Dziennik głównych działań</b></p>
${table(journal[0] || ['Czas', 'Obszar', 'Działanie i obserwacja'], journal.slice(1).map((r) => r.map(esc)), 'wrap')}
<p><b>Tablica decyzyjna kontroli dostępu</b> (<code>GET /api/booking?roomid=</code>)</p>
${table(authDt[0] || [], authDt.slice(1).map((r) => r.map(esc)), 'wrap')}
<p><b>Ustalenia:</b> nowe defekty DEF-03 (nieważny token → 500 zamiast 401/403) i DEF-04 (UTC+14: wyszukiwanie dla dat przesuniętych o dzień); potwierdzenie DEF-01 na wszystkich pokojach i rozszerzenie DEF-02 (obiekt email, tablica phone, błędny JSON → 500); pełne BVA trzech pól; whitespace o poprawnej długości odrzucany jako „blank”.</p>
<p><b>Pytania otwarte</b></p><ul>${questions.map((q) => `<li>${esc(q)}</li>`).join('')}</ul>
${take('Dobór danych wynika z technik i ryzyk, a nie z liczby przypadków. Eksploracja dodała dwa defekty, których zaplanowane przypadki nie obejmowały (strefa czasowa, nieważna sesja).')}`)}

${chapter(3, 2, 'ch3', 'Wykonanie, evidence i defekty', `
<h3>Wyniki wykonania</h3>
<div class="cols2"><div>${table(['Status', 'UI', 'API', 'Razem'], ['PASS', 'FAIL', 'BLOCKED', 'NOT RUN'].map(statusRow).concat([['<b>Planowane</b>', metrics.ui, metrics.api, `<b>${metrics.planned}</b>`]]))}</div>
<div><p>Wykonane (PASS + FAIL): <b>${metrics.executed}</b> · pokrycie wykonaniem <b>${pct(metrics.completionRate)}</b> · PASS wśród wykonanych <b>${pct(metrics.passRateAmongExecuted)}</b>.</p><p>Przebieg w pełni zautomatyzowany: 1 worker, 0 retry, dane pobierane dynamicznie. BLOCKED nadawany wyłącznie z jawnym powodem: preflight <code>GET /api/room/{id}</code> → 500 uniemożliwia wykonanie kroków UI-08..10.</p></div></div>
<h3>Przypadki FAIL i BLOCKED</h3>
${table(['ID', 'Nazwa', 'Status', 'Niezgodność / powód', 'Defekt'], notPass, 'wrap')}
<h3>Evidence</h3>
<p>Dla każdego przypadku powstaje plik <code>evidence/{api|ui}/&lt;ID&gt;.json</code> z listą żądań (request, response, status) i wszystkich asercji (oczekiwane, otrzymane, wynik). Testy UI zapisują dodatkowo wycinki ekranu po każdym istotnym kroku. Sekrety, tokeny i ciasteczka są maskowane przed zapisem.</p>
<div class="cols2"><div>${code(evSnippet, 'Fragment evidence/api/API-04.json – pusta wiadomość: HTTP 400 i asercje komunikatów walidacji.')}</div><div>${steps('UI-11', null, 'UI-11: odmowa logowania administratora (HTTP 401), panel niedostępny.')}</div></div>
${steps('UI-04', null, 'UI-04 (EP + DT reguły 3 i 4): błędny email, następnie błędny email i temat – oba komunikaty walidacji.')}
${steps('UI-08', null, 'UI-08 (BLOCKED): strona rezerwacji bez formularza – szczegóły pokoju zwracają 500 (DEF-01).')}
<h3>Raporty defektów</h3>
<p>Kilka przypadków z tym samym objawem raportujemy jako jeden defekt (DEF-01 obejmuje ${defects[0]?.cases.length} przypadków). Severity według skali prowadzącego: S1 – blokada kluczowego procesu, S2 – istotna funkcja bez obejścia, S3 – problem z obejściem.</p>
${defectBlocks}
${take('Każdy wynik ma powtarzalny dowód, a każdy defekt – kroki pozwalające go odtworzyć bez autora. DEF-01..03 potwierdziliśmy ponownie na żywym środowisku.')}`)}

${chapter(4, 3, 'ch4', 'Testy API i automatyzacja', `
<h3>Pokrycie API</h3>
<div class="cols2"><div>${table(['Endpoint', 'Metody', 'Przypadki'], apiCoverage)}<p class="muted">* API-07 odczytuje listę pokoi, aby wyznaczyć roomid.</p></div>
<div>${table(['Klasa testu (str. 8)', 'Przypadki'], [['Pozytywne: poprawne dane, status, kluczowe pola', 'API-01, API-02, API-09, API-10'], ['Brak wymaganych pól', 'API-04'], ['Błędny format / typ danych', 'API-05 / API-06'], ['Nieistniejący zasób', 'API-03'], ['Brak uwierzytelnienia / błędne dane logowania', 'API-07 / API-08'], ['Utwórz → odczytaj, zmień → potwierdź', 'API-09, API-10'], ['Bez stałych ID', 'wszystkie – ID z bieżących list, znacznik QA']], 'wrap')}</div></div>
<h3>Architektura warstwy API</h3>
${table(['Komponent', 'Odpowiedzialność'], archRows, 'wrap')}
<ul><li><b>Asercje wyłącznie w testach.</b> Klienci nie oceniają wyników, więc ten sam klient obsługuje przypadki pozytywne i negatywne (np. celowo błędny payload).</li><li><b>Evidence scentralizowane.</b> Każde wywołanie przechodzi przez <code>BaseClient → Audit</code>; test nie zawiera kodu zapisu dowodów.</li><li><b>Asercje miękkie w sekwencjach.</b> W API-09/10 odczyt po ID jest asercją miękką, aby krok PUT i jego potwierdzenie wykonały się i zostały udokumentowane niezależnie od wyniku odczytu.</li><li><b>Izolacja danych.</b> Buildery nadają unikalny znacznik QA; sprzątanie dotyczy wyłącznie własnych rekordów.</li></ul>
${code(noHeader(block(apiSrc, '// API-05')), 'API-05: builder tworzy wiadomość ze złym emailem, klient ją wysyła, test sprawdza kod 400, treść komunikatu i brak zapisu na liście.')}
<h3>Przebiegi CRUD</h3>
<p><b>API-09 – wiadomość</b> ${st(byId('API-09').status)}</p>
${flow('API-09', ['logowanie administratora', 'utworzenie wiadomości', 'identyfikacja własnego rekordu', 'odczyt po ID', 'oznaczenie jako przeczytana (PUT)', 'potwierdzenie zmiany na liście', 'usunięcie', 'potwierdzenie usunięcia'])}
<p><b>API-10 – rezerwacja</b> ${st(byId('API-10').status)}</p>
${flow('API-10', ['logowanie administratora', 'lista pokoi', 'aktualne rezerwacje (wybór wolnego terminu)', 'utworzenie rezerwacji (gość)', 'identyfikacja własnej rezerwacji', 'odczyt po ID', 'zmiana nazwiska (PUT)', 'potwierdzenie zmiany na liście', 'usunięcie', 'potwierdzenie usunięcia'])}
<p>Tworzenie i listy działają; każda operacja po identyfikatorze (GET, PUT, DELETE) zwraca 500, a lista potwierdza brak utrwalonej zmiany – ten sam symptom co w DEF-01.</p>
<h3>Testy UI – Page Object Model</h3>
${table(['Klasa', 'Strona', 'Lokatory i akcje'], [['<code>HomePage</code>', 'strona główna', 'nagłówek katalogu, karty pokoi, linki rezerwacji, pola dat, wyszukiwanie dostępności'], ['<code>ContactForm</code>', 'formularz kontaktowy', 'pola, wysyłka z zapisem odpowiedzi do evidence, komunikaty błędów, potwierdzenie'], ['<code>ReservationPage</code>', 'rezerwacja', 'otwarcie dla pokoju i terminu, podsumowanie ceny, dane gościa, wysłanie rezerwacji'], ['<code>AdminLoginPage</code>', 'panel administratora', 'login, hasło, wysłanie, komunikat błędu']], 'wrap')}
<p>Fixture w <code>pages/index.ts</code> rozszerza fixture warstwy API, więc test UI ma jednocześnie obiekty stron i klientów API (np. preflight szczegółów pokoju przed testem rezerwacji).</p>
${code(noHeader(block(uiSrc, '// UI-05')), 'UI-05: scenariusz na obiektach stron home i contactForm; screeny kroków przez a.step().')}
<h3>Konfiguracja i uruchomienie</h3>
${table(['Element', 'Ustawienie'], [['Projekty', '<code>api</code> (APIRequestContext, bez przeglądarki, bez trace) i <code>ui-chrome</code> (Chrome, trace i screenshot przy FAIL)'], ['Stabilność', '1 worker, 0 retry, brak sztucznych oczekiwań – bez obciążania publicznej instancji i bez maskowania niestabilności'], ['Raporty', 'HTML, JSON, JUnit, <code>case-results.json</code> (PASS / FAIL / BLOCKED), <a href="05_Automation/reports/raport-testow.html">raport-testow.html</a>'], ['Sekrety', 'Dane administratora wyłącznie w zmiennych środowiskowych; maskowanie w evidence i raportach'], ['Uruchomienie', '<code>npm ci</code> → <code>npm test</code> (22 testy, ok. 30 s); szczegóły: <a href="RUNBOOK.md">RUNBOOK.md</a>']], 'wrap')}
${take('Testy API mają wydzielone warstwy (scenariusz, klient, dane, evidence), a testy UI – Page Object Model na tej samej warstwie. Kod wyjścia 1 oznacza wykryte defekty SUT, nie niedziałającą automatyzację.')}`)}

${chapter(5, 0, 'ch5', 'Podsumowanie i rekomendacja', `
<h3>Wyniki względem kryteriów</h3>
${table(['Kryterium', 'Stan'], [['Każdy TC ma status z uzasadnieniem', `spełnione – ${metrics.planned}/${metrics.planned}, NOT RUN = 0`], ['Metryki zgodne z runnerem', 'spełnione – case-results.json → metrics.json → dokumenty'], ['Brak otwartych S1/S2 w kluczowym zakresie (GO)', '<b>niespełnione</b> – DEF-01 (S1), DEF-04 (S2)'], ['Potwierdzona rezerwacja gościa', '<b>niespełnione</b> – UI-08..10 BLOCKED, API-10 FAIL']], 'wrap')}
<h3>Status ryzyk</h3>
${table(['Ryzyko', 'Status po testach'], [['R-01 Rezerwacja (9)', '<b>zmaterializowane</b> – DEF-01, rezerwacja niemożliwa'], ['R-05 Daty i cena (6)', '<b>częściowo</b> – DEF-04 w UTC+14; cena i finalny payload niezweryfikowane (BLOCKED)'], ['R-04 Uprawnienia (6)', 'odmowa dostępu działa (API-07, API-08, UI-11); nieważna sesja → 500 (DEF-03)'], ['R-03 Walidacja (6)', 'walidacja formatu i długości działa; błędny typ danych → 500 (DEF-02)'], ['R-06 Stan danych (6)', 'aktualizacja i usuwanie rekordów niedziałające (DEF-01); dane testowe do resetu'], ['R-02 Katalog (4)', 'lista spójna z UI (UI-01, API-01); szczegóły niedostępne (DEF-01)']], 'wrap')}
<h3>Rekomendacja: ${esc(metrics.recommendation)}</h3>
<p>Kluczowy proces – rezerwacja pokoju – jest niedostępny z powodu defektu krytycznego. Poprawnie działające obszary (formularz kontaktowy, walidacje, odmowa dostępu) nie równoważą tej blokady. Decyzja dotyczy gotowości badanej wersji do obsługi gości.</p>
<p><b>Warunki zmiany decyzji:</b> naprawa tras <code>/{id}</code> (DEF-01); retest UI-08..10 oraz pełnych cykli API-09/10 z modyfikacją; poprawna klasyfikacja błędnych danych i nieważnej sesji jako 4xx (DEF-02, DEF-03); konwersja dat niezależna od strefy klienta (DEF-04); nowy pełny przebieg i przeliczone metryki.</p>
<p class="muted">Pełny raport końcowy: <a href="06_TestSummaryReport.pdf">06_TestSummaryReport.pdf</a> · plan testów: <a href="01_TestPlan.pdf">01_TestPlan.pdf</a></p>`)}

<section class="ch p0" id="ch6"><div class="chhead"><span class="chno">6</span><div><h2>Pokrycie wymagań projektu</h2><p class="by">Wymagania z prezentacji prowadzącego → artefakty</p></div></div>
${table(['Wymaganie', 'Realizacja'], reqRows, 'wrap')}
<p class="muted">Pliki: <a href="README.md">README</a> · <a href="RUNBOOK.md">RUNBOOK</a> · <a href="01_TestPlan.pdf">01</a> · <a href="02_TestCases.md">02</a> · <a href="03_Exploratory.md">03</a> · <a href="04_Defects.md">04</a> · <a href="05_Automation/README.md">05</a> · <a href="06_TestSummaryReport.pdf">06</a> · <a href="05_Automation/reports/raport-testow.html">raport z testów</a></p></section>
</main></body></html>`;
fs.writeFileSync(path.join(root, '00_Prezentacja.html'), html);
console.log('Zapisano 00_Prezentacja.html', `(${Math.round(html.length / 1024)} KB)`);
