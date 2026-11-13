from pathlib import Path
import json,hashlib,zipfile,os
from datetime import datetime,timezone
root=Path('QA-Project').resolve()
output=root.parent/'Z##_Andrzejewski_Nazwisko2_Nazwisko3.zip'
def files():
    result=[]
    for folder,dirs,names in os.walk(root):
        dirs[:]=[d for d in dirs if d not in ['node_modules','.git','__pycache__']]
        for name in names:
            if name.endswith('.inspect.ndjson') or name in ['.env','.env.local'] or name=='file-manifest.json':continue
            p=Path(folder)/name;result.append(p)
    return sorted(result)
manifest={'generatedAt':datetime.now(timezone.utc).isoformat(),'algorithm':'sha256','files':[{'path':p.relative_to(root).as_posix(),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in files()]}
(root/'supporting/file-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED,compresslevel=7) as z:
    for p in files():z.write(p,Path('QA-Project')/p.relative_to(root))
    z.write(root/'supporting/file-manifest.json','QA-Project/supporting/file-manifest.json')
with zipfile.ZipFile(output) as z:
    assert z.testzip() is None,'Błąd CRC archiwum'
    for entry in manifest['files']:
        b=z.read('QA-Project/'+entry['path'])
        assert hashlib.sha256(b).hexdigest()==entry['sha256'],entry['path']
    assert not any('/node_modules/' in n or '/.git/' in n for n in z.namelist())
print(json.dumps({'zip':str(output),'files':len(manifest['files'])+1,'bytes':output.stat().st_size,'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'crc':'OK','manifest':'OK'},ensure_ascii=False,indent=2))
