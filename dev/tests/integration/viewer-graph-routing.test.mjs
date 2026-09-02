import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const VIEWER=fileURLToPath(new URL('../../../skills/repoaxis/viewer/viewer-3.js',import.meta.url));
const source=fs.readFileSync(VIEWER,'utf8');
const start=source.indexOf('const GRAPH_NODE_GEOMETRY');
const end=source.indexOf('function graphExploreContext');
const helpers=source.slice(start,end);
function context(){const nodes={'file:a':{repoPath:'src/a.js'},'file:b':{repoPath:'src/b.js'},'file:c':{repoPath:'test/c.js'}};const edges=[['file:a','file:b'],['file:a','file:c']];const c=vm.createContext({nodes,edges,graphScopeKey:n=>n?.repoPath?.split('/')[0]||'root'});vm.runInContext(helpers,c);return c}

test('graph routes use side-aware rounded orthogonal geometry',()=>{const c=context(),L={pos:{'file:a':[100,100],'file:b':[360,180]},scopes:[{name:'src',x:40,y:40,w:420,h:220}]},visible=new Set(['file:a','file:b']);const plan=c.graphPortPlan(visible,L),r=c.graphRoutedEdge('file:a','file:b',L,plan);assert.equal(r.kind,'local');assert.match(r.path,/ Q /);assert.doesNotMatch(r.path,/ C /);assert.ok(['L','R','T','B'].includes(r.sourceSide));assert.ok(r.points.length>=4)});
test('cross-folder routes use a cluster gutter',()=>{const c=context(),L={pos:{'file:a':[100,100],'file:c':[620,360]},scopes:[{name:'src',x:40,y:40,w:260,h:180},{name:'test',x:500,y:280,w:260,h:180}]},visible=new Set(['file:a','file:c']);const r=c.graphRoutedEdge('file:a','file:c',L,c.graphPortPlan(visible,L));assert.equal(r.kind,'cross-folder');assert.ok(r.points.length>=4)});
test('shared node ports are spread instead of collapsing to one anchor',()=>{const c=context(),L={pos:{'file:a':[100,100],'file:b':[360,80],'file:c':[360,180]},scopes:[{name:'src',x:40,y:20,w:420,h:230},{name:'test',x:500,y:20,w:260,h:230}]},visible=new Set(['file:a','file:b','file:c']);const plan=c.graphPortPlan(visible,L);assert.notEqual(plan.get('file:a>file:b').so,plan.get('file:a>file:c').so)});
test('renderer separates base and focus edge layers',()=>{assert.match(source,/graph-edge-base-layer/);assert.match(source,/graph-edge-focus-layer/);assert.match(source,/routed canonical imports/);assert.doesNotMatch(source,/function graphEdge(A,B)/)});
