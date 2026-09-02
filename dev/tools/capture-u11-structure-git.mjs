import { chromium } from 'playwright';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1});
await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
await page.waitForFunction(()=>document.querySelector('#boot')?.hidden===true,{timeout:20000});
await page.waitForSelector('#structureSvg .macro-node');
await page.waitForTimeout(500);

const scope=async id=>page.locator(`#structureSvg .macro-node[data-id="${id}"]`);
const skills=await scope('folder:skills');
const dev=await scope('folder:dev');
if(!await skills.count()||!await dev.count())throw new Error('Expected skills/ and dev/ macro scopes');
const skillsGit=(await skills.locator('.macro-git-line').textContent()||'').replace(/\s+/g,' ').trim();
const devGit=(await dev.locator('.macro-git-line').textContent()||'').replace(/\s+/g,' ').trim();
if(!skillsGit.includes('S 1')||!skillsGit.includes('W 2'))throw new Error(`skills/ aggregate mismatch: ${skillsGit}`);
if(!devGit.includes('S 1'))throw new Error(`dev/ staged deletion aggregate mismatch: ${devGit}`);
await page.screenshot({path:'u11-structure-git-overview.png',fullPage:true});

await skills.click();
await page.waitForTimeout(380);
const drawer=await page.evaluate(()=>({
  selected:document.querySelector('#entityName')?.textContent||'',
  keys:[...document.querySelectorAll('#drawerBody .kv .k')].map(x=>x.textContent),
  values:[...document.querySelectorAll('#drawerBody .kv .v')].map(x=>x.textContent),
  width:document.querySelector('#drawer')?.getBoundingClientRect().width||0,
  mode:document.querySelector('#structureMode')?.textContent||''
}));
const keyIndex=drawer.keys.indexOf('Working tree in scope');
if(drawer.selected!=='skills/'||drawer.width<300||!drawer.mode.startsWith('Repository topology')||keyIndex<0||drawer.values[keyIndex]!=='2 changed files · 1 staged · 2 working')throw new Error('Scoped Inspector mismatch: '+JSON.stringify(drawer));
await page.screenshot({path:'u11-structure-git-inspector.png',fullPage:true});
console.log(JSON.stringify({skillsGit,devGit,drawer}));
await browser.close();
