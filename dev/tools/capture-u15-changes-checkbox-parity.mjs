import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const sh=(cmd,args)=>new Promise((resolve,reject)=>{const p=spawn(cmd,args,{cwd:root,stdio:'inherit'});p.on('exit',c=>c===0?resolve():reject(new Error(`${cmd} ${args.join(' ')} -> ${c}`)))});
const invariant=(ok,msg)=>{if(!ok)throw new Error(msg)};

// Capture-only dirty fixture, applied only after the regression suite passes.
await fs.appendFile(path.join(root,'skills/repoaxis/viewer/viewer-0.js'),'\n// u15 staged half\n');
await sh('git',['add','skills/repoaxis/viewer/viewer-0.js']);
await fs.appendFile(path.join(root,'skills/repoaxis/viewer/viewer-0.js'),'// u15 working half\n');
await fs.appendFile(path.join(root,'skills/repoaxis/viewer/viewer-3.js'),'\n// u15 staged only\n');
await sh('git',['add','skills/repoaxis/viewer/viewer-3.js']);
await fs.appendFile(path.join(root,'skills/repoaxis/viewer/viewer-surfaces.css'),'\n/* u15 working only */\n');

const server=spawn(process.execPath,['bin/repoaxis','view','--root',root,'--port','4173'],{cwd:root,stdio:'inherit'});
await new Promise(r=>setTimeout(r,2600));
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000}});
await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
await page.getByText('Changes',{exact:true}).click();
await page.waitForTimeout(450);

const styles=async()=>page.evaluate(()=>{
  const row=document.querySelector('.change-row .change-select[data-check]');
  const master=document.querySelector('#selectAllChanges');
  const style=el=>{const cs=getComputedStyle(el),r=el.getBoundingClientRect(),svg=el.querySelector('svg'),ss=svg?getComputedStyle(svg):null;return{classes:el.className,width:r.width,height:r.height,borderRadius:cs.borderRadius,borderColor:cs.borderColor,background:cs.backgroundColor,boxShadow:cs.boxShadow,transform:cs.transform,svgOpacity:ss?.opacity||null,path:svg?.querySelector('path')?.getAttribute('d')||null}};
  return{row:style(row),master:style(master),selected:Number(document.querySelector('.set-count b')?.textContent||0),rowCount:document.querySelectorAll('.change-row[data-id]').length};
});

let s=await styles();
invariant(s.rowCount===3,`expected 3 current change rows, got ${s.rowCount}`);
invariant(Math.abs(s.row.width-22)<.2&&Math.abs(s.row.height-22)<.2,`row checkbox not 22x22: ${JSON.stringify(s.row)}`);
invariant(Math.abs(s.master.width-20)<.2&&Math.abs(s.master.height-20)<.2,`master checkbox not 20x20: ${JSON.stringify(s.master)}`);
invariant(s.row.svgOpacity==='0'&&s.master.svgOpacity==='0',`off SVG should be hidden: ${JSON.stringify(s)}`);
await page.screenshot({path:'u15-checkbox-off.png',fullPage:true});

const first=page.locator('.change-row .change-select[data-check]').first();
await first.hover();await page.waitForTimeout(240);
s=await styles();
invariant(s.row.borderColor==='rgb(169, 164, 255)',`hover border mismatch: ${s.row.borderColor}`);
invariant(s.row.boxShadow.includes('rgba(98, 91, 255, 0.08)'),`hover halo missing: ${s.row.boxShadow}`);
await page.screenshot({path:'u15-checkbox-hover.png',fullPage:true});

await first.click();await page.waitForTimeout(180);
s=await styles();
invariant(s.selected===1,'row click did not select exactly one change');
invariant(s.row.classes.includes('checked')&&s.row.svgOpacity==='1',`checked row state missing: ${JSON.stringify(s.row)}`);
invariant(s.master.classes.includes('indeterminate')&&s.master.svgOpacity==='1'&&s.master.path==='M6 12h12',`master partial dash mismatch: ${JSON.stringify(s.master)}`);
await page.screenshot({path:'u15-checkbox-partial.png',fullPage:true});

const checked=page.locator('.change-row .change-select.checked').first();
const box=await checked.boundingBox();invariant(box,'checked checkbox missing bounding box');
await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.waitForTimeout(100);
s=await styles();
invariant(s.row.transform!=='none',`pressed transform missing: ${s.row.transform}`);
await page.screenshot({path:'u15-checkbox-pressed.png',fullPage:true});
await page.mouse.up();

await page.locator('#selectAllChanges').click();await page.waitForTimeout(180);
s=await styles();
invariant(s.selected===3,'master click did not select all three changes');
invariant(s.master.classes.includes('checked')&&s.master.path==='M6 12.5l4 4L18 8',`master checked icon mismatch: ${JSON.stringify(s.master)}`);
invariant(await page.locator('.change-row .change-select.checked').count()===3,'not every row checkbox is checked');
await page.screenshot({path:'u15-checkbox-all-checked.png',fullPage:true});

await page.setViewportSize({width:1280,height:820});await page.waitForTimeout(350);
invariant(await page.evaluate(()=>document.documentElement.scrollWidth===window.innerWidth),'1280 shell overflow');
await page.screenshot({path:'u15-checkbox-1280.png',fullPage:true});
await fs.writeFile('u15-checkbox-metrics.json',JSON.stringify(s,null,2));
await browser.close();server.kill('SIGTERM');
await sh(process.execPath,['bin/repoaxis','snapshot','--root',root,'--output','u15-changes-checkbox-parity.html']);
