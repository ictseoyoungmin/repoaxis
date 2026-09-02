import fs from 'node:fs';

function replaceOrFail(source,before,after,label){
  if(!source.includes(before))throw new Error(`Missing patch anchor: ${label}`);
  return source.replace(before,after);
}

const v0Path='skills/repoaxis/viewer/viewer-0.js';
let v0=fs.readFileSync(v0Path,'utf8');
const v0Before="function fileId(path){const id='file:'+path;return nodes[id]?id:null}function activeChanges(){return state.gitOverlay==='history'?historyChanges:gitChanges}function statusFor(id){const f=nodes[id]?.type==='file'?nodes[id]:containingFile(nodes[id]);if(!f)return null;return activeChanges().find(c=>c.id===f.id)?.status||null}";
const v0After="function fileId(path){const id='file:'+path;return nodes[id]?id:null}function activeChanges(){return state.gitOverlay==='history'?historyChanges:gitChanges}function changeInNodeScope(c,n){if(!c||!n)return false;if(n.type==='root')return true;const f=n.type==='file'?n:containingFile(n);if(f)return c.id===f.id;if(n.type!=='folder')return false;let x=nodes[c.id],seen=new Set;while(x&&!seen.has(x.id)){if(x.id===n.id)return true;seen.add(x.id);x=x.parent?nodes[x.parent]:null}const prefix=String(n.repoPath||'').replace(/\\\/$/,'')+'/';return !!prefix&&String(c.path||'').startsWith(prefix)}function nodeScopeChanges(id){const n=nodes[id];if(!n)return[];return activeChanges().filter(c=>changeInNodeScope(c,n))}function gitScopeSummary(id){const n=nodes[id];if(!n||(n.type!=='root'&&n.type!=='folder'))return null;const scoped=nodeScopeChanges(id);if(!scoped.length)return null;if(state.gitOverlay==='history')return{changed:scoped.length,history:true,staged:0,working:0,conflicts:0};return{changed:scoped.length,history:false,staged:scoped.filter(hasStagedState).length,working:scoped.filter(hasWorkingState).length,conflicts:scoped.filter(c=>c.status==='conflict'||c.raw?.conflicted).length}}function gitScopeLabel(s){if(!s)return'';if(s.history)return `${s.changed} changed file${s.changed===1?'':'s'} in last commit`;const p=[`${s.changed} changed file${s.changed===1?'':'s'}`];if(s.staged)p.push(`${s.staged} staged`);if(s.working)p.push(`${s.working} working`);if(s.conflicts)p.push(`${s.conflicts} conflict${s.conflicts===1?'':'s'}`);return p.join(' · ')}function statusFor(id){const f=nodes[id]?.type==='file'?nodes[id]:containingFile(nodes[id]);if(!f)return null;return activeChanges().find(c=>c.id===f.id)?.status||null}";
v0=replaceOrFail(v0,v0Before,v0After,'viewer-0 scope aggregation helpers');
fs.writeFileSync(v0Path,v0);

