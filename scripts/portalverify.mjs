import { chromium } from "playwright";
import { mkdirSync } from "fs";
import path from "path";

const outDir = process.argv[2] ?? "shots";
mkdirSync(outDir, { recursive: true });
const portraitPath = path.join(outDir, "test-portrait.png");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// 1 — synthesize a portrait-ish test image (no real person, just tones)
await page.setContent(`
  <div id="p" style="width:400px;height:500px;
    background:
      radial-gradient(220px 260px at 50% 42%, #6b5d4a 0%, #3d352a 55%, #201c15 100%),
      linear-gradient(180deg,#2a251d,#171410);">
    <div style="width:170px;height:170px;border-radius:50%;
      background:radial-gradient(circle at 42% 38%, #c9b18d, #8a7355 70%, #5c4d3a);
      position:relative;top:90px;left:115px;"></div>
    <div style="width:230px;height:160px;border-radius:100px 100px 0 0;
      background:linear-gradient(180deg,#4a4033,#2c261d);
      position:relative;top:110px;left:85px;"></div>
  </div>`);
await page.locator("#p").screenshot({ path: portraitPath });

// 2 — sign in through the UI
await page.goto("http://localhost:3000/admin/login", { waitUntil: "networkidle" });
await page.fill("#lg-user", "admin");
await page.fill("#lg-pass", "beka-portal-2026");
await page.click("button[type=submit]");
await page.waitForURL("**/admin", { timeout: 20000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${outDir}/portal-dashboard.png`, fullPage: true });

// 3 — people list, then open the first profile
await page.goto("http://localhost:3000/admin/people", { waitUntil: "networkidle" });
await page.screenshot({ path: `${outDir}/portal-people-list.png` });
await page.click("a[href^='/admin/people/seed-person-1']");
await page.waitForTimeout(1200);

// 4 — upload the portrait through the editor's file input and save
await page.setInputFiles("input[type=file]", portraitPath);
await page.waitForSelector("img[src^='/uploads/']", { timeout: 20000 });
await page.screenshot({ path: `${outDir}/portal-editor-portrait.png` });
await page.click("text=Save changes");
await page.waitForURL("**/admin/people", { timeout: 20000 });
await page.waitForTimeout(1000);
await page.screenshot({ path: `${outDir}/portal-people-after.png` });

// 5 — public site: list and profile should now carry the portrait
await page.goto("http://localhost:3000/en/people", { waitUntil: "networkidle" });
await page.waitForTimeout(2200);
await page.screenshot({ path: `${outDir}/public-people.png`, fullPage: true });
await page.goto("http://localhost:3000/en/people/belay-ketema", { waitUntil: "networkidle" });
await page.waitForTimeout(2200);
await page.screenshot({ path: `${outDir}/public-person.png`, fullPage: true });

console.log("done");
await browser.close();
