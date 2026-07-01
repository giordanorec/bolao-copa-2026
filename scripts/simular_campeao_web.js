#!/usr/bin/env node
/*
 * Simulador de campeão em cadeia via IAs Web da Série A.
 *
 * Pré-requisito: Chrome rodando com debug port aberta.
 *   powershell -ExecutionPolicy Bypass -File scripts/abrir_chrome_debug.ps1 -Profile "Profile 7"
 *
 * Para cada IA da Série A, pergunta fase por fase (R32 → Oitavas → Quartas →
 * Semifinal → Final) quem avança, até chegar no campeão previsto. Salva JSON
 * versionado em data/predicoes_campeao/<YYYY-MM-DDTHH-mm>/<slug>.json.
 *
 * Uso:
 *   node scripts/simular_campeao_web.js --site=chatgpt      # 1 IA (teste)
 *   node scripts/simular_campeao_web.js --all               # todas as 11
 *   node scripts/simular_campeao_web.js --cristal-only      # agrega JSON existentes
 *   node scripts/simular_campeao_web.js --rodada=2026-07-01T12-00   # timestamp fixo
 *   node scripts/simular_campeao_web.js --dry               # sem enviar
 */

const fs   = require("fs");
const path = require("path");

const ROOT    = path.resolve(__dirname, "..");

// Playwright pode estar no v4/node_modules local ou no repo principal
// (worktrees não têm node_modules próprios)
function requirePlaywright() {
  const candidatos = [
    path.join(ROOT, "v4", "node_modules", "playwright"),
    // worktrees ficam em .claude/worktrees/<id>/ → sobe 3 níveis pro repo principal
    path.join(ROOT, "..", "..", "..", "v4", "node_modules", "playwright"),
    // fallback genérico: 2 níveis acima
    path.join(ROOT, "..", "..", "v4", "node_modules", "playwright"),
  ];
  for (const p of candidatos) {
    try { return require(p); } catch {}
  }
  throw new Error("playwright não encontrado. Rode: cd v4 && npm install");
}
const { chromium } = requirePlaywright();

const OUT_BASE = path.join(ROOT, "data", "predicoes_campeao");

