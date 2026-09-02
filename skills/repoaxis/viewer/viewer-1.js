function structureDescendants(id){
  const out=[],q=[id],seen=new Set([id]);
  while(q.length){
    const cur=q.shift();
    for(const n of children(cur))if(!seen.has(n.id)){seen.add(n.id);out.push(n);q.push(n.id)}
  }
  return out
}
function structureFocusTarget(id){
  const n=nodes[id]||nodes[ROOT];
  if(!n)return ROOT;
  if(n.type==='class'||n.type==='function')return containingFile(n)?.id||n.parent||ROOT;
  return n.id
}
function structureWithin(id,rootId){
  let n=nodes[id],seen=new Set;
  while(n&&!seen.has(n.id)){if(n.id===rootId)return true;seen.add(n.id);n=n.parent?nodes[n.parent]:null}
  return false
}
function structureOverviewProjection(){
  const visible=new Set([ROOT]),rootKids=children(ROOT);
  for(const n of rootKids){
    visible.add(n.id);
    if(n.type==='folder')for(const c of children(n.id))if(c.type==='folder')visible.add(c.id)
  }
  return{root:ROOT,visible,total:Object.keys(nodes).length,hidden:Math.max(0,Object.keys(nodes).length-visible.size),mode:'overview'}
}
function structureFocusProjection(rootId){
  const root=nodes[rootId]||nodes[ROOT],visible=new Set([root.id]),depth=new Map([[root.id,0]]),q=[root.id],limit=96;
  while(q.length&&visible.size<limit){
    const id=q.shift(),d=depth.get(id)||0;
    if(d>=2)continue;
    for(const n of children(id)){
      if(visible.size>=limit)break;
      visible.add(n.id);depth.set(n.id,d+1);q.push(n.id)
    }
  }
  const all=structureDescendants(root.id),hiddenByNode=new Map;
  for(const id of visible){
    const hidden=structureDescendants(id).filter(n=>!visible.has(n.id)).length;
    if(hidden)hiddenByNode.set(id,hidden)
  }
  return{root:root.id,visible,total:all.length+1,hidden:Math.max(0,all.length+1-visible.size),hiddenByNode,mode:'focus'}
}
function structureProjection(){
  if(!state.structureFocus)return structureOverviewProjection();
  const desired=structureFocusTarget(state.selected);
  if(!state.structureRoot||!nodes[state.structureRoot]||!structureWithin(desired,state.structureRoot))state.structureRoot=desired;
  return structureFocusProjection(state.structureRoot)
}
function treeLayout(projection){
  const root=nodes[projection.root];if(!root)return{W:900,H:600,pos:{}};
  const visible=projection.visible,pos={},depths={};let leaf=0;
  function walk(id,d){
    const kids=children(id).filter(n=>visible.has(n.id));
    depths[id]=d;
    if(!kids.length){pos[id]=[d,leaf++];return pos[id][1]}
    const ys=kids.map(k=>walk(k.id,d+1)),y=(Math.min(...ys)+Math.max(...ys))/2;
    pos[id]=[d,y];return y
  }
  walk(root.id,0);
  const maxD=Math.max(...Object.values(depths),0),row=projection.mode==='focus'?58:64,gap=projection.mode==='focus'?230:210,
    W=Math.max(1000,180+maxD*gap+220),H=Math.max(620,120+Math.max(1,leaf-1)*row+120);
  for(const id of Object.keys(pos))pos[id]=[100+pos[id][0]*gap,80+pos[id][1]*row];
  return{W,H,pos}
}
function structurePrepareCamera(projection,L,vp){
  const key=`${projection.mode}:${projection.root}:${projection.total}`;
  if(state.structureCameraAnchor===key)return;
  state.structureCameraAnchor=key;
  if(projection.mode!=='overview')return;
  const pts=Object.values(L.pos);if(!pts.length)return;
  const minX=Math.min(...pts.map(p=>p[0]))-42,maxX=Math.max(...pts.map(p=>p[0]))+190,minY=Math.min(...pts.map(p=>p[1]))-36,maxY=Math.max(...pts.map(p=>p[1]))+36,contentW=Math.max(1,maxX-minX),contentH=Math.max(1,maxY-minY),fit=Math.min((vp.w-48)/contentW,(vp.h-48)/contentH),scale=Math.max(.72,Math.min(1,fit)),cx=(minX+maxX)/2,cy=(minY+maxY)/2;
  state.camera.structure={s:scale,x:vp.w/2-cx*scale,y:vp.h/2-cy*scale}
}
function structureGitMarkup(summary,x,y){
  if(!summary)return'';
  if(summary.history)return`<text class="macro-git-line" x="${x+24}" y="${y+16}"><tspan class="git-history">HEAD ${summary.changed}</tspan></text>`;
  const parts=[];if(summary.staged)parts.push(['staged',`S ${summary.staged}`]);if(summary.working)parts.push(['working',`W ${summary.working}`]);if(summary.conflicts)parts.push(['conflict',`! ${summary.conflicts}`]);
  return parts.length?`<text class="macro-git-line" x="${x+24}" y="${y+16}">${parts.map((p,i)=>`<tspan class="git-${p[0]}"${i?' dx="8"':''}>${p[1]}</tspan>`).join('')}</text>`:''
}
function structureCard(n,x,y,projection){
  if(projection.mode==='overview'){
    const code=statusFor(n.id),git=gitScopeSummary(n.id),gitLabel=gitScopeLabel(git),desc=structureDescendants(n.id).length,base=n.type==='root'?10:n.type==='folder'?7:n.type==='file'?5:4,r=Math.min(13,base+Math.log2(desc+1)*.8);
    const label=n.label.length>18?n.label.slice(0,17)+'…':n.label,scopeText=gitLabel?` · ${gitLabel}`:'';
    return`<g class="node macro-node ${state.selected===n.id?'selected':''}" data-id="${esc(n.id)}" role="button" tabindex="0" aria-label="Inspect ${esc(n.label)}; ${desc} descendant${desc===1?'':'s'}${esc(scopeText)}"><title>${esc(n.label)} · ${desc} descendant${desc===1?'':'s'}${esc(scopeText)} · select to inspect · double-click to explore</title><rect class="macro-target" x="${x-22}" y="${y-22}" width="184" height="44" rx="13" fill="transparent"/><circle class="macro-dot" cx="${x}" cy="${y}" r="${r.toFixed(1)}" fill="${code?colorFor(code)[0]:'#fff'}" stroke="${state.selected===n.id?'#625bff':(n.type==='root'||n.type==='folder'?'#817aff':'#cdd3df')}" stroke-width="${state.selected===n.id?2:1.25}"/><circle class="macro-hit" cx="${x}" cy="${y}" r="${Math.max(22,r+10)}"/><text class="macro-label" x="${x+24}" y="${git?y-1:y+4}">${esc(label)}${desc?`<tspan class="macro-count" dx="6">${desc}</tspan>`:''}</text>${structureGitMarkup(git,x,y)}</g>`
  }
  const code=statusFor(n.id),hidden=projection.hiddenByNode?.get(n.id)||0,w=n.type==='function'||n.type==='class'?202:190,h=42,left=x-w/2,iconTxt=n.type==='folder'||n.type==='root'?'▱':n.type==='file'?'◇':n.type==='class'?'C':'ƒ';
  return`<g class="node ${state.selected===n.id?'selected':''}" data-id="${esc(n.id)}"><rect class="bg" x="${left}" y="${y-h/2}" width="${w}" height="${h}" rx="10"/><text x="${left+14}" y="${y+4}" fill="#625bff">${iconTxt}</text><text x="${left+34}" y="${y+4}">${esc(n.label.length>24?n.label.slice(0,23)+'…':n.label)}</text>${hidden?`<text class="sub" x="${left+w-42}" y="${y+4}">+${hidden}</text>`:''}${badgeSvg(code,left+w-24,y-8)}</g>`
}
function enterStructureFocus(id=state.selected||ROOT){
  const root=structureFocusTarget(id);
  state.structureFocus=true;state.structureRoot=root;state.selected=id&&nodes[id]?id:root;state.structureCameraAnchor=null;resetCamera();renderStructure();renderDrawer();updateSelection()
}
function leaveStructureFocus(){
  state.structureFocus=false;state.structureRoot=ROOT;state.structureCameraAnchor=null;resetCamera();renderStructure()
}
function structureOverviewInspectState(id){
  if(!nodes[id])return false;state.selected=id;state.drawer=true;return true
}
function inspectStructureOverview(id){
  if(!structureOverviewInspectState(id))return;$('#content').classList.add('drawer-open');renderStructure();renderDrawer();updateSelection()
}
function renderStructure(){
  const projection=structureProjection(),L=treeLayout(projection),svg=$('#structureSvg'),vp=reconcileSpatialViewport('structure',spatialViewportSize());
  svg.setAttribute('viewBox',`0 0 ${vp.w} ${vp.h}`);structurePrepareCamera(projection,L,vp);
  let h='<g id="structureGraph">';
  for(const n of Object.values(nodes)){
    if(!projection.visible.has(n.id)||!n.parent||!projection.visible.has(n.parent)||!L.pos[n.id]||!L.pos[n.parent])continue;
    const A=L.pos[n.parent],B=L.pos[n.id],pad=projection.mode==='focus'?95:0,m=(A[0]+pad+B[0]-pad)/2;
    h+=`<path class="edge ${state.selected===n.id?'hot':''}" d="M ${A[0]+pad} ${A[1]} C ${m} ${A[1]},${m} ${B[1]},${B[0]-pad} ${B[1]}"/>`
  }
  for(const id of projection.visible){const n=nodes[id];if(n&&L.pos[id])h+=structureCard(n,...L.pos[id],projection)}
  h+='</g>';svg.innerHTML=h;
  const root=nodes[projection.root];
  $('#structureMode').textContent=projection.mode==='focus'?`${root?.repoPath==='.'||root?.id===ROOT?'Repository':root?.repoPath||root?.label} · ${projection.visible.size}/${projection.total} nodes`:`Repository topology · ${projection.visible.size} macro nodes · select to inspect`;
  $('#wholeBtn').hidden=projection.mode!=='focus';$('#labelsBtn').hidden=projection.mode==='focus';
  if(projection.mode==='overview'){const selected=nodes[state.selected];$('#labelsBtn').textContent=state.selected===ROOT?'Explore repository':'Explore selected';$('#labelsBtn').title=`Open ${selected?.repoPath||selected?.label||'selected node'} as focused structure`}
  renderBreadcrumbs();
  if(projection.mode==='overview'){
    svg.querySelectorAll('.node[data-id]').forEach(el=>{el.onclick=()=>inspectStructureOverview(el.dataset.id);el.ondblclick=()=>enterStructureFocus(el.dataset.id);el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();inspectStructureOverview(el.dataset.id)}}})
  }else bindNodes(svg);
  applyCamera();applyFilter()
}
function ancestry(id){
  const out=[];let n=nodes[id],seen=new Set;
  while(n&&!seen.has(n.id)){seen.add(n.id);out.unshift(n);n=n.parent?nodes[n.parent]:null}
  return out
}
function renderBreadcrumbs(){
  const b=$('#breadcrumbs');if(!state.structureFocus){b.hidden=true;return}
  b.hidden=false;
  b.innerHTML=ancestry(state.structureRoot).map((n,i,a)=>`<button class="crumb ${i===a.length-1?'current':''}" data-id="${esc(n.id)}">${esc(n.label)}</button>${i<a.length-1?'<span>›</span>':''}`).join('');
  b.querySelectorAll('[data-id]').forEach(x=>x.onclick=()=>enterStructureFocus(x.dataset.id))
}

