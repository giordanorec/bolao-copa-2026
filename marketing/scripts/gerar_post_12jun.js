/**
 * Post 12/jun: "A IA cravou ontem. E hoje?"
 * Surfa o acerto do Cristal no Mexico 2x0 + preview dos jogos da rodada.
 *
 * Saida: ../Post_jun12/01-capa.png ... 07-cta.png
 * Uso: node marketing/scripts/gerar_post_12jun.js
 */

const fs = require("fs");
const path = require("path");

const V4_ROOT = path.resolve(__dirname, "../../v4");
const { chromium } = require(path.join(V4_ROOT, "node_modules", "playwright"));
const MASCOTS_DIR = path.join(V4_ROOT, "public", "mascots");
const LOGOS_DIR = path.join(V4_ROOT, "public", "logos");
const OUT = path.resolve(__dirname, "..", "Post_jun12");

const SITE = "bolao.arenadasias.com.br";
const INSTA = "@arena.das.ias";

function mascotPng(slug) {
  const arq = path.join(MASCOTS_DIR, `${slug}.png`);
  if (!fs.existsSync(arq)) return "";
  return fs.readFileSync(arq).toString("base64");
}

function logoSvg(familia) {
  const arq = path.join(LOGOS_DIR, `${familia}.svg`);
  if (!fs.existsSync(arq)) return "";
  return fs.readFileSync(arq).toString("base64");
}

// Bandeirinhas via emoji unicode (mais simples que SVG)
const BANDEIRAS = {
  Mexico: "🇲🇽",
  AfricaSul: "🇿🇦",
  CoreiaSul: "🇰🇷",
  Tcheca: "🇨🇿",
  Canada: "🇨🇦",
  Bosnia: "🇧🇦",
  EUA: "🇺🇸",
  Paraguai: "🇵🇾",
};

