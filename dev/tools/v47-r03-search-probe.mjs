import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { startViewer } from '../../skills/repoaxis/lib/view-server.mjs';

const out=path.resolve('artifacts/v47-r03');fs.mkdirSync(out,{recursive:true});
const viewer=await startViewer({root:process.cwd(),port:0,open:false});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
const snap=label=>page.evaluate(label=>({label,view:state.view,selected:state.selected,selectedType:byId[state.selected]?.type||null,selectedPath:byId[state.selected]?.path||null,drawer:state.drawer,depRoot:state.depRoot,cardCount:document.querySelector('#cardCount')?.textContent||null,selectedVisible:!!document.querySelector('.view-stage.active .selected,.view-stage.active [data-id="'+CSS.escape(state.selected)+'"]'),drawerPath:document.querySelector('#entityPath')?.textContent||null}),label);
try{
  await page.goto(viewer.url,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.documentElement.dataset.repoaxisLive==='ready',{timeout:20000});await page.waitForTimeout(600);
  const result={initial:await snap('initial')};
  await page.keyboard.press('Control+K');await page.waitForTimeout(300);
  result.searchOpen=await page.evaluate(()=>({inputs:[...document.querySelectorAll('input')].filter(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'}).map(e=>({id:e.id,cls:e.className,placeholder:e.placeholder,value:e.value})),dialogs:[...document.querySelectorAll('[role="dialog"],.search-overlay,.search-modal,.command-palette,.search-panel')].filter(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'}).map(e=>({id:e.id,cls:e.className,text:e.textContent.slice(0,240)}))}));
  await page.screenshot({path:path.join(out,'search-open.png')});
  const visibleInputs=page.locator('input:visible');const n=await visibleInputs.count();if(!n)throw new Error('no visible search input');const input=visibleInputs.nth(n-1);await input.fill('annotations.test.mjs');await page.waitForTimeout(450);
  result.searchResults=await page.evaluate(()=>({bodyText:document.body.innerText.includes('annotations.test.mjs'),matches:[...document.querySelectorAll('*')].filter(e=>e.children.length===0&&e.textContent?.includes('annotations.test.mjs')).slice(0,12).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent.trim().slice(0,180)}))}));
  await page.screenshot({path:path.join(out,'search-results.png')});
  await page.keyboard.press('Enter');await page.waitForTimeout(650);result.afterEnter=await snap('after-enter');
  await page.screenshot({path:path.join(out,'after-search-select.png')});
  if(typeof (await page.evaluate(()=>typeof navigateSelectedTo))==='string'){}
  const hasNav=await page.evaluate(()=>typeof navigateSelectedTo==='function');result.hasNavigateSelectedTo=hasNav;
  if(hasNav){await page.evaluate(()=>navigateSelectedTo('graph'));await page.waitForTimeout(750);result.graph=await snap('graph');await page.screenshot({path:path.join(out,'graph-handoff.png')});await page.evaluate(()=>navigateSelectedTo('structure'));await page.waitForTimeout(750);result.structure=await snap('structure');await page.screenshot({path:path.join(out,'structure-handoff.png')});}
  result.errors=errors;fs.writeFileSync(path.join(out,'probe.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();await new Promise(r=>viewer.server.close(r))}
