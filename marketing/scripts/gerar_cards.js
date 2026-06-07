/**
 * Gera 1 PNG 1080x1080 por partida com o palpite consenso (Bola de Cristal).
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

function htmlCard(jogo, bola, totalVotos, confiancaPct) {
  const isoA = mapaPaises[jogo.time_a] || "xx";
  const isoB = mapaPaises[jogo.time_b] || "xx";
  const placar = bola ? `${bola.gols_a} × ${bola.gols_b}` : "—";
  const subTitle = bola
    ? `<strong>${bola.votos}</strong> das <strong>${totalVotos}</strong> IAs concordam · <strong>${confiancaPct}%</strong> de confiança`
    : "Coletando palpites das IAs…";

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
  /* leve gradient decorativo nas bordas, sem escurecer */
  body::before {
    content: ""; position: absolute; inset: 0; pointer-events: none;
    background:
      radial-gradient(circle at 0% 0%, rgba(0,156,59,0.06), transparent 40%),
      radial-gradient(circle at 100% 100%, rgba(255,206,0,0.08), transparent 40%);
  }
  /* faixa amarela no topo */
  body::after {
    content: ""; position: absolute; top: 0; left: 0; right: 0;
    height: 6px;
    background: linear-gradient(90deg, #009C3B 0%, #FFCE00 50%, #002776 100%);
  }
  .wrap {
    position: relative; z-index: 2;
    padding: 56px 72px 48px;
    height: 100%;
    display: flex; flex-direction: column;
  }

  /* HEADER */
  .topo {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 32px;
  }
  .brand {
    display: flex; align-items: center; gap: 14px;
  }
  .brand .ball {
    font-size: 56px; line-height: 1;
    transform: rotate(-8deg);
  }
  .brand-text { line-height: 1.1; }
  .brand-title {
    font-size: 30px; font-weight: 900;
    letter-spacing: -0.02em; color: #002776;
  }
  .brand-sub {
    font-size: 14px; font-weight: 700;
    color: #009C3B; letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .fase {
    background: #002776; color: #fff;
    padding: 10px 22px; border-radius: 999px;
    font-size: 16px; font-weight: 800;
    letter-spacing: 0.06em; text-transform: uppercase;
  }

  /* DATA */
  .data {
    text-align: center;
    font-size: 20px; font-weight: 600;
    color: #5A5A5A; margin-bottom: 16px;
  }

  /* PLACAR */
  .placar-wrap {
    display: flex; align-items: center; justify-content: space-between;
    gap: 24px;
    padding: 40px 16px 32px;
    border-top: 1px solid #EEE;
    border-bottom: 1px solid #EEE;
    margin-bottom: 32px;
  }
  .time {
    flex: 1; text-align: center;
    display: flex; flex-direction: column; align-items: center; gap: 18px;
  }
  .bandeira {
    width: 200px; height: 200px;
    border-radius: 50%;
    box-shadow: 0 6px 24px rgba(0,0,0,0.18);
    object-fit: cover;
    border: 4px solid #FFF;
  }
  .nome {
    font-size: 36px; font-weight: 900;
    line-height: 1.1; max-width: 280px;
    color: #1A1A1A;
  }
  .placar {
    font-size: 144px; font-weight: 900;
    line-height: 1; letter-spacing: -0.04em;
    color: #002776;
    min-width: 240px; text-align: center;
  }
  .placar.sem { font-size: 80px; opacity: 0.3; color: #888; }

  /* LOCAL */
  .local {
    text-align: center; font-size: 16px;
    color: #888; margin-bottom: 24px; font-weight: 500;
  }

  /* CRISTAL CARD */
  .cristal {
    background: linear-gradient(135deg, #FFF8E1 0%, #FFF 100%);
    border: 2px solid #FFCE00;
    border-radius: 24px;
    padding: 24px 28px;
    display: flex; align-items: center; gap: 18px;
    margin-bottom: 20px;
  }
  .cristal-emoji { font-size: 56px; line-height: 1; }
  .cristal-text { flex: 1; }
  .cristal-titulo {
    font-size: 20px; font-weight: 900;
    color: #002776; margin-bottom: 6px;
    letter-spacing: -0.01em;
  }
  .cristal-sub {
    font-size: 16px; color: #444; line-height: 1.4;
  }
  .cristal-sub strong { color: #009C3B; }

  /* CTA RODAPÉ */
  .rodape {
    margin-top: auto;
    text-align: center;
    border-top: 2px dashed #DDD;
    padding-top: 24px;
  }
  .rodape-titulo {
    font-size: 22px; font-weight: 800;
    color: #002776; margin-bottom: 6px;
  }
  .rodape-sub {
    font-size: 16px; color: #444; margin-bottom: 14px;
    line-height: 1.4;
  }
  .rodape-links {
    display: flex; gap: 16px; justify-content: center;
    align-items: center; flex-wrap: wrap;
  }
  .pill {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 18px;
    border-radius: 999px;
    font-size: 18px; font-weight: 800;
  }
  .pill-site {
    background: #009C3B; color: #fff;
  }
  .pill-insta {
    background: linear-gradient(135deg, #F58529, #DD2A7B, #8134AF);
    color: #fff;
  }
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

    <div class="cristal">
      <div class="cristal-emoji">🔮</div>
      <div class="cristal-text">
        <div class="cristal-titulo">Palpite da Bola de Cristal</div>
        <div class="cristal-sub">${subTitle}</div>
      </div>
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

  let ok = 0;
  let fail = 0;
  for (const j of jogos) {
    const dados = palpitesIAs[String(j.numero)];
    const bola = dados?.bola_de_cristal ?? null;
    const totalVotos = dados ? Object.keys(dados.palpites).length : 0;
    const pct = bola && totalVotos
      ? Math.round((bola.votos / totalVotos) * 100)
      : 0;
    const html = htmlCard(j, bola, totalVotos, pct);
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
  console.log(`\n${ok}/${jogos.length} cards gerados (${fail} falhas) em ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
