import { chromium } from 'playwright';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1});
await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
await page.waitForFunction(()=>document.querySelector('#boot')?.hidden===true,{timeout:20000});
await page.waitForTimeout(600);

const box=async sel=>{const r=await page.locator(sel).first().boundingBox();if(!r)throw new Error('Missing box: '+sel);return r};
const host=()=>page.evaluate(()=>{const r=document.querySelector('.view-host')?.getBoundingClientRect();return r?{x:r.x,y:r.y,w:r.width,h:r.height}:null});
const viewBox=sel=>page.evaluate(s=>{const e=document.querySelector(s),v=e?.viewBox?.baseVal;return v?{w:v.width,h:v.height}:null},sel);
const closeDrawer=async()=>{if(await page.locator('#drawerClose').isVisible().catch(()=>false)){await page.locator('#drawerClose').click();await page.waitForTimeout(650)}};
const stable=(a,b,t=.055)=>Math.abs(a-b)/Math.max(1,a)<=t;
const inside=(r,h)=>r.x+r.width/2>=h.x&&r.x+r.width/2<=h.x+h.w&&r.y+r.height/2>=h.y&&r.y+r.height/2<=h.y+h.h;

// Structure: opening the 404px Inspector must not shrink macro targets.
await page.waitForSelector('#structureSvg .macro-node[data-id="folder:skills"]');
const structureBefore={host:await host(),target:await box('#structureSvg .macro-node[data-id="folder:skills"] .macro-target'),vb:await viewBox('#structureSvg')};
await page.screenshot({path:'u12-structure-before.png',fullPage:true});
await page.locator('#structureSvg .macro-node[data-id="folder:skills"] .macro-target').click();
await page.waitForTimeout(900);
const structureAfter={host:await host(),target:await box('#structureSvg .macro-node[data-id="folder:skills"] .macro-target'),vb:await viewBox('#structureSvg'),mode:await page.locator('#structureMode').textContent(),drawer:await box('#drawer')};
if(!(structureAfter.host.w<structureBefore.host.w-300))throw new Error('Structure host did not shrink for drawer');
if(!stable(structureBefore.target.width,structureAfter.target.width)||!stable(structureBefore.target.height,structureAfter.target.height))throw new Error('Structure macro target scaled across drawer: '+JSON.stringify({structureBefore,structureAfter}));
if(!inside(structureAfter.target,structureAfter.host))throw new Error('Structure selected target left usable viewport');
if(!structureAfter.mode?.startsWith('Repository topology'))throw new Error('U10 inspect-first mode regressed');
await page.screenshot({path:'u12-structure-drawer-open.png',fullPage:true});
await closeDrawer();

// Dependencies: measure the real dep-tree SVG, not the whole host.
await page.locator('.rail-item[data-view="dependencies"]').click();
await page.waitForSelector('#depSvg .node[data-id]');
await page.waitForTimeout(650);
const depNode=page.locator('#depSvg .node[data-id]').first();
const depId=await depNode.getAttribute('data-id');
const depBefore={host:await host(),card:await box(`#depSvg .node[data-id="${depId}"] .bg`),svg:await box('#depSvg'),vb:await viewBox('#depSvg')};
await depNode.locator('.bg').click();
await page.waitForTimeout(900);
const depAfter={host:await host(),card:await box(`#depSvg .node[data-id="${depId}"] .bg`),svg:await box('#depSvg'),vb:await viewBox('#depSvg'),drawer:await box('#drawer')};
if(!stable(depBefore.card.width,depAfter.card.width)||!stable(depBefore.card.height,depAfter.card.height))throw new Error('Dependency card scaled across drawer: '+JSON.stringify({depBefore,depAfter}));
if(Math.abs(depAfter.svg.width-depAfter.vb.w)>3||Math.abs(depAfter.svg.height-depAfter.vb.h)>3)throw new Error('Dependency viewBox does not match real dep-tree viewport: '+JSON.stringify(depAfter));
if(!inside(depAfter.card,depAfter.svg))throw new Error('Dependency root left dep-tree viewport');
await page.screenshot({path:'u12-dependencies-drawer-open.png',fullPage:true});
await closeDrawer();

// Graph: retain the spacing-first .92 camera while usable width changes.
await page.locator('.rail-item[data-view="graph"]').click();
await page.waitForSelector('#graphSvg .node.selected .bg');
await page.waitForTimeout(800);
const graphBefore={host:await host(),card:await box('#graphSvg .node.selected .bg'),vb:await viewBox('#graphSvg')};
await page.locator('#graphSvg .node.selected .bg').click();
await page.waitForTimeout(1000);
const graphAfter={host:await host(),card:await box('#graphSvg .node.selected .bg'),vb:await viewBox('#graphSvg'),drawer:await box('#drawer')};
if(!stable(graphBefore.card.width,graphAfter.card.width)||!stable(graphBefore.card.height,graphAfter.card.height))throw new Error('Graph card scaled across drawer: '+JSON.stringify({graphBefore,graphAfter}));
if(!inside(graphAfter.card,graphAfter.host))throw new Error('Graph selection left usable viewport after drawer');
if(Math.abs(graphAfter.host.w-graphAfter.vb.w)>3||Math.abs(graphAfter.host.h-graphAfter.vb.h)>3)throw new Error('Graph viewBox did not follow usable viewport');
await page.screenshot({path:'u12-graph-drawer-open.png',fullPage:true});
await closeDrawer();

// Browser resize must keep the same graph card scale as well.
await page.waitForTimeout(500);
const resizeBefore={host:await host(),card:await box('#graphSvg .node.selected .bg'),vb:await viewBox('#graphSvg')};
await page.setViewportSize({width:1280,height:820});
await page.waitForTimeout(1000);
const resizeAfter={host:await host(),card:await box('#graphSvg .node.selected .bg'),vb:await viewBox('#graphSvg')};
if(!stable(resizeBefore.card.width,resizeAfter.card.width)||!stable(resizeBefore.card.height,resizeAfter.card.height))throw new Error('Graph card scaled across browser resize: '+JSON.stringify({resizeBefore,resizeAfter}));
if(!inside(resizeAfter.card,resizeAfter.host))throw new Error('Graph selection left viewport after browser resize');
if(Math.abs(resizeAfter.host.w-resizeAfter.vb.w)>3||Math.abs(resizeAfter.host.h-resizeAfter.vb.h)>3)throw new Error('Graph resized viewBox mismatch');
await page.screenshot({path:'u12-graph-resized.png',fullPage:true});

console.log(JSON.stringify({structureBefore,structureAfter,depId,depBefore,depAfter,graphBefore,graphAfter,resizeBefore,resizeAfter}));
await browser.close();
