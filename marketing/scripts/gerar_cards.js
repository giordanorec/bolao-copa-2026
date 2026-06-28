/**
 * Gera 1 PNG 1080x1080 por partida com o palpite consenso (Bola de Cristal),
 * os palpites de IAs famosas (ChatGPT, Claude, Gemini, Grok) e o grau de
 * consenso entre elas.
 * Saída: ../cards/partida-<numero>.png
 *
 * Uso (na pasta v4):
 *   node ../marketing/scripts/gerar_cards.js
 */

const fs = require("fs");
const path = require("path");

const V4_ROOT = path.resolve(__dirname, "../../v4");
const { chromium } = require(path.join(V4_ROOT, "node_modules", "playwright"));
const V4 = path.join(V4_ROOT, "public");
const OUT = path.resolve(__dirname, "../cards");

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

// ── Logos das marcas (inline SVG; o card é renderizado via setContent, sem base URL) ──
const LOGOS_DIR = path.join(V4, "logos");
function inlineLogo(file) {
  try {
    return fs.readFileSync(path.join(LOGOS_DIR, file), "utf-8");
  } catch {
    return "";
  }
}
const LOGO = {
  chatgpt: inlineLogo("openai.svg"),
  claude: inlineLogo("anthropic.svg"),
  gemini: inlineLogo("google.svg"),
  grok: inlineLogo("xai.svg"),
};

// IAs famosas a destacar. Para cada uma, tentamos o slug "carro-chefe"; se o
// jogo não tiver, caímos pro próximo da lista.
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

