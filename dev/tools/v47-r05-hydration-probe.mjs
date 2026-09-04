import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';
import { startViewer } from '../../skills/repoaxis/lib/view-server.mjs';
const root=process.cwd(),out=path.join(process.env.RUNNER_TEMP||os.tmpdir(),'v47-r05');fs.mkdirSync(out,{recursive:true});
const viewer=await startViewer({root,port:0,open:false});const browser=await chromium.launch({headless:true});const results=[];
try{
  for(let i=0;i<4;i++){
    const page=await browser.newPage({viewport:{width:i%2?1280:1600,height:i%2?820:1000}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
    await page.addInitScript(delay=>{const real=window.fetch.bind(window);window.fetch=(input,init)=>{const u=typeof input==='string'?input:input?.url||'';if(/\/api\/(index|meta|history)$/.test(u))return new Promise((resolve,reject)=>setTimeout(()=>real(input,init).then(resolve,reject),delay));return real(input,init)}},250+i*120);
    await page.goto(viewer.url,{waitUntil:'domcontentloaded'});const samples=[];
    for(let k=0;k<24;k++){await page.waitForTimeout(60);samples.push(await page.evaluate(()=>{const rects=[...document.querySelectorAll('#overviewSvg .overview-hit-zone,#overviewSvg .overview-hover-ring,#overviewSvg .overview-assist-zone')].map(el=>{const r=el.getBoundingClientRect();return{c:el.getAttribute('class'),w:r.width,h:r.height}});return{ready:document.documentElement.dataset.repoaxisLive||'',liveError:window.__REPOAXIS_LIVE__?.error||null,maxW:Math.max(0,...rects.map(r=>r.w)),maxH:Math.max(0,...rects.map(r=>r.h)),count:rects.length}}));}
    const stateNow=await page.evaluate(()=>({ready:document.documentElement.dataset.repoaxisLive||'',liveError:window.__REPOAXIS_LIVE__?.error||null}));
    let final=null,hovered=null;
    if(stateNow.ready==='ready'){
      await page.setViewportSize({width:i%2?1600:1280,height:i%2?1000:820});await page.waitForTimeout(120);
      final=await page.evaluate(()=>{const bogus=tree.filter(n=>n.type==='folder'&&(n.path==='.'||n.path==='./'||n.label==='./')),rootChildren=tree.filter(n=>n.parent==='root').map(n=>({id:n.id,label:n.label,path:n.path,type:n.type})),rects=[...document.querySelectorAll('#overviewSvg .overview-hit-zone,#overviewSvg .overview-hover-ring,#overviewSvg .overview-assist-zone')].map(el=>{const r=el.getBoundingClientRect();return{c:el.getAttribute('class'),w:r.width,h:r.height}});return{bogus,rootChildren,maxW:Math.max(0,...rects.map(r=>r.w)),maxH:Math.max(0,...rects.map(r=>r.h)),armed:document.querySelectorAll('#overviewSvg .overview-node.acquisition-armed').length}});
      const node=page.locator('#overviewSvg .overview-node').nth(2);if(await node.count())await node.hover();await page.waitForTimeout(80);hovered=await page.evaluate(()=>{const rects=[...document.querySelectorAll('#overviewSvg .overview-hover-ring')].map(el=>{const r=el.getBoundingClientRect();return{w:r.width,h:r.height,opacity:getComputedStyle(el).opacity}});return{maxW:Math.max(0,...rects.map(r=>r.w)),maxH:Math.max(0,...rects.map(r=>r.h)),visible:rects.filter(r=>Number(r.opacity)>0).length}});
      if(i===0){await page.screenshot({path:path.join(out,'overview-after-hydration.png')});await page.evaluate(()=>enterStructureFocus('root'));await page.waitForTimeout(180);await page.screenshot({path:path.join(out,'focus-root-collapsed.png')});}
    }else if(i===0){await page.screenshot({path:path.join(out,'hydration-error.png')});}
    results.push({iteration:i,samples,stateNow,final,hovered,errors});await page.close();
  }
  const failures=[];for(const r of results){if(r.stateNow.ready!=='ready')failures.push(`iteration ${r.iteration}: live=${r.stateNow.ready} error=${r.stateNow.liveError||'none'} console=${r.errors.join(' | ')}`);if(r.final?.bogus?.length)failures.push(`iteration ${r.iteration}: duplicate canonical root`);const vals=[...r.samples.flatMap(x=>[x.maxW,x.maxH]),r.final?.maxW||0,r.final?.maxH||0,r.hovered?.maxW||0,r.hovered?.maxH||0],mx=Math.max(...vals);if(mx>120)failures.push(`iteration ${r.iteration}: helper geometry ${mx.toFixed(1)}px`)}
  const report={failures,results};fs.writeFileSync(path.join(out,'probe.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({failures,states:results.map(r=>r.stateNow)}));if(failures.length)process.exitCode=1;
}finally{await browser.close();await new Promise(r=>viewer.server.close(r))}
