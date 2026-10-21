import { AXIS_WEIGHTS, COUNTS, RESOURCES, dots, totals, type Layout } from './model.ts';
export type Histogram = [number, number][];
export type Calibration = { version:string; samples:number; seed:number; algorithm:string; histograms:[Histogram,Histogram,Histogram] };
export function rawScores(layout: Layout): [number,number,number] {
  // Resource score is multiplied by 81 to use exact integer histogram keys.
  const production=totals(layout);
  const resource=production.reduce((sum,v,k)=>sum+(9*v-29*COUNTS[k])**2,0);
  let geography=0, access=0;
  for(const weights of AXIS_WEIGHTS) {
    let delta=0;const resourceDelta=[0,0,0,0,0];
    layout.resources.forEach((r,i)=>{delta+=weights[i]*dots(layout.numbers[i]);const k=RESOURCES.indexOf(r);if(k<5)resourceDelta[k]+=weights[i];});
    geography+=delta**2;access+=resourceDelta.reduce((s,n)=>s+n*n,0);
  }
  return [resource,geography,access];
}
export function normalizer(calibration: Calibration) {
  const tables=calibration.histograms.map(hist=>{
    let total=0;return hist.map(([value,count])=>{const lower=total;total+=count;return {value,count,lower};});
  });
  return (layout: Layout) => {
    const raw=rawScores(layout);
    const normalized=raw.map((value,k)=>{
      const hist=tables[k];let lo=0,hi=hist.length;
      while(lo<hi){const mid=(lo+hi)>>>1;if(hist[mid].value<value)lo=mid+1;else hi=mid;}
      const item=hist[lo];
      return !item ? 1 : (item.lower+(item.value===value?item.count*.5:0))/calibration.samples;
    });
    return {raw,normalized,total:normalized[0]*.5+normalized[1]*.25+normalized[2]*.25};
  };
}
export function randomSource(seed: number) {
  let state=seed>>>0;
  return ()=>{state=(state+0x6d2b79f5)>>>0;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
}
export function shuffle<T>(items: T[],random:()=>number): T[] {
  for(let i=items.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[items[i],items[j]]=[items[j],items[i]];}return items;
}
