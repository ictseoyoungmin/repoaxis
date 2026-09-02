import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
await page.goto("http://127.0.0.1:4173/#graph", { waitUntil: "networkidle" });
await page.locator("#boot").waitFor({ state: "hidden" });
await page.locator("#graphScope").waitFor({ state: "visible" });
await page.screenshot({ path: "u03-graph-overview.png", fullPage: false });

const focused = await page.evaluate(() => {
  const isolated = files().find((file) => imports(file.id).length + importedBy(file.id).length === 0);
  const target = isolated || mostConnectedFile() || files()[0];
  if (!target) return null;
  state.selected = target.id;
  state.graphNeighborhood = true;
  state.graphDepth = 1;
  renderGraph();
  updateSelection();
  updateChrome();
  return { id: target.id, isolated: !!isolated };
});
if (focused) {
  await page.locator("#graphScope").getByText("Focused 1-hop", { exact: false }).waitFor();
  if (focused.isolated) await page.locator("#graphNotice").getByText("No repository-local imports").waitFor();
  await page.screenshot({ path: "u03-graph-focused.png", fullPage: false });
}
await browser.close();
