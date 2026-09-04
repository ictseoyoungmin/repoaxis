import fs from 'node:fs';
const p='skills/repoaxis/viewer/repoaxis.html';
let s=fs.readFileSync(p,'utf8');
const marker='window.__REPOAXIS_LIVE__=repositoryRuntime;bootRepository();';
if(!s.includes(marker))throw new Error('boot marker not found');
if(s.includes('function semanticStructureLayout('))throw new Error('semantic zoom already applied');
const block=String.raw`

/* Structure semantic zoom: one canonical containment world, detail changes with camera scale. */
let semanticStructurePositions={},semanticStructureWorld={W:1180,H:760,viewW:1180,viewH:760,fit:1};
function semanticStructureLayout(){
  const kids=new Map();for(const n of tree)if(n.parent)(kids.get(n.parent)||kids.set(n.parent,[]).get(n.parent)).push(n);
  const rank={folder:0,file:1,function:2};for(const arr of kids.values())arr.sort((a,b)=>(rank[a.type]-rank[b.type])||String(a.path||a.label).localeCompare(String(b.path||b.label)));
  const entries=new Map();let leaf=0,maxDepth=0;
  function walk(id,depth){maxDepth=Math.max(maxDepth,depth);const arr=kids.get(id)||[],e={id,depth,y:0};entries.set(id,e);if(!arr.length){e.y=leaf++;return e.y}const ys=arr.map(n=>walk(n.id,depth+1));e.y=(Math.min(...ys)+Math.max(...ys))/2;return e.y}
  walk('root',0);
  const vp=stageViewport('#structureStage',860,560),rowGap=54,depthGap=224,left=96,right=190,top=70,bottom=70,leaves=Math.max(1,leaf),W=Math.max(vp.w,left+right+maxDepth*depthGap),H=Math.max(vp.h,top+bottom+(leaves-1)*rowGap),pos={};
  for(const e of entries.values())pos[e.id]=[left+e.depth*depthGap,top+e.y*rowGap];
  const viewW=Math.max(860,vp.w),viewH=Math.max(560,vp.h),fit=Math.min(1,(viewW-90)/W,(viewH-80)/H);
  semanticStructurePositions=pos;semanticStructureWorld={W,H,viewW,viewH,fit};overviewPositions=pos;
  return semanticStructureWorld;
}
function semanticStructurePath(id){const out=[];let n=byId[id];while(n){out.push(n.id);n=n.parent?byId[n.parent]:null}return out.reverse()}
function semanticStructureDetailSet(id){
  const selected=byId[id]||byId.root,set=new Set(semanticStructurePath(selected.id));
  const add=n=>{if(n)set.add(n.id)};
  const parent=selected.parent?byId[selected.parent]:null;if(parent){add(parent);children(parent.id).slice(0,18).forEach(add)}
  const queue=[{n:selected,d:0}];let count=set.size;
  while(queue.length&&count<42){const {n,d}=queue.shift();if(d>=2)continue;for(const c of children(n.id)){if(count>=42)break;if(!set.has(c.id)){set.add(c.id);count++}if(c.type==='folder'||c.type==='file')queue.push({n:c,d:d+1})}}
  if(selected.id==='root')children('root').slice(0,22).forEach(add);
  return set;
}
function semanticStructureEdgePath(a,b){const A=semanticStructurePositions[a],B=semanticStructurePositions[b];if(!A||!B)return'';const m=(A[0]+B[0])/2;return 'M '+A[0]+' '+A[1]+' C '+m+' '+A[1]+', '+m+' '+B[1]+', '+B[0]+' '+B[1]}
function semanticStructureGlyph(n,x,y){const isRoot=n.id==='root',stroke=isRoot?'#625bff':n.type==='folder'?'#8a82ff':'#cdd3df';return isRoot||n.type==='folder'?`${isRoot?`<circle class="root-halo" cx="${x}" cy="${y}" r="18"/>`:''}<rect class="semantic-glyph-shape" x="${x-7}" y="${y-7}" width="14" height="14" rx="4" fill="#fff" stroke="${stroke}" stroke-width="${isRoot?2:1.4}"/>`:`<circle class="semantic-glyph-shape" cx="${x}" cy="${y}" r="${n.type==='function'?5.5:4.8}" fill="${n.type==='function'?'#f7f6ff':'#fff'}" stroke="${stroke}" stroke-width="1.2"/>`}
function updateSemanticStructureLod(){
  if(state.view!=='structure'||state.mode!=='overview')return;const scale=state.cameras.structureOverview?.s||semanticStructureWorld.fit,detail=semanticStructureDetailSet(state.selected),show=scale>=Math.max(.72,semanticStructureWorld.fit*2.2);
  document.querySelectorAll('#overviewSvg .semantic-node').forEach(el=>{const on=show&&detail.has(el.dataset.id);el.querySelector('.semantic-glyph')?.toggleAttribute('hidden',on);el.querySelector('.semantic-detail')?.toggleAttribute('hidden',!on)});
  const label=$('#modeLabel');if(label)label.textContent=show?'Whole repository · semantic detail':'Whole repository · semantic overview';
}
function renderSemanticStructureOverview(){
  const {viewW,viewH}=semanticStructureLayout(),detailPath=new Set(semanticStructurePath(state.selected)),selected=byId[state.selected]||byId.root;$('#overviewSvg').setAttribute('viewBox','0 0 '+viewW+' '+viewH);
  let h='<g id="overviewGraph">';
  for(const n of tree){if(!n.parent||!semanticStructurePositions[n.id]||!semanticStructurePositions[n.parent])continue;const hot=detailPath.has(n.id)||n.parent===selected.id;h+=`<path class="edge ${hot?'hot':''}" data-semantic-edge="${esc(n.id)}" d="${semanticStructureEdgePath(n.parent,n.id)}"/>`}
  for(const n of tree){const p=semanticStructurePositions[n.id];if(!p)continue;h+=`<g class="overview-node semantic-node" data-id="${esc(n.id)}"><g class="semantic-glyph">${semanticStructureGlyph(n,p[0],p[1])}</g><g class="semantic-detail" hidden>${nodeCard(n,p[0],p[1])}</g></g>`}
  $('#overviewSvg').innerHTML=h+'</g>';applyCamera('structureOverview');updateSemanticStructureLod();applyOverviewGit();const count=$('#cardCount');if(count)count.textContent=String(Math.max(0,tree.length-1));
  const generation=++overviewGeneration;requestAnimationFrame(()=>{if(generation!==overviewGeneration||state.mode!=='overview')return;installOverviewHitZones();installOverviewAssistZones();refreshOverviewAssistZones()});
}
function fitSemanticStructure(){semanticStructureLayout();const w=semanticStructureWorld,fit=w.fit;state.cameras.structureOverview={s:fit,x:(w.viewW-w.W*fit)/2,y:(w.viewH-w.H*fit)/2};applyCamera('structureOverview');updateSemanticStructureLod()}
function frameSemanticStructureSelection(id){
  semanticStructureLayout();const p=semanticStructurePositions[id];if(!p)return;const w=semanticStructureWorld,s=Math.max(1,Math.min(1.18,1/Math.max(.001,w.fit)*.42));state.cameras.structureOverview={s,x:w.viewW/2-p[0]*s,y:w.viewH/2-p[1]*s};applyCamera('structureOverview');updateSemanticStructureLod();
}
renderOverview=function(){renderSemanticStructureOverview()};
renderOverviewSelectionCard=function(){};
overviewSelectionAnchor=function(id){return id};
frameStructureOverviewSelection=function(id){requestAnimationFrame(()=>frameSemanticStructureSelection(id))};
selectStructureOverview=function(id,{drawer=true,zoom=true}={}){
  if(!byId[id])return;state.view='structure';state.mode='overview';state.selected=id;state.drawer=drawer;$('#structureStage').classList.remove('focused');$('#content').classList.toggle('drawer-open',drawer);$('#hint')?.classList.add('hide');switchViewUI();renderSemanticStructureOverview();renderDrawer();updateGlobalSelection();if(zoom)frameStructureOverviewSelection(id);
};
const applyCameraBeforeSemanticStructure=applyCamera;
applyCamera=function(key=cameraKey()){const r=applyCameraBeforeSemanticStructure(key);if(key==='structureOverview')requestAnimationFrame(updateSemanticStructureLod);return r};
const semanticFitPrevious=$('#fitBtn')?.onclick;if($('#fitBtn'))$('#fitBtn').onclick=()=>{if(state.view==='structure'&&state.mode==='overview')fitSemanticStructure();else semanticFitPrevious?.()};
const bootRepositoryBeforeSemanticZoom=bootRepository;
bootRepository=async function(){await bootRepositoryBeforeSemanticZoom();if(repositoryRuntime.ready&&state.view==='structure'&&state.mode==='overview'){renderSemanticStructureOverview();fitSemanticStructure()}};
`;
s=s.replace(marker,block+'\n'+marker);
fs.writeFileSync(p,s);
