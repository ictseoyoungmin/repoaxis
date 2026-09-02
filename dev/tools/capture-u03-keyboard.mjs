import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
await page.locator("#boot").waitFor({ state: "hidden" });

await page.keyboard.press("Control+K");
await page.locator("#searchOverlay.show").waitFor();
await page.locator("#searchInput").fill("test.mjs");
await page.locator(".search-result.active").waitFor();
await page.keyboard.press("ArrowDown");
await page.keyboard.press("ArrowDown");
const active = page.locator(".search-result.active");
await active.waitFor();
const activeName = await active.locator("b").first().textContent();
if (!activeName) throw new Error("keyboard search cursor did not resolve a result");
await page.screenshot({ path: "u03-keyboard-search.png", fullPage: false });

await page.keyboard.press("Enter");
await page.locator("#content.drawer-open").waitFor();
const shown = await page.locator("#searchOverlay").evaluate(el=>el.classList.contains("show"));
if (shown) throw new Error("search overlay remained open after Enter");
const entityName = (await page.locator("#entityName").textContent())?.trim();
if (!entityName || entityName === "Repository") throw new Error("Inspector did not land on a search result");
await page.screenshot({ path: "u03-keyboard-destination.png", fullPage: false });

await page.keyboard.press("Escape");
const drawerOpen = await page.locator("#content").evaluate(el=>el.classList.contains("drawer-open"));
if (drawerOpen) throw new Error("Escape did not begin closing the Inspector after search completion");
await page.waitForTimeout(380);
const drawerWidth = await page.locator("#drawer").evaluate(el=>el.getBoundingClientRect().width);
if (drawerWidth > 2) throw new Error(`Inspector remained visually open after Escape: ${drawerWidth}px`);
await page.screenshot({ path: "u03-keyboard-escape.png", fullPage: false });

await browser.close();
