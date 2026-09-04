import fs from 'node:fs';
const htmlPath='skills/repoaxis/viewer/repoaxis.html';
const testPath='dev/tests/integration/viewer.test.mjs';
let s=fs.readFileSync(htmlPath,'utf8');
if(s.includes('function overviewVisibleBBoxR05'))throw new Error('R05 already applied');
const liveTreeRe=/function liveTreeV47\(index,meta\)\{[^\n]*\}\nfunction liveImportsV47/;
if(!liveTreeRe.test(s))throw new Error('liveTreeV47 seam missing');
const liveTree=`function liveTreeV47(index,meta){
  const raw=Object.values(index.generated?.nodes||{}),parent=new Map();
  for(const e of index.generated?.edges||[])if(e.type==='contains'&&!parent.has(e.to))parent.set(e.to,e.from);
  const canonicalRoot=raw.find(n=>n.type==='folder'&&(n.path==='.'||n.path==='./')),canonicalRootId=canonicalRoot?.id||null;
  const out=[{id:'root',parent:null,type:'root',label:'root/',path:'/',language:'—',lines:0,complexity:0,note:\`${'${'}meta.display_name||'Repository'} · live Repoaxis containment root.\`}];
  const nodes=raw.filter(n=>n.id!==canonicalRootId).map(n=>{
    const type=n.type==='class'?'function':n.type,s=n.source||{},lines=s.start_line&&s.end_line?Math.max(1,s.end_line-s.start_line+1):(n.meta?.lines||0),rawParent=parent.get(n.id)||n.parent_id||'root',mappedParent=rawParent===canonicalRootId?'root':rawParent;
    return{id:n.id,parent:mappedParent,type,label:liveLabelV47(n),path:(type==='function'&&s.start_line)?\`${'${'}n.path}:${'${'}s.start_line}\`:n.path,status:liveGitCodeV47(n.git)||undefined,language:liveLanguageV47(n),location:s.start_line?\`${'${'}s.start_line}${'${'}s.end_line&&s.end_line!==s.start_line?'–'+s.end_line:''}\`:undefined,lines,complexity:n.meta?.complexity||n.meta?.cyclomatic_complexity||0,params:n.meta?.params||n.meta?.parameter_count||undefined,note:index.annotations?.[n.id]?.agent_note||undefined};
  });
  const ids=new Set(nodes.map(n=>n.id));for(const n of nodes)if(n.parent!=='root'&&!ids.has(n.parent))n.parent='root';
  const rank={folder:0,file:1,function:2};nodes.sort((a,b)=>(rank[a.type]-rank[b.type])||String(a.path).localeCompare(String(b.path))||a.id.localeCompare(b.id));out.push(...nodes);return out
}
function liveImportsV47`;
s=s.replace(liveTreeRe,liveTree);
const anchor='window.__REPOAXIS_LIVE__=liveV47;bootLiveV47();';
if(!s.includes(anchor))throw new Error('live boot anchor missing');
const patch=String.raw`

/* R05 canonical-root collapse + hydration-safe overview helper geometry. */
const OVERVIEW_HELPERS_R05='.overview-hit-zone,.overview-hover-ring,.overview-assist-zone';
let overviewGenerationR05=0;
function overviewVisibleBBoxR05(el){
  const boxes=[];
  for(const child of Array.from(el.children||[])){
    if(child.matches?.(OVERVIEW_HELPERS_R05))continue;
    let b;try{b=child.getBBox()}catch{continue}
    if(!b||![b.x,b.y,b.width,b.height].every(Number.isFinite)||b.width<0||b.height<0)continue;
    boxes.push(b);
  }
  if(!boxes.length)return null;
  const x=Math.min(...boxes.map(b=>b.x)),y=Math.min(...boxes.map(b=>b.y)),x2=Math.max(...boxes.map(b=>b.x+b.width)),y2=Math.max(...boxes.map(b=>b.y+b.height));
  return{x,y,width:Math.max(.01,x2-x),height:Math.max(.01,y2-y)};
}
function clearOverviewAcquisitionR05(){
  overviewNativePickV33.press=null;
  $$('#overviewSvg .overview-node').forEach(el=>{el.classList.remove('acquisition-armed');el.__visibleBBoxV37=null});
}
installOverviewHitZonesV33=function(){
  if(state.mode!=='overview')return;
  const svg=$('#overviewSvg'),stage=$('#structureStage');if(!svg||!stage)return;
  $$('#overviewSvg .overview-node').forEach(el=>{
    el.onclick=null;el.querySelectorAll('.overview-hit-zone,.overview-hover-ring').forEach(n=>n.remove());
    const box=overviewVisibleBBoxR05(el);if(!box)return;
    const ns='http://www.w3.org/2000/svg',hit=document.createElementNS(ns,'rect'),ring=document.createElementNS(ns,'rect');
    hit.setAttribute('class','overview-hit-zone');hit.setAttribute('x',box.x);hit.setAttribute('y',box.y);hit.setAttribute('width',box.width);hit.setAttribute('height',box.height);hit.setAttribute('rx','5');
    ring.setAttribute('class','overview-hover-ring');ring.setAttribute('x',box.x-2);ring.setAttribute('y',box.y-2);ring.setAttribute('width',box.width+4);ring.setAttribute('height',box.height+4);ring.setAttribute('rx','7');
    el.insertBefore(hit,el.firstChild);el.insertBefore(ring,hit.nextSibling);
    if(!el.__overviewHitBoundR05){el.__overviewHitBoundR05=true;el.addEventListener('pointerdown',e=>{if(state.mode!=='overview'||e.button!==0)return;const c=state.cameras.structureOverview;overviewNativePickV33.press={id:el.dataset.id,x:e.clientX,y:e.clientY,ox:c.x,oy:c.y,pointerId:e.pointerId,dragging:false};try{stage.setPointerCapture(e.pointerId)}catch{}e.preventDefault();e.stopPropagation()})}
  });
};
installOverviewAssistZonesV37=function(){
  if(state.mode!=='overview')return;const ns='http://www.w3.org/2000/svg';
  $$('#overviewSvg .overview-node').forEach(el=>{
    el.querySelectorAll('.overview-assist-zone').forEach(n=>n.remove());const box=overviewVisibleBBoxR05(el);if(!box)return;
    el.__visibleBBoxV37={x:box.x,y:box.y,width:box.width,height:box.height};const assist=document.createElementNS(ns,'rect');assist.setAttribute('class','overview-assist-zone');el.insertBefore(assist,el.firstChild);sizeOverviewAssistZoneV37(el);
    el.onpointerenter=()=>{if(state.mode!=='overview')return;el.classList.add('acquisition-armed');sizeOverviewAssistZoneV37(el)};el.onpointerleave=()=>{if(state.mode!=='overview')return;el.classList.remove('acquisition-armed')};
  });
};
const renderOverviewR05Base=renderOverview;
renderOverview=function(){
  const generation=++overviewGenerationR05;clearOverviewAcquisitionR05();const r=renderOverviewR05Base();
  requestAnimationFrame(()=>{if(generation!==overviewGenerationR05||state.mode!=='overview')return;installOverviewHitZonesV33();installOverviewAssistZonesV37();refreshOverviewAssistZonesV37()});return r;
};
`;
s=s.replace('tree.splice(0,tree.length,...liveTreeV47(idx.index,meta));','clearOverviewAcquisitionR05();tree.splice(0,tree.length,...liveTreeV47(idx.index,meta));');
s=s.replace(anchor,patch+'\n'+anchor);
fs.writeFileSync(htmlPath,s);
let t=fs.readFileSync(testPath,'utf8');
const needle="assert.match(html,/connected\\.has\\(f\\.id\\)\\|\\|changed\\.has\\(f\\.id\\)/);";
if(!t.includes(needle))throw new Error('viewer contract insertion seam missing');
const add=needle+"assert.match(html,/canonicalRoot=raw\\.find\\(n=>n\\.type===['\"]folder['\"]&&\\(n\\.path===['\"]\\.['\"]\\|\\|n\\.path===['\"]\\.\\/['\"]\\)\\)/);assert.match(html,/rawParent===canonicalRootId\\?['\"]root['\"]:rawParent/);assert.match(html,/function overviewVisibleBBoxR05\\(/);assert.match(html,/OVERVIEW_HELPERS_R05/);assert.match(html,/generation!==overviewGenerationR05/);assert.match(html,/clearOverviewAcquisitionR05\\(\\);tree\\.splice/);";
t=t.replace(needle,add);fs.writeFileSync(testPath,t);
console.log('applied V47-R05 canonical root collapse and hydration-safe overview geometry');
