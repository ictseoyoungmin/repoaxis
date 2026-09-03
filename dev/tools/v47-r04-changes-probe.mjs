import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';
import { startViewer } from '../../skills/repoaxis/lib/view-server.mjs';

const root=process.cwd(),out=path.join(process.env.RUNNER_TEMP||os.tmpdir(),'v47-r04');fs.mkdirSync(out,{recursive:true});
const git=(...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8'}).trim();
fs.appendFileSync(path.join(root,'README.md'),'\n<!-- R04 working-only probe -->\n');
fs.appendFileSync(path.join(root,'docs/viewer.md'),'\n<!-- R04 staged-only probe -->\n');git('add','docs/viewer.md');
fs.appendFileSync(path.join(root,'CHANGELOG.md'),'\n<!-- R04 mixed staged -->\n');git('add','CHANGELOG.md');fs.appendFileSync(path.join(root,'CHANGELOG.md'),'<!-- R04 mixed working -->\n');
fs.rmSync(path.join(root,'docs/releasing.md'));
const porcelain=git('status','--porcelain=v1');fs.writeFileSync(path.join(out,'git-status.txt'),porcelain+'\n');

const viewer=await startViewer({root,port:0,open:false});const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
const snap=label=>page.evaluate(label=>({label,view:state.view,selected:state.selected,drawer:state.drawer,cardCount:document.querySelector('#cardCount')?.textContent||null,checked:[...document.querySelectorAll('#changesStage input[type=checkbox]:checked')].length,buttons:[...document.querySelectorAll('#changesStage button')].map(b=>({text:b.textContent.trim(),disabled:b.disabled})).filter(x=>x.text)}),label);
try{
  await page.goto(viewer.url,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.documentElement.dataset.repoaxisLive==='ready',{timeout:20000});await page.waitForTimeout(700);
  const result={porcelain};
  result.live=await page.evaluate(()=>({changes:(changes||[]).map(c=>({id:c.id,path:c.path,status:c.status,stage:c.stage,meta:c.meta,kind:c.kind})),selected:state.selected,view:state.view}));
  await page.click('.rail-item[data-view="changes"]');await page.waitForTimeout(600);result.initialChanges=await snap('changes-initial');await page.screenshot({path:path.join(out,'changes-dirty.png')});
  const allCurrent=page.getByRole('button',{name:'All current',exact:true});if(await allCurrent.count()){await allCurrent.click();await page.waitForTimeout(350);}result.afterAllCurrent=await snap('after-all-current');await page.screenshot({path:path.join(out,'changes-all-current.png')});
  const impact=page.getByRole('button',{name:'Analyze impact',exact:true});result.impactButton={count:await impact.count(),disabled:await impact.count()?await impact.isDisabled():null};if(await impact.count()&&!(await impact.isDisabled())){await impact.click();await page.waitForTimeout(900);result.afterImpact=await snap('after-impact');await page.screenshot({path:path.join(out,'changes-impact.png')});}
  await page.click('.rail-item[data-view="changes"]');await page.waitForTimeout(450);if(await allCurrent.count()){await allCurrent.click();await page.waitForTimeout(250);}const graphBtn=page.getByRole('button',{name:'View in Graph',exact:true});result.graphButton={count:await graphBtn.count(),disabled:await graphBtn.count()?await graphBtn.isDisabled():null};if(await graphBtn.count()&&!(await graphBtn.isDisabled())){await graphBtn.click();await page.waitForTimeout(900);result.afterGraph=await snap('after-graph');await page.screenshot({path:path.join(out,'changes-graph.png')});}
  result.errors=errors;fs.writeFileSync(path.join(out,'probe.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();await new Promise(r=>viewer.server.close(r))}
