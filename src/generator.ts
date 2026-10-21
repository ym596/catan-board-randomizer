import { CENTER, COUNTS, EDGES, NEIGHBORS, NUMBERS, RESOURCES, dots, effective, range, makeBoard, type Board, type Layout, type Resource, type Settings } from './model.ts';
import { normalizer, randomSource, shuffle, type Calibration } from './scoring.ts';

export type Generation = { board: Board | null; candidates: number; elapsed: number };
export function generate(settings: Settings,calibration: Calibration,options: {seed?:number;budget?:number;progress?:(n:number)=>void}={}): Generation {
  const start=performance.now(),deadline=start+Math.min(options.budget??3000,3000);
  const random=randomSource(options.seed??crypto.getRandomValues(new Uint32Array(1))[0]);
  const score=normalizer(calibration),rules=effective(settings),target=[1,8,32,64,128][settings.level-1],pool=[1,4,8,8,8][settings.level-1];
  const candidates:{layout:Layout;score:number;tie:number}[]=[];const seen=new Set<string>();
  const inventory=RESOURCES.flatMap((r,k)=>Array<Resource>(COUNTS[k]).fill(r));
  function terrain(): Resource[] | null {
    if(!rules.matchingResources) {
      const result=shuffle([...inventory],random);
      if(rules.centerDesert){const i=result.indexOf('Desert');[result[i],result[CENTER]]=[result[CENTER],result[i]];}
      return result;
    }
    const result=Array<number>(19).fill(-1),left=[...COUNTS];let visits=0;
    if(rules.centerDesert){result[CENTER]=5;left[5]=0;}
    const place=():boolean=>{
      visits++;if(visits>2500 || (visits%32===0&&performance.now()>=deadline))return false;
      let index=-1,best=-1;
      for(let i=0;i<19;i++)if(result[i]<0){const rank=NEIGHBORS[i].filter(j=>result[j]>=0).length*10+NEIGHBORS[i].length+random();if(rank>best){best=rank;index=i;}}
      if(index<0)return true;
      const choices=shuffle([0,1,2,3,4,5].filter(r=>left[r]>0 && NEIGHBORS[index].every(j=>result[j]!==r)),random);
      for(const r of choices){result[index]=r;left[r]--;if(place())return true;left[r]++;result[index]=-1;}
      return false;
    };
    return place()?result.map(i=>RESOURCES[i]):null;
  }
  while(candidates.length<target&&performance.now()<deadline) {
    const resources=terrain();if(!resources)continue;
    const resourceIndices=resources.map(r=>RESOURCES.indexOf(r));
    for(let attempt=0;attempt<1000;attempt++){
      if(attempt%16===0&&performance.now()>=deadline)break;
      const tokens=shuffle([...NUMBERS],random);let ti=0;
      const numbers=resources.map(r=>r==='Desert'?0:tokens[ti++]);
      if(EDGES.some(([i,j])=>{
        const a=numbers[i],b=numbers[j];
        return (rules.red&&[6,8].includes(a)&&[6,8].includes(b))||(rules.matchingNumbers&&a!==0&&a===b)||(rules.twoTwelve&&((a===2&&b===12)||(a===12&&b===2)));
      }))continue;
      if(settings.level>=3){
        const strength=[0,0,0,0,0];numbers.forEach((n,i)=>{if(resourceIndices[i]<5)strength[resourceIndices[i]]+=dots(n);});
        if(strength.some((v,k)=>{const [lo,hi]=range(settings.level,k)!;return v<lo||v>hi;}))continue;
      }
      const key=resources.join(',')+'|'+numbers.join(',');if(seen.has(key))continue;seen.add(key);
      const layout={resources:[...resources],numbers};
      candidates.push({layout,score:settings.level===1?0:score(layout).total,tie:random()});
      options.progress?.(candidates.length);break;
    }
  }
  candidates.sort((a,b)=>a.score-b.score||a.tie-b.tie);
  const chosen=candidates[Math.floor(random()*Math.min(pool,candidates.length))];
  return {board:chosen?makeBoard(chosen.layout,settings):null,candidates:candidates.length,elapsed:performance.now()-start};
}
