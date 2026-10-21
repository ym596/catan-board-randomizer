import calibration from './calibration.json';
import { generate } from './generator.ts';
import type { Settings } from './model.ts';
import type { Calibration } from './scoring.ts';

self.onmessage=(event:MessageEvent<Settings>)=>{
  try {
    const result=generate(event.data,calibration as Calibration,{progress:n=>{if(n%8===0)self.postMessage({type:'progress',candidates:n});}});
    self.postMessage({type:'complete',result});
  } catch {self.postMessage({type:'error'});}
};
