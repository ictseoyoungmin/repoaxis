import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
await page.locator('#boot').waitFor({ state: 'hidden' });
await page.locator('.rail-item[data-view="dependencies"]').click();
await page.locator('#depShell .dep-command').waitFor();

let rootBefore = (await page.locator('#rootPill b').textContent())?.trim() || '';
let candidates = page.locator('#depSvg .node[data-id]:not(.selected)');
if (await candidates.count() === 0) {
  await page.locator('[data-dir="imports"]').click();
  candidates = page.locator('#depSvg .node[data-id]:not(.selected)');
}
if (await candidates.count() === 0) throw new Error('No dependency child available for navigation capture');

await candidates.first().click();
await page.locator('#depUseRoot').waitFor();
const rootAfterInspect = (await page.locator('#rootPill b').textContent())?.trim() || '';
if (rootAfterInspect !== rootBefore) throw new Error(`Inspecting child changed root: ${rootBefore} -> ${rootAfterInspect}`);
await page.screenshot({ path: 'u05-dependency-inspect.png', fullPage: false });

await page.locator('#depUseRoot').click();
await page.locator('.dep-trail').waitFor();
const rootAfterPromote = (await page.locator('#rootPill b').textContent())?.trim() || '';
if (!rootAfterPromote || rootAfterPromote === rootBefore) throw new Error('Use selected as root did not change dependency root');
if (await page.locator('.dep-trail-node').count() < 2) throw new Error('Root trail did not preserve previous root');
if (await page.locator('#depBack').isDisabled()) throw new Error('Back should be enabled after root promotion');
await page.screenshot({ path: 'u05-dependency-reroot.png', fullPage: false });

await page.locator('#depBack').click();
const rootAfterBack = (await page.locator('#rootPill b').textContent())?.trim() || '';
if (rootAfterBack !== rootBefore) throw new Error(`Back did not restore initial root: ${rootAfterBack} !== ${rootBefore}`);
if (!await page.locator('#depBack').isDisabled()) throw new Error('Back should be disabled after returning to initial root');
await page.screenshot({ path: 'u05-dependency-back.png', fullPage: false });

await browser.close();
