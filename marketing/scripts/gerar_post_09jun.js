/**
 * Post de hoje (09/jun): "Você consegue vencer uma IA?"
 * Arte estilo gaming/eSports — humano (dourado) vs IA (ciano).
 * Inclui gera PDF de instruções na mesma pasta.
 *
 * Saída: ../Post_jun09/01-desafio.png ... 08-cta.png + RESUMO_POST_09JUN.pdf
 *
 * Uso (na pasta v4):
 *   node ../marketing/scripts/gerar_post_09jun.js
 */

const fs = require("fs");
const path = require("path");

const V4_ROOT = path.resolve(__dirname, "../../v4");
const { chromium } = require(path.join(V4_ROOT, "node_modules", "playwright"));
const LOGOS_DIR = path.join(V4_ROOT, "public", "logos");
const OUT = path.resolve(__dirname, "..", "Post_jun09");

const SITE = "bolao.arenadasias.com.br";
const INSTA = "@arena.das.ias";

function logo(familia, size = 80, monocromo = false) {
  const arq = path.join(LOGOS_DIR, `${familia}.svg`);
  if (!fs.existsSync(arq)) return "";
  const b64 = fs.readFileSync(arq).toString("base64");
  const filter = monocromo ? "filter: brightness(0) invert(1);" : "";
  return `<img src="data:image/svg+xml;base64,${b64}" style="width:${size}px;height:${size}px;object-fit:contain;flex-shrink:0;${filter}" />`;
}

// Paleta gaming/eSports
const CORES = {
  bgEscuro: "#0A0E27",
  bgEscuro2: "#161B3F",
  dourado: "#FFD700",
  douradoEscuro: "#B8860B",
  ciano: "#00F0FF",
  cianoEscuro: "#0080FF",
  rosa: "#FF0080",
  branco: "#FFFFFF",
  cinza: "#A0A8C0",
};

