// Raport z testów w HTML do otwarcia w przeglądarce (dwuklik, bez serwera i internetu).
// Źródła: supporting/test-cases.json, metrics.json, defects.json, team.json, evidence/{api,ui}/*.json.
// Uruchom: node supporting/tools/build-html-report.mjs   (lub w 05_Automation: npm run report:project)
// Wynik: 05_Automation/reports/raport-testow.html (screeny UI linkowane względnie z evidence/ui).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.env.QA_PROJECT_DIR || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const cases = read('supporting/test-cases.json');
const metrics = read('supporting/metrics.json');
const defects = read('supporting/defects.json');
const team = read('supporting/team.json');
const out = path.join(root, '05_Automation/reports/raport-testow.html');
const rel = (p) => path.relative(path.dirname(out), path.join(root, p)).replaceAll('\\', '/');

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nl = (s) => esc(s).replace(/\n/g, '<br>');
const fmt = (iso) => new Date(iso).toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw', dateStyle: 'short', timeStyle: 'medium' });
const short = (v, n = 1200) => { const t = typeof v === 'string' ? v : JSON.stringify(v, null, 2); return t.length > n ? t.slice(0, n) + `\n… (skrócono, pełna treść w pliku evidence)` : t; };
const pathOf = (u) => { try { const x = new URL(u, 'https://automationintesting.online'); return x.pathname + x.search; } catch { return u; } };
const httpClass = (s) => (s >= 500 ? 'h5' : s >= 400 ? 'h4' : 'h2');

function caseCard(c) {
  const type = c.type.toLowerCase();
  let ev = {};
  try { ev = read(`evidence/${type}/${c.id}.json`); } catch {}
  const reqs = (ev.requests || []).map((r, i) => `
      <details class="req">
        <summary><span class="m">${esc(r.request.method)}</span> <code>${esc(pathOf(r.request.url))}</code> <span class="http ${httpClass(r.response.status)}">${esc(r.response.status)}</span><span class="idx">#${i}</span></summary>
        <div class="io"><div><h5>Request body</h5><pre>${esc(short(r.request.body ?? null))}</pre></div>
        <div><h5>Response body</h5><pre>${esc(short(r.response.body))}</pre></div></div>
      </details>`).join('');
  const asserts = (ev.assertions || []).map((a) => {
    const cls = a.pass ? 'ok' : a.informational ? 'info' : 'bad';
    const label = a.pass ? 'OK' : a.informational ? 'INFO' : 'NIEZGODNE';
    return `<tr class="${cls}"><td><span class="tag ${cls}">${label}</span></td><td>${esc(a.label)}</td><td><code>${esc(JSON.stringify(a.expected))}</code></td><td><code>${esc(JSON.stringify(a.actual))}</code></td><td>${a.requestIndex >= 0 ? '#' + a.requestIndex : ''}</td></tr>`;
  }).join('');
  const steps = (ev.steps || []).map((s) => `<figure class="step"><a href="${rel(s.file)}" target="_blank"><img loading="lazy" src="${rel(s.file)}" alt="${esc(c.id)} krok ${s.no}: ${esc(s.label)}"></a><figcaption><b>Krok ${s.no}.</b> ${esc(s.label)}</figcaption></figure>`).join('');
  const full = c.type === 'UI' && fs.existsSync(path.join(root, `evidence/ui/${c.id}.png`)) ? `<p class="small">Pełny zrzut strony po teście: <a href="${rel(`evidence/ui/${c.id}.png`)}" target="_blank">${esc(c.id)}.png</a></p>` : '';
  const shot = steps ? `<h4>Przebieg krok po kroku</h4><div class="steps">${steps}</div>${full}` : full;
  return `
  <article class="case" data-status="${esc(c.status)}" data-type="${esc(c.type)}" id="${esc(c.id)}">
    <details>
      <summary>
        <span class="status ${esc(c.status)}">${esc(c.status)}</span>
        <span class="cid">${esc(c.id)}</span>
        <span class="cname">${esc(c.name)}</span>
        <span class="meta">${esc(c.priority)} · ${esc(c.polarity)} · ${esc(c.risk)}${c.defect ? ` · <b>${esc(c.defect)}</b>` : ''}</span>
      </summary>
      <div class="body">
        <dl>
          <dt>Cel</dt><dd>${nl(c.objective)}</dd>
          <dt>Technika</dt><dd>${esc(c.technique)}</dd>
          <dt>Warunki wstępne</dt><dd>${nl(c.preconditions)}</dd>
          <dt>Dane testowe</dt><dd>${nl(c.data)}</dd>
          <dt>Kroki</dt><dd><ol>${(c.steps || []).map((s) => `<li>${esc(s)}</li>`).join('')}</ol></dd>
          <dt>Oczekiwany rezultat</dt><dd>${nl(c.expected)}</dd>
          <dt>Rzeczywisty rezultat</dt><dd>${nl(c.actual)}</dd>
          <dt>Wykonano</dt><dd>${esc(fmt(c.executedAt))} · ${esc(c.durationMs)} ms · evidence: <a href="${rel(`evidence/${type}/${c.id}.json`)}" target="_blank">${esc(c.id)}.json</a></dd>
        </dl>
        ${shot}
        ${asserts ? `<h4>Asercje</h4><table class="asserts"><tr><th>Wynik</th><th>Asercja</th><th>Oczekiwano</th><th>Otrzymano</th><th>Req</th></tr>${asserts}</table>` : ''}
        ${reqs ? `<h4>Żądania HTTP (${ev.requests.length})</h4>${reqs}` : ''}
      </div>
    </details>
  </article>`;
}

