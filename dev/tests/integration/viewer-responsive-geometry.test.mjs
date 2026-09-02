import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const V0=fileURLToPath(new URL('../../../skills/repoaxis/viewer/viewer-0.js',import.meta.url));
const V1=fileURLToPath(new URL('../../../skills/repoaxis/viewer/viewer-1.js',import.meta.url));
const V3=fileURLToPath(new URL('../../../skills/repoaxis/viewer/viewer-3.js',import.meta.url));
const V4=fileURLToPath(new URL('../../../skills/repoaxis/viewer/viewer-4.js',import.meta.url));
const s0=fs.readFileSync(V0,'utf8'),s1=fs.readFileSync(V1,'utf8'),s3=fs.readFileSync(V3,'utf8'),s4=fs.readFileSync(V4,'utf8');

test('spatial viewport reconciliation preserves the same world center as usable width changes',()=>{
  const start=s0.indexOf('function spatialViewportSize');
  const end=s0.indexOf('function cameraKey',start);
  const state={spatialViewport:{},camera:{graph:{s:.92,x:-240,y:-90}}};
  const context=vm.createContext({state,$:()=>({getBoundingClientRect:()=>({width:1200,height:800})})});
  vm.runInContext(s0.slice(start,end),context);
  context.reconcileSpatialViewport('graph',{w:1200,h:800});
  assert.deepEqual(state.camera.graph,{s:.92,x:-240,y:-90});
  context.reconcileSpatialViewport('graph',{w:800,h:700});
  assert.deepEqual(state.camera.graph,{s:.92,x:-440,y:-140});
  context.reconcileSpatialViewport('graph',{w:1200,h:800});
  assert.deepEqual(state.camera.graph,{s:.92,x:-240,y:-90});
});

test('Structure and Dependencies use the live host viewport instead of content-sized SVG viewBoxes',()=>{
  assert.ok(s1.includes("reconcileSpatialViewport('structure',spatialViewportSize())"));
  assert.ok(s1.includes("svg.setAttribute('viewBox'"));
  assert.ok(s1.includes("reconcileSpatialViewport('dependencies',spatialViewportSize())"));
  assert.ok(s1.includes('id="depSvg" viewBox="0 0 '));
});

test('Graph keeps its spacing-first world but exposes the current host as the camera viewport',()=>{
  assert.ok(s3.includes('const vp=spatialViewportSize()'));
  assert.ok(s3.includes('viewW:vp.w,viewH:vp.h'));
  assert.ok(s3.includes("reconcileSpatialViewport('graph',{w:L.viewW,h:L.viewH})"));
  assert.ok(s3.includes('GRAPH_VIEWPORT.w,maxX+40,vp.w'));
});

test('active spatial views rerender through a ResizeObserver when drawer or browser geometry changes',()=>{
  assert.ok(s4.includes('ResizeObserver'));
  assert.ok(s4.includes('scheduleSpatialReconcile'));
  assert.ok(s4.includes("state.view==='changes'"));
  assert.ok(s4.includes('renderCurrent()'));
});
