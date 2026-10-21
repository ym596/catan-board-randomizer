import { FRAME, SCORING, RULES, errorsFor, type Board, type Settings } from './model.ts';

export const STORAGE_KEY='catan-last-board-v1';
export function validateBoard(value:unknown): Board {
  if(!value||typeof value!=='object')throw new Error('Invalid board data.');
  const b=value as Board;
  if(b.v!==1||b.frame!==FRAME||b.scoring!==SCORING)throw new Error('This board version is not supported.');
  const s=b.settings;
  if(!s||!Number.isInteger(s.level)||s.level<1||s.level>5||!s.overrides||typeof s.overrides!=='object'||Array.isArray(s.overrides))throw new Error('Invalid board settings.');
  if(Object.entries(s.overrides).some(([k,v])=>!RULES.includes(k as (typeof RULES)[number])||typeof v!=='boolean'))throw new Error('Invalid board restrictions.');
  if(!b.layout||errorsFor(b.layout,s).length)throw new Error('This board does not match its pieces or settings.');
  // Reconstruct the supported shape; never carry arbitrary shared input into state.
  return {v:1,frame:FRAME,scoring:SCORING,layout:{resources:[...b.layout.resources],numbers:[...b.layout.numbers]},settings:{level:s.level,overrides:{...s.overrides}}};
}
export function encode(board: Board): string {
  return btoa(JSON.stringify(board)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
export function decode(hash:string): Board {
  if(!hash.startsWith('#board=')||hash.length>10_000)throw new Error('Invalid board link.');
  const value=hash.slice(7);if(!/^[A-Za-z0-9_-]+$/.test(value))throw new Error('Invalid board link.');
  return validateBoard(JSON.parse(atob(value.replace(/-/g,'+').replace(/_/g,'/'))));
}
export function boardLink(board:Board): string {
  return `${location.origin}${location.pathname}${location.search}#board=${encode(board)}`;
}
export function settingsEqual(a:Settings,b:Settings): boolean {
  return a.level===b.level&&RULES.every(k=>a.overrides[k]===b.overrides[k]);
}
export function readSaved():{board:Board|null;storageError:boolean} {
  try {
    const raw=localStorage.getItem(STORAGE_KEY);
    if(!raw)return {board:null,storageError:false};
    try{return {board:validateBoard(JSON.parse(raw)),storageError:false};}catch{return {board:null,storageError:true};}
  }catch{return {board:null,storageError:true};}
}
