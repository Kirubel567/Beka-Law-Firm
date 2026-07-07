import { chromium } from "playwright";
import { mkdirSync } from "fs";

const outDir = process.argv[2] ?? "shots";
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const targets = [
  ["ref-root", "https://trust-ai.base44.app"],
  ["ref-dashboard", "https://trust-ai.base44.app/dashboard"],
];

for (const [name, url] of targets) {
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
  } catch {
    // capture whatever rendered
  }
  await page.waitForTimeout(4000);
  await page.screenshot({ path: `${outDir}/${name}.png` });
  console.log(name, "->", page.url());
}
await browser.close();
