import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';
import { startViewer } from '../../skills/repoaxis/lib/view-server.mjs';

const root=process.cwd(),out=path.resolve('artifacts/v47-r04');fs.mkdirSync(out,{recursive:true});
const git=(...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8'}).trim();
// Create four real Git states without committing them.
fs.appendFileSync(path.join(root,'README.md'),'\n<!-- R04 working-only probe -->\n');
fs.appendFileSync(path.join(root,'docs/viewer.md'),'\n<!-- R04 staged-only probe -->\n');git('add','docs/viewer.md');
fs.appendFileSync(path.join(root,'CHANGELOG.md'),'\n<!-- R04 mixed staged -->\n');git('add','CHANGELOG.md');fs.appendFileSync(path.join(root,'CHANGELOG.md'),'<!-- R04 mixed working -->\n');
fs.rmSync(path.join(root,'docs/release.md'));
const porcelain=git('status','--porcelain=v1');fs.writeFileSync(path.join(out,'git-status.txt'),porcelain+'\n');

const viewer=await startViewer({root,port:0,open:false});const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
try{
  await page.goto(viewer.url,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.documentElement.dataset.repoaxisLive==='ready',{timeout:20000});await page.waitForTimeout(700);
  const result={porcelain};
  result.live=await page.evaluate(()=>({changes:(changes||[]).map(c=>({path:c.path,status:c.status,staged:c.staged,working:c.working,kind:c.kind,raw:c})),selected:state.selected,view:state.view}));
  await page.click('.rail-item[data-view="changes"]');await page.waitForTimeout(700);
  result.surface=await page.evaluate(()=>({view:state.view,cardCount:document.querySelector('#cardCount')?.textContent||null,bodyText:document.querySelector('#changesStage')?.innerText||'',rows:[...document.querySelectorAll('#changesStage [data-path],#changesStage .change-row,#changesStage .changes-row,#changesStage tr')].slice(0,30).map(e=>({path:e.dataset.path||'',text:e.innerText?.trim().slice(0,240)||'',cls:e.className}))}));
  await page.screenshot({path:path.join(out,'changes-dirty.png')});
  // Select CHANGELOG mixed row if possible, otherwise via canonical selection helper.
  const changelogId=await page.evaluate(()=>byId['file:CHANGELOG.md']?.id||null);result.changelogId=changelogId;
  if(changelogId){await page.evaluate(id=>{if(typeof selectNode==='function')selectNode(id);else if(typeof select==='function')select(id)},changelogId);await page.waitForTimeout(450);result.afterSelect=await page.evaluate(()=>({selected:state.selected,drawer:state.drawer,drawerPath:document.querySelector('#entityPath')?.textContent||null}));await page.screenshot({path:path.join(out,'changes-selected-mixed.png')});}
  result.errors=errors;fs.writeFileSync(path.join(out,'probe.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();await new Promise(r=>viewer.server.close(r))}
