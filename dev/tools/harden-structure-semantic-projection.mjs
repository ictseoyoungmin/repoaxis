import fs from 'node:fs';
const p='skills/repoaxis/viewer/repoaxis.html';let s=fs.readFileSync(p,'utf8');const marker='window.__REPOAXIS_LIVE__=repositoryRuntime;bootRepository();';if(!s.includes(marker))throw new Error('boot marker missing');if(s.includes('function semanticStructureProjection('))throw new Error('already applied');
const block=String.raw`

/* Progressive semantic containment: preserve repository context and expand the selected path in-place. */
function semanticStructureProjection(selectedId=state.selected){
  const selected=byId[selectedId]||byId.root,ids=new Set(['root']),path=semanticStructurePath(selected.id);
  children('root').forEach(n=>ids.add(n.id));
  for(const id of path){ids.add(id);for(const c of children(id))ids.add(c.id)}
  if(selected.type==='folder')for(const c of children(selected.id))if(c.type==='file')for(const fn of children(c.id))ids.add(fn.id);
  if(selected.type==='file')for(const fn of children(selected.id))ids.add(fn.id);
  return ids;
}
function layoutSemanticStructureProjection(ids){
  const kids=new Map(),entries=new Map();for(const id of ids){const n=byId[id];if(n?.parent&&ids.has(n.parent))(kids.get(n.parent)||kids.set(n.parent,[]).get(n.parent)).push(n)}
  const rank={folder:0,file:1,function:2};for(const arr of kids.values())arr.sort((a,b)=>(rank[a.type]-rank[b.type])||String(a.path||a.label).localeCompare(String(b.path||b.label)));
  let leaf=0,maxDepth=0;function walk(id,depth){maxDepth=Math.max(maxDepth,depth);const arr=kids.get(id)||[],e={id,depth,y:0};entries.set(id,e);if(!arr.length){e.y=leaf++;return e.y}const ys=arr.map(n=>walk(n.id,depth+1));e.y=(Math.min(...ys)+Math.max(...ys))/2;return e.y}walk('root',0);
  const vp=stageViewport('#structureStage',860,560),rowGap=58,depthGap=212,left=96,right=180,top=72,bottom=72,leaves=Math.max(1,leaf),W=Math.max(vp.w,left+right+maxDepth*depthGap),H=Math.max(vp.h,top+bottom+(leaves-1)*rowGap),pos={};for(const e of entries.values())pos[e.id]=[left+e.depth*depthGap,top+e.y*rowGap];
  const viewW=Math.max(860,vp.w),viewH=Math.max(560,vp.h),fit=Math.min(1,(viewW-96)/W,(viewH-86)/H);return{W,H,viewW,viewH,fit,pos,ids};
}
semanticStructureLayout=function(){const layout=layoutSemanticStructureProjection(semanticStructureProjection());semanticStructurePositions=layout.pos;semanticStructureWorld=layout;overviewPositions=layout.pos;return layout};
semanticStructureDetailSet=function(id){const selected=byId[id]||byId.root,set=new Set(semanticStructurePath(selected.id));set.add(selected.id);const parent=selected.parent?byId[selected.parent]:null;if(parent)children(parent.id).forEach(n=>set.add(n.id));children(selected.id).forEach(n=>{set.add(n.id);if(selected.type==='folder'&&n.type==='file')children(n.id).forEach(c=>set.add(c.id))});if(selected.type==='file')children(selected.id).forEach(n=>set.add(n.id));return set};
function semanticStructureNeighborhoodBounds(id){const ids=semanticStructureDetailSet(id),pts=[...ids].map(x=>semanticStructurePositions[x]).filter(Boolean);if(!pts.length)return null;return{minX:Math.min(...pts.map(p=>p[0])),maxX:Math.max(...pts.map(p=>p[0])),minY:Math.min(...pts.map(p=>p[1])),maxY:Math.max(...pts.map(p=>p[1]))}}
frameSemanticStructureSelection=function(id){semanticStructureLayout();const p=semanticStructurePositions[id],b=semanticStructureNeighborhoodBounds(id);if(!p||!b)return;const w=semanticStructureWorld,bw=Math.max(360,b.maxX-b.minX+220),bh=Math.max(260,b.maxY-b.minY+110),fitNeighborhood=Math.min((w.viewW-170)/bw,(w.viewH-150)/bh),s=Math.max(.78,Math.min(1.05,fitNeighborhood));state.cameras.structureOverview={s:s,x:w.viewW/2-p[0]*s,y:w.viewH/2-p[1]*s};applyCamera('structureOverview');updateSemanticStructureLod()};
updateSemanticStructureLod=function(){if(state.view!=='structure'||state.mode!=='overview')return;const scale=state.cameras.structureOverview?.s||semanticStructureWorld.fit,detail=semanticStructureDetailSet(state.selected),show=scale>=Math.max(.62,semanticStructureWorld.fit*1.25);document.querySelectorAll('#overviewSvg .semantic-node').forEach(el=>{const on=show&&detail.has(el.dataset.id);el.querySelector('.semantic-glyph')?.toggleAttribute('hidden',on);el.querySelector('.semantic-detail')?.toggleAttribute('hidden',!on)});const label=$('#modeLabel');if(label)label.textContent=show?'Whole repository · semantic detail':'Whole repository · semantic overview'};
`;
s=s.replace(marker,block+'\n'+marker);fs.writeFileSync(p,s);
