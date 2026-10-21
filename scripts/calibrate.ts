import { writeFileSync } from 'node:fs';
import { COUNTS, NUMBERS, RESOURCES, type Resource } from '../src/model.ts';
import { rawScores, randomSource, shuffle } from '../src/scoring.ts';

const samples=100_000,seed=20261020,random=randomSource(seed);
const histograms=[new Map<number,number>(),new Map<number,number>(),new Map<number,number>()];
for(let i=0;i<samples;i++) {
  const resources=shuffle(RESOURCES.flatMap((r,k)=>Array<Resource>(COUNTS[k]).fill(r)),random);
  const tokens=shuffle([...NUMBERS],random);let j=0;
  const numbers=resources.map(r=>r==='Desert'?0:tokens[j++]);
  rawScores({resources,numbers}).forEach((value,k)=>histograms[k].set(value,(histograms[k].get(value)??0)+1));
}
const result={version:'balance-v1',samples,seed,algorithm:'Mulberry32 uint32; descending Fisher–Yates; resource shuffle then token shuffle per board; midrank empirical CDF',histograms:histograms.map(m=>[...m].sort(([a],[b])=>a-b))};
writeFileSync(new URL('../src/calibration.json',import.meta.url),JSON.stringify(result)+'\n');
console.log(JSON.stringify({samples,seed,bins:result.histograms.map(h=>h.length)}));
