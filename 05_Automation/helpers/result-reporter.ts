import fs from 'node:fs';
import path from 'node:path';
export default class ResultReporter {
  rows:any[]=[];
  onTestEnd(test:any,result:any){
    const annotations=[...test.annotations,...(result.annotations||[])];
    const annotation=annotations.find((a:any)=>a.type==='blocked')||annotations.find((a:any)=>a.type==='skip');
    this.rows.push({id:test.title.match(/(?:UI|API)-\d+/)?.[0],title:test.title,status:result.status==='passed'?'PASS':result.status==='skipped'?'BLOCKED':'FAIL',runnerStatus:result.status,startedAt:result.startTime.toISOString(),durationMs:result.duration,reason:annotation?.description||result.error?.message||null,attachments:result.attachments.map((a:any)=>({name:a.name,path:a.path?path.relative(path.resolve('..'),a.path).replaceAll('\\','/'):null})),retry:result.retry});
  }
  onEnd(result:any){fs.mkdirSync('reports',{recursive:true});fs.writeFileSync('reports/case-results.json',JSON.stringify({finishedAt:new Date().toISOString(),runnerStatus:result.status,results:this.rows},null,2))}
}
