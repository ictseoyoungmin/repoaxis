import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
await page.locator("#boot").waitFor({ state: "hidden" });
const topbar = await page.locator(".topbar").textContent();
if (topbar?.includes("⌘K")) throw new Error("shortcut badge is still visible in the topbar");
await page.screenshot({ path: "search-chrome-without-shortcut.png", fullPage: false });
await browser.close();
