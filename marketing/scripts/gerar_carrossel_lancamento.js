/**
 * Gera os 4 PNGs do carrossel de lançamento (07/jun).
 * Saída: ../Post_jun07/01-capa.png ... 04-cta.png
 *
 * Uso (na pasta v4):
 *   node ../marketing/scripts/gerar_carrossel_lancamento.js
 */

const fs = require("fs");
const path = require("path");

const V4_ROOT = path.resolve(__dirname, "../../v4");
const { chromium } = require(path.join(V4_ROOT, "node_modules", "playwright"));
const MASCOTS_DIR = path.join(V4_ROOT, "public", "mascots");
const OUT = path.resolve(__dirname, "../Post_jun07");

const SITE = "bolao.arenadasias.com.br";
const INSTA = "@arena.das.ias";

// Logos oficiais: lê SVG do /v4/public/logos/{familia}.svg (baixadas via baixar_logos.py)
const LOGOS_DIR = path.join(V4_ROOT, "public", "logos");
const CORES = {
  openai: "#000000",
  anthropic: "#D97757",
  google: "#4285F4",
  xai: "#000000",
  deepseek: "#4D6BFE",
};

function logoIA(familia, size = 88) {
  const arq = path.join(LOGOS_DIR, `${familia}.svg`);
  if (!fs.existsSync(arq)) return `<div style="width:${size}px;height:${size}px;"></div>`;
  const svg = fs.readFileSync(arq).toString("base64");
  const cor = CORES[familia] || "#888";
  return `<div style="width:${size}px;height:${size}px;background:#fff;border:2px solid ${cor}33;border-radius:18px;display:flex;align-items:center;justify-content:center;flex-shrink:0;padding:${Math.round(size*0.16)}px;box-sizing:border-box;">
    <img src="data:image/svg+xml;base64,${svg}" style="width:100%;height:100%;object-fit:contain;" />
  </div>`;
}

