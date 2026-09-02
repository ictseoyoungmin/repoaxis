import { chromium } from 'playwright';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1});
await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
await page.waitForFunction(()=>document.querySelector('#boot')?.hidden===true,{timeout:20000});
await page.click('.rail-item[data-view="graph"]');
await page.waitForSelector('#graphSvg .graph-edge-base');
await page.waitForTimeout(500);

const metrics=await page.evaluate(()=>{
  const edges=[...document.querySelectorAll('#graphSvg .graph-edge-base')];
  const nodes=[...document.querySelectorAll('#graphSvg .node[data-id]')].map(el=>{
    const r=el.querySelector('.bg');
    return{id:el.dataset.id,x:Number(r.getAttribute('x')),y:Number(r.getAttribute('y')),w:Number(r.getAttribute('width')),h:Number(r.getAttribute('height'))};
  });
  const routeCounts={},obstacleCounts={};let collisionEdges=0,totalSamples=0;
  for(const path of edges){
    routeCounts[path.dataset.route]=(routeCounts[path.dataset.route]||0)+1;
    obstacleCounts[path.dataset.obstacle]=(obstacleCounts[path.dataset.obstacle]||0)+1;
    const from=path.dataset.from,to=path.dataset.to,len=path.getTotalLength();let collided=false;
    for(let d=0;d<=len;d+=5){
      totalSamples++;const p=path.getPointAtLength(d);
      for(const n of nodes){
        if(n.id===from||n.id===to)continue;
        if(p.x>n.x&&p.x<n.x+n.w&&p.y>n.y&&p.y<n.y+n.h){collided=true;break}
      }
      if(collided)break;
    }
    if(collided)collisionEdges++;
  }
  const transform=document.querySelector('#graphGraph')?.getAttribute('transform')||'';
  const selected=document.querySelector('#graphSvg .node.selected')?.dataset.id||null;
  const vb=document.querySelector('#graphSvg')?.getAttribute('viewBox');
  return{edges:edges.length,nodes:nodes.length,routeCounts,obstacleCounts,collisionEdges,totalSamples,transform,selected,viewBox:vb};
});
if(metrics.edges<20)throw new Error('Graph capture is not dense enough: '+JSON.stringify(metrics));
if((metrics.obstacleCounts.blocked||0)!==0)throw new Error('Blocked fallback routes remain: '+JSON.stringify(metrics));
if(metrics.collisionEdges!==0)throw new Error('Foreign-node edge collisions remain: '+JSON.stringify(metrics));
await page.screenshot({path:'u09-graph-dense-overview.png',fullPage:true});

const target='#graphSvg .node[data-id="file:skills/repoaxis/lib/indexer.mjs"]';
if(await page.locator(target).count()){
  await page.hover(target);await page.waitForTimeout(250);
}else{
  const candidate=await page.evaluate(()=>{
    const nodes=[...document.querySelectorAll('#graphSvg .node[data-id]')];
    const edges=[...document.querySelectorAll('#graphSvg .graph-edge-base')];
    let best=null;for(const n of nodes){const id=n.dataset.id,degree=edges.filter(e=>e.dataset.from===id||e.dataset.to===id).length;if(!best||degree>best.degree)best={id,degree}}return best?.id||null;
  });
  if(candidate)await page.hover(`#graphSvg .node[data-id="${CSS.escape(candidate)}"]`);
  await page.waitForTimeout(250);
}
const hover=await page.evaluate(()=>({context:document.querySelector('#graphHoverContext')?.textContent||'',active:[...document.querySelectorAll('#graphSvg .graph-edge-focus.graph-in,#graphSvg .graph-edge-focus.graph-out')].length}));
if(!hover.context||hover.active<1)throw new Error('Hover exploration did not survive U09: '+JSON.stringify(hover));
await page.screenshot({path:'u09-graph-dense-hover.png',fullPage:true});
console.log(JSON.stringify({metrics,hover}));
await browser.close();
