import { chromium } from "playwright";

const url = process.argv[2] || "https://litter.catbox.moe/r00zh6.html";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const errors = [];
page.on("pageerror", (e) => errors.push("page: " + e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });
await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
try {
await page.waitForSelector("#goFight", { timeout: 8000 });
} catch (e) {
  const body = await page.locator("body").innerText().catch(() => "");
  console.log(JSON.stringify({ fail: e.message, body: body.slice(0, 500), errors }, null, 2));
  await page.screenshot({ path: "/tmp/phone-home.png" });
  await browser.close();
  process.exit(1);
}
const name = await page.locator("#title").innerText();
await page.screenshot({ path: "/tmp/phone-home.png" });
await page.click("#goFight");
await page.waitForSelector("#duel", { timeout: 8000 });
await page.click("#duel");
const frame = page.frameLocator("#fight");
await frame.locator("#arena").waitFor({ timeout: 15000 });
await page.waitForTimeout(2500);
const status = await frame.locator("#status").innerText().catch(() => "");
const roster = await frame.locator("body").evaluate(() => (window.__arenaRoster ? window.__arenaRoster().length : -1)).catch(() => -1);
await page.screenshot({ path: "/tmp/phone-fight.png" });
console.log(JSON.stringify({ name, status, roster, errors }, null, 2));
await browser.close();
