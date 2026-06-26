/**
 * build_ig_thumbs.mjs
 *
 * Generates small webp thumbnails for every Instagram-post PNG and uploads
 * them to the PUBLIC Supabase Storage bucket `ig-posts` under the key
 * `<id>/thumb/<basename>.webp`. These thumbs feed the admin grid preview so
 * the page no longer loads ~79 full-size PNGs.
 *
 * For each PNG in v4/public/ig-posts/<id>/:
 *   - sharp → resize width 400px (keep aspect, withoutEnlargement) → webp q72
 *   - upload to ig-posts bucket key `<id>/thumb/<basename>.webp`
 *
 * Then updates v4/public/ig-posts-manifest.json: for each post adds a parallel
 * `thumbs: string[]` array (full public URLs) mirroring `images`. `images` are
 * left unchanged.
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from v4/.env.local.
 * NEVER prints the service key.
 *
 * sharp lives in v4/node_modules, so run from the v4 dir:
 *   cd v4 && node ../marketing/scripts/build_ig_thumbs.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");

// sharp is installed in v4/node_modules (not at repo root). Resolve it by its
// absolute path so this script works no matter the cwd it's launched from.
const SHARP_ENTRY = path.join(REPO_ROOT, "v4", "node_modules", "sharp", "lib", "index.js");
const sharp = (await import(pathToFileURL(SHARP_ENTRY).href)).default;
const ENV_PATH = path.join(REPO_ROOT, "v4", ".env.local");
const IG_DIR = path.join(REPO_ROOT, "v4", "public", "ig-posts");
const MANIFEST_PATH = path.join(REPO_ROOT, "v4", "public", "ig-posts-manifest.json");
const BUCKET = "ig-posts";
const THUMB_WIDTH = 400;
const WEBP_QUALITY = 72;

// ── tiny .env.local parser (no deps) ───────────────────────────────────────────
function loadEnv(filePath) {
  const out = {};
  if (!fs.existsSync(filePath)) return out;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[m[1]] = val;
  }
  return out;
}

const env = loadEnv(ENV_PATH);
const SUPABASE_URL = (
  env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  ""
).replace(/\/$/, "");
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in v4/.env.local");
  process.exit(1);
}

const AUTH = { Authorization: `Bearer ${SERVICE_KEY}` };

/** Full public Storage URL for a thumb object key under the `ig-posts` bucket. */
function thumbPublicUrl(id, base) {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${id}/thumb/${base}.webp`;
}

// ── recursively collect *.png under IG_DIR (skip existing thumb/ dirs) ──────────
function walkPng(dir, base = dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (entry.name === "thumb") continue; // never recurse into thumb output
      out.push(...walkPng(path.join(dir, entry.name), base));
    } else if (/\.png$/i.test(entry.name)) {
      out.push(path.relative(base, path.join(dir, entry.name)).split(path.sep).join("/"));
    }
  }
  return out;
}

async function uploadThumb(key, bytes) {
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${key}`,
    {
      method: "POST",
      headers: { ...AUTH, "Content-Type": "image/webp", "x-upsert": "true" },
      body: bytes,
    },
  );
  return { ok: res.ok, status: res.status, body: res.ok ? "" : await res.text() };
}

async function main() {
  if (!fs.existsSync(IG_DIR)) {
    console.error(`Source dir not found: ${IG_DIR}`);
    process.exit(1);
  }

  const keys = walkPng(IG_DIR).sort(); // e.g. "01_reel_.../poster.png"
  console.log(`Found ${keys.length} PNG(s) to thumbnail.\n`);

  let ok = 0;
  let fail = 0;
  let srcBytesTotal = 0;
  let thumbBytesTotal = 0;

  // id -> { base(of image file) -> thumbUrl }
  const thumbByIdBase = {};

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const n = String(i + 1).padStart(2, "0");
    const parts = key.split("/");
    const id = parts[0];
    const fileName = parts[parts.length - 1]; // e.g. poster.png
    const base = fileName.replace(/\.png$/i, ""); // poster
    const srcPath = path.join(IG_DIR, key);

    try {
      const srcStat = fs.statSync(srcPath);
      const webp = await sharp(srcPath)
        .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();

      const thumbKey = `${id}/thumb/${base}.webp`;
      const r = await uploadThumb(thumbKey, webp);
      if (!r.ok) {
        fail++;
        console.error(`[${n}/${keys.length}] FAIL ${thumbKey} (HTTP ${r.status}) ${r.body}`);
        continue;
      }

      ok++;
      srcBytesTotal += srcStat.size;
      thumbBytesTotal += webp.length;
      (thumbByIdBase[id] ||= {})[base] = thumbPublicUrl(id, base);
      console.log(
        `[${n}/${keys.length}] OK   ${thumbKey}  (${(srcStat.size / 1024).toFixed(0)}KB → ${(webp.length / 1024).toFixed(0)}KB)`,
      );
    } catch (err) {
      fail++;
      console.error(`[${n}/${keys.length}] FAIL ${key} — ${err.message}`);
    }
  }

  // ── update manifest: add parallel `thumbs` arrays ─────────────────────────────
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error(`\nManifest not found: ${MANIFEST_PATH}`);
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  let postsTouched = 0;
  for (const post of manifest) {
    const map = thumbByIdBase[post.id] || {};
    const thumbs = (post.images || []).map((imgUrl) => {
      const imgFile = imgUrl.split("/").pop() || "";
      const imgBase = imgFile.replace(/\.[a-z0-9]+$/i, "");
      // fall back to the full image URL if no thumb was produced for it
      return map[imgBase] || imgUrl;
    });
    post.thumbs = thumbs;
    postsTouched++;
  }
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n", "utf8");

  console.log(`\nDone. ${ok}/${keys.length} thumbs uploaded, ${fail} failed.`);
  console.log(`Manifest updated: ${postsTouched} posts now have a \`thumbs\` array.`);
  if (srcBytesTotal > 0) {
    console.log(
      `Size: ${(srcBytesTotal / 1024 / 1024).toFixed(1)}MB source → ${(thumbBytesTotal / 1024 / 1024).toFixed(2)}MB thumbs ` +
        `(${(100 - (thumbBytesTotal / srcBytesTotal) * 100).toFixed(1)}% smaller).`,
    );
  }
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
