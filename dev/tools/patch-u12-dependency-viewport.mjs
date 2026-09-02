import fs from 'node:fs';

function replaceOrFail(source,before,after,label){if(!source.includes(before))throw new Error(`Missing patch anchor: ${label}`);return source.replace(before,after)}
const p='skills/repoaxis/viewer/viewer-1.js';
let s=fs.readFileSync(p,'utf8');
s=replaceOrFail(s,"state.depRoot=f.id;if(state.selected===ROOT)state.selected=f.id;const vp=reconcileSpatialViewport('dependencies',spatialViewportSize()),trail=","state.depRoot=f.id;if(state.selected===ROOT)state.selected=f.id;const trail=",'remove host-sized dependency viewport');
s=replaceOrFail(s,'<svg class="dep-svg" id="depSvg" viewBox="0 0 ${vp.w} ${vp.h}">${sh}</svg>','<svg class="dep-svg" id="depSvg">${sh}</svg>','defer dependency viewBox until measured');
const anchor="`;const navigate=id=>{if(!id)return;resetCamera();renderDependencies();renderDrawer();updateSelection()};";
const replacement="`;const depSvg=$('#depSvg'),depRect=depSvg?.getBoundingClientRect(),depVp=reconcileSpatialViewport('dependencies',{w:Math.max(640,Math.round(depRect?.width||640)),h:Math.max(420,Math.round(depRect?.height||420))});depSvg?.setAttribute('viewBox',`0 0 ${depVp.w} ${depVp.h}`);const navigate=id=>{if(!id)return;resetCamera();renderDependencies();renderDrawer();updateSelection()};";
s=replaceOrFail(s,anchor,replacement,'measure dependency canvas after render');
fs.writeFileSync(p,s);

const t='dev/tests/integration/viewer-responsive-geometry.test.mjs';
let q=fs.readFileSync(t,'utf8');
q=replaceOrFail(q,"  assert.ok(s1.includes(\"reconcileSpatialViewport('dependencies',spatialViewportSize())\"));\n  assert.ok(s1.includes('id=\"depSvg\" viewBox=\"0 0 '));","  assert.ok(s1.includes(\"depRect=depSvg?.getBoundingClientRect()\"));\n  assert.ok(s1.includes(\"reconcileSpatialViewport('dependencies',{w:Math.max(640\"));\n  assert.ok(s1.includes(\"depSvg?.setAttribute('viewBox'\"));",'dependency responsive assertions');
fs.writeFileSync(t,q);
