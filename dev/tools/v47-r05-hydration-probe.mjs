import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';
import { startViewer } from '../../skills/repoaxis/lib/view-server.mjs';
const root=process.cwd(),out=path.join(process.env.RUNNER_TEMP||os.tmpdir(),'v47-r05');fs.mkdirSync(out,{recursive:true});
const viewer=await startViewer({root,port:0,open:false});const browser=await chromium.launch({headless:true});
const results=[];let worst={width:0,height:0,iteration:-1,phase:''};
try{
  for(let i=0;i<12;i++){
    const page=await browser.newPage({viewport:{width:i%2?1280:1600,height:i%2?820:1000},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
    await page.addInitScript(delay=>{const real=window.fetch.bind(window);window.fetch=(input,init)=>{const u=typeof input==='string'?input:input?.url||'';if(/\/api\/(index|meta|history)$/.test(u))return new Promise((resolve,reject)=>setTimeout(()=>real(input,init).then(resolve,reject),delay));return real(input,init)}},180+(i%5)*90);
    await page.goto(viewer.url,{waitUntil:'domcontentloaded'});
    const samples=[];
    for(let k=0;k<18;k++){
      await page.waitForTimeout(45);
      const m=await page.evaluate(()=>{const els=[...document.querySelectorAll('#overviewSvg .overview-hit-zone,#overviewSvg .overview-hover-ring,#overviewSvg .overview-assist-zone')];const rects=els.map(el=>{const r=el.getBoundingClientRect();return{cls:el.getAttribute('class'),w:r.width,h:r.height}});return{ready:document.documentElement.dataset.repoaxisLive||'',maxW:Math.max(0,...rects.map(r=>r.w)),maxH:Math.max(0,...rects.map(r=>r.h)),count:rects.length}});samples.push(m);if(m.maxW>worst.width)worst={width:m.maxW,height:m.maxH,iteration:i,phase:m.ready||'hydrating'};
    }
    await page.waitForFunction(()=>document.documentElement.dataset.repoaxisLive==='ready',{timeout:20000});
    await page.setViewportSize({width:i%2?1600:1280,height:i%2?1000:820});await page.waitForTimeout(120);
    const final=await page.evaluate(()=>{const bogus=tree.filter(n=>n.type==='folder'&&(n.path==='.'||n.path==='./'||n.label==='./'));const rootChildren=tree.filter(n=>n.parent==='root').map(n=>({id:n.id,label:n.label,path:n.path,type:n.type}));const rects=[...document.querySelectorAll('#overviewSvg .overview-hit-zone,#overviewSvg .overview-hover-ring,#overviewSvg .overview-assist-zone')].map(el=>{const r=el.getBoundingClientRect();return{cls:el.getAttribute('class'),w:r.width,h:r.height}});return{bogus,rootChildren,maxW:Math.max(0,...rects.map(r=>r.w)),maxH:Math.max(0,...rects.map(r=>r.h)),armed:document.querySelectorAll('#overviewSvg .overview-node.acquisition-armed').length,errors:[]}});
    const node=page.locator('#overviewSvg .overview-node').nth(2);if(await node.count())await node.hover();await page.waitForTimeout(80);const hovered=await page.evaluate(()=>{const rects=[...document.querySelectorAll('#overviewSvg .overview-hover-ring')].map(el=>{const r=el.getBoundingClientRect();return{w:r.width,h:r.height,opacity:getComputedStyle(el).opacity}});return{maxW:Math.max(0,...rects.map(r=>r.w)),maxH:Math.max(0,...rects.map(r=>r.h)),visible:rects.filter(r=>Number(r.opacity)>0).length}});
    if(i===0){await page.screenshot({path:path.join(out,'overview-after-hydration.png')});await page.evaluate(()=>enterStructureFocus('root'));await page.waitForTimeout(180);await page.screenshot({path:path.join(out,'focus-root-collapsed.png')});}
    results.push({iteration:i,samples,final,hovered,errors});await page.close();
  }
  const failures=[];for(const r of results){if(r.final.bogus.length)failures.push(`iteration ${r.iteration}: duplicate canonical root visible`);if(r.errors.length)failures.push(`iteration ${r.iteration}: ${r.errors.join(' | ')}`);const sampleMax=Math.max(0,...r.samples.map(x=>Math.max(x.maxW,x.maxH)),r.final.maxW,r.final.maxH,r.hovered.maxW,r.hovered.maxH);if(sampleMax>120)failures.push(`iteration ${r.iteration}: helper geometry ${sampleMax.toFixed(1)}px`)}
  const report={iterations:results.length,worst,failures,results};fs.writeFileSync(path.join(out,'probe.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({iterations:results.length,worst,failures}));if(failures.length)process.exitCode=1;
}finally{await browser.close();await new Promise(r=>viewer.server.close(r))}
