import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";
import { startViewer } from "../../skills/repoaxis/lib/view-server.mjs";

const root=process.cwd();
const out=path.join(root,"dev","visuals","u17-1-output");
fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(out,{recursive:true});

const viewer=await startViewer({root,port:0,open:false});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:900},deviceScaleFactor:1});
const metrics={captured_at:new Date().toISOString(),viewport:{width:1600,height:900},checks:{}};

async function shot(name){await page.screenshot({path:path.join(out,name),fullPage:false});}
async function selectIndexedSymbol(){
  const chosen=await page.evaluate(()=>{
    const symbol=Object.values(nodes).find(n=>(n.type==='function'||n.type==='class')&&containingFile(n));
    if(!symbol)throw new Error('No indexed symbol with a containing file');
    state.structureFocus=true;
    state.drawer=true;
    document.querySelector('#content')?.classList.add('drawer-open');
    switchView('structure',symbol.id);
    return{id:symbol.id,label:symbol.label,file:containingFile(symbol)?.repoPath||null};
  });
  await page.waitForTimeout(180);
  return chosen;
}
async function arrival(view,name){
  await page.click(`#entityActions [data-v="${view}"]`);
  await page.waitForTimeout(140);
  const m=await page.evaluate(()=>{
    const c=state.crossView;
    const host=state.view==='structure'?document.querySelector('#structureSvg'):state.view==='dependencies'?document.querySelector('#depSvg'):state.view==='graph'?document.querySelector('#graphSvg'):document.querySelector('#changesShell');
    const target=host?[...host.querySelectorAll('[data-id]')].find(el=>el.dataset.id===state.selected):null;
    return{view:state.view,selected:state.selected,crossView:c?{...c}:null,detail:document.querySelector('#selDetail')?.textContent||'',drawerOpen:document.querySelector('#content')?.classList.contains('drawer-open')||false,arrivalTarget:!!target?.classList.contains('arrival-target'),arrivalId:target?.dataset.id||null,rect:target?(()=>{const r=target.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}})():null,innerWidth:window.innerWidth,innerHeight:window.innerHeight,scrollWidth:document.documentElement.scrollWidth};
  });
  metrics.checks[name]=m;
  await shot(`${name}.png`);
  await page.waitForTimeout(1450);
  metrics.checks[`${name}_cleared`]=await page.evaluate(()=>document.querySelectorAll('.arrival-target').length===0);
}

try{
  await page.goto(viewer.url,{waitUntil:"networkidle"});
  await page.waitForFunction(()=>document.querySelector('#boot')?.hidden===true);

  metrics.symbol=await selectIndexedSymbol();
  metrics.checks.structure_symbol=await page.evaluate(()=>({view:state.view,selected:state.selected,label:document.querySelector('#selName')?.textContent||'',detail:document.querySelector('#selDetail')?.textContent||'',drawerOpen:document.querySelector('#content')?.classList.contains('drawer-open')||false}));
  await shot("u17-1-structure-symbol.png");
  await arrival("dependencies","u17-1-dependencies-arrival");

  metrics.symbol_graph=await selectIndexedSymbol();
  await arrival("graph","u17-1-graph-arrival");

  await page.setViewportSize({width:1280,height:820});
  metrics.symbol_1280=await selectIndexedSymbol();
  await page.click('#entityActions [data-v="graph"]');
  await page.waitForTimeout(140);
  metrics.checks.graph_1280=await page.evaluate(()=>{const target=document.querySelector('#graphSvg .node.arrival-target');const r=target?.getBoundingClientRect();return{arrival:!!target,detail:document.querySelector('#selDetail')?.textContent||'',drawerOpen:document.querySelector('#content')?.classList.contains('drawer-open')||false,targetRect:r?{x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height}:null,innerWidth:window.innerWidth,innerHeight:window.innerHeight,scrollWidth:document.documentElement.scrollWidth};});
  await shot("u17-1-graph-arrival-1280.png");

  const required=[metrics.checks["u17-1-dependencies-arrival"],metrics.checks["u17-1-graph-arrival"]];
  if(required.some(x=>!x?.arrivalTarget||!x?.drawerOpen||!x?.crossView?.projected))throw new Error("cross-view projected arrival contract failed");
  if(!required.every(x=>x.detail.includes("containing file")))throw new Error("projection explanation missing from selection context");
  if(!required.every(x=>x.scrollWidth===x.innerWidth))throw new Error("cross-view arrival caused horizontal page overflow");
  if(!metrics.checks["u17-1-dependencies-arrival_cleared"]||!metrics.checks["u17-1-graph-arrival_cleared"])throw new Error("arrival feedback did not clear after 1400ms");
  if(!metrics.checks.graph_1280?.arrival||metrics.checks.graph_1280.scrollWidth!==metrics.checks.graph_1280.innerWidth)throw new Error("1280px arrival regression");
  const r=metrics.checks.graph_1280.targetRect;
  if(!r||r.x<0||r.right>metrics.checks.graph_1280.innerWidth||r.y<0||r.bottom>metrics.checks.graph_1280.innerHeight)throw new Error("1280px arrival target is not fully visible");

  fs.writeFileSync(path.join(out,"u17-1-metrics.json"),JSON.stringify(metrics,null,2));
}finally{
  await browser.close();
  await new Promise(resolve=>viewer.server.close(resolve));
}
