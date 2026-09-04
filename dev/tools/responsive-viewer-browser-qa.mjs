import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { startViewer } from '../../skills/repoaxis/lib/view-server.mjs';

const root=process.cwd();
const out=path.join(root,'dev','visuals','responsive-viewer-browser-qa');
fs.mkdirSync(out,{recursive:true});
const viewer=await startViewer({root,port:0,open:false});
const browser=await chromium.launch({headless:true});
try{
  for(const [width,height] of [[1280,820],[1600,900]]){
    const page=await browser.newPage({viewport:{width,height}});
    const errors=[]; page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
    await page.goto(viewer.url,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.documentElement.dataset.repoaxisLive==='ready',{timeout:30000});
    for(const view of ['structure','dependencies','changes','graph']){
      await page.click(`.rail-item[data-view="${view}"]`);
      await page.waitForTimeout(180);
      const metrics=await page.evaluate(view=>{
        const active=document.querySelector('.view-stage.active');
        const host=document.querySelector('.view-host');
        const zoom=active?.querySelector('.zoom-cluster:not([hidden])');
        const hb=host?.getBoundingClientRect();
        const zb=zoom?.getBoundingClientRect();
        return {
          view,
          viewport:innerWidth,
          documentWidth:document.documentElement.scrollWidth,
          bodyWidth:document.body.scrollWidth,
          host:hb?{left:hb.left,right:hb.right,width:hb.width}:null,
          zoom:zb?{left:zb.left,right:zb.right,width:zb.width}:null,
          zoomButtons:zoom?.querySelectorAll('button').length||0
        };
      },view);
      assert.equal(metrics.documentWidth,width,`${view} document width at ${width}`);
      assert.equal(metrics.bodyWidth,width,`${view} body width at ${width}`);
      if(metrics.zoom){
        assert.ok(metrics.zoomButtons>=2,`${view} zoom cluster must expose all controls`);
        assert.ok(metrics.zoom.left>=metrics.host.left,`${view} zoom left clipped`);
        assert.ok(metrics.zoom.right<=metrics.host.right+0.5,`${view} zoom right clipped: ${JSON.stringify(metrics)}`);
        assert.ok(metrics.zoom.width>=68,`${view} zoom cluster collapsed: ${JSON.stringify(metrics.zoom)}`);
      }
      fs.writeFileSync(path.join(out,`${width}-${view}.json`),JSON.stringify(metrics,null,2));
      await page.screenshot({path:path.join(out,`${width}-${view}.png`),fullPage:false});
    }
    assert.deepEqual(errors,[]);
    await page.close();
  }
  console.log('responsive viewer browser QA passed');
} finally {
  await browser.close();
  await new Promise(resolve=>viewer.server.close(resolve));
}
