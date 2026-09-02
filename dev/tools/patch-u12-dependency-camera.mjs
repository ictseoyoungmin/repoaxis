import fs from 'node:fs';
function replaceOrFail(s,a,b,l){if(!s.includes(a))throw new Error(`Missing patch anchor: ${l}`);return s.replace(a,b)}

const v0p='skills/repoaxis/viewer/viewer-0.js';
let v0=fs.readFileSync(v0p,'utf8');
v0=replaceOrFail(v0,'structureCameraAnchor:null,fingerprint:null','structureCameraAnchor:null,dependencyCameraAnchor:null,fingerprint:null','dependency camera anchor state');
fs.writeFileSync(v0p,v0);

const p='skills/repoaxis/viewer/viewer-1.js';
let s=fs.readFileSync(p,'utf8');
const anchor='function depProjection(rootId){';
const helper=`function dependencyPrepareCamera(rootId,pos,vp){\n  const key=\`${'${rootId}:${state.depDirection}:${state.depDepth}'}\`;\n  if(state.dependencyCameraAnchor===key)return;\n  state.dependencyCameraAnchor=key;\n  const root=pos.get('root');if(!root)return;\n  state.camera.dependencies={s:1,x:vp.w/2-root[0],y:vp.h/2-root[1]}\n}\n`;
s=replaceOrFail(s,anchor,helper+anchor,'dependency camera helper');
const vpAnchor="const depSvg=$('#depSvg'),depRect=depSvg?.getBoundingClientRect(),depVp=reconcileSpatialViewport('dependencies',{w:Math.max(640,Math.round(depRect?.width||640)),h:Math.max(420,Math.round(depRect?.height||420))});depSvg?.setAttribute('viewBox',`0 0 ${depVp.w} ${depVp.h}`);const navigate=";
const vpReplacement="const depSvg=$('#depSvg'),depRect=depSvg?.getBoundingClientRect(),depVp=reconcileSpatialViewport('dependencies',{w:Math.max(640,Math.round(depRect?.width||640)),h:Math.max(420,Math.round(depRect?.height||420))});depSvg?.setAttribute('viewBox',`0 0 ${depVp.w} ${depVp.h}`);dependencyPrepareCamera(f.id,pos,depVp);const navigate=";
s=replaceOrFail(s,vpAnchor,vpReplacement,'dependency camera prepare call');
fs.writeFileSync(p,s);

const tp='dev/tests/integration/viewer-responsive-geometry.test.mjs';
let t=fs.readFileSync(tp,'utf8');
t += `\n\ntest('Dependencies center the explicit root at readable scale once, then preserve it across viewport reconciliation',()=>{\n  assert.ok(s1.includes('function dependencyPrepareCamera'));\n  assert.ok(s1.includes(\"state.camera.dependencies={s:1,x:vp.w/2-root[0],y:vp.h/2-root[1]}\"));\n  assert.ok(s1.includes(\"dependencyPrepareCamera(f.id,pos,depVp)\"));\n  assert.ok(s1.includes(\"state.dependencyCameraAnchor===key\"));\n});\n`;
fs.writeFileSync(tp,t);
