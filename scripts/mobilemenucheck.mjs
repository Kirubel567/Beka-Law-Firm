import { chromium } from "playwright";
import { mkdirSync } from "fs";

const outDir = process.argv[2] ?? "shots";
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
page.on("console", (m) => {
  if (m.type() === "error") console.log("[console error]", m.text().slice(0, 200));
});

// public site
await page.goto("http://localhost:3000/en", { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await page.screenshot({ path: `${outDir}/mob-public-closed.png` });
await page.click("header button");
await page.waitForTimeout(1200);
await page.screenshot({ path: `${outDir}/mob-public-open.png` });
const pub = await page.evaluate(() => {
  const nav = document.querySelector("header nav[aria-label='Mobile']");
  if (!nav) return { navExists: false };
  const overlay = nav.parentElement;
  const r = overlay.getBoundingClientRect();
  const cs = getComputedStyle(overlay);
  return {
    navExists: true,
    rect: { x: r.x, y: r.y, w: r.width, h: r.height },
    position: cs.position,
    opacity: cs.opacity,
    zIndex: cs.zIndex,
    display: cs.display,
  };
});
console.log("public overlay:", JSON.stringify(pub));

// portal
await page.goto("http://localhost:3000/admin/login", { waitUntil: "networkidle" });
await page.fill("#lg-user", "admin");
await page.fill("#lg-pass", "beka-portal-2026");
await page.click("button[type=submit]");
await page.waitForURL("**/admin", { timeout: 20000 });
await page.waitForTimeout(1200);
await page.screenshot({ path: `${outDir}/mob-portal-closed.png` });
await page.click("text=Menu");
await page.waitForTimeout(800);
await page.screenshot({ path: `${outDir}/mob-portal-open.png` });

console.log("done");
await browser.close();
