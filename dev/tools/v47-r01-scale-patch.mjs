import fs from 'node:fs';
const p='skills/repoaxis/viewer/repoaxis.html';
let s=fs.readFileSync(p,'utf8');
const anchor="window.__REPOAXIS_LIVE__=liveV47;bootLiveV47();";
if(!s.includes(anchor))throw new Error('R01 live boot anchor missing');
const patch=String.raw`
/* R01 live-scale projection inputs. Canonical renderers remain unchanged. */
const canonicalContainmentLayoutR01=containmentLayoutV11;
containmentLayoutV11=function(focus=false){
  if(focus)return canonicalContainmentLayoutR01(true);
  const visible=tree.filter(n=>n.id==='root'||n.type==='folder'||(n.type==='file'&&n.parent==='root'));
  const visibleIds=new Set(visible.map(n=>n.id)),kids=new Map();for(const n of visible)if(n.parent&&visibleIds.has(n.parent))(kids.get(n.parent)||kids.set(n.parent,[]).get(n.parent)).push(n);
  for(const arr of kids.values())arr.sort((a,b)=>String(a.path).localeCompare(String(b.path)));
  const vp=viewportV11('#structureStage',700,500),entries=new Map();let leaf=0,maxDepth=0;
  function walk(id,depth){maxDepth=Math.max(maxDepth,depth);const arr=kids.get(id)||[],e={id,depth,y:0};entries.set(id,e);if(!arr.length){e.y=leaf++;return e.y}const ys=arr.map(n=>walk(n.id,depth+1));e.y=(Math.min(...ys)+Math.max(...ys))/2;return e.y}
  walk('root',0);const leaves=Math.max(1,leaf),top=58,bottom=58,left=76,right=90,rowMin=54,targetH=Math.max(vp.h,top+bottom+(leaves-1)*rowMin),row=leaves>1?(targetH-top-bottom)/(leaves-1):0,gap=Math.max(180,Math.min(330,(Math.max(vp.w,980)-left-right)/Math.max(1,maxDepth))),W=Math.max(vp.w,left+right+maxDepth*gap),pos={};for(const e of entries.values())pos[e.id]=[left+e.depth*gap,top+e.y*row];return{W,H:targetH,pos};
};
rebuildLiveGraphInputsV47=function(){
  const connected=new Set(importEdges.flat()),fs=files().filter(f=>connected.has(f.id)).sort((a,b)=>a.path.localeCompare(b.path)),groups=new Map();
  for(const f of fs){const g=liveTopGroupV47(f),key=g?.id||'root',label=g?.type==='folder'?g.label:'root/';if(!groups.has(key))groups.set(key,{id:key,label,members:[],score:0});const rec=groups.get(key);rec.members.push(f.id);rec.score+=incoming(f.id).length+outgoing(f.id).length}
  const gs=[...groups.values()].sort((a,b)=>b.score-a.score||a.label.localeCompare(b.label));graphClustersV15.splice(0,graphClustersV15.length,...gs.map(({score,...g})=>g));for(const k of Object.keys(graphClusterByMemberV16))delete graphClusterByMemberV16[k];for(const g of graphClustersV15)for(const id of g.members)graphClusterByMemberV16[id]=g.id;for(const k of Object.keys(graphBasePosV11))delete graphBasePosV11[k];
  const blocks=graphClustersV15.map(g=>{const cols=Math.max(1,Math.min(4,Math.ceil(Math.sqrt(g.members.length)))),rows=Math.ceil(g.members.length/cols);return{g,cols,rows,w:cols*188+116,h:rows*92+120}}),columns=3,gapX=44,gapY=54,margin=80;let y=margin,maxX=0,maxY=0;
  for(let i=0;i<blocks.length;i+=columns){const row=blocks.slice(i,i+columns),rowH=Math.max(...row.map(b=>b.h));let x=margin;for(const b of row){b.g.members.forEach((id,j)=>{const c=j%b.cols,r=Math.floor(j/b.cols);graphBasePosV11[id]=[x+72+c*188,y+78+r*92]});x+=b.w+gapX;maxX=Math.max(maxX,x-gapX);maxY=Math.max(maxY,y+rowH)}y+=rowH+gapY}
  liveV47.graphWorld={W:Math.max(1450,maxX+margin),H:Math.max(820,maxY+margin)};
};
graphLayoutV11=function(){
  const vp=viewportV11('#graphStage',860,520),world=liveV47.graphWorld||{W:1450,H:820},W=Math.max(world.W,vp.w),H=Math.max(world.H,vp.h);graphPosV11={};for(const[id,p]of Object.entries(graphBasePosV11))graphPosV11[id]=p.slice();const viewW=Math.min(W,Math.max(860,Math.ceil(vp.w/.92))),viewH=Math.min(H,Math.max(520,Math.ceil(vp.h/.92)));graphWorldV27={W,H,viewW,viewH};$('#graphSvg').setAttribute('viewBox',\`0 0 \${viewW} \${viewH}\`);graphRoutingStateV22={used:[]};buildGraphPortPlanV23();buildGraphBusPlanV27();return{W,H,viewW,viewH};
};
function patchLiveCountR01(){const c=$('#cardCount');if(!c)return;if(state.view==='structure')c.textContent=Math.max(0,Object.keys(overviewPosV11).length-1);else if(state.view==='dependencies')c.textContent=$$('#dependenciesCanvas .dt-node').length;else if(state.view==='graph')c.textContent=Object.keys(graphPosV11).length;else if(state.view==='changes')c.textContent=changes.length}
const renderOverviewCountR01=renderOverview;renderOverview=function(){const r=renderOverviewCountR01();patchLiveCountR01();return r};
const renderDependenciesCountR01=renderDependencies;renderDependencies=function(){const r=renderDependenciesCountR01();patchLiveCountR01();return r};
const renderGraphCountR01=renderGraph;renderGraph=function(){const r=renderGraphCountR01();patchLiveCountR01();return r};
const renderChangesCountR01=renderChanges;renderChanges=function(){const r=renderChangesCountR01();patchLiveCountR01();return r};
const switchViewUICountR01=switchViewUI;switchViewUI=function(){const r=switchViewUICountR01();patchLiveCountR01();return r};
`;
s=s.replace(anchor,patch+'\n'+anchor);
fs.writeFileSync(p,s);
console.log('patched live-scale projection inputs');
