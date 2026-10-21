import { describe,it,expect,vi,afterEach } from 'vitest';
import calibration from './calibration.json';
import fixture from '../design/board-fixture.json';
import frame from '../design/frame-mapping.json';
import { COORDS, CENTER, EDGES, VERTICES, RESOURCES, RULES, effective, errorsFor, makeBoard, type Layout, type Level, type Settings } from './model.ts';
import { generate } from './generator.ts';
import { decode,encode,validateBoard,readSaved } from './codec.ts';
import { normalizer,rawScores,randomSource,shuffle,type Calibration } from './scoring.ts';

const reference=calibration as Calibration;
const layout:Layout={resources:fixture.tiles.map(t=>t.resource as Layout['resources'][number]),numbers:fixture.tiles.map(t=>t.number??0)};
const settings:Settings={level:3,overrides:{}};
afterEach(()=>vi.unstubAllGlobals());
function transformed(board:Layout,fn:(q:number,r:number)=>[number,number]):Layout {
  const result:Layout={resources:[...board.resources],numbers:[...board.numbers]};
  COORDS.forEach(([q,r],i)=>{const [x,y]=fn(q,r);const j=COORDS.findIndex(([s,t])=>s===x&&t===y);result.resources[j]=board.resources[i];result.numbers[j]=board.numbers[i];});return result;
}
describe('pieces, topology and restrictions',()=>{
  it('has the correct hex and settlement graph',()=>{expect(COORDS).toHaveLength(19);expect(EDGES).toHaveLength(42);expect(VERTICES).toHaveLength(54);});
  it('accepts the approved Balanced fixture',()=>expect(errorsFor(layout,settings)).toEqual([]));
  it('rejects inventory corruption and a number on the desert',()=>{
    const corrupt=structuredClone(layout);corrupt.numbers[corrupt.resources.indexOf('Desert')]=7;expect(errorsFor(corrupt,settings).length).toBeGreaterThan(0);
    corrupt.resources[0]='Wood';expect(errorsFor(corrupt,settings)).toContain('Incorrect terrain inventory.');
  });
  it('preserves explicit on and off choices across all levels',()=>{
    for(const level of [1,2,3,4,5] as Level[]){expect(effective({level,overrides:{red:false,centerDesert:true}})).toMatchObject({red:false,centerDesert:true});}
    expect(effective({level:5,overrides:{}})).toEqual({red:true,matchingNumbers:true,twoTwelve:true,matchingResources:true,centerDesert:false});
  });
  it('maps official frame ends, ports and unique coastal access',()=>{
    expect(frame.pieces.map(p=>p.ends)).toEqual([[1,2],[2,3],[3,4],[4,5],[5,6],[6,1]]);
    expect(frame.pieces.map(p=>p.ports.map(p=>p.resource))).toEqual([['Generic'],['Generic','Brick'],['Wood'],['Generic','Wheat'],['Ore'],['Generic','Wool']]);
    expect(new Set(frame.pieces.flatMap(p=>p.ports.flatMap(p=>p.coastal_vertex_indices))).size).toBe(18);
  });
});
describe('versioned board links',()=>{
  it('round-trips actual layout, level and custom choices exactly',()=>{
    const record=makeBoard(layout,{level:3,overrides:{red:false,matchingResources:false}});
    expect(decode('#board='+encode(record))).toEqual(record);
  });
  it('rejects malformed, oversized, future and inconsistent links',()=>{
    expect(()=>decode('#board=broken!')).toThrow();expect(()=>decode('#board='+'a'.repeat(10_001))).toThrow();
    expect(()=>validateBoard({...makeBoard(layout,settings),v:2})).toThrow();
    expect(()=>validateBoard({...makeBoard(layout,settings),settings:{level:5,overrides:{}}})).toThrow();
    expect(()=>validateBoard({...makeBoard(layout,settings),settings:{level:3,overrides:{unexpected:true}}})).toThrow();
  });
  it('recovers safely from blocked and corrupt browser storage',()=>{
    vi.stubGlobal('localStorage',{getItem:()=>{throw new Error('Storage blocked');}});
    expect(readSaved()).toEqual({board:null,storageError:true});
    vi.stubGlobal('localStorage',{getItem:()=>'{bad json'});
    expect(readSaved()).toEqual({board:null,storageError:true});
    vi.stubGlobal('localStorage',{getItem:()=>JSON.stringify(makeBoard(layout,settings))});
    expect(readSaved()).toEqual({board:makeBoard(layout,settings),storageError:false});
  });
});
describe('calibrated scores',()=>{
  it('uses complete, fixed reference distributions',()=>{
    expect(reference.samples).toBe(100_000);expect(reference.seed).toBe(20261020);
    for(const histogram of reference.histograms)expect(histogram.reduce((s,[,n])=>s+n,0)).toBe(100_000);
  });
  it('is invariant under all rotations and reflections',()=>{
    let current=layout;const raw=rawScores(layout),score=normalizer(reference)(layout).total;
    for(let i=0;i<6;i++){
      expect(rawScores(current)).toEqual(raw);expect(rawScores(transformed(current,(q,r)=>[r,q]))).toEqual(raw);
      expect(normalizer(reference)(current).total).toBe(score);current=transformed(current,(q,r)=>[-r,q+r]);
    }
  });
  it('uses reproducible random sampling',()=>expect(shuffle([...RESOURCES],randomSource(9))).toEqual(shuffle([...RESOURCES],randomSource(9))));
});
describe('bounded generation',()=>{
  it('generates every default level without breaking any rule',()=>{
    for(const level of [1,2,3,4,5] as Level[]){const request={level,overrides:{}};const result=generate(request,reference,{seed:level});expect(result.board).not.toBeNull();expect(errorsFor(result.board!.layout,request)).toEqual([]);}
  });
  it('supports every combination of advanced restrictions at every level',()=>{
    for(const level of [1,2,3,4,5] as Level[])for(let mask=0;mask<32;mask++){
      const request:Settings={level,overrides:Object.fromEntries(RULES.map((k,i)=>[k,!!(mask&(1<<i))]))};
      const result=generate(request,reference,{seed:1000+level*32+mask});
      expect(result.board,`level ${level}, mask ${mask}`).not.toBeNull();expect(errorsFor(result.board!.layout,request)).toEqual([]);
      if(request.overrides.centerDesert)expect(result.board!.layout.resources[CENTER]).toBe('Desert');
    }
  },30_000);
  it('returns no substitute when no search budget is available',()=>{
    const result=generate(settings,reference,{budget:0});expect(result.board).toBeNull();expect(result.candidates).toBe(0);
  });
});
