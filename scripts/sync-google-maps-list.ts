/**
 * Sync script — scrapes Shahrukh's Google Maps saved list and writes
 * public/data/cafes.json.
 *
 * Strategy:
 *  1. Intercept the internal `entitylist/getlist` API response to get
 *     coordinates + addresses for all 97 places.
 *  2. Scroll incrementally, snapshotting the DOM every few steps so we
 *     capture each card while it's in the virtual-scroll viewport.
 *  3. Join both datasets by name (API order = DOM order).
 *
 * Usage:
 *   npm run sync              # headless
 *   npm run sync:headed       # show browser window
 */

import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const LIST_URL = "https://maps.app.goo.gl/wM6C61Yz2bFEkw5g8";
const OUT_PATH = path.join(process.cwd(), "public", "data", "cafes.json");
const HEADED = process.argv.includes("--headed");

// ── Types ───────────────────────────────────────────────────────────────────

interface ApiPlace {
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
}

interface DomPlace {
  name: string;
  rating: number | null;
  reviewCount: number | null;
  priceTier: string | null;
  category: string;
  status: string;
  openingHours: string | null;
  photoUrl: string | null;
}

interface Cafe {
  id: string;
  name: string;
  categories: string[];
  rating: number | null;
  reviewCount: number | null;
  priceTier: string | null;
  status: string;
  openingHours: string | null;
  mapsUrl: string;
  address: string | null;
  coordinates: { lat: number; lng: number } | null;
  photoUrl: string | null;
  addedAt: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeId(name: string): string {
  return crypto.createHash("md5").update(name.toLowerCase().trim()).digest("hex").slice(0, 8);
}

function parsePriceTier(raw: string): string | null {
  // Count euro/pound signs directly (e.g. "€€" or "££")
  const euroCount = (raw.match(/€/g) ?? []).length;
  const poundCount = (raw.match(/£/g) ?? []).length;
  const count = euroCount || poundCount;
  if (count === 3) return "€€€";
  if (count === 2) return "€€";
  if (count === 1) return "€";
  // Fallback: numeric range
  const numMatch = raw.match(/(\d+)/);
  if (numMatch) {
    const n = parseInt(numMatch[1], 10);
    if (n <= 10) return "€";
    if (n <= 20) return "€€";
    return "€€€";
  }
  return null;
}

function inferCategory(name: string, category: string): string[] {
  const s = `${name} ${category}`.toLowerCase();
  const cats: string[] = [];
  if (/roast|roastery/.test(s)) cats.push("roastery");
  if (/bakery|patisserie|pastry|cake|konditorei|bäckerei/.test(s)) cats.push("bakery");
  if (/brunch|breakfast|eggs|pancake/.test(s)) cats.push("brunch");
  if (/specialty coffee|speciality coffee|espresso bar|coffee shop|café|cafe/.test(s)) cats.push("specialty-coffee");
  // work-friendly and late-evening are curated manually — not inferred
  return cats;
}

// Manually curated tags preserved across syncs
const MANUAL_TAGS: Record<string, string[]> = {
  "work-friendly": [
    "Brew Coffee","Brew","pyc cheesecake x Die Röstmeister Oberkassel","Nooij Booijs",
    "Fjaka Café & Rösterei","Lækkert Deli","Jaenner Modern Coffee",
    "Copenhagen Coffee Lab - Carlsplatz","PYC cheesecake & gallery",
    "MERCY coffee company","KYTO Coffee Wehrhahn","Tomo Cafè","Weird Space Café Friedrichstadt",
  ],
  "late-evening": [
    "Tomo Cafè","Die Fliese - Café Bar Kultur","Fay Café","Roberts Cafe",
    "Café VND","Dritan Alsela Coffee.","COCO Café","Café Calma","Eis-Café Belluno",
  ],
};

function applyManualTags(name: string, baseCats: string[]): string[] {
  const cats = [...baseCats];
  for (const [tag, names] of Object.entries(MANUAL_TAGS)) {
    if (names.includes(name) && !cats.includes(tag)) cats.push(tag);
  }
  return cats;
}

function parseStatus(raw: string): string {
  const s = raw.toLowerCase();
  if (s.includes("permanently")) return "closed";
  if (s.includes("closed")) return "temporarily-closed";
  return "open";
}

function makeMapsUrl(name: string, lat: number | null, lng: number | null): string {
  const encoded = encodeURIComponent(name);
  if (lat !== null && lng !== null) {
    // /search/ format is more robust than /place/ — works without data= parameter
    return `https://www.google.com/maps/search/${encoded}/@${lat.toFixed(7)},${lng.toFixed(7)},17z`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encoded}`;
}

// ── Step 1: Parse entitylist API response ─────────────────────────────────────

function parseEntityList(body: string): ApiPlace[] {
  const json = body.replace(/^\)\]}'/, "").trim();
  const data = JSON.parse(json);
  const entries: unknown[][] = data[0]?.[8] ?? [];
  return entries.map((entry) => {
    const meta = entry[1] as unknown[] | null;
    const name = (entry[2] as string) ?? "";
    const address = (meta?.[4] as string) || (meta?.[2] as string) || null;
    const coords = meta?.[5] as unknown[] | null;
    const lat = (coords?.[2] as number) ?? null;
    const lng = (coords?.[3] as number) ?? null;
    return { name, address: address || null, lat, lng };
  });
}

// ── Step 2: Scroll + extract DOM data (virtual-scroll aware) ──────────────────

// Plain JS string so tsx/esbuild can't inject __name() into browser context
const EXTRACT_JS = `
(function() {
  return Array.from(document.querySelectorAll("button.SMP2wb")).map(function(btn) {
    function g(sel) { var el = btn.querySelector(sel); return el ? (el.innerText||"").trim() : ""; }
    var name = g(".fontHeadlineSmall.rZF81c") || g(".rZF81c") || g(".fontHeadlineSmall");
    var ratingStr = g(".MW4etd");
    var reviewStr = g(".UY7F9");
    var rows = Array.from(btn.querySelectorAll(".IIrLbb"));
    var row2 = rows[1];
    var spans = row2 ? Array.from(row2.querySelectorAll("span"))
      .map(function(s){ return (s.innerText||"").trim(); })
      .filter(function(s){ return s.length > 0; }) : [];
    var priceStr = spans.find(function(s){ return /[\u20AC\u00A3$]/.test(s); }) || "";
    var catStr = spans.find(function(s){ return s.length > 1 && !/^[\u20AC\u00A3$\u00B7\u2022\d\u2013\-]+$/.test(s); }) || "";
    var statusStr = g(".eXlrNe") || g(".ZDu9vd");
    // Opening hours — look for text containing "Closes" or "Opens" or "Open until"
    var hoursEl = btn.querySelector(".eXlrNe") || btn.querySelector(".ZDu9vd");
    var hoursStr = hoursEl ? (hoursEl.innerText || "").trim() : "";
    // Grab the thumbnail image and upscale from w163-h92 to w600-h400
    var img = btn.querySelector("img.WkIe8");
    var photoUrl = img ? (img.src || img.getAttribute("src") || "") : "";
    if (photoUrl && photoUrl.includes("=w")) {
      photoUrl = photoUrl.replace(/=w\\d+-h\\d+.*$/, "=w600-h400-k-no");
    }
    return { name:name, r:ratingStr, v:reviewStr, p:priceStr, c:catStr, s:statusStr, h:hoursStr, ph:photoUrl };
  });
})()
`;

type RawEntry = { name: string; r: string; v: string; p: string; c: string; s: string; h: string; ph: string };

function parseRaw(r: RawEntry): DomPlace {
  const rating = parseFloat(r.r);
  const reviewCount = parseInt(r.v.replace(/[^0-9]/g, ""), 10);
  return {
    name: r.name,
    rating: isNaN(rating) ? null : rating,
    reviewCount: isNaN(reviewCount) ? null : reviewCount,
    priceTier: parsePriceTier(r.p),
    category: r.c,
    status: parseStatus(r.s),
    openingHours: r.h || null,
    photoUrl: r.ph || null,
  };
}

async function scrollAndCapture(
  page: import("playwright").Page,
  totalExpected: number
): Promise<Map<string, DomPlace>> {
  const byName = new Map<string, DomPlace>();

  async function snapshot() {
    const raw = (await page.evaluate(EXTRACT_JS)) as RawEntry[];
    for (const r of raw) {
      if (!r.name) continue;
      const existing = byName.get(r.name);
      const hasMoreData = !existing ||
        (!existing.rating && r.r) ||
        (!existing.photoUrl && r.ph);
      if (hasMoreData) {
        byName.set(r.name, parseRaw(r));
      }
    }
  }

  await snapshot(); // capture first batch before any scrolling

  let noGrowth = 0;

  for (let i = 0; i < 250; i++) {
    await page.evaluate(`(function(){
      var p = document.querySelector(".m6QErb.DxyBCb") ||
              document.querySelector(".m6QErb") ||
              document.querySelector('[role="main"]');
      if (p) p.scrollTop += 280;
    })()`);

    await page.waitForTimeout(380);

    // Snapshot every 4 steps
    if (i % 4 === 0) {
      const before = byName.size;
      await snapshot();
      if (byName.size === before) {
        noGrowth++;
      } else {
        noGrowth = 0;
      }
      process.stdout.write(`\r   captured ${byName.size}/${totalExpected}…`);
      if (byName.size >= totalExpected || noGrowth >= 10) break;
    }
  }

  // Scroll back to top to re-capture early entries whose ratings loaded after initial snapshot
  await page.evaluate(`(function(){
    var p = document.querySelector(".m6QErb.DxyBCb") ||
            document.querySelector(".m6QErb") ||
            document.querySelector('[role="main"]');
    if (p) p.scrollTop = 0;
  })()`);
  await page.waitForTimeout(1500);
  await snapshot();

  process.stdout.write("\n");
  return byName;
}

// ── Step 3: Fetch photos for cafes that had none in list view ─────────────────

// Plain JS — finds the largest googleusercontent photo on a Maps detail page
const PHOTO_FROM_DETAIL_JS = `
(function() {
  var imgs = Array.from(document.querySelectorAll('img'));
  var candidates = imgs.filter(function(img) {
    var src = img.src || '';
    return src.includes('googleusercontent.com') &&
           src.includes('=w') &&
           !src.includes('streetviewpixels') &&
           (img.naturalWidth > 80 || img.width > 80);
  });
  if (!candidates.length) return null;
  candidates.sort(function(a, b) {
    return ((b.naturalWidth || b.width) || 0) - ((a.naturalWidth || a.width) || 0);
  });
  var src = candidates[0].src;
  return src.replace(/=w\\d+-h\\d+.*$/, '=w600-h400-k-no');
})()
`;

async function fetchMissingPhotos(
  context: import("playwright").BrowserContext,
  cafes: Cafe[]
): Promise<void> {
  const missing = cafes.filter((c) => !c.photoUrl);
  if (!missing.length) return;

  console.log(`\n📸 Fetching photos for ${missing.length} cafés…`);
  const page = await context.newPage();

  for (const cafe of missing) {
    try {
      // domcontentloaded is reliable on Maps; networkidle never fires (background XHR)
      await page.goto(cafe.mapsUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
      // Wait for images to lazy-load
      await page.waitForTimeout(3500);

      // If it's a search results page, click the first card to open detail
      const card = page.locator("button.SMP2wb").first();
      if (await card.isVisible({ timeout: 2000 }).catch(() => false)) {
        await card.click();
        await page.waitForTimeout(2500);
      }

      const photoUrl = (await page.evaluate(PHOTO_FROM_DETAIL_JS)) as string | null;
      if (photoUrl) {
        cafe.photoUrl = photoUrl;
        console.log(`   ✓ ${cafe.name}`);
      } else {
        console.log(`   – ${cafe.name} (no photo found)`);
      }
    } catch (err) {
      console.log(`   ✗ ${cafe.name}: ${(err as Error).message?.slice(0, 60)}`);
    }
  }

  await page.close();
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 Düssi Cafes sync starting…");
  console.log(`   URL:  ${LIST_URL}`);
  console.log(`   Mode: ${HEADED ? "headed" : "headless"}\n`);

  // Load existing cafes — new entries will be appended, existing ones untouched
  let existingCafes: Cafe[] = [];
  if (fs.existsSync(OUT_PATH)) {
    try {
      existingCafes = JSON.parse(fs.readFileSync(OUT_PATH, "utf-8"));
      console.log(`📂 Loaded ${existingCafes.length} existing cafés`);
    } catch {
      console.warn("⚠️  Could not parse existing cafes.json, starting fresh");
    }
  }
  const existingIds = new Set(existingCafes.map((c) => c.id));
  const existingNames = new Set(existingCafes.map((c) => c.name.toLowerCase().trim()));

  const browser = await chromium.launch({ headless: !HEADED });
  const context = await browser.newContext({
    locale: "en-GB",
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  let entityListBody = "";
  page.on("response", async (resp) => {
    if (resp.url().includes("entitylist/getlist") && !entityListBody) {
      entityListBody = await resp.text().catch(() => "");
    }
  });

  try {
    console.log("📍 Loading list page…");
    // Use domcontentloaded — Google Maps never reaches networkidle due to background requests
    await page.goto(LIST_URL, { waitUntil: "domcontentloaded", timeout: 45000 });

    for (const label of ["Accept all", "Reject all"]) {
      const btn = page.locator(`button:has-text("${label}")`).first();
      if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(800);
        break;
      }
    }

    // Wait for the list to load — entitylist API fires shortly after page load
    await page.waitForTimeout(4000);

    if (!entityListBody) {
      // Try waiting a bit longer for the API call
      await page.waitForTimeout(5000);
    }

    if (!entityListBody) {
      throw new Error("entitylist/getlist not captured — list may require login or URL may be invalid.");
    }

    console.log("📦 Parsing entitylist API response…");
    const apiPlaces = parseEntityList(entityListBody);
    console.log(`   ${apiPlaces.length} places from API`);

    await page.waitForSelector("button.SMP2wb", { timeout: 15000 }).catch(() => {
      console.warn("⚠️  button.SMP2wb not found — DOM extraction may be incomplete");
    });

    console.log("📜 Scrolling + capturing (virtual-scroll aware)…");
    const domByName = await scrollAndCapture(page, apiPlaces.length);
    console.log(`   ${domByName.size} unique entries captured from DOM`);

    // Build scraped café list
    const today = new Date().toISOString().slice(0, 10);
    const scrapedCafes: Cafe[] = apiPlaces.map((api) => {
      const dom = domByName.get(api.name);
      return {
        id: makeId(api.name),
        name: api.name,
        categories: applyManualTags(api.name, inferCategory(api.name, dom?.category ?? "")),
        rating: dom?.rating ?? null,
        reviewCount: dom?.reviewCount ?? null,
        priceTier: dom?.priceTier ?? null,
        status: dom?.status ?? "open",
        openingHours: dom?.openingHours ?? null,
        mapsUrl: makeMapsUrl(api.name, api.lat, api.lng),
        address: api.address,
        coordinates: api.lat !== null && api.lng !== null
          ? { lat: api.lat, lng: api.lng }
          : null,
        photoUrl: dom?.photoUrl ?? null,
        addedAt: today,
      };
    });

    // Deduplicate scraped list by name
    const seen = new Set<string>();
    const dedupedScraped = scrapedCafes.filter((c) => {
      if (seen.has(c.name)) return false;
      seen.add(c.name);
      return true;
    });
    if (dedupedScraped.length < scrapedCafes.length) {
      console.log(`\n⚠️  Removed ${scrapedCafes.length - dedupedScraped.length} duplicate(s) by name`);
    }

    // Find only NEW cafes — not already in the existing list
    const newCafes = dedupedScraped.filter(
      (c) => !existingIds.has(c.id) && !existingNames.has(c.name.toLowerCase().trim())
    );

    if (newCafes.length === 0) {
      console.log("\n✅ No new cafés found — list is up to date");
    } else {
      console.log(`\n🆕 Found ${newCafes.length} new café(s):`);
      newCafes.forEach((c) => console.log(`   + ${c.name}`));
      await fetchMissingPhotos(context, newCafes);
    }

    // Merge: existing cafes first (unchanged), then new ones appended
    const finalCafes = [...existingCafes, ...newCafes];

    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
    fs.writeFileSync(OUT_PATH, JSON.stringify(finalCafes, null, 2));

    console.log(`\n✅ Wrote ${finalCafes.length} cafés → ${OUT_PATH}`);
    console.log(`   (${existingCafes.length} existing + ${newCafes.length} new)`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("\n❌ Sync failed:", err.message);
  process.exit(1);
});
