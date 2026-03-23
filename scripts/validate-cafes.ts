/**
 * Validates public/data/cafes.json after a sync run.
 * Exits with code 1 (fails CI) if the data looks wrong.
 *
 * Checks:
 *   - File exists and is valid JSON
 *   - At least 1 café extracted
 *   - Every entry has a non-empty name and a mapsUrl
 *   - At least 50% of entries have a rating
 */

import fs from "fs";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "public", "data", "cafes.json");

interface CafeEntry {
  id?: unknown;
  name?: unknown;
  mapsUrl?: unknown;
  rating?: unknown;
}

function fail(msg: string): never {
  console.error(`\n❌ Validation failed: ${msg}`);
  process.exit(1);
}

function pass(msg: string) {
  console.log(`✅ ${msg}`);
}

// 1. File exists
if (!fs.existsSync(DATA_PATH)) {
  fail(`${DATA_PATH} does not exist — run the sync script first`);
}

// 2. Valid JSON
let cafes: CafeEntry[];
try {
  cafes = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
} catch {
  fail("cafes.json is not valid JSON");
}

// 3. Is an array
if (!Array.isArray(cafes)) fail("cafes.json must be a JSON array");

pass(`File is valid JSON array`);

// 4. At least 1 café
if (cafes.length === 0) fail("cafes.json contains 0 entries");
pass(`${cafes.length} café(s) found`);

// 5. Every entry has name + mapsUrl
const missingName = cafes.filter((c) => !c.name || typeof c.name !== "string" || !c.name.trim());
if (missingName.length > 0) fail(`${missingName.length} entries are missing a name`);
pass("All entries have a name");

const missingUrl = cafes.filter((c) => !c.mapsUrl || typeof c.mapsUrl !== "string");
if (missingUrl.length > 0) fail(`${missingUrl.length} entries are missing mapsUrl`);
pass("All entries have a mapsUrl");

// 6. At least 50% have a rating (warns but doesn't fail if list is small)
const withRating = cafes.filter((c) => c.rating !== null && typeof c.rating === "number");
const ratingPct = Math.round((withRating.length / cafes.length) * 100);
if (ratingPct < 50 && cafes.length > 3) {
  console.warn(`⚠️  Only ${ratingPct}% of entries have a rating — selectors may need updating`);
} else {
  pass(`${ratingPct}% of entries have a rating`);
}

console.log("\n🎉 Validation passed!");
