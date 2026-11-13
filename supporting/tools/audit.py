from pathlib import Path
import json,zipfile,hashlib,re,xml.etree.ElementTree as ET
from pypdf import PdfReader
from openpyxl import load_workbook
root=Path('QA-Project').resolve()
cases=json.loads((root/'supporting/executed-cases.json').read_text(encoding='utf-8'))
metrics=json.loads((root/'supporting/metrics.json').read_text(encoding='utf-8'))
defects=json.loads((root/'supporting/defects.json').read_text(encoding='utf-8'))
results=json.loads((root/'05_Automation/reports/case-results.json').read_text(encoding='utf-8'))
session=json.loads((root/'evidence/exploratory/session.json').read_text(encoding='utf-8'))
checks=[]
def check(name,condition,detail=''):
    checks.append({'check':name,'pass':bool(condition),'detail':detail})
required=['README.md','01_TestPlan.pdf','02_TestCases.xlsx','03_Exploratory.md','03_Exploratory.pdf','04_Defects.xlsx','05_Automation/package.json','05_Automation/package-lock.json','05_Automation/playwright.config.ts','05_Automation/README.md','05_Automation/reports/html/index.html','05_Automation/reports/results.json','05_Automation/reports/junit.xml','06_TestSummaryReport.pdf','supporting/requirements-checklist.md','supporting/risk-matrix.md','supporting/test-design-techniques.md','supporting/traceability-matrix.md','supporting/defense-notes.md']
check('Wymagane artefakty',all((root/p).is_file() for p in required),', '.join(p for p in required if not (root/p).is_file()))
check('22 unikalne TC',len(cases)==22 and len({c['id'] for c in cases})==22)
check('Spójna migawka JSON przypadków',json.loads((root/'supporting/test-cases.json').read_text(encoding='utf-8'))==cases)
check('Minimum UI/API/negatywnych',sum(c['type']=='UI' for c in cases)>=12 and sum(c['type']=='API' for c in cases)>=8 and sum(c['polarity']=='Negatywny' for c in cases)>=6)
check('Dozwolone statusy',all(c['status'] in ['PASS','FAIL','BLOCKED','NOT RUN'] for c in cases))
check('Spójność metryk',all(metrics[k]==sum(c['status']==k for c in cases) for k in ['PASS','FAIL','BLOCKED','NOT RUN']) and metrics['executed']==metrics['PASS']+metrics['FAIL'] and metrics['planned']==sum(metrics[k] for k in ['PASS','FAIL','BLOCKED','NOT RUN']))
check('Wyniki runnera i TC',len(results['results'])==len(cases) and all(next(x for x in results['results'] if x['id']==c['id'])['status']==c['status'] for c in cases))
check('Wykonana wydzielona sesja 30-45 min',session.get('id')=='EXP-02' and bool(session.get('finishedAt')) and 30<=session.get('durationMinutes',0)<=45 and session.get('dedicated') and not session.get('interruptions'),'30 min 37 s, tylko eksploracja/analiza/notatki, bez generowania innych artefaktów.')
check('Spójny dziennik i limit żądań',len(session['events'])==114 and session['explicitApiRequests']==51 and session['explicitApiRequests']<=80)
check('Nowe ustalenia mają osobne evidence',all((root/p).is_file() for p in ['evidence/exploratory/DEF-03-auth.json','evidence/exploratory/DEF-04-dates.json','evidence/exploratory/EXP-02-main-trace.zip','evidence/exploratory/EXP-02-timezone-trace.zip']))
check('Wymagane pola TC',all(all(c.get(k) not in [None,'',[]] for k in ['id','name','area','priority','risk','type','polarity','technique','preconditions','data','steps','expected','actual','status','evidence']) for c in cases))
evidence=[p for c in cases for p in c['evidence']]
check('Wszystkie odsyłacze evidence istnieją',all((root/p).is_file() for p in evidence),str(len(set(evidence)))+' unikalnych odsyłaczy')
check('Każdy FAIL ma defekt',all(c['defect'] in {d['id'] for d in defects} for c in cases if c['status']=='FAIL'))
check('Każdy BLOCKED ma dowód i powód',all(c['defect'] and 'Zablokowany' in c['actual'] for c in cases if c['status']=='BLOCKED'))
operations=set(); api_calls=0
for c in cases:
    if c['type']!='API':continue
    e=json.loads((root/c['evidence'][0]).read_text(encoding='utf-8'))
    for call in e['requests']:
        operations.add((call['request']['method'],re.sub(r'/\d+', '/<id>',call['request']['url'].split('?')[0])))
        api_calls+=1
    check('Evidence API '+c['id'],bool(e.get('requests')) and bool(e.get('assertions')) and bool(e.get('executedAt')))
