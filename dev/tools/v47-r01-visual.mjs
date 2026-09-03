import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { startViewer } from '../../skills/repoaxis/lib/view-server.mjs';

const out=path.resolve('artifacts/v47-r01');fs.mkdirSync(out,{recursive:true});
const viewer=await startViewer({root:process.cwd(),port:0,open:false});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
try{
  await page.goto(viewer.url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.dataset.repoaxisLive==='ready',{timeout:30000});
  await page.waitForTimeout(800);
  const metrics=await page.evaluate(()=>({live:document.documentElement.dataset.repoaxisLive,repo:document.querySelector('.repo-name')?.textContent,host:document.querySelector('.public')?.textContent,branch:document.querySelector('.branch > span:first-of-type')?.textContent,sha:document.querySelector('.commit code')?.textContent,detail:window.__REPOAXIS_LIVE__&&{nodes:tree.length-1,files:files().length,imports:importEdges.length,changes:changes.length,depRoot:state.depRoot},fixtureRepo:document.querySelector('.repo-name')?.textContent==='ictseoyoungmin/repoaxis'&&document.querySelector('.commit code')?.textContent==='a1b2c3d',overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth}));
  await page.screenshot({path:path.join(out,'structure-1600.png')});
  await page.click('.rail-item[data-view="dependencies"]');await page.waitForTimeout(700);await page.screenshot({path:path.join(out,'dependencies-1600.png')});
  await page.click('.rail-item[data-view="graph"]');await page.waitForTimeout(900);await page.screenshot({path:path.join(out,'graph-1600.png')});
  await page.click('.rail-item[data-view="changes"]');await page.waitForTimeout(500);await page.screenshot({path:path.join(out,'changes-1600.png')});
  const surfaces=await page.evaluate(()=>({structureNodes:document.querySelectorAll('#overviewSvg .overview-node').length,depNodes:document.querySelectorAll('#dependenciesCanvas .dt-node').length,graphNodes:document.querySelectorAll('#graphSvg .g-node').length,changeRows:document.querySelectorAll('#changesShell .change-row').length,repo:document.querySelector('.repo-name')?.textContent,branch:document.querySelector('.branch > span:first-of-type')?.textContent,sha:document.querySelector('.commit code')?.textContent}));
  const result={...metrics,surfaces,errors};fs.writeFileSync(path.join(out,'metrics.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
  if(metrics.live!=='ready'||metrics.fixtureRepo||!metrics.detail?.files||!metrics.detail?.imports||!surfaces.structureNodes||!surfaces.depNodes||!surfaces.graphNodes||errors.length)process.exitCode=1;
}finally{await browser.close();await new Promise(r=>viewer.server.close(r))}
