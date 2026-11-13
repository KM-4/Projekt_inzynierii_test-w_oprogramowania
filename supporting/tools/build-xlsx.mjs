import fs from 'node:fs/promises';
import {Workbook, SpreadsheetFile} from '@oai/artifact-tool';
const root=process.env.QA_PROJECT_DIR||'QA-Project';
const cases=JSON.parse(await fs.readFile(`${root}/supporting/executed-cases.json`,'utf8'));
const metrics=JSON.parse(await fs.readFile(`${root}/supporting/metrics.json`,'utf8'));
const defects=JSON.parse(await fs.readFile(`${root}/supporting/defects.json`,'utf8'));
const risks=JSON.parse(await fs.readFile(`${root}/supporting/risks.json`,'utf8'));
await fs.mkdir('previews',{recursive:true});
const col=n=>{let s='';for(n++;n;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s};
function table(wb,name,title,headers,rows,widths,heights){
  const s=wb.worksheets.add(name);s.showGridLines=false;s.getRange('A2').values=[[title]];
  s.getRange('A2').format.font={name:'Arial',size:14,bold:true,color:'#17243B'};
  s.getRange('A3').values=[['Kamil Andrzejewski, nr studenta 83741']];s.getRange('A3').format.font={name:'Arial',size:10,color:'#536174'};
  const last=col(headers.length-1),end=rows.length+5;
  s.getRange(`A5:${last}${end}`).values=[headers,...rows];
  const used=s.getRange(`A5:${last}${end}`);used.format.font={name:'Arial',size:10,color:'#17243B'};used.format.wrapText=true;used.format.verticalAlignment='top';
  s.getRange(`A5:${last}5`).format={fill:'#24354D',font:{name:'Arial',size:10,bold:true,color:'#FFFFFF'},wrapText:true,verticalAlignment:'center',horizontalAlignment:'center',rowHeight:34};
  for(let i=0;i<headers.length;i++)s.getRange(`${col(i)}5:${col(i)}${end}`).format.columnWidth=widths[i]||25;
  for(let r=6;r<=end;r++){s.getRange(`A${r}:${last}${r}`).format.rowHeight=heights||Math.min(340,Math.max(50,...rows[r-6].map((x,i)=>String(x??'').split('\n').reduce((n,line)=>n+Math.max(1,Math.ceil(line.length/((widths[i]||25)*.95))),0)*14+16)));if(r%2===0)s.getRange(`A${r}:${last}${r}`).format.fill='#F0F3F8'}
  const t=s.tables.add(`A5:${last}${end}`,true,`${name.replace(/[^a-z]/gi,'')}Data`);t.showFilterButton=true;
  s.freezePanes.freezeRows(5);s.freezePanes.freezeColumns(1);return s;
}
async function finalize(wb,name,renders){
  wb.recalculate();
  console.log((await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!',options:{useRegex:true,maxResults:30},summary:'Kontrola błędów formuł'})).ndjson);
  for(const [sheetName,range,suffix] of renders){const blob=await wb.render({sheetName,range,scale:1.3,format:'png'});await fs.writeFile(`previews/${name}-${suffix}.png`,new Uint8Array(await blob.arrayBuffer()))}
  const output=await SpreadsheetFile.exportXlsx(wb);await output.save(`${root}/${name}.xlsx`);
}
const wb=Workbook.create();const summary=wb.worksheets.add('Podsumowanie');summary.showGridLines=false;
const sheets={};
const headers=['ID','Nazwa i cel','Obszar','Priorytet','Ryzyko','Typ','Charakter','Technika','Warunki wstępne','Dane testowe','Kroki','Oczekiwany rezultat','Actual result','Status','Dowód JSON','Pozostałe evidence','Defekt','Wykonano (Warszawa)'];
for(const type of ['UI','API']){
  const selected=cases.filter(c=>c.type===type);
  const rows=selected.map(c=>[c.id,c.name,c.area,c.priority,c.risk,c.type,c.polarity,c.technique,c.preconditions,c.data,c.steps.map((s,i)=>`${i+1}. ${s}`).join('\n'),c.expected,c.actual,c.status,c.evidence[0],c.evidence.slice(1).join('\n'),c.defect,new Date(c.executedAt)]);
  const s=table(wb,type,`Przypadki ${type} - wynik ostatniego pełnego przebiegu`,headers,rows,[12,36,24,12,18,10,16,30,48,58,72,66,72,14,23,48,14,25]);
  s.getRange(`R6:R${rows.length+5}`).setNumberFormat('yyyy-mm-dd hh:mm:ss');
  // Excel serial przechowuje czas cywilny Warszawy, aby podpis kolumny był prawdziwy.
  for(let i=0;i<selected.length;i++){
    const c=selected[i],r=i+6;const date=new Date(c.executedAt);const offset=60; // 13 listopada: CET UTC+1.
    s.getRange(`R${r}`).values=[[new Date(date.getTime()+offset*60000)]];
    s.getRange(`O${r}`).formulas=[[`=HYPERLINK("${c.evidence[0]}","${c.id} JSON")`]];
  }
  const statuses=s.getRange(`N6:N${rows.length+5}`);statuses.dataValidation={rule:{type:'list',values:['PASS','FAIL','BLOCKED','NOT RUN']}};
  for(const [status,fill,color] of [['FAIL','#FBE4E4','#922C2C'],['BLOCKED','#FFF1CF','#7A5500'],['NOT RUN','#EBEDF2','#536174']])statuses.conditionalFormats.add('containsText',{text:status,format:{fill,font:{color,bold:true}}});
  sheets[type]=s;
}
summary.getRange('A2').values=[['Wyniki testów Restful-Booker-Platform']];summary.getRange('A2').format.font={name:'Arial',size:14,bold:true,color:'#17243B'};
summary.getRange('A3').values=[['Kamil Andrzejewski, nr studenta 83741']];summary.getRange('A3').format.font={name:'Arial',size:10,color:'#536174'};
summary.getRange('A4:D4').values=[['Status','UI','API','Razem']];
for(const [i,status] of ['PASS','FAIL','BLOCKED','NOT RUN'].entries()){
  const row=i+5;summary.getRange(`A${row}`).values=[[status]];
  summary.getRange(`B${row}:D${row}`).formulas=[[`=COUNTIFS(UI!$N$6:$N$17,A${row})`,`=COUNTIFS(API!$N$6:$N$15,A${row})`,`=SUM(B${row}:C${row})`]];
}
summary.getRange('A10:A14').values=[['Planowane'],['Wykonane (PASS+FAIL)'],['Udział PASS w wykonanych'],['Pokrycie wykonaniem'],['Rekomendacja']];
summary.getRange('D10:D14').formulas=[['=SUM(D5:D8)'],['=SUM(D5:D6)'],['=D5/D11'],['=D11/D10'],['=IF(OR(D6>0,D7>0,D8>0),"NO-GO","DO OCENY RYZYKA")']];
summary.getRange('D12:D13').setNumberFormat('0.0%');
summary.getRange('A17:D20').values=[['Metryki','Źródło','Wartość','Uwagi'],['Planowane przypadki','Zlecenie i projekt',metrics.planned,'12 UI + 10 API'],['Przypadki negatywne','Projekt danych',metrics.negative,'Eksploracja poza licznikiem'],['Unikalne defekty','TC i osobna EXP-02',metrics.uniqueDefects,Object.entries(metrics.defectsBySeverity).map(([key,value])=>`${key}:${value}`).join(', ')]];
summary.getRange('A23').values=[['Źródło wyników: 05_Automation/reports/case-results.json; ID łączą przypadki z evidence.']];
summary.getRange('A24').values=[['FAIL UI-02/UI-06: formularz przyjął dane, ale cleanup zwrócił 500. BLOCKED = skip z powodem.']];
summary.getRange('A25').values=[['Snapshot wyników; zmiana statusów przelicza liczniki. PDF trzeba wygenerować ponownie.']];
summary.getRange('A26').values=[['EXP-02 wykonano osobno: 30 min 36 s; nowe DEF-03/DEF-04 nie zmieniają statusów 22 TC.']];
summary.getRange('A23:D26').format.font={name:'Arial',size:10,color:'#536174'};
summary.getRange('A4:D20').format.font={name:'Arial',size:10,color:'#17243B'};
for(const range of ['A4:D4','A17:D17'])summary.getRange(range).format={fill:'#24354D',font:{name:'Arial',size:10,bold:true,color:'#FFFFFF'},rowHeight:26};
summary.getRange('A4:A25').format.columnWidth=38;summary.getRange('B4:B25').format.columnWidth=24;summary.getRange('C4:C25').format.columnWidth=18;summary.getRange('D4:D25').format.columnWidth=36;summary.getRange('A5:D25').format.rowHeight=24;
// Próba reaktywności: kontrolowana zmiana PASS -> NOT RUN, weryfikacja i odtworzenie.
const original=sheets.UI.getRange('N6').values;
const passBefore=summary.getRange('D5').values[0][0];
sheets.UI.getRange('N6').values=[['NOT RUN']];wb.recalculate();
if(summary.getRange('D5').values[0][0]!==passBefore-1)throw new Error('Formuła podsumowania nie reaguje na zmianę statusu');
sheets.UI.getRange('N6').values=original;wb.recalculate();
if(summary.getRange('D10').values[0][0]!==metrics.planned||summary.getRange('D5').values[0][0]!==metrics.PASS)throw new Error('Niezgodność liczników XLSX z JSON');
console.log((await wb.inspect({kind:'table',range:'Podsumowanie!A4:D14',include:'values,formulas',tableMaxRows:11,tableMaxCols:4})).ndjson);
await finalize(wb,'02_TestCases',[['Podsumowanie','A1:D26','summary'],['UI','A2:H8','ui'],['API','A2:H8','api'],['UI','I5:N7','ui-details'],['API','I5:N7','api-details']]);
const dw=Workbook.create();const ds=table(dw,'Defekty','Potwierdzone defekty - unikalne symptomy',['ID','Tytuł','Severity','Priority','Stan','Środowisko','URL','Data (UTC)','Warunki wstępne','Kroki reprodukcji','Expected result','Actual result','Wpływ / uzasadnienie','Test cases / sesja','Evidence','Deduplikacja'],defects.map(d=>[d.id,d.title,d.severity,d.priority,d.state,d.environment,d.url,new Date(d.date),d.preconditions,d.steps.map((s,i)=>`${i+1}. ${s}`).join('\n'),d.expected,d.actual,d.impact,d.cases.join(', '),[...new Set(d.evidence)].join('\n'),d.deduplication]),[12,54,12,12,48,48,40,23,60,76,68,68,64,32,76,72]);ds.getRange(`H6:H${defects.length+5}`).setNumberFormat('yyyy-mm-dd hh:mm:ss');
const scales=table(dw,'Skale','Skale severity i priority z prezentacji, strona 12',['Skala','Poziom','Znaczenie'],[['Severity','S1 Critical','Blokada kluczowego procesu / utrata danych'],['Severity','S2 High','Istotna funkcja nie działa, brak sensownego obejścia'],['Severity','S3 Medium','Problem ograniczony; obejście istnieje'],['Severity','S4 Low','Drobna wada UX / kosmetyka'],['Priority','P1','Naprawić natychmiast'],['Priority','P2','Wysoki priorytet'],['Priority','P3','Normalny backlog'],['Priority','P4','Niski priorytet']],[18,18,72],38);
await finalize(dw,'04_Defects',[['Defekty',`A2:E${defects.length+5}`,'defects'],['Defekty','I5:L6','repro'],['Defekty','I8:L9','new-repro'],['Skale','A2:C13','scales']]);
console.log('Utworzono oba skoroszyty.');
