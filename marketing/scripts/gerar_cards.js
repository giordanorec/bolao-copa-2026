/**
 * Gera 1 PNG 1080x1080 por partida com o palpite consenso (Bola de Cristal).
 * Saída: ../cards/partida-<numero>.png
 *
 * Uso:
 *   cd v4 && node ../marketing/scripts/gerar_cards.js
 *
 * Requer playwright (já está em devDeps do v4).
 */

const fs = require("fs");
const path = require("path");

// Resolve playwright a partir de v4/node_modules
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

function htmlCard(jogo, bola, totalVotos, confiancaPct) {
  const isoA = mapaPaises[jogo.time_a] || "xx";
  const isoB = mapaPaises[jogo.time_b] || "xx";
  const placar = bola
    ? `${bola.gols_a} × ${bola.gols_b}`
    : "—";
  const confiancaStr = bola ? `${bola.votos}/${totalVotos} IAs (${confiancaPct}%)` : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1080px; height: 1080px;
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    color: #fff;
    background: linear-gradient(135deg, #009C3B 0%, #002776 60%, #FFCE00 200%);
    overflow: hidden;
    position: relative;
  }
  body::before {
    content: ""; position: absolute; inset: 0;
    background:
      radial-gradient(circle at 20% 30%, rgba(255,255,255,0.15), transparent 50%),
      radial-gradient(circle at 80% 70%, rgba(255,206,0,0.18), transparent 50%);
  }
  .wrap { position: relative; z-index: 2; padding: 80px 64px; height: 100%;
    display: flex; flex-direction: column; }
  .topo {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 48px;
  }
  .brand {
    display: flex; align-items: center; gap: 16px;
    font-size: 28px; font-weight: 800; letter-spacing: -0.02em;
  }
  .brand .ball { font-size: 44px; }
  .fase {
    background: rgba(255,255,255,0.18);
    padding: 8px 18px; border-radius: 999px;
    font-size: 18px; font-weight: 700; letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .data {
    text-align: center; font-size: 22px; font-weight: 600;
    opacity: 0.9; margin-bottom: 24px;
  }
  .placar-wrap {
    flex: 1; display: flex; align-items: center; justify-content: space-between;
    gap: 32px; padding: 40px 0;
  }
  .time {
    flex: 1; text-align: center;
    display: flex; flex-direction: column; align-items: center; gap: 24px;
  }
  .bandeira {
    width: 200px; height: 200px;
    border-radius: 50%;
    box-shadow: 0 8px 32px rgba(0,0,0,0.35);
    object-fit: cover;
  }
  .nome {
    font-size: 42px; font-weight: 900;
    line-height: 1.1; max-width: 320px;
    text-shadow: 0 2px 12px rgba(0,0,0,0.4);
  }
  .placar {
    font-size: 144px; font-weight: 900;
    line-height: 1; letter-spacing: -0.03em;
    text-shadow: 0 4px 24px rgba(0,0,0,0.45);
    min-width: 220px; text-align: center;
  }
  .placar.sem { font-size: 96px; opacity: 0.5; }
  .local {
    text-align: center; font-size: 20px; opacity: 0.85;
    margin-top: 24px; font-weight: 500;
  }
  .cristal {
    margin-top: auto; padding: 24px 32px;
    background: rgba(0,0,0,0.35);
    border-radius: 20px;
    display: flex; align-items: center; gap: 20px;
    backdrop-filter: blur(8px);
  }
  .cristal-emoji { font-size: 56px; }
  .cristal-text { flex: 1; }
  .cristal-titulo {
    font-size: 22px; font-weight: 800;
    letter-spacing: -0.01em; margin-bottom: 4px;
  }
  .cristal-sub {
    font-size: 16px; opacity: 0.9; font-weight: 500;
  }
  .cristal-confianca-bar {
    margin-top: 12px;
    height: 8px; background: rgba(255,255,255,0.2);
    border-radius: 4px; overflow: hidden;
  }
  .cristal-confianca-fill {
    height: 100%; background: linear-gradient(90deg, #FFCE00, #fff);
    width: ${confiancaPct}%;
  }
  .url {
    text-align: center; margin-top: 24px;
    font-size: 22px; font-weight: 700; letter-spacing: 0.03em;
    opacity: 0.9;
  }
</style>
</head>
<body>
  <div class="wrap">
    <div class="topo">
      <div class="brand"><span class="ball">⚽</span> Bolão das IAs</div>
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
        <div class="cristal-sub">${confiancaStr || "Aguardando palpites"}</div>
        ${bola ? `<div class="cristal-confianca-bar"><div class="cristal-confianca-fill"></div></div>` : ""}
      </div>
    </div>
    <div class="url">${SITE}</div>
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
