#!/usr/bin/env node
/* Le a última resposta do Manus (aba já aberta com o palpite dado) via CDP.
 * Uso: node scripts/ler_manus.js
 */
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
function requirePlaywright() {
  const cands = [
    path.join(ROOT, "v4", "node_modules", "playwright"),
    path.join(ROOT, "..", "..", "v4", "node_modules", "playwright"),
  ];
  for (const p of cands) { try { return require(p); } catch {} }
  throw new Error("playwright não achado");
}
const { chromium } = requirePlaywright();

const CDP = "http://localhost:9222";
const OUT_DIR = path.join(ROOT, "data", "predicoes_campeao", "2026-07-02T15-30");
const OUT_FILE = path.join(OUT_DIR, "manus-web.json");

const FASES = {
  R32: [73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88],
  Oitavas: [89, 90, 91, 92, 93, 94, 95, 96],
  Quartas: [97, 98, 99, 100],
  Semifinal: [101, 102],
  Final: [104],
};
// R32 já decididos IRL (vencedores conhecidos)
const R32_DECIDIDOS = {
  73: "Canadá", 74: "Paraguai", 75: "Marrocos", 76: "Brasil",
  77: "França", 78: "Noruega", 79: "México", 80: "Inglaterra",
  81: "Estados Unidos", 82: "Bélgica", 83: "Portugal", 84: "Espanha",
  85: "Suíça",
};

function parseVencedores(texto, jogosEsperados) {
  const resultado = {};
  const lines = texto.split("\n");
  const setJ = new Set(jogosEsperados);
  const re = /(?:^|\|)\s*[*_`]*\s*(?:[Jj]ogo\s*|[Jj])?(\d{1,3})[*_`]*\s*(?:[:.)|]|—|→|->|-)\s*[*_`]*([^\n|(—→\-]+?)\s*[*_`]*(?:\|.*|\([^)]*\).*|$)/;
  const rePros = /\b[Jj](\d{1,3})\b[^.\n]*?(?:\bé\s+|\bavança\b[^.\n]*?|\bvence[m]?\b[^.\n]*?|\bganha\b[^.\n]*?|\bcomo vencedor(?:a)?\b[^.\n]*?|\b:\s*)([A-ZÁÉÍÓÚÂÊÔÃÕÇ][^.,\n(|]{2,40})/;
  const limpar = (t) => t.trim().replace(/[*_`"]/g, "").replace(/\s+/g, " ");
  const invalido = (t) =>
    !t || /^(nome|time|team|equipe|todo|tbd|\?+)/i.test(t) || /\s(?:vs|x|×|-)\s/i.test(t);
  for (const linha of lines) {
    let m = linha.match(re);
    if (m) {
      const n = parseInt(m[1], 10);
      if (setJ.has(n)) {
        const t = limpar(m[2]);
        if (!invalido(t)) resultado[n] = t;
      }
    }
    if (!m) {
      const mp = linha.match(rePros);
      if (mp) {
        const n = parseInt(mp[1], 10);
        if (setJ.has(n) && !resultado[n]) {
          const t = limpar(mp[2]);
          if (!invalido(t)) resultado[n] = t;
        }
      }
    }
  }
  return resultado;
}

(async () => {
  console.log("Conectando ao Chrome (CDP)…");
  const browser = await chromium.connectOverCDP(CDP);
  let page = null;
  for (const ctx of browser.contexts()) {
    for (const pg of ctx.pages()) {
      try { if (pg.url().includes("manus.im")) { page = pg; break; } } catch {}
    }
    if (page) break;
  }
  if (!page) { console.error("Nenhuma aba do Manus achada"); process.exit(1); }
  console.log("Aba Manus:", page.url());
  await page.bringToFront();

  // Extrai TODO o texto de blocos que parecem resposta do bot.
  // Manus renderiza a mensagem do usuário e do bot com class parecida (.prose),
  // então pegamos TODOS e concatenamos — parseVencedores só liga pra "J89: X" etc.
  const seletores = [
    ".prose",
    ".markdown-body",
    "[data-message-role='assistant']",
    "[data-role='assistant']",
    "article",
  ];
  const texto = await page.evaluate((sels) => {
    for (const sel of sels) {
      const nodes = document.querySelectorAll(sel);
      if (nodes.length) {
        return Array.from(nodes).map((n) => n.innerText || "").join("\n\n");
      }
    }
    return document.body.innerText || "";
  }, seletores);

  console.log(`Texto capturado: ${texto.length} chars`);
  const preview = texto.replace(/\s+/g, " ").slice(0, 300);
  console.log(`Preview: "${preview}${texto.length > 300 ? "…" : ""}"`);

  const jornada = {};
  let venc = { ...R32_DECIDIDOS };

  for (const [nome, jogos] of Object.entries(FASES)) {
    const r = parseVencedores(texto, jogos);
    jornada[nome] = {};
    for (const j of jogos) {
      // R32: se decidido IRL, mantém IRL; senão pega da resposta
      if (nome === "R32" && R32_DECIDIDOS[j]) jornada[nome][j] = R32_DECIDIDOS[j];
      else jornada[nome][j] = r[j] || "???";
    }
    const feitos = Object.values(jornada[nome]).filter((v) => v !== "???").length;
    console.log(`  ${nome}: ${feitos}/${jogos.length} preenchidos → ${JSON.stringify(jornada[nome])}`);
  }

  const campeao = jornada.Final?.[104] || "???";
  const dados = {
    slug: "manus-web",
    rodada_em: new Date().toISOString().slice(0, 19),
    campeao,
    jornada,
  };
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(dados, null, 2), "utf8");
  console.log(`\nSalvo: ${path.relative(ROOT, OUT_FILE)}`);
  console.log(`Campeão do Manus: ${campeao}`);

  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