const v1Path='skills/repoaxis/viewer/viewer-1.js';
let v1=fs.readFileSync(v1Path,'utf8');
const start=v1.indexOf("function structureCard(n,x,y,projection){\n  if(projection.mode==='overview'){");
const end=v1.indexOf("\n  const code=statusFor(n.id),hidden=projection.hiddenByNode",start);
if(start<0||end<0)throw new Error('Missing structureCard overview block');
const prefix=v1.slice(0,start);
const suffix=v1.slice(end);
const block=`function structureGitMarkup(summary,x,y){
  if(!summary)return'';
  if(summary.history)return\`<text class="macro-git-line" x="\${x+24}" y="\${y+16}"><tspan class="git-history">HEAD \${summary.changed}</tspan></text>\`;
  const parts=[];if(summary.staged)parts.push(['staged',\`S \${summary.staged}\`]);if(summary.working)parts.push(['working',\`W \${summary.working}\`]);if(summary.conflicts)parts.push(['conflict',\`! \${summary.conflicts}\`]);
  return parts.length?\`<text class="macro-git-line" x="\${x+24}" y="\${y+16}">\${parts.map((p,i)=>\`<tspan class="git-\${p[0]}"\${i?' dx="8"':''}>\${p[1]}</tspan>\`).join('')}</text>\`:''
}
function structureCard(n,x,y,projection){
  if(projection.mode==='overview'){
    const code=statusFor(n.id),git=gitScopeSummary(n.id),gitLabel=gitScopeLabel(git),desc=structureDescendants(n.id).length,base=n.type==='root'?10:n.type==='folder'?7:n.type==='file'?5:4,r=Math.min(13,base+Math.log2(desc+1)*.8);
    const label=n.label.length>18?n.label.slice(0,17)+'…':n.label,scopeText=gitLabel?\` · \${gitLabel}\`:'';
    return\`<g class="node macro-node \${state.selected===n.id?'selected':''}" data-id="\${esc(n.id)}" role="button" tabindex="0" aria-label="Inspect \${esc(n.label)}; \${desc} descendant\${desc===1?'':'s'}\${esc(scopeText)}"><title>\${esc(n.label)} · \${desc} descendant\${desc===1?'':'s'}\${esc(scopeText)} · select to inspect · double-click to explore</title><rect class="macro-target" x="\${x-22}" y="\${y-22}" width="184" height="44" rx="13" fill="transparent"/><circle class="macro-dot" cx="\${x}" cy="\${y}" r="\${r.toFixed(1)}" fill="\${code?colorFor(code)[0]:'#fff'}" stroke="\${state.selected===n.id?'#625bff':(n.type==='root'||n.type==='folder'?'#817aff':'#cdd3df')}" stroke-width="\${state.selected===n.id?2:1.25}"/><circle class="macro-hit" cx="\${x}" cy="\${y}" r="\${Math.max(22,r+10)}"/><text class="macro-label" x="\${x+24}" y="\${git?y-1:y+4}">\${esc(label)}\${desc?\`<tspan class="macro-count" dx="6">\${desc}</tspan>\`:''}</text>\${structureGitMarkup(git,x,y)}</g>\`
  }`;
v1=prefix+block+suffix;
fs.writeFileSync(v1Path,v1);

const v4Path='skills/repoaxis/viewer/viewer-4.js';
let v4=fs.readFileSync(v4Path,'utf8');
const currentBefore='<span class="k">Git state</span><span class="v">${esc(nodeGitText(n))}</span>';
const currentAfter='<span class="k">${n.type===\'root\'||n.type===\'folder\'?(state.gitOverlay===\'history\'?\'Last commit in scope\':\'Working tree in scope\'):\'Git state\'}</span><span class="v">${esc(n.type===\'root\'||n.type===\'folder\'?(gitScopeLabel(gitScopeSummary(n.id))||(state.gitOverlay===\'history\'?\'No changed files in scope\':\'Clean in scope\')):nodeGitText(n))}</span>';
v4=replaceOrFail(v4,currentBefore,currentAfter,'drawer scoped Git state');
fs.writeFileSync(v4Path,v4);

const cssPath='skills/repoaxis/viewer/viewer-base.css';
let css=fs.readFileSync(cssPath,'utf8');
const cssAnchor='.structure-svg .macro-node .macro-count{fill:#98a2b3;font-size:8.5px;font-weight:600}';
const cssExtra=cssAnchor+'.structure-svg .macro-node .macro-git-line{font-size:8.2px;font-weight:700;letter-spacing:.01em;opacity:.92}.structure-svg .macro-node .macro-git-line .git-staged{fill:#625bff}.structure-svg .macro-node .macro-git-line .git-working{fill:#a66b0b}.structure-svg .macro-node .macro-git-line .git-conflict{fill:#b4233c}.structure-svg .macro-node .macro-git-line .git-history{fill:#4b6fae}';
css=replaceOrFail(css,cssAnchor,cssExtra,'macro Git aggregation styles');
fs.writeFileSync(cssPath,css);

const testPath='dev/tests/integration/viewer-structure-git-aggregation.test.mjs';
fs.writeFileSync(testPath,`import assert from 'node:assert/strict';
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
  assert.match(source1,/structureGitMarkup/);
  assert.match(source1,/class="macro-git-line"/);
  assert.match(source1,/git-staged/);
  assert.match(source1,/git-working/);
  assert.match(source1,/git-conflict/);
  assert.match(source1,/git-history/);
});
`);
