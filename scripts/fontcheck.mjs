import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("http://localhost:3000/en", { waitUntil: "networkidle" });
const res = await page.evaluate(() => {
  const h1 = document.querySelector("h1");
  const p = document.querySelector("main p");
  const cs = (el) => getComputedStyle(el).fontFamily;
  return {
    h1: cs(h1),
    p: cs(p),
    bodyClass: document.body.className.slice(0, 200),
    rootDisplayVar: getComputedStyle(document.documentElement).getPropertyValue("--font-display"),
    bodyCormorant: getComputedStyle(document.body).getPropertyValue("--font-cormorant"),
  };
});
console.log(JSON.stringify(res, null, 2));
await browser.close();
