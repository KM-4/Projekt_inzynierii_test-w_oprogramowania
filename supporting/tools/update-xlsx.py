"""Aktualizacja 02_TestCases.xlsx i 04_Defects.xlsx z danych JSON (bez zewnętrznych usług; openpyxl).

Zachowuje istniejący układ, style, tabele i formuły; podmienia wyłącznie treść komórek z danymi.
Uruchom z katalogu głównego repozytorium:  python supporting/tools/update-xlsx.py
Wymaga: openpyxl.
"""
import json
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path

from openpyxl import load_workbook

ROOT = Path(os.getenv('QA_PROJECT_DIR', '.'))
load = lambda p: json.loads((ROOT / p).read_text(encoding='utf-8'))
cases = {c['id']: c for c in load('supporting/test-cases.json')}
defects = {d['id']: d for d in load('supporting/defects.json')}
metrics = load('supporting/metrics.json')
team = load('supporting/team.json')
team_no = (' ' + team['teamNumber']) if team.get('teamNumber') else ''
names = ', '.join(f"{m['name']} ({m['studentNumber']})" for m in team.get('members') or []) or '[UZUPEŁNIĆ: skład zespołu]'
header = f'Zespół{team_no}: {names}'
CET = timezone(timedelta(hours=1))


def local(iso):
    return datetime.fromisoformat(iso.replace('Z', '+00:00')).astimezone(CET).replace(tzinfo=None)


# 02_TestCases.xlsx: kolumny A..R jak w nagłówku wiersza 5.
wb = load_workbook(ROOT / '02_TestCases.xlsx')
for sheet in ('UI', 'API'):
    ws = wb[sheet]
    ws['A3'] = header
    for row in range(6, ws.max_row + 1):
        cid = ws[f'A{row}'].value
        if cid not in cases:
            continue
        c = cases[cid]
        ws[f'B{row}'] = c['name']
        ws[f'K{row}'] = '\n'.join(f'{i}. {s}' for i, s in enumerate(c['steps'], 1))
        ws[f'L{row}'] = c['expected']
        ws[f'M{row}'] = c['actual']
        ws[f'N{row}'] = c['status']
        others = [e for e in c['evidence'] if not e.endswith(f'{cid}.json')]
        ws[f'P{row}'] = '\n'.join(others) if others else None
        ws[f'Q{row}'] = c.get('defect') or None
        ws[f'R{row}'] = local(c['executedAt'])
ws = wb['Podsumowanie']
ws['A3'] = header
ws['D14'] = 'NO-GO: otwarty defekt S1 (DEF-01) blokuje rezerwację, ryzyko R-01 (P×I=9) zmaterializowane. Uzasadnienie: 06_TestSummaryReport.pdf'
ws['C20'] = metrics['uniqueDefects']
ws['D20'] = 'S1:{S1}, S2:{S2}, S3:{S3}, S4:{S4}'.format(**metrics['defectsBySeverity'])
ws['A23'] = f"Źródło wyników: 05_Automation/reports/case-results.json; pełny przebieg {local(metrics['startedAt']):%d.%m.%Y %H:%M}-{local(metrics['finishedAt']):%H:%M} CET. ID łączą przypadki z evidence i defektami."
ws['A24'] = 'UI-02/UI-06: sprzątanie własnej wiadomości jest kontrolą informacyjną (decyzja projektowa 14.11.2026); DELETE 500 zapisany w evidence. BLOCKED UI-08..10: DEF-01.'
ws['A25'] = 'Snapshot wyników; zmiana statusów przelicza liczniki. Dokumenty odtwarzane skryptami z supporting/tools (collect-results, build-pdf, update-xlsx).'
ws['A26'] = 'Eksploracja (sesja EXP-02) jest osobnym artefaktem i nie zmienia liczników 22 TC.'
from openpyxl.workbook.properties import CalcProperties
wb.calculation = CalcProperties(fullCalcOnLoad=True)  # Excel przelicza formuły podsumowania przy otwarciu
wb.save(ROOT / '02_TestCases.xlsx')

# 04_Defects.xlsx: kolumny A..P jak w nagłówku wiersza 5.
wb = load_workbook(ROOT / '04_Defects.xlsx')
ws = wb['Defekty']
ws['A3'] = header
for row in range(6, ws.max_row + 1):
    did = ws[f'A{row}'].value
    if did not in defects:
        continue
    d = defects[did]
    ws[f'B{row}'] = d['title']
    ws[f'F{row}'] = d['environment']
    ws[f'H{row}'] = datetime.fromisoformat(d['date'].replace('Z', '+00:00')).replace(tzinfo=None)
    ws[f'I{row}'] = d['preconditions']
    ws[f'J{row}'] = '\n'.join(f'{i}. {s}' for i, s in enumerate(d['steps'], 1))
    ws[f'K{row}'] = d['expected']
    ws[f'L{row}'] = d['actual']
    ws[f'M{row}'] = d['impact']
    ws[f'N{row}'] = ', '.join(d['cases'])
    ws[f'O{row}'] = '\n'.join(d['evidence'])
    ws[f'P{row}'] = d['deduplication']
wb['Skale']['A3'] = header
wb.save(ROOT / '04_Defects.xlsx')
print('Zaktualizowano 02_TestCases.xlsx i 04_Defects.xlsx')
