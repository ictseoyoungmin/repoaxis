import fs from 'node:fs';

function replaceOrFail(source,before,after,label){
  if(!source.includes(before))throw new Error(`Missing patch anchor: ${label}`);
  return source.replace(before,after);
}

const v0Path='skills/repoaxis/viewer/viewer-0.js';
let v0=fs.readFileSync(v0Path,'utf8');
v0=replaceOrFail(v0,"camera:{structure:{s:1,x:0,y:0},dependencies:{s:1,x:0,y:0},graph:{s:1,x:0,y:0}},fingerprint:null","camera:{structure:{s:1,x:0,y:0},dependencies:{s:1,x:0,y:0},graph:{s:1,x:0,y:0}},spatialViewport:{},fingerprint:null",'spatial viewport state');
const cameraAnchor="function cameraKey(){return state.view==='structure'?'structure':state.view==='dependencies'?'dependencies':'graph'}";
const cameraHelpers="function spatialViewportSize(minW=640,minH=420){const r=$('.view-host')?.getBoundingClientRect();return{w:Math.max(minW,Math.round(r?.width||minW)),h:Math.max(minH,Math.round(r?.height||minH))}}function reconcileSpatialViewport(key,vp){const prev=state.spatialViewport[key],c=state.camera[key];if(prev&&c){c.x+=(vp.w-prev.w)/2;c.y+=(vp.h-prev.h)/2}state.spatialViewport[key]={w:vp.w,h:vp.h};return vp}";
v0=replaceOrFail(v0,cameraAnchor,cameraHelpers+cameraAnchor,'viewport reconciliation helpers');
fs.writeFileSync(v0Path,v0);

const v1Path='skills/repoaxis/viewer/viewer-1.js';
let v1=fs.readFileSync(v1Path,'utf8');
v1=replaceOrFail(v1,"  const projection=structureProjection(),L=treeLayout(projection),svg=$('#structureSvg');\n  svg.setAttribute('viewBox',`0 0 ${L.W} ${L.H}`);","  const projection=structureProjection(),L=treeLayout(projection),svg=$('#structureSvg'),vp=reconcileSpatialViewport('structure',spatialViewportSize());\n  svg.setAttribute('viewBox',`0 0 ${vp.w} ${vp.h}`);",'structure responsive viewBox');
const depAnchor="function renderDependencies(){const f=nodes[state.depRoot]||mostConnectedFile()||files()[0];if(!f){$('#depShell').innerHTML='<div class=\"empty\">No indexed files.</div>';return}state.depRoot=f.id;if(state.selected===ROOT)state.selected=f.id;const trail=";
const depReplacement="function renderDependencies(){const f=nodes[state.depRoot]||mostConnectedFile()||files()[0];if(!f){$('#depShell').innerHTML='<div class=\"empty\">No indexed files.</div>';return}state.depRoot=f.id;if(state.selected===ROOT)state.selected=f.id;const vp=reconcileSpatialViewport('dependencies',spatialViewportSize()),trail=";
v1=replaceOrFail(v1,depAnchor,depReplacement,'dependency responsive viewport');
v1=replaceOrFail(v1,'<svg class="dep-svg" id="depSvg" viewBox="0 0 ${W} ${H}">${sh}</svg>','<svg class="dep-svg" id="depSvg" viewBox="0 0 ${vp.w} ${vp.h}">${sh}</svg>','dependency responsive viewBox');
fs.writeFileSync(v1Path,v1);

const v3Path='skills/repoaxis/viewer/viewer-3.js';
let v3=fs.readFileSync(v3Path,'utf8');
v3=replaceOrFail(v3,"function graphLayout(list){\n  const groups=new Map;","function graphLayout(list){\n  const vp=spatialViewportSize();\n  const groups=new Map;",'graph viewport capture');
v3=replaceOrFail(v3,"  const W=Math.max(GRAPH_VIEWPORT.w,maxX+40),H=Math.max(GRAPH_VIEWPORT.h,cursorY+rowH+100);return{pos,scopes,W,H,viewW:GRAPH_VIEWPORT.w,viewH:GRAPH_VIEWPORT.h}","  const W=Math.max(GRAPH_VIEWPORT.w,maxX+40,vp.w),H=Math.max(GRAPH_VIEWPORT.h,cursorY+rowH+100,vp.h);return{pos,scopes,W,H,viewW:vp.w,viewH:vp.h}",'graph responsive viewport return');
v3=replaceOrFail(v3,"if(state.selected===ROOT&&sel)state.selected=sel.id;svg.setAttribute('viewBox',`0 0 ${L.viewW} ${L.viewH}`);","if(state.selected===ROOT&&sel)state.selected=sel.id;reconcileSpatialViewport('graph',{w:L.viewW,h:L.viewH});svg.setAttribute('viewBox',`0 0 ${L.viewW} ${L.viewH}`);",'graph camera reconciliation');
fs.writeFileSync(v3Path,v3);

