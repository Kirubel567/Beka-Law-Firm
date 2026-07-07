import { chromium } from "playwright";
import { mkdirSync } from "fs";

const outDir = process.argv[2] ?? "shots";
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("https://trust-ai.base44.app/dashboard", { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
await page.waitForTimeout(4000);
// dismiss the cookie banner if present
await page.click("text=ACCEPT ALL", { timeout: 3000 }).catch(() => {});
await page.waitForTimeout(800);
await page.screenshot({ path: `${outDir}/ref-theme-light.png` });

// try the likely theme-toggle buttons in the top bar
const candidates = [
  "button[aria-label*='theme' i]",
  "button[title*='theme' i]",
  "header button:has(svg.lucide-sun)",
  "button:has(svg.lucide-sun)",
  "button:has(svg.lucide-moon)",
];
let clicked = false;
for (const sel of candidates) {
  const el = page.locator(sel).first();
  if (await el.count()) {
    await el.click().catch(() => {});
    clicked = true;
    console.log("clicked:", sel);
    break;
  }
}
if (!clicked) console.log("no toggle selector matched");
await page.waitForTimeout(1500);
await page.screenshot({ path: `${outDir}/ref-theme-after.png` });
console.log("html class:", await page.evaluate(() => document.documentElement.className));
await browser.close();
