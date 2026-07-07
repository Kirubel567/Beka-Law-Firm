import { chromium } from "playwright";
import { mkdirSync } from "fs";

const outDir = process.argv[2] ?? "shots";
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto("http://localhost:3000/admin/login", { waitUntil: "networkidle" });
await page.fill("#lg-user", "admin");
await page.fill("#lg-pass", "beka-portal-2026");
await page.click("button[type=submit]");
await page.waitForURL("**/admin", { timeout: 20000 });
await page.waitForTimeout(1500);

const screens = [
  ["dashboard", "http://localhost:3000/admin"],
  ["people-list", "http://localhost:3000/admin/people"],
  ["editor", "http://localhost:3000/admin/people/seed-person-1"],
  ["site", "http://localhost:3000/admin/site"],
  ["inquiries", "http://localhost:3000/admin/inquiries"],
];

for (const mode of ["dark", "light"]) {
  await page.evaluate((m) => {
    document.documentElement.setAttribute("data-theme", m);
    localStorage.setItem("beka-portal-theme", m);
  }, mode);
  for (const [name, url] of screens) {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${outDir}/theme-${mode}-${name}.png` });
  }
  console.log(mode, "captured");
}

// exercise the actual toggle button + persistence across reload
await page.goto("http://localhost:3000/admin", { waitUntil: "networkidle" });
await page.click("button[aria-label*='mode']");
await page.waitForTimeout(400);
const t1 = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
await page.reload({ waitUntil: "networkidle" });
const t2 = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
console.log("after toggle:", t1, "| after reload:", t2);
await browser.close();
