import fs from 'node:fs';
import path from 'node:path';

// Mapowanie statusów runnera na statusy projektu: passed -> PASS, skipped -> BLOCKED (zawsze z jawnym powodem), reszta -> FAIL.
const stripAnsi = (s: string) => s.replace(/\u001b\[[0-9;]*m/g, '');
const firstLine = (s: string) => stripAnsi(s).split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 1).join('');
// Pełna treść asercji: etykieta + oczekiwane/otrzymane, bez stosu wywołań.
const summarize = (s: string) => {
  const lines = stripAnsi(s).split('\n').map((x) => x.trim());
  const label = lines.find(Boolean) || '';
  const exp = lines.find((x) => x.startsWith('Expected:'));
  const rec = lines.find((x) => x.startsWith('Received:'));
  return [label, exp, rec].filter(Boolean).join(' ');
};

export default class ResultReporter {
  rows: any[] = [];
  onTestEnd(test: any, result: any) {
    const annotations = [...test.annotations, ...(result.annotations || [])];
    const blocking = annotations.find((a: any) => a.type === 'blocked') || annotations.find((a: any) => a.type === 'skip');
    const cleanup = [...new Set(annotations.filter((a: any) => a.type === 'cleanup').map((a: any) => a.description as string))];
    // Wszystkie niezgodności w kolejności zarejestrowania (miękkie i twarda), a nie tylko pierwsza.
    const errors = (result.errors || []).map((e: any) => summarize(e.message || firstLine(String(e.value || ''))));
    const status = result.status === 'passed' ? 'PASS' : result.status === 'skipped' ? 'BLOCKED' : 'FAIL';
    const reason = status === 'BLOCKED' ? blocking?.description || null : errors.length ? errors.join(' | ') : null;
    this.rows.push({
      id: test.title.match(/(?:UI|API)-\d+/)?.[0],
      title: test.title,
      status,
      runnerStatus: result.status,
      startedAt: result.startTime.toISOString(),
      durationMs: result.duration,
      reason,
      notes: cleanup.length ? cleanup : undefined,
      attachments: result.attachments.map((a: any) => ({ name: a.name, path: a.path ? path.relative(path.resolve('..'), a.path).replaceAll('\\', '/') : null })),
      retry: result.retry,
    });
  }
  onEnd(result: any) {
    fs.mkdirSync('reports', { recursive: true });
    fs.writeFileSync('reports/case-results.json', JSON.stringify({ finishedAt: new Date().toISOString(), runnerStatus: result.status, results: this.rows }, null, 2));
  }
}