const BASE_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1080px; height: 1080px;
    font-family: 'Inter', -apple-system, 'Segoe UI', system-ui, sans-serif;
    color: #fff;
    background: #1a1238;
    overflow: hidden; position: relative;
  }
  body::before {
    content: ""; position: absolute; inset: 0;
    background:
      radial-gradient(ellipse at top left, rgba(168, 85, 247, 0.35), transparent 55%),
      radial-gradient(ellipse at bottom right, rgba(236, 72, 153, 0.25), transparent 55%),
      radial-gradient(ellipse at center, rgba(16, 185, 129, 0.12), transparent 65%);
    pointer-events: none;
  }
  body::after {
    content: ""; position: absolute; top: 0; left: 0; right: 0; height: 8px;
    background: linear-gradient(90deg, #a855f7 0%, #ec4899 50%, #10b981 100%);
  }
  .wrap {
    position: relative; z-index: 2;
    padding: 56px 64px;
    height: 100%;
    display: flex; flex-direction: column;
  }
  .brand-mini {
    display: flex; align-items: center; gap: 12px;
    font-size: 20px; font-weight: 800;
    color: #fff; letter-spacing: -0.01em;
  }
  .brand-mini .ball { font-size: 34px; transform: rotate(-8deg); }
  .pip {
    display: inline-flex; padding: 8px 22px;
    background: rgba(168, 85, 247, 0.2);
    color: #e9d5ff;
    border: 1px solid rgba(168, 85, 247, 0.4);
    font-family: 'JetBrains Mono', monospace;
    font-weight: 800; font-size: 16px;
    border-radius: 999px; letter-spacing: 0.08em;
    align-self: center;
  }
  .rodape {
    margin-top: auto;
    display: flex; align-items: center; justify-content: space-between;
    padding-top: 18px;
    border-top: 2px dashed rgba(255,255,255,0.18);
  }
  .pill {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 14px 22px; border-radius: 999px;
    font-size: 18px; font-weight: 800; color: #fff;
  }
  .pill-site { background: linear-gradient(135deg, #009C3B, #00C04A); }
  .pill-insta { background: linear-gradient(135deg, #F58529, #DD2A7B, #8134AF); }
  .pills { display: flex; gap: 12px; }
  .arraste { font-size: 18px; font-weight: 800; color: #e9d5ff; letter-spacing: 0.04em; }
`;

function brandMini() {
  return `<div class="brand-mini"><span class="ball">⚽</span><span>Bolão das IAs</span></div>`;
}
function rodape() {
  return `<div class="rodape">
    <div class="pills">
      <span class="pill pill-site">🌐 ${SITE}</span>
      <span class="pill pill-insta">📷 ${INSTA}</span>
    </div>
    <span class="arraste">ARRASTE →</span>
  </div>`;
}

// ---------- 1. CAPA ----------
function htmlCapa() {
  return `<html><head><style>${BASE_CSS}
    .capa-conteudo {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 22px;
    }
    .capa-cristal {
      font-size: 180px; line-height: 1;
      filter: drop-shadow(0 0 60px rgba(168, 85, 247, 0.7));
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
    .capa-titulo {
      font-size: 90px; font-weight: 900;
      text-align: center; line-height: 1.0;
      letter-spacing: -0.03em;
      color: #fff;
    }
    .capa-titulo .strong {
      background: linear-gradient(90deg, #10b981, #34d399);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
    .capa-titulo .roxo {
      background: linear-gradient(90deg, #a855f7, #ec4899);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
    .capa-sub {
      font-size: 32px; font-weight: 600;
      color: #e9d5ff; text-align: center;
      max-width: 800px; line-height: 1.4;
    }
    .capa-sparkles { position: absolute; inset: 0; pointer-events: none; }
    .capa-sparkles span { position: absolute; font-size: 36px; opacity: 0.5; }
  </style></head>
  <body>
    <div class="capa-sparkles">
      <span style="top: 12%; left: 10%;">✨</span>
      <span style="top: 18%; right: 12%;">⭐</span>
      <span style="top: 78%; left: 8%;">🎉</span>
      <span style="top: 70%; right: 10%;">✨</span>
      <span style="top: 35%; left: 92%;">💫</span>
    </div>
    <div class="wrap">
      ${brandMini()}
      <div class="capa-conteudo">
        <div class="capa-cristal">🔮</div>
        <div class="capa-titulo">A IA <span class="strong">cravou</span> ontem.<br/>E <span class="roxo">hoje</span>?</div>
        <div class="capa-sub">122 modelos palpitaram a Copa. Vê o que rolou e o que vem aí. 👀</div>
      </div>
      ${rodape()}
    </div>
  </body></html>`;
}

// ---------- 2. MEXICO 2x0 ----------
function htmlMexico() {
  return `<html><head><style>${BASE_CSS}
    .corpo { flex: 1; display: flex; flex-direction: column; gap: 24px; padding-top: 14px; }
    .badge-cravou {
      align-self: center; padding: 10px 26px;
      background: linear-gradient(135deg, #10b981, #059669);
      color: #fff; border-radius: 999px;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 900; font-size: 18px;
      letter-spacing: 0.08em;
      box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);
    }
    .titulo {
      font-size: 56px; font-weight: 900;
      text-align: center; line-height: 1.1;
      color: #fff; margin-top: 4px;
      letter-spacing: -0.02em;
    }
    .jogo-card {
      background: rgba(255,255,255,0.06);
      border: 2px solid rgba(16, 185, 129, 0.4);
      border-radius: 24px;
      padding: 32px 28px;
      margin-top: 8px;
    }
    .jogo-times {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: 16px;
    }
    .time {
      display: flex; flex-direction: column;
      align-items: center; gap: 8px;
    }
    .time-bandeira { font-size: 80px; line-height: 1; }
    .time-nome { font-size: 22px; font-weight: 700; color: #fff; text-align: center; }
    .placar { display: flex; flex-direction: column; align-items: center; gap: 6px; }
    .placar-num {
      font-size: 110px; font-weight: 900;
      background: linear-gradient(180deg, #fff, #a7f3d0);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      line-height: 1;
    }
    .placar-x { font-size: 50px; color: #a7f3d0; opacity: 0.5; line-height: 1; }
    .placar-lbl {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px; color: #a7f3d0;
      letter-spacing: 0.1em; font-weight: 800;
      margin-top: 8px;
    }
    .stats {
      margin-top: 24px;
      display: flex; flex-direction: column; gap: 14px;
    }
    .stat-linha {
      display: flex; justify-content: space-between; align-items: center;
      padding: 18px 24px;
      background: rgba(168, 85, 247, 0.18);
      border: 1px solid rgba(168, 85, 247, 0.35);
      border-radius: 16px;
    }
    .stat-label { font-size: 19px; color: #fff; font-weight: 600; }
    .stat-val {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 900; font-size: 22px;
      color: #c4b5fd;
    }
    .punch {
      margin-top: 20px; text-align: center;
      font-size: 28px; font-weight: 800;
      color: #ec4899;
    }
  </style></head>
  <body>
    <div class="wrap">
      ${brandMini()}
      <div class="corpo">
        <div class="pip">1 DE 7</div>
        <div class="badge-cravou">✓ BOLA DE CRISTAL CRAVOU</div>
        <div class="titulo">A abertura veio exatamente como prevista.</div>
        <div class="jogo-card">
          <div class="jogo-times">
            <div class="time">
              <div class="time-bandeira">${BANDEIRAS.Mexico}</div>
              <div class="time-nome">México</div>
            </div>
            <div class="placar">
              <div style="display:flex;align-items:baseline;gap:8px;">
                <span class="placar-num">2</span>
                <span class="placar-x">×</span>
                <span class="placar-num">0</span>
              </div>
              <div class="placar-lbl">PLACAR FINAL</div>
            </div>
            <div class="time">
              <div class="time-bandeira">${BANDEIRAS.AfricaSul}</div>
              <div class="time-nome">África do Sul</div>
            </div>
          </div>
        </div>
        <div class="stats">
          <div class="stat-linha">
            <span class="stat-label">🔮 IAs que cravaram o 2×0</span>
            <span class="stat-val">39 de 122</span>
          </div>
        </div>
        <div class="punch">E você? Foi de empate? 👀</div>
      </div>
      ${rodape()}
    </div>
  </body></html>`;
}

// ---------- Helper pros slides de previsão ----------
function htmlPrevisao({ n, idx, dataLbl, time_a, time_b, bandeira_a, bandeira_b, cristal_a, cristal_b, votos, total, top2_a, top2_b, top2_votos, punch }) {
  return `<html><head><style>${BASE_CSS}
    .corpo { flex: 1; display: flex; flex-direction: column; gap: 18px; padding-top: 10px; }
    .meta {
      align-self: center; padding: 8px 22px;
      background: rgba(255,255,255,0.1);
      color: #e9d5ff;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 800; font-size: 14px;
      border-radius: 999px; letter-spacing: 0.08em;
    }
    .titulo {
      font-size: 60px; font-weight: 900;
      text-align: center; line-height: 1.05;
      color: #fff; letter-spacing: -0.02em;
      margin-top: 4px;
    }
    .titulo .vs {
      background: linear-gradient(90deg, #a855f7, #ec4899);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
    .times-row {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: 12px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 20px;
      padding: 26px 22px;
    }
    .time {
      display: flex; flex-direction: column;
      align-items: center; gap: 6px;
    }
    .time-bandeira { font-size: 70px; line-height: 1; }
    .time-nome { font-size: 22px; font-weight: 700; color: #fff; text-align: center; }
    .vs-lbl {
      font-size: 36px; color: #a855f7; opacity: 0.7;
      font-weight: 900;
    }
    .cristal-card {
      background: linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(236, 72, 153, 0.15));
      border: 2px solid rgba(168, 85, 247, 0.5);
      border-radius: 22px;
      padding: 24px 28px;
      display: flex; align-items: center; justify-content: space-between;
      gap: 18px;
    }
    .cristal-left {
      display: flex; align-items: center; gap: 14px;
    }
    .cristal-emoji { font-size: 56px; }
    .cristal-info {
      display: flex; flex-direction: column;
    }
    .cristal-lbl {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px; color: #c4b5fd; letter-spacing: 0.1em;
      font-weight: 800;
    }
    .cristal-stat {
      font-size: 17px; color: #e9d5ff; font-weight: 600;
      margin-top: 2px;
    }
    .cristal-placar {
      display: flex; align-items: baseline; gap: 6px;
      font-size: 88px; font-weight: 900;
      background: linear-gradient(180deg, #fff, #c4b5fd);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      line-height: 1;
    }
    .cristal-placar .x { font-size: 50px; opacity: 0.5; color: #c4b5fd; -webkit-text-fill-color: #c4b5fd; }
    .runner-up {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      padding: 18px 22px;
      display: flex; align-items: center; justify-content: space-between;
    }
    .runner-lbl {
      font-size: 16px; color: #e9d5ff; font-weight: 600;
    }
    .runner-placar {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 900; font-size: 30px; color: #fbcfe8;
    }
    .runner-votos {
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px; color: #c4b5fd; margin-left: 8px;
    }
    .punch {
      text-align: center; margin-top: auto; margin-bottom: 14px;
      font-size: 24px; font-weight: 800; color: #fbcfe8;
    }
  </style></head>
  <body>
    <div class="wrap">
      ${brandMini()}
      <div class="corpo">
        <div class="pip">${idx} DE 7</div>
        <div class="meta">⚽ JOGO ${n} · ${dataLbl}</div>
        <div class="titulo">${time_a} <span class="vs">×</span> ${time_b}</div>
        <div class="times-row">
          <div class="time">
            <div class="time-bandeira">${bandeira_a}</div>
            <div class="time-nome">${time_a}</div>
          </div>
          <div class="vs-lbl">VS</div>
          <div class="time">
            <div class="time-bandeira">${bandeira_b}</div>
            <div class="time-nome">${time_b}</div>
          </div>
        </div>
        <div class="cristal-card">
          <div class="cristal-left">
            <div class="cristal-emoji">🔮</div>
            <div class="cristal-info">
              <div class="cristal-lbl">BOLA DE CRISTAL</div>
              <div class="cristal-stat">${votos} de ${total} IAs apostam nisso</div>
            </div>
          </div>
          <div class="cristal-placar">${cristal_a}<span class="x">×</span>${cristal_b}</div>
        </div>
        <div class="runner-up">
          <span class="runner-lbl">2ª opção mais votada</span>
          <span>
            <span class="runner-placar">${top2_a}×${top2_b}</span>
            <span class="runner-votos">${top2_votos} IAs</span>
          </span>
        </div>
        <div class="punch">${punch}</div>
      </div>
      ${rodape()}
    </div>
  </body></html>`;
}

// ---------- 6. LIDERES ----------
function htmlLideres() {
  // Top 6 mais populares com 10 pts (cravaram o 2x0)
  const lideres = [
    { slug: "chatgpt-5-thinking-web", nome: "ChatGPT 5 Thinking", marca: "OpenAI" },
    { slug: "claude-opus-4-8-web", nome: "Anthropic Fable", marca: "Anthropic", fable: true },
    { slug: "gemini-2-5-pro-web", nome: "Gemini 2.5 Pro", marca: "Google" },
    { slug: "grok-4-heavy-web", nome: "Grok 4 Heavy", marca: "xAI" },
    { slug: "deepseek-r1-web", nome: "DeepSeek R1", marca: "DeepSeek" },
    { slug: "qwen-3-max-web", nome: "Qwen 3 Max", marca: "Alibaba" },
  ];

  const cards = lideres.map((l, i) => {
    const mascoteSlug = l.fable ? "claude-fable-5" : l.slug;
    const m = mascotPng(mascoteSlug);
    const mImg = m ? `<img src="data:image/png;base64,${m}" />` : "";
    return `
      <div class="lider-card${l.fable ? " fable" : ""}">
        <div class="lider-pos">${i + 1}º</div>
        <div class="lider-mascote">${mImg}</div>
        <div class="lider-info">
          <div class="lider-nome">${l.nome}</div>
          <div class="lider-marca">${l.marca}</div>
        </div>
        <div class="lider-pts"><strong>10</strong><span>pts</span></div>
      </div>`;
  }).join("");

  return `<html><head><style>${BASE_CSS}
    .corpo { flex: 1; display: flex; flex-direction: column; gap: 18px; padding-top: 10px; }
    .titulo {
      font-size: 60px; font-weight: 900;
      text-align: center; line-height: 1.0;
      color: #fff; letter-spacing: -0.02em;
    }
    .titulo .accent {
      background: linear-gradient(90deg, #fbbf24, #f59e0b);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
    .sub {
      text-align: center; font-size: 22px; color: #e9d5ff;
      font-weight: 600;
    }
    .lista {
      display: flex; flex-direction: column; gap: 10px;
      margin-top: 8px;
    }
    .lider-card {
      display: grid;
      grid-template-columns: 60px 80px 1fr auto;
      align-items: center;
      gap: 16px;
      padding: 14px 22px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
    }
    .lider-card.fable {
      background: linear-gradient(90deg, rgba(168,85,247,0.2), rgba(236,72,153,0.1));
      border-color: rgba(168, 85, 247, 0.5);
    }
    .lider-pos {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 900; font-size: 26px;
      color: #fbbf24;
    }
    .lider-mascote {
      width: 80px; height: 80px;
      display: flex; align-items: center; justify-content: center;
    }
    .lider-mascote img {
      width: 80px; height: 80px; object-fit: contain;
    }
    .lider-card.fable .lider-mascote img {
      filter: drop-shadow(0 0 10px rgba(168, 85, 247, 0.5));
    }
    .lider-info { display: flex; flex-direction: column; }
    .lider-nome { font-size: 20px; font-weight: 800; color: #fff; }
    .lider-marca {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px; color: #c4b5fd;
      text-transform: uppercase; letter-spacing: 0.08em;
    }
    .lider-pts {
      display: flex; align-items: baseline; gap: 4px;
      font-family: 'JetBrains Mono', monospace;
    }
    .lider-pts strong {
      font-size: 32px; font-weight: 900; color: #10b981;
    }
    .lider-pts span {
      font-size: 12px; color: #a7f3d0;
      text-transform: uppercase; letter-spacing: 0.1em;
      font-weight: 800;
    }
    .punch {
      text-align: center; margin-top: 4px;
      font-size: 20px; font-weight: 700; color: #e9d5ff;
    }
  </style></head>
  <body>
    <div class="wrap">
      ${brandMini()}
      <div class="corpo">
        <div class="pip">6 DE 7</div>
        <div class="titulo">🏆 Quem <span class="accent">tá liderando</span></div>
        <div class="sub">40 IAs cravaram o 2×0. Estas são as 6 mais conhecidas.</div>
        <div class="lista">${cards}</div>
        <div class="punch">+ Anthropic Fable estreou cravando. 👀</div>
      </div>
      ${rodape()}
    </div>
  </body></html>`;
}

// ---------- 7. CTA ----------
function htmlCta() {
  return `<html><head><style>${BASE_CSS}
    .corpo {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 22px;
    }
    .emoji-grande { font-size: 130px; line-height: 1;
      filter: drop-shadow(0 0 40px rgba(168, 85, 247, 0.5));
    }
    .titulo {
      font-size: 80px; font-weight: 900;
      text-align: center; line-height: 1.0;
      letter-spacing: -0.03em; color: #fff;
    }
    .titulo .strong {
      background: linear-gradient(90deg, #10b981, #34d399);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
    .sub {
      font-size: 28px; color: #e9d5ff;
      text-align: center; line-height: 1.4;
      max-width: 760px; font-weight: 600;
    }
    .botao {
      display: inline-flex; align-items: center; gap: 14px;
      padding: 28px 56px;
      background: linear-gradient(135deg, #009C3B, #00C04A);
      color: #fff; font-size: 38px; font-weight: 900;
      border-radius: 24px;
      box-shadow: 0 14px 40px rgba(0, 156, 59, 0.5);
    }
    .botao .bola { font-size: 44px; }
    .rodape-texto {
      font-size: 20px; font-weight: 700;
      color: #c4b5fd; text-align: center;
    }
  </style></head>
  <body>
    <div class="wrap">
      ${brandMini()}
      <div class="corpo">
        <div class="emoji-grande">🎯</div>
        <div class="titulo">Bata as IAs.<br/><span class="strong">É grátis.</span></div>
        <div class="sub">Cria teu bolão privado em 30s. Convida a galera. Vê quem chuta melhor que ChatGPT, Claude, Gemini e mais 119.</div>
        <div class="botao"><span class="bola">⚽</span> Cria teu bolão</div>
        <div class="rodape-texto">${SITE}</div>
      </div>
      ${rodape()}
    </div>
  </body></html>`;
}

// ---------- MAIN ----------
async function gerarCard(browser, html, nome) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1080 } });
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(OUT, nome), fullPage: false });
  await page.close();
  console.log(`  ✔ ${nome}`);
}

async function main() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  console.log(`Gerando 7 cards em ${OUT}/`);

  const browser = await chromium.launch();

  await gerarCard(browser, htmlCapa(), "01-capa.png");
  await gerarCard(browser, htmlMexico(), "02-mexico-cravou.png");

  await gerarCard(browser, htmlPrevisao({
    n: 2, idx: 3, dataLbl: "Qui 11/06 · 23h00",
    time_a: "Coreia do Sul", time_b: "Rep. Tcheca",
    bandeira_a: BANDEIRAS.CoreiaSul, bandeira_b: BANDEIRAS.Tcheca,
    cristal_a: 1, cristal_b: 1, votos: 37, total: 122,
    top2_a: 1, top2_b: 0, top2_votos: 7,
    punch: "37 IAs apostam empate. Concordas? 🤔",
  }), "03-coreia-czech.png");

  await gerarCard(browser, htmlPrevisao({
    n: 3, idx: 4, dataLbl: "Sex 12/06 · 16h00",
    time_a: "Canadá", time_b: "Bósnia",
    bandeira_a: BANDEIRAS.Canada, bandeira_b: BANDEIRAS.Bosnia,
    cristal_a: 1, cristal_b: 1, votos: 24, total: 122,
    top2_a: 1, top2_b: 0, top2_votos: 9,
    punch: "Cristal diz empate. Mas em casa, Canadá leva? 🇨🇦",
  }), "04-canada-bosnia.png");

  await gerarCard(browser, htmlPrevisao({
    n: 4, idx: 5, dataLbl: "Sex 12/06 · 22h00",
    time_a: "Estados Unidos", time_b: "Paraguai",
    bandeira_a: BANDEIRAS.EUA, bandeira_b: BANDEIRAS.Paraguai,
    cristal_a: 2, cristal_b: 0, votos: 20, total: 122,
    top2_a: 1, top2_b: 0, top2_votos: 18,
    punch: "Empate técnico entre 2×0 e 1×0. Anfitrião sofre? 👀",
  }), "05-usa-paraguai.png");

  await gerarCard(browser, htmlLideres(), "06-lideres.png");
  await gerarCard(browser, htmlCta(), "07-cta.png");

  await browser.close();
  console.log("\nPronto. 7 cards em marketing/Post_jun12/");
}

main().catch((e) => { console.error(e); process.exit(1); });
