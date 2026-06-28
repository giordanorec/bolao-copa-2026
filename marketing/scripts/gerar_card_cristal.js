/**
 * Gera 1 PNG 1080x1080 comemorando quando a BOLA DE CRISTAL crava o placar exato.
 * Auto-detecta o jogo mais recente em que o consenso das IAs acertou o placar e
 * monta o card com o histórico (quantas vezes cravou, % de acerto de vencedor,
 * % de jogos em que alguma IA crava o placar, quantas IAs cravaram este jogo).
 *
 * Mesma fonte de dados do banner <CelebracaoCristal>: v4/public/*.json.
 * Saída: ../cards/cristal-cravou-<numero>.png
 *
 * Uso:
 *   node marketing/scripts/gerar_card_cristal.js          # último jogo cravado
 *   node marketing/scripts/gerar_card_cristal.js 73       # força um jogo
 */

const fs = require("fs");
const path = require("path");

const V4_ROOT = path.resolve(__dirname, "../../v4");
const { chromium } = require(path.join(V4_ROOT, "node_modules", "playwright"));
const V4 = path.join(V4_ROOT, "public");
const OUT = path.resolve(__dirname, "../cards");

const jogos = JSON.parse(fs.readFileSync(path.join(V4, "jogos.json"), "utf-8"));
const resultados = JSON.parse(
  fs.readFileSync(path.join(V4, "resultados.json"), "utf-8"),
);
const palpitesIAs = JSON.parse(
  fs.readFileSync(path.join(V4, "palpites_por_jogo.json"), "utf-8"),
);
const mapaPaises = JSON.parse(
  fs.readFileSync(path.join(V4, "paises_iso.json"), "utf-8"),
);
delete mapaPaises._README;

const SITE = "bolao.arenadasias.com.br";
const INSTA = "@arena.das.ias";

const ORDINAL = {
  1: "1ª", 2: "2ª", 3: "3ª", 4: "4ª", 5: "5ª", 6: "6ª", 7: "7ª", 8: "8ª",
  9: "9ª", 10: "10ª", 11: "11ª", 12: "12ª", 13: "13ª", 14: "14ª", 15: "15ª",
  16: "16ª",
};
const ordinal = (n) => ORDINAL[n] || `${n}ª`;

function calcular() {
  let cristalAcertos = 0;
  let cristalTotal = 0;
  let vencedorAcertos = 0;
  let algumaIA = 0;
  const acertosBool = [];

  for (const r of resultados) {
    const dados = palpitesIAs[String(r.jogo_numero)];
    if (!dados?.bola_de_cristal) continue;
    cristalTotal++;
    const c = dados.bola_de_cristal;
    const cravou = c.gols_a === r.gols_a && c.gols_b === r.gols_b;
    acertosBool.push(cravou);
    if (cravou) cristalAcertos++;
    const rw = Math.sign(r.gols_a - r.gols_b);
    const cw = Math.sign(c.gols_a - c.gols_b);
    if (rw === cw) vencedorAcertos++;
    const pal = dados.palpites || {};
    const algum = Object.values(pal).some(
      (p) => p.gols_a === r.gols_a && p.gols_b === r.gols_b,
    );
    if (algum) algumaIA++;
  }

  let estreak = 0;
  for (let i = acertosBool.length - 1; i >= 0; i--) {
    if (acertosBool[i]) estreak++;
    else break;
  }

  return {
    cristalAcertos,
    cristalTotal,
    pctCravou: Math.round((cristalAcertos / cristalTotal) * 100),
    pctVencedor: Math.round((vencedorAcertos / cristalTotal) * 100),
    pctAlguma: Math.round((algumaIA / cristalTotal) * 100),
    estreak,
  };
}

function ultimoCravado(forcado) {
  const ordenados = [...resultados].reverse();
  for (const r of ordenados) {
    if (forcado && r.jogo_numero !== forcado) continue;
    const jogo = jogos.find((j) => j.numero === r.jogo_numero);
    if (!jogo) continue;
    const dados = palpitesIAs[String(r.jogo_numero)];
    if (!dados?.bola_de_cristal) continue;
    const c = dados.bola_de_cristal;
    if (c.gols_a !== r.gols_a || c.gols_b !== r.gols_b) continue;
    const pal = dados.palpites || {};
    const totalIAs = Object.keys(pal).length;
    const acertaram = Object.values(pal).filter(
      (p) => p.gols_a === r.gols_a && p.gols_b === r.gols_b,
    ).length;
    return {
      jogoNum: r.jogo_numero,
      timeA: jogo.time_a,
      timeB: jogo.time_b,
      isoA: mapaPaises[jogo.time_a] || "xx",
      isoB: mapaPaises[jogo.time_b] || "xx",
      gols_a: r.gols_a,
      gols_b: r.gols_b,
      fase: jogo.fase,
      data: jogo.data,
      local: jogo.local,
      totalIAs,
      acertaram,
    };
  }
  return null;
}

