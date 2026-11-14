// Generuje 02_TestCases.md i 04_Defects.md z danych projektu (zastępują arkusze XLSX).
// Źródła: supporting/test-cases.json, defects.json, metrics.json, team.json.
// Uruchom: node supporting/tools/build-tables-md.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.env.QA_PROJECT_DIR || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const json = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const cases = json('supporting/test-cases.json');
const defects = json('supporting/defects.json');
const metrics = json('supporting/metrics.json');
const team = json('supporting/team.json');

// Znaki < > w tekście (np. QA-<czas>) GitHub potraktowałby jak tagi HTML – escapujemy je.
const esc = (s) => String(s ?? '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const cell = (s) => esc(s).replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>');
const when = (iso) => new Date(iso).toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw', dateStyle: 'short', timeStyle: 'medium' });
const anchor = (id) => id.toLowerCase();
const link = (p) => `[${path.basename(p)}](${p.replace(/ /g, '%20')})`;
const pct = (x) => (x * 100).toFixed(1).replace('.', ',') + '%';
const members = (team.members || []).map((m) => `${m.name} (${m.studentNumber})`).join(', ');
const n = (type, status) => cases.filter((c) => c.type === type && c.status === status).length;

// ---------- 02_TestCases.md ----------
const tc = [];
tc.push('# Przypadki testowe', '');
tc.push(`Zespół: ${members}. Wyniki z pełnego przebiegu ${when(metrics.startedAt)} – ${when(metrics.finishedAt)} (Chrome, Playwright 1.62.1, Europe/Warsaw).`, '');
tc.push('## Podsumowanie', '');
tc.push('| Status | UI | API | Razem |', '|---|---:|---:|---:|');
for (const s of ['PASS', 'FAIL', 'BLOCKED', 'NOT RUN']) tc.push(`| ${s} | ${n('UI', s)} | ${n('API', s)} | ${metrics[s]} |`);
tc.push(`| **Planowane** | ${metrics.ui} | ${metrics.api} | **${metrics.planned}** |`, '');
tc.push(`Wykonane (PASS + FAIL): **${metrics.executed}** · pokrycie wykonaniem ${pct(metrics.completionRate)} · PASS wśród wykonanych ${pct(metrics.passRateAmongExecuted)} · przypadki negatywne: ${metrics.negative} · unikalne defekty: ${metrics.uniqueDefects}.`, '');
tc.push(`Rekomendacja: **${metrics.recommendation}** – otwarty defekt krytyczny DEF-01 blokuje rezerwację (ryzyko R-01). Uzasadnienie: [06_TestSummaryReport.pdf](06_TestSummaryReport.pdf).`, '');
tc.push('Statusy: **PASS** – wynik zgodny z oczekiwanym; **FAIL** – potwierdzona niezgodność; **BLOCKED** – kroków nie da się wykonać z powodu przeszkody (jawny powód); **NOT RUN** – niewykonany.', '');
tc.push('## Lista przypadków', '');
tc.push('| ID | Nazwa | Typ | Charakter | Priorytet | Ryzyko | Technika | Status | Defekt |', '|---|---|---|---|---|---|---|---|---|');
for (const c of cases) tc.push(`| [${c.id}](#${anchor(c.id)}) | ${cell(c.name)} | ${c.type} | ${c.polarity} | ${c.priority} | ${cell(c.risk)} | ${cell(c.technique)} | **${c.status}** | ${c.defect ? `[${c.defect}](04_Defects.md#${anchor(c.defect)})` : '–'} |`);
tc.push('', '## Szczegóły przypadków', '');
for (const c of cases) {
  tc.push(`### ${c.id}`, '');
  tc.push(`**${esc(c.name)}** · ${c.type} · ${c.polarity} · priorytet ${c.priority} · ryzyko ${c.risk} · status **${c.status}**${c.defect ? ` · defekt [${c.defect}](04_Defects.md#${anchor(c.defect)})` : ''}`, '');
  tc.push(`- **Cel:** ${esc(c.objective)}`);
  tc.push(`- **Obszar:** ${esc(c.area)}`);
  tc.push(`- **Technika:** ${esc(c.technique)}`);
  tc.push(`- **Warunki wstępne:** ${esc(c.preconditions)}`);
  tc.push(`- **Dane testowe:** ${esc(c.data)}`);
  tc.push('- **Kroki:**');
  (c.steps || []).forEach((s, i) => tc.push(`  ${i + 1}. ${esc(s)}`));
  tc.push(`- **Oczekiwany rezultat:** ${esc(c.expected)}`);
  tc.push('- **Rzeczywisty rezultat:**', '', '  ```', ...c.actual.split('\n').map((l) => `  ${l}`), '  ```', '');
  tc.push(`- **Evidence:** ${c.evidence.map(link).join(', ')}`);
  tc.push(`- **Wykonano:** ${when(c.executedAt)} (${c.durationMs} ms)`, '');
}
fs.writeFileSync(path.join(root, '02_TestCases.md'), tc.join('\n'));

// ---------- 04_Defects.md ----------
const sevName = { S1: 'S1 Critical', S2: 'S2 High', S3: 'S3 Medium', S4: 'S4 Low' };
const df = [];
df.push('# Raporty defektów', '');
df.push(`Zespół: ${members}. Unikalne defekty: **${defects.length}** (S1: ${metrics.defectsBySeverity.S1}, S2: ${metrics.defectsBySeverity.S2}, S3: ${metrics.defectsBySeverity.S3}, S4: ${metrics.defectsBySeverity.S4}). Kilka przypadków z tym samym objawem raportujemy jako jeden defekt.`, '');
df.push('| ID | Tytuł | Severity | Priority | Stan | Powiązane |', '|---|---|---|---|---|---|');
for (const d of defects) df.push(`| [${d.id}](#${anchor(d.id)}) | ${cell(d.title)} | ${sevName[d.severity] || d.severity} | ${d.priority} | ${cell(d.state)} | ${cell(d.cases.join(', '))} |`);
df.push('', '## Skala severity i priority', '');
df.push('| Severity | Znaczenie | Priority | Znaczenie |', '|---|---|---|---|');
df.push('| S1 Critical | blokada kluczowego procesu / utrata danych | P1 | naprawić natychmiast |');
df.push('| S2 High | istotna funkcja nie działa, brak sensownego obejścia | P2 | wysoki priorytet |');
df.push('| S3 Medium | problem ograniczony; obejście istnieje | P3 | normalny backlog |');
df.push('| S4 Low | drobna wada, UX / kosmetyka | P4 | niski priorytet |', '');
df.push('## Szczegóły defektów', '');
for (const d of defects) {
  df.push(`### ${d.id}`, '');
  df.push(`**${esc(d.title)}** · ${sevName[d.severity] || d.severity} · ${d.priority} · ${d.state}`, '');
  df.push(`- **Środowisko:** ${esc(d.environment)}`);
  df.push(`- **URL:** ${d.url}`);
  df.push(`- **Data (UTC):** ${d.date.replace('T', ' ').replace(/\.\d+Z$/, '')}`);
  df.push(`- **Warunki wstępne:** ${esc(d.preconditions)}`);
  df.push('- **Kroki reprodukcji:**');
  d.steps.forEach((s, i) => df.push(`  ${i + 1}. ${esc(s)}`));
  df.push(`- **Oczekiwany rezultat:** ${esc(d.expected)}`);
  df.push(`- **Rzeczywisty rezultat:** ${esc(d.actual)}`);
  df.push(`- **Wpływ i uzasadnienie severity:** ${esc(d.impact)}`);
  df.push(`- **Powiązane przypadki / sesja:** ${d.cases.map((c) => (c.startsWith('EXP') ? `[${c}](03_Exploratory.md)` : `[${c}](02_TestCases.md#${anchor(c)})`)).join(', ')}`);
  df.push(`- **Evidence:** ${d.evidence.map(link).join(', ')}`);
  df.push(`- **Deduplikacja:** ${esc(d.deduplication)}`, '');
}
fs.writeFileSync(path.join(root, '04_Defects.md'), df.join('\n'));
console.log('Zapisano 02_TestCases.md i 04_Defects.md');
