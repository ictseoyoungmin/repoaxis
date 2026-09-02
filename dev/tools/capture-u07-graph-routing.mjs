import { chromium } from 'playwright';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1});
await page.goto('http://127.0.0.1:4173/#graph',{waitUntil:'networkidle'});
await page.waitForSelector('#graphSvg .node[data-id]');
await page.waitForTimeout(500);
const geometry=await page.evaluate(()=>{
  const base=[...document.querySelectorAll('#graphSvg .graph-edge-base')];
  const focus=[...document.querySelectorAll('#graphSvg .graph-edge-focus')];
  const cross=base.filter(x=>x.classList.contains('cross-folder')).length;
  const local=base.filter(x=>x.classList.contains('local')).length;
  const cubic=base.filter(x=>/\bC\b/.test(x.getAttribute('d')||'')).length;
  const rounded=base.filter(x=>/\bQ\b/.test(x.getAttribute('d')||'')).length;
  return{base:base.length,focus:focus.length,cross,local,cubic,rounded};
});
if(!geometry.base||geometry.base!==geometry.focus||geometry.cubic!==0||geometry.rounded===0)throw new Error('routing geometry validation failed '+JSON.stringify(geometry));
await page.screenshot({path:'u07-graph-routed-overview.png',fullPage:true});
const target=await page.evaluate(()=>{
  const visible=new Set([...document.querySelectorAll('#graphSvg .node[data-id]')].map(x=>x.dataset.id));
  const degree=new Map([...visible].map(id=>[id,0]));
  for(const edge of document.querySelectorAll('#graphSvg .graph-edge-base')){const a=edge.dataset.from,b=edge.dataset.to;if(visible.has(a)&&visible.has(b)){degree.set(a,(degree.get(a)||0)+1);degree.set(b,(degree.get(b)||0)+1)}}
  return [...degree.entries()].sort((a,b)=>b[1]-a[1])[0];
});
if(!target)throw new Error('no graph target');
const node=page.locator(`#graphSvg .node[data-id="${target[0].replaceAll('\\','\\\\').replaceAll('"','\\"')}"]`);
await node.hover();
await page.waitForTimeout(250);
const hover=await page.evaluate(()=>({ctx:document.querySelector('#graphHoverContext')?.textContent,active:document.querySelectorAll('#graphSvg .graph-edge-focus.graph-in,#graphSvg .graph-edge-focus.graph-out').length,baseOpacity:getComputedStyle(document.querySelector('#graphSvg .graph-edge-base')).opacity}));
if(!hover.ctx||!hover.active)throw new Error('hover focus layer failed '+JSON.stringify(hover));
await page.screenshot({path:'u07-graph-routed-hover.png',fullPage:true});
console.log(JSON.stringify({geometry,target,hover}));
await browser.close();
