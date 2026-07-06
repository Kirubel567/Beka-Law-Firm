import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on("console", (m) => console.log("[console]", m.type(), m.text()));
page.on("response", (r) => {
  if (r.url().includes("/api/admin/login")) console.log("[login response]", r.status());
});
await page.goto("http://localhost:3000/admin/login", { waitUntil: "networkidle" });
await page.fill("#lg-user", "admin");
await page.fill("#lg-pass", "beka-portal-2026");
await page.click("button[type=submit]");
await page.waitForTimeout(5000);
console.log("url now:", page.url());
const err = await page.locator("p.text-terracotta-500").textContent().catch(() => null);
console.log("error text:", err);
const cookies = await page.context().cookies("http://localhost:3000");
console.log("cookies:", cookies.map((c) => c.name).join(", "));
await browser.close();
