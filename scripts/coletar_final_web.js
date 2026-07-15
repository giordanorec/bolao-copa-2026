#!/usr/bin/env node
/*
 * Coleta os jogos FINAIS (103-104) via interface WEB, dirigindo o Chrome do
 * usuário via CDP.
 *
 * Pré-requisito: o Chrome precisa estar rodando com a porta de debug aberta.
 * Use o launcher (contorna o bloqueio do Chrome 136+ no perfil padrão):
 *   powershell -ExecutionPolicy Bypass -File scripts/abrir_chrome_debug.ps1 -Profile "Profile 7"
 *
 * O script NÃO fecha o navegador nem mexe em abas que não sejam a IA-alvo.
 * Para cada site: acha a aba da conversa já aberta (casa pelo id da conversa,
 * senão pelo host, senão abre a URL da conversa), cola o prompt final-web,
 * envia, espera a resposta terminar, extrai o texto e salva em
 * data/palpites_final/<slug>-web.md. Não commita nada.
 *
 * Uso:
 *   node scripts/coletar_final_web.js --list                 # lista abas abertas (diagnóstico)
 *   node scripts/coletar_final_web.js --site grok            # roda 1 site
 *   node scripts/coletar_final_web.js --site grok --dry      # cola mas NÃO envia
 *   node scripts/coletar_final_web.js --all                  # roda todos, um a um
 *   node scripts/coletar_final_web.js --cdp http://localhost:9222
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SHOTS = path.join(ROOT, "scripts", "_shots");
const { chromium } = require(path.join(ROOT, "v4", "node_modules", "playwright"));

const PROMPT_PATH = path.join(ROOT, "config", "prompts", "ia-palpiteira-final-web.md");
const RESULTADOS_PATH = path.join(ROOT, "data", "resultados", "jogos.md");
const OUT_DIR = path.join(ROOT, "data", "palpites_final");

// 2 jogos finais (103-104)
const MM_JOGOS = [103, 104];
const LIMIAR = 2;

// URL que abre uma CONVERSA NOVA (sem contexto anterior) por host. Usado com
// --new: as conversas antigas contêm a tabela com adversários de fases
// anteriores; reaproveitá-las faz a IA repreencher a estrutura velha. Chat
// novo = zero contaminação.
const NEW_CHAT = {
  "chatgpt.com": "https://chatgpt.com/",
  "claude.ai": "https://claude.ai/new",
  "gemini.google.com": "https://gemini.google.com/u/1/app",
  "grok.com": "https://grok.com/",
  "deepseek.com": "https://chat.deepseek.com/",
  "copilot.microsoft.com": "https://copilot.microsoft.com/",
  "perplexity.ai": "https://www.perplexity.ai/",
  "chat.mistral.ai": "https://chat.mistral.ai/chat",
  "meta.ai": "https://www.meta.ai/",
  "qwen.ai": "https://chat.qwen.ai/",
  "manus.im": "https://manus.im/app",
};

// ---------------------------------------------------------------------------
// Config por site. url = link da conversa específica (recupera contexto anterior).
// conv = trecho distintivo da URL pra casar a aba já aberta.
// input: seletores tentados em ordem. send: "enter" | "ctrlenter".
// assistant: seletor das mensagens da IA (pega a última). stop: botão de gerar.
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
    modo: "Deep Research / Thinking",
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
    modo: "Extended Thinking + Web Search",
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
    modo: "Deep Research",
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
    modo: "DeepSearch + Think",
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
    modo: "DeepThink (R1) + Search",
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
    modo: "Think Deeper",
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
    modo: "Pro / Research",
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
    modo: "Think + Web",
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
    modo: "nativo",
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
    modo: "Thinking + Web",
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
    modo: "Agent",
  },
};

// ----------------------------- helpers --------------------------------------

function parseArgs(argv) {
  const a = { cdp: "http://localhost:9222" };
  for (let i = 2; i < argv.length; i++) {
    const t = argv[i];
    if (t === "--list") a.list = true;
    else if (t === "--inspect") a.inspect = true;
    else if (t === "--run") a.run = true;
    else if (t === "--collect") a.collect = true;
    else if (t === "--all") a.all = true;
    else if (t === "--dry") a.dry = true;   // cola mas NÃO envia
    else if (t === "--new") a.new = true;   // abre CHAT NOVO (sem contexto anterior)
    else if (t === "--nowait") a.nowait = true; // envia mas NÃO espera
    else if (t === "--site") a.site = argv[++i];
    else if (t === "--cdp") a.cdp = argv[++i];
    else if (t === "--prompt") a.prompt = argv[++i];
    else if (t === "--attach") a.attach = argv[++i]; // arquivo pra anexar antes de enviar
  }
  return a;
}

function tabelaResultados() {
  if (!fs.existsSync(RESULTADOS_PATH)) return "(sem resultados disponíveis)";
  const linhas = fs.readFileSync(RESULTADOS_PATH, "utf8")
    .split("\n")
    .filter((ln) => ln.trim().startsWith("|"));
  return linhas.length ? linhas.join("\n") : "(sem resultados disponíveis)";
}

function montarPrompt(customPath) {
  const p = customPath ? path.resolve(ROOT, customPath) : PROMPT_PATH;
  let base = fs.readFileSync(p, "utf8");
  // Remove o cabeçalho de instrução para o operador (tudo até a linha "---")
  const idx = base.indexOf("\n---\n");
  if (idx > 0) base = base.slice(idx + 5);
  base = base.replace("{{RESULTADOS}}", tabelaResultados());
  base = base.replace("{{PALPITES_PREVIOS}}", "(n/a)");
  return base;
}

function salvar(slug, modo, conteudo) {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const arq = path.join(OUT_DIR, `${slug}.md`);
  const agora = new Date().toISOString().slice(0, 19);
  const head = [
    `<!-- ia: ${slug} -->`,
    `<!-- slug: ${slug} -->`,
    "<!-- versao: final -->",
    "<!-- fase: Final -->",
    "<!-- modo: web -->",
    `<!-- modo_avancado: ${modo} -->`,
    `<!-- coletado_em: ${agora} -->`,
    "<!-- status: palpitou via interface web -->",
    "",
    `# Palpite Final — ${slug} (interface web)`,
    "",
    "",
  ].join("\n");
  fs.writeFileSync(arq, head + conteudo.trim() + "\n", "utf8");
  return arq;
}

async function acharPagina(browser, cfg, { fresh = false, inPlace = false } = {}) {
  const pages = [];
  for (const ctx of browser.contexts()) {
    for (const pg of ctx.pages()) {
      try { pages.push(pg); } catch {}
    }
  }
  // inPlace: lê a aba atual do host SEM navegar (preserva o chat novo aberto pelo
  // --new --nowait, cuja URL já mudou). Usado por --collect após disparar.
  if (inPlace) {
    for (const pg of pages) {
      try { if (pg.url().includes(cfg.host)) return pg; } catch {}
    }
  }
  // --new: SEMPRE abre conversa nova (sem contexto). Reaproveita a aba logada do
  // mesmo host (mantém a sessão) navegando pra URL de chat novo; senão abre aba.
  if (fresh) {
    const destino = NEW_CHAT[cfg.host] || cfg.url;
    for (const pg of pages) {
      try {
        if (pg.url().includes(cfg.host)) {
          await pg.goto(destino, { waitUntil: "domcontentloaded" });
          await pg.waitForTimeout(3500);
          return pg;
        }
      } catch {}
    }
    const ctxN = browser.contexts()[0];
    const pgN = await ctxN.newPage();
    await pgN.goto(destino, { waitUntil: "domcontentloaded" });
    await pgN.waitForTimeout(3500);
    return pgN;
  }
  // 1) já está na conversa específica (id casa) -> usa direto
  for (const pg of pages) {
    try { if (cfg.conv && pg.url().includes(cfg.conv)) return pg; } catch {}
  }
  // 2) aba logada do mesmo host -> NAVEGA pra conversa específica (reaproveita sessão)
  for (const pg of pages) {
    try {
      if (pg.url().includes(cfg.host)) {
        await pg.goto(cfg.url, { waitUntil: "domcontentloaded" });
        await pg.waitForTimeout(3000);
        return pg;
      }
    } catch {}
  }
  // 3) abre a URL da conversa numa aba nova
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

// Serializa a resposta da última mensagem da IA em markdown.
// Prioriza <table> renderizada (reconstrói pipes); depois bloco de código com
// pipes; por último innerText. Retorna {md, via, hits, rows}.
// Limiar principal: hits >= 2 (os 2 jogos finais).
async function extrairResposta(page, cfg) {
  return await page.evaluate(({ sel, jogos, limiar }) => {
    function tableToMd(tbl) {
      const linhas = [];
      for (const tr of tbl.querySelectorAll("tr")) {
        const cells = [...tr.querySelectorAll("th,td")].map((c) =>
          (c.innerText || "").replace(/\s+/g, " ").trim()
        );
        if (cells.length) linhas.push("| " + cells.join(" | ") + " |");
      }
      return linhas.join("\n");
    }
    function contaJogos(md) {
      let n = 0;
      for (const j of jogos) {
        if (new RegExp("(^|\\|)\\s*" + j + "\\s*\\|", "m").test(md)) n++;
      }
      return n;
    }
    // escolhe a melhor <table> dentro de um escopo (mais jogos, depois mais linhas)
    function melhorTabela(scope) {
      let best = null, bestHits = -1, bestRows = -1;
      for (const t of scope.querySelectorAll("table")) {
        const md = tableToMd(t);
        const h = contaJogos(md);
        const r = t.querySelectorAll("tr").length;
        if (h > bestHits || (h === bestHits && r > bestRows)) {
          best = { md, hits: h, rows: r }; bestHits = h; bestRows = r;
        }
      }
      return best;
    }
    const nodes = document.querySelectorAll(sel);
    const el = nodes[nodes.length - 1];
    // 1) tabela dentro da última mensagem do assistente
    if (el) {
      const b = melhorTabela(el);
      if (b && b.hits >= limiar) return { md: b.md, via: "table", hits: b.hits, rows: b.rows };
    }
    // 2) fallback: melhor tabela do documento inteiro
    const docB = melhorTabela(document);
    if (docB && docB.hits >= 1) {
      return { md: docB.md, via: "table", hits: docB.hits, rows: docB.rows };
    }
    // 2b) tabela renderizada como divs (Le Chat): innerText vem 1 célula por linha.
    // Âncora: número do jogo seguido de uma linha "3º lugar"/"Final" -> 9 células por jogo.
    function reconstruirLinhas(text) {
      const ls = (text || "").split("\n").map((s) => s.replace(/\s+/g, " ").trim()).filter(Boolean);
      const jset = new Set(jogos.map(String));
      const porJogo = {};
      for (let i = 0; i < ls.length; i++) {
        if (jset.has(ls[i]) && /^(3.?\s*lugar|Final|Semis|Quartas)\b/i.test(ls[i + 1] || "")) {
          const cells = ls.slice(i, i + 9);
          if (cells.length === 9) porJogo[ls[i]] = "| " + cells.join(" | ") + " |";
        }
      }
      return jogos.map((j) => porJogo[String(j)]).filter(Boolean);
    }
    const scopeTxt = (el && el.innerText) || (document.querySelector("main") || document.body).innerText;
    const recon = reconstruirLinhas(scopeTxt);
    if (recon.length >= 1) {
      const header = "| Jogo | Fase | Data | Hora | Local | Time A | Gols A | Gols B | Time B |";
      const md = header + "\n" + recon.join("\n");
      return { md, via: "linhas", hits: contaJogos(md), rows: recon.length };
    }
    // 2c) markdown em texto com pipes (Manus): extrai 9 células por jogo via regex.
    function parsePipesMd(text) {
      const flat = (text || "").replace(/\s+/g, " ");
      const jset = new Set(jogos.map(String));
      const re = /\|\s*(\d+)\s*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|([^|]*)\|\s*(-?\d+)\s*\|\s*(-?\d+)\s*\|([^|]*)\|/g;
      const porJogo = {};
      let m;
      while ((m = re.exec(flat))) {
        const j = m[1];
        if (!jset.has(j)) continue;
        const cells = [j, "", "", "", "", m[2].trim(), m[3].trim(), m[4].trim(), m[5].trim()];
        porJogo[j] = "| " + cells.join(" | ") + " |";
      }
      return jogos.map((j) => porJogo[String(j)]).filter(Boolean);
    }
    const md2 = parsePipesMd((document.querySelector("main") || document.body).innerText);
    if (md2.length >= 1) {
      const header = "| Jogo | Fase | Data | Hora | Local | Time A | Gols A | Gols B | Time B |";
      const md = header + "\n" + md2.join("\n");
      return { md, via: "md", hits: contaJogos(md), rows: md2.length };
    }
    // 3) tabela parcial dentro da mensagem (hits<limiar mas existe)
    if (el) {
      const b = melhorTabela(el);
      if (b && b.rows > 1) return { md: b.md, via: "table", hits: b.hits, rows: b.rows };
      // bloco de código com pipes (tabela em markdown cru)
      for (const c of el.querySelectorAll("pre,code")) {
        const t = c.innerText || "";
        if (/\|/.test(t) && contaJogos(t) >= 1) {
          return { md: t, via: "code", hits: contaJogos(t), rows: t.split("\n").length };
        }
      }
      const txt = el.innerText || "";
      return { md: txt, via: "text", hits: contaJogos(txt), rows: txt.split("\n").length };
    }
    return { md: "", via: "none", hits: 0, rows: 0 };
  }, { sel: cfg.assistant, jogos: MM_JOGOS, limiar: LIMIAR });
}

async function esperarFim(page, cfg, { maxMs = 900000, estavelMs = 6000 } = {}) {
  // Pronto quando: (a) há tabela/código com os 2 jogos e ficou estável; ou
  // (b) não há botão de stop e o texto ficou estável (fallback).
  const t0 = Date.now();
  let ultimo = "";
  let estavelDesde = Date.now();
  let melhor = { md: "", hits: 0, via: "none" };
  while (Date.now() - t0 < maxMs) {
    await page.waitForTimeout(2500);
    let gerando = false;
    if (cfg.stop) {
      try { gerando = await page.locator(cfg.stop).first().isVisible({ timeout: 500 }); } catch {}
    }
    let r = { md: "", hits: 0, via: "none" };
    try { r = await extrairResposta(page, cfg); } catch {}
    if (r.hits >= melhor.hits && r.md.length >= melhor.md.length) melhor = r;
    if (r.md && r.md !== ultimo) { ultimo = r.md; estavelDesde = Date.now(); }
    const estavel = Date.now() - estavelDesde > estavelMs;
    const estruturado = (r.via === "table" || r.via === "code" || r.via === "linhas" || r.via === "md") && r.hits >= LIMIAR;
    if (estruturado && estavel) return r.md;
    if (!gerando && estavel && r.hits >= LIMIAR) return r.md;
  }
  return melhor.md || ultimo;
}

async function extrairUltima(page, cfg) {
  try {
    const r = await extrairResposta(page, cfg);
    if (r.md && r.md.trim()) return r.md;
  } catch {}
  try {
    return await page.locator("main").last().innerText({ timeout: 2000 });
  } catch {}
  return await page.evaluate(() => document.body.innerText);
}

async function shot(page, nome) {
  if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS, { recursive: true });
  const p = path.join(SHOTS, `${nome}.png`);
  try { await page.screenshot({ path: p, fullPage: false }); } catch {}
  return p;
}

async function inspecionar(browser, key) {
  const cfg = SITES[key];
  if (!cfg) { console.log(`?? site desconhecido: ${key}`); return; }
  console.log(`\n=== INSPECT ${key} (${cfg.slug}) ===`);
  const page = await acharPagina(browser, cfg);
  await page.bringToFront();
  await page.waitForTimeout(2000);
  console.log(`  url:   ${page.url()}`);
  try { console.log(`  title: ${await page.title()}`); } catch {}
  for (const sel of cfg.input) {
    let n = 0, vis = false;
    try { n = await page.locator(sel).count(); } catch {}
    try { vis = n > 0 && (await page.locator(sel).last().isVisible({ timeout: 800 })); } catch {}
    console.log(`  input "${sel}": count=${n} visível=${vis}`);
  }
  if (cfg.stop) {
    let n = 0; try { n = await page.locator(cfg.stop).count(); } catch {}
    console.log(`  stop  "${cfg.stop}": count=${n}`);
  }
  const p = await shot(page, `${cfg.slug}-inspect`);
  console.log(`  screenshot: ${path.relative(ROOT, p)}`);
}

// Só extrai + salva a resposta atual (sem recolar/reenviar).
async function coletarSite(browser, key, args) {
  const cfg = SITES[key];
  if (!cfg) { console.log(`  ?? site desconhecido: ${key}`); return; }
  console.log(`\n=== COLLECT ${key} (${cfg.slug})${args && args.new ? " [IN-PLACE]" : ""} ===`);
  const page = await acharPagina(browser, cfg, { inPlace: !!(args && args.new) });
  await page.bringToFront();
  await page.waitForTimeout(1500);
  const r = await extrairResposta(page, cfg);
  console.log(`  via=${r.via} jogos=${r.hits} linhas=${r.rows} chars=${r.md.length}`);
  if (r.hits < LIMIAR) {
    console.log("  !! menos de 2 jogos — pode ainda estar gerando. esperando...");
    const md = await esperarFim(page, cfg, { maxMs: 600000 });
    const arq = salvar(cfg.slug, cfg.modo, md);
    await shot(page, `${cfg.slug}-done`);
    console.log(`  salvo: ${path.relative(ROOT, arq)} (${md.length} chars)`);
    return;
  }
  const arq = salvar(cfg.slug, cfg.modo, r.md);
  await shot(page, `${cfg.slug}-done`);
  console.log(`  salvo: ${path.relative(ROOT, arq)} (${r.md.length} chars)`);
}

async function rodarSite(browser, key, args) {
  const cfg = SITES[key];
  if (!cfg) { console.log(`  ?? site desconhecido: ${key}`); return; }
  console.log(`\n=== RUN ${key} (${cfg.slug})${args.dry ? " [DRY]" : ""}${args.new ? " [NEW CHAT]" : ""} ===`);
  const page = await acharPagina(browser, cfg, { fresh: !!args.new });
  await page.bringToFront();
  await page.waitForTimeout(1500);
  console.log(`  aba: ${page.url()}`);

  const prompt = montarPrompt(args.prompt);
  // SPAs pesadas (gemini/grok/meta) montam o editor depois do load. Em chat novo,
  // tenta achar a caixa por até ~24s antes de desistir.
  let input = await acharInput(page, cfg.input);
  if (!input && args.new) {
    for (let t = 0; t < 8 && !input; t++) {
      await page.waitForTimeout(3000);
      input = await acharInput(page, cfg.input);
    }
  }
  if (!input) {
    console.log("  !! não achei a caixa de texto. screenshot pra diagnóstico:");
    console.log("     " + path.relative(ROOT, await shot(page, `${cfg.slug}-NOINPUT`)));
    return;
  }
  await input.click();
  await page.waitForTimeout(300);
  // --attach: sobe arquivo via input[type=file] (Manus 3k / Copilot 10k não cabem inline).
  if (args.attach) {
    const abs = path.isAbsolute(args.attach) ? args.attach : path.resolve(ROOT, args.attach);
    try {
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(abs, { timeout: 15000 });
      console.log("  arquivo anexado: " + path.relative(ROOT, abs));
      await page.waitForTimeout(6000); // upload UI + preview
    } catch (e) {
      console.log("  !! falha ao anexar: " + e.message.split("\n")[0]);
    }
    await input.click();
    await page.waitForTimeout(300);
  }
  // Limpa qualquer conteúdo pré-existente na caixa (evita acumular prompts anteriores).
  await page.keyboard.press("Control+A");
  await page.waitForTimeout(100);
  await page.keyboard.press("Delete");
  await page.waitForTimeout(200);
  await page.keyboard.insertText(prompt);
  await page.waitForTimeout(500);
  console.log("  prompt colado. screenshot: " + path.relative(ROOT, await shot(page, `${cfg.slug}-pasted`)));

  if (args.dry) {
    console.log("  [--dry] NÃO enviei. (confira o screenshot / a tela)");
    return;
  }

  if (cfg.send === "ctrlenter") await page.keyboard.press("Control+Enter");
  else await page.keyboard.press("Enter");
  console.log("  enviado.");

  if (args.nowait) {
    await page.waitForTimeout(2500);
    console.log("  [--nowait] não esperei. screenshot: " + path.relative(ROOT, await shot(page, `${cfg.slug}-sent`)));
    return;
  }
  console.log("  aguardando resposta...");

  const resp = await esperarFim(page, cfg);
  const texto = resp && resp.length > 20 ? resp : await extrairUltima(page, cfg);
  const arq = salvar(cfg.slug, cfg.modo, texto);
  await shot(page, `${cfg.slug}-done`);
  const chk = await extrairResposta(page, cfg);
  console.log(`  salvo: ${path.relative(ROOT, arq)} (${texto.length} chars) via=${chk.via} jogos=${chk.hits}`);
}

async function main() {
  const args = parseArgs(process.argv);
  let browser;
  // connectOverCDP às vezes estoura o default de 30s enumerando todos os targets
  // (service workers, iframes, omnibox popup do Chrome). Damos timeout folgado e
  // 1 retry antes de desistir.
  for (let tent = 1; tent <= 3 && !browser; tent++) {
    try {
      browser = await chromium.connectOverCDP(args.cdp, { timeout: 180000 });
    } catch (e) {
      if (tent === 3) {
        console.error(`\nNão consegui conectar via CDP em ${args.cdp}`);
        console.error('Abra o Chrome com: scripts/abrir_chrome_debug.ps1 -Profile "Profile 7"');
        console.error(`Detalhe: ${e.message}\n`);
        process.exit(1);
      }
      console.error(`  conexão CDP falhou (tentativa ${tent}/3): ${e.message.split("\n")[0]} — retentando...`);
    }
  }

  if (args.list) {
    console.log("Abas abertas (todos os contextos):");
    for (const ctx of browser.contexts()) {
      for (const pg of ctx.pages()) {
        let title = "";
        try { title = await pg.title(); } catch {}
        console.log(`  - ${pg.url()}   « ${title} »`);
      }
    }
    await browser.close();
    return;
  }

  const alvo = args.all ? Object.keys(SITES) : args.site ? [args.site] : [];
  if (alvo.length === 0) {
    console.log("nada a fazer. use --inspect/--run com --site <nome> ou --all.");
    console.log("sites:", Object.keys(SITES).join(", "));
    await browser.close();
    return;
  }

  for (const key of alvo) {
    try {
      if (args.inspect) await inspecionar(browser, key);
      else if (args.collect) await coletarSite(browser, key, args);
      else await rodarSite(browser, key, args); // --run (ou default com --site)
    } catch (e) {
      console.error(`  FAIL ${key}: ${e.message}`);
    }
  }

  await browser.close(); // só desconecta; não fecha o Chrome do usuário
  console.log("\nfim. (nada foi commitado)");
}

main();
