import { useEffect, useRef, useState } from 'react';
import frame from '../design/frame-mapping.json';
import { BoardGraphic, Legend, ResourceIcon } from './BoardGraphic.tsx';
import { COORDS, DEFAULT_SETTINGS, LEVELS, RESOURCES, RULES, RULE_HELP, RULE_LABELS, effective, range, totals, type Board, type Level, type Settings } from './model.ts';
import { STORAGE_KEY, boardLink, decode, readSaved, settingsEqual } from './codec.ts';
import { exportPNG } from './export.ts';
import type { Generation } from './generator.ts';

function initialState(){
  const saved=readSaved();
  if(location.hash){try{return {...saved,board:decode(location.hash),linkError:false};}catch{return {...saved,board:null,linkError:true};}}
  return {...saved,linkError:false};
}
const descriptions=[
  'A random setup with your active restrictions. No preference for even production.',
  'Gently favors more evenly spread production, while keeping plenty of variety.',
  'Spreads production across resources and the island, while keeping variety.',
  'More selective about uneven production and concentrations of strong numbers.',
  'Our strongest balance preference, with tighter production ranges and separated resources.',
];

export default function App(){
  const [initial]=useState(initialState);
  const [board,setBoard]=useState<Board|null>(initial.board);
  const [draft,setDraft]=useState<Settings>(initial.board?.settings??structuredClone(DEFAULT_SETTINGS));
  const [linkError,setLinkError]=useState(initial.linkError);
  const [storageError,setStorageError]=useState(initial.storageError);
  const [busy,setBusy]=useState(false),[candidates,setCandidates]=useState(0);
  const [error,setError]=useState(''),[message,setMessage]=useState('');
  const [copyText,setCopyText]=useState(''),[exporting,setExporting]=useState(false),[exportError,setExportError]=useState(false);
  const [panel,setPanel]=useState<'advanced'|'legend'|'more'|'zoom'|null>(null),[zoom,setZoom]=useState(1);
  const expanded=panel==='zoom';
  const opener=useRef<HTMLElement|null>(null);
  function openPanel(next:NonNullable<typeof panel>, source:HTMLElement){opener.current=source;setPanel(next);}
  function closePanel(){setPanel(null);}
  function containFocus(event:React.KeyboardEvent<HTMLDialogElement>){
    if(event.key!=='Tab')return;
    const targets=Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), summary, [tabindex="0"]')).filter(el=>el.getClientRects().length>0);
    const first=targets[0],last=targets.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  }
  const worker=useRef<Worker|null>(null),svg=useRef<SVGSVGElement>(null),dialog=useRef<HTMLDialogElement>(null),zoomViewport=useRef<HTMLDivElement>(null);
  const running=useRef(false);
  const initialized=useRef(false),gesture=useRef<{distance:number;zoom:number}|null>(null);
  const changed=!!board&&!settingsEqual(draft,board.settings),rules=effective(draft);
  const customized=RULES.filter(k=>draft.overrides[k]!==undefined).length;

  function keep(next:Board){
    setBoard(next);setDraft(structuredClone(next.settings));setLinkError(false);setError('');setCopyText('');setExportError(false);
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(next));setStorageError(false);}catch{setStorageError(true);}
  }
  function clearLink(){if(location.hash)history.replaceState(null,'',location.pathname+location.search);}
  function readyWorker(){
    if(worker.current)return worker.current;
    const w=new Worker(new URL('./generation.worker.ts',import.meta.url),{type:'module'});worker.current=w;
    w.onerror=()=>{w.terminate();worker.current=null;};
    return w;
  }
  function start(settings:Settings=draft){
    if(running.current)return;
    setBusy(true);setCandidates(0);setError('');setMessage('');setExportError(false);
    const request=structuredClone(settings);
    try{
      const w=readyWorker();running.current=true;
      const finish=()=>{running.current=false;w.onmessage=null;setBusy(false);};
      w.onmessage=(event:MessageEvent<{type:string;candidates?:number;result?:Generation}>)=>{
        if(event.data.type==='progress'){setCandidates(event.data.candidates??0);return;}
        finish();const result=event.data.result;
        if(result?.board){
          // Save the applied request while preserving edits made during calculation.
          const next=result.board;setBoard(next);setLinkError(false);setCopyText('');clearLink();
          try{localStorage.setItem(STORAGE_KEY,JSON.stringify(next));setStorageError(false);}catch{setStorageError(true);}
          setMessage('New board ready.');
        }else setError('No suitable board was found within the search limit. Try again or adjust your settings.'+(board?' Your previous board has been kept.':''));
      };
      w.onerror=()=>{finish();w.terminate();worker.current=null;setError('Board generation could not finish. Try again or adjust your settings.');};
      w.postMessage(request);
    }catch{worker.current=null;running.current=false;setBusy(false);setError('This browser could not start board generation. Please try a current browser.');}
  }
  useEffect(()=>{
    if(!initialized.current){
      initialized.current=true;
      if(initial.board){keep(initial.board);try{readyWorker();}catch{/* A later Generate request reports unsupported workers. */}}else if(!initial.linkError)start(DEFAULT_SETTINGS);
    }
    const onHash=()=>{
      if(running.current){worker.current?.terminate();worker.current=null;running.current=false;}
      setBusy(false);
      setMessage('');setCopyText('');setExportError(false);
      if(!location.hash){
        const saved=readSaved();
        if(saved.board)keep(saved.board);
        else {setLinkError(false);setBoard(null);setDraft(structuredClone(DEFAULT_SETTINGS));start(DEFAULT_SETTINGS);}
        return;
      }
      try{keep(decode(location.hash));setMessage('Shared board loaded.');}catch{setLinkError(true);setError('');}
    };
    window.addEventListener('hashchange',onHash);
    return()=>{window.removeEventListener('hashchange',onHash);worker.current?.terminate();worker.current=null;};
    // Initial state is captured once; later URL changes are handled explicitly.
  },[]);
  useEffect(()=>{
    const el=dialog.current;
    if(panel){
      if(!el?.open)el?.showModal();
      if(panel==='zoom')setZoom(1);
      const previous=document.body.style.overflow;
      document.body.style.overflow='hidden';
      return()=>{document.body.style.overflow=previous;};
    }
    if(el?.open)el.close();
    opener.current?.focus({preventScroll:true});
  },[panel]);
  useEffect(()=>{
    const el=zoomViewport.current;if(!el)return;
    const distance=(touches:TouchList)=>Math.hypot(touches[0].clientX-touches[1].clientX,touches[0].clientY-touches[1].clientY);
    const begin=(event:TouchEvent)=>{if(event.touches.length===2)gesture.current={distance:distance(event.touches),zoom};};
    const move=(event:TouchEvent)=>{if(event.touches.length===2&&gesture.current){event.preventDefault();setZoom(Math.max(1,Math.min(3,gesture.current.zoom*distance(event.touches)/gesture.current.distance)));}};
    const end=()=>{gesture.current=null;};
    el.addEventListener('touchstart',begin,{passive:true});el.addEventListener('touchmove',move,{passive:false});el.addEventListener('touchend',end);
    return()=>{el.removeEventListener('touchstart',begin);el.removeEventListener('touchmove',move);el.removeEventListener('touchend',end);};
  },[expanded,zoom]);
  async function copy(){
    if(!board)return;const link=boardLink(board);setCopyText(link);
    try{await navigator.clipboard.writeText(link);setMessage('Board link copied.');}catch{setMessage('Copy the board link from the field below.');}
  }
  async function download(){
    if(!board||!svg.current)return;setExporting(true);setExportError(false);setMessage('Preparing image…');
    try{await exportPNG(svg.current,board);setMessage('Image download started.');}catch{setExportError(true);setMessage('');}finally{setExporting(false);}
  }
  function recover(){const saved=readSaved();if(saved.board){if(running.current){worker.current?.terminate();worker.current=null;running.current=false;}setBusy(false);keep(saved.board);clearLink();try{readyWorker();}catch{/* Report if generation is requested. */}setMessage('Your last board is restored.');}else{setStorageError(true);setMessage('No saved board is available in this browser.');}}
  const strength=board?totals(board.layout):[];
  return <main className="shell compact-shell">
    <header className="brand"><div className="brand-mark" aria-hidden="true">C</div><div><div className="brand-title">Catan Board Randomizer</div><div className="brand-sub">Base game · 3–4 players</div></div></header>
    {linkError&&<section className="recovery" role="alert"><h1>This board link couldn’t be loaded</h1><p>It may be incomplete or use an unsupported version. We haven’t substituted another setup.</p><div className="recovery-actions">{readSaved().board&&<button onClick={recover}>Open my last board</button>}<button onClick={()=>{clearLink();setLinkError(false);setBoard(null);setDraft(structuredClone(DEFAULT_SETTINGS));start(DEFAULT_SETTINGS);}} disabled={busy}>Generate a new board</button></div></section>}
    <div className="layout">
      <section className="board-section" aria-label="Displayed board">
        <div className="board-head"><h1>Your next island.</h1>{board&&!linkError&&<span className="applied"><span className="applied-prefix">Board:</span> {LEVELS[board.settings.level-1]}</span>}</div>
        {board&&!linkError?<>
          <div className="board-surface"><BoardGraphic layout={board.layout} svgRef={svg}/></div>
          <div className="board-tools"><button className="utility" onClick={e=>openPanel('legend',e.currentTarget)}>Show legend</button><button className="utility" onClick={e=>openPanel('zoom',e.currentTarget)}>⤢ Enlarge</button><button className="utility" onClick={e=>openPanel('more',e.currentTarget)}>More ···</button></div>

        </>:<div className="empty-board" aria-busy={busy}><span className={busy?'island-spinner':'empty-symbol'} aria-hidden="true">⬡</span><h2>{busy?'Finding your next island…':linkError?'Choose how to continue':'Ready for a new setup?'}</h2><p>{busy?'Checking the pieces and your active restrictions.':'Choose your preferences, then generate a board.'}</p></div>}
      </section>
      <section className="controls" aria-label="Generation settings">
        <div className="kicker">Make it your game</div><div className="control-top"><h2><label htmlFor="balance">Choose balance</label></h2><div className="balance-shortcuts"><span className="selected-level">{LEVELS[draft.level-1]}</span><button className="utility balanced-reset" disabled={busy||settingsEqual(draft,DEFAULT_SETTINGS)} onClick={()=>{setDraft(structuredClone(DEFAULT_SETTINGS));setError('');setMessage('Balanced defaults restored. Generate to apply.');}}>Reset to Balanced</button></div></div>
        <input id="balance" className="balance-slider" type="range" min="1" max="5" step="1" value={draft.level} aria-valuetext={LEVELS[draft.level-1]} style={{'--slider-progress':`${(draft.level-1)*25}%`} as React.CSSProperties} onChange={e=>setDraft({...draft,level:Number(e.target.value) as Level})}/>
        <div className="levels" aria-hidden="true"><span>Random</span><span>Balanced</span><span>Very balanced</span></div>
        <p className="balance-description desktop-description">{descriptions[draft.level-1]}</p>

        <div className={'pending-line'+(changed?' is-pending':'')} role="status">{changed?'Changes pending · Generate to apply':board&&!linkError?'Settings match displayed board':'Choose settings for your board'}</div>
        {error&&<div className="error" role="alert"><p>{error}</p><div className="recovery-actions"><button onClick={()=>start()} disabled={busy}>Try again</button><button onClick={e=>openPanel('advanced',e.currentTarget)}>Adjust settings</button></div></div>}
        <div className="generation-actions"><button className="utility advanced-button" onClick={e=>openPanel('advanced',e.currentTarget)}>Advanced settings{customized>0&&<span className="custom-count">{customized} custom</span>}</button><button className="generate" onClick={()=>start()} disabled={busy}><span aria-hidden="true" className={busy?'spin':''}>↻</span>{busy?'Generating…':'Generate board'}</button></div>

        <div className="status" role="status" aria-live="polite">{busy?`Checking layouts${candidates?` · ${candidates} qualifying boards`:''}…`:message}</div>
        {storageError&&<p className="storage-warning">Last-board restoration is unavailable in this browser. Keep a link or image of a board you like.</p>}

      </section>
    </div>
    <footer className="footer"><span>A clear setup. A new game.</span><span>Independent fan project.</span></footer>
    <dialog ref={dialog} className={'panel-dialog'+(expanded?' zoom-dialog':'')} onKeyDown={containFocus} onCancel={closePanel} onClose={closePanel} aria-labelledby="panel-title">
      <div className="panel-heading"><h2 id="panel-title">{panel==='advanced'?'Advanced settings':panel==='legend'?'Terrain & port symbols':panel==='more'?'Board tools & help':'Your board'}</h2><button className="utility" onClick={closePanel}>Close</button></div>
      <div className="panel-content">
      {panel==='advanced'&&<>
        <p className="panel-context">Pending balance: <strong>{LEVELS[draft.level-1]}</strong></p>
          <p className="advanced-intro">Manual choices stay fixed when you move the slider. Restrictions apply together.</p>
          {RULES.map(rule=><label className="rule" key={rule}><span><strong>{RULE_LABELS[rule]}</strong><small>{RULE_HELP[rule]}</small><small className={draft.overrides[rule]===undefined?'rule-source':'rule-source custom'}>{draft.overrides[rule]===undefined?'Follows slider':'Custom choice'}</small></span><input type="checkbox" checked={rules[rule]} onChange={e=>setDraft({...draft,overrides:{...draft.overrides,[rule]:e.target.checked}})}/></label>)}
          <button className="reset" onClick={()=>setDraft({...draft,overrides:{}})} disabled={!customized}>Reset to slider defaults</button>
      </>}
      {panel==='legend'&&<><Legend/>
          <div className="port-key"><span aria-hidden="true" className="pier-key">⊔</span><span>Use either marked corner for that port.<br/><span className="port-ratios">2:1 = shown resource · 3:1 = any one resource</span></span></div>
          <p className="frame-hint"><span className="connector-icon">1 | 1</span>Match the numbered ends to assemble the frame.</p>

      </>}
      {panel==='more'&&<>
        <div className="share-row"><button className="secondary" onClick={copy} disabled={!board||linkError}><span aria-hidden="true">↗</span>Copy link</button><button className="secondary" onClick={download} disabled={!board||linkError||exporting}><span aria-hidden="true">↓</span>{exporting?'Preparing…':'Download image'}</button></div>
        {copyText&&<label className="copy-fallback">Board link<input readOnly value={copyText} onFocus={e=>e.target.select()}/></label>}
        {exportError&&<div className="error" role="alert">The image couldn’t be downloaded. Your board is safe. <button onClick={download}>Retry image download</button></div>}
        <div className="status" role="status">{message}</div>
        <p className="balance-description">Selected balance: {LEVELS[draft.level-1]}. {descriptions[draft.level-1]}</p>
        {board&&!linkError&&<>
          <details className="text-board"><summary>Read board as text</summary>{[-2,-1,0,1,2].map((row,k)=><p key={row}><strong>Row {k+1}, left to right:</strong> {COORDS.flatMap(([,r],i)=>r===row?[`${board.layout.resources[i]}${board.layout.numbers[i]?` ${board.layout.numbers[i]}`:' (robber)'}`]:[]).join('; ')}.</p>)}<p><strong>Ports, clockwise from connector 1:</strong></p><ol>{frame.pieces.flatMap(piece=>piece.ports.map(port=><li key={port.coastal_edge}>{port.resource} {port.ratio}, frame {piece.ends.join('–')}, coastal corners {port.coastal_vertex_indices.map(i=>i+1).join(' and ')} clockwise from connector 1.</li>))}</ol></details>
        </>}
        <div className="below">
          <details><summary>Balance details · current board</summary>{board&&!linkError?<><p>Production potential, measured in probability dots. Actual collection depends on settlements, dice, and the robber. Brick and ore remain naturally less abundant.</p><table><caption className="sr-only">Applied board resource production</caption><thead><tr><th>Resource</th><th>Dots</th><th>Allowed range</th></tr></thead><tbody>{RESOURCES.slice(0,5).map((r,i)=><tr key={r}><th scope="row"><ResourceIcon resource={r}/>{r}</th><td>{strength[i]}</td><td>{range(board.settings.level,i)?.join('–')??'Not enforced'}</td></tr>)}</tbody></table><p><strong>Applied restrictions:</strong> {RULES.filter(k=>effective(board.settings)[k]).map(k=>RULE_LABELS[k]).join('; ')||'None'}.</p><p>Balance considers production by resource and its spread across the island. It does not guarantee equal winning chances.</p></>:<p>Generate or restore a board to see its applied settings.</p>}</details>
          <details><summary>How to assemble</summary><ol><li>Arrange the six frame pieces by matching their numbered ends, keeping the orientation shown.</li><li>Use the legend to place terrain tiles row by row, from top to bottom.</li><li>Add the number tokens shown. The desert has no token; place the robber there.</li><li>Ports are printed on the frame pieces. Either marked coastal corner can access that port.</li></ol><p>This generator uses custom balance rules. Frame mapping follows the 2025 sixth-edition rulebook; puzzle outlines are schematic.</p></details>
        </div>
      </>}
      {panel==='zoom'&&<>
        <div className="zoom-controls"><button aria-label="Zoom out" disabled={zoom<=1} onClick={()=>setZoom(z=>Math.max(1,z-.25))}>−</button><output>{Math.round(zoom*100)}%</output><button aria-label="Zoom in" disabled={zoom>=3} onClick={()=>setZoom(z=>Math.min(3,z+.25))}>+</button><button onClick={()=>setZoom(1)}>Reset zoom</button></div>
        <p className="zoom-hint">Pinch to zoom. Scroll or drag on touch to inspect the enlarged board.</p>
        <div className="zoom-viewport" ref={zoomViewport} role="region" aria-label="Enlarged board, scroll to inspect" tabIndex={0}>{board&&<div style={{width:`${zoom*100}%`}}><BoardGraphic layout={board.layout}/></div>}</div><Legend/>
      </>}
      </div>
      {panel==='advanced'&&<div className="panel-actions"><button className="generate" disabled={busy} onClick={()=>{closePanel();start();}}>{busy?'Generating…':'Generate board'}</button></div>}
    </dialog>
  </main>;
}
