import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
async function sh(cmd,args){await new Promise((resolve,reject)=>{const p=spawn(cmd,args,{cwd:root,stdio:'inherit'});p.on('exit',c=>c===0?resolve():reject(new Error(`${cmd} ${args.join(' ')} -> ${c}`)))})}

await fs.appendFile(path.join(root,'skills/repoaxis/viewer/viewer-2.js'),'\n// u13 capture staged change\n');
await sh('git',['add','skills/repoaxis/viewer/viewer-2.js']);
await fs.appendFile(path.join(root,'skills/repoaxis/viewer/viewer-2.js'),'// u13 capture mixed working change\n');
await fs.appendFile(path.join(root,'skills/repoaxis/viewer/viewer-surfaces.css'),'\n/* u13 capture working-only */\n');
await fs.writeFile(path.join(root,'dev/fixtures/u13-staged-added.js'),'export const stagedAdded = true;\n');
await sh('git',['add','dev/fixtures/u13-staged-added.js']);
await fs.writeFile(path.join(root,'dev/fixtures/u13-working-untracked.js'),'export const workingUntracked = true;\n');
await sh('git',['rm','dev/tests/integration/viewer-graph-spacing.test.mjs']);

const server=spawn(process.execPath,['bin/repoaxis.mjs','view','--root',root,'--port','4173'],{cwd:root,stdio:'inherit'});
await new Promise(r=>setTimeout(r,2500));
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000}});
await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
await page.getByText('Changes',{exact:true}).click();
await page.waitForTimeout(600);
await page.screenshot({path:'u13-changes-baseline.png',fullPage:true});
const metrics=await page.evaluate(()=>({
 rows:[...document.querySelectorAll('.change-row')].length,
 current:document.querySelectorAll('.change-group')[0]?.querySelectorAll('.change-row').length||0,
 deleted:document.querySelectorAll('.change-group')[1]?.querySelectorAll('.change-row').length||0,
 toolbar:document.querySelector('.set-toolbar')?.getBoundingClientRect().toJSON(),
 shell:document.querySelector('.changes-shell')?.getBoundingClientRect().toJSON(),
 bodyText:document.querySelector('#changesShell')?.innerText
}));
await fs.writeFile('u13-baseline-metrics.json',JSON.stringify(metrics,null,2));
await page.setViewportSize({width:1280,height:820});
await page.waitForTimeout(500);
await page.screenshot({path:'u13-changes-baseline-1280.png',fullPage:true});
await browser.close();server.kill('SIGTERM');
