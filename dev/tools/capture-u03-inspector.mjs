import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
await page.goto("http://127.0.0.1:4173/#structure", { waitUntil: "networkidle" });
await page.locator("#boot").waitFor({ state: "hidden" });
await page.locator("#searchTrigger").click();
await page.locator("#searchInput").fill("viewer-4.js");
await page.locator(".search-result").first().click();
await page.evaluate(() => select("file:skills/repoaxis/viewer/viewer-4.js"));
await page.locator("#content").waitFor({ state: "visible" });
await page.locator("#drawerBody").getByText("Current state").waitFor();
await page.locator("#content.drawer-open").waitFor();
await page.screenshot({ path: "u03-inspector-hierarchy.png", fullPage: false });
await browser.close();
