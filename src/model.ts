export const RESOURCES = ['Wood', 'Wheat', 'Wool', 'Brick', 'Ore', 'Desert'] as const;
export type Resource = (typeof RESOURCES)[number];
export const COUNTS = [4, 4, 4, 3, 3, 1];
export const NUMBERS = [2, 12, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11];
export const LEVELS = ['Random', 'Light balance', 'Balanced', 'Strong balance', 'Very balanced'];
export type Level = 1 | 2 | 3 | 4 | 5;
export const RULES = ['red', 'matchingNumbers', 'twoTwelve', 'matchingResources', 'centerDesert'] as const;
export type Rule = (typeof RULES)[number];
export type Settings = { level: Level; overrides: Partial<Record<Rule, boolean>> };
export type Layout = { resources: Resource[]; numbers: number[] };
export type Board = { v: 1; frame: 'sixth-edition-fixed-v1'; scoring: 'balance-v1'; layout: Layout; settings: Settings };
export const FRAME = 'sixth-edition-fixed-v1';
export const SCORING = 'balance-v1';
export const DEFAULT_SETTINGS: Settings = { level: 3, overrides: {} };
export const RULE_LABELS: Record<Rule, string> = {
  red: 'Keep red numbers apart', matchingNumbers: 'Separate matching numbers',
  twoTwelve: 'Separate 2 and 12', matchingResources: 'Separate matching resources', centerDesert: 'Desert in the center',
};
export const RULE_HELP: Record<Rule, string> = {
  red: 'No 6–6, 6–8, or 8–8 tiles sharing an edge.',
  matchingNumbers: 'No two equal number tokens sharing an edge.',
  twoTwelve: 'The 2 and 12 tiles do not share an edge.',
  matchingResources: 'No two tiles of the same resource sharing an edge.',
  centerDesert: 'Fix the desert in the middle of the island.',
};
export function effective(settings: Settings): Record<Rule, boolean> {
  const l = settings.level;
  return { red: true, matchingNumbers: l >= 3, twoTwelve: l >= 4, matchingResources: l >= 5, centerDesert: false, ...settings.overrides };
}
export function range(level: Level, resourceIndex: number): [number, number] | null {
  if (level < 3) return null;
  return (resourceIndex < 3 ? {3:[9,17],4:[10,16],5:[11,14]} : {3:[7,13],4:[8,12],5:[9,11]})[level as 3|4|5] as [number, number];
}
export function dots(n: number): number { return n === 0 ? 0 : 6 - Math.abs(7 - n); }
export function makeBoard(layout: Layout, settings: Settings): Board {
  return { v: 1, frame: FRAME, scoring: SCORING, layout, settings: structuredClone(settings) };
}

export const COORDS: [number, number][] = [];
for (let r = -2; r <= 2; r++) for (let q = -2; q <= 2; q++) {
  if (Math.max(Math.abs(q), Math.abs(r), Math.abs(q+r)) <= 2) COORDS.push([q,r]);
}
export const CENTER = COORDS.findIndex(([q,r]) => q === 0 && r === 0);
const directions = [[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]];
export const NEIGHBORS = COORDS.map(([q,r]) => COORDS.flatMap(([s,t],j) => directions.some(([x,y])=>q-s===x && r-t===y) ? [j] : []));
export const EDGES = NEIGHBORS.flatMap((neighbors,i)=>neighbors.filter(j=>j>i).map(j=>[i,j] as [number,number]));

const offsets = [[0,-2],[1,-1],[1,1],[0,2],[-1,1],[-1,-1]];
const vertexMap = new Map<string, { x:number; y:number; tiles:number[] }>();
COORDS.forEach(([q,r],i) => offsets.forEach(([dx,dy]) => {
  const x=2*q+r+dx, y=3*r+dy, key=`${x},${y}`;
  const v=vertexMap.get(key) ?? {x,y,tiles:[]}; v.tiles.push(i);vertexMap.set(key,v);
}));
export const VERTICES = [...vertexMap.values()];
// Physical coordinates are (sqrt(3)*x,y). Axis normals at 0°,60°,120°
// therefore have signs x, x+y, y-x. On-axis vertices have zero difference.
export const AXIS_WEIGHTS = [0,1,2].map(axis => COORDS.map((_,i) => VERTICES.filter(v=>v.tiles.includes(i)).reduce((sum,v)=>sum+Math.sign(axis===0?v.x:axis===1?v.x+v.y:v.y-v.x),0)));
export function totals(layout: Layout): number[] {
  const out=[0,0,0,0,0];
  layout.resources.forEach((r,i)=>{ const k=RESOURCES.indexOf(r);if(k<5)out[k]+=dots(layout.numbers[i]); });
  return out;
}
export function errorsFor(layout: Layout, settings: Settings): string[] {
  const errors: string[]=[];
  if (!Array.isArray(layout.resources)||!Array.isArray(layout.numbers)||layout.resources.length!==19||layout.numbers.length!==19) return ['The board must contain 19 tiles.'];
  if (RESOURCES.some((r,k)=>layout.resources.filter(x=>x===r).length!==COUNTS[k]) || layout.resources.some(r=>!RESOURCES.includes(r))) errors.push('Incorrect terrain inventory.');
  const sorted=layout.numbers.filter(n=>n!==0).sort((a,b)=>a-b);
  if (JSON.stringify(sorted)!==JSON.stringify([...NUMBERS].sort((a,b)=>a-b)) || layout.numbers.filter(n=>n===0).length!==1) errors.push('Incorrect number-token inventory.');
  if (layout.resources.some((r,i)=>(r==='Desert')!==(layout.numbers[i]===0))) errors.push('The desert must be the only tile without a token.');
  const rule=effective(settings);
  if (rule.centerDesert && layout.resources[CENTER]!=='Desert') errors.push('The desert must be in the center.');
  for (const [i,j] of EDGES) {
    const a=layout.numbers[i],b=layout.numbers[j];
    if (rule.red && [6,8].includes(a) && [6,8].includes(b)) errors.push('Red number tokens touch.');
    if (rule.matchingNumbers && a!==0 && a===b) errors.push('Matching numbers touch.');
    if (rule.twoTwelve && ((a===2&&b===12)||(a===12&&b===2))) errors.push('2 and 12 touch.');
    if (rule.matchingResources && layout.resources[i]===layout.resources[j]) errors.push('Matching resources touch.');
  }
  totals(layout).forEach((v,k)=>{ const limits=range(settings.level,k);if(limits&&(v<limits[0]||v>limits[1])) errors.push(`${RESOURCES[k]} is outside its production range.`); });
  return [...new Set(errors)];
}
