import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const V0=fileURLToPath(new URL('../../../skills/repoaxis/viewer/viewer-0.js',import.meta.url));
const V1=fileURLToPath(new URL('../../../skills/repoaxis/viewer/viewer-1.js',import.meta.url));
const source0=fs.readFileSync(V0,'utf8');
const source1=fs.readFileSync(V1,'utf8');
const helpers=source0.slice(source0.indexOf('function changeInNodeScope'),source0.indexOf('function statusFor'));

function fixture(overlay='working'){
  const nodes={
    root:{id:'root',type:'root',parent:null,repoPath:'.'},
    'folder:src':{id:'folder:src',type:'folder',parent:'root',repoPath:'src'},
    'folder:test':{id:'folder:test',type:'folder',parent:'root',repoPath:'test'},
    'file:src/a.js':{id:'file:src/a.js',type:'file',parent:'folder:src',repoPath:'src/a.js'},
    'file:test/b.js':{id:'file:test/b.js',type:'file',parent:'folder:test',repoPath:'test/b.js'}
  };
  const working=[
    {id:'file:src/a.js',path:'src/a.js',status:'mixed',raw:{staged:'modified',working:'modified'}},
    {id:'ghost:src/deleted.js',path:'src/deleted.js',status:'D',raw:{staged:'deleted',working:'clean'}},
    {id:'file:test/b.js',path:'test/b.js',status:'M',raw:{working:'modified'}}
  ];
  const history=[
    {id:'file:src/a.js',path:'src/a.js',status:'M',raw:{}},
    {id:'ghost:src/old.js',path:'src/old.js',status:'D',raw:{}}
  ];
  const context=vm.createContext({nodes,state:{gitOverlay:overlay},activeChanges:()=>overlay==='history'?history:working,containingFile(n){return n?.type==='file'?n:null},hasStagedState:c=>!!(c?.raw?.conflicted||c?.raw?.staged),hasWorkingState:c=>{const w=c?.raw?.working;return !!(c?.raw?.conflicted||(w&&w!=='clean'))}});
  vm.runInContext(helpers,context);
  return context;
}

test('folder scope aggregates descendant staged and working lanes without inventing one file status',()=>{
  const c=fixture();
  assert.deepEqual(JSON.parse(JSON.stringify(c.gitScopeSummary('folder:src'))),{changed:2,history:false,staged:2,working:1,conflicts:0});
  assert.equal(c.gitScopeLabel(c.gitScopeSummary('folder:src')),'2 changed files · 2 staged · 1 working');
});

test('folder scope includes deleted ghost paths and excludes sibling changes',()=>{
  const c=fixture();
  assert.equal(c.nodeScopeChanges('folder:src').length,2);
  assert.equal(c.nodeScopeChanges('folder:test').length,1);
  assert.equal(c.nodeScopeChanges('root').length,3);
});

test('last-commit overlay aggregates changed files without staged or working fiction',()=>{
  const c=fixture('history');
  assert.deepEqual(JSON.parse(JSON.stringify(c.gitScopeSummary('folder:src'))),{changed:2,history:true,staged:0,working:0,conflicts:0});
  assert.equal(c.gitScopeLabel(c.gitScopeSummary('folder:src')),'2 changed files in last commit');
});

test('Structure overview renders scoped Git lanes as a secondary macro line',()=>{
  const start=source1.indexOf('function structureGitMarkup');
  const end=source1.indexOf('function structureCard',start);
  const context=vm.createContext({});
  vm.runInContext(source1.slice(start,end),context);
  const working=context.structureGitMarkup({changed:3,history:false,staged:2,working:2,conflicts:1},100,120);
  assert.match(working,/class="macro-git-line"/);
  assert.match(working,/class="git-staged">S 2/);
  assert.match(working,/class="git-working" dx="8">W 2/);
  assert.match(working,/class="git-conflict" dx="8">! 1/);
  const history=context.structureGitMarkup({changed:4,history:true,staged:0,working:0,conflicts:0},100,120);
  assert.match(history,/class="git-history">HEAD 4/);
});