const v4Path='skills/repoaxis/viewer/viewer-4.js';
let v4=fs.readFileSync(v4Path,'utf8');
const bootAnchor="window.addEventListener('hashchange',()=>{const v=location.hash.slice(1);if(['structure','dependencies','changes','graph'].includes(v)&&v!==state.view)switchView(v);});boot();";
const observer="window.addEventListener('hashchange',()=>{const v=location.hash.slice(1);if(['structure','dependencies','changes','graph'].includes(v)&&v!==state.view)switchView(v);});let spatialResizeRAF=0,spatialResizeSig='';function scheduleSpatialReconcile(){cancelAnimationFrame(spatialResizeRAF);spatialResizeRAF=requestAnimationFrame(()=>{const r=$('.view-host')?.getBoundingClientRect();if(!r||!state.index||state.view==='changes')return;const sig=`${state.view}:${Math.round(r.width)}x${Math.round(r.height)}`;if(sig===spatialResizeSig)return;spatialResizeSig=sig;renderCurrent()})}if('ResizeObserver'in window){const spatialResizeObserver=new ResizeObserver(scheduleSpatialReconcile);spatialResizeObserver.observe($('.view-host'))}else window.addEventListener('resize',scheduleSpatialReconcile,{passive:true});boot();";
v4=replaceOrFail(v4,bootAnchor,observer,'spatial ResizeObserver');
fs.writeFileSync(v4Path,v4);

const graphSpacingPath='dev/tests/integration/viewer-graph-spacing.test.mjs';
let graphSpacing=fs.readFileSync(graphSpacingPath,'utf8');
graphSpacing=replaceOrFail(graphSpacing,"function ctx(){const state={camera:{graph:{s:1,x:0,y:0}},graphCameraAnchor:null};const c=vm.createContext({state});vm.runInContext(helpers,c);return c}","function ctx(){const state={camera:{graph:{s:1,x:0,y:0}},graphCameraAnchor:null};const c=vm.createContext({state,spatialViewportSize:()=>({w:1800,h:1040})});vm.runInContext(helpers,c);return c}",'graph spacing viewport stub');
fs.writeFileSync(graphSpacingPath,graphSpacing);

const testPath='dev/tests/integration/viewer-responsive-geometry.test.mjs';
const testLines=[
"import assert from 'node:assert/strict';",
"import fs from 'node:fs';",
"import test from 'node:test';",
"import vm from 'node:vm';",
"import { fileURLToPath } from 'node:url';",
"",
"const V0=fileURLToPath(new URL('../../../skills/repoaxis/viewer/viewer-0.js',import.meta.url));",
"const V1=fileURLToPath(new URL('../../../skills/repoaxis/viewer/viewer-1.js',import.meta.url));",
"const V3=fileURLToPath(new URL('../../../skills/repoaxis/viewer/viewer-3.js',import.meta.url));",
"const V4=fileURLToPath(new URL('../../../skills/repoaxis/viewer/viewer-4.js',import.meta.url));",
"const s0=fs.readFileSync(V0,'utf8'),s1=fs.readFileSync(V1,'utf8'),s3=fs.readFileSync(V3,'utf8'),s4=fs.readFileSync(V4,'utf8');",
"",
"test('spatial viewport reconciliation preserves the same world center as usable width changes',()=>{",
"  const start=s0.indexOf('function spatialViewportSize');",
"  const end=s0.indexOf('function cameraKey',start);",
"  const state={spatialViewport:{},camera:{graph:{s:.92,x:-240,y:-90}}};",
"  const context=vm.createContext({state,$:()=>({getBoundingClientRect:()=>({width:1200,height:800})})});",
"  vm.runInContext(s0.slice(start,end),context);",
"  context.reconcileSpatialViewport('graph',{w:1200,h:800});",
"  assert.deepEqual(state.camera.graph,{s:.92,x:-240,y:-90});",
"  context.reconcileSpatialViewport('graph',{w:800,h:700});",
"  assert.deepEqual(state.camera.graph,{s:.92,x:-440,y:-140});",
"  context.reconcileSpatialViewport('graph',{w:1200,h:800});",
"  assert.deepEqual(state.camera.graph,{s:.92,x:-240,y:-90});",
"});",
"",
"test('Structure and Dependencies use the live host viewport instead of content-sized SVG viewBoxes',()=>{",
"  assert.ok(s1.includes(\"reconcileSpatialViewport('structure',spatialViewportSize())\"));",
"  assert.ok(s1.includes(\"svg.setAttribute('viewBox'\"));",
"  assert.ok(s1.includes(\"reconcileSpatialViewport('dependencies',spatialViewportSize())\"));",
"  assert.ok(s1.includes('id=\"depSvg\" viewBox=\"0 0 '));",
"});",
"",
"test('Graph keeps its spacing-first world but exposes the current host as the camera viewport',()=>{",
"  assert.ok(s3.includes('const vp=spatialViewportSize()'));",
"  assert.ok(s3.includes('viewW:vp.w,viewH:vp.h'));",
"  assert.ok(s3.includes(\"reconcileSpatialViewport('graph',{w:L.viewW,h:L.viewH})\"));",
"  assert.ok(s3.includes('GRAPH_VIEWPORT.w,maxX+40,vp.w'));",
"});",
"",
"test('active spatial views rerender through a ResizeObserver when drawer or browser geometry changes',()=>{",
"  assert.ok(s4.includes('ResizeObserver'));",
"  assert.ok(s4.includes('scheduleSpatialReconcile'));",
"  assert.ok(s4.includes(\"state.view==='changes'\"));",
"  assert.ok(s4.includes('renderCurrent()'));",
"});",
""
];
fs.writeFileSync(testPath,testLines.join('\n'));
