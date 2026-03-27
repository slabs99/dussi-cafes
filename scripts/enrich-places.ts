/**
 * Enriches cafes.json with data from the Google Places API (New).
 *
 * Adds per-cafe: placeId, weekdayHours, website, phone.
 * Only fetches cafes that are missing placeId (incremental — safe to re-run).
 *
 * Prerequisites:
 *   1. Enable "Places API (New)" in Google Cloud Console
 *   2. Create an API key and set GOOGLE_PLACES_API_KEY in .env.local
 *
 * Usage:
 *   npm run enrich
 */

import fs from "fs";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "public", "data", "cafes.json");
const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const PLACES_BASE = "https://places.googleapis.com/v1";

if (!API_KEY) {
  console.error("❌  GOOGLE_PLACES_API_KEY is not set.");
  process.exit(1);
}

interface CafeRecord {
  id: string;
  name: string;
  address: string | null;
  placeId: string | null;
  weekdayHours: string[] | null;
  website: string | null;
  phone: string | null;
  [key: string]: unknown;
}

// ── Google Places API helpers ─────────────────────────────────────────────────

async function findPlaceId(name: string, address: string | null): Promise<string | null> {
  const city = address ? address.split(",").slice(-2).join(",").trim() : "Düsseldorf";
  const query = `${name}, ${city}`;

  const res = await fetch(`${PLACES_BASE}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY!,
      "X-Goog-FieldMask": "places.id,places.displayName",
    },
    body: JSON.stringify({ textQuery: query, languageCode: "en" }),
  });

  if (!res.ok) {
    console.warn(`   searchText failed (${res.status}): ${await res.text()}`);
    return null;
  }

  const data = await res.json();
  return (data.places?.[0]?.id as string) ?? null;
}

async function fetchPlaceDetails(placeId: string): Promise<{
  weekdayHours: string[] | null;
  website: string | null;
  phone: string | null;
}> {
  const fields = "regularOpeningHours,websiteUri,nationalPhoneNumber";
  const res = await fetch(`${PLACES_BASE}/places/${placeId}?languageCode=en`, {
    headers: {
      "X-Goog-Api-Key": API_KEY!,
      "X-Goog-FieldMask": fields,
    },
  });

  if (!res.ok) {
    console.warn(`   getPlace failed (${res.status})`);
    return { weekdayHours: null, website: null, phone: null };
  }

  const data = await res.json();
  return {
    weekdayHours: (data.regularOpeningHours?.weekdayDescriptions as string[]) ?? null,
    website: (data.websiteUri as string) ?? null,
    phone: (data.nationalPhoneNumber as string) ?? null,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const cafes: CafeRecord[] = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
  const toEnrich = cafes.filter((c) => !c.placeId);

  console.log(`\n🔍 Enriching ${toEnrich.length} cafes (${cafes.length - toEnrich.length} already done)\n`);

  let enriched = 0;
  let failed = 0;

  for (const cafe of toEnrich) {
    process.stdout.write(`   ${cafe.name}… `);

    try {
      const placeId = await findPlaceId(cafe.name, cafe.address);
      if (!placeId) {
        process.stdout.write("no place found\n");
        failed++;
        continue;
      }

      const details = await fetchPlaceDetails(placeId);
      cafe.placeId = placeId;
      cafe.weekdayHours = details.weekdayHours;
      cafe.website = details.website;
      cafe.phone = details.phone;

      const tags = [
        details.weekdayHours ? "hours" : null,
        details.website ? "website" : null,
        details.phone ? "phone" : null,
      ].filter(Boolean).join(", ");

      process.stdout.write(`✓  [${tags}]\n`);
      enriched++;

      // Polite rate limit — 10 req/s max on free tier
      await new Promise((r) => setTimeout(r, 120));
    } catch (err) {
      process.stdout.write(`error: ${(err as Error).message}\n`);
      failed++;
    }
  }

  fs.writeFileSync(DATA_PATH, JSON.stringify(cafes, null, 2));

  console.log(`\n✅ Enriched ${enriched} cafes, ${failed} failed → ${DATA_PATH}`);

  if (failed > 0) {
    console.log("   Re-run to retry failed entries (incremental — already enriched are skipped)");
  }
}

main().catch((err) => {
  console.error("\n❌ Enrich failed:", err.message);
  process.exit(1);
});
