/**
 * Intercepts network requests to find the Maps list API response.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const LIST_URL = "https://maps.app.goo.gl/wM6C61Yz2bFEkw5g8";

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ locale: "en-GB" });
  const page = await context.newPage();

  const captured: { url: string; body: string }[] = [];

  // Intercept all responses
  page.on("response", async (resp) => {
    const url = resp.url();
    if (
      url.includes("entitylist") ||
      url.includes("listentity") ||
      url.includes("GetListEntities") ||
      url.includes("place") ||
      url.includes("maps/api") ||
      url.includes("?pb=")
    ) {
      try {
        const body = await resp.text();
        if (body.length > 100 && body.length < 2_000_000) {
          captured.push({ url: url.slice(0, 200), body: body.slice(0, 500) });
          console.log(`\n[CAPTURED] ${url.slice(0, 120)}`);
          console.log(`  body[:200]: ${body.slice(0, 200)}`);
        }
      } catch {
        // ignore
      }
    }
  });

  await page.goto(LIST_URL, { waitUntil: "networkidle", timeout: 30000 });

  // Accept consent
  for (const label of ["Accept all", "Reject all"]) {
    const btn = page.locator(`button:has-text("${label}")`).first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(1000);
    }
  }

  await page.waitForTimeout(3000);

  // Also try clicking the first card and see where the URL goes
  const cards = page.locator(".GYMy9d.UocPK");
  const count = await cards.count();
  console.log(`\nFound ${count} cards with .GYMy9d.UocPK`);

  if (count > 0) {
    console.log("\nClicking first card...");
    const initialUrl = page.url();
    await cards.first().click();
    await page.waitForTimeout(2000);
    const newUrl = page.url();
    console.log(`Before: ${initialUrl.slice(0, 120)}`);
    console.log(`After:  ${newUrl.slice(0, 120)}`);
  }

  // Save captured responses summary
  const outPath = path.join(process.cwd(), "scripts", "debug-network.json");
  fs.writeFileSync(outPath, JSON.stringify(captured, null, 2));
  console.log(`\nSaved ${captured.length} captured responses to ${outPath}`);

  await browser.close();
}

main().catch(console.error);
