import { chromium } from "playwright";
import { mkdirSync } from "fs";

const outDir = process.argv[2] ?? "shots";
const path = process.argv[3] ?? "/en";
const prefix = process.argv[4] ?? "scroll";
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`http://localhost:3000${path}`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);

const height = await page.evaluate(() => document.body.scrollHeight);
for (let y = 900; y < height; y += 900) {
  await page.evaluate((yy) => window.scrollTo({ top: yy }), y);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${outDir}/${prefix}-${y}.png` });
  console.log("captured", y);
}
await browser.close();
