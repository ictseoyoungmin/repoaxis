import fs from 'node:fs';
const p='skills/repoaxis/viewer/repoaxis.html';
let s=fs.readFileSync(p,'utf8');
const oldMode='<button class="mini-action" id="labelsBtn">Show labels</button></div>';
const newMode='<button class="mini-action" id="labelsBtn">Show labels</button><button class="mini-action" id="localFocusBtn" title="Show only the selected local containment context">Focus selection</button></div>';
if(!s.includes(oldMode)) throw new Error('Structure mode strip seam not found');
s=s.replace(oldMode,newMode);
const marker='window.__REPOAXIS_LIVE__=repositoryRuntime;bootRepository();';
if(!s.includes(marker)) throw new Error('repository boot seam not found');
const code=String.raw`
/* Structure keeps the repository map intact by default. Local containment is an explicit option. */
function renderOverviewSelectionCard(){
  const graph=$('#overviewGraph'),n=byId[state.selected],p=overviewPositions?.[state.selected];
  graph?.querySelector('[data-overview-selection-card]')?.remove();
  if(!graph||!n||!p||state.mode==='focus')return;
  const holder=document.createElementNS('http://www.w3.org/2000/svg','g');
  holder.setAttribute('data-overview-selection-card','');
  holder.innerHTML=nodeCard(n,p[0],p[1]);
  const card=holder.firstElementChild;
  if(!card)return;
  card.classList.add('overview-selection-card');
  card.onclick=e=>{e.stopPropagation();selectStructureOverview(n.id,{zoom:false})};
  graph.appendChild(holder);
}
function wireOverviewSelection(){
  document.querySelectorAll('#overviewSvg .overview-node').forEach(el=>el.onclick=()=>selectStructureOverview(el.dataset.id));
}
function frameStructureOverviewSelection(id){
  requestAnimationFrame(()=>{
    const c=state.cameras.structureOverview||{s:1,x:0,y:0};
    state.cameras.structureOverview={s:Math.max(c.s||1,1.45),x:c.x||0,y:c.y||0};
    applyCamera('structureOverview');
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      const target=document.querySelector('#overviewSvg [data-overview-selection-card] .node-card')||document.querySelector('#overviewSvg .overview-node[data-id="'+CSS.escape(id)+'"]');
      const svg=$('#overviewSvg'),host=$('#structureStage');
      if(!target||!svg||!host)return;
      const tr=target.getBoundingClientRect(),hr=host.getBoundingClientRect(),sr=svg.getBoundingClientRect(),vb=svg.viewBox?.baseVal;
      if(!vb?.width||!vb?.height||!sr.width||!sr.height)return;
      const dx=(hr.left+hr.width/2)-(tr.left+tr.width/2),dy=(hr.top+hr.height/2)-(tr.top+tr.height/2),c2=state.cameras.structureOverview;
      state.cameras.structureOverview={s:c2.s,x:c2.x+dx*(vb.width/sr.width),y:c2.y+dy*(vb.height/sr.height)};
      applyCamera('structureOverview');
    }));
  });
}
function selectStructureOverview(id,{drawer=true,zoom=true}={}){
  if(!byId[id])return;
  state.view='structure';state.mode='overview';state.selected=id;state.drawer=drawer;
  $('#structureStage').classList.remove('focused');
  $('#content').classList.toggle('drawer-open',drawer);
  $('#hint')?.classList.add('hide');
  $('#modeLabel').textContent='Whole repository · selected context';
  $('#backBtn').style.display='none';
  $('#labelsBtn').style.display='inline-flex';
  $('#localFocusBtn').style.display='inline-flex';
  switchViewUI();renderOverview();renderDrawer();
  if(zoom)frameStructureOverviewSelection(id);
}
const renderOverviewWholeMap=renderOverview;
renderOverview=function(){const r=renderOverviewWholeMap();wireOverviewSelection();renderOverviewSelectionCard();return r};
const navigateSelectedToWholeMap=navigateSelectedTo;
navigateSelectedTo=function(view){
  if(view==='structure'){
    const source=byId[state.selected]||byId.root;
    selectStructureOverview(source.id,{drawer:true,zoom:true});
    return;
  }
  return navigateSelectedToWholeMap(view);
};
const renderSearchWholeMap=renderSearch;
renderSearch=function(q){
  const r=renderSearchWholeMap(q);
  if(state.view==='structure')document.querySelectorAll('.search-result').forEach(row=>row.onclick=()=>{closeSearch();selectStructureOverview(row.dataset.id,{drawer:true,zoom:true})});
  return r;
};
const switchViewWholeMapDefault=switchView;
switchView=function(view,statePatch={}){
  const patch=view==='structure'&&!Object.prototype.hasOwnProperty.call(statePatch,'mode')?{...statePatch,mode:'overview'}:statePatch;
  const r=switchViewWholeMapDefault(view,patch);
  if(view==='structure'&&patch.mode!=='focus'){
    $('#structureStage').classList.remove('focused');
    $('#backBtn').style.display='none';
    $('#labelsBtn').style.display='inline-flex';
    $('#localFocusBtn').style.display='inline-flex';
    $('#modeLabel').textContent=state.selected&&state.selected!=='root'?'Whole repository · selected context':'Whole repository · labels hidden';
    renderOverview();
  }
  return r;
};
$('#focusBtn').onclick=()=>enterStructureFocus(state.selected||'root');
$('#localFocusBtn').onclick=()=>enterStructureFocus(state.selected||'root');
$('#backBtn').onclick=()=>selectStructureOverview(state.selected||'root',{drawer:true,zoom:true});
`;
s=s.replace(marker,code+'\n'+marker);
fs.writeFileSync(p,s);
