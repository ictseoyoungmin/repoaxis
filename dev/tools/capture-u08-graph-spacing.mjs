import { chromium } from 'playwright';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1});
await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
await page.waitForFunction(()=>document.querySelector('#boot')?.hidden===true);
await page.locator('.rail-item[data-view="graph"]').click();
await page.waitForTimeout(450);

const readState=()=>page.evaluate(()=>{
  const svg=document.querySelector('#graphSvg'),g=document.querySelector('#graphGraph'),selected=document.querySelector('#graphSvg .node.selected');
  const rect=selected?.getBoundingClientRect(),bbox=g?.getBBox(),transform=g?.getAttribute('transform')||'';
  const match=transform.match(/scale\(([-\d.]+)\)/);
  return{viewBox:svg?.getAttribute('viewBox'),transform,scale:match?Number(match[1]):null,selected:selected?.dataset.id||null,selectedWidth:rect?.width||0,selectedHeight:rect?.height||0,worldWidth:bbox?.width||0,worldHeight:bbox?.height||0};
});

const reading=await readState();
if(reading.viewBox!=='0 0 1800 1040')throw new Error('unexpected graph viewport '+reading.viewBox);
if(Math.abs((reading.scale??0)-.92)>.001)throw new Error('unexpected reading scale '+reading.scale);
if(reading.selectedWidth<90)throw new Error('selected node still too small at default scale: '+reading.selectedWidth);
if(reading.worldWidth<=1800&&reading.worldHeight<=1040)throw new Error('graph world did not exceed readable viewport');
await page.screenshot({path:'u08-graph-reading-scale.png',fullPage:true});

const selected=page.locator('#graphSvg .node.selected');
await selected.hover();
await page.waitForTimeout(180);
const hover=await page.evaluate(()=>({ctx:document.querySelector('#graphHoverContext')?.textContent||'',active:document.querySelectorAll('#graphSvg .graph-edge-focus.graph-in,#graphSvg .graph-edge-focus.graph-out').length}));
if(!hover.ctx||hover.active<1)throw new Error('hover exploration did not survive spacing change');
await page.screenshot({path:'u08-graph-hover.png',fullPage:true});
await page.mouse.move(1500,850);
await page.waitForTimeout(120);

await page.locator('#fitBtn').click();
await page.waitForTimeout(220);
const fit=await readState();
if(!(fit.scale<reading.scale))throw new Error(`Fit did not zoom out: ${fit.scale} vs ${reading.scale}`);
if(!(fit.selectedWidth<reading.selectedWidth))throw new Error('Fit did not produce a smaller overview node');
await page.screenshot({path:'u08-graph-fit-overview.png',fullPage:true});

await page.locator('#zoomReset').click();
await page.waitForTimeout(220);
const reset=await readState();
if(Math.abs((reset.scale??0)-.92)>.001)throw new Error('reset did not restore reading scale');
console.log(JSON.stringify({reading,hover,fit,reset}));
await browser.close();
