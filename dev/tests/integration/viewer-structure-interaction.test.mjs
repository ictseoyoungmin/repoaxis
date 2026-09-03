import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const VIEWER=fileURLToPath(new URL('../../../skills/repoaxis/viewer/viewer-1.js',import.meta.url));
const source=fs.readFileSync(VIEWER,'utf8');
const structureSource=source.slice(0,source.indexOf('function depProjection'));

function makeContext(){
  const nodes={
    root:{id:'root',type:'root',parent:null,label:'repo/',repoPath:'.'},
    'folder:src':{id:'folder:src',type:'folder',parent:'root',label:'src/',repoPath:'src'},
    'folder:src/core':{id:'folder:src/core',type:'folder',parent:'folder:src',label:'core/',repoPath:'src/core'},
    'file:src/core/a.js':{id:'file:src/core/a.js',type:'file',parent:'folder:src/core',label:'a.js',repoPath:'src/core/a.js'}
  };
  const state={structureFocus:false,structureRoot:'root',selected:'root',drawer:false};
  const rank={root:-1,folder:0,file:1,class:2,function:3};
  const context=vm.createContext({
    nodes,state,ROOT:'root',
    children(id){return Object.values(nodes).filter(n=>n.parent===id).sort((a,b)=>(rank[a.type]-rank[b.type])||a.repoPath.localeCompare(b.repoPath));},
    containingFile(n){let x=n;while(x?.parent){x=nodes[x.parent];if(x?.type==='file')return x}return n?.type==='file'?n:null;},
    statusFor:()=>null,gitScopeSummary:()=>null,gitScopeLabel:()=>'',
    colorFor:()=>['#fff','#ddd','#333'],
    badgeSvg:()=>'',
    esc:String,
    $:()=>({hidden:false,textContent:'',title:'',classList:{add(){}},setAttribute(){},innerHTML:'',querySelectorAll(){return[]}}),
    bindNodes:()=>{},applyCamera:()=>{},applyFilter:()=>{},resetCamera:()=>{},renderDrawer:()=>{},updateSelection:()=>{}
  });
  vm.runInContext(structureSource,context);
  return{context,state,nodes};
}

test('whole topology selection inspects without forcing focus',()=>{
  const {context,state}=makeContext();
  assert.equal(context.structureOverviewInspectState('folder:src'),true);
  assert.equal(state.selected,'folder:src');
  assert.equal(state.drawer,true);
  assert.equal(state.structureFocus,false);
  assert.equal(state.structureRoot,'root');
});

test('whole topology macro targets expose visible identity and keyboard affordance',()=>{
  const {context,nodes}=makeContext();
  const html=context.structureCard(nodes['folder:src'],100,120,{mode:'overview'});
  assert.match(html,/class="node macro-node/);
  assert.match(html,/class="macro-label"/);
  assert.match(html,/class="macro-target"/);
  assert.match(html,/>src\//);
  assert.match(html,/role="button"/);
  assert.match(html,/tabindex="0"/);
});

test('whole topology macro targets expose native hit zones and press feedback',()=>{
  const {context,nodes}=makeContext();
  const html=context.structureCard(nodes['folder:src'],100,120,{mode:'overview'});
  assert.match(html,/class="overview-assist-zone"/);
  assert.match(html,/class="overview-hit-zone"/);
  assert.match(html,/class="overview-hover-ring"/);
  assert.match(source,/function installStructureOverviewHitZones/);
  assert.match(source,/classList\.add\('pressing'\)/);
  assert.match(source,/requestAnimationFrame\(installStructureOverviewHitZones\)/);
});

test('Structure focus transitions expose a bounded visual handoff',()=>{
  assert.match(source,/function animateStructureTransition/);
  assert.match(source,/structure-morph/);
  assert.match(source,/setTimeout\(\(\)=>svg\.classList\.remove\('structure-morph'\),420\)/);
});

test('whole topology retains an explicit drill-in path after inspection',()=>{
  assert.match(source,/Explore selected/);
  assert.match(source,/ondblclick=\(\)=>enterStructureFocus/);
  assert.match(source,/select to inspect/);
});
