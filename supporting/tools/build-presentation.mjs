// Prezentacja projektu: strona główna 00_Prezentacja.html (zwięzłe rozdziały) + podstrony w prezentacja/
// z pełnym opisem każdego obszaru. Treść generowana z danych projektu (supporting/*.json, evidence,
// 03_Exploratory.md, kod testów). Uruchom: node supporting/tools/build-presentation.mjs
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
const dur = `${Math.floor(session.durationMinutes)} min ${Math.round((session.durationMinutes % 1) * 60)} s`;
const apiSrc = read('05_Automation/tests/api.spec.ts');
const uiSrc = read('05_Automation/tests/ui.spec.ts');
const block = (src, prefix) => (src.split(/\n(?=\/\/ (?:API|UI)-\d+)/).find((b) => b.startsWith(prefix)) || '').trim();
const noHeader = (b) => b.split('\n').filter((l) => !l.startsWith('//')).join('\n').trim();
const expMd = read('03_Exploratory.md');
const mdTable = (md, heading) => {
  const lines = md.split('\n'); const i = lines.findIndex((l) => l.startsWith(heading)); if (i < 0) return [];
  const rows = []; for (let j = i + 1; j < lines.length && !lines[j].startsWith('## '); j++) if (lines[j].startsWith('|') && !/^\|[\s:|-]+\|$/.test(lines[j])) rows.push(lines[j].replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
  return rows;
};
const journal = mdTable(expMd, '## Dziennik');
const authDt = mdTable(expMd, '## Tablica decyzyjna dostępu');
const questions = (expMd.match(/Q-01:[^\n]*/) || [''])[0].split(/\s(?=Q-\d+:)/).filter(Boolean);

// ---------- elementy wspólne (base = prefiks ścieżek: '' dla strony głównej, '../' dla podstron) ----------
const mk = (base) => {
  const P = (p) => base + p;
  return {
    P,
    table: (head, rows, cls = '') => `<div class="tw"><table class="${cls}"><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</table></div>`,
    points: (items) => `<ul class="points">${items.map((x) => `<li>${x}</li>`).join('')}</ul>`,
    code: (src, cap) => `<figure class="fig"><pre class="code">${esc(src)}</pre>${cap ? `<figcaption>${cap}</figcaption>` : ''}</figure>`,
    shots: (items, cap) => items.length ? `<figure class="fig"><div class="shots n${Math.min(items.length, 3)}">${items.map(([file, label]) => `<a href="${esc(P(file))}" target="_blank"><img src="${esc(P(file))}" alt="${esc(label)}" loading="lazy"><span>${label}</span></a>`).join('')}</div>${cap ? `<figcaption>${cap}</figcaption>` : ''}</figure>` : '',
    steps: (id, cap) => { const s = ev(id).steps || []; return s.length ? `<figure class="fig"><div class="shots n${Math.min(s.length, 3)}">${s.map((x) => `<a href="${esc(P(x.file))}" target="_blank"><img src="${esc(P(x.file))}" alt="${esc(id)} krok ${x.no}" loading="lazy"><span>${x.no}. ${esc(x.label)}</span></a>`).join('')}</div>${cap ? `<figcaption>${cap}</figcaption>` : ''}</figure>` : ''; },
    take: (t) => `<aside class="take">${t}</aside>`,
    more: (links) => `<div class="morelinks">${links.map(([href, label]) => `<a class="btn" href="${href}">${label} →</a>`).join('')}</div>`,
  };
};
const lvl = (s) => (s >= 6 ? 'wysokie' : s >= 3 ? 'średnie' : 'niskie');
const pWord = { 1: 'małe', 2: 'średnie', 3: 'duże' }, iWord = { 1: 'mały', 2: 'istotny', 3: 'krytyczny' };
const prio = (r) => (r.I === 3 ? 'P1' : 'P2');
const sortedRisks = risks.slice().sort((a, b) => b.score - a.score || b.I - a.I);
const sevName = { S1: 'S1 Critical', S2: 'S2 High', S3: 'S3 Medium', S4: 'S4 Low' };
const tmpl = (u) => { const x = new URL(u, 'https://x'); return x.pathname.replace(/\/\d+(?=\/|$)/g, '/{id}') + (x.search ? x.search.replace(/=\d+/g, '={id}') : ''); };
const reqList = (id) => (ev(id).requests || []).map((r) => { const u = new URL(r.request.url, 'https://x'); const s = r.response.status; return `<li class="${s >= 500 ? 'bad' : ''}"><code>${esc(r.request.method)} ${esc(u.pathname + u.search)}</code> <span class="http h${String(s)[0]}">${s}</span></li>`; }).join('');
const shortReason = (c) => {
  if (c.status === 'BLOCKED') return 'preflight <code>GET /api/room/{id}</code> → 500, brak formularza rezerwacji';
  const e = ev(c.id); const bad = (e.requests || []).find((r) => r.response.status >= 500) || (e.requests || []).find((r) => r.response.status >= 400);
  if (!bad) return '';
  const u = new URL(bad.request.url, 'https://x');
  return `<code>${esc(bad.request.method)} ${esc(u.pathname)}</code> → ${bad.response.status}${c.id === 'API-03' ? ' (oczekiwano 404)' : c.id === 'API-06' ? ' (oczekiwano 400)' : ''}`;
};
const flow = (id, labels) => { const e = ev(id); return `<ol class="life">${(e.requests || []).map((r, i) => { const s = r.response.status; const a = (e.assertions || []).filter((x) => x.requestIndex === i && !x.informational); const ok = s < 400 && a.every((x) => x.pass); const u = new URL(r.request.url, 'https://x'); return `<li class="${ok ? 'ok' : 'bad'}"><span class="lbl">${esc(labels[i] || '')}</span><code>${esc(r.request.method)} ${esc(u.pathname)}</code><span class="http">${s}</span></li>`; }).join('')}</ol>`; };
const flow09 = ['logowanie administratora', 'utworzenie wiadomości', 'identyfikacja własnego rekordu', 'odczyt po ID', 'oznaczenie jako przeczytana', 'potwierdzenie zmiany na liście', 'usunięcie', 'potwierdzenie usunięcia'];
const flow10 = ['logowanie administratora', 'lista pokoi', 'aktualne rezerwacje (wybór wolnego terminu)', 'utworzenie rezerwacji (gość)', 'identyfikacja własnej rezerwacji', 'odczyt po ID', 'zmiana nazwiska', 'potwierdzenie zmiany na liście', 'usunięcie', 'potwierdzenie usunięcia'];
const pagesOf = { 'UI-01': 'HomePage', 'UI-02': 'HomePage, ContactForm', 'UI-03': 'HomePage, ContactForm', 'UI-04': 'HomePage, ContactForm', 'UI-05': 'HomePage, ContactForm', 'UI-06': 'HomePage, ContactForm', 'UI-07': 'HomePage, ContactForm', 'UI-08': 'ReservationPage + api.rooms', 'UI-09': 'ReservationPage + api.rooms', 'UI-10': 'ReservationPage + api.rooms', 'UI-11': 'AdminLoginPage', 'UI-12': 'HomePage' };

const SUBPAGES = [
  ['plan-i-ryzyka.html', 'Plan i ryzyka'],
  ['projekt-testow.html', 'Projekt testów'],
  ['eksploracja.html', 'Testy eksploracyjne'],
  ['wykonanie-i-defekty.html', 'Wykonanie i defekty'],
  ['testy-api.html', 'Testy API'],
  ['testy-e2e.html', 'Testy E2E (POM)'],
  ['automatyzacja.html', 'Automatyzacja'],
];

const CSS = `:root{--bg:#f6f4ef;--paper:#fffdf9;--ink:#1d2433;--muted:#5b6475;--line:#e6dfd2;--accent:#2f5fd0;--ok:#1f7a4a;--okbg:#e2f2e8;--bad:#b13d1c;--badbg:#fbe5dc;--mid:#8a6400;--midbg:#f8efcf;--blk:#5d6576;--blkbg:#e6e8ee;--c1:#2f5fd0;--c2:#7a3fb0;--c3:#b4501e;--c4:#1f7a6a}
@media (prefers-color-scheme:dark){:root{--bg:#12172a;--paper:#1a2034;--ink:#eceff6;--muted:#aab3c6;--line:#2d3753;--accent:#8fb0ff;--ok:#82d4a4;--okbg:#1d3a2a;--bad:#ff9f7a;--badbg:#45251c;--mid:#f0cf6a;--midbg:#3b3217;--blk:#c3cbda;--blkbg:#283046;--c1:#8fb0ff;--c2:#c79bf0;--c3:#f39a6b;--c4:#6fd3c0}}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--ink);font:clamp(16px,0.4vw + 11px,19px)/1.65 "Segoe UI",system-ui,-apple-system,Arial,sans-serif}
.topnav{position:sticky;top:0;z-index:5;background:var(--paper);border-bottom:1px solid var(--line)}.topnav .in{width:min(1400px,94vw);margin:0 auto;display:flex;flex-wrap:wrap;gap:4px 16px;padding:8px 0;font-size:.88em}.topnav a{text-decoration:none;color:var(--muted)}.topnav a.on{color:var(--ink);font-weight:700}.topnav a.home{color:var(--accent);font-weight:600}
.page{width:min(1400px,94vw);margin:0 auto;background:var(--paper);padding:clamp(24px,3vw,56px) clamp(18px,4vw,72px) 72px;box-shadow:0 0 40px rgba(0,0,0,.06);min-height:100vh}
h1{font-size:clamp(28px,2.4vw,42px);line-height:1.15;margin:0 0 6px}h2{font-size:clamp(23px,1.8vw,31px);line-height:1.2;margin:0}h3{font-size:clamp(18px,1.25vw,23px);margin:34px 0 10px}h4{margin:0 0 8px}
p{margin:0 0 12px}a{color:var(--accent)}.nw{white-space:nowrap}ol,ul{margin:0 0 12px;padding-left:24px}li{margin:4px 0}.muted{color:var(--muted);font-size:.9em}.meta{color:var(--muted);margin:0 0 18px}
.kpi{display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin:16px 0}.kpi div{border:1px solid var(--line);border-radius:12px;padding:12px 16px;background:var(--bg)}.kpi b{display:block;font-size:clamp(26px,2.2vw,38px);line-height:1.1}.kpi span{font-size:.85em;color:var(--muted)}.kpi .ok b{color:var(--ok)}.kpi .bad b{color:var(--bad)}.kpi .blk b{color:var(--blk)}
.verdict{border-left:6px solid var(--bad);background:var(--badbg);padding:14px 20px;border-radius:0 12px 12px 0;margin:18px 0;font-size:1.05em}.verdict b{color:var(--bad)}
.team{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:18px 0}.team div{border-left:5px solid var(--pc);padding:4px 12px}.team span{display:block;color:var(--muted);font-size:.88em}
.toc{display:flex;flex-wrap:wrap;gap:8px 18px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:10px 0;margin:10px 0 0}.toc a{text-decoration:none}
.tw{overflow-x:auto;margin:8px 0 14px}table{border-collapse:collapse;width:100%;line-height:1.5}th,td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--line);vertical-align:top}th{font-size:.78em;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;white-space:nowrap}td:first-child{white-space:nowrap}table.wrap td:first-child{white-space:normal}
.st,.lv,.sev{display:inline-block;font-size:.8em;font-weight:700;padding:1px 9px;border-radius:10px;white-space:nowrap}.st.PASS{background:var(--okbg);color:var(--ok)}.st.FAIL{background:var(--badbg);color:var(--bad)}.st.BLOCKED{background:var(--blkbg);color:var(--blk)}
.lv.wysokie,.sev.S1,.sev.S2{background:var(--badbg);color:var(--bad)}.lv.średnie,.sev.S3{background:var(--midbg);color:var(--mid)}.lv.niskie,.sev.S4{background:var(--okbg);color:var(--ok)}
.ch{border-top:1px solid var(--line);margin-top:48px;padding-top:32px}.chhead{display:flex;gap:16px;align-items:center;margin-bottom:12px}.chno{flex:none;width:44px;height:44px;border-radius:50%;background:var(--pc);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:21px}.by{margin:2px 0 0;color:var(--muted)}
.p1{--pc:var(--c1)}.p2{--pc:var(--c2)}.p3{--pc:var(--c3)}.p4{--pc:var(--c4)}.p0{--pc:#4b5566}
.points{padding-left:22px;margin:4px 0 14px}.points li{margin:6px 0}
.cols2{display:grid;grid-template-columns:1fr 1fr;gap:24px}.cols3{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}.cols2>*,.cols3>*{min-width:0}
.card{border:1px solid var(--line);border-radius:12px;padding:14px 18px;background:var(--bg)}.card table{font-size:.92em}.card td,.card th{padding:7px 8px}
.take{border-left:5px solid var(--pc);background:var(--bg);border-radius:0 10px 10px 0;padding:12px 18px;margin:20px 0 4px;font-weight:600}
.morelinks{display:flex;flex-wrap:wrap;gap:10px;margin:18px 0 0}.btn{display:inline-block;text-decoration:none;border:1px solid var(--pc);color:var(--pc);border-radius:20px;padding:6px 16px;font-weight:600;font-size:.92em}.btn:hover{background:var(--pc);color:#fff}
.fig{margin:10px 0 18px}.fig figcaption{font-size:.88em;color:var(--muted);margin-top:6px}
.shots{display:grid;gap:14px}.shots.n1{grid-template-columns:minmax(0,640px)}.shots.n2{grid-template-columns:1fr 1fr}.shots.n3{grid-template-columns:repeat(3,1fr)}
.shots a{display:flex;flex-direction:column;gap:6px;text-decoration:none;color:var(--ink);border:1px solid var(--line);border-radius:10px;padding:8px;background:var(--bg);font-size:.88em}.shots img{width:100%;max-height:clamp(180px,20vw,340px);object-fit:contain;object-position:top left;background:#fff;border-radius:6px;border:1px solid var(--line)}
pre.code{background:#1d2433;color:#e8ecf4;border-radius:12px;padding:16px 18px;font:14px/1.6 Consolas,"Cascadia Mono",monospace;overflow-x:auto;margin:0;white-space:pre}
code{font-family:Consolas,monospace;font-size:.88em;background:var(--bg);padding:1px 5px;border-radius:4px}pre code{background:none}
.life{list-style:none;padding:0;margin:6px 0 16px;max-width:920px}.life li{display:grid;grid-template-columns:1fr minmax(180px,auto) 56px;gap:12px;align-items:center;padding:7px 12px;border-bottom:1px solid var(--line)}.life li.bad{background:var(--badbg)}.life .http{font:700 .9em Consolas,monospace;text-align:center;border-radius:6px;background:var(--okbg);color:var(--ok)}.life li.bad .http{background:var(--badbg);color:var(--bad)}.life code{background:none;color:var(--muted)}
.reqs{list-style:none;padding:0;margin:4px 0 10px}.reqs li{padding:3px 0}.reqs li.bad code{color:var(--bad)}.http{font:700 .85em Consolas,monospace;padding:0 7px;border-radius:6px}.http.h2{background:var(--okbg);color:var(--ok)}.http.h4{background:var(--midbg);color:var(--mid)}.http.h5{background:var(--badbg);color:var(--bad)}
.def{border-left:5px solid var(--blk);padding:4px 0 4px 18px;margin:16px 0 24px}.def.S1{border-left-color:var(--bad)}.def.S2{border-left-color:#e07a45}.def.S3{border-left-color:var(--mid)}
.tc{border:1px solid var(--line);border-radius:14px;padding:16px 20px;margin:18px 0;background:var(--paper)}.tchead{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:10px}.tchead h4{margin:0;font-size:1.08em}.tchead .tags{color:var(--muted);font-size:.86em;margin-left:auto}
.tc dl{display:grid;grid-template-columns:170px 1fr;gap:6px 16px;margin:0 0 10px}.tc dt{color:var(--muted)}.tc dd{margin:0}.tc dd ol{margin:0}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 16px}.chips a{text-decoration:none;font:600 .82em Consolas,monospace;padding:3px 9px;border-radius:8px;background:var(--bg);border:1px solid var(--line);color:var(--ink)}.chips a.FAIL{border-color:var(--bad);color:var(--bad)}.chips a.BLOCKED{color:var(--blk)}
.scen{border:1px solid var(--line);border-radius:14px;padding:18px 22px;margin:22px 0;background:var(--paper)}.scen h3{margin:0 0 6px}.scen .goal{color:var(--muted);margin:0 0 14px}
.stepcard{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.25fr);gap:20px;align-items:start;padding:14px 0;border-top:1px solid var(--line)}.stepcard .no{display:inline-flex;width:28px;height:28px;border-radius:50%;background:var(--c2);color:#fff;align-items:center;justify-content:center;font-weight:700;font-size:.9em;margin-right:8px}.stepcard img{width:100%;max-height:360px;object-fit:contain;object-position:top left;background:#fff;border:1px solid var(--line);border-radius:8px}
.result{border-radius:10px;padding:10px 14px;margin-top:12px;background:var(--bg)}.result.bad{background:var(--badbg)}.result.q{background:var(--midbg)}
@media (max-width:900px){.kpi{grid-template-columns:repeat(3,1fr)}.team,.cols2,.cols3,.shots.n2,.shots.n3,.stepcard{grid-template-columns:1fr}.tc dl{grid-template-columns:1fr}}
@media print{body{background:#fff}.page{box-shadow:none}.topnav{display:none}}`;

const shell = (title, body, { base = '', current = '' } = {}) => `<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>${CSS}</style></head><body>
<nav class="topnav"><div class="in"><a class="home${current === 'main' ? ' on' : ''}" href="${base}00_Prezentacja.html">Strona główna</a>${SUBPAGES.map(([f, l]) => `<a class="${current === f ? 'on' : ''}" href="${base ? '' : 'prezentacja/'}${f}">${l}</a>`).join('')}</div></nav>
<main class="page">${body}</main></body></html>`;
const subHead = (who, kicker, title, intro) => `<p class="muted">${kicker}</p><h1>${title}</h1><p class="meta">${who >= 0 ? `${esc(m(who).name)} · ${esc(m(who).role)} · ` : ''}<a href="../00_Prezentacja.html">← powrót do strony głównej</a></p>${intro ? `<p>${intro}</p>` : ''}`;

// =====================================================================================
// STRONA GŁÓWNA
// =====================================================================================
const H = mk('');
const SP = (f) => `prezentacja/${f}`;
const chapter = (no, who, id, title, body) => `<section class="ch p${who + 1}" id="${id}"><div class="chhead"><span class="chno">${no}</span><div><h2>${title}</h2><p class="by">${esc(m(who).name)} · ${esc(m(who).role)}</p></div></div>${body}</section>`;
const riskShort = sortedRisks.map((r) => [`<b>${r.id}</b>`, esc(r.description), `<span class="nw">${r.P} – ${pWord[r.P]}</span>`, `<span class="nw">${r.I} – ${iWord[r.I]}</span>`, `<b>${r.score}</b> <span class="lv ${lvl(r.score)}">${lvl(r.score)}</span>`, prio(r)]);
const notPass = cases.filter((c) => c.status !== 'PASS').map((c) => [`<b>${c.id}</b>`, esc(c.name), st(c.status), shortReason(c), c.defect || '–']);
const statusRow = (s) => [s, count((c) => c.type === 'UI' && c.status === s), count((c) => c.type === 'API' && c.status === s), `<b>${metrics[s]}</b>`];
const defectShort = defects.map((d) => [`<b>${d.id}</b>`, esc(d.title), `<span class="sev ${d.severity}">${sevName[d.severity]} · ${d.priority}</span>`, esc(d.cases.join(', '))]);
const ex = byId('UI-05');

const mainBody = `
<p class="muted">Inżynieria testów oprogramowania · projekt zespołowy</p>
<h1>Restful-Booker-Platform – projekt testowy</h1>
<p class="meta">SUT: <a href="https://automationintesting.online">automationintesting.online</a> (UI v2.2) · pełny przebieg ${esc(fmt(metrics.finishedAt))} · Chrome, Playwright 1.62.1</p>
<div class="kpi"><div><b>${metrics.planned}</b><span>przypadków</span></div><div class="ok"><b>${metrics.PASS}</b><span>PASS</span></div><div class="bad"><b>${metrics.FAIL}</b><span>FAIL</span></div><div class="blk"><b>${metrics.BLOCKED}</b><span>BLOCKED</span></div><div><b>${metrics['NOT RUN']}</b><span>NOT RUN</span></div><div class="bad"><b>${metrics.uniqueDefects}</b><span>defekty</span></div></div>
<div class="verdict"><b>Rekomendacja: ${esc(metrics.recommendation)}.</b> Trasy API z identyfikatorem (<code>/{id}</code>) zwracają HTTP 500, przez co rezerwacja pokoju jest niemożliwa (DEF-01, S1). Kryterium GO – brak otwartych defektów S1/S2 w kluczowym zakresie – nie jest spełnione.</div>
<div class="team">${(team.members || []).map((x, i) => `<div class="p${i + 1}"><b>${esc(x.name)}</b> (${esc(x.studentNumber)})<span>${esc(x.role)} · rozdział ${['1 i 5', '2', '3', '4'][i]}</span></div>`).join('')}</div>
<nav class="toc"><a href="#ch1">1. Plan i ryzyka</a><a href="#ch2">2. Projekt testów</a><a href="#ch3">3. Wykonanie i defekty</a><a href="#ch4">4. API, E2E i automatyzacja</a><a href="#ch5">5. Rekomendacja</a><a href="#ch6">6. Pokrycie wymagań</a></nav>

${chapter(1, 0, 'ch1', 'Plan testów i analiza ryzyka', `
${H.points(['<b>Cel:</b> ocenić, czy gość może znaleźć i zarezerwować pokój, czy dane wejściowe są walidowane i czy dostęp administracyjny jest chroniony.', '<b>SUT:</b> publiczne wdrożenie – frontend Next.js z proxy <code>/api/*</code> przed usługami room, booking, message, auth.', '<b>Środowisko:</b> Chrome desktop, Europe/Warsaw (w eksploracji także UTC i UTC+14), Playwright + TypeScript.', '<b>Kryterium GO:</b> brak otwartych defektów S1/S2 w kluczowym zakresie i potwierdzona rezerwacja.'])}
<h3>Analiza ryzyka</h3>
<p>Każde ryzyko oceniono pod kątem prawdopodobieństwa i wpływu na użytkownika (skala 1–3); poziom ryzyka to iloczyn obu ocen (6–9 wysoki, 3–4 średni). Ryzyka o wpływie krytycznym dostały priorytet P1.</p>
${H.table(['ID', 'Ryzyko', 'Prawdopodobieństwo', 'Wpływ', 'Poziom ryzyka', 'Priorytet testów'], riskShort)}
${H.take('Najwyższe ryzyko – rezerwacja (poziom 9 z 9) – dostało najwyższy priorytet i właśnie tam znaleźliśmy defekt krytyczny.')}
${H.more([[SP('plan-i-ryzyka.html'), 'Plan testów i pełna analiza ryzyka']])}`)}

${chapter(2, 1, 'ch2', 'Projekt testów i testy eksploracyjne', `
${H.points([`<b>${metrics.planned} przypadków:</b> ${metrics.ui} E2E (UI) i ${metrics.api} API, w tym ${metrics.negative} negatywnych (minima: 20 / 12 / 6 / 6).`, 'Dane dobrane technikami EP, BVA i DT; dodatkowo testy przejść stanu (pełne cykle CRUD).', `<b>Eksploracja EXP-02</b> (${dur}): dwa nowe defekty – DEF-03 (nieważny token → 500) i DEF-04 (daty w strefie UTC+14).`])}
<div class="cols3"><div class="card"><h4>EP – klasy równoważności</h4>${H.table(['Klasa', 'TC'], [['Email poprawny', 'UI-02'], ['Email – zły format', 'UI-04, API-05'], ['Email – zły typ', 'API-06'], ['Brak wymaganych pól', 'UI-03, API-04'], ['ID spoza listy', 'API-03']])}</div>
<div class="card"><h4>BVA – wartości brzegowe</h4>${H.table(['Pole', 'min−1', 'min'], [['Temat (5–100)', '4 → 400', '5 → 200'], ['Telefon (11–21)', '10 → 400', '11 → 200']])}</div>
<div class="card"><h4>DT – tablica decyzyjna</h4>${H.table(['', 'R1', 'R2', 'R3', 'R4'], [['Email OK', 'T', 'T', 'N', 'N'], ['Temat OK', 'T', 'N', 'T', 'N'], ['HTTP', '200', '400', '400', '400']])}</div></div>
<h3>Przykład: ${ex.id} – ${esc(ex.name)}</h3>
${H.steps('UI-05', 'Screeny kroków zapisane automatycznie podczas wykonania.')}
${H.take('Dobór danych wynika z technik i ryzyk; eksploracja dodała dwa defekty spoza zaplanowanych przypadków.')}
${H.more([[SP('projekt-testow.html'), 'Wszystkie przypadki testowe z krokami i screenami'], [SP('eksploracja.html'), 'Sesja eksploracyjna krok po kroku']])}`)}

${chapter(3, 2, 'ch3', 'Wykonanie, evidence i defekty', `
<div class="cols2"><div>${H.table(['Status', 'UI', 'API', 'Razem'], ['PASS', 'FAIL', 'BLOCKED', 'NOT RUN'].map(statusRow))}</div>
<div>${H.points([`Wykonane (PASS + FAIL): <b>${metrics.executed}</b> z ${metrics.planned} (${pct(metrics.completionRate)}).`, `PASS wśród wykonanych: <b>${pct(metrics.passRateAmongExecuted)}</b>.`, 'BLOCKED tylko z jawnym powodem: bez szczegółów pokoju kroki rezerwacji są niewykonalne.', 'Evidence każdego przypadku: request, response, asercje (JSON) i screeny kroków.'])}</div></div>
<h3>Przypadki FAIL i BLOCKED</h3>
${H.table(['ID', 'Przypadek', 'Status', 'Przyczyna', 'Defekt'], notPass)}
<h3>Defekty</h3>
${H.table(['ID', 'Defekt', 'Severity · Priority', 'Powiązane'], defectShort)}
${H.take('Każdy wynik ma dowód, a każdy defekt – kroki pozwalające go odtworzyć. Siedem przypadków z tym samym objawem to jeden DEF-01.')}
${H.more([[SP('wykonanie-i-defekty.html'), 'Wyniki, evidence i pełne raporty defektów']])}`)}

${chapter(4, 3, 'ch4', 'Testy API, testy E2E (POM) i automatyzacja', `
<h3>Testy API</h3>
${H.points([`<b>${metrics.api} testów</b> na 4 usługach (room, message, auth, booking), metody GET / POST / PUT / DELETE.`, 'Negatywne: brak pól, zły format, zły typ, nieistniejący zasób, brak uwierzytelnienia, błędne dane logowania.', 'Pełne cykle utwórz → odczytaj → zmień → potwierdź → usuń (API-09, API-10), bez stałych ID.', 'Architektura warstwowa: test (scenariusz i asercje) · klienci API · buildery danych · automatyczne evidence.'])}
${H.code(noHeader(block(apiSrc, '// API-05')), 'API-05: builder tworzy wiadomość ze złym emailem, klient ją wysyła, test sprawdza 400, komunikat i brak zapisu.')}
<h3>Testy E2E w modelu Page Object Model</h3>
${H.points([`<b>${metrics.ui} testów E2E</b> w przeglądarce Chrome; każda strona aplikacji ma klasę z lokatorami i akcjami, a test zawiera tylko scenariusz i asercje.`, 'Fixture łączy obiekty stron z klientami API – np. przed testem rezerwacji szczegóły pokoju są sprawdzane przez API.', 'Każdy test zapisuje wycinki ekranu po istotnych krokach.'])}
${H.table(['Klasa (obiekt strony)', 'Strona', 'Akcje'], [['<code>HomePage</code>', 'strona główna', 'otwarcie, katalog pokoi, wybór dat, wyszukiwanie dostępności'], ['<code>ContactForm</code>', 'formularz kontaktowy', 'wypełnienie pól, wysyłka, komunikaty błędów, potwierdzenie'], ['<code>ReservationPage</code>', 'rezerwacja pokoju', 'otwarcie dla pokoju i terminu, cena, dane gościa, wysłanie'], ['<code>AdminLoginPage</code>', 'panel administratora', 'login, hasło, wysłanie, komunikat błędu']])}
${H.table(['ID', 'Scenariusz', 'Obiekty stron', 'Status'], cases.filter((c) => c.type === 'UI').map((c) => [`<b>${c.id}</b>`, esc(c.name), `<code>${pagesOf[c.id] || ''}</code>`, st(c.status)]))}
${H.code(noHeader(block(uiSrc, '// UI-05')), 'UI-05: scenariusz na obiektach home i contactForm.')}
${H.steps('UI-11', 'UI-11: logowanie administratora błędnymi danymi – odmowa (401) i komunikat.')}
<h3>Automatyzacja</h3>
${H.points(['Wszystkie 22 testy uruchamiane jednym poleceniem (<code>npm test</code>, ok. 30 s); 1 worker, 0 retry.', 'Raporty: HTML, JSON, JUnit i raport z testów z dowodami; sekrety tylko w zmiennych środowiskowych.'])}
${H.take('Testy API mają wydzielone warstwy, testy E2E – Page Object Model na tej samej warstwie. Kod wyjścia 1 oznacza wykryte defekty SUT, a nie niedziałającą automatyzację.')}
${H.more([[SP('testy-api.html'), 'Testy API: budowa i działanie'], [SP('testy-e2e.html'), 'Testy E2E (POM) ze screenami kroków'], [SP('automatyzacja.html'), 'Automatyzacja: konfiguracja i uruchomienie']])}`)}

${chapter(5, 0, 'ch5', 'Podsumowanie i rekomendacja', `
${H.table(['Kryterium', 'Stan'], [['Każdy przypadek ma status', `<span class="st PASS">spełnione</span> ${metrics.planned}/${metrics.planned}`], ['Brak otwartych S1/S2 w kluczowym zakresie', '<span class="st FAIL">niespełnione</span> DEF-01 (S1), DEF-04 (S2)'], ['Potwierdzona rezerwacja gościa', '<span class="st FAIL">niespełnione</span> UI-08..10 BLOCKED, API-10 FAIL']])}
<p><b>Rekomendacja: ${esc(metrics.recommendation)}.</b> Kluczowy proces – rezerwacja – jest niedostępny; działające obszary (kontakt, walidacje, odmowa dostępu) nie równoważą tej blokady.</p>
<p><b>Warunki zmiany decyzji:</b></p>
${H.points(['naprawa tras <code>/{id}</code> (DEF-01) i retest UI-08..10 oraz API-09/10,', 'zwracanie 4xx dla błędnych danych i nieważnej sesji (DEF-02, DEF-03),', 'konwersja dat niezależna od strefy klienta (DEF-04),', 'nowy pełny przebieg i przeliczone metryki.'])}`)}

<section class="ch p0" id="ch6"><div class="chhead"><span class="chno">6</span><div><h2>Pokrycie wymagań projektu</h2></div></div>
${H.table(['Wymaganie', 'Realizacja'], [['Plan testów i min. 5 ryzyk (str. 5)', '01_TestPlan.pdf · 6 ryzyk'], ['≥ 20 TC (12 UI, 6 API, 6 neg.), EP/BVA/DT (str. 6)', `02_TestCases.md · ${metrics.planned} TC, ${metrics.negative} negatywnych`], ['Sesja eksploracyjna 30–45 min (str. 7)', `03_Exploratory.md · ${dur}`], ['≥ 6 API, ≥ 3 endpointy, CRUD (str. 8)', '10 TC API, API-09/10'], ['≥ 3 automaty, README, wynik (str. 9)', '22 automaty, RUNBOOK.md, raport-testow.html'], ['Statusy i evidence (str. 10)', `${metrics.planned}/${metrics.planned}, evidence/`], ['Raporty defektów (str. 11–12)', '04_Defects.md'], ['Test Summary i rekomendacja (str. 13)', '06_TestSummaryReport.pdf']])}
<p class="muted">Pliki: <a href="README.md">README</a> · <a href="RUNBOOK.md">RUNBOOK</a> · <a href="01_TestPlan.pdf">01</a> · <a href="02_TestCases.md">02</a> · <a href="03_Exploratory.md">03</a> · <a href="04_Defects.md">04</a> · <a href="05_Automation/README.md">05</a> · <a href="06_TestSummaryReport.pdf">06</a> · <a href="05_Automation/reports/raport-testow.html">raport z testów</a></p></section>`;

// =====================================================================================
// PODSTRONY
// =====================================================================================
const S = mk('../');
const pages = {};

// --- Plan i ryzyka ---
pages['plan-i-ryzyka.html'] = ['Plan testów i analiza ryzyka', `<div class="p1">${subHead(0, 'Rozdział 1', 'Plan testów i analiza ryzyka')}
<h3>Przedmiot i cel</h3>
<p>Restful-Booker-Platform to aplikacja pensjonatu: frontend Next.js wystawia publiczne proxy <code>/api/*</code> przed usługami Spring (room, booking, message, auth). Testujemy publiczne wdrożenie (UI v2.2, commit wdrożenia nieznany); kontrakty weryfikujemy względem kodu referencyjnego z oficjalnego repozytorium.</p>
<p>Cel: ocenić, czy gość może znaleźć i zarezerwować pokój, czy dane wejściowe są poprawnie walidowane i czy dostęp administracyjny jest chroniony – i wydać rekomendację opartą na śledzalnych wynikach.</p>
<div class="cols2"><div class="card"><h4>W zakresie</h4><ul><li>Katalog pokoi, szczegóły pokoju, dostępność i daty, cena pobytu</li><li>Rezerwacja: dane gościa, payload, zapis</li><li>Formularz kontaktowy: wymagane pola, format i typ danych, długości pól</li><li>API: room, message, booking, auth – odczyt, tworzenie, modyfikacja, usuwanie własnych rekordów</li><li>Kontrola dostępu: brak tokenu, błędne dane logowania, nieważna sesja</li></ul></div>
<div class="card"><h4>Poza zakresem</h4><ul><li>Wydajność i obciążenie (publiczna instancja szkoleniowa)</li><li>Testy penetracyjne, płatności, SLA</li><li>Pełna macierz przeglądarek i urządzeń mobilnych, audyt dostępności</li><li>Modyfikacje cudzych danych, pełna regresja panelu administratora</li></ul></div></div>
<h3>Środowisko i kryteria</h3>
${S.table(['Element', 'Wartość'], [['Platforma', 'Windows 11, Google Chrome 157 (1440×1000), Europe/Warsaw; w eksploracji także UTC i UTC+14'], ['Narzędzia', 'Playwright 1.62.1 + TypeScript (UI i API), Node.js 22; raporty HTML, JSON, JUnit; evidence JSON i screeny kroków'], ['Kryteria wejścia', 'Dostępna strona i lista pokoi, rozpoznany kontrakt operacji, przypadki z danymi i oczekiwaniami, możliwość zapisu evidence'], ['Kryteria zakończenia', 'Każdy przypadek ma status PASS/FAIL/BLOCKED/NOT RUN z uzasadnieniem; defekty i ryzyka zapisane; metryki zgodne z runnerem'], ['Kryterium GO', 'Brak otwartych defektów S1/S2 w kluczowym zakresie, potwierdzona rezerwacja i krytyczne zależności']], 'wrap')}
<h3>Analiza ryzyka</h3>
<p>Prawdopodobieństwo i wpływ oceniono w skali 1–3; poziom ryzyka to ich iloczyn (6–9 wysoki, 3–4 średni, 1–2 niski). Ryzyka o wpływie krytycznym (rezerwacja, uprawnienia, daty) i niezbędne zależności procesu dostały priorytet P1, walidacja kontaktu i katalog – P2. Przy równym poziomie pierwszeństwo ma wyższy wpływ.</p>
${S.table(['ID', 'Ryzyko', 'Prawd.', 'Wpływ', 'Poziom', 'Priorytet', 'Uzasadnienie', 'Przypadki'], sortedRisks.map((r) => [`<b>${r.id}</b>`, `<b>${esc(r.area)}</b><br>${esc(r.description)}`, `${r.P} – ${pWord[r.P]}`, `${r.I} – ${iWord[r.I]}`, `<b>${r.score}</b> <span class="lv ${lvl(r.score)}">${lvl(r.score)}</span>`, prio(r), esc(r.reason), esc(r.cases.join(', '))]), 'wrap')}
<h3>Założenia i ograniczenia</h3>
<ul><li>Instancja jest publiczna, współdzielona i okresowo resetowana – identyfikatory, stan i token pobieramy na nowo w każdym teście; brak stałych ID.</li><li>Tworzymy wyłącznie własne, syntetyczne rekordy z unikalnym znacznikiem QA i próbujemy usuwać tylko je.</li><li>Brak dostępu do logów backendu; limity pól pochodzą z modelu <code>Message</code> i komunikatów walidacji; nieudokumentowane reguły dat traktujemy jako pytania.</li></ul>
<p class="muted">Dokument źródłowy: <a href="../01_TestPlan.pdf">01_TestPlan.pdf</a> · <a href="../supporting/risk-matrix.md">supporting/risk-matrix.md</a></p></div>`];

// --- Projekt testów: wszystkie przypadki z krokami ---
const tcCard = (c) => {
  const e = ev(c.id);
  const evidence = c.type === 'UI' ? S.steps(c.id) : `<ul class="reqs">${reqList(c.id)}</ul>`;
  const asserts = (e.assertions || []).filter((a) => !a.informational);
  return `<article class="tc" id="${c.id}"><div class="tchead">${st(c.status)}<h4>${c.id} – ${esc(c.name)}</h4><span class="tags">${c.type} · ${c.polarity} · ${c.priority} · ${esc(c.risk)}${c.defect ? ` · ${c.defect}` : ''}</span></div>
<dl><dt>Technika</dt><dd>${esc(c.technique)}</dd><dt>Warunki wstępne</dt><dd>${esc(c.preconditions)}</dd><dt>Dane testowe</dt><dd>${esc(c.data)}</dd><dt>Kroki</dt><dd><ol>${c.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol></dd><dt>Oczekiwany rezultat</dt><dd>${esc(c.expected)}</dd><dt>Wynik</dt><dd>${st(c.status)} ${c.status === 'PASS' ? `– ${asserts.length}/${asserts.length} asercji zgodnych` : `– ${shortReason(c)}`}</dd></dl>
${c.type === 'UI' ? '<p class="muted">Przebieg wykonania:</p>' : '<p class="muted">Wykonane żądania:</p>'}${evidence}</article>`;
};
pages['projekt-testow.html'] = ['Projekt testów', `<div class="p2">${subHead(1, 'Rozdział 2', 'Projekt testów', `${metrics.planned} udokumentowanych przypadków: ${metrics.ui} E2E (UI) i ${metrics.api} API, w tym ${metrics.negative} negatywnych. Każdy przypadek wynika z ryzyka i techniki doboru danych; poniżej techniki, a następnie wszystkie przypadki z krokami i przebiegiem wykonania.`)}
<h3>Struktura zestawu</h3>
${S.table(['', 'UI / E2E', 'API', 'Razem', 'Minimum'], [['Przypadki', metrics.ui, metrics.api, `<b>${metrics.planned}</b>`, '20 (≥ 12 UI, ≥ 6 API)'], ['Pozytywne', count((c) => c.type === 'UI' && c.polarity === 'Pozytywny'), count((c) => c.type === 'API' && c.polarity === 'Pozytywny'), count((c) => c.polarity === 'Pozytywny'), '–'], ['Negatywne', count((c) => c.type === 'UI' && c.polarity === 'Negatywny'), count((c) => c.type === 'API' && c.polarity === 'Negatywny'), metrics.negative, '6'], ['Priorytet P1', count((c) => c.type === 'UI' && c.priority === 'P1'), count((c) => c.type === 'API' && c.priority === 'P1'), count((c) => c.priority === 'P1'), '–']])}
<h3>Techniki projektowania</h3>
<div class="cols3"><div class="card"><h4>EP – klasy równoważności</h4>${S.table(['Obszar', 'Klasa', 'TC'], [['Email', 'poprawny', 'UI-02'], ['Email', 'zły format', 'UI-04, API-05'], ['Email', 'zły typ (obiekt JSON)', 'API-06'], ['Pola wymagane', 'brak danych', 'UI-03, API-04'], ['Pokój', 'ID z listy / spoza listy', 'API-02 / API-03'], ['Dostęp', 'brak tokenu / błędne dane', 'API-07 / API-08, UI-11']], 'wrap')}</div>
<div class="card"><h4>BVA – wartości brzegowe</h4>${S.table(['Pole', 'min−1', 'min', 'max', 'max+1'], [['Temat 5–100', '4 → 400<br>UI-05', '5 → 200<br>UI-06', '100 → 200', '101 → 400'], ['Telefon 11–21', '10 → 400<br>UI-07', '11 → 200<br>UI-02', '21 → 200', '22 → 400'], ['Opis 20–2000', '19 → 400', '20 → 200', '2000 → 200', '2001 → 400']], 'wrap')}<p class="muted">Granice górne i pole opisu – w sesji eksploracyjnej. Limity z adnotacji <code>@Size</code> modelu <code>Message</code>.</p></div>
<div class="card"><h4>DT – tablica decyzyjna</h4>${S.table(['Warunek', 'R1', 'R2', 'R3', 'R4'], [['Email poprawny', 'T', 'T', 'N', 'N'], ['Temat poprawny', 'T', 'N', 'T', 'N'], ['Oczekiwany HTTP', '200', '400', '400', '400'], ['TC', 'UI-02', 'UI-05', 'UI-04', 'UI-04']], 'wrap')}</div></div>
<p>Dodatkowo: <b>testy przejść stanu</b> (API-09, API-10 – utworzenie, odczyt, modyfikacja i usunięcie z potwierdzeniem stanu), <b>porównanie interfejsów</b> (UI-01 – katalog w UI zgodny z <code>GET /api/room</code>), <b>spójność danych UI → request</b> (UI-10, UI-12 – daty wybrane w UI = parametry żądania).</p>
<h3>Przypadki testowe</h3>
<div class="chips">${cases.map((c) => `<a class="${c.status}" href="#${c.id}">${c.id}</a>`).join('')}</div>
${cases.map(tcCard).join('')}
<p class="muted">Źródło: <a href="../02_TestCases.md">02_TestCases.md</a> · <a href="../supporting/test-design-techniques.md">supporting/test-design-techniques.md</a></p></div>`];

// --- Eksploracja: scenariusze z krokami i screenami ---
const K = (f) => `evidence/exploratory/kroki/${f}`;
const ts = (i) => fmt(session.events[i].startedAt, { timeStyle: 'medium' });
const scen = (no, title, goal, steps, result, cls = '') => `<section class="scen"><h3>Scenariusz ${no}. ${title}</h3><p class="goal">${goal}</p>
${steps.map((s, i) => `<div class="stepcard"><div><p><span class="no">${i + 1}</span><b>${s.action}</b></p><p>${s.observed}</p>${s.time ? `<p class="muted">${s.time}</p>` : ''}</div><div>${s.img ? `<a href="${S.P(K(s.img))}" target="_blank"><img src="${S.P(K(s.img))}" alt="${esc(s.action)}" loading="lazy"></a>` : ''}</div></div>`).join('')}
<div class="result ${cls}">${result}</div></section>`;
pages['eksploracja.html'] = ['Testy eksploracyjne', `<div class="p2">${subHead(1, 'Rozdział 2 · testy eksploracyjne', 'Sesja eksploracyjna EXP-02')}
${S.table(['Element', 'Wartość'], [['Charter', esc(session.charter.mission)], ['Czas', `${dur} (plan ${session.charter.plannedMinutes} min), ${fmt(session.startedAt)}`], ['Heurystyki', esc(session.charter.heuristics.join(' · '))], ['Ograniczenia', esc(session.charter.limits)], ['Środowiska', 'Chrome; Europe/Warsaw, Pacific/Kiritimati (UTC+14), UTC – rzeczywisty zegar i żywe API'], ['Wykonanie', 'Z pomocą narzędzi (Playwright, asystent AI); ustalenia DEF-01..03 zweryfikowane ponownie na żywo 14.11.2026']], 'wrap')}
${S.table(['Scenariusz', 'Obszar', 'Wynik'], [['1', 'Katalog i przejście do rezerwacji', 'potwierdzenie DEF-01'], ['2', 'Nietypowe daty w wyszukiwarce', 'pytania Q-01, Q-05'], ['3', 'Formularz kontaktowy – walidacja i granice', 'pełne BVA 3 pól, rozszerzenie DEF-02'], ['4', 'Kontrola dostępu', 'nowy DEF-03'], ['5', 'Strefa czasowa klienta', 'nowy DEF-04']])}

${scen(1, 'Katalog i przejście do rezerwacji', 'Czy gość dochodzi od katalogu do formularza rezerwacji?', [
  { action: 'Otwarcie strony głównej', observed: 'Strona i panel dostępności ładują się, <code>GET /api/room</code> → 200.', img: 'S1-1-strona-glowna.png', time: ts(0) },
  { action: 'Załadowanie katalogu i porównanie z API', observed: 'Typy, ceny i linki „Book now” zgodne z bieżącą listą pokoi.', img: 'S1-2-katalog.png', time: ts(2) },
  { action: 'Kliknięcie „Book now” przy pokoju 1', observed: '<code>GET /api/room/1</code> → 500; strona rezerwacji pokazuje tylko wskaźnik ładowania. Ten sam wynik dla wszystkich 3 pokoi.', img: 'S1-3-rezerwacja-500.png', time: ts(4) },
], '<b>Wynik:</b> potwierdzenie DEF-01 – rezerwacja niedostępna dla każdego pokoju; kolejne pokoje nie są raportowane jako nowe defekty.', 'bad')}

${scen(2, 'Nietypowe daty w wyszukiwarce', 'Jak wyszukiwarka dostępności reaguje na poprawne, puste, odwrócone i niemożliwe okresy?', [
  { action: 'Poprawny okres 12–14.01.2027', observed: 'Żądanie <code>checkin=2027-01-12&amp;checkout=2027-01-14</code> → 200, linki z tymi samymi datami.', img: 'S2-1-poprawny-okres.png', time: ts(10) },
  { action: 'Okres zerowy 12–12.01.2027', observed: 'Wyszukiwanie przyjęte (200) bez komunikatu; linki z checkin = checkout.', img: 'S2-2-zerowy-okres.png', time: ts(11) },
  { action: 'Okres odwrócony 14–12.01.2027', observed: 'Wyszukiwanie przyjęte (200) bez komunikatu; daty wysłane w odwrotnej kolejności.', img: 'S2-3-odwrocony-okres.png', time: ts(12) },
  { action: 'Nieistniejąca data 31.02.2027', observed: 'Pole wraca do poprzedniej wartości (14/01/2027) bez komunikatu; wysłano 14.01–04.03.2027.', img: 'S2-4-31-lutego.png', time: ts(14) },
], '<b>Wynik:</b> obserwacje, nie defekty – wymagania walidacji okresu w wyszukiwarce są nieznane (Q-01, Q-05). Zapis rezerwacji niemożliwy przez DEF-01.', 'q')}

${scen(3, 'Formularz kontaktowy – walidacja i granice', 'Czy walidacja pól działa na granicach przedziałów i dla nietypowych danych?', [
  { action: 'Wysłanie pustego formularza', observed: 'HTTP 400 i komplet 8 komunikatów walidacji dla wszystkich pól.', img: 'S3-1-pusty-formularz.png', time: ts(20) },
  { action: 'Dolne granice: temat 5 znaków, opis 20 znaków', observed: 'HTTP 200, potwierdzenie i rekord widoczny na liście wiadomości.', img: 'S3-2-temat-min.png', time: ts(22) },
  { action: 'Górne granice: temat 100, telefon 21, opis 2000 znaków', observed: 'HTTP 200 – wartości maksymalne przyjęte.', img: 'S3-3-temat-max.png', time: ts(33) },
  { action: 'Polskie znaki po poprawieniu błędnych pól', observed: 'Nadawca „Ćma”, temat „Pokój” – HTTP 200, dane zapisane poprawnie.', img: 'S3-4-polskie-znaki.png', time: ts(42) },
  { action: 'Wartości poza przedziałem i błędne typy (API)', observed: 'Temat 101, telefon 22, opis 19 / 2001 → 400; same spacje → 400; email jako obiekt, telefon jako tablica, niepoprawny JSON → 500.' },
], '<b>Wynik:</b> pełne BVA trzech pól (4/5/100/101, 10/11/21/22, 19/20/2000/2001); błędne typy danych dają 500 – rozszerzenie DEF-02.', 'bad')}

${scen(4, 'Kontrola dostępu', 'Czy panel administratora i odczyt rezerwacji są chronione?', [
  { action: 'Wejście na /admin bez logowania', observed: 'Widoczny tylko formularz logowania; panel niedostępny.', img: 'S4-1-panel-bez-logowania.png', time: ts(61) },
  { action: 'Logowanie nieistniejącym kontem', observed: 'HTTP 401 i komunikat „Invalid credentials”; brak tokenu.', img: 'S4-2-bledne-logowanie.png', time: ts(63) },
  { action: 'Odczyt rezerwacji z różnymi tokenami (API)', observed: `${S.table(authDt[0] || [], authDt.slice(1).map((r) => r.map(esc)))}` },
], '<b>Wynik:</b> odmowa dostępu działa, ale nieważny lub pusty token daje 500 zamiast 401/403 – nowy defekt DEF-03 (S3).', 'bad')}

${scen(5, 'Strefa czasowa klienta', 'Czy daty wybrane w wyszukiwarce są wysyłane bez zmian niezależnie od strefy czasowej przeglądarki?', [
  { action: 'Strefa UTC+14 (Kiritimati), daty domyślne', observed: 'Pola pokazują 14–15.11.2026, a żądanie dotyczy okresu o dzień wcześniejszego.', img: 'S5-1-utc14-domyslne.png', time: ts(67) },
  { action: 'UTC+14, wpisane daty 12–14.01.2027', observed: 'Żądanie <code>checkin=2027-01-11&amp;checkout=2027-01-13</code> – przesunięcie o jeden dzień.', img: 'S5-2-utc14-wpisane.png', time: ts(68) },
  { action: 'Kontrola: te same daty w strefie UTC', observed: 'Żądanie <code>checkin=2027-01-12&amp;checkout=2027-01-14</code> – poprawne.', img: 'S5-3-utc-kontrola.png', time: ts(70) },
  { action: 'UTC+14, wybór 18–20.01 z kalendarza', observed: 'Żądanie dotyczy 17–19.01 – ten sam błąd przy wyborze myszą.', img: 'S5-4-utc14-kalendarz.png', time: ts(99) },
], '<b>Wynik:</b> nowy defekt DEF-04 (S2) – wyniki dostępności dotyczą innego okresu niż wybrany. Odtwarzalny, gdy data lokalna klienta różni się od daty UTC.', 'bad')}

<h3>Dziennik sesji</h3>
${S.table(journal[0] || [], journal.slice(1).map((r) => r.map(esc)), 'wrap')}
<h3>Pytania otwarte</h3><ul>${questions.map((q) => `<li>${esc(q)}</li>`).join('')}</ul>
<p class="muted">Źródło: <a href="../03_Exploratory.md">03_Exploratory.md</a> · pełny dziennik: <a href="../evidence/exploratory/session.json">session.json</a></p></div>`];

// --- Wykonanie i defekty ---
const ev04 = ev('API-04');
const evSnippet = JSON.stringify({ caseId: 'API-04', request: { method: ev04.requests?.[0]?.request.method, url: '/api/message', body: {} }, response: { status: ev04.requests?.[0]?.response.status, body: (ev04.requests?.[0]?.response.body || []).slice(0, 3).concat(['…']) }, assertions: (ev04.assertions || []).slice(0, 4).map((a) => ({ label: a.label, expected: a.expected, actual: a.actual, pass: a.pass })) }, null, 2);
pages['wykonanie-i-defekty.html'] = ['Wykonanie, evidence i defekty', `<div class="p3">${subHead(2, 'Rozdział 3', 'Wykonanie, evidence i defekty')}
<h3>Wyniki</h3>
<div class="cols2"><div>${S.table(['Status', 'UI', 'API', 'Razem'], ['PASS', 'FAIL', 'BLOCKED', 'NOT RUN'].map(statusRow))}</div>
<div>${S.points([`Pełny przebieg: <b>${esc(fmt(metrics.startedAt))}</b>, Chrome, Europe/Warsaw.`, `Wykonane (PASS + FAIL): <b>${metrics.executed}</b> (${pct(metrics.completionRate)}); PASS wśród wykonanych <b>${pct(metrics.passRateAmongExecuted)}</b>.`, 'Statusy: PASS – zgodny z oczekiwanym; FAIL – potwierdzona niezgodność; BLOCKED – kroków nie da się wykonać z powodu przeszkody (jawny powód); NOT RUN – niewykonany.'])}</div></div>
<h3>Przypadki FAIL i BLOCKED</h3>
${S.table(['ID', 'Przypadek', 'Status', 'Przyczyna', 'Defekt'], notPass)}
<h3>Evidence</h3>
<p>Dla każdego przypadku powstaje plik <code>evidence/{api|ui}/&lt;ID&gt;.json</code> z listą żądań (request, response, status) i asercji (oczekiwane, otrzymane, wynik). Testy E2E zapisują wycinki ekranu po każdym istotnym kroku. Sekrety, tokeny i ciasteczka są maskowane przed zapisem.</p>
<div class="cols2"><div>${S.code(evSnippet, 'Fragment evidence/api/API-04.json.')}</div><div>${S.steps('UI-11', 'UI-11: odmowa logowania administratora.')}</div></div>
${S.steps('UI-04', 'UI-04: błędny email, potem błędny email i za krótki temat.')}
${S.steps('UI-08', 'UI-08 (BLOCKED): strona rezerwacji bez formularza.')}
<h3>Raporty defektów</h3>
<p>Severity według skali prowadzącego: S1 – blokada kluczowego procesu, S2 – istotna funkcja bez obejścia, S3 – problem z obejściem. Kilka przypadków z tym samym objawem to jeden defekt.</p>
${defects.map((d) => `<div class="def ${d.severity}" id="${d.id}"><h4>${esc(d.id)} – ${esc(d.title)} <span class="sev ${d.severity}">${sevName[d.severity]} · ${d.priority}</span></h4>
${S.table(['', ''], [['Środowisko', esc(d.environment)], ['Warunki wstępne', esc(d.preconditions)], ['Kroki reprodukcji', `<ol>${d.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>`], ['Oczekiwane', esc(d.expected)], ['Rzeczywiste', esc(d.actual)], ['Uzasadnienie severity', esc(d.impact)], ['Deduplikacja', esc(d.deduplication)], ['Powiązane', esc(d.cases.join(', '))], ['Evidence', d.evidence.slice(0, 4).map((e) => `<a href="${S.P(e)}">${esc(path.basename(e))}</a>`).join(', ')]], 'wrap')}</div>`).join('')}
<p class="muted">Źródło: <a href="../04_Defects.md">04_Defects.md</a> · <a href="../05_Automation/reports/raport-testow.html">raport z testów</a></p></div>`];

// --- Testy API ---
const apiRow = (c) => { const e = ev(c.id); const eps = [...new Set((e.requests || []).map((r) => `${r.request.method} ${tmpl(r.request.url)}`))]; const as = (e.assertions || []).filter((a) => !a.informational); return [`<b>${c.id}</b>`, `${esc(c.name)}<br><span class="muted">${c.polarity} · ${esc(c.technique)}</span>`, eps.map((x) => `<code>${esc(x)}</code>`).join('<br>'), `${as.filter((a) => a.pass).length}/${as.length}`, st(c.status)]; };
pages['testy-api.html'] = ['Testy API', `<div class="p4">${subHead(3, 'Rozdział 4', 'Testy API', `${metrics.api} automatycznych testów API w Playwright (APIRequestContext, bez przeglądarki). Testy mają architekturę warstwową: scenariusz i asercje są oddzielone od wywołań HTTP, danych testowych i zapisu evidence.`)}
<h3>Pokrycie</h3>
<div class="cols2"><div>${S.table(['Endpoint', 'Metody', 'Przypadki'], [['<code>/api/room</code>', 'GET', 'API-01, API-03'], ['<code>/api/room/{id}</code>', 'GET', 'API-02, API-03'], ['<code>/api/message</code>', 'POST, GET', 'API-04, 05, 06, 09'], ['<code>/api/message/{id}</code>', 'GET, PUT, DELETE', 'API-09'], ['<code>/api/auth/login</code>', 'POST', 'API-08 (+ logowanie w 09, 10)'], ['<code>/api/booking?roomid=</code>', 'GET', 'API-07, API-10'], ['<code>/api/booking</code>', 'POST', 'API-10'], ['<code>/api/booking/{id}</code>', 'GET, PUT, DELETE', 'API-10']])}</div>
<div>${S.table(['Wymaganie (str. 8)', 'Przypadki'], [['Pozytywne: status i kluczowe pola', 'API-01, 02, 09, 10'], ['Brak wymaganych pól', 'API-04'], ['Błędny format / typ', 'API-05 / API-06'], ['Nieistniejący zasób', 'API-03'], ['Brak auth / błędne logowanie', 'API-07 / API-08'], ['Utwórz → odczytaj, zmień → potwierdź', 'API-09, API-10'], ['Bez stałych ID', 'wszystkie']], 'wrap')}</div></div>
<h3>Architektura</h3>
<pre class="code">05_Automation/
├─ tests/api.spec.ts        scenariusze i asercje
└─ api/
   ├─ clients/              BaseClient, AuthClient, RoomClient, MessageClient, BookingClient
   ├─ data/                 builders.ts (buildMessage, buildBooking), dates.ts (wolny termin)
   ├─ endpoints.ts          ścieżki API
   ├─ types.ts              Room, Message, Booking, ApiResult, AuthSession
   └─ index.ts              fixture: api.auth / api.rooms / api.messages / api.bookings</pre>
<div class="cols2" style="margin-top:16px"><div>${S.table(['Klient', 'Metody'], [['<code>AuthClient</code>', '<code>login(user, pass)</code>, <code>loginAsAdmin()</code> → sesja'], ['<code>RoomClient</code>', '<code>list()</code>, <code>get(id)</code>, <code>firstListed()</code>'], ['<code>MessageClient</code>', '<code>create()</code>, <code>list()</code>, <code>get()</code>, <code>markRead()</code>, <code>delete()</code>, <code>findByName()</code>'], ['<code>BookingClient</code>', '<code>listForRoom()</code>, <code>create()</code>, <code>get()</code>, <code>update()</code>, <code>delete()</code>']], 'wrap')}</div>
<div>${S.points(['<b>Asercje tylko w testach</b> – klient nie ocenia wyniku, więc obsługuje przypadki pozytywne i celowo błędne.', '<b>Evidence automatyczne</b> – każde wywołanie przechodzi przez <code>BaseClient → Audit</code>.', '<b>Buildery danych</b> – poprawne dane domyślne, test nadpisuje tylko badane pole; unikalny znacznik QA.', '<b>Asercje miękkie w sekwencjach</b> – w API-09/10 odczyt po ID nie przerywa testu, więc krok PUT i jego potwierdzenie są wykonane i udokumentowane.'])}</div></div>
<h3>Anatomia testu</h3>
${S.code(noHeader(block(apiSrc, '// API-05')), 'API-05: builder tworzy wiadomość ze złym emailem, klient wysyła ją do serwera, test sprawdza status, treść komunikatu i brak zapisu na liście.')}
<h3>Wszystkie testy API</h3>
${S.table(['ID', 'Test', 'Wywołania', 'Asercje', 'Status'], cases.filter((c) => c.type === 'API').map(apiRow), 'wrap')}
<h3>Przebiegi CRUD</h3>
<p><b>API-09 – wiadomość</b> ${st(byId('API-09').status)}</p>${flow('API-09', flow09)}
<p><b>API-10 – rezerwacja</b> ${st(byId('API-10').status)}</p>${flow('API-10', flow10)}
<p>Tworzenie i listy działają; każda operacja po identyfikatorze (GET, PUT, DELETE) zwraca 500, a lista potwierdza brak utrwalonej zmiany – ten sam symptom co DEF-01.</p>
<p class="muted">Kod: <a href="../05_Automation/tests/api.spec.ts">tests/api.spec.ts</a> · <a href="../05_Automation/api/">api/</a> · evidence: <a href="../evidence/api/">evidence/api/</a></p></div>`];

// --- Testy E2E (POM) ---
pages['testy-e2e.html'] = ['Testy E2E (POM)', `<div class="p4">${subHead(3, 'Rozdział 4', 'Testy E2E w modelu Page Object Model', `${metrics.ui} testów E2E w przeglądarce Chrome. Każda strona aplikacji ma klasę z lokatorami i akcjami (Page Object), a test zawiera wyłącznie scenariusz i asercje. Zmiana interfejsu wymaga poprawki tylko w klasie strony.`)}
<h3>Obiekty stron</h3>
${S.table(['Klasa', 'Strona', 'Elementy i akcje'], [['<code>HomePage</code>', 'strona główna', '<code>open()</code>, <code>roomHeading()</code>, <code>roomPrice()</code>, <code>bookLink()</code>, <code>setDates()</code>, <code>checkAvailability()</code>'], ['<code>ContactForm</code>', 'formularz kontaktowy', 'pola, <code>fill()</code>, <code>submit()</code> (zapis odpowiedzi do evidence), <code>errors</code>, <code>confirmation()</code>'], ['<code>ReservationPage</code>', 'rezerwacja pokoju', '<code>open(room, checkin, checkout)</code>, <code>priceLine()</code>, <code>total()</code>, <code>fillGuest()</code>, <code>submitBooking()</code>'], ['<code>AdminLoginPage</code>', 'panel administratora', '<code>open()</code>, <code>fill(user, pass)</code>, <code>submit()</code>, <code>error</code>']], 'wrap')}
${S.points(['Fixture <code>pages/index.ts</code> rozszerza fixture warstwy API – test E2E ma jednocześnie obiekty stron i klientów API (np. sprawdzenie szczegółów pokoju przez API przed testem rezerwacji).', 'Screeny kroków: <code>a.step(page, opis, [elementy])</code> zapisuje wycinek obejmujący wskazane elementy.'])}
${S.code(noHeader(block(uiSrc, '// UI-05')), 'UI-05: scenariusz na obiektach home i contactForm.')}
<h3>Wszystkie testy E2E</h3>
<div class="chips">${cases.filter((c) => c.type === 'UI').map((c) => `<a class="${c.status}" href="#${c.id}">${c.id}</a>`).join('')}</div>
${cases.filter((c) => c.type === 'UI').map((c) => `<article class="tc" id="${c.id}"><div class="tchead">${st(c.status)}<h4>${c.id} – ${esc(c.name)}</h4><span class="tags">${c.polarity} · ${esc(c.technique)}</span></div>
<dl><dt>Obiekty stron</dt><dd><code>${pagesOf[c.id] || ''}</code></dd><dt>Oczekiwany rezultat</dt><dd>${esc(c.expected)}</dd><dt>Wynik</dt><dd>${st(c.status)}${c.status !== 'PASS' ? ` – ${shortReason(c)}` : ''}</dd></dl>${S.steps(c.id)}</article>`).join('')}
<p class="muted">Kod: <a href="../05_Automation/tests/ui.spec.ts">tests/ui.spec.ts</a> · <a href="../05_Automation/pages/">pages/</a></p></div>`];

// --- Automatyzacja ---
pages['automatyzacja.html'] = ['Automatyzacja', `<div class="p4">${subHead(3, 'Rozdział 4', 'Automatyzacja – konfiguracja i uruchomienie')}
<h3>Struktura projektu</h3>
<pre class="code">05_Automation/
├─ tests/        api.spec.ts (10 testów API), ui.spec.ts (12 testów E2E)
├─ api/          warstwa API: klienci, buildery danych, endpointy, typy, fixture
├─ pages/        Page Object Model: HomePage, ContactForm, ReservationPage, AdminLoginPage
├─ helpers/      audit.ts (evidence, asercje, screeny, maskowanie), result-reporter.ts
└─ playwright.config.ts</pre>
<h3>Konfiguracja runnera</h3>
${S.table(['Element', 'Ustawienie'], [['Projekty', '<code>api</code> – APIRequestContext, bez przeglądarki i bez trace; <code>ui-chrome</code> – Chrome, trace i screenshot przy FAIL'], ['Stabilność', '1 worker, 0 retry, brak sztucznych oczekiwań – nie obciążamy publicznej instancji i nie maskujemy niestabilności'], ['Dane', 'ID z bieżących list, unikalne znaczniki QA, sprzątanie wyłącznie własnych rekordów'], ['Statusy', 'reporter mapuje passed → PASS, failed → FAIL, skip z powodem → BLOCKED (<code>case-results.json</code>)'], ['Sekrety', 'dane administratora tylko w zmiennych <code>QA_USERNAME</code> / <code>QA_PASSWORD</code>; maskowanie w evidence i raportach']], 'wrap')}
<h3>Uruchomienie</h3>
<pre class="code">npm ci --ignore-scripts --no-audit --no-fund
$env:QA_USERNAME='&lt;login&gt;'; $env:QA_PASSWORD='&lt;hasło&gt;'
npm test                  # 22 testy, ok. 30 s
npm run test:api          # tylko API
npm run test:ui           # tylko E2E
npm run report:project    # raport z testów (HTML)</pre>
<p>Oczekiwany wynik: 14 passed, 5 failed, 3 skipped (BLOCKED). Kod wyjścia 1 oznacza wykryte defekty SUT.</p>
<h3>Od przebiegu do dokumentów</h3>
<ol><li><b>Przebieg</b> – <code>npm test</code> zapisuje evidence (JSON, screeny) i raporty runnera (HTML, JSON, JUnit, <code>case-results.json</code>).</li><li><b>Metryki</b> – <code>collect-results.mjs</code> przelicza przypadki, metryki, defekty i macierze.</li><li><b>Dokumenty</b> – generatory tworzą PDF (01, 03, 06), Markdown (02, 04), raport z testów i tę prezentację.</li></ol>
<p class="muted">Instrukcja: <a href="../RUNBOOK.md">RUNBOOK.md</a> · <a href="../05_Automation/README.md">05_Automation/README.md</a> · <a href="../05_Automation/reports/raport-testow.html">raport z testów</a></p></div>`];

// ---------- zapis ----------
fs.writeFileSync(path.join(root, '00_Prezentacja.html'), shell('Projekt testowy – Restful-Booker-Platform', mainBody, { base: '', current: 'main' }));
fs.mkdirSync(path.join(root, 'prezentacja'), { recursive: true });
for (const [file, [title, body]] of Object.entries(pages)) fs.writeFileSync(path.join(root, 'prezentacja', file), shell(`${title} – Restful-Booker-Platform`, body, { base: '../', current: file }));
console.log('Zapisano 00_Prezentacja.html i', Object.keys(pages).length, 'podstron w prezentacja/');