function dependencyRootFile(id){
  const n=nodes[id];if(!n)return null;return n.type==='file'?n:containingFile(n)
}
function dependencyApplyRoot(id){
  const f=dependencyRootFile(id);if(!f)return null;state.depRoot=f.id;state.selected=f.id;return f.id
}
function dependencyResetTrail(id){
  const root=dependencyApplyRoot(id);if(!root)return null;state.depInitialRoot=root;state.depRootTrail=[root];return root
}
function dependencyPushRoot(id){
  const root=dependencyRootFile(id)?.id;if(!root)return null;
  const valid=(state.depRootTrail||[]).filter(x=>nodes[x]?.type==='file');
  if(!nodes[state.depInitialRoot]||nodes[state.depInitialRoot].type!=='file')state.depInitialRoot=valid[0]||state.depRoot||root;
  const at=valid.lastIndexOf(root);state.depRootTrail=at>=0?valid.slice(0,at+1):[...valid,root];
  return dependencyApplyRoot(root)
}
function dependencyBackRoot(){
  const valid=(state.depRootTrail||[]).filter(x=>nodes[x]?.type==='file');if(valid.length<=1)return null;valid.pop();state.depRootTrail=valid;return dependencyApplyRoot(valid.at(-1))
}
function dependencyReturnInitialRoot(){
  const initial=dependencyRootFile(state.depInitialRoot)?.id;if(!initial)return null;state.depRootTrail=[initial];return dependencyApplyRoot(initial)
}
function dependencyJumpTrail(index){
  const valid=(state.depRootTrail||[]).filter(x=>nodes[x]?.type==='file');if(index<0||index>=valid.length)return null;state.depRootTrail=valid.slice(0,index+1);return dependencyApplyRoot(valid[index])
}
function dependencyNormalizeTrail(rootId){
  const root=dependencyRootFile(rootId)?.id;if(!root)return[];let trail=(state.depRootTrail||[]).filter(x=>nodes[x]?.type==='file');
  if(!trail.length||trail.at(-1)!==root){const at=trail.lastIndexOf(root);trail=at>=0?trail.slice(0,at+1):[...trail,root]}
  state.depRootTrail=trail;if(!dependencyRootFile(state.depInitialRoot))state.depInitialRoot=trail[0]||root;return trail
}

