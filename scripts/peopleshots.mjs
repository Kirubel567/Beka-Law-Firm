import { chromium } from "playwright";
import { mkdirSync } from "fs";

const outDir = process.argv[2] ?? "shots";
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// direct check that the upload now serves
const res = await page.request.get("http://localhost:3000/uploads/1783407907673-test-portrait.png");
console.log("upload serves:", res.status(), res.headers()["content-type"]);

await page.goto("http://localhost:3000/en/people", { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await page.evaluate(async () => {
  for (let y = 0; y <= document.body.scrollHeight; y += 500) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 300));
  }
  window.scrollTo(0, 0);
});
await page.waitForTimeout(1200);
await page.screenshot({ path: `${outDir}/people-list-fixed.png`, fullPage: true });

await page.goto("http://localhost:3000/en/people/belay-ketema", { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await page.screenshot({ path: `${outDir}/person-detail-fixed.png` });

console.log("done");
await browser.close();
