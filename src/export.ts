import { LEVELS, RESOURCES, RULE_LABELS, RULES, effective, type Board } from './model.ts';
import { PALETTE } from './BoardGraphic.tsx';
import { SYMBOLS } from './board-art.ts';

function loadImage(src:string):Promise<HTMLImageElement> {
  return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('Could not draw the image.'));image.src=src;});
}
export async function exportPNG(svg:SVGSVGElement,board:Board):Promise<void> {
  const clone=svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('width','2400');clone.setAttribute('height','2400');
  const blob=new Blob([new XMLSerializer().serializeToString(clone)],{type:'image/svg+xml;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  try {
    const image=await loadImage(url),canvas=document.createElement('canvas');canvas.width=2400;canvas.height=2980;
    const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Image export is unavailable.');
    ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(image,0,0,2400,2400);
    ctx.fillStyle='#273c31';ctx.font='bold 52px Arial';ctx.fillText('Catan Board Randomizer',110,2470);
    ctx.font='36px Arial';ctx.fillText(`Base game · ${LEVELS[board.settings.level-1]} · Sixth-edition fixed frame`,110,2530);
    for(let i=0;i<RESOURCES.length;i++){
      const resource=RESOURCES[i],x=135+(i%3)*740,y=2620+Math.floor(i/3)*84;
      const symbol=`<svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" viewBox="0 0 44 44"><polygon points="22,1 40,11 40,33 22,43 4,33 4,11" fill="${PALETTE[resource][0]}"/><g transform="translate(22 22) scale(.85)" color="${PALETTE[resource][1]}">${SYMBOLS[resource]}</g></svg>`;
      const small=await loadImage('data:image/svg+xml;charset=utf-8,'+encodeURIComponent(symbol));ctx.drawImage(small,x,y-45,65,65);
      ctx.fillStyle='#273c31';ctx.font='38px Arial';ctx.fillText(resource,x+85,y);
    }
    const rules=effective(board.settings);ctx.font='27px Arial';ctx.fillStyle='#4c5d51';
    ctx.fillText('Active restrictions: '+RULES.filter(k=>rules[k]).map(k=>RULE_LABELS[k]).join(' · '),110,2810,2180);
    ctx.fillText('Ports: 2:1 = shown resource; 3:1 = any one resource. Use either marked corner.',110,2860,2180);
    ctx.fillText('Match the numbered frame ends. Independent fan project; schematic frame outlines.',110,2907,2180);
    const png=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Image export failed.')),'image/png'));
    const download=URL.createObjectURL(png),a=document.createElement('a');a.href=download;a.download=`catan-board-${LEVELS[board.settings.level-1].toLowerCase().replaceAll(' ','-')}.png`;a.click();
    setTimeout(()=>URL.revokeObjectURL(download),60_000);
  }finally{URL.revokeObjectURL(url);}
}
