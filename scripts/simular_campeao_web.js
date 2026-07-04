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
    // Grok mistura user msgs e assistant no mesmo container. Diferenciamos
    // pelo alignment: user = items-end, assistant = items-start. Selecionamos
    // só a assistant.
    assistant: '.items-start .response-content-markdown, .items-start .message-bubble',
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
    // Conv antigo (9f813fd9-...) foi deletado — abrir novo chat sempre
    url: "https://chat.mistral.ai/chat",
    conv: null,
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
    input: [
      'textarea[placeholder*="Manus"]',
      'textarea[placeholder*="Enviar"]',
      'textarea[placeholder*="mensagem"]',
      "textarea:visible",
      "textarea",
      'div[contenteditable="true"]',
    ],
    send: "enter",
    assistant: ".prose, .markdown-body",
    stop: null,
  },
};

// ---------------------------------------------------------------------------
// Estado inicial do R32 (derivado dinamicamente de data/resultados/jogos.md
// e data/jogos.md). Se um jogo do R32 tem placar registrado, entra em
// R32_DECIDIDOS. Se não, entra em R32_PENDENTES.
// Empates com decisão por pênaltis são anotados em PENALTY_WINNER abaixo,
// já que o placar sozinho não diz quem avança.
// ---------------------------------------------------------------------------
const PENALTY_WINNER = {
  74: "b", // Paraguai avança sobre Alemanha
  75: "b", // Marrocos avança sobre Países Baixos
  88: "b", // Egito avança sobre Austrália
};

function derivarEstadoR32() {
  // Lê data/jogos.md (fixtures) e data/resultados/jogos.md
  const fixturesRaw = fs.readFileSync(path.join(ROOT, "data", "jogos.md"), "utf8");
  const resultsRaw = fs.readFileSync(path.join(ROOT, "data", "resultados", "jogos.md"), "utf8");

  function parseTabela(raw) {
    const out = [];
    for (const linha of raw.split("\n")) {
      const m = linha.match(/^\|\s*(\d+)\s*\|\s*([^|]+)\|\s*[^|]+\|\s*[^|]+\|\s*[^|]+\|\s*([^|]+)\|\s*([^|]*)\|\s*([^|]*)\|\s*([^|]+)\|/);
      if (!m) continue;
      const [, num, fase, timeA, gA, gB, timeB] = m;
      out.push({
        num: parseInt(num, 10),
        fase: fase.trim(),
        timeA: timeA.trim(),
        timeB: timeB.trim(),
        gA: gA.trim() === "" ? null : parseInt(gA, 10),
        gB: gB.trim() === "" ? null : parseInt(gB, 10),
      });
    }
    return out;
  }

  const fixtures = parseTabela(fixturesRaw).filter((j) => j.fase === "R32");
  const results = parseTabela(resultsRaw).filter((j) => j.fase === "R32");
  const resPorNum = new Map(results.map((r) => [r.num, r]));

  const decididos = {};
  const pendentes = [];
  for (const fx of fixtures) {
    const res = resPorNum.get(fx.num);
    if (res && res.gA != null && res.gB != null) {
      // Determina vencedor
      let vencedor;
      if (PENALTY_WINNER[fx.num]) {
        vencedor = PENALTY_WINNER[fx.num] === "a" ? fx.timeA : fx.timeB;
      } else if (res.gA > res.gB) {
        vencedor = fx.timeA;
      } else if (res.gB > res.gA) {
        vencedor = fx.timeB;
      } else {
        // Empate sem PENALTY_WINNER — não sabemos quem avança
        console.warn(`  AVISO: J${fx.num} ${fx.timeA} ${res.gA}×${res.gB} ${fx.timeB} empate sem PENALTY_WINNER — pulando`);
        continue;
      }
      decididos[fx.num] = vencedor;
    } else {
      pendentes.push({ j: fx.num, a: fx.timeA, b: fx.timeB });
    }
  }
  return { decididos, pendentes };
}