// ---------------------------------------------------------------------------
// Configuração das 11 IAs web (Série A, exceto Fable que é só API)
// Herda URLs/conv/seletores do coletar_matamata_web.js
// ---------------------------------------------------------------------------
const SITES = {
  chatgpt: {
    slug: "chatgpt-5-thinking-web",
    name: "ChatGPT 5 Thinking",
    host: "chatgpt.com",
    url: "https://chatgpt.com/c/6a336e68-99e0-83e9-b636-f3f57aeca31d",
    conv: "6a336e68-99e0-83e9-b636-f3f57aeca31d",
    input: ["#prompt-textarea", 'div[contenteditable="true"]', "textarea"],
    send: "enter",
    assistant: '[data-message-author-role="assistant"]',
    stop: '[data-testid="stop-button"]',
  },
  claude: {
    slug: "claude-opus-4-8-web",
    name: "Claude Opus 4.8",
    host: "claude.ai",
    url: "https://claude.ai/chat/fe3d9f5f-78b0-42d1-ace2-64701779d66b",
    conv: "fe3d9f5f-78b0-42d1-ace2-64701779d66b",
    input: ['div[contenteditable="true"].ProseMirror', 'div[contenteditable="true"]'],
    send: "enter",
    assistant: 'div.font-claude-message, [data-testid="message-content"]',
    stop: '[aria-label="Stop response"], button[aria-label*="Stop"]',
  },
  gemini: {
    slug: "gemini-2-5-pro-web",
    name: "Gemini 2.5 Pro",
    host: "gemini.google.com",
    url: "https://gemini.google.com/u/1/app/dd7d1eebf6faa096?pageId=none",
    conv: "dd7d1eebf6faa096",
    input: ["div.ql-editor[contenteditable]", 'rich-textarea div[contenteditable="true"]', 'div[role="textbox"]', 'div[contenteditable="true"]', "textarea"],
    send: "enter",
    assistant: "message-content, .model-response-text",
    stop: 'button[aria-label*="Stop"], .stop-icon',
  },
  grok: {
    slug: "grok-4-heavy-web",
    name: "Grok 4 Heavy",
    host: "grok.com",
    url: "https://grok.com/c/b9bc9d0b-2573-4fc6-84a3-a7c7a4917a10",
    conv: "b9bc9d0b-2573-4fc6-84a3-a7c7a4917a10",
    input: ["textarea", 'div[contenteditable="true"]'],
    send: "enter",
    assistant: ".message-bubble, .response-content-markdown, .prose",
    stop: 'button[aria-label*="Stop"]',
  },
  deepseek: {
    slug: "deepseek-r1-web",
    name: "DeepSeek R1",
    host: "deepseek.com",
    url: "https://chat.deepseek.com/a/chat/s/5dfd285c-f3aa-4f7c-bf93-c3d40b786192",
    conv: "5dfd285c-f3aa-4f7c-bf93-c3d40b786192",
    input: ["#chat-input", "textarea"],
    send: "enter",
    assistant: ".ds-markdown",
    stop: null,
  },
  copilot: {
    slug: "copilot-microsoft-web",
    name: "Microsoft Copilot",
    host: "copilot.microsoft.com",
    url: "https://copilot.microsoft.com/chats/67D6Zx3KfKypWnU19yRNZ",
    conv: "67D6Zx3KfKypWnU19yRNZ",
    input: ['textarea#userInput', '[data-testid="composer-input"]', "textarea"],
    send: "enter",
    assistant: '[data-content="ai-message"], .prose',
    stop: null,
  },
  perplexity: {
    slug: "perplexity-sonar-pro-web",
    name: "Perplexity Sonar Pro",
    host: "perplexity.ai",
    url: "https://www.perplexity.ai/search/7d25144e-e75d-4d56-9259-44b0a890e12d",
    conv: "7d25144e-e75d-4d56-9259-44b0a890e12d",
    input: ['textarea', 'div[contenteditable="true"]'],
    send: "enter",
    assistant: ".prose",
    stop: null,
  },
  lechat: {
    slug: "le-chat-mistral-web",
    name: "Le Chat (Mistral)",
    host: "chat.mistral.ai",
    url: "https://chat.mistral.ai/chat/9f813fd9-df18-4ae5-b4c4-bb4bac0d87c1",
    conv: "9f813fd9-df18-4ae5-b4c4-bb4bac0d87c1",
    input: ["textarea", 'div[contenteditable="true"]'],
    send: "enter",
    assistant: ".prose",
    stop: null,
  },
  meta: {
    slug: "meta-llama-4-web",
    name: "Meta AI (Llama 4)",
    host: "meta.ai",
    url: "https://www.meta.ai/prompt/ed0ddbeb-013b-4708-92c8-ba0333128090",
    conv: "ed0ddbeb-013b-4708-92c8-ba0333128090",
    input: ['div[contenteditable="true"]', "textarea"],
    send: "enter",
    assistant: ".prose, div[dir='auto']",
    stop: null,
  },
  qwen: {
    slug: "qwen-3-max-web",
    name: "Qwen 3 Max",
    host: "qwen.ai",
    url: "https://chat.qwen.ai/c/8a6672e7-ebcf-4234-a27a-30066c40145e",
    conv: "8a6672e7-ebcf-4234-a27a-30066c40145e",
    input: ["textarea", 'div[contenteditable="true"]'],
    send: "enter",
    assistant: ".markdown-body, .prose",
    stop: null,
  },
  manus: {
    slug: "manus-web",
    name: "Manus",
    host: "manus.im",
    url: "https://manus.im/app/rXDC1Kx2Tha2HzzXx5MqE2",
    conv: "rXDC1Kx2Tha2HzzXx5MqE2",
    input: ["textarea", 'div[contenteditable="true"]'],
    send: "enter",
    assistant: ".prose, .markdown-body",
    stop: null,
  },
};

