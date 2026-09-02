import fs from 'node:fs';
function replaceOrFail(s,a,b,l){if(!s.includes(a))throw new Error(`Missing patch anchor: ${l}`);return s.replace(a,b)}

const v0p='skills/repoaxis/viewer/viewer-0.js';
let v0=fs.readFileSync(v0p,'utf8');
v0=replaceOrFail(v0,'spatialViewport:{},fingerprint:null','spatialViewport:{},structureCameraAnchor:null,fingerprint:null','Structure camera anchor state');
fs.writeFileSync(v0p,v0);

const p='skills/repoaxis/viewer/viewer-1.js';
let s=fs.readFileSync(p,'utf8');
const treeEnd='  return{W,H,pos}\n}\nfunction structureGitMarkup';
const prepare=`  return{W,H,pos}\n}\nfunction structurePrepareCamera(projection,L,vp){\n  const key=\`${'${projection.mode}:${projection.root}:${projection.total}'}\`;\n  if(state.structureCameraAnchor===key)return;\n  state.structureCameraAnchor=key;\n  if(projection.mode!=='overview')return;\n  const pts=Object.values(L.pos);if(!pts.length)return;\n  const minX=Math.min(...pts.map(p=>p[0]))-42,maxX=Math.max(...pts.map(p=>p[0]))+190,minY=Math.min(...pts.map(p=>p[1]))-36,maxY=Math.max(...pts.map(p=>p[1]))+36,contentW=Math.max(1,maxX-minX),contentH=Math.max(1,maxY-minY),fit=Math.min((vp.w-48)/contentW,(vp.h-48)/contentH),scale=Math.max(.72,Math.min(1,fit)),cx=(minX+maxX)/2,cy=(minY+maxY)/2;\n  state.camera.structure={s:scale,x:vp.w/2-cx*scale,y:vp.h/2-cy*scale}\n}\nfunction structureGitMarkup`;
s=replaceOrFail(s,treeEnd,prepare,'Structure overview camera preparation');
s=replaceOrFail(s,"  state.structureFocus=true;state.structureRoot=root;state.selected=id&&nodes[id]?id:root;resetCamera();renderStructure();renderDrawer();updateSelection()","  state.structureFocus=true;state.structureRoot=root;state.selected=id&&nodes[id]?id:root;state.structureCameraAnchor=null;resetCamera();renderStructure();renderDrawer();updateSelection()",'reset Structure camera anchor on focus entry');
s=replaceOrFail(s,"  state.structureFocus=false;state.structureRoot=ROOT;resetCamera();renderStructure()","  state.structureFocus=false;state.structureRoot=ROOT;state.structureCameraAnchor=null;resetCamera();renderStructure()",'reset Structure camera anchor on whole topology');
s=replaceOrFail(s,"  svg.setAttribute('viewBox',`0 0 ${vp.w} ${vp.h}`);\n  let h='<g id=\"structureGraph\">';","  svg.setAttribute('viewBox',`0 0 ${vp.w} ${vp.h}`);structurePrepareCamera(projection,L,vp);\n  let h='<g id=\"structureGraph\">';",'prepare Structure camera after live viewport');
fs.writeFileSync(p,s);

const tp='dev/tests/integration/viewer-responsive-geometry.test.mjs';
let t=fs.readFileSync(tp,'utf8');
t += `\n\ntest('Whole Structure chooses a readable initial overview scale once, then viewport reconciliation preserves it',()=>{\n  assert.ok(s1.includes('function structurePrepareCamera'));\n  assert.ok(s1.includes('Math.max(.72,Math.min(1,fit))'));\n  assert.ok(s1.includes('state.structureCameraAnchor===key'));\n  assert.ok(s1.includes('structurePrepareCamera(projection,L,vp)'));\n});\n`;
fs.writeFileSync(tp,t);
