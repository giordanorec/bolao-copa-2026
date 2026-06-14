/**
 * Gera 1 PNG 1080x1350 por DIA com TODOS os jogos daquele dia e o palpite
 * consenso (Bola de Cristal). Jogos já encerrados mostram o resultado real.
 * Saída: ../cards_dia/dia-<AAAA-MM-DD>.png
 *
 * Uso (na pasta v4):
 *   node ../marketing/scripts/gerar_cards_dia.js [data_inicio] [data_fim]
 *   (sem args: de hoje até +7 dias)
 */

const fs = require("fs");
const path = require("path");

const V4_ROOT = path.resolve(__dirname, "../../v4");
const { chromium } = require(path.join(V4_ROOT, "node_modules", "playwright"));
const V4 = path.join(V4_ROOT, "public");
const OUT = path.resolve(__dirname, "../cards_dia");

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

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function rotuloDia(data) {
  const dt = new Date(`${data}T12:00:00Z`);
  const [, mes, dia] = data.split("-");
  return `${DIAS[dt.getUTCDay()]} ${dia}/${mes}`;
}

function flag(iso) {
  return `https://hatscripts.github.io/circle-flags/flags/${iso || "xx"}.svg`;
}

function linhaJogo(j) {
  const isoA = mapaPaises[j.time_a] || "xx";
  const isoB = mapaPaises[j.time_b] || "xx";
  const dados = palpitesIAs[String(j.numero)];
  const bola = dados?.bola_de_cristal ?? null;
  const totalVotos = dados ? Object.keys(dados.palpites).length : 0;
  const pct =
    bola && totalVotos ? Math.round((bola.votos / totalVotos) * 100) : 0;

  const jaJogou = j.gols_a != null && j.gols_b != null;
  let placar, selo;
  if (jaJogou) {
    placar = `${j.gols_a} × ${j.gols_b}`;
    selo = `<span class="selo resultado">✅ resultado</span>`;
  } else if (bola) {
    placar = `${bola.gols_a} × ${bola.gols_b}`;
    selo = `<span class="selo cristal">🔮 ${pct}% · ${bola.votos}/${totalVotos} IAs</span>`;
  } else {
    placar = "—";
    selo = `<span class="selo vazio">coletando palpites…</span>`;
  }

  return `
    <div class="jogo ${jaJogou ? "jogou" : ""}">
      <div class="hora">${j.hora}</div>
      <div class="lado a">
        <span class="tnome">${j.time_a}</span>
        <img class="tflag" src="${flag(isoA)}" />
      </div>
      <div class="meio">
        <div class="placar">${placar}</div>
        ${selo}
      </div>
      <div class="lado b">
        <img class="tflag" src="${flag(isoB)}" />
        <span class="tnome">${j.time_b}</span>
      </div>
    </div>`;
}