function htmlCard(jogo, dados) {
  const isoA = mapaPaises[jogo.time_a] || "xx";
  const isoB = mapaPaises[jogo.time_b] || "xx";

  const bola = dados?.bola_de_cristal ?? null;
  const totalVotos = dados ? Object.keys(dados.palpites || {}).length : 0;
  // Mata-mata: o placar consenso (bola) é público (igual ao site e às vinhetas),
  // mas os palpites INDIVIDUAIS de cada IA ficam travados até a bola rolar — daí
  // o `palpites` vir vazio. Nesse caso trocamos os chips por um teaser.
  const gated = !!bola && totalVotos === 0;
  const pct =
    bola && totalVotos ? Math.round((bola.votos / totalVotos) * 100) : 0;
  const numDistintos = dados?.consenso ? dados.consenso.length : 0;
  const placar = bola ? `${bola.gols_a} × ${bola.gols_b}` : "—";
  const forca = forcaConsenso(pct);

  // Chips das IAs famosas (fase de grupos — dados públicos) OU teaser travado.
  const chipsOuTeaser = gated
    ? `<div class="teaser-travado">
         <span class="tt-lock">🔒</span>
         <div class="tt-text">
           <strong>Quem cravou o quê?</strong> Os palpites de ChatGPT, Claude,
           Gemini, Grok e das outras IAs são revelados quando a bola rolar.
           Entra no bolão e crava o seu <strong>antes</strong> delas!
         </div>
       </div>`
    : `<div class="ias-grid">${FAMOSAS.map((f) => {
        const p = palpiteFamosa(dados, f.slugs);
        if (!p) {
          return `<div class="ia-chip vazio">
            <span class="ia-logo">${f.logo}</span>
            <span class="ia-nome">${f.nome}</span>
            <span class="ia-palpite">—</span>
          </div>`;
        }
        const concorda =
          bola && p.gols_a === bola.gols_a && p.gols_b === bola.gols_b;
        return `<div class="ia-chip ${concorda ? "agree" : "diff"}">
          <span class="ia-logo">${f.logo}</span>
          <span class="ia-nome">${f.nome}</span>
          <span class="ia-palpite">${p.gols_a}×${p.gols_b}</span>
        </div>`;
      }).join("")}</div>`;

  const consensoLinha = !bola
    ? "Coletando palpites das IAs…"
    : gated
      ? `<strong>${bola.votos} de 122 IAs</strong> cravaram <strong>${placar}</strong> — o placar mais provável segundo o consenso`
      : `<span class="forca ${forca.cls}">${forca.label}</span> · <strong>${pct}%</strong> das ${totalVotos} IAs cravaram <strong>${placar}</strong>${numDistintos > 1 ? ` · ${numDistintos} placares diferentes` : ""}`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1080px; height: 1080px;
    font-family: -apple-system, 'Segoe UI', system-ui, 'Inter', sans-serif;
    color: #1A1A1A;
    background: #FFFFFF;
    overflow: hidden; position: relative;
  }
  body::before {
    content: ""; position: absolute; inset: 0; pointer-events: none;
    background:
      radial-gradient(circle at 0% 0%, rgba(0,156,59,0.06), transparent 40%),
      radial-gradient(circle at 100% 100%, rgba(255,206,0,0.08), transparent 40%);
  }
  body::after {
    content: ""; position: absolute; top: 0; left: 0; right: 0;
    height: 6px;
    background: linear-gradient(90deg, #009C3B 0%, #FFCE00 50%, #002776 100%);
  }
  .wrap {
    position: relative; z-index: 2;
    padding: 52px 68px 44px;
    height: 100%;
    display: flex; flex-direction: column;
  }

  /* HEADER */
  .topo {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 22px;
  }
  .brand { display: flex; align-items: center; gap: 14px; }
  .brand .ball { font-size: 52px; line-height: 1; transform: rotate(-8deg); }
  .brand-text { line-height: 1.1; }
  .brand-title { font-size: 30px; font-weight: 900; letter-spacing: -0.02em; color: #002776; }
  .brand-sub { font-size: 14px; font-weight: 700; color: #009C3B; letter-spacing: 0.12em; text-transform: uppercase; }
  .fase {
    background: #002776; color: #fff;
    padding: 10px 22px; border-radius: 999px;
    font-size: 16px; font-weight: 800;
    letter-spacing: 0.06em; text-transform: uppercase;
  }

  .data { text-align: center; font-size: 19px; font-weight: 600; color: #5A5A5A; margin-bottom: 10px; }

  /* PLACAR */
  .placar-wrap {
    display: flex; align-items: center; justify-content: space-between;
    gap: 20px;
    padding: 28px 12px 24px;
    border-top: 1px solid #EEE;
    border-bottom: 1px solid #EEE;
    margin-bottom: 22px;
  }
  .time { flex: 1; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 14px; }
  .bandeira {
    width: 164px; height: 164px; border-radius: 50%;
    box-shadow: 0 6px 24px rgba(0,0,0,0.18);
    object-fit: cover; border: 4px solid #FFF;
  }
  .nome { font-size: 32px; font-weight: 900; line-height: 1.1; max-width: 260px; color: #1A1A1A; }
  .placar { font-size: 120px; font-weight: 900; line-height: 1; letter-spacing: -0.04em; color: #002776; min-width: 220px; text-align: center; }
  .placar.sem { font-size: 72px; opacity: 0.3; color: #888; }

  .local { text-align: center; font-size: 15px; color: #888; margin-bottom: 16px; font-weight: 500; }

  /* CONSENSO + IAS FAMOSAS */
  .opiniao {
    background: linear-gradient(135deg, #FFF8E1 0%, #FFFFFF 100%);
    border: 2px solid #FFCE00;
    border-radius: 24px;
    padding: 22px 26px;
    margin-bottom: 18px;
  }
  .op-head {
    display: flex; align-items: center; gap: 12px; margin-bottom: 18px;
  }
  .op-emoji { font-size: 40px; line-height: 1; }
  .op-text { font-size: 17px; color: #444; line-height: 1.35; }
  .op-text strong { color: #002776; }
  .forca { font-weight: 900; padding: 2px 12px; border-radius: 999px; font-size: 15px; }
  .forca.forte { background: #009C3B; color: #fff; }
  .forca.moderado { background: #FFCE00; color: #4A3B00; }
  .forca.dividido { background: #FF4D8D; color: #fff; }

  .ias-grid {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
  }
  .ia-chip {
    display: flex; flex-direction: column; align-items: center; gap: 8px;
    background: #fff; border: 2px solid #ECECEC; border-radius: 18px;
    padding: 16px 8px 14px;
  }
  .ia-chip.agree { border-color: #009C3B; background: #F2FBF5; }
  .ia-chip.diff { border-color: #E0E0E0; }
  .ia-chip.vazio { opacity: 0.45; }
  .ia-logo { width: 46px; height: 46px; display: inline-flex; align-items: center; justify-content: center; }
  .ia-logo svg { width: 100%; height: 100%; }
  .ia-nome { font-size: 16px; font-weight: 800; color: #333; }
  .ia-palpite { font-size: 30px; font-weight: 900; color: #002776; letter-spacing: -0.02em; }
  .ia-chip.agree .ia-palpite { color: #009C3B; }

  /* TEASER TRAVADO (mata-mata: palpites individuais ocultos) */
  .teaser-travado {
    display: flex; align-items: center; gap: 18px;
    background: #FFF; border: 2px dashed #FFCE00; border-radius: 18px;
    padding: 18px 22px;
  }
  .tt-lock { font-size: 44px; line-height: 1; flex-shrink: 0; }
  .tt-text { font-size: 18px; color: #444; line-height: 1.4; }
  .tt-text strong { color: #002776; }

  /* RODAPÉ */
  .rodape { margin-top: auto; text-align: center; border-top: 2px dashed #DDD; padding-top: 18px; }
  .rodape-titulo { font-size: 21px; font-weight: 800; color: #002776; margin-bottom: 4px; }
  .rodape-sub { font-size: 15px; color: #444; margin-bottom: 12px; line-height: 1.4; }
  .rodape-links { display: flex; gap: 16px; justify-content: center; align-items: center; flex-wrap: wrap; }
  .pill { display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 999px; font-size: 18px; font-weight: 800; }
  .pill-site { background: #009C3B; color: #fff; }
  .pill-insta { background: linear-gradient(135deg, #F58529, #DD2A7B, #8134AF); color: #fff; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="topo">
      <div class="brand">
        <span class="ball">⚽</span>
        <div class="brand-text">
          <div class="brand-title">Bolão das IAs</div>
          <div class="brand-sub">🇧🇷 Copa do Mundo 2026</div>
        </div>
      </div>
      <div class="fase">${jogo.fase}</div>
    </div>

    <div class="data">🗓 ${jogo.data} · ${jogo.hora}</div>

    <div class="placar-wrap">
      <div class="time">
        <img class="bandeira" src="https://hatscripts.github.io/circle-flags/flags/${isoA}.svg" />
        <div class="nome">${jogo.time_a}</div>
      </div>
      <div class="placar ${bola ? "" : "sem"}">${placar}</div>
      <div class="time">
        <img class="bandeira" src="https://hatscripts.github.io/circle-flags/flags/${isoB}.svg" />
        <div class="nome">${jogo.time_b}</div>
      </div>
    </div>

    ${jogo.local ? `<div class="local">📍 ${jogo.local}</div>` : ""}

    <div class="opiniao">
      <div class="op-head">
        <span class="op-emoji">🔮</span>
        <div class="op-text">${consensoLinha}</div>
      </div>
      ${chipsOuTeaser}
    </div>

    <div class="rodape">
      <div class="rodape-titulo">Feito consultando 122 modelos de IA 🤖</div>
      <div class="rodape-sub">
        ChatGPT, Claude, Gemini, Grok, DeepSeek e mais 117 modelos<br>
        palpitando os 104 jogos da Copa
      </div>
      <div class="rodape-links">
        <div class="pill pill-site">🌐 ${SITE}</div>
        <div class="pill pill-insta">📸 ${INSTA}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function main() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1080, height: 1080 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();

  // filtro opcional por número de jogo via argv (ex.: node gerar_cards.js 1)
  const soUm = process.argv[2] ? Number(process.argv[2]) : null;

  let ok = 0;
  let fail = 0;
  for (const j of jogos) {
    if (soUm && j.numero !== soUm) continue;
    const dados = palpitesIAs[String(j.numero)];
    const html = htmlCard(j, dados);
    try {
      await page.setContent(html, { waitUntil: "networkidle" });
      await page.waitForTimeout(150);
      const arquivo = path.join(OUT, `partida-${String(j.numero).padStart(3, "0")}.png`);
      await page.screenshot({ path: arquivo, fullPage: false });
      ok++;
      if (j.numero <= 5 || j.numero % 20 === 0) {
        console.log(`  ✓ ${j.numero}: ${j.time_a} × ${j.time_b}`);
      }
    } catch (e) {
      console.error(`  ✗ ${j.numero}: ${e.message}`);
      fail++;
    }
  }
  await browser.close();
  console.log(`\n${ok} card(s) gerado(s) (${fail} falhas) em ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