const sev = (d) => d.severity;
const defectCards = defects.map((d) => `
  <article class="defect">
    <div class="dhead"><span class="sev ${sev(d)}">${esc(d.severity)} · ${esc(d.priority)}</span><b>${esc(d.id)}</b> ${esc(d.title)}</div>
    <p>${nl(d.actual)}</p>
    <details><summary>Kroki reprodukcji, expected, wpływ</summary>
      <ol>${d.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
      <p><b>Oczekiwane:</b> ${nl(d.expected)}</p><p><b>Wpływ:</b> ${nl(d.impact)}</p><p><b>Deduplikacja:</b> ${nl(d.deduplication)}</p>
    </details>
    <p class="small">Powiązane: ${esc(d.cases.join(', '))} · ${esc(d.environment)}</p>
  </article>`).join('');

const byType = ['UI', 'API'].map((t) => {
  const cs = cases.filter((c) => c.type === t);
  const n = (s) => cs.filter((c) => c.status === s).length;
  return `<tr><td>${t}</td><td>${cs.length}</td><td class="PASS">${n('PASS')}</td><td class="FAIL">${n('FAIL')}</td><td class="BLOCKED">${n('BLOCKED')}</td><td>${n('NOT RUN')}</td></tr>`;
}).join('');
const members = (team.members || []).map((m) => `${esc(m.name)} (${esc(m.studentNumber)}) – ${esc(m.role)}`).join('<br>');
const pct = (x) => (x * 100).toFixed(1).replace('.', ',') + '%';

