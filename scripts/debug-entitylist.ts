/**
 * Captures the full entitylist API response and saves it to disk.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const LIST_URL = "https://maps.app.goo.gl/wM6C61Yz2bFEkw5g8";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ locale: "en-GB" });
  const page = await context.newPage();

  let entityListBody = "";

  page.on("response", async (resp) => {
    if (resp.url().includes("entitylist/getlist")) {
      entityListBody = await resp.text().catch(() => "");
      console.log(`Captured entitylist response: ${entityListBody.length} chars`);
    }
  });

  await page.goto(LIST_URL, { waitUntil: "networkidle", timeout: 30000 });

  for (const label of ["Accept all", "Reject all"]) {
    const btn = page.locator(`button:has-text("${label}")`).first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(1000);
      break;
    }
  }

  await page.waitForTimeout(2000);

  if (entityListBody) {
    // Strip the XSSI prefix
    const json = entityListBody.replace(/^\)\]}'/, "").trim();
    const outPath = path.join(process.cwd(), "scripts", "debug-entitylist.json");
    fs.writeFileSync(outPath, json);
    console.log(`Saved to ${outPath}`);

    // Quick parse to count places
    try {
      const data = JSON.parse(json);
      const places = data[0]?.[8] ?? [];
      console.log(`Places in response: ${places.length}`);
      // Show first 3
      places.slice(0, 3).forEach((p: unknown[], i: number) => {
        console.log(`  ${i + 1}.`, JSON.stringify(p).slice(0, 200));
      });
    } catch (e) {
      console.error("Parse error:", e);
    }
  } else {
    console.warn("No entitylist response captured — check if page needs login");
  }

  await browser.close();
}

main().catch(console.error);
