import { chromium } from "playwright";
import { mkdirSync } from "fs";

const outDir = process.argv[2] ?? "shots";
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
// short viewport so the sidebar nav is forced to overflow
const page = await browser.newPage({ viewport: { width: 1280, height: 560 } });
await page.goto("http://localhost:3000/admin/login", { waitUntil: "networkidle" });
await page.fill("#lg-user", "admin");
await page.fill("#lg-pass", "beka-portal-2026");
await page.click("button[type=submit]");
await page.waitForURL("**/admin", { timeout: 20000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${outDir}/sidebar-short-viewport.png` });
console.log("done");
await browser.close();
