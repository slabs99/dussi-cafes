/**
 * Debug script — screenshots the page and dumps candidate selectors.
 * Run: npx tsx scripts/debug-page.ts
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const LIST_URL = "https://maps.app.goo.gl/wM6C61Yz2bFEkw5g8";

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    locale: "en-GB",
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  await page.goto(LIST_URL, { waitUntil: "networkidle", timeout: 30000 });

  // Accept consent if shown
  for (const label of ["Accept all", "Reject all", "Accept"]) {
    const btn = page.locator(`button:has-text("${label}")`).first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log(`Clicking: ${label}`);
      await btn.click();
      await page.waitForTimeout(1000);
      break;
    }
  }

  await page.waitForTimeout(3000);

  // Screenshot
  const screenshotPath = path.join(process.cwd(), "scripts", "debug-screenshot.png");
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`Screenshot saved: ${screenshotPath}`);

  // Probe common Google Maps selectors
  const selectors = [
    "a.hfpxzc",
    "[data-result-index]",
    ".Nv2PK",
    ".bfdHYd",
    "[jsan]",
    "div[role='article']",
    ".lI9IFe",
    ".hfpxzc",
    "a[href*='maps.google']",
    "a[href*='/maps/place']",
    ".section-result",
    "[data-hveid]",
    ".TFQHme",
  ];

  console.log("\n--- Selector probe ---");
  for (const sel of selectors) {
    const count = await page.locator(sel).count();
    if (count > 0) console.log(`  ${count}x  ${sel}`);
  }

  // Dump first 2000 chars of body text to understand page state
  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 2000));
  console.log("\n--- Page text (first 2000 chars) ---");
  console.log(bodyText);

  // Dump all unique class names from links
  const linkInfo = await page.evaluate(() =>
    Array.from(document.querySelectorAll("a"))
      .filter((a) => a.href.includes("maps") || a.href.includes("place"))
      .slice(0, 10)
      .map((a) => ({ href: a.href.slice(0, 80), classes: a.className.slice(0, 60) }))
  );
  console.log("\n--- Map-related links ---");
  linkInfo.forEach((l) => console.log(`  [${l.classes}] ${l.href}`));

  // Save HTML snapshot
  const html = await page.content();
  const htmlPath = path.join(process.cwd(), "scripts", "debug-snapshot.html");
  fs.writeFileSync(htmlPath, html);
  console.log(`\nHTML snapshot: ${htmlPath}`);

  await browser.close();
}

main().catch(console.error);
