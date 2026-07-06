import { chromium } from "playwright";
import { mkdirSync } from "fs";

const outDir = process.argv[2] ?? "shots";
mkdirSync(outDir, { recursive: true });

const targets = [
  ["en-home", "/en"],
  ["am-home", "/am"],
  ["en-origins", "/en/origins"],
  ["en-people", "/en/people"],
  ["en-practice", "/en/practice"],
  ["en-matters", "/en/matters"],
  ["en-insights-article", "/en/insights/arbitrating-in-addis"],
  ["en-contact", "/en/contact"],
  ["am-origins", "/am/origins"],
  ["om-home", "/om"],
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

for (const [name, path] of targets) {
  await page.goto(`http://localhost:3000${path}`, { waitUntil: "networkidle" });
  // let entrance animations settle, then scroll through to trigger reveals
  await page.waitForTimeout(2200);
  await page.evaluate(async () => {
    const h = document.body.scrollHeight;
    for (let y = 0; y <= h; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 90));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${outDir}/${name}-full.png`, fullPage: true });
  await page.screenshot({ path: `${outDir}/${name}-fold.png` });
  console.log("shot", name);
}

// mobile pass
const mob = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mob.goto("http://localhost:3000/en", { waitUntil: "networkidle" });
await mob.waitForTimeout(2200);
await mob.screenshot({ path: `${outDir}/mobile-home.png` });
console.log("shot mobile-home");

await browser.close();
