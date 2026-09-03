import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { startViewer } from '../../skills/repoaxis/lib/view-server.mjs';

const out=path.resolve('artifacts/v47-r02');fs.mkdirSync(out,{recursive:true});
const viewer=await startViewer({root:process.cwd(),port:0,open:false});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
try{
  await page.goto(viewer.url,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.documentElement.dataset.repoaxisLive==='ready',{timeout:20000});await page.waitForTimeout(600);
  const snap=label=>page.evaluate(label=>({label,view:state.view,selected:state.selected,selectedType:byId[state.selected]?.type||null,selectedPath:byId[state.selected]?.path||null,depRoot:state.depRoot,drawer:state.drawer,projection:state.selectionProjection||null,origin:state.selectionOrigin||null,cardCount:document.querySelector('#cardCount')?.textContent||null,visibleSelected:!!document.querySelector('.view-stage.active .selected,.view-stage.active [data-id="'+CSS.escape(state.selected)+'"]'),drawerTitle:document.querySelector('#drawer .drawer-title,#drawer h2,#drawer h3')?.textContent?.trim()||null}),label);
  const result={initial:await snap('initial')};
  await page.click('.rail-item[data-view="dependencies"]');await page.waitForTimeout(700);result.dependenciesStart=await snap('dependencies-start');
  const depTarget=await page.evaluate(()=>{const root=state.depRoot;const els=[...document.querySelectorAll('#dependenciesCanvas .dt-node')];const e=els.find(x=>x.dataset.id&&x.dataset.id!==root)||els.find(x=>x.dataset.id);return e?.dataset.id||null});
  result.depTarget=depTarget;
  if(depTarget){await page.evaluate(id=>document.querySelector(`#dependenciesCanvas .dt-node[data-id="${CSS.escape(id)}"]`)?.dispatchEvent(new MouseEvent('click',{bubbles:true})),depTarget);await page.waitForTimeout(500)}
  result.afterDepClick=await snap('after-dependency-click');
  result.drawerButtons=await page.evaluate(()=>[...document.querySelectorAll('#drawer button')].map(b=>({text:b.textContent.trim(),title:b.title||'',disabled:b.disabled})).filter(x=>x.text||x.title));
  const jump=await page.evaluate(()=>typeof navigateSelectedTo==='function'?true:false);result.hasNavigateSelectedTo=jump;
  if(jump){await page.evaluate(()=>navigateSelectedTo('graph'));await page.waitForTimeout(850);result.afterGraphJump=await snap('after-graph-jump');await page.screenshot({path:path.join(out,'graph-after-jump.png')});}
  if(jump){await page.evaluate(()=>navigateSelectedTo('structure'));await page.waitForTimeout(850);result.afterStructureJump=await snap('after-structure-jump');await page.screenshot({path:path.join(out,'structure-after-jump.png')});}
  await page.keyboard.press(process.platform==='darwin'?'Meta+K':'Control+K');await page.waitForTimeout(300);
  result.search=await page.evaluate(()=>({open:!!document.querySelector('.search-overlay:not([hidden]),.search-modal:not([hidden]),.command-palette:not([hidden]),[role="dialog"]'),dialogs:[...document.querySelectorAll('[role="dialog"],.search-overlay,.search-modal,.command-palette')].map(e=>({cls:e.className,hidden:e.hidden,text:e.textContent.slice(0,140)}))}));
  result.errors=errors;fs.writeFileSync(path.join(out,'probe.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();await new Promise(r=>viewer.server.close(r))}
