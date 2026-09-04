import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { startViewer } from '../../skills/repoaxis/lib/view-server.mjs';

const root=process.cwd();
const out=path.join(root,'dev','visuals','structure-whole-map-browser-qa');
fs.mkdirSync(out,{recursive:true});
const viewer=await startViewer({root,port:0,open:false});
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:1600,height:1000}});
  const errors=[];page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto(viewer.url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.dataset.repoaxisLive==='ready',{timeout:30000});
  const before=await page.locator('#overviewSvg .overview-node').count();
  assert.ok(before>10,`expected live overview nodes, got ${before}`);
  await page.locator('#overviewSvg .overview-node').nth(3).click();
  await page.waitForTimeout(500);
  const selected=await page.evaluate(()=>({
    focused:document.querySelector('#structureStage').classList.contains('focused'),
    overviewNodes:document.querySelectorAll('#overviewSvg .overview-node').length,
    selectionCards:document.querySelectorAll('#overviewSvg [data-overview-selection-card] .node-card').length,
    cardText:document.querySelector('#overviewSvg [data-overview-selection-card] .node-card')?.textContent?.trim()||'',
    transform:document.querySelector('#overviewGraph')?.getAttribute('transform')||'',
    localFocusDisplay:getComputedStyle(document.querySelector('#localFocusBtn')).display,
    mode:document.querySelector('#modeLabel')?.textContent||''
  }));
  assert.equal(selected.focused,false);
  assert.equal(selected.overviewNodes,before);
  assert.equal(selected.selectionCards,1);
  assert.ok(selected.cardText.length>0);
  assert.match(selected.transform,/scale\((?:1\.[4-9]|2)/);
  assert.notEqual(selected.localFocusDisplay,'none');
  assert.match(selected.mode,/Whole repository/);
  await page.screenshot({path:path.join(out,'01-whole-map-selected.png')});

  await page.click('#localFocusBtn');
  await page.waitForTimeout(350);
  const focused=await page.evaluate(()=>({
    focused:document.querySelector('#structureStage').classList.contains('focused'),
    focusCards:document.querySelectorAll('#focusSvg .node-card').length,
    overviewNodes:document.querySelectorAll('#overviewSvg .overview-node').length,
    backDisplay:getComputedStyle(document.querySelector('#backBtn')).display,
    mode:document.querySelector('#modeLabel')?.textContent||''
  }));
  assert.equal(focused.focused,true);
  assert.ok(focused.focusCards>0);
  assert.ok(focused.focusCards<before);
  assert.notEqual(focused.backDisplay,'none');
  assert.match(focused.mode,/Focused containment/);
  await page.screenshot({path:path.join(out,'02-local-focus.png')});

  await page.click('#backBtn');
  await page.waitForTimeout(500);
  const returned=await page.evaluate(()=>({
    focused:document.querySelector('#structureStage').classList.contains('focused'),
    overviewNodes:document.querySelectorAll('#overviewSvg .overview-node').length,
    selectionCards:document.querySelectorAll('#overviewSvg [data-overview-selection-card] .node-card').length
  }));
  assert.equal(returned.focused,false);
  assert.equal(returned.overviewNodes,before);
  assert.equal(returned.selectionCards,1);

  await page.click('#searchTrigger');
  await page.fill('#searchInput','repoaxis.html');
  await page.waitForTimeout(120);
  await page.locator('.search-result').first().click();
  await page.waitForTimeout(500);
  assert.equal(await page.locator('#structureStage').evaluate(el=>el.classList.contains('focused')),false);
  assert.equal(await page.locator('#overviewSvg [data-overview-selection-card] .node-card').count(),1);
  const graphJump=page.locator('#entityActions [data-jump-view="graph"]');
  assert.equal(await graphJump.count(),1);
  await graphJump.click();
  await page.waitForTimeout(350);
  assert.equal(await page.locator('#graphStage').evaluate(el=>el.classList.contains('active')),true);
  const structureJump=page.locator('#entityActions [data-jump-view="structure"]');
  assert.equal(await structureJump.count(),1);
  await structureJump.click();
  await page.waitForTimeout(500);
  assert.equal(await page.locator('#structureStage').evaluate(el=>el.classList.contains('focused')),false);
  assert.equal(await page.locator('#overviewSvg .overview-node').count(),before);
  assert.equal(await page.locator('#overviewSvg [data-overview-selection-card] .node-card').count(),1);
  await page.screenshot({path:path.join(out,'03-graph-to-whole-map.png')});
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(out,'metrics.json'),JSON.stringify({before,selected,focused,returned,errors},null,2));
  console.log('Structure whole-map browser QA passed');
  await page.close();
} finally {
  await browser.close();
  await new Promise(resolve=>viewer.server.close(resolve));
}
