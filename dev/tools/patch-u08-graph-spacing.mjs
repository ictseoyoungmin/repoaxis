import fs from 'node:fs';

const viewerPath='skills/repoaxis/viewer/viewer-3.js';
const cameraPath='skills/repoaxis/viewer/viewer-0.js';
const testPath='dev/tests/integration/viewer-graph-spacing.test.mjs';

let src=fs.readFileSync(viewerPath,'utf8');
const layoutStart=src.indexOf('function graphLayout(list){');
const layoutEnd=src.indexOf('\nconst GRAPH_NODE_GEOMETRY',layoutStart);
if(layoutStart<0||layoutEnd<0)throw new Error('graph layout anchor not found');
const layout=`const GRAPH_VIEWPORT={w:1800,h:1040},GRAPH_NODE_GAP={x:220,y:112};
function graphLayout(list){
  const groups=new Map;for(const f of list){const k=f.repoPath.includes('/')?f.repoPath.split('/')[0]:'root';if(!groups.has(k))groups.set(k,[]);groups.get(k).push(f)}
  const gs=[...groups.entries()].sort((a,b)=>a[0].localeCompare(b[0])),pos={},scopes=[];let cursorX=80,cursorY=86,rowH=0,maxX=0;const maxRowW=2860,gapX=112,gapY=112;
  for(const [name,arr0] of gs){const arr=[...arr0].sort((a,b)=>a.repoPath.localeCompare(b.repoPath)),cols=Math.min(6,Math.max(1,Math.ceil(Math.sqrt(arr.length*1.45)))),rows=Math.ceil(arr.length/cols),w=Math.max(360,(cols-1)*GRAPH_NODE_GAP.x+220),h=Math.max(210,(rows-1)*GRAPH_NODE_GAP.y+174);if(cursorX>80&&cursorX+w>maxRowW){cursorX=80;cursorY+=rowH+gapY;rowH=0}arr.forEach((f,j)=>pos[f.id]=[cursorX+82+(j%cols)*GRAPH_NODE_GAP.x,cursorY+64+Math.floor(j/cols)*GRAPH_NODE_GAP.y]);scopes.push({name,x:cursorX,y:cursorY,w,h});cursorX+=w+gapX;rowH=Math.max(rowH,h);maxX=Math.max(maxX,cursorX)}
  const W=Math.max(GRAPH_VIEWPORT.w,maxX+40),H=Math.max(GRAPH_VIEWPORT.h,cursorY+rowH+100);return{pos,scopes,W,H,viewW:GRAPH_VIEWPORT.w,viewH:GRAPH_VIEWPORT.h}
}
function graphCameraAnchorKey(projection,sel){return [projection.mode,projection.depth??'',sel?.id||''].join(':')}
function graphPrepareCamera(projection,L,sel){const key=graphCameraAnchorKey(projection,sel);if(state.graphCameraAnchor===key)return;const p=L.pos[sel?.id]||[L.viewW/2,L.viewH/2],s=.92;state.camera.graph={s,x:L.viewW/2-p[0]*s,y:L.viewH/2-p[1]*s};state.graphCameraAnchor=key}
`;
src=src.slice(0,layoutStart)+layout+src.slice(layoutEnd+1);
src=src.replace("svg.setAttribute('viewBox',`0 0 ${L.W} ${L.H}`);","svg.setAttribute('viewBox',`0 0 ${L.viewW} ${L.viewH}`);");
src=src.replace('renderGraphNotice(projection,sel,visible);bindNodes(svg);bindGraphExploration(projection,visible);applyCamera();applyFilter();bindImpactTrace()','renderGraphNotice(projection,sel,visible);bindNodes(svg);bindGraphExploration(projection,visible);graphPrepareCamera(projection,L,sel);applyCamera();applyFilter();bindImpactTrace()');
src=src.replace("function switchView(view,id=null){const previousView=state.view;","function switchView(view,id=null){const previousView=state.view;if(view==='graph'&&previousView!=='graph')state.graphCameraAnchor=null;");
fs.writeFileSync(viewerPath,src);

let camera=fs.readFileSync(cameraPath,'utf8');
camera=camera.replace("function resetCamera(){state.camera[cameraKey()]={s:1,x:0,y:0};applyCamera()}","function resetCamera(){if(cameraKey()==='graph'){state.graphCameraAnchor=null;renderGraph();return}state.camera[cameraKey()]={s:1,x:0,y:0};applyCamera()}");
fs.writeFileSync(cameraPath,camera);

const test=`import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const VIEWER=fileURLToPath(new URL('../../../skills/repoaxis/viewer/viewer-3.js',import.meta.url));
const source=fs.readFileSync(VIEWER,'utf8');
const start=source.indexOf('const GRAPH_VIEWPORT');
const end=source.indexOf('const GRAPH_NODE_GEOMETRY');
const helpers=source.slice(start,end);
function ctx(){const state={camera:{graph:{s:1,x:0,y:0}},graphCameraAnchor:null};const c=vm.createContext({state});vm.runInContext(helpers,c);return c}

test('large graph keeps a fixed readable viewport instead of shrinking the whole world',()=>{const c=ctx(),list=Array.from({length:80},(_,i)=>({id:'file:'+i,repoPath:'skills/f'+String(i).padStart(2,'0')+'.mjs'})),L=c.graphLayout(list);assert.equal(L.viewW,1800);assert.equal(L.viewH,1040);assert.ok(L.H>L.viewH);assert.ok(L.W>=L.viewW)});
test('spacing-first layout preserves readable node center gaps',()=>{const c=ctx(),list=Array.from({length:12},(_,i)=>({id:'file:'+i,repoPath:'skills/f'+i+'.mjs'})),L=c.graphLayout(list),pts=Object.values(L.pos);const xs=[...new Set(pts.map(p=>p[0]))].sort((a,b)=>a-b),ys=[...new Set(pts.map(p=>p[1]))].sort((a,b)=>a-b);assert.ok(xs.length>1&&ys.length>1);assert.ok(Math.min(...xs.slice(1).map((x,i)=>x-xs[i]))>=220);assert.ok(Math.min(...ys.slice(1).map((y,i)=>y-ys[i]))>=112)});
test('default graph camera centers the current projection anchor at readable scale',()=>{const c=ctx(),projection={mode:'bounded',depth:4},sel={id:'file:x'},L={viewW:1800,viewH:1040,pos:{'file:x':[1400,1500]}};c.graphPrepareCamera(projection,L,sel);assert.equal(c.state.camera.graph.s,.92);assert.equal(c.state.graphCameraAnchor,'bounded:4:file:x');assert.ok(c.state.camera.graph.y<0)});
test('renderer uses the readable viewport and reset re-enters anchored graph camera',()=>{assert.match(source,/viewBox',\x60?0 0 \$\{L\.viewW\} \$\{L\.viewH\}/);const camera=fs.readFileSync(fileURLToPath(new URL('../../../skills/repoaxis/viewer/viewer-0.js',import.meta.url)),'utf8');assert.match(camera,/cameraKey\(\)==='graph'/);assert.match(camera,/state\.graphCameraAnchor=null;renderGraph\(\)/)});
`;
fs.writeFileSync(testPath,test);
