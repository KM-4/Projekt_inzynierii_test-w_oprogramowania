from pathlib import Path
import zipfile,json,re
root=Path('QA-Project')
paths=list((root/'05_Automation/reports/artifacts').rglob('trace.zip'))+list((root/'evidence/exploratory').glob('EXP-02-*-trace.zip'))
hits=[];logins=[];invalid=[]
for p in paths:
    with zipfile.ZipFile(p) as z:
        assert z.testzip() is None
        for name in z.namelist():
            if not name.endswith(('.trace','.network','.json')):continue
            raw=z.read(name).decode('utf-8',errors='replace')
            if re.search(r'"password"\s*:\s*"password"|token=[A-Za-z0-9]{12,}|syntetyczne-bledne',raw):hits.append({'file':str(p),'entry':name})
            if name.endswith(('.trace','.network')):
                for line in raw.splitlines():
                    if not line.strip():continue
                    try:entry=json.loads(line)
                    except json.JSONDecodeError:invalid.append({'file':str(p),'entry':name});continue
                    req=entry.get('snapshot',{}).get('request',{})
                    if '/api/auth/login' not in req.get('url',''):continue
                    pd=req.get('postData',{});body=pd.get('text','')
                    if pd.get('_sha1'):body=z.read('resources/'+pd['_sha1']).decode('utf-8')
                    payload=json.loads(body)
                    state='MASKED' if payload.get('password')=='[MASKED]' else 'EMPTY' if not payload.get('password') else 'UNMASKED'
                    if state=='UNMASKED':hits.append({'file':str(p),'entry':name,'reason':'Hasło w body logowania'})
                    logins.append({'file':str(p),'passwordState':state,'syntheticUsername':payload.get('username','').startswith('QAEXP02') or not payload.get('username')})
report={'traces':len(paths),'sensitivePatternHits':hits,'invalidTraceJson':invalid,'uiLoginPayloads':logins,'scope':'CRC i JSON trace/network; wzorce hasła szkoleniowego i cookie token=<wartość>; wszystkie body logowania UI puste lub zredagowane. Prawdziwe logowanie EXP-02 odbywało się poza trace UI.'}
(root/'evidence/automation/trace-redaction-check.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False,indent=2))
assert not hits and not invalid