// ---------------------------------------------------------------------------
// Estado inicial do R32
// Jogos decididos IRL (hardcode): timeA=true, timeB=false
// J73: Canadá (B), J74: Paraguai (B-pênaltis), J75: Marrocos (B-pênaltis)
// J76: Brasil (A), J77: França (A), J78: Noruega (B)
// ---------------------------------------------------------------------------
const R32_DECIDIDOS = {
  73: "Canadá",
  74: "Paraguai",
  75: "Marrocos",
  76: "Brasil",
  77: "França",
  78: "Noruega",
};

// Confrontos do R32 pendentes (IRL em 2026-07-01+)
// Cada item: { j, a, b } — número do jogo, Time A, Time B
const R32_PENDENTES = [
  { j: 79, a: "México",      b: "Equador" },
  { j: 80, a: "Inglaterra",  b: "Congo (RD)" },
  { j: 81, a: "Estados Unidos", b: "Bósnia-Herzegovina" },
  { j: 82, a: "Bélgica",     b: "Senegal" },
  { j: 83, a: "Portugal",    b: "Croácia" },
  { j: 84, a: "Espanha",     b: "Áustria" },
  { j: 85, a: "Suíça",       b: "Argélia" },
  { j: 86, a: "Argentina",   b: "Cabo Verde" },
  { j: 87, a: "Colômbia",    b: "Gana" },
  { j: 88, a: "Austrália",   b: "Egito" },
];

