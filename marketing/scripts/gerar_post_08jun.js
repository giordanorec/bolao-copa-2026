/**
 * Post de hoje (08/jun): "Vai entrar num bolão? Aproveita os palpites das IAs"
 * Carrossel 5 cards, foco em utilidade prática.
 *
 * Saída: ../Post_jun08/01-gancho.png ... 05-cta.png
 *
 * Uso (na pasta v4):
 *   node ../marketing/scripts/gerar_post_08jun.js
 */

const fs = require("fs");
const path = require("path");

const V4_ROOT = path.resolve(__dirname, "../../v4");
const { chromium } = require(path.join(V4_ROOT, "node_modules", "playwright"));
const LOGOS_DIR = path.join(V4_ROOT, "public", "logos");
const OUT = path.resolve(__dirname, "../Post_jun08");

const SITE = "bolao.arenadasias.com.br";
const INSTA = "@arena.das.ias";

function logo(familia, size = 80) {
  const arq = path.join(LOGOS_DIR, `${familia}.svg`);
  if (!fs.existsSync(arq)) return "";
  const b64 = fs.readFileSync(arq).toString("base64");
  return `<img src="data:image/svg+xml;base64,${b64}" style="width:${size}px;height:${size}px;object-fit:contain;flex-shrink:0;" />`;
}

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
      radial-gradient(circle at 0% 0%, rgba(255, 138, 0, 0.08), transparent 45%),
      radial-gradient(circle at 100% 100%, rgba(0, 156, 59, 0.06), transparent 45%);
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
  // ──────────────── SLIDE 1 — GANCHO
  {
    nome: "01-gancho.png",
    body: `
      <div class="wrap">
        <div class="brand-mini">
          <span class="ball">⚽</span>
          <span>Bolão das IAs</span>
        </div>

        <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
          <div style="font-size: 128px; line-height: 1; margin-bottom: 28px; text-align: center;">
            🤔
          </div>
          <h1 style="
            font-size: 92px; font-weight: 900;
            color: #002776; line-height: 0.95;
            letter-spacing: -0.04em; text-align: center;
            margin-bottom: 28px;
          ">
            Vai entrar num<br>
            <span style="background: linear-gradient(135deg, #FF8A00, #DD2A7B); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">bolão da Copa?</span>
          </h1>
          <p style="
            font-size: 38px; font-weight: 700;
            color: #444; line-height: 1.3;
            text-align: center;
            max-width: 880px; margin: 0 auto;
          ">
            Antes de chutar <strong style="color: #002776;">104 jogos</strong>,
            dá uma olhada no que <strong style="color: #009C3B;">122 IAs</strong> já palpitaram. ✨
          </p>
        </div>

        <div class="rodape-mini">
          <div class="pill pill-site">🌐 ${SITE}</div>
          <div class="pill pill-insta">📸 ${INSTA}</div>
        </div>
        <div class="swipe">arraste →</div>
      </div>
    `,
  },

  // ──────────────── SLIDE 2 — PROBLEMA / SOLUÇÃO
  {
    nome: "02-problema.png",
    body: `
      <div class="wrap">
        <div class="brand-mini">
          <span class="ball">⚽</span>
          <span>Bolão das IAs</span>
        </div>

        <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
          <h2 style="
            font-size: 64px; font-weight: 900;
            color: #002776; line-height: 1.0;
            margin-bottom: 40px; letter-spacing: -0.03em;
          ">
            104 jogos pra palpitar.<br>
            <span style="color: #DD2A7B;">Quem tem tempo?</span>
          </h2>

          <div style="display: flex; flex-direction: column; gap: 22px; margin-bottom: 36px;">
            <div style="display: flex; align-items: center; gap: 20px; padding: 22px 28px; background: #FEE2E2; border-radius: 20px; border: 2px solid #FCA5A5;">
              <div style="font-size: 44px; line-height: 1;">😩</div>
              <div style="font-size: 24px; color: #1A1A1A; line-height: 1.35; font-weight: 600;">
                Chuta no escuro e perde pra todo mundo
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 20px; padding: 22px 28px; background: #FEE2E2; border-radius: 20px; border: 2px solid #FCA5A5;">
              <div style="font-size: 44px; line-height: 1;">🕒</div>
              <div style="font-size: 24px; color: #1A1A1A; line-height: 1.35; font-weight: 600;">
                Passa 1 hora pesquisando estatística de cada jogo
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 20px; padding: 22px 28px; background: #D1FAE5; border-radius: 20px; border: 2px solid #6EE7B7;">
              <div style="font-size: 44px; line-height: 1;">💡</div>
              <div style="font-size: 24px; color: #064E3B; line-height: 1.35; font-weight: 700;">
                Ou aproveita o palpite das IAs num clique
              </div>
            </div>
          </div>
        </div>

        <div class="rodape-mini">
          <div class="pill pill-site">🌐 ${SITE}</div>
          <div class="pill pill-insta">📸 ${INSTA}</div>
        </div>
        <div class="swipe">arraste →</div>
      </div>
    `,
  },

  // ──────────────── SLIDE 3 — COMO FUNCIONA
  {
    nome: "03-como.png",
    body: `
      <div class="wrap">
        <div class="brand-mini">
          <span class="ball">⚽</span>
          <span>Bolão das IAs</span>
        </div>

        <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
          <h2 style="
            font-size: 68px; font-weight: 900;
            color: #002776; line-height: 1.0;
            margin-bottom: 36px; letter-spacing: -0.03em;
            text-align: center;
          ">
            Como funciona
          </h2>

          <div style="display: flex; flex-direction: column; gap: 28px;">
            <div style="display: flex; align-items: center; gap: 24px; padding: 26px 30px; background: linear-gradient(135deg, rgba(0,156,59,0.10), rgba(0,156,59,0.02)); border-radius: 24px; border: 2px solid #009C3B;">
              <div style="
                font-family: 'Inter', sans-serif;
                font-size: 56px; font-weight: 900;
                color: #009C3B; line-height: 1;
                min-width: 70px; text-align: center;
              ">1</div>
              <div>
                <div style="font-size: 30px; font-weight: 900; color: #002776; margin-bottom: 4px;">Abre o site, escolhe o jogo</div>
                <div style="font-size: 20px; color: #444; font-weight: 500;">Os 104 jogos da Copa estão lá</div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 24px; padding: 26px 30px; background: linear-gradient(135deg, rgba(255,206,0,0.12), rgba(255,206,0,0.02)); border-radius: 24px; border: 2px solid #FFCE00;">
              <div style="
                font-family: 'Inter', sans-serif;
                font-size: 56px; font-weight: 900;
                color: #B07800; line-height: 1;
                min-width: 70px; text-align: center;
              ">2</div>
              <div>
                <div style="font-size: 30px; font-weight: 900; color: #002776; margin-bottom: 4px;">Vê o que cada IA chutou</div>
                <div style="font-size: 20px; color: #444; font-weight: 500;">ChatGPT, Claude, Gemini, Grok…</div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 24px; padding: 26px 30px; background: linear-gradient(135deg, rgba(221,42,123,0.10), rgba(221,42,123,0.02)); border-radius: 24px; border: 2px solid #DD2A7B;">
              <div style="
                font-family: 'Inter', sans-serif;
                font-size: 56px; font-weight: 900;
                color: #DD2A7B; line-height: 1;
                min-width: 70px; text-align: center;
              ">3</div>
              <div>
                <div style="font-size: 30px; font-weight: 900; color: #002776; margin-bottom: 4px;">Copia pro teu bolão num clique</div>
                <div style="font-size: 20px; color: #444; font-weight: 500;">Auto-salva. Pode editar depois.</div>
              </div>
            </div>
          </div>
        </div>

        <div class="rodape-mini">
          <div class="pill pill-site">🌐 ${SITE}</div>
          <div class="pill pill-insta">📸 ${INSTA}</div>
        </div>
        <div class="swipe">arraste →</div>
      </div>
    `,
  },

  // ──────────────── SLIDE 4 — IAs ENVOLVIDAS
  {
    nome: "04-ias.png",
    body: `
      <div class="wrap">
        <div class="brand-mini">
          <span class="ball">⚽</span>
          <span>Bolão das IAs</span>
        </div>

        <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
          <h2 style="
            font-size: 60px; font-weight: 900;
            color: #002776; line-height: 1.0;
            margin-bottom: 12px; letter-spacing: -0.03em;
            text-align: center;
          ">
            122 modelos.<br>
            <span style="color: #DD2A7B;">10 cabeças de chave.</span>
          </h2>
          <p style="text-align: center; font-size: 24px; color: #666; font-weight: 600; margin-bottom: 36px;">
            Cada uma palpitou os 104 jogos
          </p>

          <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 18px; padding: 0 20px;">
            ${["openai","anthropic","google","xai","deepseek","microsoft","meta","perplexity","mistral","alibaba"].map(fam => `
              <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
                ${logo(fam, 80)}
              </div>
            `).join("")}
          </div>

          <p style="
            text-align: center; font-size: 26px;
            margin-top: 40px; color: #1A1A1A;
            font-weight: 700; line-height: 1.4;
          ">
            E mais <strong style="color: #009C3B;">112 modelos</strong> rodando<br>
            via API. Você escolhe de quem copiar.
          </p>
        </div>

        <div class="rodape-mini">
          <div class="pill pill-site">🌐 ${SITE}</div>
          <div class="pill pill-insta">📸 ${INSTA}</div>
        </div>
        <div class="swipe">arraste →</div>
      </div>
    `,
  },

  // ──────────────── SLIDE 5 — CTA
  {
    nome: "05-cta.png",
    body: `
      <div class="wrap">
        <div class="brand-mini">
          <span class="ball">⚽</span>
          <span>Bolão das IAs</span>
        </div>

        <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
          <div style="text-align: center; font-size: 88px; margin-bottom: 24px;">⚽🏆</div>
          <h2 style="
            font-size: 76px; font-weight: 900;
            color: #002776; line-height: 1.0;
            margin-bottom: 24px; letter-spacing: -0.03em;
            text-align: center;
          ">
            Bora?
          </h2>
          <p style="
            text-align: center; font-size: 28px;
            color: #444; line-height: 1.4;
            margin-bottom: 36px; max-width: 760px;
            margin-left: auto; margin-right: auto; font-weight: 600;
          ">
            Cria teu bolão (leva <strong style="color: #009C3B;">30 segundos</strong>) e
            convida a galera. Os palpites das IAs ficam disponíveis pra todos os membros.
          </p>

          <div style="display: flex; gap: 18px; justify-content: center; flex-wrap: wrap; margin-bottom: 28px;">
            <div style="
              background: linear-gradient(135deg, #009C3B, #00773F);
              color: #fff; padding: 20px 32px;
              border-radius: 16px; font-size: 26px;
              font-weight: 800; letter-spacing: -0.01em;
              box-shadow: 0 8px 24px rgba(0,156,59,0.30);
            ">
              🎯 Criar bolão
            </div>
            <div style="
              background: #fff; color: #002776;
              padding: 20px 32px; border-radius: 16px;
              font-size: 26px; font-weight: 800;
              border: 2.5px solid #002776; letter-spacing: -0.01em;
            ">
              🔮 Espia sem conta
            </div>
          </div>

          <p style="
            text-align: center; font-size: 20px;
            color: #666; font-weight: 600;
          ">
            🇧🇷 Sem ads. Sem casa de aposta. Brasileiro.
          </p>
        </div>

        <div class="rodape-mini" style="margin-top: 32px;">
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
    console.log(`  ✓ ${slide.nome}`);
  }
  await browser.close();
  console.log(`\n${SLIDES.length} slides em ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
