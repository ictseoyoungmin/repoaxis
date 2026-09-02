import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
await page.locator('#boot').waitFor({ state: 'hidden' });

const overviewMode = (await page.locator('#structureMode').textContent())?.trim() || '';
if (!overviewMode.startsWith('Repository topology')) throw new Error(`unexpected overview mode: ${overviewMode}`);
const overviewNodes = await page.locator('#structureSvg .node[data-id]').count();
const totalNodes = Number((await page.locator('#cardCount').textContent())?.trim() || 0);
if (!(overviewNodes > 3 && overviewNodes < totalNodes / 2)) throw new Error(`overview is not materially bounded: ${overviewNodes}/${totalNodes}`);
await page.screenshot({ path: 'u04-structure-overview.png', fullPage: false });

const skills = page.locator('#structureSvg .node[data-id="folder:skills"]');
if (!await skills.count()) throw new Error('folder:skills macro node is missing from overview');
await skills.click();
await page.locator('#breadcrumbs:not([hidden])').waitFor();
const focusMode = (await page.locator('#structureMode').textContent())?.trim() || '';
if (!focusMode.startsWith('skills')) throw new Error(`focus did not root at skills/: ${focusMode}`);
if (!await page.locator('#structureSvg .node rect.bg').count()) throw new Error('focused Structure did not render labeled cards');
await page.screenshot({ path: 'u04-structure-focus.png', fullPage: false });

await browser.close();