// Mapa de pareamentos das fases seguintes
// Cada item: { j, wa, wb } — jogo e quais vencedores se enfrentam
const FASES = [
  {
    nome: "Oitavas",
    jogos: [
      { j: 89,  wa: 74, wb: 77 },   // Paraguai vs França (decididos)
      { j: 90,  wa: 73, wb: 75 },   // Canadá vs Marrocos (decididos)
      { j: 91,  wa: 76, wb: 78 },   // Brasil vs Noruega (decididos)
      { j: 92,  wa: 79, wb: 80 },
      { j: 93,  wa: 83, wb: 84 },
      { j: 94,  wa: 81, wb: 82 },
      { j: 95,  wa: 86, wb: 88 },
      { j: 96,  wa: 85, wb: 87 },
    ],
  },
  {
    nome: "Quartas",
    jogos: [
      { j: 97,  wa: 89, wb: 90 },
      { j: 98,  wa: 93, wb: 94 },
      { j: 99,  wa: 91, wb: 92 },
      { j: 100, wa: 95, wb: 96 },
    ],
  },
  {
    nome: "Semifinal",
    jogos: [
      { j: 101, wa: 97,  wb: 98 },
      { j: 102, wa: 99,  wb: 100 },
    ],
  },
  {
    nome: "Final",
    jogos: [
      { j: 104, wa: 101, wb: 102 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const a = { cdp: "http://localhost:9222" };
  for (let i = 2; i < argv.length; i++) {
    const t = argv[i];
    if (t === "--all") a.all = true;
    else if (t === "--dry") a.dry = true;
    else if (t === "--cristal-only") a.cristalOnly = true;
    else if (t.startsWith("--site=")) a.site = t.slice(7);
    else if (t.startsWith("--rodada=")) a.rodada = t.slice(9);
    else if (t.startsWith("--cdp=")) a.cdp = t.slice(6);
    // Allow --site <name> form too
    else if (t === "--site" && argv[i + 1]) a.site = argv[++i];
    else if (t === "--rodada" && argv[i + 1]) a.rodada = argv[++i];
    else if (t === "--cdp" && argv[i + 1]) a.cdp = argv[++i];
  }
  return a;
}

function agora() {
  // Returns "2026-07-01T14-30" (filesystem-safe)
  return new Date().toISOString().slice(0, 16).replace(":", "-");
}

function outDir(rodada) {
  return path.join(OUT_BASE, rodada);
}

function ensureDir(d) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

// Build prompt for a phase
function buildPrompt(fase, confrontos) {
  const linhas = confrontos.map(({ j, a, b }) => `| J${j} | ${a} vs ${b} |`).join("\n");
  const tabela = `| Jogo | Confronto |\n|------|----------|\n${linhas}`;

  if (fase === "Final") {
    // Short final prompt
    return [
      "Bolão Copa 2026 — Simulação do CAMPEÃO.\n",
      "**NÃO PALPITE PLACAR. NÃO PESQUISE NA INTERNET.**\n",
      `Fase: Final. Confronto:\n\n${tabela}\n`,
      "Quem é o campeão? Responda apenas:\n",
      "- J104: NomeDoTime",
    ].join("\n");
  }

  return [
    "Bolão Copa 2026 — Simulação do CAMPEÃO.\n",
    "Você compete contra ChatGPT, Claude, Gemini, Grok e outras.",
    "**Objetivo: prever a JORNADA COMPLETA do vencedor da Copa.**\n",
    "**NÃO PALPITE PLACAR. NÃO PESQUISE NA INTERNET.**\n",
    `Fase: ${fase}. Confrontos pendentes:\n\n${tabela}\n`,
    "Responda **apenas com o vencedor de cada jogo**, uma linha por jogo, exatamente neste formato:\n",
    "- J{{numero}}: NomeDoTime",
    "- J{{numero}}: NomeDoTime",
    "...\n",
    "Sem comentário. Só o nome do time que avança pra próxima fase.",
  ].join("\n");
}

// Parse lines like "- J79: México" or "J79: México" from response text
function parseVencedores(texto, jogosEsperados) {
  const resultado = {};
  const lines = texto.split("\n");
  for (const linha of lines) {
    // Match: optional bullet, J<num>: <team>
    const m = linha.match(/[-*]?\s*J(\d+)\s*[:：]\s*(.+)/i);
    if (!m) continue;
    const num = parseInt(m[1], 10);
    const time = m[2].trim().replace(/[*_`]/g, ""); // strip markdown
    if (jogosEsperados.includes(num)) {
      resultado[num] = time;
    }
  }
  // Fill missing with "???"
  for (const j of jogosEsperados) {
    if (!resultado[j]) {
      resultado[j] = "???";
    }
  }
  return resultado;
}

// ---------------------------------------------------------------------------
// CDP / Playwright helpers (adapted from coletar_matamata_web.js)
// ---------------------------------------------------------------------------

async function acharPagina(browser, cfg) {
  const pages = [];
  for (const ctx of browser.contexts()) {
    for (const pg of ctx.pages()) {
      try { pages.push(pg); } catch {}
    }
  }
  // 1) aba já na conversa
  for (const pg of pages) {
    try { if (cfg.conv && pg.url().includes(cfg.conv)) return pg; } catch {}
  }
  // 2) host logado → navega pra conversa
  for (const pg of pages) {
    try {
      if (pg.url().includes(cfg.host)) {
        await pg.goto(cfg.url, { waitUntil: "domcontentloaded" });
        await pg.waitForTimeout(3000);
        return pg;
      }
    } catch {}
  }
  // 3) nova aba
  const ctx = browser.contexts()[0];
  const pg = await ctx.newPage();
  await pg.goto(cfg.url, { waitUntil: "domcontentloaded" });
  await pg.waitForTimeout(3000);
  return pg;
}

async function acharInput(page, seletores) {
  for (const sel of seletores) {
    const loc = page.locator(sel).last();
    try {
      if (await loc.isVisible({ timeout: 1500 })) return loc;
    } catch {}
  }
  return null;
}

// Extrai o innerText da última mensagem do assistente (simples — não precisa
// reconstituir tabela, pois a resposta é lista de linhas "- J##: Time")
async function extrairTextoResposta(page, cfg) {
  return await page.evaluate((sel) => {
    const nodes = document.querySelectorAll(sel);
    if (!nodes.length) return document.body.innerText || "";
    return nodes[nodes.length - 1].innerText || "";
  }, cfg.assistant);
}

async function esperarEstavel(page, cfg, { maxMs = 120000, estavelMs = 6000 } = {}) {
  const t0 = Date.now();
  let ultimo = "";
  let estavelDesde = Date.now();
  while (Date.now() - t0 < maxMs) {
    await page.waitForTimeout(2500);
    let gerando = false;
    if (cfg.stop) {
      try { gerando = await page.locator(cfg.stop).first().isVisible({ timeout: 500 }); } catch {}
    }
    let texto = "";
    try { texto = await extrairTextoResposta(page, cfg); } catch {}
    if (texto !== ultimo) { ultimo = texto; estavelDesde = Date.now(); }
    const estavel = Date.now() - estavelDesde > estavelMs;
    if (estavel && !gerando && texto.length > 10) return texto;
  }
  return ultimo;
}

async function enviarPrompt(browser, cfg, prompt, dry) {
  const page = await acharPagina(browser, cfg);
  await page.bringToFront();
  await page.waitForTimeout(1000);

  let input = await acharInput(page, cfg.input);
  if (!input) {
    // Wait up to ~15s for SPA to mount input
    for (let t = 0; t < 5 && !input; t++) {
      await page.waitForTimeout(3000);
      input = await acharInput(page, cfg.input);
    }
  }
  if (!input) throw new Error("Não achei caixa de texto");

  await input.click();
  await page.waitForTimeout(300);
  await page.keyboard.press("Control+A");
  await page.waitForTimeout(100);
  await page.keyboard.press("Delete");
  await page.waitForTimeout(200);
  await page.keyboard.insertText(prompt);
  await page.waitForTimeout(500);

  if (dry) {
    console.log("    [--dry] prompt colado, NÃO enviado.");
    return null;
  }

  if (cfg.send === "ctrlenter") await page.keyboard.press("Control+Enter");
  else await page.keyboard.press("Enter");
  await page.waitForTimeout(1000);

  console.log("    aguardando resposta...");
  const texto = await esperarEstavel(page, cfg);
  return texto;
}

// ---------------------------------------------------------------------------
// Simulação por IA
// ---------------------------------------------------------------------------

async function simularIA(browser, key, cfg, rodada, dry) {
  console.log(`\n=== ${cfg.name} (${cfg.slug}) ===`);
  const jornada = {};
  // vencedores[jogo] = nome do time
  const vencedores = { ...R32_DECIDIDOS }; // seed com os decididos IRL

  // --- Fase R32 (só pendentes) ---
  const pendentesR32 = R32_PENDENTES.map(({ j, a, b }) => ({ j, a, b }));
  const promptR32 = buildPrompt("R32 (16-avos)", pendentesR32);
  console.log(`  [R32] enviando prompt (${promptR32.length} chars)`);

  let textoR32 = null;
  if (!dry) {
    try {
      textoR32 = await enviarPrompt(browser, cfg, promptR32, false);
    } catch (e) {
      console.log(`  FAIL R32: ${e.message}`);
    }
  } else {
    textoR32 = null;
  }

  if (dry) {
    console.log("  [--dry] pulando envio de todas as fases.");
    // Return dummy structure
    return {
      slug: cfg.slug,
      rodada_em: new Date().toISOString().slice(0, 19),
      campeao: "??? (dry run)",
      jornada: { R32: {}, Oitavas: {}, Quartas: {}, Semifinal: {}, Final: {} },
    };
  }

  if (!textoR32) {
    console.log("  AVISO: sem resposta no R32 — marcando todos como ???");
    for (const { j } of pendentesR32) vencedores[j] = "???";
  } else {
    const parsedR32 = parseVencedores(textoR32, pendentesR32.map((x) => x.j));
    for (const [j, t] of Object.entries(parsedR32)) vencedores[j] = t;
    jornada["R32"] = parsedR32;
    console.log(`  [R32] vencedores: ${JSON.stringify(parsedR32)}`);
  }

  // Inicializar jornada.R32 com todos os 16 jogos (decididos + previstos)
  const todosR32 = {};
  for (const [j, t] of Object.entries(R32_DECIDIDOS)) todosR32[j] = t;
  for (const [j, t] of Object.entries(jornada["R32"] || {})) todosR32[j] = t;
  jornada["R32"] = todosR32;

  // Delay entre mensagens para evitar throttle
  await new Promise((r) => setTimeout(r, 1500));

  // --- Fases seguintes ---
  for (const fase of FASES) {
    // Monta confrontos: resolve wa/wb em nomes de times
    const confrontos = fase.jogos.map(({ j, wa, wb }) => ({
      j,
      a: vencedores[wa] || `Venc.J${wa}`,
      b: vencedores[wb] || `Venc.J${wb}`,
    }));

    const prompt = buildPrompt(fase.nome, confrontos);
    console.log(`  [${fase.nome}] enviando prompt (${prompt.length} chars)`);

    let texto = null;
    try {
      texto = await enviarPrompt(browser, cfg, prompt, false);
    } catch (e) {
      console.log(`  FAIL ${fase.nome}: ${e.message}`);
    }

    if (!texto) {
      console.log(`  AVISO: sem resposta em ${fase.nome} — marcando ???`);
      for (const { j } of confrontos) vencedores[j] = "???";
      jornada[fase.nome] = Object.fromEntries(confrontos.map(({ j }) => [j, "???"]));
    } else {
      const parsed = parseVencedores(texto, fase.jogos.map((x) => x.j));
      for (const [j, t] of Object.entries(parsed)) vencedores[j] = t;
      jornada[fase.nome] = parsed;
      console.log(`  [${fase.nome}] vencedores: ${JSON.stringify(parsed)}`);
    }

    // Delay entre fases
    await new Promise((r) => setTimeout(r, 1500));
  }

  const campeao = vencedores[104] || "???";
  console.log(`  CAMPEAO PREVISTO: ${campeao}`);

  return {
    slug: cfg.slug,
    rodada_em: new Date().toISOString().slice(0, 19),
    campeao,
    jornada,
  };
}

// ---------------------------------------------------------------------------
// Agregador Bola de Cristal
// ---------------------------------------------------------------------------

function majority(votos, fallback) {
  // votos = array de strings. Retorna o mais votado.
  // Empate: retorna o primeiro mais votado (ordem natural do array).
  if (!votos.length) return fallback || "???";
  const contagem = {};
  for (const v of votos) {
    if (!v || v === "???") continue;
    contagem[v] = (contagem[v] || 0) + 1;
  }
  if (!Object.keys(contagem).length) return fallback || "???";
  return Object.entries(contagem).sort((a, b) => b[1] - a[1])[0][0];
}

function agregarCristal(resultados) {
  // resultados = array de objetos { slug, campeao, jornada }
  if (!resultados.length) return null;

  const cristalJornada = {};

  // R32 — jogos decididos são iguais pra todos; previstos = maioria
  const r32Aggregado = { ...R32_DECIDIDOS };
  for (const { j } of R32_PENDENTES) {
    const votos = resultados
      .map((r) => r.jornada && r.jornada["R32"] && r.jornada["R32"][j])
      .filter(Boolean);
    r32Aggregado[j] = majority(votos, "???");
  }
  cristalJornada["R32"] = r32Aggregado;

  // Vencedores acumulados do Cristal
  const venc = { ...r32Aggregado };

  // Demais fases
  for (const fase of FASES) {
    const faseAgg = {};
    for (const { j, wa, wb } of fase.jogos) {
      const votos = resultados
        .map((r) => r.jornada && r.jornada[fase.nome] && r.jornada[fase.nome][j])
        .filter(Boolean);
      const escolhido = majority(votos, `${venc[wa] || "??"} vs ${venc[wb] || "??"}`);
      faseAgg[j] = escolhido;
      venc[j] = escolhido;
    }
    cristalJornada[fase.nome] = faseAgg;
  }

  return {
    slug: "_bola-de-cristal",
    rodada_em: new Date().toISOString().slice(0, 19),
    campeao: venc[104] || "???",
    jornada: cristalJornada,
    votos_totais: resultados.length,
  };
}

// ---------------------------------------------------------------------------
// Salvar + carregar resultados
// ---------------------------------------------------------------------------

function salvarResultado(dir, dados) {
  ensureDir(dir);
  const arq = path.join(dir, `${dados.slug}.json`);
  fs.writeFileSync(arq, JSON.stringify(dados, null, 2), "utf8");
  console.log(`  salvo: ${path.relative(ROOT, arq)}`);
  return arq;
}

function carregarResultados(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .map((f) => {
      try { return JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); }
      catch { return null; }
    })
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv);
  const rodada = args.rodada || agora();
  const dir = outDir(rodada);

  console.log(`\nSimulador de Campeão — rodada ${rodada}`);
  console.log(`Output: ${path.relative(ROOT, dir)}`);

  // --cristal-only: só agrega JSON existentes
  if (args.cristalOnly) {
    console.log("\n[--cristal-only] Lendo resultados existentes...");
    const resultados = carregarResultados(dir);
    if (!resultados.length) {
      console.error(`Nenhum resultado em ${dir}`);
      process.exit(1);
    }
    const cristal = agregarCristal(resultados);
    salvarResultado(dir, cristal);
    const resumo = {
      rodada,
      campeoes: Object.fromEntries(resultados.map((r) => [r.slug, r.campeao])),
    };
    resumo.campeoes["_bola-de-cristal"] = cristal.campeao;
    salvarResultado(dir, { slug: "_resumo", ...resumo });
    console.log(`\nBola de Cristal: ${cristal.campeao}`);
    return;
  }

  // Decide quais IAs rodar
  const alvo = args.all
    ? Object.keys(SITES)
    : args.site
    ? [args.site]
    : [];

  if (!alvo.length) {
    console.log("Nada a fazer. Use --site=<nome> ou --all.");
    console.log("Sites:", Object.keys(SITES).join(", "));
    return;
  }

  // Verifica sites válidos
  for (const key of alvo) {
    if (!SITES[key]) {
      console.error(`Site desconhecido: ${key}. Sites válidos: ${Object.keys(SITES).join(", ")}`);
      process.exit(1);
    }
  }

  if (args.dry) {
    console.log("[--dry] modo seco: não envia nada.");
  }

  let browser;
  if (!args.dry) {
    for (let tent = 1; tent <= 2 && !browser; tent++) {
      try {
        browser = await chromium.connectOverCDP(args.cdp, { timeout: 90000 });
      } catch (e) {
        if (tent === 2) {
          console.error(`\nNão consegui conectar via CDP em ${args.cdp}`);
          console.error('Abra o Chrome com: scripts/abrir_chrome_debug.ps1 -Profile "Profile 7"');
          console.error(`Detalhe: ${e.message}\n`);
          process.exit(1);
        }
        console.error(`  CDP falhou (tentativa ${tent}/2): ${e.message.split("\n")[0]} — retentando...`);
      }
    }
  }

  const resultados = [];

  for (const key of alvo) {
    const cfg = SITES[key];
    try {
      const resultado = await simularIA(browser, key, cfg, rodada, args.dry);
      resultados.push(resultado);
      salvarResultado(dir, resultado);
    } catch (e) {
      console.error(`  FAIL ${key}: ${e.message}`);
    }

    // Delay entre IAs para evitar sobrecarga
    if (alvo.indexOf(key) < alvo.length - 1) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  // Roda Cristal se tiver mais de 1 resultado
  if (resultados.length > 0) {
    // Carrega todos (pode ter outros de rodadas anteriores no mesmo dir)
    const todos = carregarResultados(dir);
    const efetivos = todos.length ? todos : resultados;
    const cristal = agregarCristal(efetivos);
    salvarResultado(dir, cristal);

    const resumo = {
      slug: "_resumo",
      rodada,
      campeoes: Object.fromEntries(efetivos.map((r) => [r.slug, r.campeao])),
    };
    resumo.campeoes["_bola-de-cristal"] = cristal.campeao;
    salvarResultado(dir, resumo);

    console.log("\n--- RESUMO ---");
    for (const [slug, camp] of Object.entries(resumo.campeoes)) {
      console.log(`  ${slug}: ${camp}`);
    }
  }

  if (browser) await browser.close();
  console.log("\nfim.");
}

main().catch((e) => {
  console.error("Erro fatal:", e.message);
  process.exit(1);
});
