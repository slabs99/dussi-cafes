/**
 * Downloads cafe photos from their current photoUrl and saves them locally.
 * Updates overrides.json so cafes use the local path instead of expiring Google URLs.
 *
 * Run IMMEDIATELY after `npm run sync` while the fresh Google URLs are still valid.
 *
 * Usage:
 *   npm run download-photos
 */

import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import { URL } from "url";

const DATA_PATH   = path.join(process.cwd(), "public", "data", "cafes.json");
const OVERRIDES_PATH = path.join(process.cwd(), "public", "data", "overrides.json");
const PHOTOS_DIR  = path.join(process.cwd(), "public", "photos");

interface CafeRecord {
  id: string;
  name: string;
  photoUrl?: string | null;
  [key: string]: unknown;
}

interface Overrides {
  [id: string]: { photoUrl?: string; [key: string]: unknown };
}

function extFromUrl(url: string, contentType: string): string {
  const u = new URL(url);
  const p = u.pathname.toLowerCase();
  if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return ".jpg";
  if (p.endsWith(".png")) return ".png";
  if (p.endsWith(".webp")) return ".webp";
  if (contentType.includes("jpeg")) return ".jpg";
  if (contentType.includes("png")) return ".png";
  if (contentType.includes("webp")) return ".webp";
  return ".jpg";
}

function download(url: string, dest: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith("https") ? https : http;
    const req = proto.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.google.com/maps/",
      },
    }, (res) => {
      // Follow redirects
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      const contentType = res.headers["content-type"] ?? "image/jpeg";
      const ext = extFromUrl(url, contentType);
      const finalDest = dest + ext;
      const file = fs.createWriteStream(finalDest);
      res.pipe(file);
      file.on("finish", () => { file.close(); resolve(finalDest); });
      file.on("error", reject);
    });
    req.on("error", reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error("timeout")); });
  });
}

async function main() {
  const cafes: CafeRecord[] = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
  const overrides: Overrides = fs.existsSync(OVERRIDES_PATH)
    ? JSON.parse(fs.readFileSync(OVERRIDES_PATH, "utf-8"))
    : {};

  if (!fs.existsSync(PHOTOS_DIR)) fs.mkdirSync(PHOTOS_DIR, { recursive: true });

  // Determine which cafes need photos downloaded
  const toDownload = cafes.filter((c) => {
    if (!c.photoUrl) return false;
    if (!c.photoUrl.startsWith("http")) return false; // already local
    const ov = overrides[c.id];
    if (ov?.photoUrl && !ov.photoUrl.startsWith("http")) return false; // already overridden with local
    // Skip if file already exists
    const existing = [".jpg", ".jpeg", ".png", ".webp"].find((ext) =>
      fs.existsSync(path.join(PHOTOS_DIR, `${c.id}${ext}`))
    );
    return !existing;
  });

  console.log(`\n📸 Downloading photos for ${toDownload.length} cafes…\n`);

  let ok = 0, fail = 0;
  const updatedOverrides = { ...overrides };

  for (const cafe of toDownload) {
    process.stdout.write(`   ${cafe.name.slice(0, 45).padEnd(45)} `);
    const destBase = path.join(PHOTOS_DIR, cafe.id);
    try {
      const finalPath = await download(cafe.photoUrl!, destBase);
      const filename = path.basename(finalPath);
      updatedOverrides[cafe.id] = { ...updatedOverrides[cafe.id], photoUrl: `/photos/${filename}` };
      process.stdout.write(`✓\n`);
      ok++;
      // Small delay to be polite
      await new Promise((r) => setTimeout(r, 80));
    } catch (err) {
      process.stdout.write(`✗  ${(err as Error).message}\n`);
      fail++;
    }
  }

  fs.writeFileSync(OVERRIDES_PATH, JSON.stringify(updatedOverrides, null, 2));

  console.log(`\n✅ Done: ${ok} downloaded, ${fail} failed`);
  console.log(`📝 overrides.json updated with local photo paths`);
  console.log(`\nNext step: git add public/photos public/data/overrides.json && git commit -m "photos: cache cafe images locally"\n`);
}

main().catch((err) => { console.error(err); process.exit(1); });