const { decididos: R32_DECIDIDOS, pendentes: R32_PENDENTES } = derivarEstadoR32();

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
    else if (t.startsWith("--dossie=")) a.dossie = t.slice(9);
    else if (t.startsWith("--sites=")) a.sites = t.slice(8).split(",");
    else if (t === "--sites" && argv[i + 1]) a.sites = argv[++i].split(",");
    // Allow --site <name> form too
    else if (t === "--site" && argv[i + 1]) a.site = argv[++i];
    else if (t === "--rodada" && argv[i + 1]) a.rodada = argv[++i];
    else if (t === "--cdp" && argv[i + 1]) a.cdp = argv[++i];
    else if (t === "--dossie" && argv[i + 1]) a.dossie = argv[++i];
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
function buildPrompt(fase, confrontos, dossie = "") {
  const linhas = confrontos.map(({ j, a, b }) => `| J${j} | ${a} vs ${b} |`).join("\n");
  const tabela = `| Jogo | Confronto |\n|------|----------|\n${linhas}`;

  const contextoBlocos = [];
  if (dossie && dossie.trim()) {
    contextoBlocos.push("## Contexto (dossiê da Copa 2026)\n");
    contextoBlocos.push(dossie.trim());
    contextoBlocos.push("\n---\n");
  }
  const contexto = contextoBlocos.join("\n");

  if (fase === "Final") {
    return [
      "Bolão Copa 2026 — Consenso de campeão (fase FINAL).\n",
      contexto,
      "Você está participando de um bolão coletivo. As fases anteriores (R32, Oitavas, Quartas, Semifinal) foram decididas por CONSENSO das IAs. Agora chegamos à FINAL:\n",
      tabela,
      "\n**USE O DOSSIÊ ACIMA como base. Não invente dados. Não pesquise novos.**\n",
      "Quem é o campeão? Responda apenas:\n",
      "- J104: NomeDoTime",
    ].filter(Boolean).join("\n");
  }

  return [
    `Bolão Copa 2026 — Consenso por fase (fase: ${fase}).\n`,
    contexto,
    "Você está participando de um bolão coletivo com outras IAs (ChatGPT, Claude, Gemini, Grok, etc.). Cada fase é decidida por CONSENSO majoritário das nossas respostas — os vencedores da fase anterior já foram consolidados, e agora precisamos decidir os desta fase.\n",
    `Confrontos desta fase (${fase}):\n\n${tabela}\n`,
    "**USE O DOSSIÊ ACIMA como base pra escolher. Não invente informações que não estão lá. Não pesquise na internet.**\n",
    "Responda **apenas com o vencedor de cada jogo**, uma linha por jogo, exatamente neste formato:\n",
    "- J{{numero}}: NomeDoTime",
    "- J{{numero}}: NomeDoTime",
    "...\n",
    "Sem comentário. Só o nome do time que avança pra próxima fase.",
  ].filter(Boolean).join("\n");
}

