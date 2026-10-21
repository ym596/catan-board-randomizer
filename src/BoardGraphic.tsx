import { useId, type Ref } from 'react';
import { COORDS, RESOURCES, dots, type Layout, type Resource } from './model.ts';
import { FRAME_ART, PORT_ART, SYMBOLS } from './board-art.ts';

export const PALETTE:Record<Resource,[string,string]>={Wood:['#bfd3b5','#285b3a'],Wheat:['#efd184','#8d671e'],Wool:['#d6e3a6','#536932'],Brick:['#dda087','#924a32'],Ore:['#bacbd2','#3d5966'],Desert:['#eddbb6','#a17c3d']};
export function ResourceIcon({resource}:{resource:Resource}) {
  return <svg viewBox="0 0 44 44" width="28" height="28" aria-hidden="true"><polygon points="22,1 40,11 40,33 22,43 4,33 4,11" fill={PALETTE[resource][0]}/><g transform="translate(22 22) scale(.85)" color={PALETTE[resource][1]} dangerouslySetInnerHTML={{__html:SYMBOLS[resource]}}/></svg>;
}
export function Legend() {
  return <div className="resource-legend" aria-label="Terrain and port symbols"><div className="legend-heading">Terrain &amp; port symbols</div><div className="legend-items">{RESOURCES.map(resource=><span className="legend-item" key={resource}><ResourceIcon resource={resource}/><span>{resource}</span></span>)}</div></div>;
}
export function BoardGraphic({layout,svgRef}:{layout:Layout;svgRef?:Ref<SVGSVGElement>}) {
  const id=useId();
  return <svg className="board-graphic" ref={svgRef} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="1000" height="1000" role="img" aria-labelledby={id}>
    <title id={id}>Catan base-game setup. Terrain symbols are explained in the legend; use either marked coastal corner for its port.</title>
    <g dangerouslySetInnerHTML={{__html:FRAME_ART}}/>
    {COORDS.map(([q,r],i)=>{
      const resource=layout.resources[i],n=layout.numbers[i],x=250+Math.sqrt(3)*38*(q+r/2),y=250+57*r;
      const points=Array.from({length:6},(_,k)=>`${x+36.9*Math.cos((-90+k*60)*Math.PI/180)},${y+36.9*Math.sin((-90+k*60)*Math.PI/180)}`).join(' ');
      const ink=n===6||n===8?'#a53b2e':'#2c4035';
      return <g key={i} data-tile={i}><title>{`${resource}${n?`, number ${n}, ${dots(n)} probability dots`:', no number; robber starts here'}`}</title>
        <polygon points={points} fill={PALETTE[resource][0]} stroke="#f7f0dc" strokeWidth="2"/>
        <g transform={`translate(${x} ${y+(n?-17:0)}) scale(${n?1.1:1.4})`} color={PALETTE[resource][1]} dangerouslySetInnerHTML={{__html:SYMBOLS[resource]}}/>
        {n?<><circle cx={x} cy={y+13} r="15.5" fill="#fffaf0" stroke="#aa9776" strokeWidth=".8"/><text x={x} y={y+17} textAnchor="middle" fontFamily="Arial,sans-serif" fontWeight="700" fontSize="21" fill={ink}>{n}</text>{Array.from({length:dots(n)},(_,j)=><circle key={j} cx={x+(j-(dots(n)-1)/2)*4} cy={y+23} r="1.2" fill={ink}/>)}</>:<g transform={`translate(${x} ${y+24})`}><circle cy="-4" r="3" fill="#354b40"/><path d="M-2.5 0 L-5 8 H5 L2.5 0 Z" fill="#354b40"/></g>}
      </g>;
    })}
    <g dangerouslySetInnerHTML={{__html:PORT_ART}}/>
  </svg>;
}
