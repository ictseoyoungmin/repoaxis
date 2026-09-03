import fs from 'node:fs';
const p='skills/repoaxis/viewer/repoaxis.html';
let s=fs.readFileSync(p,'utf8');
const anchor='window.__REPOAXIS_LIVE__=liveV47;bootLiveV47();';
if(!s.includes(anchor))throw new Error('R02 anchor missing');
if(s.includes('structureFocusScopeR02'))throw new Error('R02 already applied');
const patch=String.raw`

/* R02 bounded live Structure focus. Preserve the canonical v47 renderer; narrow only its live projection input. */
const containmentLayoutR01BaseR02=containmentLayoutV11;
function structureFocusScopeR02(selectedId){
  const selected=byId[selectedId]||byId.root,ids=new Set(['root']),chain=[];let cur=selected;
  while(cur){chain.push(cur.id);if(!cur.parent)break;cur=byId[cur.parent]}
  chain.reverse().forEach(id=>ids.add(id));
  const addSorted=(items,limit)=>items.slice().sort((a,b)=>String(a.path||a.label).localeCompare(String(b.path||b.label))).slice(0,limit).forEach(n=>ids.add(n.id));
  if(selected.id==='root')addSorted(children('root'),28);
  else if(selected.type==='folder'){
    const queue=[{id:selected.id,depth:0}];let added=ids.size;
    while(queue.length&&added<38){const {id,depth}=queue.shift();if(depth>=2)continue;const kids=children(id).slice().sort((a,b)=>String(a.path||a.label).localeCompare(String(b.path||b.label)));for(const n of kids){if(added>=38)break;if(!ids.has(n.id)){ids.add(n.id);added++}if(n.type==='folder')queue.push({id:n.id,depth:depth+1})}}
  }else{
    const parent=selected.parent&&byId[selected.parent];if(parent)addSorted(children(parent.id),16);
    addSorted(children(selected.id),14);
  }
  return ids;
}
function boundedStructureLayoutR02(){
  const visibleIds=structureFocusScopeR02(state.selected),vp=viewportV11('#structureStage',760,500),kids=new Map(),entries=new Map();let leaf=0,maxDepth=0;
  for(const id of visibleIds){const n=byId[id];if(n?.parent&&visibleIds.has(n.parent))(kids.get(n.parent)||kids.set(n.parent,[]).get(n.parent)).push(n)}
  for(const arr of kids.values())arr.sort((a,b)=>String(a.path||a.label).localeCompare(String(b.path||b.label)));
  function walk(id,depth){maxDepth=Math.max(maxDepth,depth);const arr=kids.get(id)||[],e={id,depth,y:0};entries.set(id,e);if(!arr.length){e.y=leaf++;return e.y}const ys=arr.map(n=>walk(n.id,depth+1));e.y=(Math.min(...ys)+Math.max(...ys))/2;return e.y}
  walk('root',0);const leaves=Math.max(1,leaf),top=54,bottom=54,left=86,right=112,rowMin=56,targetH=Math.max(vp.h,top+bottom+(leaves-1)*rowMin),row=leaves>1?(targetH-top-bottom)/(leaves-1):0,gap=Math.max(188,Math.min(240,(Math.max(vp.w,920)-left-right)/Math.max(1,maxDepth))),W=Math.max(vp.w,left+right+maxDepth*gap),pos={};
  for(const e of entries.values())pos[e.id]=[left+e.depth*gap,top+e.y*row];
  return{W,H:targetH,pos,visibleIds};
}
containmentLayoutV11=function(focus=false){if(!focus)return containmentLayoutR01BaseR02(false);return boundedStructureLayoutR02()};
const renderFocusR02Base=renderFocus;renderFocus=function(){const r=renderFocusR02Base();if(state.view==='structure'&&state.mode==='focus'){const count=Object.keys(focusPosV11||{}).length;const c=$('#cardCount');if(c)c.textContent=count;const m=$('#modeLabel');if(m)m.textContent='Focused containment · '+count+' visible nodes · selected context'}return r};
`;
s=s.replace(anchor,patch+'\n'+anchor);
fs.writeFileSync(p,s);
console.log('applied R02 bounded Structure focus');
