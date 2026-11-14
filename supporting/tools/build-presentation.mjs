// Raport projektu do prezentacji na zajęciach (00_Prezentacja.html).
// Na wierzchu: krótkie punkty, jedna zwarta tabela i jedna ilustracja na rozdział; pełne dane w blokach „Szczegóły”.
// Treść generowana z danych projektu (supporting/*.json, evidence, 03_Exploratory.md, kod testów).
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
const details = (title, body) => `<details class="more"><summary>${title}</summary><div class="morebody">${body}</div></details>`;
const points = (items) => `<ul class="points">${items.map((x) => `<li>${x}</li>`).join('')}</ul>`;
const code = (src, cap) => `<figure class="fig"><pre class="code">${esc(src)}</pre>${cap ? `<figcaption>${cap}</figcaption>` : ''}</figure>`;
const block = (src, prefix) => (src.split(/\n(?=\/\/ (?:API|UI)-\d+)/).find((b) => b.startsWith(prefix)) || '').trim();
const noHeader = (b) => b.split('\n').filter((l) => !l.startsWith('//')).join('\n').trim();
const steps = (id, cap) => { const s = ev(id).steps || []; return s.length ? `<figure class="fig"><div class="shots n${Math.min(s.length, 3)}">${s.map((x) => `<a href="${esc(x.file)}" target="_blank"><img src="${esc(x.file)}" alt="${esc(id)} krok ${x.no}"><span>${x.no}. ${esc(x.label)}</span></a>`).join('')}</div>${cap ? `<figcaption>${cap}</figcaption>` : ''}</figure>` : ''; };
const take = (t) => `<aside class="take">${t}</aside>`;
const chapter = (no, who, id, title, body) => `<section class="ch p${who + 1}" id="${id}"><div class="chhead"><span class="chno">${no}</span><div><h2>${title}</h2><p class="by">${esc(m(who).name)} · ${esc(m(who).role)}</p></div></div>${body}</section>`;
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
const dur = `${Math.floor(session.durationMinutes)} min ${Math.round((session.durationMinutes % 1) * 60)} s`;

// ---------- dane pochodne ----------
const lvl = (s) => (s >= 6 ? 'wysokie' : s >= 3 ? 'średnie' : 'niskie');
const sortedRisks = risks.slice().sort((a, b) => b.score - a.score || b.I - a.I);
const prio = (r) => (r.I === 3 ? 'P1' : 'P2');
const riskShort = sortedRisks.map((r) => [`<b>${r.id}</b>`, esc(r.description), `${r.P} × ${r.I} = <b>${r.score}</b> <span class="lv ${lvl(r.score)}">${lvl(r.score)}</span>`, prio(r)]);
const riskFull = sortedRisks.map((r) => [`<b>${r.id}</b>`, esc(r.area), esc(r.reason), esc(r.cases.join(', '))]);
const tcRows = cases.map((c) => [`<a href="02_TestCases.md#${c.id.toLowerCase()}">${c.id}</a>`, esc(c.name), c.polarity, esc(c.technique), st(c.status)]);
// Krótki powód niezaliczenia: pierwsze żądanie z błędem albo przyczyna blokady.
const shortReason = (c) => {
  if (c.status === 'BLOCKED') return 'preflight <code>GET /api/room/{id}</code> → 500, brak formularza';
  const e = ev(c.id); const bad = (e.requests || []).find((r) => r.response.status >= 500) || (e.requests || []).find((r) => r.response.status >= 400);
  if (!bad) return esc(c.actual.split('\n').pop());
  const u = new URL(bad.request.url, 'https://x');
  return `<code>${esc(bad.request.method)} ${esc(u.pathname)}</code> → ${bad.response.status}${c.id === 'API-03' ? ' (oczekiwano 404)' : c.id === 'API-06' ? ' (oczekiwano 400)' : ''}`;
};
const notPass = cases.filter((c) => c.status !== 'PASS').map((c) => [`<b>${c.id}</b>`, esc(c.name), st(c.status), shortReason(c), c.defect || '–']);
const statusRow = (s) => [s, count((c) => c.type === 'UI' && c.status === s), count((c) => c.type === 'API' && c.status === s), `<b>${metrics[s]}</b>`];
const flow = (id, labels) => { const e = ev(id); return `<ol class="life">${(e.requests || []).map((r, i) => { const s = r.response.status; const a = (e.assertions || []).filter((x) => x.requestIndex === i && !x.informational); const ok = s < 400 && a.every((x) => x.pass); const u = new URL(r.request.url, 'https://x'); return `<li class="${ok ? 'ok' : 'bad'}"><span class="lbl">${esc(labels[i] || '')}</span><code>${esc(r.request.method)} ${esc(u.pathname)}</code><span class="http">${s}</span></li>`; }).join('')}</ol>`; };
const sevName = { S1: 'S1 Critical', S2: 'S2 High', S3: 'S3 Medium', S4: 'S4 Low' };
const defectShort = defects.map((d) => [`<b>${d.id}</b>`, esc(d.title), `<span class="sev ${d.severity}">${sevName[d.severity]} · ${d.priority}</span>`, esc(d.cases.join(', '))]);
const defectFull = defects.map((d) => `<div class="def ${d.severity}"><p><b>${esc(d.id)} – ${esc(d.title)}</b> <span class="sev ${d.severity}">${sevName[d.severity]} · ${d.priority}</span></p>
<p><b>Warunki wstępne:</b> ${esc(d.preconditions)}</p><p><b>Kroki:</b></p><ol>${d.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
<p><b>Oczekiwane:</b> ${esc(d.expected)}</p><p><b>Rzeczywiste:</b> ${esc(d.actual)}</p><p><b>Uzasadnienie severity:</b> ${esc(d.impact)}</p><p class="muted">Środowisko: ${esc(d.environment)}</p></div>`).join('');