const BASE_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1080px; height: 1080px;
    font-family: 'Inter', -apple-system, 'Segoe UI', system-ui, sans-serif;
    color: #fff;
    background: ${CORES.bgEscuro};
    overflow: hidden; position: relative;
  }
  /* Grid sutil de fundo */
  body::before {
    content: ""; position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(0, 240, 255, 0.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 240, 255, 0.06) 1px, transparent 1px);
    background-size: 60px 60px;
    pointer-events: none;
  }
  /* Glow superior dourado/ciano */
  body::after {
    content: ""; position: absolute; top: 0; left: 0; right: 0;
    height: 8px;
    background: linear-gradient(90deg,
      ${CORES.dourado} 0%,
      ${CORES.rosa} 50%,
      ${CORES.ciano} 100%);
    box-shadow:
      0 0 30px ${CORES.dourado}80,
      0 0 60px ${CORES.ciano}50;
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
    color: ${CORES.branco}; letter-spacing: -0.01em;
  }
  .brand-mini .ball { font-size: 34px; transform: rotate(-8deg); }
  .pill {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 20px; border-radius: 999px;
    font-size: 18px; font-weight: 800;
  }
  .pill-site {
    background: ${CORES.ciano};
    color: ${CORES.bgEscuro};
  }
  .pill-insta {
    background: linear-gradient(135deg, #F58529, #DD2A7B, #8134AF);
    color: #fff;
  }
  .rodape-mini {
    margin-top: auto;
    padding-top: 18px;
    border-top: 1px solid rgba(0, 240, 255, 0.2);
    display: flex; gap: 12px; justify-content: center; align-items: center;
    flex-wrap: wrap;
  }
  .swipe {
    position: absolute; bottom: 28px; right: 64px;
    font-size: 12px; font-weight: 800;
    color: ${CORES.dourado}; letter-spacing: 0.16em;
    text-transform: uppercase;
    z-index: 3;
  }
  .badge-step {
    display: inline-block;
    font-size: 14px; font-weight: 800;
    color: ${CORES.ciano}; letter-spacing: 0.18em;
    text-transform: uppercase;
    background: rgba(0, 240, 255, 0.10);
    border: 1.5px solid ${CORES.ciano}80;
    padding: 6px 16px; border-radius: 999px;
  }
  .glow-dourado {
    text-shadow:
      0 0 20px ${CORES.dourado},
      0 0 40px ${CORES.dourado}80;
  }
  .glow-ciano {
    text-shadow:
      0 0 20px ${CORES.ciano},
      0 0 40px ${CORES.ciano}80;
  }
`;

const SLIDES = [];

// ──────────── SLIDE 1 — DESAFIO (CAPA) ────────────
SLIDES.push({
  nome: "01-desafio.png",
  body: `
    <div class="wrap" style="text-align: center; justify-content: space-between;">
      <div class="brand-mini" style="justify-content: center;">
        <span class="ball">⚽</span>
        <span>Bolão das IAs</span>
      </div>

      <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; position: relative;">
        <!-- Faces VS -->
        <div style="display: flex; align-items: center; gap: 30px; margin-bottom: 40px;">
          <div style="
            font-size: 120px; line-height: 1;
            filter: drop-shadow(0 0 30px ${CORES.dourado}aa);
          ">🧑‍💻</div>
          <div style="
            font-family: 'Inter', sans-serif;
            font-size: 88px; font-weight: 900;
            background: linear-gradient(135deg, ${CORES.dourado}, ${CORES.rosa}, ${CORES.ciano});
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            letter-spacing: -0.04em;
            transform: skewX(-8deg);
          ">VS</div>
          <div style="
            font-size: 120px; line-height: 1;
            filter: drop-shadow(0 0 30px ${CORES.ciano}aa);
          ">🤖</div>
        </div>

        <h1 style="
          font-family: 'Inter', sans-serif;
          font-size: 116px; font-weight: 900;
          color: ${CORES.branco}; line-height: 0.92;
          letter-spacing: -0.05em; margin-bottom: 28px;
          text-shadow: 0 4px 20px rgba(0,0,0,0.5);
        ">
          Você consegue<br>
          <span style="
            background: linear-gradient(135deg, ${CORES.dourado}, ${CORES.rosa});
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-shadow: 0 0 60px ${CORES.dourado}40;
          ">VENCER</span><br>
          uma IA?
        </h1>

        <p style="
          font-size: 30px; font-weight: 700;
          color: ${CORES.cinza}; line-height: 1.3;
          max-width: 760px;
        ">
          122 modelos palpitando a Copa. <br>
          <span style="color: ${CORES.ciano};">E você</span> contra <span style="color: ${CORES.dourado};">elas</span> no ranking geral.
        </p>
      </div>

      <div class="rodape-mini" style="border-top-color: rgba(255, 215, 0, 0.2);">
        <div class="pill pill-site">🌐 ${SITE}</div>
        <div class="pill pill-insta">📸 ${INSTA}</div>
      </div>
      <div class="swipe">arraste →</div>
    </div>
  `,
});

// ──────────── SLIDE 2 — NÃO FOI CHUTE ────────────
SLIDES.push({
  nome: "02-nao-foi-chute.png",
  body: `
    <div class="wrap">
      <div class="brand-mini">
        <span class="ball">⚽</span>
        <span>Bolão das IAs</span>
      </div>

      <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
        <div style="margin-bottom: 32px;">
          <span class="badge-step">01 — metodologia</span>
        </div>

        <h2 style="
          font-size: 92px; font-weight: 900;
          line-height: 0.96; letter-spacing: -0.04em;
          margin-bottom: 36px;
        ">
          Não foi chute<br>
          aleatório.
        </h2>

        <div style="
          background: linear-gradient(135deg, rgba(0,240,255,0.08), rgba(0,240,255,0.02));
          border-left: 6px solid ${CORES.ciano};
          padding: 28px 36px;
          border-radius: 0 16px 16px 0;
          margin-bottom: 28px;
        ">
          <p style="
            font-size: 32px; font-weight: 600;
            line-height: 1.4; color: ${CORES.branco};
          ">
            Cada IA recebeu o <strong style="color: ${CORES.ciano};">mesmo prompt rigoroso</strong>,
            no <strong style="color: ${CORES.dourado};">modo top</strong> de cada modelo —
            instruída a usar tudo que tem pra dar <em>o seu melhor palpite</em>.
          </p>
        </div>

        <p style="
          font-size: 24px; color: ${CORES.cinza};
          line-height: 1.45;
        ">
          Não é mágica. É <strong style="color: ${CORES.branco};">engenharia de prompt</strong> aplicada
          a um problema concreto.
        </p>
      </div>

      <div class="rodape-mini" style="border-top-color: rgba(0, 240, 255, 0.2);">
        <div class="pill pill-site">🌐 ${SITE}</div>
        <div class="pill pill-insta">📸 ${INSTA}</div>
      </div>
      <div class="swipe">arraste →</div>
    </div>
  `,
});

// ──────────── SLIDE 3 — ACESSO A TUDO ────────────
SLIDES.push({
  nome: "03-acesso.png",
  body: `
    <div class="wrap">
      <div class="brand-mini">
        <span class="ball">⚽</span>
        <span>Bolão das IAs</span>
      </div>

      <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
        <div style="margin-bottom: 28px;">
          <span class="badge-step">02 — informação</span>
        </div>

        <h2 style="
          font-size: 80px; font-weight: 900;
          line-height: 0.96; letter-spacing: -0.04em;
          margin-bottom: 36px;
        ">
          As IAs tiveram<br>
          <span style="color: ${CORES.ciano};">acesso a tudo.</span>
        </h2>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 12px;">
          <div style="
            background: rgba(0, 240, 255, 0.08);
            border: 1.5px solid ${CORES.ciano}55;
            padding: 22px 24px;
            border-radius: 16px;
          ">
            <div style="font-size: 38px; margin-bottom: 8px;">📰</div>
            <div style="font-size: 22px; font-weight: 800; color: ${CORES.branco}; margin-bottom: 4px;">Notícias atualizadas</div>
            <div style="font-size: 16px; color: ${CORES.cinza};">Última semana antes da Copa</div>
          </div>
          <div style="
            background: rgba(0, 240, 255, 0.08);
            border: 1.5px solid ${CORES.ciano}55;
            padding: 22px 24px;
            border-radius: 16px;
          ">
            <div style="font-size: 38px; margin-bottom: 8px;">🩹</div>
            <div style="font-size: 22px; font-weight: 800; color: ${CORES.branco}; margin-bottom: 4px;">Lesões e contusões</div>
            <div style="font-size: 16px; color: ${CORES.cinza};">Quem joga, quem vai DM</div>
          </div>
          <div style="
            background: rgba(0, 240, 255, 0.08);
            border: 1.5px solid ${CORES.ciano}55;
            padding: 22px 24px;
            border-radius: 16px;
          ">
            <div style="font-size: 38px; margin-bottom: 8px;">📊</div>
            <div style="font-size: 22px; font-weight: 800; color: ${CORES.branco}; margin-bottom: 4px;">Estatísticas históricas</div>
            <div style="font-size: 16px; color: ${CORES.cinza};">Confrontos diretos, desempenho</div>
          </div>
          <div style="
            background: rgba(0, 240, 255, 0.08);
            border: 1.5px solid ${CORES.ciano}55;
            padding: 22px 24px;
            border-radius: 16px;
          ">
            <div style="font-size: 38px; margin-bottom: 8px;">🌐</div>
            <div style="font-size: 22px; font-weight: 800; color: ${CORES.branco}; margin-bottom: 4px;">Busca na web ao vivo</div>
            <div style="font-size: 16px; color: ${CORES.cinza};">Web search habilitado pra cada query</div>
          </div>
        </div>

        <p style="
          font-size: 22px; color: ${CORES.cinza};
          line-height: 1.45; margin-top: 16px;
          font-style: italic;
        ">
          Tudo que um analista esportivo usaria. Em <strong style="color: ${CORES.dourado};">segundos.</strong>
        </p>
      </div>

      <div class="rodape-mini" style="border-top-color: rgba(0, 240, 255, 0.2);">
        <div class="pill pill-site">🌐 ${SITE}</div>
        <div class="pill pill-insta">📸 ${INSTA}</div>
      </div>
      <div class="swipe">arraste →</div>
    </div>
  `,
});

// ──────────── SLIDE 4 — MELHOR DE CADA MODELO ────────────
SLIDES.push({
  nome: "04-melhor-de-cada.png",
  body: `
    <div class="wrap">
      <div class="brand-mini">
        <span class="ball">⚽</span>
        <span>Bolão das IAs</span>
      </div>

      <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
        <div style="margin-bottom: 24px;">
          <span class="badge-step">03 — configuração</span>
        </div>

        <h2 style="
          font-size: 72px; font-weight: 900;
          line-height: 0.96; letter-spacing: -0.04em;
          margin-bottom: 12px;
        ">
          Cada modelo no seu<br>
          <span style="color: ${CORES.dourado};">modo mais inteligente.</span>
        </h2>

        <p style="
          font-size: 22px; color: ${CORES.cinza};
          line-height: 1.4; margin-bottom: 32px;
        ">
          Não usamos versões "rápidas e baratas". É a melhor configuração de cada IA, sem economizar.
        </p>

        <div style="display: flex; flex-direction: column; gap: 14px;">
          <div style="display: flex; align-items: center; gap: 20px; padding: 18px 22px; background: rgba(255,255,255,0.04); border-radius: 14px; border: 1px solid rgba(255,255,255,0.08);">
            ${logo("openai", 56)}
            <div style="flex: 1;">
              <div style="font-size: 24px; font-weight: 800; color: ${CORES.branco};">ChatGPT 5 Thinking</div>
              <div style="font-size: 16px; color: ${CORES.cinza};">Modo Reasoning — pensa antes de responder</div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 20px; padding: 18px 22px; background: rgba(255,255,255,0.04); border-radius: 14px; border: 1px solid rgba(255,255,255,0.08);">
            ${logo("anthropic", 56)}
            <div style="flex: 1;">
              <div style="font-size: 24px; font-weight: 800; color: ${CORES.branco};">Claude Opus 4.7</div>
              <div style="font-size: 16px; color: ${CORES.cinza};">Flagship — extended thinking habilitado</div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 20px; padding: 18px 22px; background: rgba(255,255,255,0.04); border-radius: 14px; border: 1px solid rgba(255,255,255,0.08);">
            ${logo("google", 56)}
            <div style="flex: 1;">
              <div style="font-size: 24px; font-weight: 800; color: ${CORES.branco};">Gemini 2.5 Pro</div>
              <div style="font-size: 16px; color: ${CORES.cinza};">Deep Research — cadeia de busca extensiva</div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 20px; padding: 18px 22px; background: rgba(255,255,255,0.04); border-radius: 14px; border: 1px solid rgba(255,255,255,0.08);">
            ${logo("xai", 56)}
            <div style="flex: 1;">
              <div style="font-size: 24px; font-weight: 800; color: ${CORES.branco};">Grok 4 Heavy</div>
              <div style="font-size: 16px; color: ${CORES.cinza};">Heavy mode — máxima capacidade compute</div>
            </div>
          </div>
        </div>

        <p style="text-align: right; font-size: 16px; color: ${CORES.cinza}; margin-top: 16px; font-weight: 600;">
          + outros 118 modelos rodando via API
        </p>
      </div>

      <div class="rodape-mini" style="border-top-color: rgba(0, 240, 255, 0.2);">
        <div class="pill pill-site">🌐 ${SITE}</div>
        <div class="pill pill-insta">📸 ${INSTA}</div>
      </div>
      <div class="swipe">arraste →</div>
    </div>
  `,
});

// ──────────── SLIDE 5 — COMPETIÇÃO INTERNA ────────────
SLIDES.push({
  nome: "05-competicao.png",
  body: `
    <div class="wrap">
      <div class="brand-mini">
        <span class="ball">⚽</span>
        <span>Bolão das IAs</span>
      </div>

      <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
        <div style="margin-bottom: 28px;">
          <span class="badge-step">04 — incentivo</span>
        </div>

        <h2 style="
          font-size: 84px; font-weight: 900;
          line-height: 0.94; letter-spacing: -0.04em;
          margin-bottom: 32px;
        ">
          E elas <span style="color: ${CORES.rosa};">competem</span><br>
          entre si.
        </h2>

        <div style="
          background: linear-gradient(135deg, rgba(255,0,128,0.12), rgba(255,215,0,0.06));
          border: 2px solid ${CORES.rosa}55;
          padding: 32px 36px;
          border-radius: 24px;
          margin-bottom: 28px;
        ">
          <p style="
            font-size: 32px; font-weight: 700;
            line-height: 1.4; color: ${CORES.branco};
          ">
            A instrução foi clara: <strong style="color: ${CORES.rosa};">"você está numa
            competição contra as outras 121 IAs. Quem acertar mais palpites vence."</strong>
          </p>
        </div>

        <p style="
          font-size: 26px; color: ${CORES.cinza};
          line-height: 1.5; font-weight: 500;
        ">
          Saber que estão competindo muda o nível de esforço.<br>
          Não há "tudo bem palpitar 2-1 pra qualquer jogo". <br>
          <strong style="color: ${CORES.dourado};">É pra ganhar.</strong>
        </p>
      </div>

      <div class="rodape-mini" style="border-top-color: rgba(255, 0, 128, 0.2);">
        <div class="pill pill-site">🌐 ${SITE}</div>
        <div class="pill pill-insta">📸 ${INSTA}</div>
      </div>
      <div class="swipe">arraste →</div>
    </div>
  `,
});

// ──────────── SLIDE 6 — E VOCÊ NESSA ────────────
SLIDES.push({
  nome: "06-e-voce.png",
  body: `
    <div class="wrap">
      <div class="brand-mini">
        <span class="ball">⚽</span>
        <span>Bolão das IAs</span>
      </div>

      <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
        <div style="margin-bottom: 28px;">
          <span class="badge-step" style="background: rgba(255,215,0,0.10); border-color: ${CORES.dourado}80; color: ${CORES.dourado};">
            05 — o twist
          </span>
        </div>

        <h2 style="
          font-size: 88px; font-weight: 900;
          line-height: 0.94; letter-spacing: -0.04em;
          margin-bottom: 36px;
        ">
          E aí entra você. <span class="glow-dourado" style="color: ${CORES.dourado};">🧑‍💻</span>
        </h2>

        <div style="
          background: linear-gradient(135deg,
            rgba(255,215,0,0.10),
            rgba(0,240,255,0.06));
          border: 2px solid ${CORES.dourado}55;
          padding: 32px 36px;
          border-radius: 24px;
          margin-bottom: 28px;
        ">
          <p style="
            font-size: 30px; font-weight: 700;
            line-height: 1.45; color: ${CORES.branco};
          ">
            Quem cria conta e palpita os 104 jogos entra no
            <strong style="color: ${CORES.dourado};">mesmo ranking geral</strong> que as 122 IAs.
          </p>
        </div>

        <p style="
          font-size: 28px; color: ${CORES.cinza};
          line-height: 1.4; font-weight: 600;
          text-align: center;
          margin-top: 8px;
        ">
          Vai ser <em style="color: ${CORES.dourado};">muito interessante</em><br>
          ver humanos vencendo elas. 😏
        </p>
      </div>

      <div class="rodape-mini" style="border-top-color: rgba(255, 215, 0, 0.2);">
        <div class="pill pill-site">🌐 ${SITE}</div>
        <div class="pill pill-insta">📸 ${INSTA}</div>
      </div>
      <div class="swipe">arraste →</div>
    </div>
  `,
});

// ──────────── SLIDE 7 — RANKING ────────────
SLIDES.push({
  nome: "07-ranking.png",
  body: `
    <div class="wrap">
      <div class="brand-mini">
        <span class="ball">⚽</span>
        <span>Bolão das IAs</span>
      </div>

      <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
        <div style="margin-bottom: 24px;">
          <span class="badge-step">06 — todos no mesmo placar</span>
        </div>

        <h2 style="
          font-size: 64px; font-weight: 900;
          line-height: 0.96; letter-spacing: -0.04em;
          margin-bottom: 24px;
          text-align: center;
        ">
          Humanos. IAs. <br>
          <span style="color: ${CORES.dourado};">Mesmo</span> <span style="color: ${CORES.ciano};">ranking.</span>
        </h2>

        <div style="
          background: linear-gradient(135deg,
            rgba(0,240,255,0.04),
            rgba(255,215,0,0.04));
          border: 2px solid rgba(255,255,255,0.10);
          border-radius: 20px;
          padding: 24px 28px;
          margin-top: 20px;
        ">
          <div style="
            display: flex; align-items: center; gap: 14px;
            padding: 16px 18px; background: rgba(255,215,0,0.10);
            border: 1.5px solid ${CORES.dourado}80;
            border-radius: 14px; margin-bottom: 10px;
          ">
            <span style="font-size: 28px; font-weight: 900; color: ${CORES.dourado}; min-width: 40px;">1º</span>
            <span style="font-size: 32px;">🧑‍💻</span>
            <span style="font-size: 22px; font-weight: 700; color: ${CORES.branco}; flex: 1;">Você (sonhando alto)</span>
            <span style="font-family: monospace; font-size: 22px; font-weight: 800; color: ${CORES.dourado};">487 pts</span>
          </div>
          <div style="display: flex; align-items: center; gap: 14px; padding: 14px 18px; background: rgba(255,255,255,0.04); border-radius: 14px; margin-bottom: 8px;">
            <span style="font-size: 22px; font-weight: 800; color: ${CORES.ciano}; min-width: 40px;">2º</span>
            ${logo("openai", 30)}
            <span style="font-size: 20px; font-weight: 600; color: ${CORES.branco}; flex: 1;">ChatGPT 5 Thinking</span>
            <span style="font-family: monospace; font-size: 20px; font-weight: 700; color: ${CORES.cinza};">482 pts</span>
          </div>
          <div style="display: flex; align-items: center; gap: 14px; padding: 14px 18px; background: rgba(255,255,255,0.04); border-radius: 14px; margin-bottom: 8px;">
            <span style="font-size: 22px; font-weight: 800; color: ${CORES.ciano}; min-width: 40px;">3º</span>
            ${logo("anthropic", 30)}
            <span style="font-size: 20px; font-weight: 600; color: ${CORES.branco}; flex: 1;">Claude Opus 4.7</span>
            <span style="font-family: monospace; font-size: 20px; font-weight: 700; color: ${CORES.cinza};">478 pts</span>
          </div>
          <div style="display: flex; align-items: center; gap: 14px; padding: 14px 18px; background: rgba(255,255,255,0.04); border-radius: 14px;">
            <span style="font-size: 22px; font-weight: 800; color: ${CORES.ciano}; min-width: 40px;">4º</span>
            ${logo("google", 30)}
            <span style="font-size: 20px; font-weight: 600; color: ${CORES.branco}; flex: 1;">Gemini 2.5 Pro</span>
            <span style="font-family: monospace; font-size: 20px; font-weight: 700; color: ${CORES.cinza};">471 pts</span>
          </div>
          <p style="text-align: center; font-size: 16px; color: ${CORES.cinza}; margin-top: 16px; font-style: italic;">
            ↑ exemplo ilustrativo · ranking real começa 11/jun
          </p>
        </div>
      </div>

      <div class="rodape-mini" style="border-top-color: rgba(255, 215, 0, 0.2);">
        <div class="pill pill-site">🌐 ${SITE}</div>
        <div class="pill pill-insta">📸 ${INSTA}</div>
      </div>
      <div class="swipe">arraste →</div>
    </div>
  `,
});

// ──────────── SLIDE 8 — CTA ────────────
SLIDES.push({
  nome: "08-cta.png",
  body: `
    <div class="wrap" style="text-align: center; justify-content: space-between;">
      <div class="brand-mini" style="justify-content: center;">
        <span class="ball">⚽</span>
        <span>Bolão das IAs</span>
      </div>

      <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center;">
        <div style="
          font-size: 120px; line-height: 1;
          margin-bottom: 28px;
          filter: drop-shadow(0 0 40px ${CORES.dourado}aa);
        ">⚔️</div>

        <h2 style="
          font-size: 100px; font-weight: 900;
          line-height: 0.94; letter-spacing: -0.04em;
          margin-bottom: 28px;
        ">
          <span class="glow-dourado" style="color: ${CORES.dourado};">Encara?</span>
        </h2>

        <p style="
          font-size: 30px; color: ${CORES.branco};
          line-height: 1.4; font-weight: 600;
          margin-bottom: 36px; max-width: 760px;
        ">
          Cria conta, palpita os 104 jogos,<br>
          vê seu nome subir (ou cair) no ranking.
        </p>

        <div style="
          display: inline-block;
          background: linear-gradient(135deg, ${CORES.dourado}, ${CORES.rosa});
          padding: 22px 44px; border-radius: 20px;
          color: ${CORES.bgEscuro};
          font-size: 32px; font-weight: 900;
          letter-spacing: -0.01em;
          box-shadow:
            0 12px 32px ${CORES.dourado}80,
            0 0 60px ${CORES.dourado}40;
          margin-bottom: 28px;
        ">
          🚀 ENTRAR NA DISPUTA
        </div>

        <p style="
          font-size: 20px; color: ${CORES.cinza};
          font-weight: 700; letter-spacing: 0.03em;
        ">
          🇧🇷 leva 30 segundos · grátis · sem aposta
        </p>
      </div>

      <div class="rodape-mini" style="border-top-color: rgba(255, 215, 0, 0.2); margin-top: 24px;">
        <div class="pill pill-site" style="font-size: 22px; padding: 14px 26px;">🌐 ${SITE}</div>
        <div class="pill pill-insta" style="font-size: 22px; padding: 14px 26px;">📸 ${INSTA}</div>
      </div>
    </div>
  `,
});

async function gerarSlides() {
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
}

// ──── PDF INSTRUÇÕES ────
const PDF_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Post 09/jun — Você consegue vencer uma IA?</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, 'Segoe UI', system-ui, sans-serif;
    color: #1A1A1A;
    line-height: 1.55;
    font-size: 10.5pt;
  }
  .top-stripe {
    height: 4px;
    background: linear-gradient(90deg, #FFD700 0%, #FF0080 50%, #00F0FF 100%);
    margin-bottom: 18pt;
  }
  .header {
    display: flex; align-items: center; gap: 12px;
    padding-bottom: 14pt; margin-bottom: 16pt;
    border-bottom: 1px solid #DDD;
  }
  .header .icon { font-size: 32pt; line-height: 1; }
  .header .title {
    font-size: 22pt; font-weight: 900;
    color: #0A0E27; letter-spacing: -0.02em; line-height: 1.1;
  }
  .header .sub {
    font-size: 9.5pt; color: #666; font-weight: 600;
    margin-top: 2pt;
  }
  h1 {
    font-size: 17pt; font-weight: 900;
    color: #0A0E27; margin-top: 18pt; margin-bottom: 8pt;
    letter-spacing: -0.02em;
    page-break-after: avoid;
  }
  h2 {
    font-size: 12.5pt; font-weight: 800;
    color: #0A0E27; margin-top: 14pt; margin-bottom: 6pt;
    page-break-after: avoid;
  }
  h3 {
    font-size: 11pt; font-weight: 800;
    color: #DD2A7B; margin-top: 10pt; margin-bottom: 4pt;
    page-break-after: avoid;
  }
  p { margin-bottom: 6pt; }
  ul, ol { margin: 4pt 0 8pt 18pt; }
  ul li, ol li { margin-bottom: 4pt; }
  strong { color: #0A0E27; }
  em { color: #DD2A7B; font-style: italic; font-weight: 600; }
  code, .mono {
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    background: #F4F5F7;
    padding: 1px 6px; border-radius: 4px;
    font-size: 9.5pt;
  }
  .destaque {
    background: linear-gradient(135deg, rgba(255,215,0,0.10), rgba(0,240,255,0.06));
    border-left: 4px solid #FFD700;
    padding: 10pt 14pt;
    margin: 10pt 0;
    border-radius: 0 8px 8px 0;
  }
  .destaque strong { color: #B8860B; }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 8pt 0 12pt;
    font-size: 9.5pt;
    page-break-inside: avoid;
  }
  th {
    background: #0A0E27; color: #fff;
    text-align: left; padding: 6pt 8pt;
    font-weight: 700;
  }
  td {
    padding: 6pt 8pt;
    border-bottom: 1px solid #EEE;
    vertical-align: top;
  }
  tr:nth-child(even) td { background: #FAFBFD; }
  .caption-box {
    background: #0A0E27;
    color: #F5F5F5;
    padding: 14pt 16pt;
    border-radius: 10px;
    margin: 10pt 0;
    font-family: 'JetBrains Mono', monospace;
    font-size: 9.5pt; line-height: 1.5;
    white-space: pre-wrap;
    page-break-inside: avoid;
  }
  .checklist {
    background: #F8FAFC;
    border: 1.5px solid #FFD700;
    border-radius: 12px;
    padding: 14pt 16pt;
    margin: 12pt 0;
    page-break-inside: avoid;
  }
  .checklist ol { margin-left: 16pt; }
  .checklist li {
    margin-bottom: 6pt;
    font-size: 10.5pt; line-height: 1.5;
  }
  .checklist li::marker { font-weight: 900; color: #B8860B; }
  .footer {
    margin-top: 24pt;
    padding-top: 14pt;
    border-top: 2px dashed #DDD;
    text-align: center;
    font-size: 9pt;
    color: #888;
  }
  .footer strong { color: #0A0E27; font-weight: 800; }
  .pill {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3pt 8pt;
    border-radius: 999px;
    font-size: 9pt; font-weight: 700;
    color: #fff;
    margin: 2pt 2pt 2pt 0;
  }
  .pill-site { background: #00F0FF; color: #0A0E27; }
  .pill-insta { background: linear-gradient(135deg, #F58529, #DD2A7B, #8134AF); }
</style>
</head>
<body>

<div class="top-stripe"></div>

<div class="header">
  <div class="icon">⚔️</div>
  <div>
    <div class="title">Post de hoje — 09/jun/2026</div>
    <div class="sub">"Você consegue vencer uma IA?" · D-2 da Copa · Bolão das IAs</div>
  </div>
</div>

<div class="destaque">
  <strong>Mensagem central</strong> — As IAs não chutaram aleatoriamente. Receberam o mesmo prompt rigoroso, no modo top de cada modelo, com acesso a notícias, lesões, estatísticas e busca na web ao vivo. E foram instruídas a competir entre si pelo melhor palpite. Agora <em>os humanos</em> também entram no mesmo ranking.
</div>

<h1>📦 Carrossel pronto</h1>

<p>
  8 cards (1080×1080) em <span class="mono">marketing/Post_jun09/</span>.
  Visual gaming/eSports — humano dourado vs IA ciano elétrico, fundo escuro com grid sutil.
</p>

<table>
  <thead>
    <tr>
      <th style="width: 38pt;">#</th>
      <th>Conteúdo</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>01</td><td><strong>Desafio</strong> — "Você consegue VENCER uma IA?" (capa com 🧑‍💻 vs 🤖)</td></tr>
    <tr><td>02</td><td><strong>Não foi chute</strong> — engenharia de prompt aplicada a problema concreto</td></tr>
    <tr><td>03</td><td><strong>Acesso a tudo</strong> — notícias, lesões, estatísticas, busca na web ao vivo</td></tr>
    <tr><td>04</td><td><strong>Melhor de cada modelo</strong> — Reasoning / Extended Thinking / Deep Research / Heavy</td></tr>
    <tr><td>05</td><td><strong>Competição entre IAs</strong> — instruídas a competir entre si pelo melhor palpite</td></tr>
    <tr><td>06</td><td><strong>E aí entra você</strong> — humanos no mesmo ranking que as 122 IAs</td></tr>
    <tr><td>07</td><td><strong>Ranking</strong> — mock visual mostrando humano em 1º acima das IAs</td></tr>
    <tr><td>08</td><td><strong>CTA</strong> — "Encara? ENTRAR NA DISPUTA"</td></tr>
  </tbody>
</table>

<h1>⏰ Horário ideal pra hoje (terça, 09/jun)</h1>

<div class="destaque">
  <strong>Janela ótima: 19h-21h BRT</strong>, com <strong>pico estratégico às 19h30</strong>.
</div>

<p><strong>Por quê hoje:</strong></p>
<ul>
  <li>Galera saiu do trabalho/jantou — feed Insta ativo</li>
  <li>D-2 da Copa: conversas sobre futebol esquentando, sua arte se destaca</li>
  <li>Tom de desafio/duelo retém atenção; algoritmo lê tempo gasto e empurra mais</li>
  <li>Postar 19h30 e responder TUDO até 21h — janela crítica do algoritmo</li>
</ul>

<h1>📝 Caption pronta pra colar</h1>

<div class="caption-box">VOCÊ CONSEGUE VENCER UMA IA? 🧑‍💻⚔️🤖

A gente colocou 122 modelos de IA pra palpitar a Copa 2026. Mas não foi chute aleatório.

Cada uma rodou no modo MAIS INTELIGENTE:
🧠 ChatGPT 5 Thinking
🧠 Claude Opus 4.7 (extended thinking)
🧠 Gemini 2.5 Pro (Deep Research)
🧠 Grok 4 Heavy
🧠 + outros 118 modelos

Com acesso a TUDO:
📰 notícias atualizadas da semana
🩹 lesões e contusões dos jogadores
📊 estatística histórica e confrontos diretos
🌐 busca na web ao vivo durante o palpite

E mais: foram instruídas a competir entre si — "vocês estão numa competição com as outras 121 IAs. Quem acerta mais, ganha."

Então não foi palpite displicente. Foi o MELHOR que essas máquinas conseguem dar.

E agora a parte interessante: humanos podem entrar no mesmo ranking. Cria conta, palpita os 104 jogos, e vê seu nome subir (ou cair) contra ChatGPT, Claude, Gemini, Grok.

Vai ser MUITO interessante ver humanos vencendo elas. 😏

⚔️ bolao.arenadasias.com.br
📸 segue @arena.das.ias

#BolaoDaCopa #Copa2026 #FifaWorldCup2026 #ChatGPT #Claude #Gemini #Grok #DeepSeek #IA #InteligenciaArtificial #HumanosVsIA #BolaoDasIAs #ArenaDasIAs #PalpitesDaCopa #BrasilNaCopa #TechBR #BattleOfTheBots</div>

<h1>💡 Por que esse formato funciona</h1>

<table>
  <thead>
    <tr>
      <th>Aspecto</th>
      <th>Efeito esperado</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Tom de desafio direto</strong></td>
      <td>"Você consegue vencer?" gera resposta automática ("vou tentar")</td>
    </tr>
    <tr>
      <td><strong>Estética gaming</strong></td>
      <td>Diferencia do feed BR padrão; retém quem rola, especialmente público tech/young</td>
    </tr>
    <tr>
      <td><strong>Credibilidade técnica</strong></td>
      <td>Mostrar o rigor metodológico vence o "ah, é só chute" e atrai público que respeita o trabalho</td>
    </tr>
    <tr>
      <td><strong>Mecânica competitiva</strong></td>
      <td>Ranking público com humanos vs IAs cria curiosidade contínua e retenção</td>
    </tr>
    <tr>
      <td><strong>Reabilitação do humano</strong></td>
      <td>Em era de "IA toma tudo", a chance de bater nelas em algo concreto é poderosa</td>
    </tr>
  </tbody>
</table>

<h1>🚀 Táticas pós-publicação</h1>

<div class="checklist">
  <h3 style="margin-top: 0; color: #0A0E27;">Checklist (5 min de trabalho, alto retorno)</h3>
  <ol>
    <li>
      <strong>Stories</strong>:
      <ul style="margin-top: 4pt;">
        <li>Story 1: print do Card 1 com adesivo "🆕 NOVO POST"</li>
        <li>Story 2: enquete "Você acha que vence uma IA?" → Sim / Sem chance</li>
        <li>Story 3: print do ranking mock (Card 7) com texto "imagina seu nome aqui"</li>
      </ul>
    </li>
    <li>
      <strong>WhatsApp</strong>: manda Card 1 + link em 3-5 grupos com texto curto: <em>"Caraca, você consegue vencer uma IA num bolão? Bora descobrir 👀"</em>
    </li>
    <li>
      <strong>DM pra 5-10 amigos</strong>: pedido honesto de curtir+comentar nas primeiras 30 minutos (algoritmo Insta lê os primeiros sinais como referência).
    </li>
    <li>
      <strong>LinkedIn</strong>: versão técnica do post — "Brincando com IA: avaliação prática de 122 LLMs em tarefa de predição estruturada (Copa do Mundo)" — tech recruiters e devs adoram, gera tração orgânica boa.
    </li>
    <li>
      <strong>Comentário em pages grandes</strong>: GE, Globo Esporte, OneFootball, SporTV têm posts hoje à noite. Comenta algo divertido tipo: <em>"Bom, dei meu palpite, agora é ver se as 122 IAs do bolao.arenadasias.com.br batem o meu 😅"</em> → tráfego orgânico free.
    </li>
  </ol>
</div>

<div class="footer">
  <p>
    <span class="pill pill-site">🌐 bolao.arenadasias.com.br</span>
    <span class="pill pill-insta">📸 @arena.das.ias</span>
  </p>
  <p style="margin-top: 8pt;">
    <strong>Bolão das IAs</strong> · Post de 09/jun/2026 · D-2 da Copa 2026
  </p>
</div>

</body>
</html>`;

async function gerarPdf() {
  const out = path.join(OUT, "RESUMO_POST_09JUN.pdf");
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(PDF_HTML, { waitUntil: "networkidle" });
  await page.pdf({
    path: out,
    format: "A4",
    printBackground: true,
    margin: { top: "12mm", bottom: "12mm", left: "12mm", right: "12mm" },
  });
  await browser.close();
  const stats = fs.statSync(out);
  console.log(`✓ PDF: ${out} (${(stats.size / 1024).toFixed(1)} KB)`);
}

async function main() {
  await gerarSlides();
  console.log("");
  await gerarPdf();
  console.log(`\n${SLIDES.length} slides + PDF em ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
