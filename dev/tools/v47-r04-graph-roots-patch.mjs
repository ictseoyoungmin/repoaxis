import fs from 'node:fs';
const p='skills/repoaxis/viewer/repoaxis.html';
let s=fs.readFileSync(p,'utf8');
if(!s.includes("changed=new Set(changes.filter"))throw new Error('R04 graph input union missing');
if(s.includes('frameChangeSetRootsR04'))throw new Error('R04 framing already applied');
const anchor='window.__REPOAXIS_LIVE__=liveV47;bootLiveV47();';
if(!s.includes(anchor))throw new Error('R04 live anchor missing');
const patch=String.raw`

/* R04 live Changes → Graph truth reconciliation. Keep changed roots in the bounded live graph and frame them on change-set arrival. */
function frameChangeSetRootsR04(ids){
  const pts=ids.map(id=>graphPosV11[id]).filter(Boolean);if(!pts.length)return;
  const view=graphWorldV27||{},vw=view.viewW||860,vh=view.viewH||520,xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),minX=Math.min(...xs)-86,maxX=Math.max(...xs)+86,minY=Math.min(...ys)-58,maxY=Math.max(...ys)+58,bw=Math.max(172,maxX-minX),bh=Math.max(116,maxY-minY),s=Math.max(.55,Math.min(1,(vw-180)/bw,(vh-150)/bh)),cx=(minX+maxX)/2,cy=(minY+maxY)/2;
  state.cameras.graph={s,x:vw/2-cx*s,y:vh/2-cy*s};applyCamera('graph');
}
const openChangeSetGraphR04Base=openChangeSetGraphV18;
openChangeSetGraphV18=function(mode='impact'){
  const ids=changeSetValidV18(),r=openChangeSetGraphR04Base(mode);
  if(ids.length)requestAnimationFrame(()=>requestAnimationFrame(()=>frameChangeSetRootsR04(ids)));
  return r;
};
`;
s=s.replace(anchor,patch+'\n'+anchor);
fs.writeFileSync(p,s);
console.log('applied R04 change-set Graph framing');
