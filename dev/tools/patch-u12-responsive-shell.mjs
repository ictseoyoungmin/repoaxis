import fs from 'node:fs';

const base='skills/repoaxis/viewer/viewer-base.css';
let b=fs.readFileSync(base,'utf8');
const appBefore='.app{height:100%;display:grid;grid-template-rows:72px 1fr}';
const appAfter='.app{height:100%;display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:72px 1fr}';
if(!b.includes(appBefore))throw new Error('Expected app grid rule not found');
b=b.replace(appBefore,appAfter);
fs.writeFileSync(base,b);

const surfaces='skills/repoaxis/viewer/viewer-surfaces.css';
let s=fs.readFileSync(surfaces,'utf8');
const media='@media(max-width:1100px){';
const responsive='@media(max-width:1360px){.selection-context{display:none}.topbar{gap:12px}.repo-pill{min-width:200px}.search-trigger{width:260px}}@media(max-width:1100px){';
if(!s.includes(media))throw new Error('Expected 1100px media rule not found');
s=s.replace(media,responsive);
fs.writeFileSync(surfaces,s);

const test='dev/tests/integration/viewer-responsive-geometry.test.mjs';
let t=fs.readFileSync(test,'utf8');
if(!t.includes("const V4=fileURLToPath"))throw new Error('Expected responsive geometry test setup not found');
t=t.replace(
  "const V4=fileURLToPath(new URL('../../../skills/repoaxis/viewer/viewer-4.js',import.meta.url));\nconst s0=fs.readFileSync(V0,'utf8'),s1=fs.readFileSync(V1,'utf8'),s3=fs.readFileSync(V3,'utf8'),s4=fs.readFileSync(V4,'utf8');",
  "const V4=fileURLToPath(new URL('../../../skills/repoaxis/viewer/viewer-4.js',import.meta.url));\nconst BASE=fileURLToPath(new URL('../../../skills/repoaxis/viewer/viewer-base.css',import.meta.url));\nconst SURFACES=fileURLToPath(new URL('../../../skills/repoaxis/viewer/viewer-surfaces.css',import.meta.url));\nconst s0=fs.readFileSync(V0,'utf8'),s1=fs.readFileSync(V1,'utf8'),s3=fs.readFileSync(V3,'utf8'),s4=fs.readFileSync(V4,'utf8'),baseCss=fs.readFileSync(BASE,'utf8'),surfacesCss=fs.readFileSync(SURFACES,'utf8');"
);
const anchor="test('active spatial views rerender through a ResizeObserver when drawer or browser geometry changes',()=>{";
if(!t.includes(anchor))throw new Error('Expected ResizeObserver test not found');
const extra="test('viewer shell can shrink below desktop-wide topbar min-content width',()=>{\n  assert.ok(baseCss.includes('.app{height:100%;display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:72px 1fr}'));\n  assert.ok(surfacesCss.includes('@media(max-width:1360px){.selection-context{display:none}'));\n  assert.ok(surfacesCss.includes('.search-trigger{width:260px}'));\n});\n\n";
t=t.replace(anchor,extra+anchor);
fs.writeFileSync(test,t);
