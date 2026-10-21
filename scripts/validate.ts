import { writeFileSync } from 'node:fs';
import calibration from '../src/calibration.json' with { type: 'json' };
import { generate } from '../src/generator.ts';
import { errorsFor, type Level } from '../src/model.ts';
import { normalizer, type Calibration } from '../src/scoring.ts';

const score=normalizer(calibration as Calibration);
const results=[];
for(const level of [1,2,3,4,5] as Level[]){
  const scores:number[]=[],latency:number[]=[];const distinct=new Set<string>();let failures=0,violations=0;
  for(let i=0;i<1000;i++){
    const request={level,overrides:{}};
    const result=generate(request,calibration as Calibration,{seed:level*100_000+i});
    if(!result.board){failures++;continue;}
    if(errorsFor(result.board.layout,request).length)violations++;
    scores.push(score(result.board.layout).total);latency.push(result.elapsed);distinct.add(JSON.stringify(result.board.layout));
  }
  scores.sort((a,b)=>a-b);latency.sort((a,b)=>a-b);
  const row={level,boards:1000,failures,violations,distinct:distinct.size,medianPenalty:scores[500],p90Penalty:scores[900],medianMs:latency[500],p95Ms:latency[950]};
  results.push(row);console.log(JSON.stringify(row));
}
writeFileSync(new URL('../generation-validation.json',import.meta.url),JSON.stringify({scope:'Node on this development Mac; not a mobile/browser benchmark',samplesPerLevel:1000,results},null,2)+'\n');
if(results.some(r=>r.failures||r.violations))process.exitCode=1;
