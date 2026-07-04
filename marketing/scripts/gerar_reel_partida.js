/**
 * Reel animado (1080×1920, ~8s) POR PARTIDA com consenso + IAs famosas.
 * Fork do gerar_cards.js (1080×1080) mas em formato vertical Instagram Reel.
 *
 * Uso (na pasta v4):
 *   node ../marketing/scripts/gerar_reel_partida.js 89
 *   node ../marketing/scripts/gerar_reel_partida.js 89-96   # range
 *
 * Saída: marketing/reels_partida/partida-<NNN>.mp4 + poster.png
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { renderReel } = require("./lib_reel_capture");

const V4_ROOT = path.resolve(__dirname, "../../v4");
const V4 = path.join(V4_ROOT, "public");
const OUT = path.resolve(__dirname, "../reels_partida");

const jogos = JSON.parse(fs.readFileSync(path.join(V4, "jogos.json"), "utf-8"));
const palpitesIAs = JSON.parse(
  fs.readFileSync(path.join(V4, "palpites_por_jogo.json"), "utf-8"),
);
const mapaPaises = JSON.parse(
  fs.readFileSync(path.join(V4, "paises_iso.json"), "utf-8"),
);
delete mapaPaises._README;

const SITE = "bolao.arenadasias.com.br";
const INSTA = "@arena.das.ias";

const LOGOS_DIR = path.join(V4, "logos");
function inlineLogo(file) {
  try { return fs.readFileSync(path.join(LOGOS_DIR, file), "utf-8"); }
  catch { return ""; }
}
const LOGO = {
  chatgpt: inlineLogo("openai.svg"),
  claude: inlineLogo("anthropic.svg"),
  gemini: inlineLogo("google.svg"),
  grok: inlineLogo("xai.svg"),
};
const FAMOSAS = [
  { nome: "ChatGPT", logo: LOGO.chatgpt, slugs: ["chatgpt-5-thinking", "chatgpt-5", "gpt-4o", "o3"] },
  { nome: "Claude", logo: LOGO.claude, slugs: ["claude-opus-4-7", "claude-sonnet-4-6", "claude-opus-4-5"] },
  { nome: "Gemini", logo: LOGO.gemini, slugs: ["gemini-2-5-pro", "gemini-2-5-flash"] },
  { nome: "Grok", logo: LOGO.grok, slugs: ["grok-4-heavy", "grok-4", "grok-4-fast"] },
];

function palpiteFamosa(dados, slugs) {
  if (!dados || !dados.palpites) return null;
  for (const s of slugs) {
    const p = dados.palpites[s];
    if (p) return p;
  }
  return null;
}

function forcaConsenso(pct) {
  if (pct >= 70) return { label: "Consenso forte", cls: "forte" };
  if (pct >= 50) return { label: "Consenso moderado", cls: "moderado" };
  return { label: "IAs divididas", cls: "dividido" };
}

// ---------------------------------------------------------------------------
// Timeline: 4 cenas em 8 segundos.
//   0.0–2.0s: capa (fase + confronto grande)
//   2.0–4.5s: placar consenso enorme, "X% cravaram"
//   4.5–7.0s: 4 IAs famosas (chips)
//   7.0–8.0s: CTA rodapé
// ---------------------------------------------------------------------------
const TOTAL_MS = 8000;
const POSTER_MS = 3500;
const FPS = 30;

const S = {
  capa: 0,
  placar: 2000,
  ias: 4500,
  cta: 7000,
};
const VIS = { capa: 2200, placar: 2700, ias: 2700, cta: 1200 };

function cs(ms) { return (ms / 1000).toFixed(2) + "s"; }

function sceneCSS(name, offsetMs, visibleMs) {
  return `
.${name} {
  position:absolute; top:0; left:0; right:0; bottom:0;
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  padding: 80px 60px;
  opacity:0;
  animation:
    sceneIn  .55s cubic-bezier(.2,.9,.25,1) ${cs(offsetMs)} forwards,
    sceneOut .40s ease-in ${cs(offsetMs + visibleMs)} forwards;
}`;
}

function buildHtml(jogo, dados) {
  const isoA = mapaPaises[jogo.time_a] || "xx";
  const isoB = mapaPaises[jogo.time_b] || "xx";

  const bola = dados?.bola_de_cristal ?? null;
  const totalVotos = dados ? Object.keys(dados.palpites || {}).length : 0;
  const pct = bola && totalVotos ? Math.round((bola.votos / totalVotos) * 100) : 0;
  const numDistintos = dados?.consenso ? dados.consenso.length : 0;
  const placar = bola ? `${bola.gols_a} × ${bola.gols_b}` : "—";
  const forca = forcaConsenso(pct);

  const gated = !!bola && totalVotos === 0;

  // Chips das famosas
  const chipsHtml = gated
    ? `<div class="teaser">
         <div class="teaser-lock">🔒</div>
         <div class="teaser-txt">Palpites individuais revelados quando a bola rolar</div>
       </div>`
    : FAMOSAS.map((f) => {
        const p = palpiteFamosa(dados, f.slugs);
        if (!p) {
          return `<div class="ia-chip vazio">
            <span class="ia-logo">${f.logo}</span>
            <span class="ia-nome">${f.nome}</span>
            <span class="ia-palpite">—</span>
          </div>`;
        }
        const concorda = bola && p.gols_a === bola.gols_a && p.gols_b === bola.gols_b;
        return `<div class="ia-chip ${concorda ? "agree" : "diff"}">
          <span class="ia-logo">${f.logo}</span>
          <span class="ia-nome">${f.nome}</span>
          <span class="ia-palpite">${p.gols_a}×${p.gols_b}</span>
        </div>`;
      }).join("");

  const consensoLinha = !bola
    ? "Coletando palpites das IAs…"
    : gated
      ? `<strong>${bola.votos} de 122 IAs</strong> cravaram <strong>${placar}</strong>`
      : `<strong>${pct}%</strong> das <strong>${totalVotos} IAs</strong> cravaram este placar`;

  return `<!doctype html><html lang="pt-BR"><head>
<meta charset="utf-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&family=Archivo+Black&display=swap');
* { margin:0; padding:0; box-sizing:border-box; }
html,body { width:1080px; height:1920px; overflow:hidden; }
body {
  font-family: 'Sora','Segoe UI',Arial,sans-serif;
  color: #1A1A1A;
  background: #FFFFFF;
  position: relative;
}
body::before {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background:
    radial-gradient(circle at 0% 0%, rgba(0,156,59,0.10), transparent 40%),
    radial-gradient(circle at 100% 100%, rgba(255,206,0,0.14), transparent 40%);
}
body::after {
  content: ""; position: absolute; top: 0; left: 0; right: 0;
  height: 10px;
  background: linear-gradient(90deg, #009C3B 0%, #FFCE00 50%, #002776 100%);
}

/* HEADER fixo topo (todas as cenas) */
.brand {
  position: absolute; top: 44px; left: 60px; right: 60px;
  display: flex; justify-content: space-between; align-items: center; z-index: 10;
}
.brand-lft { display: flex; align-items: center; gap: 18px; }
.brand-ball { font-size: 60px; transform: rotate(-8deg); }
.brand-name { font-size: 36px; font-weight: 900; color: #002776; letter-spacing: -.02em; }
.brand-sub { font-size: 16px; color: #009C3B; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
.fase-pill {
  background: #002776; color: #fff;
  padding: 12px 26px; border-radius: 999px;
  font-size: 20px; font-weight: 900; letter-spacing: .06em; text-transform: uppercase;
}

/* RODAPÉ fixo (todas as cenas) */
.footer {
  position: absolute; bottom: 40px; left: 0; right: 0;
  display: flex; justify-content: center; gap: 24px; z-index: 10;
  padding: 0 60px;
}
.footer-pill {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 14px 26px; border-radius: 999px;
  font-size: 22px; font-weight: 800;
}
.footer-site { background: #009C3B; color: #fff; }
.footer-insta { background: linear-gradient(135deg, #F58529, #DD2A7B, #8134AF); color: #fff; }

${sceneCSS("capa", S.capa, VIS.capa)}
${sceneCSS("placar", S.placar, VIS.placar)}
${sceneCSS("ias", S.ias, VIS.ias)}
${sceneCSS("cta", S.cta, VIS.cta)}

@keyframes sceneIn  { from { opacity:0; transform: translateY(30px); } to { opacity:1; transform: translateY(0); } }
@keyframes sceneOut { from { opacity:1; transform: translateY(0); } to   { opacity:0; transform: translateY(-30px); } }

/* CENA 1: capa (bandeiras + confronto) */
.capa .data {
  font-size: 30px; font-weight: 700; color: #5A5A5A; margin-bottom: 12px;
}
.capa .local {
  font-size: 24px; color: #888; margin-bottom: 60px;
}
.capa .confronto {
  display: flex; flex-direction: column; align-items: center; gap: 40px; width: 100%;
}
.capa .time-row { display: flex; flex-direction: column; align-items: center; gap: 24px; }
.capa .bandeira {
  width: 260px; height: 260px; border-radius: 50%;
  box-shadow: 0 8px 32px rgba(0,0,0,.22);
  border: 6px solid #fff;
}
.capa .time-nome { font-size: 60px; font-weight: 900; color: #1A1A1A; letter-spacing: -.02em; }
.capa .vs {
  font-family: 'Archivo Black'; font-size: 96px; color: #FFCE00;
  text-shadow: 4px 4px 0 #002776;
  letter-spacing: .08em;
}

/* CENA 2: placar consenso */
.placar .titulo {
  font-size: 34px; font-weight: 800; color: #002776; margin-bottom: 20px;
  text-transform: uppercase; letter-spacing: .1em;
}
.placar .num {
  font-family: 'Archivo Black';
  font-size: 340px; line-height: 1; letter-spacing: -.04em;
  color: #002776;
  margin: 20px 0 40px;
  text-shadow: 8px 8px 0 rgba(255,206,0,0.4);
}
.placar .consenso-line {
  font-size: 32px; color: #444; text-align: center;
  line-height: 1.4; max-width: 900px;
}
.placar .consenso-line strong { color: #002776; }
.placar .forca-badge {
  display: inline-block; margin-top: 30px;
  padding: 14px 40px; border-radius: 999px;
  font-size: 30px; font-weight: 900;
}
.forca-badge.forte { background: #009C3B; color: #fff; }
.forca-badge.moderado { background: #FFCE00; color: #4A3B00; }
.forca-badge.dividido { background: #FF4D8D; color: #fff; }

/* CENA 3: IAs famosas */
.ias .titulo {
  font-size: 40px; font-weight: 800; color: #002776; margin-bottom: 40px;
  text-align: center; line-height: 1.2;
}
.ias .grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px;
  width: 100%; max-width: 900px;
}
.ia-chip {
  display: flex; flex-direction: column; align-items: center; gap: 18px;
  background: #fff; border: 3px solid #ECECEC; border-radius: 32px;
  padding: 40px 20px;
}
.ia-chip.agree { border-color: #009C3B; background: #F2FBF5; }
.ia-chip.diff { border-color: #E0E0E0; }
.ia-chip.vazio { opacity: .5; }
.ia-logo { width: 90px; height: 90px; display: inline-flex; align-items: center; justify-content: center; }
.ia-logo svg { width: 100%; height: 100%; }
.ia-nome { font-size: 30px; font-weight: 800; color: #333; }
.ia-palpite { font-size: 60px; font-weight: 900; color: #002776; letter-spacing: -.02em; }
.ia-chip.agree .ia-palpite { color: #009C3B; }

.teaser {
  display: flex; flex-direction: column; align-items: center; gap: 20px;
  padding: 60px 40px;
}
.teaser-lock { font-size: 120px; }
.teaser-txt { font-size: 36px; text-align: center; color: #444; max-width: 800px; line-height: 1.3; }

/* CENA 4: CTA */
.cta .headline {
  font-family: 'Archivo Black';
  font-size: 90px; line-height: 1.1;
  text-align: center; color: #002776;
  margin-bottom: 30px;
  max-width: 900px;
}
.cta .headline em { color: #009C3B; font-style: normal; }
.cta .subhead { font-size: 32px; color: #555; text-align: center; max-width: 900px; line-height: 1.4; margin-bottom: 50px; }
.cta .cta-pill {
  background: #FFCE00; color: #002776;
  padding: 26px 60px; border-radius: 999px;
  font-size: 40px; font-weight: 900;
  box-shadow: 0 12px 32px rgba(255,206,0,.55);
}
</style>
</head>
<body>
  <div class="brand">
    <div class="brand-lft">
      <span class="brand-ball">⚽</span>
      <div>
        <div class="brand-name">Bolão das IAs</div>
        <div class="brand-sub">🇧🇷 COPA DO MUNDO 2026</div>
      </div>
    </div>
    <div class="fase-pill">${jogo.fase}</div>
  </div>

  <div class="footer">
    <div class="footer-pill footer-site">🌐 ${SITE}</div>
    <div class="footer-pill footer-insta">📸 ${INSTA}</div>
  </div>

  <!-- Cena 1: capa -->
  <div class="capa">
    <div class="data">🗓 ${jogo.data} · ${jogo.hora}</div>
    <div class="local">${jogo.local ? "📍 " + jogo.local : ""}</div>
    <div class="confronto">
      <div class="time-row">
        <img class="bandeira" src="https://hatscripts.github.io/circle-flags/flags/${isoA}.svg" />
        <div class="time-nome">${jogo.time_a}</div>
      </div>
      <div class="vs">VS</div>
      <div class="time-row">
        <img class="bandeira" src="https://hatscripts.github.io/circle-flags/flags/${isoB}.svg" />
        <div class="time-nome">${jogo.time_b}</div>
      </div>
    </div>
  </div>

  <!-- Cena 2: placar consenso -->
  <div class="placar">
    <div class="titulo">🔮 Palpite Consenso</div>
    <div class="num">${placar}</div>
    <div class="consenso-line">${consensoLinha}${numDistintos > 1 ? ` <br>(${numDistintos} placares diferentes)` : ""}</div>
    ${bola && !gated ? `<span class="forca-badge ${forca.cls}">${forca.label}</span>` : ""}
  </div>

  <!-- Cena 3: IAs famosas -->
  <div class="ias">
    <div class="titulo">Quem palpitou o quê?</div>
    ${gated ? chipsHtml : `<div class="grid">${chipsHtml}</div>`}
  </div>

  <!-- Cena 4: CTA -->
  <div class="cta">
    <div class="headline">Palpita <em>antes</em> das IAs</div>
    <div class="subhead">Entra no bolão gratuito<br>e disputa contra 122 IAs.</div>
    <div class="cta-pill">bolao.arenadasias.com.br</div>
  </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  // Range parse: "89" ou "89-96"
  const arg = process.argv[2] || "89-96";
  let alvos = [];
  if (arg.includes("-")) {
    const [a, b] = arg.split("-").map(Number);
    for (let n = a; n <= b; n++) alvos.push(n);
  } else {
    alvos.push(Number(arg));
  }

  for (const numero of alvos) {
    const jogo = jogos.find((j) => j.numero === numero);
    if (!jogo) { console.warn(`  ! jogo ${numero} não encontrado — pulando`); continue; }
    const dados = palpitesIAs[String(numero)];
    console.log(`\n=== Reel J${numero}: ${jogo.time_a} × ${jogo.time_b} ===`);
    const html = buildHtml(jogo, dados);
    await renderReel({
      html,
      outDir: path.join(OUT, `partida-${String(numero).padStart(3, "0")}`),
      baseName: `partida-${String(numero).padStart(3, "0")}`,
      totalMs: TOTAL_MS,
      posterMs: POSTER_MS,
      fps: FPS,
    });
  }
  console.log(`\n${alvos.length} reel(s) gerado(s) em ${OUT}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