check('>=3 różne operacje API',len(operations)>=3,str(len(operations)))
check('Jawne asercje >=3 automatycznych TC',sum(bool(json.loads((root/c['evidence'][0]).read_text(encoding='utf-8')).get('assertions')) for c in cases)>=3)
check('Brak sztucznych sleep/retry',not any('waitForTimeout' in p.read_text(encoding='utf-8') for p in (root/'05_Automation/tests').glob('*.ts')) and 'retries: 0' in (root/'05_Automation/playwright.config.ts').read_text())
for c in cases:
    if c['type']=='UI' and c['status']=='FAIL':check('Screenshot/trace '+c['id'],any(p.endswith('.png') for p in c['evidence']) and any(p.endswith('trace.zip') for p in c['evidence']))
check('Unikalne defekty i rozkład severity',len({d['id'] for d in defects})==len(defects)==metrics['uniqueDefects'] and all(metrics['defectsBySeverity'][s]==sum(d['severity']==s for d in defects) for s in ['S1','S2','S3','S4']))
check('Odsyłacze wszystkich defektów',all((root/p).is_file() for d in defects for p in d['evidence']))
for name,expected in [('01_TestPlan.pdf',2),('06_TestSummaryReport.pdf',3)]:
    r=PdfReader(root/name);check('Liczba stron '+name,len(r.pages)==expected,str(len(r.pages)))
    check('Polskie znaki i tekst '+name,all(len(p.extract_text())>500 for p in r.pages) and 'rezerwacj' in ''.join(p.extract_text() for p in r.pages))
for name in ['01_TestPlan.pdf','03_Exploratory.pdf','06_TestSummaryReport.pdf']:
    r=PdfReader(root/name);text=''.join(p.extract_text() for p in r.pages)
    check('Dane studenta '+name,'Kamil Andrzejewski' in text and '83741' in text and 'Kamil Andrzejewski' in (r.metadata.author or ''))
book=load_workbook(root/'02_TestCases.xlsx',data_only=False)
cached=load_workbook(root/'02_TestCases.xlsx',data_only=True)
check('Arkusze XLSX',book.sheetnames==['Podsumowanie','UI','API'])
for kind,number in [('UI',12),('API',10)]:
    sheet=book[kind];check('Liczba/filtry/freeze '+kind,sheet.max_row==number+5 and len(sheet.tables)==1 and bool(sheet.freeze_panes))
    check('Statusy i ID w XLSX '+kind,all(sheet.cell(i+6,1).value==c['id'] and sheet.cell(i+6,14).value==c['status'] for i,c in enumerate([c for c in cases if c['type']==kind])))
    check('Hiperlinki XLSX '+kind,all(str(sheet.cell(i+6,15).value).startswith('=HYPERLINK(') for i in range(number)))
check('Formuły i cache metryk XLSX',book['Podsumowanie']['D5'].data_type=='f' and cached['Podsumowanie']['D5'].value==metrics['PASS'] and cached['Podsumowanie']['D10'].value==metrics['planned'])
check('Brak błędów formuł XLSX',not any(cell.data_type=='e' for sh in cached for row in sh for cell in row))
db=load_workbook(root/'04_Defects.xlsx',data_only=True);check('Defekty i skale XLSX',db.sheetnames==['Defekty','Skale'] and db['Defekty'].max_row==len(defects)+5)
check('Dane studenta w każdym arkuszu',all('Kamil Andrzejewski' in str(sh['A3'].value) and '83741' in str(sh['A3'].value) for w in [book,db] for sh in w))
secrets=[]
def walk(value,where):
    if isinstance(value,dict):
        for k,v in value.items():
            if re.search('password|token|cookie|authorization',k,re.I) and v not in ['[MASKED]',None,False] and not isinstance(v,(dict,list)):
                secrets.append(where+':'+k)
            else:walk(v,where)
    elif isinstance(value,list):
        for v in value:walk(v,where)
for folder in ['evidence/api','evidence/ui','evidence/exploratory']:
    for p in (root/folder).glob('*.json'):walk(json.loads(p.read_text(encoding='utf-8')),p.name)
check('Maskowanie haseł/tokenów w evidence JSON',not secrets,', '.join(secrets))
report={'checks':checks,'passed':sum(x['pass'] for x in checks),'failed':sum(not x['pass'] for x in checks),'planned':metrics['planned'],'apiRequestsInLastRun':api_calls,'operationsInLastRun':len(operations),'exploratorySession':{'id':session['id'],'minutes':session['durationMinutes'],'dedicated':True,'events':len(session['events'])},'limitations':['Nie przeprowadzono retestu po naprawie SUT; 3 BLOCKED i nieosiągnięte PUT pozostają jawne.','Podano Kamil Andrzejewski, nr 83741; numer zespołu, pozostałe osoby i faktyczny wkład pozostają do uzupełnienia.','Dodatkowe POST rezerwacji w EXP-02 odrzucono przez automatyczną kontrolę przed wykonaniem; sesję kontynuowano bez obchodzenia blokady.','Ocena wizualna wykonana na renderach; brak weryfikacji edycji w natywnym Excel.']}
(root/'supporting/audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'passed':report['passed'],'failed':report['failed'],'failures':[x for x in checks if not x['pass']]},ensure_ascii=False,indent=2))
if report['failed']:raise SystemExit(1)
