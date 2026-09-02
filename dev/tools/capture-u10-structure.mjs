import { chromium } from 'playwright';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1});
await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
await page.waitForFunction(()=>document.querySelector('#boot')?.hidden===true,{timeout:20000});
await page.waitForSelector('#structureSvg .node[data-id]');
await page.waitForTimeout(400);
const baseline=await page.evaluate(()=>({
  mode:document.querySelector('#structureMode')?.textContent||'',
  nodes:document.querySelectorAll('#structureSvg .node[data-id]').length,
  visibleLabels:[...document.querySelectorAll('#structureSvg .node[data-id] text')].filter(x=>x.textContent.trim()).length,
  circles:document.querySelectorAll('#structureSvg .node[data-id] circle').length,
  selected:document.querySelector('#structureSvg .node.selected')?.dataset.id||null,
  focusButton:document.querySelector('#labelsBtn')?.textContent||''
}));
await page.screenshot({path:'u10-structure-baseline.png',fullPage:true});
const target=page.locator('#structureSvg .node[data-id^="folder:"]').first();
const targetId=await target.getAttribute('data-id');
await target.click();
await page.waitForTimeout(350);
const afterClick=await page.evaluate(()=>({
  mode:document.querySelector('#structureMode')?.textContent||'',
  wholeHidden:document.querySelector('#wholeBtn')?.hidden,
  drawerOpen:document.querySelector('#content')?.classList.contains('drawer-open'),
  selected:document.querySelector('#structureSvg .node.selected')?.dataset.id||null
}));
await page.screenshot({path:'u10-structure-after-first-click.png',fullPage:true});
console.log(JSON.stringify({targetId,baseline,afterClick}));
await browser.close();