function htmlCardDia(data, lista) {
  const n = lista.length;
  const rotulo = rotuloDia(data);
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1080px; height: 1350px;
    font-family: -apple-system, 'Segoe UI', system-ui, 'Inter', sans-serif;
    color: #1A1A1A; background: #FFFFFF;
    overflow: hidden; position: relative;
  }
  body::before {
    content: ""; position: absolute; inset: 0; pointer-events: none;
    background:
      radial-gradient(circle at 0% 0%, rgba(0,156,59,0.06), transparent 38%),
      radial-gradient(circle at 100% 100%, rgba(255,206,0,0.08), transparent 38%);
  }
  body::after {
    content: ""; position: absolute; top: 0; left: 0; right: 0; height: 8px;
    background: linear-gradient(90deg, #009C3B 0%, #FFCE00 50%, #002776 100%);
  }
  .wrap {
    position: relative; z-index: 2;
    padding: 60px 64px 48px; height: 100%;
    display: flex; flex-direction: column;
  }
  .topo {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 28px;
  }
  .brand { display: flex; align-items: center; gap: 14px; }
  .brand .ball { font-size: 56px; line-height: 1; transform: rotate(-8deg); }
  .brand-title { font-size: 30px; font-weight: 900; letter-spacing: -0.02em; color: #002776; }
  .brand-sub { font-size: 14px; font-weight: 700; color: #009C3B; letter-spacing: 0.12em; text-transform: uppercase; }
  .diapill {
    background: #002776; color: #fff;
    padding: 12px 26px; border-radius: 999px;
    font-size: 22px; font-weight: 900; letter-spacing: 0.04em;
  }
  .titulo {
    font-size: 40px; font-weight: 900; color: #1A1A1A;
    margin-bottom: 6px; letter-spacing: -0.02em;
  }
  .subtitulo {
    font-size: 19px; color: #5A5A5A; margin-bottom: 26px; font-weight: 600;
  }
  .subtitulo strong { color: #009C3B; }

  .jogos {
    flex: 1; display: flex; flex-direction: column;
    gap: ${n <= 4 ? 18 : n <= 6 ? 14 : 9}px;
    justify-content: center;
  }
  .jogo {
    display: grid;
    grid-template-columns: 86px 1fr 200px 1fr;
    align-items: center; gap: 14px;
    padding: ${n <= 4 ? 20 : 14}px 22px;
    border: 1px solid #ECECEC; border-radius: 20px;
    background: #FCFCFD;
    box-shadow: 0 2px 10px rgba(0,0,0,0.04);
  }
  .jogo.jogou { background: #F4FBF6; border-color: #CDEBD7; }
  .hora {
    font-size: 22px; font-weight: 900; color: #002776;
    font-variant-numeric: tabular-nums;
  }
  .lado { display: flex; align-items: center; gap: 14px; min-width: 0; }
  .lado.a { justify-content: flex-end; }
  .lado.b { justify-content: flex-start; }
  .tflag {
    width: 58px; height: 58px; border-radius: 50%;
    object-fit: cover; border: 3px solid #FFF;
    box-shadow: 0 2px 8px rgba(0,0,0,0.16); flex-shrink: 0;
  }
  .tnome {
    font-size: 25px; font-weight: 800; color: #1A1A1A;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .meio { text-align: center; }
  .placar {
    font-size: 40px; font-weight: 900; color: #002776;
    line-height: 1; letter-spacing: -0.02em;
  }
  .selo {
    display: inline-block; margin-top: 7px;
    font-size: 13px; font-weight: 800; padding: 3px 10px;
    border-radius: 999px; white-space: nowrap;
  }
  .selo.cristal { background: #FFF6D6; color: #8A6D00; }
  .selo.resultado { background: #009C3B; color: #fff; }
  .selo.vazio { background: #F0F0F0; color: #999; }

  .rodape {
    margin-top: auto; text-align: center;
    border-top: 2px dashed #DDD; padding-top: 22px;
  }
  .rodape-titulo { font-size: 21px; font-weight: 800; color: #002776; margin-bottom: 14px; }
  .rodape-links { display: flex; gap: 16px; justify-content: center; align-items: center; flex-wrap: wrap; }
  .pill {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 22px; border-radius: 999px;
    font-size: 19px; font-weight: 800;
  }
  .pill-site { background: #009C3B; color: #fff; }
  .pill-insta { background: linear-gradient(135deg, #F58529, #DD2A7B, #8134AF); color: #fff; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="topo">
      <div class="brand">
        <span class="ball">⚽</span>
        <div>
          <div class="brand-title">Bolão das IAs</div>
          <div class="brand-sub">🇧🇷 Copa do Mundo 2026</div>
        </div>
      </div>
      <div class="diapill">🗓 ${rotulo}</div>
    </div>

    <div class="titulo">Jogos do dia</div>
    <div class="subtitulo">
      ${n} ${n === 1 ? "partida" : "partidas"} · placar 🔮 do consenso de <strong>122 IAs</strong>
    </div>

    <div class="jogos">
      ${lista.map(linhaJogo).join("")}
    </div>

    <div class="rodape">
      <div class="rodape-titulo">Todos os palpites, jogo a jogo 👇</div>
      <div class="rodape-links">
        <div class="pill pill-site">🌐 ${SITE}</div>
        <div class="pill pill-insta">📸 ${INSTA}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function addDias(data, n) {
  const dt = new Date(`${data}T12:00:00Z`);
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

async function main() {
  const hoje = new Date().toISOString().slice(0, 10);
  const ini = process.argv[2] || hoje;
  const fim = process.argv[3] || addDias(ini, 7);

  const porData = {};
  for (const j of jogos) {
    if (j.data < ini || j.data > fim) continue;
    (porData[j.data] ??= []).push(j);
  }
  const datas = Object.keys(porData).sort();
  for (const d of datas) porData[d].sort((a, b) => a.hora.localeCompare(b.hora));

  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1080, height: 1350 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();

  let ok = 0;
  for (const d of datas) {
    const html = htmlCardDia(d, porData[d]);
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.waitForTimeout(200);
    const arquivo = path.join(OUT, `dia-${d}.png`);
    await page.screenshot({ path: arquivo, fullPage: false });
    ok++;
    console.log(`  ✓ ${d} — ${porData[d].length} jogos`);
  }
  await browser.close();
  console.log(`\n${ok} cards de dia gerados (${ini} → ${fim}) em ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