// CSS comum a todos os slides (1080×1080, fundo branco, brand BR)
const BASE_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1080px; height: 1080px;
    font-family: -apple-system, 'Segoe UI', system-ui, sans-serif;
    color: #1A1A1A; background: #FFFFFF;
    overflow: hidden; position: relative;
  }
  body::before {
    content: ""; position: absolute; inset: 0; pointer-events: none;
    background:
      radial-gradient(circle at 0% 0%, rgba(0,156,59,0.06), transparent 40%),
      radial-gradient(circle at 100% 100%, rgba(255,206,0,0.08), transparent 40%);
  }
  body::after {
    content: ""; position: absolute; top: 0; left: 0; right: 0;
    height: 6px;
    background: linear-gradient(90deg, #009C3B 0%, #FFCE00 50%, #002776 100%);
  }
  .wrap {
    position: relative; z-index: 2;
    padding: 64px 80px;
    height: 100%;
    display: flex; flex-direction: column;
  }
  .brand-mini {
    display: flex; align-items: center; gap: 12px;
    font-size: 22px; font-weight: 900;
    color: #002776; letter-spacing: -0.01em;
  }
  .brand-mini .ball { font-size: 36px; transform: rotate(-8deg); }
  .rodape-mini {
    margin-top: auto;
    padding-top: 24px;
    border-top: 2px dashed #DDD;
    display: flex; gap: 14px; justify-content: center; align-items: center;
    flex-wrap: wrap;
  }
  .pill {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 22px; border-radius: 999px;
    font-size: 20px; font-weight: 800; color: #fff;
  }
  .pill-site { background: #009C3B; }
  .pill-insta {
    background: linear-gradient(135deg, #F58529, #DD2A7B, #8134AF);
  }
  .swipe {
    position: absolute; bottom: 32px; right: 80px;
    font-size: 14px; font-weight: 800;
    color: #002776; letter-spacing: 0.1em;
    text-transform: uppercase;
    z-index: 3;
  }
`;

const SLIDES = [
  // ────────────────────────────────────── SLIDE 1 — GANCHO
  {
    nome: "01-gancho.png",
    body: `
      <div class="wrap" style="text-align: center; justify-content: space-between;">
        <div class="brand-mini" style="justify-content: center;">
          <span class="ball">⚽</span>
          <span>Bolão das IAs</span>
        </div>

        <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center;">
          <div style="font-size: 220px; line-height: 1; margin-bottom: 24px; filter: drop-shadow(0 8px 24px rgba(221,42,123,0.3));">🔮</div>
          <h1 style="
            font-size: 96px; font-weight: 900;
            color: #002776; line-height: 0.98;
            letter-spacing: -0.04em; margin-bottom: 28px;
            max-width: 920px;
          ">
            As IAs <span style="background: linear-gradient(135deg, #DD2A7B, #F58529); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">já sabem</span><br>
            quem vai ganhar<br>
            a Copa do Mundo!
          </h1>
          <p style="
            font-size: 40px; font-weight: 700;
            color: #444; line-height: 1.3;
            letter-spacing: -0.01em;
          ">
            ou pelo menos <em>elas acham</em> que sabem 😏
          </p>
        </div>

        <div style="display: flex; flex-direction: column; align-items: center; gap: 20px;">
          <div style="
            font-size: 28px; font-weight: 800;
            color: #009C3B; padding: 14px 32px;
            background: rgba(0,156,59,0.10);
            border: 2px solid #009C3B;
            border-radius: 999px;
            letter-spacing: 0.04em;
          ">
            arraste pra ver →
          </div>
          <div class="rodape-mini" style="margin-top: 0; padding-top: 18px; width: 100%;">
            <div class="pill pill-site">🌐 ${SITE}</div>
            <div class="pill pill-insta">📸 ${INSTA}</div>
          </div>
        </div>
      </div>
    `,
  },

  // ────────────────────────────────────── SLIDE 2 — CAPA
  {
    nome: "02-capa.png",
    body: `
      <div class="wrap">
        <div class="brand-mini">
          <span class="ball">⚽</span>
          <span>Bolão das IAs</span>
        </div>
        <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
          <div style="font-size: 100px; line-height: 1; margin-bottom: 32px;">
            🤖 ⚽
          </div>
          <h1 style="
            font-size: 140px; font-weight: 900;
            color: #002776; line-height: 0.92;
            letter-spacing: -0.04em; margin-bottom: 36px;
          ">
            Quem chuta<br>melhor?
          </h1>
          <p style="
            font-size: 64px; font-weight: 800;
            color: #1A1A1A; line-height: 1.1;
            letter-spacing: -0.02em;
          ">
            <span style="color: #009C3B;">Você</span> ou <strong style="color: #DD2A7B;">122 IAs</strong>?
          </p>
        </div>
        <div style="text-align: center; font-size: 24px; color: #5A5A5A; font-weight: 600; margin-bottom: 16px;">
          Bolão da Copa 2026 · experimento social-tech
        </div>
        <div class="rodape-mini">
          <div class="pill pill-site">🌐 ${SITE}</div>
          <div class="pill pill-insta">📸 ${INSTA}</div>
        </div>
      </div>
      <div class="swipe">arraste →</div>
    `,
  },

  // ────────────────────────────────────── SLIDE 2 — PROPOSTA
  {
    nome: "03-proposta.png",
    body: `
      <div class="wrap">
        <div class="brand-mini">
          <span class="ball">⚽</span>
          <span>Bolão das IAs</span>
        </div>
        <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
          <div style="font-size: 88px; margin-bottom: 24px; line-height: 1;">🤖</div>
          <h2 style="
            font-size: 76px; font-weight: 900;
            color: #002776; line-height: 1.0;
            margin-bottom: 36px; letter-spacing: -0.03em;
          ">
            A gente pegou as IAs<br>e mandou palpitar.
          </h2>
          <p style="
            font-size: 32px; color: #1A1A1A;
            line-height: 1.4; margin-bottom: 20px;
            font-weight: 500;
          ">
            <strong style="color: #009C3B; font-weight: 900;">122 modelos de IA</strong> — ChatGPT 5,
            Claude Opus, Gemini, Grok, DeepSeek, Copilot, Perplexity,
            Le Chat, Meta AI, Qwen e mais 112 — palpitando
            <strong>os 104 jogos</strong> da Copa 2026.
          </p>
          <p style="
            font-size: 38px; color: #DD2A7B;
            line-height: 1.3; font-weight: 900;
            margin-top: 32px; letter-spacing: -0.01em;
          ">
            E agora você pode entrar no bolão <em>contra</em> elas.
          </p>
        </div>
        <div class="rodape-mini">
          <div class="pill pill-site">🌐 ${SITE}</div>
          <div class="pill pill-insta">📸 ${INSTA}</div>
        </div>
      </div>
      <div class="swipe">arraste →</div>
    `,
  },

  // ────────────────────────────────────── SLIDE 3 — DISCORDÂNCIA (Brasil × Marrocos, jogo REAL)
  {
    nome: "04-discordancia.png",
    body: `
      <div class="wrap">
        <div class="brand-mini">
          <span class="ball">⚽</span>
          <span>Bolão das IAs</span>
        </div>
        <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
          <h2 style="
            font-size: 72px; font-weight: 900;
            color: #002776; line-height: 1.0;
            margin-bottom: 12px; letter-spacing: -0.03em;
            text-align: center;
          ">
            Já dá pra ver:<br>
            <span style="color: #DD2A7B;">elas discordam.</span>
          </h2>
          <p style="
            text-align: center; font-size: 28px;
            color: #444; margin-bottom: 28px; font-weight: 600;
          ">
            🇧🇷 Brasil × Marrocos 🇲🇦 · Grupo C · 13/jun
          </p>
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <div style="display: flex; align-items: center; gap: 22px; padding: 20px 26px; background: #F8F9FC; border-radius: 20px; border: 2px solid #10A37F;">
              ${logoIA('openai', 88)}
              <div style="flex: 1;">
                <div style="font-size: 30px; font-weight: 900; color: #1A1A1A; line-height: 1.1;">ChatGPT 5 Thinking</div>
                <div style="font-size: 18px; color: #666; font-weight: 600;">OpenAI</div>
              </div>
              <div style="font-size: 54px; font-weight: 900; color: #002776; min-width: 130px; text-align: center;">2 × 1</div>
              <div style="font-size: 22px; color: #009C3B; font-weight: 900; min-width: 110px; text-align: right;">Brasil 🇧🇷</div>
            </div>
            <div style="display: flex; align-items: center; gap: 22px; padding: 20px 26px; background: #F8F9FC; border-radius: 20px; border: 2px solid #D97757;">
              ${logoIA('anthropic', 88)}
              <div style="flex: 1;">
                <div style="font-size: 30px; font-weight: 900; color: #1A1A1A; line-height: 1.1;">Claude Opus 4.7</div>
                <div style="font-size: 18px; color: #666; font-weight: 600;">Anthropic</div>
              </div>
              <div style="font-size: 54px; font-weight: 900; color: #002776; min-width: 130px; text-align: center;">1 × 1</div>
              <div style="font-size: 22px; color: #DD2A7B; font-weight: 900; min-width: 110px; text-align: right;">Empate</div>
            </div>
            <div style="display: flex; align-items: center; gap: 22px; padding: 20px 26px; background: #F8F9FC; border-radius: 20px; border: 2px solid #4285F4;">
              ${logoIA('google', 88)}
              <div style="flex: 1;">
                <div style="font-size: 30px; font-weight: 900; color: #1A1A1A; line-height: 1.1;">Gemini 2.5 Pro</div>
                <div style="font-size: 18px; color: #666; font-weight: 600;">Google</div>
              </div>
              <div style="font-size: 54px; font-weight: 900; color: #002776; min-width: 130px; text-align: center;">3 × 0</div>
              <div style="font-size: 22px; color: #009C3B; font-weight: 900; min-width: 110px; text-align: right;">Brasil 🇧🇷</div>
            </div>
            <div style="display: flex; align-items: center; gap: 22px; padding: 20px 26px; background: #F8F9FC; border-radius: 20px; border: 2px solid #1A1A1A;">
              ${logoIA('xai', 88)}
              <div style="flex: 1;">
                <div style="font-size: 30px; font-weight: 900; color: #1A1A1A; line-height: 1.1;">Grok 4 Heavy</div>
                <div style="font-size: 18px; color: #666; font-weight: 600;">xAI</div>
              </div>
              <div style="font-size: 54px; font-weight: 900; color: #002776; min-width: 130px; text-align: center;">1 × 0</div>
              <div style="font-size: 22px; color: #009C3B; font-weight: 900; min-width: 110px; text-align: right;">Brasil 🇧🇷</div>
            </div>
          </div>
          <p style="
            text-align: center; font-size: 34px;
            margin-top: 32px; color: #1A1A1A;
            font-weight: 800; letter-spacing: -0.01em;
          ">
            Quem você acha que vai cravar?
          </p>
        </div>
        <div class="rodape-mini">
          <div class="pill pill-site">🌐 ${SITE}</div>
          <div class="pill pill-insta">📸 ${INSTA}</div>
        </div>
      </div>
      <div class="swipe">arraste →</div>
    `,
  },

  // ────────────────────────────────────── SLIDE 4 — CTA
  {
    nome: "05-cta.png",
    body: `
      <div class="wrap">
        <div class="brand-mini">
          <span class="ball">⚽</span>
          <span>Bolão das IAs</span>
        </div>
        <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
          <h2 style="
            font-size: 92px; font-weight: 900;
            color: #002776; line-height: 1.0;
            margin-bottom: 56px; letter-spacing: -0.04em;
            text-align: center;
          ">
            Bora brincar?
          </h2>
          <div style="display: flex; flex-direction: column; gap: 28px;">
            <div style="display: flex; align-items: center; gap: 28px; padding: 32px 36px; background: linear-gradient(135deg, rgba(0,156,59,0.08), rgba(0,156,59,0.02)); border-radius: 24px; border: 2px solid #009C3B;">
              <div style="font-size: 72px; flex-shrink: 0; line-height: 1;">🎯</div>
              <div>
                <div style="font-size: 34px; font-weight: 900; color: #002776; margin-bottom: 6px; line-height: 1.1;">Cria um bolão privado</div>
                <div style="font-size: 24px; color: #444; font-weight: 600; line-height: 1.3;">
                  Pra disputar com os amigos · leva 30 segundos pra criar
                </div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 28px; padding: 32px 36px; background: linear-gradient(135deg, rgba(255,206,0,0.10), rgba(255,206,0,0.02)); border-radius: 24px; border: 2px solid #FFCE00;">
              <div style="font-size: 72px; flex-shrink: 0; line-height: 1;">🔮</div>
              <div>
                <div style="font-size: 34px; font-weight: 900; color: #002776; margin-bottom: 6px; line-height: 1.1;">Ou só espia o que cada IA chutou</div>
                <div style="font-size: 24px; color: #444; font-weight: 600; line-height: 1.3;">
                  Curiosidade liberada · tudo de graça
                </div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 28px; padding: 32px 36px; background: linear-gradient(135deg, rgba(221,42,123,0.08), rgba(221,42,123,0.02)); border-radius: 24px; border: 2px solid #DD2A7B;">
              <div style="font-size: 72px; flex-shrink: 0; line-height: 1;">💯</div>
              <div>
                <div style="font-size: 34px; font-weight: 900; color: #002776; margin-bottom: 6px; line-height: 1.1;">Zero ads. Zero Bets.</div>
                <div style="font-size: 24px; color: #444; font-weight: 600; line-height: 1.3;">
                  Doações cobrem as APIs das IAs
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="rodape-mini" style="margin-top: 48px;">
          <div class="pill pill-site" style="font-size: 24px; padding: 16px 28px;">🌐 ${SITE}</div>
          <div class="pill pill-insta" style="font-size: 24px; padding: 16px 28px;">📸 ${INSTA}</div>
        </div>
      </div>
    `,
  },
];

async function main() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1080, height: 1080 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();

  for (const slide of SLIDES) {
    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><style>${BASE_CSS}</style></head><body>${slide.body}</body></html>`;
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.waitForTimeout(200);
    const file = path.join(OUT, slide.nome);
    await page.screenshot({ path: file });
    console.log(`✓ ${slide.nome}`);
  }
  await browser.close();
  console.log(`\n${SLIDES.length} slides em ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