function htmlCard(j, stats) {
  const denovo = stats.cristalAcertos >= 2;
  const badge = denovo ? "🔥 CRAVOU DE NOVO" : "🔮 A BOLA DE CRISTAL CRAVOU";
  const titulo =
    stats.estreak >= 3
      ? `${stats.estreak} jogos seguidos. As IAs estão prevendo a Copa.`
      : `Pela ${ordinal(stats.cristalAcertos)} vez, o placar previsto pelas IAs aconteceu.`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1080px; height: 1080px;
    font-family: -apple-system, 'Segoe UI', system-ui, 'Inter', sans-serif;
    color: #fff; overflow: hidden; position: relative;
    background:
      radial-gradient(ellipse at top left, rgba(168,85,247,0.30), transparent 55%),
      radial-gradient(ellipse at bottom right, rgba(16,185,129,0.22), transparent 55%),
      linear-gradient(135deg, #1a1238 0%, #0f0a26 100%);
  }
  body::after {
    content: ""; position: absolute; top: 0; left: 0; right: 0; height: 8px;
    background: linear-gradient(90deg, #a855f7 0%, #ec4899 50%, #10b981 100%);
  }
  .confetes { position: absolute; inset: 0; pointer-events: none; }
  .confetes span { position: absolute; font-size: 40px; opacity: 0.4; }
  .wrap {
    position: relative; z-index: 2;
    padding: 64px 72px 52px; height: 100%;
    display: flex; flex-direction: column;
  }
  .topo { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
  .brand { display: flex; align-items: center; gap: 14px; }
  .brand .ball { font-size: 50px; line-height: 1; transform: rotate(-8deg); }
  .brand-title { font-size: 28px; font-weight: 900; letter-spacing: -0.02em; color: #fff; }
  .brand-sub { font-size: 13px; font-weight: 700; color: #a7f3d0; letter-spacing: 0.12em; text-transform: uppercase; }
  .fase { background: rgba(168,85,247,0.25); border: 1px solid rgba(168,85,247,0.6); color: #e9d5ff; padding: 9px 20px; border-radius: 999px; font-size: 15px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; }

  .badge {
    display: inline-flex; align-self: flex-start; align-items: center;
    background: linear-gradient(90deg, ${denovo ? "#f59e0b, #ef4444, #ec4899" : "#a855f7, #ec4899"});
    color: #fff; padding: 14px 30px; border-radius: 999px;
    font-size: 26px; font-weight: 900; letter-spacing: 0.04em;
    box-shadow: 0 0 36px rgba(236,72,153,0.5); margin-bottom: 22px;
  }
  .titulo {
    font-size: 52px; font-weight: 900; line-height: 1.08;
    letter-spacing: -0.02em; margin-bottom: 34px; max-width: 900px;
    background: linear-gradient(180deg, #fff, #d8b4fe);
    -webkit-background-clip: text; background-clip: text; color: transparent;
  }

  .jogo {
    display: flex; align-items: center; justify-content: space-between; gap: 24px;
    padding: 34px 30px; margin-bottom: 30px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(168,85,247,0.35); border-radius: 26px;
  }
  .time { flex: 1; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 16px; }
  .bandeira { width: 168px; height: 168px; border-radius: 50%; object-fit: cover; border: 4px solid rgba(255,255,255,0.85); box-shadow: 0 8px 28px rgba(0,0,0,0.4); }
  .nome { font-size: 32px; font-weight: 900; line-height: 1.1; max-width: 280px; }
  .placar-box { display: flex; flex-direction: column; align-items: center; gap: 8px; min-width: 240px; }
  .placar-lbl { font-size: 14px; color: #c4b5fd; letter-spacing: 0.14em; font-weight: 800; }
  .placar { font-size: 128px; font-weight: 900; line-height: 1; letter-spacing: -0.04em;
    background: linear-gradient(180deg, #fff, #c4b5fd); -webkit-background-clip: text; background-clip: text; color: transparent;
    text-shadow: 0 0 50px rgba(168,85,247,0.4); }

  .destaque {
    display: flex; align-items: center; gap: 18px;
    padding: 22px 28px; margin-bottom: 26px;
    background: rgba(16,185,129,0.14); border: 1px solid rgba(16,185,129,0.4); border-radius: 18px;
  }
  .destaque .big { font-size: 56px; font-weight: 900; color: #10b981; line-height: 1; }
  .destaque .big small { font-size: 28px; color: #a7f3d0; font-weight: 800; }
  .destaque .txt { font-size: 26px; font-weight: 700; color: #ecfdf5; line-height: 1.3; }

  .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: auto; }
  .stat { background: rgba(255,255,255,0.05); border: 1px solid rgba(168,85,247,0.3); border-radius: 18px; padding: 24px 18px; text-align: center; }
  .stat .n { font-size: 52px; font-weight: 900; line-height: 1; color: #fff; }
  .stat .n.roxo { color: #c4b5fd; }
  .stat .n.verde { color: #10b981; }
  .stat .l { font-size: 17px; color: #cbd5e1; font-weight: 600; margin-top: 10px; line-height: 1.3; }

  .rodape { display: flex; justify-content: center; gap: 16px; align-items: center; margin-top: 34px; }
  .pill { display: inline-flex; align-items: center; gap: 8px; padding: 12px 22px; border-radius: 999px; font-size: 19px; font-weight: 800; }
  .pill-site { background: #10b981; color: #06281d; }
  .pill-insta { background: linear-gradient(135deg, #F58529, #DD2A7B, #8134AF); color: #fff; }
</style>
</head>
<body>
  <div class="confetes">
    <span style="top:9%;left:6%">✨</span>
    <span style="top:14%;right:9%">🎉</span>
    <span style="top:50%;left:3%">⭐</span>
    <span style="top:60%;right:4%">✨</span>
    <span style="top:30%;right:46%">🎊</span>
  </div>
  <div class="wrap">
    <div class="topo">
      <div class="brand">
        <span class="ball">🔮</span>
        <div>
          <div class="brand-title">Bola de Cristal · Bolão das IAs</div>
          <div class="brand-sub">🇧🇷 Copa do Mundo 2026</div>
        </div>
      </div>
      <div class="fase">${j.fase}</div>
    </div>

    <div class="badge">${badge}</div>
    <h1 class="titulo">${titulo}</h1>

    <div class="jogo">
      <div class="time">
        <img class="bandeira" src="https://hatscripts.github.io/circle-flags/flags/${j.isoA}.svg" />
        <div class="nome">${j.timeA}</div>
      </div>
      <div class="placar-box">
        <span class="placar-lbl">RESULTADO FINAL</span>
        <div class="placar">${j.gols_a} × ${j.gols_b}</div>
      </div>
      <div class="time">
        <img class="bandeira" src="https://hatscripts.github.io/circle-flags/flags/${j.isoB}.svg" />
        <div class="nome">${j.timeB}</div>
      </div>
    </div>

    <div class="destaque">
      <span class="big">${j.acertaram}<small>/${j.totalIAs}</small></span>
      <span class="txt">IAs cravaram esse placar exato.<br><strong>E você, cravaria?</strong></span>
    </div>

    <div class="stats">
      <div class="stat">
        <div class="n roxo">${stats.cristalAcertos}</div>
        <div class="l">placares <strong>cravados</strong> em ${stats.cristalTotal} jogos (${stats.pctCravou}%)</div>
      </div>
      <div class="stat">
        <div class="n verde">${stats.pctVencedor}%</div>
        <div class="l">das vezes a Cristal <strong>acerta o vencedor</strong></div>
      </div>
      <div class="stat">
        <div class="n">${stats.pctAlguma}%</div>
        <div class="l">dos jogos <strong>alguma IA crava</strong> o placar exato</div>
      </div>
    </div>

    <div class="rodape">
      <div class="pill pill-site">🌐 ${SITE}</div>
      <div class="pill pill-insta">📸 ${INSTA}</div>
    </div>
  </div>
</body>
</html>`;
}

async function main() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  const forcado = process.argv[2] ? Number(process.argv[2]) : null;
  const j = ultimoCravado(forcado);
  if (!j) {
    console.error("Nenhum jogo com placar cravado pela Bola de Cristal encontrado.");
    process.exit(1);
  }
  const stats = calcular();
  console.log(
    `Cristal cravou: jogo ${j.jogoNum} ${j.timeA} ${j.gols_a}×${j.gols_b} ${j.timeB} · ` +
      `${j.acertaram}/${j.totalIAs} IAs · histórico ${stats.cristalAcertos}/${stats.cristalTotal} ` +
      `(${stats.pctCravou}%) · vencedor ${stats.pctVencedor}% · alguma IA ${stats.pctAlguma}%`,
  );

  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1080, height: 1080 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  await page.setContent(htmlCard(j, stats), { waitUntil: "networkidle" });
  await page.waitForTimeout(200);
  const arquivo = path.join(OUT, `cristal-cravou-${String(j.jogoNum).padStart(3, "0")}.png`);
  await page.screenshot({ path: arquivo, fullPage: false });
  await browser.close();
  console.log(`\n✓ Card gerado: ${arquivo}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