const ex = byId('UI-05');

// ---------- strona ----------
const html = `<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Projekt testowy – Restful-Booker-Platform</title>
<style>
:root{--bg:#f6f4ef;--paper:#fffdf9;--ink:#1d2433;--muted:#5b6475;--line:#e6dfd2;--accent:#2f5fd0;--ok:#1f7a4a;--okbg:#e2f2e8;--bad:#b13d1c;--badbg:#fbe5dc;--mid:#8a6400;--midbg:#f8efcf;--blk:#5d6576;--blkbg:#e6e8ee;--c1:#2f5fd0;--c2:#7a3fb0;--c3:#b4501e;--c4:#1f7a6a}
@media (prefers-color-scheme:dark){:root{--bg:#12172a;--paper:#1a2034;--ink:#eceff6;--muted:#aab3c6;--line:#2d3753;--accent:#8fb0ff;--ok:#82d4a4;--okbg:#1d3a2a;--bad:#ff9f7a;--badbg:#45251c;--mid:#f0cf6a;--midbg:#3b3217;--blk:#c3cbda;--blkbg:#283046;--c1:#8fb0ff;--c2:#c79bf0;--c3:#f39a6b;--c4:#6fd3c0}}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--ink);font:clamp(16px,0.4vw + 11px,19px)/1.65 "Segoe UI",system-ui,-apple-system,Arial,sans-serif}
.page{width:min(1400px,94vw);margin:0 auto;background:var(--paper);padding:clamp(24px,3vw,56px) clamp(18px,4vw,72px) 72px;box-shadow:0 0 40px rgba(0,0,0,.06);min-height:100vh}
h1{font-size:clamp(28px,2.4vw,42px);line-height:1.15;margin:0 0 6px}h2{font-size:clamp(23px,1.8vw,31px);line-height:1.2;margin:0}h3{font-size:clamp(18px,1.2vw,22px);margin:30px 0 10px}
p{margin:0 0 12px}a{color:var(--accent)}ol,ul{margin:0 0 12px;padding-left:24px}li{margin:4px 0}.muted{color:var(--muted);font-size:.9em}
.meta{color:var(--muted);margin:0 0 18px}
.kpi{display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin:16px 0}.kpi div{border:1px solid var(--line);border-radius:12px;padding:12px 16px;background:var(--bg)}.kpi b{display:block;font-size:clamp(26px,2.2vw,38px);line-height:1.1}.kpi span{font-size:.85em;color:var(--muted)}.kpi .ok b{color:var(--ok)}.kpi .bad b{color:var(--bad)}.kpi .blk b{color:var(--blk)}
.verdict{border-left:6px solid var(--bad);background:var(--badbg);padding:14px 20px;border-radius:0 12px 12px 0;margin:18px 0;font-size:1.05em}.verdict b{color:var(--bad)}
.team{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:18px 0}.team div{border-left:5px solid var(--pc);padding:4px 12px}.team span{display:block;color:var(--muted);font-size:.88em}
.toc{display:flex;flex-wrap:wrap;gap:8px 18px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:10px 0;margin:10px 0 0}.toc a{text-decoration:none}
.tw{overflow-x:auto;margin:8px 0 14px}table{border-collapse:collapse;width:100%;line-height:1.5}th,td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--line);vertical-align:top}th{font-size:.78em;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;white-space:nowrap}td:first-child{white-space:nowrap}
.st,.lv,.sev{display:inline-block;font-size:.8em;font-weight:700;padding:1px 9px;border-radius:10px;white-space:nowrap}.st.PASS{background:var(--okbg);color:var(--ok)}.st.FAIL{background:var(--badbg);color:var(--bad)}.st.BLOCKED{background:var(--blkbg);color:var(--blk)}
.lv.wysokie,.sev.S1,.sev.S2{background:var(--badbg);color:var(--bad)}.lv.średnie,.sev.S3{background:var(--midbg);color:var(--mid)}.lv.niskie,.sev.S4{background:var(--okbg);color:var(--ok)}
.ch{border-top:1px solid var(--line);margin-top:48px;padding-top:32px}.chhead{display:flex;gap:16px;align-items:center;margin-bottom:12px}.chno{flex:none;width:44px;height:44px;border-radius:50%;background:var(--pc);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:21px}.by{margin:2px 0 0;color:var(--muted)}
.p1{--pc:var(--c1)}.p2{--pc:var(--c2)}.p3{--pc:var(--c3)}.p4{--pc:var(--c4)}.p0{--pc:#4b5566}
.points{padding-left:22px;margin:4px 0 14px}.points li{margin:6px 0}
.cols2{display:grid;grid-template-columns:1fr 1fr;gap:24px}.cols3{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}.cols2>*,.cols3>*{min-width:0}
.card{border:1px solid var(--line);border-radius:12px;padding:14px 18px;background:var(--bg)}.card h4{margin:0 0 8px;font-size:1em}.card table{font-size:.92em}.card td,.card th{padding:7px 8px}
.take{border-left:5px solid var(--pc);background:var(--bg);border-radius:0 10px 10px 0;padding:12px 18px;margin:20px 0 4px;font-weight:600}
details.more{border:1px solid var(--line);border-radius:10px;margin:14px 0;background:var(--bg)}details.more>summary{cursor:pointer;padding:10px 16px;font-weight:600;color:var(--pc);list-style:none}details.more>summary::before{content:"▸ ";}details.more[open]>summary::before{content:"▾ ";}details.more>summary::-webkit-details-marker{display:none}.morebody{padding:0 18px 14px}
.fig{margin:10px 0 18px}.fig figcaption{font-size:.88em;color:var(--muted);margin-top:6px}
.shots{display:grid;gap:14px}.shots.n1{grid-template-columns:minmax(0,520px)}.shots.n2{grid-template-columns:1fr 1fr}.shots.n3{grid-template-columns:repeat(3,1fr)}
.shots a{display:flex;flex-direction:column;gap:6px;text-decoration:none;color:var(--ink);border:1px solid var(--line);border-radius:10px;padding:8px;background:var(--bg);font-size:.88em}.shots img{width:100%;max-height:clamp(200px,20vw,320px);object-fit:contain;object-position:top left;background:#fff;border-radius:6px;border:1px solid var(--line)}
pre.code{background:#1d2433;color:#e8ecf4;border-radius:12px;padding:16px 18px;font:14px/1.6 Consolas,"Cascadia Mono",monospace;overflow-x:auto;margin:0;white-space:pre}
code{font-family:Consolas,monospace;font-size:.88em;background:var(--bg);padding:1px 5px;border-radius:4px}pre code{background:none}
.life{list-style:none;padding:0;margin:6px 0 16px;max-width:900px}.life li{display:grid;grid-template-columns:1fr minmax(180px,auto) 56px;gap:12px;align-items:center;padding:7px 12px;border-bottom:1px solid var(--line)}.life li.bad{background:var(--badbg)}.life .http{font:700 .9em Consolas,monospace;text-align:center;border-radius:6px;background:var(--okbg);color:var(--ok)}.life li.bad .http{background:var(--badbg);color:var(--bad)}.life code{background:none;color:var(--muted)}
.def{border-left:5px solid var(--blk);padding:4px 0 4px 16px;margin:12px 0 18px}.def.S1{border-left-color:var(--bad)}.def.S2{border-left-color:#e07a45}.def.S3{border-left-color:var(--mid)}
@media (max-width:900px){.kpi{grid-template-columns:repeat(3,1fr)}.team,.cols2,.cols3,.shots.n2,.shots.n3{grid-template-columns:1fr}}
@media print{body{background:#fff}.page{box-shadow:none}.ch{break-before:page}details.more{display:block}}
</style></head><body><main class="page">

<p class="muted">Inżynieria testów oprogramowania · projekt zespołowy</p>
<h1>Restful-Booker-Platform – projekt testowy</h1>
<p class="meta">SUT: <a href="https://automationintesting.online">automationintesting.online</a> (UI v2.2) · pełny przebieg ${esc(fmt(metrics.finishedAt))} · Chrome, Playwright 1.62.1</p>
<div class="kpi"><div><b>${metrics.planned}</b><span>przypadków</span></div><div class="ok"><b>${metrics.PASS}</b><span>PASS</span></div><div class="bad"><b>${metrics.FAIL}</b><span>FAIL</span></div><div class="blk"><b>${metrics.BLOCKED}</b><span>BLOCKED</span></div><div><b>${metrics['NOT RUN']}</b><span>NOT RUN</span></div><div class="bad"><b>${metrics.uniqueDefects}</b><span>defekty</span></div></div>
<div class="verdict"><b>Rekomendacja: ${esc(metrics.recommendation)}.</b> Trasy API z identyfikatorem (<code>/{id}</code>) zwracają HTTP 500, przez co rezerwacja pokoju jest niemożliwa (DEF-01, S1). Kryterium GO – brak otwartych S1/S2 w kluczowym zakresie – nie jest spełnione.</div>
<div class="team">${(team.members || []).map((x, i) => `<div class="p${i + 1}"><b>${esc(x.name)}</b> (${esc(x.studentNumber)})<span>${esc(x.role)} · rozdział ${['1 i 5', '2', '3', '4'][i]}</span></div>`).join('')}</div>
<nav class="toc"><a href="#ch1">1. Plan i ryzyka</a><a href="#ch2">2. Projekt testów</a><a href="#ch3">3. Wykonanie i defekty</a><a href="#ch4">4. API i automatyzacja</a><a href="#ch5">5. Rekomendacja</a><a href="#ch6">6. Pokrycie wymagań</a></nav>

${chapter(1, 0, 'ch1', 'Plan testów i analiza ryzyka', `
${points(['<b>Cel:</b> ocenić, czy gość może znaleźć i zarezerwować pokój, czy dane wejściowe są walidowane i czy dostęp administracyjny jest chroniony.', '<b>SUT:</b> publiczne wdrożenie – frontend Next.js z proxy <code>/api/*</code> przed usługami room, booking, message, auth.', '<b>Środowisko:</b> Chrome desktop, Europe/Warsaw (w eksploracji także UTC i UTC+14), Playwright + TypeScript.', '<b>Kryterium GO:</b> brak otwartych defektów S1/S2 w kluczowym zakresie i potwierdzona rezerwacja.'])}
<div class="cols2"><div class="card"><h4>W zakresie</h4><ul><li>Katalog, szczegóły pokoju, dostępność, cena</li><li>Rezerwacja i dane gościa</li><li>Formularz kontaktowy i walidacje</li><li>API: room, message, booking, auth</li><li>Kontrola dostępu</li></ul></div><div class="card"><h4>Poza zakresem</h4><ul><li>Wydajność i obciążenie (publiczna instancja)</li><li>Pentest, płatności</li><li>Macierz przeglądarek i urządzeń mobilnych</li><li>Modyfikacje cudzych danych</li></ul></div></div>
<h3>Analiza ryzyka</h3>
<p>Poziom ryzyka = prawdopodobieństwo × wpływ (skala 1–3). Ryzyka o wpływie 3 dostały priorytet P1 i były testowane jako pierwsze.</p>
${table(['ID', 'Ryzyko', 'P × I', 'Priorytet'], riskShort)}
${details('Szczegóły: uzasadnienie i przypadki przypisane do ryzyk', table(['ID', 'Obszar', 'Uzasadnienie priorytetu', 'Przypadki'], riskFull))}
${take('Najwyższe ryzyko – rezerwacja (P×I = 9) – dostało najwyższy priorytet i właśnie tam znaleźliśmy defekt krytyczny.')}`)}

${chapter(2, 1, 'ch2', 'Projekt testów i testy eksploracyjne', `
${points([`<b>${metrics.planned} przypadków:</b> ${metrics.ui} UI i ${metrics.api} API, w tym ${metrics.negative} negatywnych (minima: 20 / 12 / 6 / 6).`, 'Każdy przypadek ma ID, cel, priorytet, ryzyko, warunki wstępne, dane, kroki, oczekiwany i rzeczywisty rezultat, status i evidence.', 'Dane dobrane technikami EP, BVA i DT; dodatkowo testy przejść stanu (pełne cykle CRUD w API-09/10).'])}
<h3>Techniki</h3>
<div class="cols3"><div class="card"><h4>EP – klasy równoważności</h4>${table(['Klasa', 'TC'], [['Email poprawny', 'UI-02'], ['Email – zły format', 'UI-04, API-05'], ['Email – zły typ (obiekt)', 'API-06'], ['Brak wymaganych pól', 'UI-03, API-04'], ['ID spoza listy', 'API-03'], ['Brak / błędne auth', 'API-07, API-08']])}</div>
<div class="card"><h4>BVA – wartości brzegowe</h4>${table(['Pole', 'min−1', 'min'], [['Temat (5–100)', '4 → 400 · UI-05', '5 → 200 · UI-06'], ['Telefon (11–21)', '10 → 400 · UI-07', '11 → 200 · UI-02']])}<p class="muted">Górne granice i pole opisu sprawdzone w eksploracji.</p></div>
<div class="card"><h4>DT – tablica decyzyjna</h4>${table(['', 'R1', 'R2', 'R3', 'R4'], [['Email OK', 'T', 'T', 'N', 'N'], ['Temat OK', 'T', 'N', 'T', 'N'], ['HTTP', '200', '400', '400', '400']])}<p class="muted">R1: UI-02 · R2: UI-05 · R3, R4: UI-04</p></div></div>
<h3>Przykład: ${ex.id} – ${esc(ex.name)}</h3>
${table(['', ''], [['Technika', esc(ex.technique)], ['Dane', 'poprawne pola, temat „ABCD” (4 znaki)'], ['Oczekiwany rezultat', esc(ex.expected)], ['Wynik', st(ex.status)]])}
${steps('UI-05', 'Screeny kroków zapisane automatycznie podczas wykonania.')}
${details(`Szczegóły: wszystkie ${metrics.planned} przypadki`, table(['ID', 'Nazwa', 'Charakter', 'Technika', 'Status'], tcRows))}
<h3>Testy eksploracyjne – EXP-02</h3>
${points([`<b>Charter:</b> ${esc(session.charter.mission)}`, `<b>Czas:</b> ${dur}; heurystyki: ${esc(session.charter.heuristics.join(', '))}.`, '<b>Ustalenia:</b> dwa nowe defekty – DEF-03 (nieważny token → 500 zamiast 401/403) i DEF-04 (w strefie UTC+14 wyszukiwanie dla dat przesuniętych o dzień); pełne granice trzech pól formularza.'])}
${details('Szczegóły: dziennik sesji, tablica decyzyjna dostępu, pytania otwarte', `${table(journal[0] || [], journal.slice(1).map((r) => r.map(esc)))}<p><b>Tablica decyzyjna dostępu</b> (<code>GET /api/booking?roomid=</code>)</p>${table(authDt[0] || [], authDt.slice(1).map((r) => r.map(esc)))}<p><b>Pytania otwarte</b></p><ul>${questions.map((q) => `<li>${esc(q)}</li>`).join('')}</ul>`)}
${take('Dobór danych wynika z technik i ryzyk; eksploracja dodała dwa defekty spoza zaplanowanych przypadków.')}`)}

${chapter(3, 2, 'ch3', 'Wykonanie, evidence i defekty', `
<div class="cols2"><div>${table(['Status', 'UI', 'API', 'Razem'], ['PASS', 'FAIL', 'BLOCKED', 'NOT RUN'].map(statusRow))}</div>
<div>${points([`Wykonane (PASS + FAIL): <b>${metrics.executed}</b> z ${metrics.planned} (${pct(metrics.completionRate)}).`, `PASS wśród wykonanych: <b>${pct(metrics.passRateAmongExecuted)}</b>.`, 'BLOCKED tylko z jawnym powodem: bez działających szczegółów pokoju kroki rezerwacji są niewykonalne.', 'Evidence każdego przypadku: request, response, asercje (JSON) i screeny kroków UI.'])}</div></div>
<h3>Przypadki FAIL i BLOCKED</h3>
${table(['ID', 'Przypadek', 'Status', 'Przyczyna', 'Defekt'], notPass)}
<h3>Evidence – przykład</h3>
${steps('UI-04', 'UI-04: błędny email, potem błędny email i za krótki temat – za każdym razem 400 i komunikat walidacji.')}
<h3>Defekty</h3>
${table(['ID', 'Defekt', 'Severity · Priority', 'Powiązane'], defectShort)}
${details('Szczegóły: pełne raporty defektów (kroki reprodukcji, oczekiwane / rzeczywiste)', defectFull)}
${take('Każdy wynik ma dowód, a każdy defekt – kroki pozwalające go odtworzyć. Siedem przypadków z tym samym objawem to jeden DEF-01.')}`)}

${chapter(4, 3, 'ch4', 'Testy API i automatyzacja', `
${points([`<b>${metrics.api} testów API</b> na 4 usługach (room, message, auth, booking), metody GET / POST / PUT / DELETE.`, 'Negatywne: brak pól, zły format, zły typ, nieistniejący zasób, brak uwierzytelnienia, błędne dane logowania.', 'Spójność: pełne cykle utwórz → odczytaj → zmień → potwierdź → usuń (API-09, API-10), bez stałych ID.', `<b>${metrics.ui} testów UI</b> w modelu Page Object Model; wszystkie 22 testy uruchamiane jednym poleceniem.`])}
<h3>Architektura testów API</h3>
${table(['Warstwa', 'Odpowiedzialność'], [['<code>tests/api.spec.ts</code>', 'scenariusz i jawne asercje'], ['<code>api/clients/</code>', 'klient per zasób (Auth, Room, Message, Booking); bez asercji'], ['<code>api/data/</code>', 'buildery danych testowych, wybór wolnego terminu'], ['<code>helpers/audit.ts</code>', 'automatyczny zapis evidence, maskowanie sekretów']])}
${code(noHeader(block(apiSrc, '// API-05')), 'API-05: builder tworzy wiadomość ze złym emailem, klient ją wysyła, test sprawdza 400, komunikat i brak zapisu.')}
<h3>Cykl CRUD – API-09 (wiadomość)</h3>
${flow('API-09', ['logowanie administratora', 'utworzenie wiadomości', 'identyfikacja własnego rekordu', 'odczyt po ID', 'oznaczenie jako przeczytana', 'potwierdzenie zmiany', 'usunięcie', 'potwierdzenie usunięcia'])}
<p>Tworzenie i listy działają; odczyt, zmiana i usunięcie po ID zwracają 500 – ten sam symptom co DEF-01. Analogiczny wynik dla rezerwacji (API-10).</p>
${details('Szczegóły: przebieg API-10, klasy Page Object Model, konfiguracja runnera', `<p><b>API-10 – rezerwacja</b></p>${flow('API-10', ['logowanie administratora', 'lista pokoi', 'aktualne rezerwacje', 'utworzenie rezerwacji', 'identyfikacja własnej rezerwacji', 'odczyt po ID', 'zmiana nazwiska', 'potwierdzenie zmiany', 'usunięcie', 'potwierdzenie usunięcia'])}
<p><b>Page Object Model</b>: <code>HomePage</code> (katalog, wyszukiwarka), <code>ContactForm</code>, <code>ReservationPage</code>, <code>AdminLoginPage</code>; fixture łączy obiekty stron z klientami API.</p>${code(noHeader(block(uiSrc, '// UI-05')), 'UI-05 na obiektach stron home i contactForm.')}
${table(['Element', 'Ustawienie'], [['Projekty', '<code>api</code> (bez przeglądarki) i <code>ui-chrome</code> (trace i screenshot przy FAIL)'], ['Stabilność', '1 worker, 0 retry, brak sztucznych oczekiwań'], ['Raporty', 'HTML, JSON, JUnit, raport-testow.html'], ['Sekrety', 'zmienne środowiskowe, maskowanie w evidence'], ['Uruchomienie', '<code>npm ci</code> → <code>npm test</code> (ok. 30 s), RUNBOOK.md']])}`)}
${take('Testy API mają wydzielone warstwy, testy UI – Page Object Model. Kod wyjścia 1 oznacza wykryte defekty SUT, a nie niedziałającą automatyzację.')}`)}

${chapter(5, 0, 'ch5', 'Podsumowanie i rekomendacja', `
${table(['Kryterium', 'Stan'], [['Każdy przypadek ma status', `<span class="st PASS">spełnione</span> ${metrics.planned}/${metrics.planned}`], ['Brak otwartych S1/S2 w kluczowym zakresie', '<span class="st FAIL">niespełnione</span> DEF-01 (S1), DEF-04 (S2)'], ['Potwierdzona rezerwacja gościa', '<span class="st FAIL">niespełnione</span> UI-08..10 BLOCKED, API-10 FAIL']])}
<p><b>Rekomendacja: ${esc(metrics.recommendation)}.</b> Kluczowy proces – rezerwacja – jest niedostępny; działające obszary (kontakt, walidacje, odmowa dostępu) nie równoważą tej blokady.</p>
<p><b>Warunki zmiany decyzji:</b></p>
${points(['naprawa tras <code>/{id}</code> (DEF-01) i retest UI-08..10 oraz API-09/10,', 'zwracanie 4xx dla błędnych danych i nieważnej sesji (DEF-02, DEF-03),', 'konwersja dat niezależna od strefy klienta (DEF-04),', 'nowy pełny przebieg i przeliczone metryki.'])}
${details('Szczegóły: status ryzyk po testach', table(['Ryzyko', 'Status'], [['R-01 Rezerwacja', 'zmaterializowane – DEF-01'], ['R-05 Daty i cena', 'częściowo – DEF-04; cena niezweryfikowana (BLOCKED)'], ['R-04 Uprawnienia', 'odmowa dostępu działa; nieważna sesja → 500 (DEF-03)'], ['R-03 Walidacja', 'format i długość OK; zły typ → 500 (DEF-02)'], ['R-06 Stan danych', 'zmiana i usuwanie rekordów nie działają (DEF-01)'], ['R-02 Katalog', 'lista spójna z UI; szczegóły niedostępne (DEF-01)']]))}`)}

<section class="ch p0" id="ch6"><div class="chhead"><span class="chno">6</span><div><h2>Pokrycie wymagań projektu</h2></div></div>
${table(['Wymaganie', 'Realizacja'], [['Plan testów i min. 5 ryzyk (str. 5)', '01_TestPlan.pdf · 6 ryzyk P×I'], ['≥ 20 TC (12 UI, 6 API, 6 neg.), EP/BVA/DT (str. 6)', `02_TestCases.md · ${metrics.planned} TC, ${metrics.negative} negatywnych`], ['Sesja eksploracyjna 30–45 min (str. 7)', `03_Exploratory.md · ${dur}`], ['≥ 6 API, ≥ 3 endpointy, CRUD (str. 8)', '10 TC API, API-09/10'], ['≥ 3 automaty, README, wynik (str. 9)', '22 automaty, RUNBOOK.md, raport-testow.html'], ['Statusy i evidence (str. 10)', `${metrics.planned}/${metrics.planned}, evidence/`], ['Raporty defektów (str. 11–12)', '04_Defects.md'], ['Test Summary i rekomendacja (str. 13)', '06_TestSummaryReport.pdf']])}
<p class="muted">Pliki: <a href="README.md">README</a> · <a href="RUNBOOK.md">RUNBOOK</a> · <a href="01_TestPlan.pdf">01</a> · <a href="02_TestCases.md">02</a> · <a href="03_Exploratory.md">03</a> · <a href="04_Defects.md">04</a> · <a href="05_Automation/README.md">05</a> · <a href="06_TestSummaryReport.pdf">06</a> · <a href="05_Automation/reports/raport-testow.html">raport z testów</a></p></section>
</main></body></html>`;
fs.writeFileSync(path.join(root, '00_Prezentacja.html'), html);
console.log('Zapisano 00_Prezentacja.html', `(${Math.round(html.length / 1024)} KB)`);
