/**
 * Card v3: "Rodamos de novo — graças a vocês."
 * Anuncia a 2a atualização de palpites (3a rodada dos Grupos I/J/K/L) feita
 * após os resultados da 2a rodada, liberada SEM nova contribuição pra quem
 * já apoiou. Tom: gratidão.
 *
 * Saida: ../Post_v3/01-obrigado.png, 02-acesso.png
 * Uso: node marketing/scripts/gerar_card_v3.js
 */

const fs = require("fs");
const path = require("path");

const V4_ROOT = path.resolve(__dirname, "../../v4");
const { chromium } = require(path.join(V4_ROOT, "node_modules", "playwright"));
const OUT = path.resolve(__dirname, "..", "Post_v3");

const SITE = "bolao.arenadasias.com.br";
const INSTA = "@arena.das.ias";

const BASE_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1080px; height: 1080px;
    font-family: 'Inter', -apple-system, 'Segoe UI', system-ui, sans-serif;
    color: #fff; background: #1a1238;
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
  .wrap { position: relative; z-index: 2; padding: 56px 64px; height: 100%; display: flex; flex-direction: column; }
  .brand-mini { display: flex; align-items: center; gap: 12px; font-size: 20px; font-weight: 800; color: #fff; letter-spacing: -0.01em; }
  .brand-mini .ball { font-size: 34px; transform: rotate(-8deg); }
  .pip {
    display: inline-flex; padding: 8px 22px;
    background: rgba(168, 85, 247, 0.2); color: #e9d5ff;
    border: 1px solid rgba(168, 85, 247, 0.4);
    font-family: 'JetBrains Mono', monospace; font-weight: 800; font-size: 16px;
    border-radius: 999px; letter-spacing: 0.08em; align-self: center;
  }
  .rodape { margin-top: auto; display: flex; align-items: center; justify-content: space-between; padding-top: 18px; border-top: 2px dashed rgba(255,255,255,0.18); }
  .pills { display: flex; gap: 12px; }
  .pill { display: inline-flex; align-items: center; gap: 8px; padding: 14px 22px; border-radius: 999px; font-size: 18px; font-weight: 800; color: #fff; }
  .pill-site { background: linear-gradient(135deg, #009C3B, #00C04A); }
  .pill-insta { background: linear-gradient(135deg, #F58529, #DD2A7B, #8134AF); }
  .arraste { font-size: 18px; font-weight: 800; color: #e9d5ff; letter-spacing: 0.04em; }
`;

function brandMini() {
  return `<div class="brand-mini"><span class="ball">⚽</span><span>Bolão das IAs</span></div>`;
}
function rodape(comArraste) {
  return `<div class="rodape">
    <div class="pills">
      <span class="pill pill-site">🌐 ${SITE}</span>
      <span class="pill pill-insta">📷 ${INSTA}</span>
    </div>
    ${comArraste ? '<span class="arraste">ARRASTE →</span>' : ""}
  </div>`;
}

// ---------- 1. OBRIGADO ----------
function htmlObrigado() {
  return `<html><head><style>${BASE_CSS}
    .corpo { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px; }
    .heart { font-size: 150px; line-height: 1; filter: drop-shadow(0 0 50px rgba(236, 72, 153, 0.6)); animation: beat 1.6s ease-in-out infinite; }
    @keyframes beat { 0%,100% { transform: scale(1);} 50% { transform: scale(1.08);} }
    .titulo { font-size: 86px; font-weight: 900; text-align: center; line-height: 1.0; letter-spacing: -0.03em; color: #fff; }
    .titulo .strong { background: linear-gradient(90deg, #10b981, #34d399); -webkit-background-clip: text; background-clip: text; color: transparent; }
    .titulo .roxo { background: linear-gradient(90deg, #a855f7, #ec4899); -webkit-background-clip: text; background-clip: text; color: transparent; }
    .sub { font-size: 32px; font-weight: 600; color: #e9d5ff; text-align: center; max-width: 820px; line-height: 1.45; }
    .sparkles { position: absolute; inset: 0; pointer-events: none; }
    .sparkles span { position: absolute; font-size: 38px; opacity: 0.5; }
  </style></head>
  <body>
    <div class="sparkles">
      <span style="top: 12%; left: 10%;">✨</span>
      <span style="top: 16%; right: 12%;">💜</span>
      <span style="top: 80%; left: 9%;">🎉</span>
      <span style="top: 74%; right: 10%;">✨</span>
      <span style="top: 40%; left: 92%;">💫</span>
    </div>
    <div class="wrap">
      ${brandMini()}
      <div class="corpo">
        <div class="heart">💜</div>
        <div class="titulo">Rodamos <span class="strong">de novo</span>.<br/>Graças a <span class="roxo">vocês</span>.</div>
        <div class="sub">As contribuições da galera pagaram mais uma leva de palpites das IAs — agora com os resultados da 2ª rodada na mesa. 🙏</div>
      </div>
      ${rodape(true)}
    </div>
  </body></html>`;
}

// ---------- 2. ACESSO ----------
function htmlAcesso() {
  return `<html><head><style>${BASE_CSS}
    .corpo { flex: 1; display: flex; flex-direction: column; gap: 22px; padding-top: 12px; }
    .titulo { font-size: 58px; font-weight: 900; text-align: center; line-height: 1.08; color: #fff; letter-spacing: -0.02em; }
    .titulo .accent { background: linear-gradient(90deg, #fbbf24, #f59e0b); -webkit-background-clip: text; background-clip: text; color: transparent; }
    .lista { display: flex; flex-direction: column; gap: 16px; margin-top: 6px; }
    .item { display: flex; align-items: center; gap: 18px; padding: 24px 28px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 18px; }
    .item .ic { font-size: 46px; line-height: 1; }
    .item .tx { font-size: 24px; font-weight: 600; color: #fff; line-height: 1.35; }
    .item .tx b { color: #a7f3d0; }
    .destaque { margin-top: 4px; padding: 28px; text-align: center; background: linear-gradient(135deg, rgba(16,185,129,0.22), rgba(168,85,247,0.18)); border: 2px solid rgba(16,185,129,0.45); border-radius: 22px; }
    .destaque .big { font-size: 38px; font-weight: 900; color: #fff; line-height: 1.15; }
    .destaque .small { font-size: 22px; font-weight: 600; color: #a7f3d0; margin-top: 10px; }
  </style></head>
  <body>
    <div class="wrap">
      ${brandMini()}
      <div class="corpo">
        <div class="pip">2 DE 2</div>
        <div class="titulo">Já contribuiu? <span class="accent">Tá liberado.</span></div>
        <div class="lista">
          <div class="item"><span class="ic">🆓</span><span class="tx">Quem já apoiou vê os palpites atualizados <b>sem pagar de novo</b>.</span></div>
          <div class="item"><span class="ic">🔁</span><span class="tx">54 IAs repalpitaram os jogos finais dos 4 grupos.</span></div>
          <div class="item"><span class="ic">📊</span><span class="tx">Agora elas sabem <b>quem precisa vencer</b> pra passar.</span></div>
        </div>
        <div class="destaque">
          <div class="big">Entra com teu e-mail e confere. 👀</div>
          <div class="small">${SITE}/analise-v2</div>
        </div>
      </div>
      ${rodape(false)}
    </div>
  </body></html>`;
}

async function gerarCard(browser, html, nome) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1080 } });
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(OUT, nome), fullPage: false });
  await page.close();
  console.log(`  ✔ ${nome}`);
}

async function main() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  console.log(`Gerando cards v3 em ${OUT}/`);
  const browser = await chromium.launch();
  await gerarCard(browser, htmlObrigado(), "01-obrigado.png");
  await gerarCard(browser, htmlAcesso(), "02-acesso.png");
  await browser.close();
  console.log("\nPronto. 2 cards em marketing/Post_v3/");
}

main().catch((e) => { console.error(e); process.exit(1); });
