import { chromium } from 'playwright';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1});
await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
await page.locator('#boot').waitFor({state:'hidden'});
await page.locator('.rail-item[data-view="graph"]').click();
await page.locator('#graphView.active').waitFor();
await page.screenshot({path:'u06-graph-overview.png',fullPage:false});
const nodeIds=await page.locator('#graphSvg .node[data-id]').evaluateAll(els=>els.map(el=>el.getAttribute('data-id')).filter(Boolean));
const pairs=await page.locator('#graphSvg .edge[data-from][data-to]').evaluateAll(els=>els.map(el=>[el.getAttribute('data-from'),el.getAttribute('data-to')]));
const degree=new Map(nodeIds.map(id=>[id,0]));
for(const[a,b]of pairs){if(degree.has(a))degree.set(a,degree.get(a)+1);if(degree.has(b))degree.set(b,degree.get(b)+1)}
const target=[...degree.entries()].sort((a,b)=>b[1]-a[1])[0];
if(!target||target[1]===0)throw new Error('no connected rendered graph node available');
const targetNode=page.locator(`#graphSvg .node[data-id="${target[0].replaceAll('"','\\"')}"]`);
await targetNode.hover();
await page.locator('#graphSvg.exploring').waitFor();
const context=(await page.locator('#graphHoverContext').textContent())?.trim()||'';
if(!/\d+ in · \d+ out/.test(context))throw new Error(`missing directional hover context: ${context}`);
const active=await page.locator('#graphSvg .node.graph-active').count();
const neighbors=await page.locator('#graphSvg .node.graph-neighbor').count();
const directional=await page.locator('#graphSvg .edge.graph-in, #graphSvg .edge.graph-out').count();
const relatedScopes=await page.locator('#graphSvg .graph-scope.graph-related').count();
if(active!==1||neighbors<1||directional<1||relatedScopes<1)throw new Error(`incomplete exploratory state active=${active} neighbors=${neighbors} directional=${directional} scopes=${relatedScopes}`);
await page.screenshot({path:'u06-graph-hover-context.png',fullPage:false});
console.log(JSON.stringify({target:target[0],degree:target[1],context,neighbors,directional,relatedScopes}));
await browser.close();