// Parse lines like "- J79: México" or "J79: México" from response text.
// Aceita variações comuns: "J79 -", "J79.", "J79)", "J79 →", "| J79 | México |",
// "**J79**: México", "79: México" (sem prefixo J), e também prosa tipo
// "J79 é México", "J79 avança México", "vencedor da J79: México" (Le Chat).
function parseVencedores(texto, jogosEsperados) {
  const resultado = {};
  const lines = texto.split("\n");
  const esperadosSet = new Set(jogosEsperados);
  // Regex principal: aceita J-opcional, separadores :.-)|→ e vários espaços
  // Tenta capturar o nome do time até o final da linha, delimitador de tabela,
  // parênteses de comentário ou traços/emdashes explicativos.
  const re = /(?:^|\|)\s*[*_`]*\s*(?:[Jj]ogo\s*|[Jj])?(\d{1,3})[*_`]*\s*(?:[:.)\|]|—|→|->|-)\s*[*_`]*([^\n|(—→\-]+?)\s*[*_`]*(?:\|.*|\([^)]*\).*|$)/;
  // Regex secundário (prosa): "J89 é México", "J89 avança/vence/ganha México",
  // "J89 → México", "Vencedor da J89 é México".
  const rePros = /\b[Jj](\d{1,3})\b[^.\n]*?(?:\bé\s+|\bavança\b[^.\n]*?|\bvence[m]?\b[^.\n]*?|\bganha\b[^.\n]*?|\bcomo vencedor(?:a)?\b[^.\n]*?|\b:\s*)([A-ZÁÉÍÓÚÂÊÔÃÕÇ][^.,\n(|]{2,40})/;
  const limpar = (t) => t.trim().replace(/[*_`"]/g, "").replace(/\s+/g, " ");
  const invalido = (t) =>
    !t ||
    /^(nome|time|team|equipe|todo|tbd|\?+)/i.test(t) ||
    /\s(?:vs|x|×|-)\s/i.test(t);
  for (const linha of lines) {
    let m = linha.match(re);
    if (m) {
      const num = parseInt(m[1], 10);
      if (esperadosSet.has(num)) {
        const time = limpar(m[2]);
        if (!invalido(time)) resultado[num] = time;
      }
    }
    // Fallback prosa: só usa se o regex principal não achou nada nessa linha
    if (!m) {
      const mp = linha.match(rePros);
      if (mp) {
        const num = parseInt(mp[1], 10);
        if (esperadosSet.has(num) && !resultado[num]) {
          const time = limpar(mp[2]);
          if (!invalido(time)) resultado[num] = time;
        }
      }
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

// Versão com retry — se input não achado, espera + rola pra fundo + tenta de novo.
// Alguns sites (Copilot, Manus) fazem lazy-mount do textarea; outros mostram
// modal ou o textarea some por rate-limit.
async function acharInputResiliente(page, seletores, maxTentativas = 6) {
  for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {
    const loc = await acharInput(page, seletores);
    if (loc) return loc;
    // Estratégias antes de tentar de novo
    if (tentativa === 2) {
      // Rola pro fundo pra forçar renderização
      try {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      } catch {}
    } else if (tentativa === 3) {
      // Clica no meio da página pra fechar modal/tooltip
      try {
        const vp = page.viewportSize();
        if (vp) await page.mouse.click(vp.width / 2, vp.height / 2);
      } catch {}
    } else if (tentativa === 5) {
      // Último recurso antes de desistir: reload
      try {
        await page.reload({ waitUntil: "domcontentloaded" });
      } catch {}
    }
    await page.waitForTimeout(2500);
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

async function esperarEstavel(page, cfg, { maxMs = 240000, estavelMs = 8000 } = {}) {
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

  const input = await acharInputResiliente(page, cfg.input);
  if (!input) throw new Error("Não achei caixa de texto");

  // force:true evita "not stable" / "obscured by another element" —
  // alguns sites (Manus) têm promos flutuantes que interceptam clique.
  try {
    await input.click({ force: true, timeout: 8000 });
  } catch {
    // Se o clique ainda assim falhar (elemento escondido), foca via JS
    try { await input.focus({ timeout: 3000 }); } catch {}
  }
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

// Coleta os palpites de UMA fase para o conjunto de IAs `alvo`, usando os
// MESMOS confrontos pra todas. Retorna { <slug>: { <j>: 'timeName' } }.
async function coletarFase(browser, alvo, faseNome, confrontos, dossie, dry) {
  const respostas = {};
  const prompt = buildPrompt(faseNome, confrontos, dossie);
  console.log(`\n=== FASE ${faseNome} (${confrontos.length} jogos) ===`);
  console.log(`  prompt: ${prompt.length} chars (dossiê incluído: ${dossie.length > 0})`);

  for (const key of alvo) {
    const cfg = SITES[key];
    console.log(`  [${faseNome}] ${cfg.name}...`);
    let texto = null;
    if (!dry) {
      try {
        texto = await enviarPrompt(browser, cfg, prompt, false);
      } catch (e) {
        console.log(`    FAIL: ${e.message}`);
      }
    }
    const jogosEsperados = confrontos.map((c) => c.j);
    if (!texto) {
      respostas[cfg.slug] = Object.fromEntries(jogosEsperados.map((j) => [j, "???"]));
      console.log(`    FAIL: sem resposta (timeout do driver)`);
    } else {
      respostas[cfg.slug] = parseVencedores(texto, jogosEsperados);
      const preview = jogosEsperados
        .map((j) => `J${j}=${respostas[cfg.slug][j]}`)
        .slice(0, 3)
        .join(", ");
      console.log(`    OK: ${preview}${jogosEsperados.length > 3 ? "..." : ""}`);
      const todosQQ = jogosEsperados.every((j) => respostas[cfg.slug][j] === "???");
      if (todosQQ) {
        const clip = texto.replace(/\s+/g, " ").slice(0, 500);
        console.log(`    [debug] resposta (500 chars): "${clip}${texto.length > 500 ? "…" : ""}"`);
      }
    }
    // Delay entre IAs pra evitar throttle
    await new Promise((r) => setTimeout(r, 1500));
  }
  return respostas;
}

// Consenso majoritário por confronto: pra cada j, pega o time mais votado
// entre as respostas das IAs. Retorna { <j>: 'nomeTime' }.
function consensoPorConfronto(respostas, jogosEsperados, fallbackA, fallbackB) {
  const out = {};
  for (const j of jogosEsperados) {
    const votos = Object.values(respostas)
      .map((r) => r?.[j])
      .filter((v) => v && v !== "???");
    if (!votos.length) {
      out[j] = `${fallbackA(j) || "??"} vs ${fallbackB(j) || "??"}`;
      continue;
    }
    const contagem = {};
    for (const v of votos) contagem[v] = (contagem[v] || 0) + 1;
    out[j] = Object.entries(contagem).sort((a, b) => b[1] - a[1])[0][0];
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv);
  const rodada = args.rodada || agora();
  const dir = outDir(rodada);

  console.log(`\nSimulador de Campeão (WATERFALL/consenso) — rodada ${rodada}`);
  console.log(`Output: ${path.relative(ROOT, dir)}`);

  // --cristal-only: recomputa Cristal a partir dos JSONs já gravados
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
      slug: "_resumo",
      rodada,
      campeoes: Object.fromEntries(resultados.map((r) => [r.slug, r.campeao])),
    };
    resumo.campeoes["_bola-de-cristal"] = cristal.campeao;
    salvarResultado(dir, resumo);
    console.log(`\nBola de Cristal: ${cristal.campeao}`);
    return;
  }

  // Alvo (que IAs rodar):
  //   --sites=a,b,c → lista explícita (preferido pra rodar N IAs juntas)
  //   --all → todas as IAs configuradas
  //   --site=X → uma só (útil pra debug, mas Cristal fica com 1 voto/jogo)
  const alvo = args.sites
    ? args.sites
    : args.all
    ? Object.keys(SITES)
    : args.site
    ? [args.site]
    : [];

  if (!alvo.length) {
    console.log("Nada a fazer. Use --sites=a,b,c ou --all ou --site=<nome>.");
    console.log("Sites:", Object.keys(SITES).join(", "));
    return;
  }
  console.log(`Alvo: ${alvo.length} IAs — ${alvo.join(", ")}`);

  for (const key of alvo) {
    if (!SITES[key]) {
      console.error(`Site desconhecido: ${key}.`);
      process.exit(1);
    }
  }

  // Carrega dossiê (--dossie=<path> ou default data/dossie/campeao-<rodada>.md)
  const dossiePath =
    args.dossie ||
    path.join(ROOT, "data", "dossie", `campeao-${rodada.slice(0, 10)}.md`);
  let dossie = "";
  if (fs.existsSync(dossiePath)) {
    dossie = fs.readFileSync(dossiePath, "utf8");
    console.log(`Dossiê carregado: ${path.relative(ROOT, dossiePath)} (${dossie.length} chars)`);
  } else {
    console.log(`AVISO: dossiê não encontrado em ${path.relative(ROOT, dossiePath)}. Rodando SEM contexto extra.`);
  }

  if (args.dry) console.log("[--dry] modo seco: não envia nada.");

  let browser;
  if (!args.dry) {
    for (let tent = 1; tent <= 2 && !browser; tent++) {
      try {
        browser = await chromium.connectOverCDP(args.cdp, { timeout: 90000 });
      } catch (e) {
        if (tent === 2) {
          console.error(`\nNão consegui conectar via CDP em ${args.cdp}`);
          console.error(`Detalhe: ${e.message}\n`);
          process.exit(1);
        }
        console.error(`  CDP falhou (tentativa ${tent}/2) — retentando...`);
      }
    }
  }

  // --- Estado ---
  //   jornadas[slug][fase][j] = time (o palpite dessa IA pra esse confronto)
  //   cristalJornada[fase][j] = consenso majoritário
  //   vencedores[j] = time que o consenso mandou pra próxima fase
  const jornadas = {};
  const cristalJornada = {};
  const vencedores = { ...R32_DECIDIDOS };

  // Inicializa jornadas de cada IA com os R32 decididos IRL
  for (const key of alvo) {
    const cfg = SITES[key];
    jornadas[cfg.slug] = { R32: { ...R32_DECIDIDOS } };
  }
  cristalJornada.R32 = { ...R32_DECIDIDOS };

  // --- RESUME: se já existem arquivos na rodada, carrega o estado ---
  // Uma fase é "concluída" se cristalJornada[fase] tem TODOS os jogos e nenhum é "???".
  // Cada IA carrega a jornada até onde tem dado; se a IA falhou em algum passo, aquela
  // fase pode ficar ??? mas não impede o resume — só é ??? pra ela.
  if (fs.existsSync(dir)) {
    console.log(`\n[RESUME] Carregando estado existente de ${path.relative(ROOT, dir)}`);
    try {
      const cristalPath = path.join(dir, "_bola-de-cristal.json");
      if (fs.existsSync(cristalPath)) {
        const cd = JSON.parse(fs.readFileSync(cristalPath, "utf8"));
        for (const [fase, jogs] of Object.entries(cd.jornada || {})) {
          const jogosArr = Object.values(jogs);
          // Rejeita fase se algum valor for "???" OU contém " vs " (fallback quando
          // ninguém votou coerentemente — significa que a fase FALHOU).
          const invalido = (v) => !v || v === "???" || / vs /i.test(v) || / x /i.test(v);
          const completa = jogosArr.length > 0 && !jogosArr.some(invalido);
          if (completa) {
            cristalJornada[fase] = { ...jogs };
            for (const [j, t] of Object.entries(jogs)) vencedores[j] = t;
            console.log(`  [RESUME] fase ${fase} já completa (consenso preservado)`);
          }
        }
      }
      // Carrega jornada de cada IA
      for (const key of alvo) {
        const cfg = SITES[key];
        const iap = path.join(dir, `${cfg.slug}.json`);
        if (fs.existsSync(iap)) {
          const ad = JSON.parse(fs.readFileSync(iap, "utf8"));
          for (const [fase, jogs] of Object.entries(ad.jornada || {})) {
            const jogosArr = Object.values(jogs);
            const completa = jogosArr.length > 0 && jogosArr.every((v) => v && v !== "???");
            if (completa && cristalJornada[fase]) {
              // Só preserva se a fase está no consenso (evita resgatar respostas mixed)
              jornadas[cfg.slug][fase] = { ...jogs };
            }
          }
        }
      }
    } catch (e) {
      console.warn(`  [RESUME] falhou lendo estado: ${e.message}. Recomeça do zero.`);
    }
  }

  // Salva snapshot incremental — se algo travar no meio, temos até essa fase
  function persistirSnapshot() {
    ensureDir(dir);
    const rodadaEm = new Date().toISOString().slice(0, 19);
    for (const key of alvo) {
      const cfg = SITES[key];
      const campeao = jornadas[cfg.slug]?.Final?.[104] || "???";
      salvarResultado(dir, {
        slug: cfg.slug,
        rodada_em: rodadaEm,
        campeao,
        jornada: jornadas[cfg.slug] || {},
      });
    }
    const cristalCampeao = cristalJornada.Final?.[104] || "???";
    salvarResultado(dir, {
      slug: "_bola-de-cristal",
      rodada_em: rodadaEm,
      campeao: cristalCampeao,
      jornada: cristalJornada,
      votos_totais: alvo.length,
    });
  }

  // --- Fase R32 (pendentes) ---
  const r32JaCompleta =
    cristalJornada.R32 &&
    R32_PENDENTES.every((c) => cristalJornada.R32[c.j] && cristalJornada.R32[c.j] !== "???");
  if (R32_PENDENTES.length > 0 && !r32JaCompleta) {
    const respostasR32 = await coletarFase(
      browser,
      alvo,
      "R32 (16-avos, pendentes)",
      R32_PENDENTES,
      dossie,
      args.dry,
    );
    const jogosPendentes = R32_PENDENTES.map((c) => c.j);
    const fallbackA = (j) => R32_PENDENTES.find((c) => c.j === j)?.a;
    const fallbackB = (j) => R32_PENDENTES.find((c) => c.j === j)?.b;
    const consensoR32 = consensoPorConfronto(respostasR32, jogosPendentes, fallbackA, fallbackB);
    console.log(`  [R32 consenso] ${JSON.stringify(consensoR32)}`);
    // Atualiza cristal e vencedores
    for (const j of jogosPendentes) {
      cristalJornada.R32[j] = consensoR32[j];
      vencedores[j] = consensoR32[j];
    }
    // Atualiza jornada de cada IA (R32 = decididos IRL + palpite dela pros pendentes)
    for (const key of alvo) {
      const cfg = SITES[key];
      for (const j of jogosPendentes) {
        jornadas[cfg.slug].R32[j] = respostasR32[cfg.slug]?.[j] || "???";
      }
    }
    persistirSnapshot();
  } else if (r32JaCompleta) {
    console.log("\n[R32] fase já consolidada no snapshot — pulando (--resume).");
  } else {
    console.log("\n[R32] sem pendentes — todos decididos IRL.");
  }

  // --- Fases seguintes (Oitavas → Final) ---
  for (const fase of FASES) {
    // Confrontos derivam dos vencedores acumulados (consenso das fases anteriores)
    const confrontos = fase.jogos.map(({ j, wa, wb }) => ({
      j,
      a: vencedores[wa] || `Venc.J${wa}`,
      b: vencedores[wb] || `Venc.J${wb}`,
    }));

    // Skip se essa fase já está consolidada no cristal
    const jaFeita =
      cristalJornada[fase.nome] &&
      fase.jogos.every(
        (c) => cristalJornada[fase.nome][c.j] && cristalJornada[fase.nome][c.j] !== "???",
      );
    if (jaFeita) {
      console.log(`\n[${fase.nome}] fase já consolidada — pulando (--resume).`);
      continue;
    }

    const respostas = await coletarFase(
      browser,
      alvo,
      fase.nome,
      confrontos,
      dossie,
      args.dry,
    );

    const jogos = confrontos.map((c) => c.j);
    const faA = (j) => confrontos.find((c) => c.j === j)?.a;
    const faB = (j) => confrontos.find((c) => c.j === j)?.b;
    const consenso = consensoPorConfronto(respostas, jogos, faA, faB);
    console.log(`  [${fase.nome} consenso] ${JSON.stringify(consenso)}`);

    cristalJornada[fase.nome] = consenso;
    for (const j of jogos) vencedores[j] = consenso[j];

    for (const key of alvo) {
      const cfg = SITES[key];
      jornadas[cfg.slug][fase.nome] = respostas[cfg.slug] || {};
    }
    persistirSnapshot();
  }

  // --- Resumo final ---
  const resumo = {
    slug: "_resumo",
    rodada,
    campeoes: {},
  };
  for (const key of alvo) {
    const cfg = SITES[key];
    resumo.campeoes[cfg.slug] = jornadas[cfg.slug]?.Final?.[104] || "???";
  }
  resumo.campeoes["_bola-de-cristal"] = cristalJornada.Final?.[104] || "???";
  salvarResultado(dir, resumo);

  console.log("\n--- RESUMO ---");
  for (const [slug, camp] of Object.entries(resumo.campeoes)) {
    console.log(`  ${slug}: ${camp}`);
  }

  if (browser) await browser.close();
  console.log("\nfim.");
}

// Playwright às vezes cospe erros não capturados de dialog interno (Meta AI é
// o principal culpado). Não deixamos que isso mate o processo inteiro.
process.on("unhandledRejection", (reason) => {
  const msg = reason instanceof Error ? reason.message : String(reason);
  console.warn(`  [unhandledRejection ignorado] ${msg.slice(0, 200)}`);
});
process.on("uncaughtException", (err) => {
  console.warn(`  [uncaughtException ignorado] ${err.message.slice(0, 200)}`);
});

main().catch((e) => {
  console.error("Erro fatal:", e.message);
  process.exit(1);
});
