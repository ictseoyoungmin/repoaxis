import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const VIEWER=fileURLToPath(new URL('../../../skills/repoaxis/viewer/viewer-3.js',import.meta.url));
const source=fs.readFileSync(VIEWER,'utf8');
const start=source.indexOf('const GRAPH_VIEWPORT');
const end=source.indexOf('const GRAPH_NODE_GEOMETRY');
const helpers=source.slice(start,end);
function ctx(){const state={camera:{graph:{s:1,x:0,y:0}},graphCameraAnchor:null};const c=vm.createContext({state,spatialViewportSize:()=>({w:1800,h:1040})});vm.runInContext(helpers,c);return c}

test('large graph keeps a fixed readable viewport instead of shrinking the whole world',()=>{const c=ctx(),list=Array.from({length:80},(_,i)=>({id:'file:'+i,repoPath:'skills/f'+String(i).padStart(2,'0')+'.mjs'})),L=c.graphLayout(list);assert.equal(L.viewW,1800);assert.equal(L.viewH,1040);assert.ok(L.H>L.viewH);assert.ok(L.W>=L.viewW)});
test('spacing-first layout preserves readable node center gaps',()=>{const c=ctx(),list=Array.from({length:12},(_,i)=>({id:'file:'+i,repoPath:'skills/f'+i+'.mjs'})),L=c.graphLayout(list),pts=Object.values(L.pos);const xs=[...new Set(pts.map(p=>p[0]))].sort((a,b)=>a-b),ys=[...new Set(pts.map(p=>p[1]))].sort((a,b)=>a-b);assert.ok(xs.length>1&&ys.length>1);assert.ok(Math.min(...xs.slice(1).map((x,i)=>x-xs[i]))>=220);assert.ok(Math.min(...ys.slice(1).map((y,i)=>y-ys[i]))>=112)});
test('default graph camera centers the current projection anchor at readable scale',()=>{const c=ctx(),projection={mode:'bounded',depth:4},sel={id:'file:x'},L={viewW:1800,viewH:1040,pos:{'file:x':[1400,1500]}};c.graphPrepareCamera(projection,L,sel);assert.equal(c.state.camera.graph.s,.92);assert.equal(c.state.graphCameraAnchor,'bounded:4:file:x');assert.ok(c.state.camera.graph.y<0)});
test('renderer uses the readable viewport and reset re-enters anchored graph camera',()=>{assert.match(source,/L.viewW.*L.viewH/);const camera=fs.readFileSync(fileURLToPath(new URL('../../../skills/repoaxis/viewer/viewer-0.js',import.meta.url)),'utf8');assert.ok(camera.includes("if(cameraKey()==='graph')"));assert.ok(camera.includes('state.graphCameraAnchor=null;renderGraph()'))});
