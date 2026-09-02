// U10 final normal-click validation after macro hit-capsule correction.
import { chromium } from 'playwright';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1});
await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
await page.waitForFunction(()=>document.querySelector('#boot')?.hidden===true,{timeout:20000});
await page.waitForSelector('#structureSvg .node[data-id]');
await page.waitForTimeout(400);
const overview=await page.evaluate(()=>({
  mode:document.querySelector('#structureMode')?.textContent||'',
  nodes:document.querySelectorAll('#structureSvg .node[data-id]').length,
  visibleLabels:document.querySelectorAll('#structureSvg .macro-label').length,
  keyboardTargets:document.querySelectorAll('#structureSvg .macro-node[tabindex="0"][role="button"]').length,
  selected:document.querySelector('#structureSvg .node.selected')?.dataset.id||null,
  exploreButton:document.querySelector('#labelsBtn')?.textContent||''
}));
if(overview.nodes<10||overview.visibleLabels!==overview.nodes||overview.keyboardTargets!==overview.nodes)throw new Error('Whole topology targets are not directly identifiable: '+JSON.stringify(overview));
if(!overview.mode.includes('select to inspect'))throw new Error('Overview does not explain inspect-first flow: '+JSON.stringify(overview));
await page.screenshot({path:'u10-structure-baseline.png',fullPage:true});

const preferred='#structureSvg .node[data-id="folder:skills"]';
const target=await page.locator(preferred).count()?page.locator(preferred):page.locator('#structureSvg .node[data-id^="folder:"]').filter({hasNot:page.locator('[data-id="folder:."]')}).first();
const targetId=await target.getAttribute('data-id');
await target.click();
await page.waitForTimeout(380);
const inspected=await page.evaluate(()=>({
  mode:document.querySelector('#structureMode')?.textContent||'',
  wholeHidden:document.querySelector('#wholeBtn')?.hidden,
  drawerOpen:document.querySelector('#content')?.classList.contains('drawer-open'),
  drawerWidth:document.querySelector('#drawer')?.getBoundingClientRect().width||0,
  selected:document.querySelector('#structureSvg .node.selected')?.dataset.id||null,
  exploreButton:document.querySelector('#labelsBtn')?.textContent||'',
  entity:document.querySelector('#entityName')?.textContent||''
}));
if(!inspected.mode.startsWith('Repository topology')||inspected.wholeHidden!==true||!inspected.drawerOpen||inspected.drawerWidth<300||inspected.selected!==targetId||inspected.exploreButton!=='Explore selected')throw new Error('First click did not stay in overview inspection: '+JSON.stringify({targetId,inspected}));
await page.screenshot({path:'u10-structure-after-first-click.png',fullPage:true});

await page.click('#labelsBtn');
await page.waitForTimeout(300);
const explored=await page.evaluate(()=>({
  mode:document.querySelector('#structureMode')?.textContent||'',
  wholeHidden:document.querySelector('#wholeBtn')?.hidden,
  drawerOpen:document.querySelector('#content')?.classList.contains('drawer-open'),
  selected:document.querySelector('#structureSvg .node.selected')?.dataset.id||null
}));
if(explored.mode.startsWith('Repository topology')||explored.wholeHidden!==false)throw new Error('Explicit Explore selected did not drill into focused structure: '+JSON.stringify(explored));
console.log(JSON.stringify({targetId,overview,inspected,explored}));
await browser.close();