const html = `<!doctype html>
<html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Raport z testów – Restful-Booker-Platform</title>
<style>
:root{--bg:#f5f3ee;--card:#fff;--ink:#15213a;--soft:#4a556b;--line:#ddd6c8;--pass:#1f6f43;--passbg:#dcefe3;--fail:#a3361a;--failbg:#f8e0d6;--blk:#5e6573;--blkbg:#e6e8ec;--info:#7a5a00;--infobg:#f6ecc8;--acc:#2f5fd0}
@media (prefers-color-scheme:dark){:root{--bg:#121826;--card:#1b2335;--ink:#e8ecf4;--soft:#aab4c8;--line:#2e3a55;--pass:#7fd3a0;--passbg:#1d3a2a;--fail:#ff9f7a;--failbg:#45251c;--blk:#c3cbda;--blkbg:#2a3246;--info:#f0cf6a;--infobg:#3d3418;--acc:#8fb0ff}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 "Segoe UI",system-ui,-apple-system,Arial,sans-serif}
.wrap{max-width:1180px;margin:0 auto;padding:28px 20px 60px}
h1{font-size:28px;margin:0 0 4px}h2{font-size:21px;margin:34px 0 12px}h4{margin:18px 0 8px}h5{margin:0 0 4px;font-size:12px;color:var(--soft);text-transform:uppercase;letter-spacing:.5px}
.sub{color:var(--soft);margin:0 0 18px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}
.kpi{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 16px}.kpi b{display:block;font-size:30px;line-height:1.1}.kpi span{color:var(--soft);font-size:13px}
.kpi.PASS b{color:var(--pass)}.kpi.FAIL b{color:var(--fail)}.kpi.BLOCKED b{color:var(--blk)}
.verdict{margin-top:14px;background:var(--failbg);border:1px solid var(--fail);border-radius:12px;padding:14px 18px}.verdict b{color:var(--fail);font-size:20px}
.panel{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 18px}
table{border-collapse:collapse;width:100%}th,td{text-align:left;padding:6px 10px;border-bottom:1px solid var(--line);vertical-align:top}th{font-size:13px;color:var(--soft)}
td.PASS{color:var(--pass);font-weight:600}td.FAIL{color:var(--fail);font-weight:600}td.BLOCKED{color:var(--blk);font-weight:600}
.filters{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 12px}.filters button{border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:20px;padding:5px 14px;cursor:pointer;font:inherit}.filters button.on{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.case{background:var(--card);border:1px solid var(--line);border-radius:10px;margin-bottom:8px}
.case>details>summary{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;list-style:none}.case>details>summary::-webkit-details-marker{display:none}
.case>details[open]>summary{border-bottom:1px solid var(--line)}
.status{font-weight:700;font-size:12px;padding:3px 9px;border-radius:12px;min-width:74px;text-align:center}
.status.PASS{background:var(--passbg);color:var(--pass)}.status.FAIL{background:var(--failbg);color:var(--fail)}.status.BLOCKED{background:var(--blkbg);color:var(--blk)}
.cid{font-weight:700;font-family:Consolas,monospace}.cname{flex:1;min-width:220px}.meta{color:var(--soft);font-size:13px}
.body{padding:12px 16px 16px}dl{display:grid;grid-template-columns:170px 1fr;gap:6px 14px;margin:0}dt{color:var(--soft);font-size:13px}dd{margin:0}dd ol{margin:0;padding-left:20px}
.steps{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;margin:8px 0}.step{margin:0;background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:8px}.step img{display:block;width:100%;max-height:300px;object-fit:contain;object-position:top left;background:#fff;border-radius:6px;border:1px solid var(--line)}.step figcaption{font-size:13px;margin-top:6px}
.asserts td code{font-size:12px}.tag{font-size:11px;font-weight:700;padding:2px 7px;border-radius:10px}.tag.ok{background:var(--passbg);color:var(--pass)}.tag.bad{background:var(--failbg);color:var(--fail)}.tag.info{background:var(--infobg);color:var(--info)}
.req{border:1px solid var(--line);border-radius:8px;margin:6px 0}.req summary{padding:6px 10px;cursor:pointer;display:flex;gap:8px;align-items:center;flex-wrap:wrap}.req .m{font-weight:700;font-family:Consolas,monospace;min-width:56px}.idx{margin-left:auto;color:var(--soft);font-size:12px}
.http{font-weight:700;font-family:Consolas,monospace;padding:1px 7px;border-radius:8px}.http.h2{background:var(--passbg);color:var(--pass)}.http.h4{background:var(--infobg);color:var(--info)}.http.h5{background:var(--failbg);color:var(--fail)}
.io{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:8px 10px 10px}pre{margin:0;background:var(--bg);border:1px solid var(--line);border-radius:6px;padding:8px;font-size:12px;max-height:260px;overflow:auto;white-space:pre-wrap;word-break:break-word}
code{font-family:Consolas,monospace}
.defect{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px 16px;margin-bottom:10px}.defect p{margin:6px 0}.dhead{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.sev{font-weight:700;font-size:12px;padding:3px 9px;border-radius:12px}.sev.S1{background:var(--fail);color:#fff}.sev.S2{background:var(--failbg);color:var(--fail)}.sev.S3,.sev.S4{background:var(--blkbg);color:var(--blk)}
.small{font-size:13px;color:var(--soft)}footer{margin-top:40px;color:var(--soft);font-size:13px}
@media (max-width:700px){dl{grid-template-columns:1fr}.io{grid-template-columns:1fr}}
@media print{.filters{display:none}details{display:block}.case details>*{display:block}}
</style></head><body><div class="wrap">
<h1>Raport z testów – Restful-Booker-Platform</h1>
<p class="sub">SUT: automationintesting.online (UI v2.2) · pełny przebieg ${esc(fmt(metrics.startedAt))} – ${esc(fmt(metrics.finishedAt))} · Chrome, Playwright 1.62.1, Europe/Warsaw</p>
<div class="grid">
  <div class="kpi"><b>${metrics.planned}</b><span>zaplanowane</span></div>
  <div class="kpi"><b>${metrics.executed}</b><span>wykonane (PASS+FAIL)</span></div>
  <div class="kpi PASS"><b>${metrics.PASS}</b><span>PASS</span></div>
  <div class="kpi FAIL"><b>${metrics.FAIL}</b><span>FAIL</span></div>
  <div class="kpi BLOCKED"><b>${metrics.BLOCKED}</b><span>BLOCKED</span></div>
  <div class="kpi"><b>${metrics['NOT RUN']}</b><span>NOT RUN</span></div>
</div>
<div class="verdict"><b>Rekomendacja: ${esc(metrics.recommendation)}</b><br>Trasy API z identyfikatorem (/{id}) zwracają HTTP 500, co blokuje rezerwację gościa (DEF-01, S1). Działające kontakt, walidacje i odmowa dostępu nie równoważą tej blokady.</div>
<h2>Metryki</h2>
<div class="grid" style="grid-template-columns:2fr 1fr">
<div class="panel"><table><tr><th>Typ</th><th>Plan</th><th>PASS</th><th>FAIL</th><th>BLOCKED</th><th>NOT RUN</th></tr>${byType}</table>
<p class="small">Pokrycie wykonaniem ${pct(metrics.completionRate)} · PASS wśród wykonanych ${pct(metrics.passRateAmongExecuted)} · ${metrics.negative} przypadków negatywnych · defekty: S1=${metrics.defectsBySeverity.S1}, S2=${metrics.defectsBySeverity.S2}, S3=${metrics.defectsBySeverity.S3}, S4=${metrics.defectsBySeverity.S4}</p></div>
<div class="panel"><h5>Zespół</h5><p class="small" style="color:var(--ink)">${members}</p></div>
</div>
<h2>Przypadki testowe (${cases.length})</h2>
<div class="filters" role="group" aria-label="Filtr">
  <button data-f="all" class="on">Wszystkie</button><button data-f="PASS">PASS</button><button data-f="FAIL">FAIL</button><button data-f="BLOCKED">BLOCKED</button><button data-f="UI">UI</button><button data-f="API">API</button>
  <button data-x="open">Rozwiń wszystkie</button><button data-x="close">Zwiń</button>
</div>
${cases.map(caseCard).join('')}
<h2>Defekty (${defects.length})</h2>
${defectCards}
<footer>Wygenerowano ${esc(fmt(new Date().toISOString()))} skryptem supporting/tools/build-html-report.mjs z case-results.json, evidence i plików supporting/*.json. Statusy: PASS – zgodność asercji; FAIL – potwierdzona niezgodność; BLOCKED – brak warunku wykonania (jawny powód); INFO – kontrola informacyjna bez wpływu na werdykt. Sekrety w evidence są maskowane.</footer>
</div>
<script>
const btns=document.querySelectorAll('.filters button[data-f]');
btns.forEach(b=>b.onclick=()=>{btns.forEach(x=>x.classList.remove('on'));b.classList.add('on');const f=b.dataset.f;
document.querySelectorAll('.case').forEach(c=>{c.style.display=(f==='all'||c.dataset.status===f||c.dataset.type===f)?'':'none'})});
document.querySelectorAll('.filters button[data-x]').forEach(b=>b.onclick=()=>document.querySelectorAll('.case>details').forEach(d=>d.open=b.dataset.x==='open'));
if(location.hash){const d=document.querySelector(location.hash+'>details');if(d)d.open=true}
</script>
</body></html>`;
fs.writeFileSync(out, html);
console.log('Zapisano', path.relative(root, out), `(${Math.round(html.length / 1024)} KB)`);
