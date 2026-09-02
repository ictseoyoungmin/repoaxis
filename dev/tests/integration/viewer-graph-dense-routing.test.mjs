import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const VIEWER=fileURLToPath(new URL('../../../skills/repoaxis/viewer/viewer-3.js',import.meta.url));
const source=fs.readFileSync(VIEWER,'utf8');
const start=source.indexOf('const GRAPH_NODE_GEOMETRY');
const end=source.indexOf('function graphExploreContext',start);
const helpers=source.slice(start,end);
function context({nodes,edges}){const c=vm.createContext({nodes,edges,console});vm.runInContext(helpers,c);return c}
function file(id,path){return{id,type:'file',repoPath:path,label:path.split('/').at(-1)}}

test('dense router detours around an intervening file node',()=>{const nodes={a:file('a','src/a.mjs'),b:file('b','src/b.mjs'),c:file('c','src/c.mjs')},edges=[['a','b']],c=context({nodes,edges}),L={pos:{a:[120,180],c:[360,180],b:[600,180]},scopes:[{name:'src',x:30,y:90,w:660,h:260}],W:760,H:420},plan=c.graphPortPlan(new Set(['a','b','c']),L),route=c.graphRoutedEdge('a','b',L,plan),obs=c.graphRouteObstacles(L,'a','b');assert.ok(route);assert.equal(route.blocked,false);assert.equal(c.graphRouteClear(route.points.slice(1,-1),obs),true);assert.ok(route.turns>=2)});
test('shared physical side ports account for incoming and outgoing crowding together',()=>{const nodes={a:file('a','src/a.mjs'),b:file('b','src/b.mjs'),c:file('c','src/c.mjs'),d:file('d','src/d.mjs')},edges=[['a','b'],['c','a'],['a','d']],c=context({nodes,edges}),L={pos:{a:[300,200],b:[560,150],c:[40,210],d:[560,250]},scopes:[{name:'src',x:0,y:80,w:640,h:300}],W:700,H:460},plan=c.graphPortPlan(new Set(Object.keys(nodes)),L);const ab=plan.get('a>b'),ad=plan.get('a>d');assert.ok(ab.sc>=2);assert.equal(ab.sc,ad.sc);assert.notEqual(ab.so,ad.so)});
test('route reuse is penalized so dense edges can seek alternate corridors',()=>{const nodes={a:file('a','src/a.mjs'),b:file('b','src/b.mjs')},edges=[['a','b']],c=context({nodes,edges}),L={pos:{a:[120,180],b:[600,360]},scopes:[{name:'src',x:30,y:90,w:660,h:380}],W:760,H:520},plan=c.graphPortPlan(new Set(['a','b']),L),route=c.graphRoutedEdge('a','b',L,plan);assert.ok(route);assert.ok(c.graphRouteUsePenalty(route.points.slice(1,-1))>0)});
test('renderer exposes obstacle status and route strategy for visual QA',()=>{assert.match(source,/data-route=/);assert.match(source,/data-obstacle=/);assert.match(source,/graphRoutingState=\{used:\[\]\}/)});
