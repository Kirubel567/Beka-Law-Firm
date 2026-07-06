import { chromium } from "playwright";
import { mkdirSync } from "fs";

const outDir = process.argv[2] ?? "shots";
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// login screen
await page.goto("http://localhost:3000/admin", { waitUntil: "networkidle" });
await page.screenshot({ path: `${outDir}/admin-login.png` });

// sign in through the UI
await page.fill("#lg-user", "admin");
await page.fill("#lg-pass", "beka-portal-2026");
await page.click("button[type=submit]");
await page.waitForURL("**/admin", { timeout: 15000 });
await page.waitForTimeout(800);
await page.screenshot({ path: `${outDir}/admin-dashboard.png` });

// testimonials list
await page.goto("http://localhost:3000/admin/testimonials", { waitUntil: "networkidle" });
await page.screenshot({ path: `${outDir}/admin-testimonials.png` });

// editor — first entry, Amharic tab
await page.click("a[href^='/admin/testimonials/seed-']");
await page.waitForTimeout(800);
await page.click("text=አማርኛ");
await page.waitForTimeout(400);
await page.screenshot({ path: `${outDir}/admin-editor-am.png` });

// article editor (bigger form)
await page.goto("http://localhost:3000/admin/articles", { waitUntil: "networkidle" });
await page.click("a[href^='/admin/articles/seed-']");
await page.waitForTimeout(800);
await page.screenshot({ path: `${outDir}/admin-article-editor.png`, fullPage: true });

// site settings + inquiries
await page.goto("http://localhost:3000/admin/site", { waitUntil: "networkidle" });
await page.screenshot({ path: `${outDir}/admin-site.png` });
await page.goto("http://localhost:3000/admin/inquiries", { waitUntil: "networkidle" });
await page.screenshot({ path: `${outDir}/admin-inquiries.png` });

// public testimonials page (en + am)
for (const loc of ["en", "am"]) {
  await page.goto(`http://localhost:3000/${loc}/testimonials`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.evaluate(async () => {
    for (let y = 0; y <= document.body.scrollHeight; y += 700) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 250));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${outDir}/public-testimonials-${loc}.png`, fullPage: true });
}

console.log("done");
await browser.close();
