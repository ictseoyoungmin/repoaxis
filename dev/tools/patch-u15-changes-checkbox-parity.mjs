import fs from 'node:fs';

const v2Path='skills/repoaxis/viewer/viewer-2.js';
let v2=fs.readFileSync(v2Path,'utf8');
const checkConst=`const CHANGE_CHECK_SVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 12.5l4 4L18 8"/></svg>',CHANGE_DASH_SVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 12h12"/></svg>';\n`;
if(!v2.includes('const CHANGE_CHECK_SVG=')){
  if(!v2.startsWith('function changeRow'))throw new Error('changeRow is no longer the leading Changes renderer');
  v2=checkConst+v2;
}
const oldPicker='const picker=canPick?`<button class="check ${picked?\'on\':\'\'}" data-check="${esc(c.id)}" aria-label="${picked?\'Remove from\':\'Add to\'} change set"></button>`:\'<span></span>\'';
const newPicker='const picker=canPick?`<button class="change-select ${picked?\'checked\':\'\'}" data-check="${esc(c.id)}" aria-label="${picked?\'Remove from\':\'Add to\'} change set">${CHANGE_CHECK_SVG}</button>`:\'<span></span>\'';
if(!v2.includes(oldPicker))throw new Error('row checkbox source did not match');
v2=v2.replace(oldPicker,newPicker);
const oldMaster='<button class="check master ${allPicked?\'on\':somePicked?\'partial\':\'\'}" id="selectAllChanges" aria-label="${allPicked?\'Clear all current files\':\'Select all current files\'}" title="${allPicked?\'Clear all current files\':\'Select all current files\'}"></button>';
const newMaster='<button class="change-select header ${allPicked?\'checked\':somePicked?\'indeterminate\':\'\'}" id="selectAllChanges" aria-label="${allPicked?\'Clear all current files\':\'Select all current files\'}" title="${allPicked?\'Clear all current files\':\'Select all current files\'}">${somePicked?CHANGE_DASH_SVG:CHANGE_CHECK_SVG}</button>';
if(!v2.includes(oldMaster))throw new Error('master checkbox source did not match');
v2=v2.replace(oldMaster,newMaster);
fs.writeFileSync(v2Path,v2);

const cssPath='skills/repoaxis/viewer/viewer-surfaces.css';
let css=fs.readFileSync(cssPath,'utf8');
const start=css.indexOf('.check{'),end=css.indexOf('.status-box{',start);
if(start<0||end<0)throw new Error('legacy checkbox CSS block not found');
const checkboxCss='.change-select{appearance:none;width:22px;height:22px;border:1.5px solid #d3d9e5;border-radius:7px;background:#fff;display:grid;place-items:center;cursor:pointer;color:#fff;padding:0;transition:background .15s,border-color .15s,box-shadow .15s,transform .12s}.change-select:hover{border-color:#a9a4ff;box-shadow:0 0 0 3px rgba(98,91,255,.08)}.change-select:active{transform:scale(.94)}.change-select svg{width:13px;height:13px;opacity:0;stroke-linecap:round;stroke-linejoin:round}.change-select.checked{background:#625bff;border-color:#625bff;box-shadow:0 2px 6px rgba(98,91,255,.18)}.change-select.checked svg,.change-select.indeterminate svg{opacity:1}.change-select.indeterminate{background:#f0efff;border-color:#8c86ff;color:#625bff}.change-select.header{width:20px;height:20px;border-radius:6px}';
css=css.slice(0,start)+checkboxCss+css.slice(end);
fs.writeFileSync(cssPath,css);

const interactionPath='dev/tests/integration/viewer-changes-interaction.test.mjs';
let interaction=fs.readFileSync(interactionPath,'utf8');
if(!interaction.includes("somePicked?'partial'"))throw new Error('existing partial-state assertion not found');
interaction=interaction.replace("somePicked?'partial'","somePicked?'indeterminate'");
const oldCssAssertion='assert.match(css,/\\.check\\.partial/);';
if(!interaction.includes(oldCssAssertion))throw new Error('existing partial CSS assertion not found');
interaction=interaction.replace(oldCssAssertion,'assert.match(css,/\\.change-select\\.indeterminate/);');
fs.writeFileSync(interactionPath,interaction);
