/**
 * Sobe poster.png + vídeo .webm de uma vinheta pro bucket público `ig-posts`
 * no Supabase e imprime as URLs públicas. Reusa NEXT_PUBLIC_SUPABASE_URL +
 * SUPABASE_SERVICE_ROLE_KEY de v4/.env.local. Nunca imprime a key.
 *
 * Uso: node marketing/scripts/upload_vinheta.mjs <slug>
 *   ex.: node marketing/scripts/upload_vinheta.mjs J76-br-jp
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");
const ENV_PATH = path.join(REPO_ROOT, "v4", ".env.local");
const VIN_DIR = path.join(REPO_ROOT, "marketing", "vinhetas");
const BUCKET = "ig-posts";

function loadEnv(filePath) {
  const out = {};
  if (!fs.existsSync(filePath)) return out;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
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
  console.error("Missing SUPABASE creds in v4/.env.local");
  process.exit(1);
}
const AUTH = { Authorization: `Bearer ${SERVICE_KEY}` };

const slug = process.argv[2] || "J76-br-jp";
const id = `vinheta-${slug}`;

async function up(localFile, key, contentType) {
  const bytes = fs.readFileSync(localFile);
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${key}`, {
    method: "POST",
    headers: { ...AUTH, "Content-Type": contentType, "x-upsert": "true" },
    body: bytes,
  });
  if (!res.ok) {
    console.error(`FAIL ${key} (HTTP ${res.status}) ${await res.text()}`);
    process.exit(1);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${key}`;
}

const posterLocal = path.join(VIN_DIR, `vinheta-${slug}.poster.png`);
const webmLocal = path.join(VIN_DIR, `vinheta-${slug}.webm`);

const posterUrl = await up(posterLocal, `${id}/poster.png`, "image/png");
const webmUrl = await up(webmLocal, `${id}/vinheta.webm`, "video/webm");

console.log("poster:", posterUrl);
console.log("video :", webmUrl);
