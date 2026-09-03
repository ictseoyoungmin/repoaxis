import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
async function sh(cmd,args,{stdio='inherit'}={}){await new Promise((resolve,reject)=>{const p=spawn(cmd,args,{cwd:root,stdio});p.on('exit',c=>c===0?resolve():reject(new Error(`${cmd} ${args.join(' ')} -> ${c}`)))})}
function invariant(ok,message){if(!ok)throw new Error(message)}

// Capture-only Git fixture, injected only after the regression suite passes.
await fs.appendFile(path.join(root,'skills/repoaxis/viewer/viewer-0.js'),'\n// u14 capture staged half\n');
await sh('git',['add','skills/repoaxis/viewer/viewer-0.js']);
await fs.appendFile(path.join(root,'skills/repoaxis/viewer/viewer-0.js'),'// u14 capture working half\n');
await fs.appendFile(path.join(root,'skills/repoaxis/viewer/viewer-surfaces.css'),'\n/* u14 capture working-only */\n');
await fs.appendFile(path.join(root,'skills/repoaxis/viewer/viewer-3.js'),'\n// u14 capture staged-only\n');
await sh('git',['add','skills/repoaxis/viewer/viewer-3.js']);

const server=spawn(process.execPath,['bin/repoaxis','view','--root',root,'--port','4173'],{cwd:root,stdio:'inherit'});
await new Promise(r=>setTimeout(r,2500));
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000}});
await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
await page.getByText('Changes',{exact:true}).click();
await page.waitForTimeout(450);
await page.locator('[data-quick="all"]').click();
await page.waitForTimeout(180);
const selected=Number(await page.locator('.set-count b').textContent());
invariant(selected===3,`expected exactly 3 capture roots, got ${selected}`);
await page.locator('#analyzeSet').click();
await page.waitForTimeout(650);

async function geometry(){return page.evaluate(()=>{
  const host=document.querySelector('#graphSvg').getBoundingClientRect();
  const nodes=[...document.querySelectorAll('#graphSvg .node[data-id]')].map(el=>{const r=el.getBoundingClientRect();return{id:el.dataset.id,left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}});
  const badges=[...document.querySelectorAll('#graphSvg .git-badge')].map(el=>{const rect=el.querySelector('rect').getBoundingClientRect(),text=el.querySelector('text').getBoundingClientRect();return{label:el.dataset.label,rect:{left:rect.left,top:rect.top,right:rect.right,bottom:rect.bottom,width:rect.width,height:rect.height},text:{left:text.left,top:text.top,right:text.right,bottom:text.bottom,width:text.width,height:text.height}}});
  return{host:{left:host.left,top:host.top,right:host.right,bottom:host.bottom,width:host.width,height:host.height},nodes,badges,scope:document.querySelector('#graphScope')?.textContent||'',camera:document.querySelector('#graphGraph')?.getAttribute('transform')||''};
})}
function assertGeometry(g,label){
  invariant(g.nodes.length>=3,`${label}: expected >=3 impact nodes, got ${g.nodes.length}`);
  const clipped=g.nodes.filter(n=>n.left<g.host.left-1||n.right>g.host.right+1||n.top<g.host.top-1||n.bottom>g.host.bottom+1);
  invariant(clipped.length===0,`${label}: clipped impact nodes ${JSON.stringify(clipped)}`);
  const mixed=g.badges.find(b=>b.label==='S+W');
  invariant(mixed,`${label}: missing S+W badge`);
  const overflowing=g.badges.filter(b=>b.text.left<b.rect.left-.6||b.text.right>b.rect.right+.6||b.text.top<b.rect.top-.6||b.text.bottom>b.rect.bottom+.6);
  invariant(overflowing.length===0,`${label}: badge text overflow ${JSON.stringify(overflowing)}`);
  const tight=g.badges.filter(b=>(b.text.left-b.rect.left)<1.5||(b.rect.right-b.text.right)<1.5);
  invariant(tight.length===0,`${label}: badge horizontal padding too tight ${JSON.stringify(tight)}`);
}
const wide=await geometry();assertGeometry(wide,'1600');
await page.screenshot({path:'u14-impact-framing-1600.png',fullPage:true});

await page.setViewportSize({width:1280,height:820});
await page.waitForTimeout(500);
const narrow=await geometry();assertGeometry(narrow,'1280');
invariant(await page.evaluate(()=>document.documentElement.scrollWidth===window.innerWidth),'1280: horizontal shell overflow');
await page.screenshot({path:'u14-impact-framing-1280.png',fullPage:true});

await fs.writeFile('u14-framing-metrics.json',JSON.stringify({selected,wide,narrow},null,2));
await browser.close();server.kill('SIGTERM');
await sh(process.execPath,['bin/repoaxis','snapshot','--root',root,'--output','u14-graph-label-framing.html']);
