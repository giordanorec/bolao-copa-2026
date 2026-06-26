/**
 * build_ig_manifest.mjs
 *
 * Scans marketing/brainstorming_instagram/ and for each post:
 *   - Parses LEGENDA.md (caption) and ROTEIRO.md (roteiro/script)
 *   - Copies poster.png / slide-*.png / card.png into v4/public/ig-posts/<id>/
 *     (kept locally for re-upload; this folder is gitignored — too big for Vercel)
 *   - Writes v4/public/ig-posts-manifest.json with FULL Supabase public URLs
 *     (images are served from the public `ig-posts` Storage bucket, not public/).
 *
 * Skips .mp4 / .webm (too large for public/).
 *
 * After running this, re-run the uploader to push any new PNGs to Storage:
 *   node marketing/scripts/upload_ig_to_supabase.mjs
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL from v4/.env.local (or the environment).
 *
 * Usage (from repo root or anywhere):
 *   node marketing/scripts/build_ig_manifest.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");
const INSTAGRAM_DIR = path.join(REPO_ROOT, "marketing", "brainstorming_instagram");
const OUT_DIR = path.join(REPO_ROOT, "v4", "public", "ig-posts");
const MANIFEST_PATH = path.join(REPO_ROOT, "v4", "public", "ig-posts-manifest.json");
const ENV_PATH = path.join(REPO_ROOT, "v4", ".env.local");

// ── helpers ──────────────────────────────────────────────────────────────────

/** Minimal .env.local parser so we can read NEXT_PUBLIC_SUPABASE_URL. */
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
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  env.NEXT_PUBLIC_SUPABASE_URL ||
  ""
).replace(/\/$/, "");

if (!SUPABASE_URL) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL (checked env + v4/.env.local). " +
      "Cannot build manifest with Supabase Storage URLs.",
  );
  process.exit(1);
}

/** Full public Storage URL for an object key under the `ig-posts` bucket. */
function publicUrl(id, file) {
  return `${SUPABASE_URL}/storage/v1/object/public/ig-posts/${id}/${file}`;
}

function readMd(filePath) {
  if (!fs.existsSync(filePath)) return "";
  return fs.readFileSync(filePath, "utf8").trim();
}

/**
 * Turns "01_reel_battle-of-the-bots" → "Battle of the Bots"
 * Strips leading NN_, strips tipo token, title-cases rest.
 */
function humanizeTitle(folderName) {
  // Remove leading number + underscore (e.g. "01_")
  let s = folderName.replace(/^\d+_/, "");
  // Remove tipo prefix (reel_, carrossel_, card_)
  s = s.replace(/^(reel|carrossel|card)-?_?/, "");
  // Replace hyphens with spaces and title-case
  return s
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Detect tipo from folder name. Falls back to "reel".
 */
function detectTipo(folderName) {
  const lower = folderName.toLowerCase();
  if (lower.includes("carrossel")) return "carrossel";
  if (lower.includes("card")) return "card";
  return "reel";
}

// ── main ─────────────────────────────────────────────────────────────────────

// Read all post folders sorted by leading number
const entries = fs
  .readdirSync(INSTAGRAM_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory() && /^\d+_/.test(d.name))
  .sort((a, b) => {
    const na = parseInt(a.name, 10) || 0;
    const nb = parseInt(b.name, 10) || 0;
    return na - nb;
  });

// Ensure output dir exists
fs.mkdirSync(OUT_DIR, { recursive: true });

const manifest = [];

for (const entry of entries) {
  const folderName = entry.name;
  const srcDir = path.join(INSTAGRAM_DIR, folderName);

  // Derive id = folder name (stable, unique)
  const id = folderName;
  const tipo = detectTipo(folderName);
  const titulo = humanizeTitle(folderName);

  const caption = readMd(path.join(srcDir, "LEGENDA.md"));
  const roteiro = readMd(path.join(srcDir, "ROTEIRO.md"));

  // Collect images to copy (poster.png, slide-*.png, card.png — not mp4/webm)
  const allFiles = fs.readdirSync(srcDir);
  const imageFiles = allFiles
    .filter((f) => /\.(png|jpg|jpeg|gif|webp)$/i.test(f))
    .sort();

  const destDir = path.join(OUT_DIR, id);
  fs.mkdirSync(destDir, { recursive: true });

  const imagePaths = [];
  for (const imgFile of imageFiles) {
    const src = path.join(srcDir, imgFile);
    const dest = path.join(destDir, imgFile);
    fs.copyFileSync(src, dest);
    imagePaths.push(publicUrl(id, imgFile));
  }

  // hasVideo = any .mp4 or .webm exists in source (not copied)
  const hasVideo = allFiles.some((f) => /\.(mp4|webm)$/i.test(f));

  manifest.push({
    id,
    tipo,
    titulo,
    caption,
    roteiro,
    images: imagePaths,
    hasVideo,
  });

  console.log(
    `[${String(manifest.length).padStart(2, "0")}] ${tipo.padEnd(10)} ${folderName} — ${imagePaths.length} img(s)${hasVideo ? " + video" : ""}`,
  );
}

fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n", "utf8");

console.log(`\nDone. ${manifest.length} posts written to ${MANIFEST_PATH}`);
console.log(
  "Reminder: run `node marketing/scripts/upload_ig_to_supabase.mjs` to push PNGs to Storage.",
);
