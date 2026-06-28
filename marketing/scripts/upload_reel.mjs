/**
 * Sobe um reel (poster.png + .mp4 + .webm) de uma pasta em
 * marketing/brainstorming_instagram/<id>/ pro bucket público `ig-posts` no
 * Supabase e injeta/atualiza a entrada correspondente em
 * v4/public/ig-posts-manifest.json — pra aparecer em /admin/instagram-posts.
 *
 * Lê a legenda de LEGENDA.md e o roteiro de ROTEIRO.md da própria pasta.
 * Idempotente: re-rodar substitui a entrada de mesmo id, preservando o resto
 * do manifest (inclusive os campos `video` das vinhetas).
 *
 * Uso (qualquer dir): node marketing/scripts/upload_reel.mjs <pasta>
 *   ex.: node marketing/scripts/upload_reel.mjs 32_reel_retrospectiva-grupos
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");
const ENV_PATH = path.join(REPO_ROOT, "v4", ".env.local");
const PUB = path.join(REPO_ROOT, "v4", "public");
const IG_DIR = path.join(REPO_ROOT, "marketing", "brainstorming_instagram");
const MANIFEST = path.join(PUB, "ig-posts-manifest.json");
const BUCKET = "ig-posts";

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
    )
      val = val.slice(1, -1);
    out[m[1]] = val;
  }
  return out;
}

const env = loadEnv(ENV_PATH);
const SUPABASE_URL =
  env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY =
  env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Faltam credenciais SUPABASE em v4/.env.local");
  process.exit(1);
}
const AUTH = { Authorization: `Bearer ${SERVICE_KEY}` };
const pub = (key) => `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${key}`;

const id = process.argv[2];
if (!id) {
  console.error("Informe a pasta. Ex.: node ... 32_reel_retrospectiva-grupos");
  process.exit(1);
}
const srcDir = path.join(IG_DIR, id);
if (!fs.existsSync(srcDir)) {
  console.error(`Pasta não encontrada: ${srcDir}`);
  process.exit(1);
}

function detectTipo(name) {
  const l = name.toLowerCase();
  if (l.includes("carrossel")) return "carrossel";
  if (l.includes("card")) return "card";
  return "reel";
}
function humanize(name) {
  return name
    .replace(/^\d+_/, "")
    .replace(/^(reel|carrossel|card)-?_?/, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
function readMd(p) {
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8").trim() : "";
}

async function up(localFile, key, contentType) {
  const bytes = fs.readFileSync(localFile);
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${key}`, {
    method: "POST",
    headers: { ...AUTH, "Content-Type": contentType, "x-upsert": "true" },
    body: bytes,
  });
  if (!res.ok) {
    console.error(`FALHOU ${key} (HTTP ${res.status}) ${await res.text()}`);
    process.exit(1);
  }
  return pub(key);
}

const files = fs.readdirSync(srcDir);
const posterLocal = path.join(srcDir, "poster.png");
const mp4Name = files.find((f) => /\.mp4$/i.test(f));
const webmName = files.find((f) => /\.webm$/i.test(f));
const slideNames = files.filter((f) => /^slide-.*\.(png|jpg|jpeg)$/i.test(f)).sort();

if (!fs.existsSync(posterLocal) && slideNames.length === 0) {
  console.error("Sem poster.png nem slides na pasta — nada a subir.");
  process.exit(1);
}

const images = [];
if (slideNames.length > 0) {
  for (const s of slideNames)
    images.push(await up(path.join(srcDir, s), `${id}/${s}`, "image/png"));
}
if (fs.existsSync(posterLocal)) {
  const posterUrl = await up(posterLocal, `${id}/poster.png`, "image/png");
  if (images.length === 0) images.push(posterUrl);
}

let video;
if (mp4Name) {
  video = await up(path.join(srcDir, mp4Name), `${id}/reel.mp4`, "video/mp4");
}
if (webmName) {
  await up(path.join(srcDir, webmName), `${id}/reel.webm`, "video/webm");
}

const entry = {
  id,
  tipo: detectTipo(id),
  titulo: humanize(id),
  caption: readMd(path.join(srcDir, "LEGENDA.md")),
  roteiro: readMd(path.join(srcDir, "ROTEIRO.md")),
  images,
  ...(video ? { video } : {}),
  hasVideo: Boolean(mp4Name || webmName),
};

const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf-8"));
const idx = manifest.findIndex((e) => e.id === id);
if (idx >= 0) manifest[idx] = entry;
else manifest.push(entry);

fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n", "utf-8");
console.log(`OK ${id}: ${images.length} img(s)${video ? " + mp4" : ""} + manifest (${manifest.length} posts)`);
