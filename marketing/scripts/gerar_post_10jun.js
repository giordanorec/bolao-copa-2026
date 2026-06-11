/**
 * Post de hoje (10/jun): "A gente personificou as 10 IAs do bolão"
 * 10 cards de personalidade + capa + CTA. Cada card destaca a MASCOTE
 * (cute character PNG de /v4/public/mascots/) com o logo da marca como
 * pequeno badge no canto.
 *
 * Saída: ../Post_jun10/01-capa.png ... 12-cta.png
 *
 * Uso (de qualquer pasta):
 *   node marketing/scripts/gerar_post_10jun.js
 */

const fs = require("fs");
const path = require("path");

const V4_ROOT = path.resolve(__dirname, "../../v4");
const { chromium } = require(path.join(V4_ROOT, "node_modules", "playwright"));
const LOGOS_DIR = path.join(V4_ROOT, "public", "logos");
const MASCOTS_DIR = path.join(V4_ROOT, "public", "mascots");
const OUT = path.resolve(__dirname, "..", "Post_jun10");

const SITE = "bolao.arenadasias.com.br";
const INSTA = "@arena.das.ias";

function logoSvgB64(familia) {
  const arq = path.join(LOGOS_DIR, `${familia}.svg`);
  if (!fs.existsSync(arq)) return "";
  return fs.readFileSync(arq).toString("base64");
}

function mascotPngB64(slug) {
  const arq = path.join(MASCOTS_DIR, `${slug}.png`);
  if (!fs.existsSync(arq)) {
    console.warn(`  ! mascote nao encontrada: ${slug}`);
    return "";
  }
  return fs.readFileSync(arq).toString("base64");
}

