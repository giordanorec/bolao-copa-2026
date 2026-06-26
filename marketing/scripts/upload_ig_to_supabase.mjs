/**
 * upload_ig_to_supabase.mjs
 *
 * Migrates the Instagram-post PNGs out of v4/public/ig-posts/ (too big for
 * Vercel's 100MB deploy limit) into a PUBLIC Supabase Storage bucket
 * named `ig-posts`.
 *
 * - Creates the bucket (public:true) if missing.
 * - Walks v4/public/ig-posts/ (skips manifest.json), uploads every PNG
 *   preserving the <id>/<file>.png object-key structure, with x-upsert:true
 *   so re-runs overwrite.
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from v4/.env.local.
 * NEVER prints the service key.
 *
 * Usage (Node 18+):
 *   node marketing/scripts/upload_ig_to_supabase.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");
const ENV_PATH = path.join(REPO_ROOT, "v4", ".env.local");
const IG_DIR = path.join(REPO_ROOT, "v4", "public", "ig-posts");
const BUCKET = "ig-posts";

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
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in v4/.env.local");
  process.exit(1);
}

const AUTH = { Authorization: `Bearer ${SERVICE_KEY}` };

// ── recursively collect *.png under IG_DIR ─────────────────────────────────────
function walkPng(dir, base = dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkPng(full, base));
    } else if (/\.png$/i.test(entry.name)) {
      // object key relative to IG_DIR, forward slashes
      out.push(path.relative(base, full).split(path.sep).join("/"));
    }
  }
  return out;
}

async function ensureBucket() {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: "POST",
    headers: { ...AUTH, "Content-Type": "application/json" },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
  });
  if (res.ok) {
    console.log(`Bucket "${BUCKET}" created (public).`);
    return;
  }
  const text = await res.text();
  if (res.status === 409 || /already exists|Duplicate/i.test(text)) {
    console.log(`Bucket "${BUCKET}" already exists — continuing.`);
    return;
  }
  console.error(`Bucket creation failed (HTTP ${res.status}): ${text}`);
  process.exit(1);
}

async function uploadOne(key) {
  const filePath = path.join(IG_DIR, key);
  const bytes = fs.readFileSync(filePath);
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${key}`,
    {
      method: "POST",
      headers: { ...AUTH, "Content-Type": "image/png", "x-upsert": "true" },
      body: bytes,
    },
  );
  return { ok: res.ok, status: res.status, body: res.ok ? "" : await res.text() };
}

async function main() {
  await ensureBucket();

  const keys = walkPng(IG_DIR).sort();
  console.log(`Found ${keys.length} PNG(s) to upload.\n`);

  let ok = 0;
  let fail = 0;
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const r = await uploadOne(key);
    const n = String(i + 1).padStart(2, "0");
    if (r.ok) {
      ok++;
      console.log(`[${n}/${keys.length}] OK   ${key}`);
    } else {
      fail++;
      console.error(`[${n}/${keys.length}] FAIL ${key} (HTTP ${r.status}) ${r.body}`);
    }
  }

  console.log(`\nDone. ${ok}/${keys.length} succeeded, ${fail} failed.`);
  if (keys.length) {
    console.log(`Example public URL:\n  ${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${keys[0]}`);
  }
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
