import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { startViewer } from '../../skills/repoaxis/lib/view-server.mjs';

const root=process.cwd();
const out=path.join(root,'dev','visuals','product-runtime-browser-qa');
fs.mkdirSync(out,{recursive:true});
const viewer=await startViewer({root,port:0,open:false});
const raw=await fetch(viewer.url).then(r=>r.text());
assert.match(raw,/data-repoaxis-live=["']loading["']/);
assert.match(raw,/<!-- LIVE REPOSITORY DATA -->/);
for(const forbidden of ['Repository Intelligence Prototype','repoaxis-viewer-fixture','config/default.json','deprecated-loader.js'])assert.equal(raw.includes(forbidden),false,`raw shell residue: ${forbidden}`);
const browser=await chromium.launch({headless:true});
try{
  for(const [name,width,height] of [['desktop',1600,900],['compact',1280,820]]){
    const page=await browser.newPage({viewport:{width,height}});
    const consoleErrors=[];page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});
    await page.goto(viewer.url,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.documentElement.dataset.repoaxisLive==='ready',{timeout:30000});
    const state=await page.evaluate(()=>({
      live:document.documentElement.dataset.repoaxisLive,
      title:document.title,
      repo:document.querySelector('.repo-name')?.textContent?.trim(),
      runtimeReady:window.__REPOAXIS_LIVE__?.ready===true,
      nodeCount:Object.keys(window.__REPOAXIS_LIVE__?.index?.generated?.nodes||{}).length,
      body:document.body.innerText,
      stageVisible:[...document.querySelectorAll('.view-stage')].some(el=>{const s=getComputedStyle(el);return s.visibility!=='hidden'&&s.display!=='none'}),
      overflowX:document.documentElement.scrollWidth>document.documentElement.clientWidth
    }));
    assert.equal(state.live,'ready');assert.equal(state.runtimeReady,true);assert.equal(state.title,'Repoaxis — Repository Intelligence');assert.ok(state.nodeCount>0,'live Repoaxis index must contain nodes');assert.ok(state.repo&&/repoaxis/i.test(state.repo),`expected live repo identity, got ${state.repo}`);assert.equal(state.stageVisible,true);assert.equal(state.overflowX,false);
    for(const forbidden of ['Repository Intelligence Prototype','repoaxis-viewer-fixture','config/default.json','deprecated-loader.js'])assert.equal(state.body.includes(forbidden),false,`rendered residue: ${forbidden}`);
    assert.deepEqual(consoleErrors,[]);
    await page.screenshot({path:path.join(out,`${name}.png`),fullPage:true});
    fs.writeFileSync(path.join(out,`${name}.json`),JSON.stringify({...state,body:undefined,consoleErrors},null,2));
    await page.close();
  }
  console.log('product runtime browser QA passed against live Repoaxis checkout');
} finally {
  await browser.close();
  await new Promise(resolve=>viewer.server.close(resolve));
}
