import fs from 'node:fs';

function replaceOrFail(source,before,after,label){
  if(!source.includes(before))throw new Error(`Missing patch anchor: ${label}`);
  return source.replace(before,after);
}

const interactionPath='dev/tests/integration/viewer-structure-interaction.test.mjs';
let interaction=fs.readFileSync(interactionPath,'utf8');
interaction=replaceOrFail(interaction,
'    statusFor:()=>null,\n    colorFor:()=>[\'#fff\',\'#ddd\',\'#333\'],',
'    statusFor:()=>null,gitScopeSummary:()=>null,gitScopeLabel:()=>\'\',\n    colorFor:()=>[\'#fff\',\'#ddd\',\'#333\'],',
'U10 VM scope helper stubs');
fs.writeFileSync(interactionPath,interaction);

const aggregationPath='dev/tests/integration/viewer-structure-git-aggregation.test.mjs';
let aggregation=fs.readFileSync(aggregationPath,'utf8');
const before=`test('Structure overview renders scoped Git lanes as a secondary macro line',()=>{
  assert.match(source1,/structureGitMarkup/);
  assert.match(source1,/class="macro-git-line"/);
  assert.match(source1,/git-staged/);
  assert.match(source1,/git-working/);
  assert.match(source1,/git-conflict/);
  assert.match(source1,/git-history/);
});`;
const after=`test('Structure overview renders scoped Git lanes as a secondary macro line',()=>{
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
});`;
aggregation=replaceOrFail(aggregation,before,after,'aggregation markup test');
fs.writeFileSync(aggregationPath,aggregation);
