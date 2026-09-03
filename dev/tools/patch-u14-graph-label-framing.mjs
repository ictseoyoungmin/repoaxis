import fs from 'node:fs';

const v0Path='skills/repoaxis/viewer/viewer-0.js';
let v0=fs.readFileSync(v0Path,'utf8');
const oldBadge=`function badgeSvg(code,x,y,w=18,h=15){if(!code)return'';const [f,s,t]=colorFor(code),label=statusLabel(code);return\`<g><rect x="\${x}" y="\${y}" width="\${w}" height="\${h}" rx="5" fill="\${f}" stroke="\${s}"/><text x="\${x+w/2}" y="\${y+h/2+3}" text-anchor="middle" font-size="8" font-weight="700" fill="\${t}">\${esc(label)}</text></g>\`}`;
const newBadge=`function badgeSvg(code,x,y,w=18,h=15){if(!code)return'';const [f,s,t]=colorFor(code),label=statusLabel(code),actualW=Math.max(w,10+label.length*5),drawX=x+w-actualW;return\`<g class="git-badge" data-label="\${esc(label)}"><rect x="\${drawX}" y="\${y}" width="\${actualW}" height="\${h}" rx="5" fill="\${f}" stroke="\${s}"/><text x="\${drawX+actualW/2}" y="\${y+h/2+3}" text-anchor="middle" font-size="8" font-weight="700" fill="\${t}">\${esc(label)}</text></g>\`}`;
if(!v0.includes(oldBadge))throw new Error('badgeSvg source did not match');
v0=v0.replace(oldBadge,newBadge);
fs.writeFileSync(v0Path,v0);

const v3Path='skills/repoaxis/viewer/viewer-3.js';
let v3=fs.readFileSync(v3Path,'utf8');
const oldCamera=`function graphPrepareCamera(projection,L,sel){const key=graphCameraAnchorKey(projection,sel);if(state.graphCameraAnchor===key)return;const p=L.pos[sel?.id]||[L.viewW/2,L.viewH/2],s=.92;state.camera.graph={s,x:L.viewW/2-p[0]*s,y:L.viewH/2-p[1]*s};state.graphCameraAnchor=key}`;
if(!v3.includes(oldCamera))throw new Error('graphPrepareCamera source did not match');
const newCamera=`function graphPrepareCamera(projection,L,sel){const key=graphCameraAnchorKey(projection,sel);if(state.graphCameraAnchor===key)return;const s0=.92;if(projection.mode==='impact'&&projection.list?.length){const pts=projection.list.map(f=>L.pos[f.id]).filter(Boolean);if(pts.length){const minX=Math.min(...pts.map(p=>p[0]))-GRAPH_NODE_GEOMETRY.halfW,maxX=Math.max(...pts.map(p=>p[0]))+GRAPH_NODE_GEOMETRY.halfW,minY=Math.min(...pts.map(p=>p[1]))-GRAPH_NODE_GEOMETRY.halfH,maxY=Math.max(...pts.map(p=>p[1]))+GRAPH_NODE_GEOMETRY.halfH,contentW=Math.max(1,maxX-minX),contentH=Math.max(1,maxY-minY),fit=Math.min(s0,(L.viewW-160)/contentW,(L.viewH-150)/contentH),s=Math.max(.35,fit),cx=(minX+maxX)/2,cy=(minY+maxY)/2;state.camera.graph={s,x:L.viewW/2-cx*s,y:L.viewH/2-cy*s};state.graphCameraAnchor=key;return}}const p=L.pos[sel?.id]||[L.viewW/2,L.viewH/2],s=s0;state.camera.graph={s,x:L.viewW/2-p[0]*s,y:L.viewH/2-p[1]*s};state.graphCameraAnchor=key}`;
v3=v3.replace(oldCamera,newCamera);
fs.writeFileSync(v3Path,v3);

const testPath='dev/tests/integration/viewer-graph-framing.test.mjs';
const test=`import assert from "node:assert/strict";\nimport fs from "node:fs";\nimport test from "node:test";\nimport { fileURLToPath } from "node:url";\n\nconst V0=fileURLToPath(new URL("../../../skills/repoaxis/viewer/viewer-0.js",import.meta.url));\nconst V3=fileURLToPath(new URL("../../../skills/repoaxis/viewer/viewer-3.js",import.meta.url));\nconst v0=fs.readFileSync(V0,"utf8"),v3=fs.readFileSync(V3,"utf8");\n\ntest("Git badges widen inward for multi-character labels",()=>{\n  assert.ok(v0.includes("actualW=Math.max(w,10+label.length*5)"));\n  assert.ok(v0.includes("drawX=x+w-actualW"));\n  assert.ok(v0.includes('class="git-badge"'));\n});\n\ntest("impact Graph entry frames all projected roots instead of only the selected root",()=>{\n  assert.ok(v3.includes("projection.mode==='impact'&&projection.list?.length"));\n  assert.ok(v3.includes("projection.list.map(f=>L.pos[f.id]).filter(Boolean)"));\n  assert.ok(v3.includes("cx=(minX+maxX)/2,cy=(minY+maxY)/2"));\n  assert.ok(v3.includes("fit=Math.min(s0,(L.viewW-160)/contentW,(L.viewH-150)/contentH)"));\n});\n`;
fs.writeFileSync(testPath,test);
