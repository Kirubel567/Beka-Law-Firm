import { chromium } from "playwright";
import { mkdirSync } from "fs";

const outDir = process.argv[2] ?? "shots";
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
page.on("console", (m) => {
  if (m.type() === "error") console.log("[console error]", m.text().slice(0, 200));
});

// public site — icon-only hamburger
await page.goto("http://localhost:3000/en", { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await page.screenshot({ path: `${outDir}/mob-public-closed.png` });
await page.click("header button[aria-expanded]");
await page.waitForTimeout(1200);
await page.screenshot({ path: `${outDir}/mob-public-open.png` });
const pub = await page.evaluate(() => {
  const nav = document.querySelector("nav[aria-label='Mobile']");
  if (!nav) return { navExists: false };
  const r = nav.parentElement.getBoundingClientRect();
  return { navExists: true, rect: { y: r.y, w: r.width, h: r.height } };
});
console.log("public overlay:", JSON.stringify(pub));

// portal — icon-only hamburger + close icon in the sheet
await page.goto("http://localhost:3000/admin/login", { waitUntil: "networkidle" });
await page.fill("#lg-user", "admin");
await page.fill("#lg-pass", "beka-portal-2026");
await page.click("button[type=submit]");
await page.waitForURL("**/admin", { timeout: 20000 });
await page.waitForTimeout(1200);
await page.click("button[aria-label='Open menu']");
await page.waitForTimeout(800);
await page.screenshot({ path: `${outDir}/mob-portal-open.png` });
await page.click("aside button[aria-label='Close menu']");
await page.waitForTimeout(600);
await page.screenshot({ path: `${outDir}/mob-portal-closed.png` });

console.log("done");
await browser.close();
