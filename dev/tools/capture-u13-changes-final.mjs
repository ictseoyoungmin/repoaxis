import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
async function sh(cmd,args,{stdio='inherit'}={}){await new Promise((resolve,reject)=>{const p=spawn(cmd,args,{cwd:root,stdio});p.on('exit',c=>c===0?resolve():reject(new Error(`${cmd} ${args.join(' ')} -> ${c}`)))})}
function invariant(ok,message){if(!ok)throw new Error(message)}

// Capture-only Git fixture. Product tests run before these mutations.
await fs.appendFile(path.join(root,'skills/repoaxis/viewer/viewer-2.js'),'\n// u13 final capture staged change\n');
await sh('git',['add','skills/repoaxis/viewer/viewer-2.js']);
await fs.appendFile(path.join(root,'skills/repoaxis/viewer/viewer-2.js'),'// u13 final capture mixed working change\n');
await fs.appendFile(path.join(root,'skills/repoaxis/viewer/viewer-surfaces.css'),'\n/* u13 final capture working-only */\n');
await fs.writeFile(path.join(root,'dev/fixtures/u13-staged-added.js'),'export const stagedAdded = true;\n');
await sh('git',['add','dev/fixtures/u13-staged-added.js']);
await fs.writeFile(path.join(root,'dev/fixtures/u13-working-untracked.js'),'export const workingUntracked = true;\n');
await sh('git',['rm','dev/tests/integration/viewer-graph-spacing.test.mjs']);

const server=spawn(process.execPath,['bin/repoaxis','view','--root',root,'--port','4173'],{cwd:root,stdio:'inherit'});
await new Promise(r=>setTimeout(r,2500));
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000}});
await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
await page.getByText('Changes',{exact:true}).click();
await page.waitForTimeout(550);

const state=async()=>page.evaluate(()=>({
  current:document.querySelectorAll('.change-group')[0]?.querySelectorAll('.change-row').length||0,
  deleted:document.querySelectorAll('.change-group')[1]?.querySelectorAll('.change-row').length||0,
  picked:document.querySelectorAll('.change-row.change-set-picked').length,
  count:Number(document.querySelector('.set-count b')?.textContent||0),
  preset:document.querySelector('[data-quick].active')?.getAttribute('data-quick')||'',
  master:[...document.querySelector('#selectAllChanges')?.classList||[]],
  scrollWidth:document.documentElement.scrollWidth,
  innerWidth:window.innerWidth
}));
let s=await state();
invariant(s.current===4&&s.deleted===1,`fixture mismatch: ${JSON.stringify(s)}`);
invariant(s.count===0&&s.picked===0,'default change set should be empty');

await page.locator('[data-quick="staged"]').click();
await page.waitForTimeout(180);
s=await state();
invariant(s.count===2&&s.picked===2&&s.preset==='staged'&&s.master.includes('partial'),`staged preset mismatch: ${JSON.stringify(s)}`);
await page.screenshot({path:'u13-changes-staged-selected.png',fullPage:true});

await page.locator('#selectAllChanges').click();
await page.waitForTimeout(180);
s=await state();
invariant(s.count===4&&s.picked===4&&s.preset==='all'&&s.master.includes('on'),`master all mismatch: ${JSON.stringify(s)}`);
await page.screenshot({path:'u13-changes-all-selected.png',fullPage:true});

const stagedAddedRow=page.locator('.change-row').filter({hasText:'u13-staged-added.js'});
await stagedAddedRow.locator('[data-check]').click();
await page.waitForTimeout(180);
s=await state();
invariant(s.count===3&&s.picked===3&&s.preset==='working'&&s.master.includes('partial'),`partial working mismatch: ${JSON.stringify(s)}`);
await page.screenshot({path:'u13-changes-working-partial.png',fullPage:true});

await page.locator('#analyzeSet').click();
await page.waitForTimeout(500);
const impact=await page.evaluate(()=>({title:document.querySelector('#cardTitle')?.textContent,scope:document.querySelector('#graphScope')?.textContent,graphNodes:document.querySelectorAll('#graphSvg .node[data-id]').length}));
invariant(impact.title==='Graph'&&impact.graphNodes>=3,`impact destination mismatch: ${JSON.stringify(impact)}`);
await page.screenshot({path:'u13-changes-impact-destination.png',fullPage:true});

await page.getByText('Changes',{exact:true}).click();
await page.setViewportSize({width:1280,height:820});
await page.waitForTimeout(450);
s=await state();
invariant(s.innerWidth===1280&&s.scrollWidth===1280,`Changes shell overflow at 1280: ${JSON.stringify(s)}`);
await page.screenshot({path:'u13-changes-responsive-1280.png',fullPage:true});

await fs.writeFile('u13-final-metrics.json',JSON.stringify({stagedSelected:2,allSelected:4,workingPartial:3,impact,...s},null,2));
await browser.close();server.kill('SIGTERM');
await sh(process.execPath,['bin/repoaxis','snapshot','--root',root,'--output','u13-changes-direct-manipulation.html']);
