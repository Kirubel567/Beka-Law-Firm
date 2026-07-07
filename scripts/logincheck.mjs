import { chromium } from "playwright";
import { mkdirSync } from "fs";

const outDir = process.argv[2] ?? "shots";
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on("console", (m) => {
  if (m.type() === "error") console.log("[console error]", m.text().slice(0, 300));
});
await page.goto("http://localhost:3000/admin/login", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${outDir}/login-state.png` });
const info = await page.evaluate(() => {
  const el = document.getElementById("lg-user");
  if (!el) return { exists: false };
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  return {
    exists: true,
    rect: { x: r.x, y: r.y, w: r.width, h: r.height },
    display: cs.display,
    visibility: cs.visibility,
    opacity: cs.opacity,
    parentDisplay: getComputedStyle(el.parentElement).display,
  };
});
console.log(JSON.stringify(info));
await browser.close();
