import fs from 'node:fs';
const p='skills/repoaxis/viewer/repoaxis.html';
let s=fs.readFileSync(p,'utf8');
const anchor='window.__REPOAXIS_LIVE__=liveV47;bootLiveV47();';
if(!s.includes(anchor))throw new Error('R03 anchor missing');
if(s.includes('frameGraphSelectionR03'))throw new Error('R03 already applied');
const patch=String.raw`

/* R03 live search/cross-view Graph arrival framing. Preserve graph projection/layout; reconcile only camera position. */
function frameGraphSelectionR03(id){
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    const node=document.querySelector('#graphSvg .g-node[data-id="'+CSS.escape(id)+'"]'),svg=$('#graphSvg'),host=$('#graphStage');
    if(!node||!svg||!host)return;
    const nr=node.getBoundingClientRect(),hr=host.getBoundingClientRect(),sr=svg.getBoundingClientRect(),vb=svg.viewBox?.baseVal;
    if(!vb?.width||!vb?.height||!sr.width||!sr.height)return;
    const cx=nr.left+nr.width/2,cy=nr.top+nr.height/2,tx=hr.left+hr.width/2,ty=hr.top+hr.height/2;
    const dx=tx-cx,dy=ty-cy,unitX=vb.width/sr.width,unitY=vb.height/sr.height,c=state.cameras.graph||{s:1,x:0,y:0};
    state.cameras.graph={s:c.s||1,x:(c.x||0)+dx*unitX,y:(c.y||0)+dy*unitY};
    applyCamera('graph');
  }));
}
const navigateSelectedToR03Base=navigateSelectedTo;
navigateSelectedTo=function(view){
  const source=byId[state.selected]||byId.root,f=source.type==='file'?source:containingFile(source),r=navigateSelectedToR03Base(view);
  if(view==='graph'&&f)frameGraphSelectionR03(f.id);
  return r;
};
`;
s=s.replace(anchor,patch+'\n'+anchor);
fs.writeFileSync(p,s);
console.log('applied R03 Graph arrival framing');