function depProjection(rootId){const rel=state.depDirection==='importedBy'?(id=>importedBy(id)):(id=>imports(id)),seen=new Map([[rootId,'root']]),items=[];let leaf=0,refs=0,cycles=0,truncated=0;function visit(id,d,parent,key,path){const e={id,d,parent,key,type:key==='root'?'root':'node',kids:[],y:0};items.push(e);if(d>=state.depDepth){truncated+=rel(id).length;return e}for(const n of rel(id)){const k=key+'>'+n.id+':'+e.kids.length;if(path.includes(n.id)){const x={id:n.id,d:d+1,parent:key,key:k,type:'cycle',kids:[],y:0};items.push(x);e.kids.push(x);cycles++;continue}if(seen.has(n.id)){const x={id:n.id,d:d+1,parent:key,key:k,type:'ref',kids:[],y:0};items.push(x);e.kids.push(x);refs++;continue}seen.set(n.id,k);const x=visit(n.id,d+1,key,k,[...path,id]);e.kids.push(x)}return e}const root=visit(rootId,0,null,'root',[]);function layout(e){if(!e.kids.length)return e.y=leaf++;const ys=e.kids.map(layout);return e.y=(Math.min(...ys)+Math.max(...ys))/2}layout(root);return{items,refs,cycles,truncated,leaf:Math.max(1,leaf),unique:seen.size-1}}
function renderDependencies(){const f=nodes[state.depRoot]||mostConnectedFile()||files()[0];if(!f){$('#depShell').innerHTML='<div class="empty">No indexed files.</div>';return}state.depRoot=f.id;if(state.selected===ROOT)state.selected=f.id;const trail=dependencyNormalizeTrail(f.id),initial=dependencyRootFile(state.depInitialRoot),selectedFile=dependencyRootFile(state.selected),canUseSelected=selectedFile&&selectedFile.id!==f.id,p=depProjection(f.id),W=Math.max(1000,180+p.items.reduce((m,x)=>Math.max(m,x.d),0)*250+180),H=Math.max(480,120+(p.leaf-1)*78+110),rootX=state.depDirection==='importedBy'?W-130:130,sign=state.depDirection==='importedBy'?-1:1,pos=new Map();for(const x of p.items)pos.set(x.key,[rootX+sign*x.d*250,80+x.y*(p.leaf>1?(H-180)/(p.leaf-1):0)]);let sh='<g id="depGraph"><defs><marker id="depArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke"/></marker></defs>';for(const x of p.items){if(!x.parent)continue;const A=pos.get(x.parent),B=pos.get(x.key),dir=state.depDirection==='importedBy'?'in':'out',sx=state.depDirection==='importedBy'?B[0]+105:A[0]+105,tx=state.depDirection==='importedBy'?A[0]-105:B[0]-105,m=(sx+tx)/2;sh+=`<path marker-end="url(#depArrow)" class="edge ${dir==='in'?'hot':''} ${x.type==='ref'||x.type==='cycle'?'reference':''}" d="M ${sx} ${state.depDirection==='importedBy'?B[1]:A[1]} C ${m} ${state.depDirection==='importedBy'?B[1]:A[1]},${m} ${state.depDirection==='importedBy'?A[1]:B[1]},${tx} ${state.depDirection==='importedBy'?A[1]:B[1]}"/>`}for(const x of p.items){const n=nodes[x.id],q=pos.get(x.key),w=x.type==='root'?220:210,left=q[0]-w/2,code=statusFor(x.id);sh+=`<g class="node ${state.selected===x.id?'selected':''}" data-id="${esc(x.id)}"><rect class="bg" x="${left}" y="${q[1]-25}" width="${w}" height="50" rx="11" ${x.type==='ref'||x.type==='cycle'?'stroke-dasharray="4 3"':''}/><text x="${left+16}" y="${q[1]-4}">${esc((n?.label||x.id).slice(0,24))}</text><text class="sub" x="${left+16}" y="${q[1]+12}">${esc((x.type==='cycle'?'⟳ cycle · ':x.type==='ref'?'↩ already shown · ':'')+(n?.repoPath||'').slice(0,30))}</text>${badgeSvg(code,left+w-25,q[1]-20)}</g>`}sh+='</g>';const trailHtml=trail.length>1?`<div class="dep-trail"><span>Root trail</span>${trail.map((id,i)=>{const n=nodes[id];return `<button class="dep-trail-node ${i===trail.length-1?'current':''}" data-trail-index="${i}" title="${esc(n?.repoPath||id)}">${esc(n?.label||id)}</button>${i<trail.length-1?'<i>›</i>':''}`}).join('')}</div>`:'';$('#depShell').innerHTML=`<div class="dep-command"><button class="mini" id="depBack" ${trail.length>1?'':'disabled'}>← Back</button><button class="root-pill" id="rootPill"><span>Root</span><b>${esc(f.repoPath)}</b><span>⌄</span></button>${canUseSelected?`<button class="mini dep-use-root" id="depUseRoot">Use selected as root</button>`:''}${initial&&initial.id!==f.id?'<button class="mini" id="depInitialRoot">Initial root</button>':''}<div class="direction"><button data-dir="importedBy" class="${state.depDirection==='importedBy'?'active':''}">← Imported by</button><button data-dir="imports" class="${state.depDirection==='imports'?'active':''}">Imports →</button></div><button class="mini" id="depthBtn">Depth ${state.depDepth} · bounded</button><div class="spacer"></div>${trailHtml}</div><div class="dep-insight"><div><strong>${state.depDirection==='importedBy'?'Impact tree':'Requirement tree'}</strong><br><span>Canonical repository-local imports projected from one explicit root.</span></div><div class="dep-stats"><span><b>${p.unique}</b>reachable</span><span><b>${p.refs}</b>repeated routes</span><span><b>${importedBy(f.id).length} / ${imports(f.id).length}</b>in / out direct</span></div></div><div class="dep-tree"><svg class="dep-svg" id="depSvg">${sh}</svg><div class="dep-bound">1 root · depth ≤ ${state.depDepth}${p.truncated?` · ${p.truncated} deeper hidden`:''}${p.cycles?` · ${p.cycles} cycle`:''}</div></div><div class="root-menu" id="rootMenu" hidden><input id="rootSearch" placeholder="Choose root file…"><div class="root-list" id="rootList"></div></div>`;const depSvg=$('#depSvg'),depRect=depSvg?.getBoundingClientRect(),depVp=reconcileSpatialViewport('dependencies',{w:Math.max(640,Math.round(depRect?.width||640)),h:Math.max(420,Math.round(depRect?.height||420))});depSvg?.setAttribute('viewBox',`0 0 ${depVp.w} ${depVp.h}`);const navigate=id=>{if(!id)return;resetCamera();renderDependencies();renderDrawer();updateSelection()};$('#depBack').onclick=()=>navigate(dependencyBackRoot());$('#depUseRoot')?.addEventListener('click',()=>navigate(dependencyPushRoot(selectedFile.id)));$('#depInitialRoot')?.addEventListener('click',()=>navigate(dependencyReturnInitialRoot()));$$('[data-trail-index]').forEach(b=>b.onclick=()=>navigate(dependencyJumpTrail(Number(b.dataset.trailIndex))));$('#rootPill').onclick=e=>{e.stopPropagation();$('#rootMenu').hidden=!$('#rootMenu').hidden;renderRootMenu('')};$('#rootSearch').oninput=e=>renderRootMenu(e.target.value);$$('[data-dir]').forEach(b=>b.onclick=()=>{state.depDirection=b.dataset.dir;resetCamera();renderDependencies()});$('#depthBtn').onclick=()=>{state.depDepth=state.depDepth>=4?2:state.depDepth+1;resetCamera();renderDependencies()};bindNodes($('#depSvg'));applyCamera()}
function renderRootMenu(q){const list=$('#rootList');if(!list)return;const k=q.toLowerCase(),opts=files().filter(f=>!k||f.repoPath.toLowerCase().includes(k)).sort((a,b)=>a.repoPath.localeCompare(b.repoPath));list.innerHTML=opts.map(f=>`<button class="root-option ${f.id===state.depRoot?'current':''}" data-id="${esc(f.id)}"><span>${icons.file}</span><span class="main"><b>${esc(f.label)}</b><small>${esc(f.repoPath)}</small></span><small>${importedBy(f.id).length} in · ${imports(f.id).length} out</small></button>`).join('');list.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{dependencyPushRoot(b.dataset.id);$('#rootMenu').hidden=true;resetCamera();renderDependencies();renderDrawer();updateSelection()})}