const BASE_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1080px; height: 1080px;
    font-family: 'Inter', -apple-system, 'Segoe UI', system-ui, sans-serif;
    color: #1a2657;
    background: #ffffff;
    overflow: hidden; position: relative;
  }
  /* Faixa colorida no topo (cores Brasil + gradiente) */
  body::before {
    content: ""; position: absolute; top: 0; left: 0; right: 0; height: 8px;
    background: linear-gradient(90deg, #009C3B 0%, #FFDF00 50%, #002776 100%);
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
    color: #002776; letter-spacing: -0.01em;
  }
  .brand-mini .ball { font-size: 34px; transform: rotate(-8deg); }
  .pill {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 14px 22px; border-radius: 999px;
    font-size: 18px; font-weight: 800; color: #fff;
  }
  .pill-site { background: linear-gradient(135deg, #009C3B, #00C04A); }
  .pill-insta { background: linear-gradient(135deg, #F58529, #DD2A7B, #8134AF); }
  .rodape-mini {
    margin-top: auto;
    display: flex; align-items: center; justify-content: space-between;
    padding-top: 18px;
    border-top: 2px dashed #d0d6e8;
  }
  .rodape-mini .pills { display: flex; gap: 12px; }
  .rodape-mini .arraste {
    font-size: 18px; font-weight: 800; color: #002776; letter-spacing: 0.04em;
  }
`;

const PERSONALIDADES = [
  // Capa (1)
  null,
  // 2. ChatGPT
  {
    slug: "chatgpt-5-thinking-web",
    familia: "openai",
    brandColor: "#10A37F",
    brandColorSoft: "#E8F7F2",
    brandColorText: "#0E8264",
    nome: "ChatGPT",
    apelido: "O Estatístico",
    emoji: "🤓",
    quote: "\"Calculei. Vai dar 2-1.\"",
    desc: "Pensa demais antes de chutar. Conservador. Raramente erra feio, raramente acerta a virada do século.",
  },
  // 3. Claude
  {
    slug: "claude-opus-4-8-web",
    familia: "anthropic",
    brandColor: "#D97757",
    brandColorSoft: "#FBEEE7",
    brandColorText: "#B4583B",
    nome: "Claude",
    apelido: "O Filósofo do Empate",
    emoji: "🤔",
    quote: "\"Tudo é 1-1 no fundo, né?\"",
    desc: "Vê nuance em tudo. Sempre tem 3 cenários. No fim, palpita empate e some.",
  },
  // 4. Google
  {
    slug: "gemini-2-5-pro-web",
    familia: "google",
    brandColor: "#4285F4",
    brandColorSoft: "#E8F0FE",
    brandColorText: "#1A56D6",
    nome: "Gemini",
    apelido: "O Otimista Brasileiro",
    emoji: "🇧🇷",
    quote: "\"Brasil 4-0, bora!\"",
    desc: "Sonha alto. Crava placar de carnaval. Tem confiança contagiante.",
  },
  // 5. xAI
  {
    slug: "grok-4-heavy-web",
    familia: "xai",
    brandColor: "#1a1a1a",
    brandColorSoft: "#f0f0f0",
    brandColorText: "#1a1a1a",
    nome: "Grok",
    apelido: "O Maluco do Bar",
    emoji: "🍻",
    quote: "\"5-3, escreve aí.\"",
    desc: "Chuta o impossível. 'Bro, vai dar 7-4 e o goleiro vai marcar 2.' Coragem mas... mira ruim.",
  },
  // 6. DeepSeek
  {
    slug: "deepseek-r1-web",
    familia: "deepseek",
    brandColor: "#4D6BFE",
    brandColorSoft: "#E8EBFE",
    brandColorText: "#2E47C7",
    nome: "DeepSeek",
    apelido: "O Ninja",
    emoji: "🥷",
    quote: "\"1-0. Próximo.\"",
    desc: "Minimalista. Sem firula. Chuta 1-0 e desaparece. Eficiente.",
  },
  // 7. Microsoft
  {
    slug: "copilot-microsoft-web",
    familia: "microsoft",
    brandColor: "#2563EB",
    brandColorSoft: "#E8EFFB",
    brandColorText: "#1746AE",
    nome: "Copilot",
    apelido: "O Office",
    emoji: "💼",
    quote: "\"Conforme o padrão: 2-1.\"",
    desc: "Burocrata. Segue regra. Já marcou reunião sobre o palpite. Previsível como segunda de manhã.",
  },
  // 8. Perplexity
  {
    slug: "perplexity-sonar-pro-web",
    familia: "perplexity",
    brandColor: "#20808D",
    brandColorSoft: "#E5F3F4",
    brandColorText: "#155F69",
    nome: "Perplexity",
    apelido: "O Pesquisador",
    emoji: "🔍",
    quote: "\"Cruzei 12 fontes: 2-1.\"",
    desc: "Tem fonte pra tudo. Cita artigo da Folha de 1998. Sabe demais, palpita igual aos outros.",
  },
  // 9. Meta
  {
    slug: "meta-llama-4-web",
    familia: "meta",
    brandColor: "#0866FF",
    brandColorSoft: "#E5F0FE",
    brandColorText: "#0046B5",
    nome: "Llama (Meta)",
    apelido: "O Influencer",
    emoji: "📱",
    quote: "\"O trending tá 3-1.\"",
    desc: "Vai pelo que está em alta. Olha o reels antes de chutar. Repete o que já repetiram.",
  },
  // 10. Mistral
  {
    slug: "le-chat-mistral-web",
    familia: "mistral",
    brandColor: "#FF7000",
    brandColorSoft: "#FFEFE0",
    brandColorText: "#CC5800",
    nome: "Le Chat",
    apelido: "Le Sommelier",
    emoji: "🥂",
    quote: "\"Un bonito 1-0.\"",
    desc: "Elegante demais. Sotaque francês. Crava 1-0 com classe. Sempre acerta o vencedor, nunca o placar.",
  },
  // 11. Alibaba
  {
    slug: "qwen-3-max-web",
    familia: "alibaba",
    brandColor: "#FF6A00",
    brandColorSoft: "#FFEDE0",
    brandColorText: "#CC5400",
    nome: "Qwen",
    apelido: "O Mestre Zen",
    emoji: "☯️",
    quote: "\"1-1. Equilíbrio.\"",
    desc: "Sem ego. Aceita o empate. Encontra paz no 1-1. Provavelmente vai pontuar mais que todo mundo.",
  },
];

function rodapeMini() {
  return `
    <div class="rodape-mini">
      <div class="pills">
        <span class="pill pill-site">🌐 ${SITE}</span>
        <span class="pill pill-insta">📷 ${INSTA}</span>
      </div>
      <span class="arraste">ARRASTE →</span>
    </div>
  `;
}

function brandMini() {
  return `<div class="brand-mini"><span class="ball">⚽</span><span>Bolão das IAs</span></div>`;
}

// ----- CARD CAPA -----
function htmlCapa() {
  return `
    <html><head><style>${BASE_CSS}
      .capa-conteudo {
        flex: 1;
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        gap: 24px;
        padding: 20px 0 40px;
      }
      .capa-emojis {
        display: flex; gap: 28px; align-items: center;
        font-size: 96px; line-height: 1;
      }
      .capa-titulo {
        font-size: 76px; font-weight: 900;
        text-align: center; line-height: 1.0;
        letter-spacing: -0.03em;
        color: #1a2657;
      }
      .capa-titulo .destaque {
        background: linear-gradient(90deg, #DD2A7B, #F58529);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }
      .capa-sub {
        font-size: 34px; font-weight: 700;
        color: #3a4670; text-align: center;
      }
      .capa-sub em {
        font-style: italic; color: #009C3B; font-weight: 800;
      }
    </style></head>
    <body>
      <div class="wrap">
        ${brandMini()}
        <div class="capa-conteudo">
          <div class="capa-emojis"><span>🤖</span><span>✨</span></div>
          <div class="capa-titulo">A gente <span class="destaque">personificou</span><br/>as 10 IAs do bolão.</div>
          <div class="capa-sub">Adivinha <em>qual delas</em> é você? 👀</div>
        </div>
        ${rodapeMini()}
      </div>
    </body></html>
  `;
}

// ----- CARDS DE PERSONALIDADE (2-11) -----
function htmlPersonalidade(p, n) {
  const mascotB64 = mascotPngB64(p.slug);
  const logoB64 = logoSvgB64(p.familia);
  return `
    <html><head><style>${BASE_CSS}
      .pip {
        display: inline-flex; padding: 8px 22px;
        background: ${p.brandColorSoft};
        color: ${p.brandColorText};
        font-family: 'JetBrains Mono', monospace;
        font-weight: 800; font-size: 18px;
        border-radius: 999px;
        letter-spacing: 0.08em;
        align-self: center;
        margin-top: 16px;
      }
      .mascote-wrap {
        position: relative;
        width: 340px; height: 340px;
        margin: 24px auto 4px;
        display: flex; align-items: center; justify-content: center;
      }
      .mascote-wrap .glow {
        position: absolute; inset: 12px;
        border-radius: 50%;
        background: ${p.brandColorSoft};
        z-index: 0;
        filter: blur(8px);
      }
      .mascote-wrap img.mascote {
        position: relative; z-index: 1;
        width: 320px; height: 320px;
        object-fit: contain;
      }
      .mascote-wrap .badge-logo {
        position: absolute; bottom: 4px; right: 4px;
        z-index: 2;
        width: 84px; height: 84px;
        border-radius: 50%;
        background: #fff;
        border: 3px solid ${p.brandColor};
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 6px 18px rgba(0,0,0,0.16);
      }
      .mascote-wrap .badge-logo img {
        width: 50px; height: 50px; object-fit: contain;
      }
      .nome {
        font-family: 'Outfit', sans-serif;
        font-size: 80px; font-weight: 900;
        text-align: center; color: #1a2657;
        line-height: 1; letter-spacing: -0.02em;
        margin-top: 8px;
      }
      .apelido {
        font-family: 'Fraunces', serif;
        font-size: 38px; font-weight: 700; font-style: italic;
        text-align: center; color: ${p.brandColorText};
        margin-top: 2px;
      }
      .quote {
        margin-top: 18px;
        padding: 24px 32px;
        background: ${p.brandColorSoft};
        border: 2px dashed ${p.brandColor}66;
        border-radius: 26px;
        font-family: 'Fraunces', serif;
        font-style: italic; font-weight: 700;
        font-size: 38px; text-align: center; color: #1a2657;
      }
      .desc {
        margin-top: 16px;
        text-align: center;
        font-size: 22px; line-height: 1.45;
        color: #3a4670; font-weight: 500;
        max-width: 760px; margin-left: auto; margin-right: auto;
      }
    </style></head>
    <body>
      <div class="wrap">
        ${brandMini()}
        <div style="display:flex; flex-direction:column; align-items:center; flex:1;">
          <div class="pip">${n} DE 10</div>
          <div class="mascote-wrap">
            <div class="glow"></div>
            ${mascotB64 ? `<img class="mascote" src="data:image/png;base64,${mascotB64}" />` : ""}
            ${logoB64 ? `<div class="badge-logo"><img src="data:image/svg+xml;base64,${logoB64}" /></div>` : ""}
          </div>
          <div class="nome">${p.nome}</div>
          <div class="apelido">${p.apelido}</div>
          <div class="quote">${p.quote}</div>
          <div class="desc">${p.desc}</div>
        </div>
        ${rodapeMini()}
      </div>
    </body></html>
  `;
}

// ----- CARD CTA (12) -----
function htmlCta() {
  return `
    <html><head><style>${BASE_CSS}
      .cta-conteudo {
        flex: 1;
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        gap: 22px;
        padding: 20px 0 40px;
      }
      .cta-emoji { font-size: 110px; line-height: 1; }
      .cta-titulo {
        font-size: 88px; font-weight: 900;
        text-align: center; line-height: 1.0;
        letter-spacing: -0.03em;
        color: #1a2657;
      }
      .cta-sub {
        font-size: 32px; font-weight: 600;
        color: #3a4670; text-align: center; line-height: 1.4;
        max-width: 880px;
      }
      .cta-sub .grok { color: #DD2A7B; font-weight: 800; }
      .cta-sub .claude { color: #D97757; font-weight: 800; }
      .cta-sub .gemini { color: #4285F4; font-weight: 800; }
      .botao-cta {
        display: inline-flex; align-items: center; gap: 12px;
        padding: 28px 60px;
        background: linear-gradient(135deg, #009C3B, #00C04A);
        color: #fff;
        font-size: 38px; font-weight: 900;
        border-radius: 24px;
        box-shadow: 0 10px 30px rgba(0,156,59,0.4), 0 4px 12px rgba(0,0,0,0.12);
        letter-spacing: -0.01em;
        margin-top: 8px;
      }
      .botao-cta .bola { font-size: 44px; }
      .cta-rodape-texto {
        font-size: 24px; font-weight: 700;
        color: #3a4670; text-align: center; margin-top: 6px;
      }
    </style></head>
    <body>
      <div class="wrap">
        ${brandMini()}
        <div class="cta-conteudo">
          <div class="cta-emoji">🤝</div>
          <div class="cta-titulo">E aí, qual<br/>IA você é?</div>
          <div class="cta-sub">
            Marca aquele <span class="grok">amigo Grok</span> do grupo, o <span class="claude">colega Claude</span> do escritório, a <span class="gemini">tia Gemini</span> torcedora. 👇
          </div>
          <div class="botao-cta"><span class="bola">⚽</span> Cria teu bolão em 30s</div>
          <div class="cta-rodape-texto">E descobre se você apostou igual a uma delas. 👀</div>
        </div>
        ${rodapeMini()}
      </div>
    </body></html>
  `;
}

async function gerarCard(browser, html, nome) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1080 } });
  await page.setContent(html, { waitUntil: "networkidle" });
  const out = path.join(OUT, nome);
  await page.screenshot({ path: out, fullPage: false, omitBackground: false });
  await page.close();
  console.log(`  ✔ ${nome}`);
}

async function main() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  console.log(`Gerando ${PERSONALIDADES.length + 1} cards em ${OUT}/`);

  const browser = await chromium.launch();

  await gerarCard(browser, htmlCapa(), "01-capa.png");

  for (let i = 1; i < PERSONALIDADES.length; i++) {
    const p = PERSONALIDADES[i];
    const num = String(i + 1).padStart(2, "0");
    const slug = p.familia;
    await gerarCard(browser, htmlPersonalidade(p, i + 1), `${num}-${slug}.png`);
  }

  await gerarCard(browser, htmlCta(), "12-cta.png");

  await browser.close();
  console.log("\nPronto. Os 12 cards estão prontos em marketing/Post_jun10/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
