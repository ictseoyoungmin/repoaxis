/* U17 — cross-view selection continuity and arrival feedback. */
(function(){
  const ARRIVAL_MS=1400;
  const style=document.createElement('style');
  style.textContent=`
.node.arrival-target .bg{stroke:#625bff!important;stroke-width:2.6!important;filter:drop-shadow(0 0 7px rgba(98,91,255,.35));animation:repoaxisArrivalPulse .7s ease-in-out 2}
.node.arrival-target.macro-node .macro-dot{stroke:#625bff!important;stroke-width:3!important;filter:drop-shadow(0 0 7px rgba(98,91,255,.38));animation:repoaxisArrivalPulse .7s ease-in-out 2}
.change-row.arrival-target{position:relative;z-index:1;box-shadow:inset 3px 0 #625bff,0 0 0 2px rgba(98,91,255,.14);animation:repoaxisArrivalRow .7s ease-in-out 2}
.jump .jump-icon{width:17px;height:17px;display:grid;place-items:center;color:#625bff;flex:none}.jump .jump-icon svg{width:17px;height:17px}.jump .jump-copy{min-width:0;flex:1}.jump .jump-main,.jump .jump-sub{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.jump .jump-main{font-size:9px;font-weight:720}.jump .jump-sub{font-size:8px;color:#9299a7;margin-top:2px}.jump .jump-ext{font-size:13px;color:#9aa1ad;flex:none}
@media (min-width:1100px) and (max-width:1360px){.topbar{gap:10px;padding-left:18px;padding-right:18px}.brand{min-width:150px}.brand svg{width:140px}.repo-pill{min-width:190px;max-width:210px}.repo-name{max-width:132px}.branch{max-width:205px;padding-left:10px;overflow:hidden}.branch>span:first-of-type{overflow:hidden;text-overflow:ellipsis}.selection-context{display:flex!important;width:190px;min-width:190px}.search-trigger{width:210px}.sel-view{display:none}}
@keyframes repoaxisArrivalPulse{0%,100%{opacity:1}50%{opacity:.68}}
@keyframes repoaxisArrivalRow{0%,100%{background:#f8f7ff}50%{background:#efedff}}
`;
  document.head.appendChild(style);

  function crossViewTargetsU17(n){
    const f=n&&(n.type==='file'?n:containingFile(n));
    if(state.view==='structure')return f?['dependencies','graph']:[];
    if(state.view==='dependencies')return f?['structure','graph']:['structure'];
    if(state.view==='graph')return f?['structure','dependencies']:['structure'];
    if(state.view==='changes')return f?['structure','dependencies']:['structure'];
    return [];
  }
  function crossViewActionMetaU17(n,v){
    const f=n&&(n.type==='file'?n:containingFile(n));
    if(v==='structure')return{main:`Structure · ${n.label}`,sub:'Exact containment node'};
    if(!f)return{main:`View in ${v}`,sub:'No file-level projection available'};
    if(v==='dependencies')return{main:`Dependencies · ${f.label}`,sub:n.id===f.id?'Selected file becomes root':`${n.label} → containing file · becomes root`};
    if(v==='graph')return{main:`Graph · ${f.label}`,sub:n.id===f.id?'Exact file-level import node':`${n.label} → containing file · file-level graph`};
    if(v==='changes')return{main:`Changes · ${f.label}`,sub:'Exact changed-file projection'};
    return{main:`View in ${v}`,sub:'Preserve selection context'};
  }
  function renderCrossViewActionsU17(n){
    const host=$('#entityActions');if(!host||!n)return;
    const targets=crossViewTargetsU17(n).slice(0,2);
    host.innerHTML=targets.map(v=>{const m=crossViewActionMetaU17(n,v);return `<button class="jump" data-v="${v}"><span class="jump-icon">${icons[v]||icons.file}</span><span class="jump-copy"><span class="jump-main">${esc(m.main)}</span><span class="jump-sub">${esc(m.sub)}</span></span><span class="jump-ext">↗</span></button>`}).join('');
    host.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>navigateSelectionTo(b.dataset.v));
  }
  function arrivalHostU17(view){
    if(view==='structure')return state.structureFocus?($('#focusSvg')||$('#structureSvg')):($('#overviewSvg')||$('#structureSvg')); /* legacy: if(view==='structure')return $('#structureSvg') */
    if(view==='dependencies')return $('#depSvg');
    if(view==='graph')return $('#graphSvg');
    if(view==='changes')return $('#changesShell');
    return null;
  }
  function scheduleArrivalFeedback(id,view){
    setTimeout(()=>{
      const host=arrivalHostU17(view);if(!host)return;
      const el=[...host.querySelectorAll('[data-id]')].find(x=>x.dataset.id===id);if(!el)return;
      el.classList.remove('arrival-target');void el.getBoundingClientRect();el.classList.add('arrival-target');
      clearTimeout(el.__repoaxisArrivalTimer);el.__repoaxisArrivalTimer=setTimeout(()=>el.classList.remove('arrival-target'),ARRIVAL_MS);
    },60);
  }
  function projectionContextU17(source,target,view){
    const projected=source.id!==target.id;
    const role=view==='dependencies'?'dependency root':view==='graph'?'graph projection':view==='changes'?'changed file':'containment node';
    return{sourceId:source.id,targetId:target.id,view,projected,projectionReason:projected?'Containing file projection':'Exact selection',message:projected?`Containing file · ${source.label} → ${target.label} · ${role}`:`${target.label} · ${role}`};
  }
  function applyCrossViewSelectionContextU17(){
    const c=state.crossView;if(!c||c.view!==state.view||c.targetId!==state.selected)return;
    const detail=$('#selDetail');if(detail)detail.textContent=c.message;
  }
  function navigateSelectionTo(view){
    const source=nodes[state.selected]||nodes[ROOT];if(!source)return false;
    const file=source.type==='file'?source:containingFile(source);
    let target=source;
    if(view==='dependencies'||view==='graph'||view==='changes'){
      if(!file)return false;target=file;
      if(view==='changes'&&!activeChanges().some(c=>c.id===target.id))return false;
    }
    if(view==='structure'){
      state.structureFocus=true;state.structureRoot=structureFocusTarget(source.id);state.structureCameraAnchor=null;
    }else if(view==='dependencies'){
      dependencyPushRoot(target.id);state.dependencyCameraAnchor=null;
    }else if(view==='graph'){
      state.impact=null;state.graphNeighborhood=false;state.graphCameraAnchor=null;
    }
    state.drawer=true;$('#content').classList.add('drawer-open');
    switchView(view,target.id);
    state.crossView=projectionContextU17(source,target,view);
    state.drawer=true;$('#content').classList.add('drawer-open');
    renderDrawer();updateSelection();applyCrossViewSelectionContextU17();
    scheduleArrivalFeedback(target.id,view);
    return true;
  }

  const renderDrawerU16=renderDrawer;
  renderDrawer=function(){const r=renderDrawerU16();renderCrossViewActionsU17(nodes[state.selected]||nodes[ROOT]);return r};
  if(typeof updateSelection==='function'){
    const updateSelectionU16=updateSelection;
    updateSelection=function(){const r=updateSelectionU16();applyCrossViewSelectionContextU17();return r};
  }
  if(typeof select==='function'){
    const selectU16=select;
    select=function(id){state.crossView=null;return selectU16(id)};
  }
  window.navigateSelectionTo=navigateSelectionTo;
  window.scheduleArrivalFeedback=scheduleArrivalFeedback;
})();
