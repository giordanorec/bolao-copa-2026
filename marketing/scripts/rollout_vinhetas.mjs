/**
 * Sobe as vinhetas das oitavas (J73–J88) pro bucket público `ig-posts` no
 * Supabase e injeta/atualiza as entradas correspondentes em
 * v4/public/ig-posts-manifest.json — pra aparecerem em /admin/instagram-posts.
 *
 * Pra cada jogo sobe: poster.png + vinheta.webm + vinheta.mp4 e gera uma
 * legenda + roteiro a partir da Bola de Cristal real (placar + nº de IAs).
 *
 * Idempotente: re-rodar substitui as entradas com mesmo id.
 *
 * Uso (qualquer dir): node marketing/scripts/rollout_vinhetas.mjs [all|76 77 ...]
 *   default = all (73-88)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");
const ENV_PATH = path.join(REPO_ROOT, "v4", ".env.local");
const PUB = path.join(REPO_ROOT, "v4", "public");
const VIN_DIR = path.join(REPO_ROOT, "marketing", "vinhetas");
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

const jogos = JSON.parse(fs.readFileSync(path.join(PUB, "jogos.json"), "utf-8"));
const listaJogos = Array.isArray(jogos) ? jogos : jogos.jogos || [];
const porJogo = JSON.parse(
  fs.readFileSync(path.join(PUB, "palpites_por_jogo.json"), "utf-8"),
);
const iso = JSON.parse(fs.readFileSync(path.join(PUB, "paises_iso.json"), "utf-8"));
delete iso._README;

const args = process.argv.slice(2);
let nums;
if (args.length === 0 || args[0].toLowerCase() === "all")
  nums = Array.from({ length: 16 }, (_, i) => 73 + i);
else nums = args.map((a) => parseInt(a, 10)).filter((n) => !Number.isNaN(n));

const slugDe = (j) =>
  `J${j.numero}-${iso[j.time_a] || "a"}-${iso[j.time_b] || "b"}`;
const hashtag = (t) => "#" + t.normalize("NFD").replace(/[^a-zA-Z0-9]/g, "");
const pub = (key) =>
  `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${key}`;

async function up(localFile, key, contentType) {
  const bytes = fs.readFileSync(localFile);
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${key}`,
    {
      method: "POST",
      headers: { ...AUTH, "Content-Type": contentType, "x-upsert": "true" },
      body: bytes,
    },
  );
  if (!res.ok) {
    console.error(`FALHOU ${key} (HTTP ${res.status}) ${await res.text()}`);
    process.exit(1);
  }
  return pub(key);
}

function entradaManifest(j, slug, posterUrl, videoUrl) {
  const dados = porJogo[String(j.numero)] || {};
  const bola = dados.bola_de_cristal || null;
  const placar = bola ? `${bola.gols_a}×${bola.gols_b}` : "?";
  const votos = bola ? bola.votos : 0;
  const A = j.time_a;
  const B = j.time_b;
  const linhaVotos = bola
    ? `${votos} das 122 IAs cravaram exatamente esse placar.`
    : "As 122 IAs ainda estão fechando o placar.";
  const caption = [
    `**Bola de Cristal 🔮 — ${A} × ${B}**`,
    "",
    `As 122 IAs apontam **${placar}** pra essa oitava de final da Copa 2026. ${linhaVotos}`,
    "",
    "E você, concorda com as máquinas? 👉 bolao.arenadasias.com.br",
    "",
    `#BolaoDasIAs #Copa2026 #FifaWorldCup2026 ${hashtag(A)} ${hashtag(B)} #IA #ArenaDasIAs #BolaDeCristal #Reels`,
  ].join("\n");
  const roteiro = [
    `# Vinheta — ${A} × ${B} (Oitavas)`,
    "",
    "**Duração:** ~6s · 1080×1920 · vertical (Reels/Stories)",
    "",
    "| t | cena |",
    "|---|---|",
    "| 0.0s | 🔮 Bola de cristal + \"Bola de Cristal das IAs\" |",
    `| 1.0s | Bandeiras entram (${A} ← → ${B}) + \"×\" |`,
    `| 2.7s | Placar mais votado estampa no centro: ${placar} |`,
    `| 3.3s | \"${votos} de 122 IAs cravam esse placar\" |`,
    "| 4.2s | CTA: \"E você, concorda com as máquinas?\" + site + @arena.das.ias |",
    "",
    "**Áudio sugerido:** beat misterioso com build-up e \"hit\" no momento do placar.",
    `**Narração (opcional):** \"As 122 IAs já cravaram o placar de ${A} contra ${B}. Você concorda?\"`,
  ].join("\n");
  return {
    id: `vinheta-${slug}`,
    tipo: "reel",
    titulo: `${A} × ${B} — Oitavas`,
    caption,
    roteiro,
    images: [posterUrl],
    video: videoUrl,
    hasVideo: true,
  };
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf-8"));
const porId = new Map(manifest.map((e) => [e.id, e]));

for (const num of nums) {
  const j = listaJogos.find((x) => x.numero === num);
  if (!j) {
    console.warn(`Jogo ${num} não encontrado — pulando.`);
    continue;
  }
  const slug = slugDe(j);
  const id = `vinheta-${slug}`;
  const posterLocal = path.join(VIN_DIR, `vinheta-${slug}.poster.png`);
  const webmLocal = path.join(VIN_DIR, `vinheta-${slug}.webm`);
  const mp4Local = path.join(VIN_DIR, `vinheta-${slug}.mp4`);
  if (!fs.existsSync(posterLocal) || !fs.existsSync(mp4Local)) {
    console.warn(`Arquivos faltando pra ${slug} — pulando.`);
    continue;
  }
  const posterUrl = await up(posterLocal, `${id}/poster.png`, "image/png");
  const videoUrl = await up(mp4Local, `${id}/vinheta.mp4`, "video/mp4");
  if (fs.existsSync(webmLocal))
    await up(webmLocal, `${id}/vinheta.webm`, "video/webm");

  const entrada = entradaManifest(j, slug, posterUrl, videoUrl);
  porId.set(id, entrada);
  console.log(`OK ${slug}: poster + mp4 (+webm) + manifest`);
}

// reconstrói manifest preservando ordem original e adicionando novas no fim
const idsExistentes = new Set(manifest.map((e) => e.id));
const atualizado = manifest.map((e) => porId.get(e.id) || e);
for (const [id, e] of porId) if (!idsExistentes.has(id)) atualizado.push(e);

fs.writeFileSync(MANIFEST, JSON.stringify(atualizado, null, 2) + "\n", "utf-8");
console.log(`\nManifest atualizado: ${atualizado.length} posts.`);
