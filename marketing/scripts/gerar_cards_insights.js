/**
 * Gera 9 cards individuais (1080×1350) com os melhores insights do balanço
 * final do Bolão das IAs — Copa 2026. Números de marketing/INSIGHTS_FINAIS.md.
 *
 * Uso (na raiz do repo):
 *   node marketing/scripts/gerar_cards_insights.js          # todos
 *   node marketing/scripts/gerar_cards_insights.js 82 85    # só alguns
 *
 * Saída: marketing/brainstorming_instagram/NN_card_<slug>/card.png
 */

"use strict";

const fs   = require("fs");
const path = require("path");

const V4_ROOT = path.resolve(__dirname, "../../v4");
const { chromium } = require(path.join(V4_ROOT, "node_modules", "playwright"));

const IG_DIR = path.resolve(__dirname, "../brainstorming_instagram");
const SITE   = "bolao.arenadasias.com.br";
const INSTA  = "@arena.das.ias";

// ── Brand CSS (cosmic purple — mesma base do carrossel 77) ────────────────────

const BASE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&family=Archivo+Black&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  width: 1080px; height: 1350px;
  font-family: 'Sora', -apple-system, 'Segoe UI', system-ui, sans-serif;
  color: #fff;
  background: #0a0518;
  overflow: hidden; position: relative;
}

body::before {
  content: "";
  position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(ellipse 900px 700px at 50% 30%, #2a1257 0%, #150a2e 55%, #0a0518 100%);
}

.stars { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
.stars i {
  position: absolute; border-radius: 50%; background: #fff;
  animation: tw 2.6s ease-in-out infinite;
}
@keyframes tw { 0%,100%{opacity:.1;transform:scale(.5)} 50%{opacity:.7;transform:scale(1.2)} }

.glow {
  position: absolute; left: 50%; top: 32%; width: 800px; height: 800px;
  transform: translate(-50%, -50%); z-index: 0;
  background: radial-gradient(circle, rgba(157,78,221,.4) 0%, transparent 65%);
  filter: blur(16px);
}

.wrap {
  position: relative; z-index: 2;
  padding: 50px 68px 42px;
  height: 100%;
  display: flex; flex-direction: column;
}

.brand-mini {
  display: flex; align-items: center; gap: 12px;
  font-size: 22px; font-weight: 800;
  color: #cdb4ff; letter-spacing: -0.01em;
  flex-shrink: 0;
}
.brand-mini .ball { font-size: 30px; }

.rodape-mini {
  margin-top: auto;
  padding-top: 20px;
  border-top: 1px solid rgba(205,180,255,.2);
  display: flex; gap: 12px; justify-content: center; align-items: center;
  flex-shrink: 0;
}
.pill {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 22px; border-radius: 999px;
  font-size: 19px; font-weight: 800; color: #fff;
}
.pill-site {
  background: linear-gradient(135deg, #9d4edd, #6d28d9);
  box-shadow: 0 4px 20px rgba(157,78,221,.4);
}
.pill-insta {
  background: linear-gradient(135deg, #F58529, #DD2A7B, #8134AF);
}

.kicker {
  font-size: 17px; font-weight: 800; letter-spacing: 0.16em;
  text-transform: uppercase; color: #9d4edd; margin-bottom: 12px;
}

.h-white {
  font-family: 'Archivo Black', Impact, sans-serif;
  color: #fff; line-height: 1.02; letter-spacing: -0.03em;
}
.grad-purple {
  background: linear-gradient(135deg, #cdb4ff, #9d4edd);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}
.grad-gold {
  background: linear-gradient(135deg, #ffd34d, #ffb300 50%, #fff7a0);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}
.grad-green {
  background: linear-gradient(135deg, #4ade80, #22d3ee);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}
.grad-red {
  background: linear-gradient(135deg, #f87171, #ef4444);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Chip de fato (linha com ícone + texto) */
.fato {
  display: flex; align-items: center; gap: 20px;
  padding: 18px 26px; border-radius: 16px;
  background: rgba(255,255,255,.06);
  border: 1.5px solid rgba(205,180,255,.22);
  text-align: left;
}
.fato .ico { font-size: 40px; flex-shrink: 0; line-height: 1; }
.fato .tit {
  font-family: 'Archivo Black', Impact, sans-serif;
  font-size: 27px; color: #fff; line-height: 1.15;
}
.fato .sub { font-size: 19px; color: #cdb4ff; font-weight: 600; margin-top: 5px; line-height: 1.35; }

.fato-gold  { background: linear-gradient(135deg, rgba(255,211,77,.14), rgba(255,179,0,.05)); border-color: rgba(255,211,77,.45); }
.fato-green { background: rgba(74,222,128,.10); border-color: rgba(74,222,128,.38); }
.fato-red   { background: rgba(239,68,68,.11);  border-color: rgba(239,68,68,.45); }
.fato-purp  { background: linear-gradient(135deg, rgba(157,78,221,.16), rgba(157,78,221,.05)); border-color: rgba(157,78,221,.45); }

/* Número-herói dentro de caixa */
.hero-box {
  padding: 26px 46px; border-radius: 26px;
  display: inline-flex; flex-direction: column; align-items: center; gap: 4px;
}
.hero-num {
  font-family: 'Archivo Black', Impact, sans-serif;
  line-height: 0.95; letter-spacing: -0.02em;
}
.hero-cap { font-size: 25px; font-weight: 800; color: #fff; line-height: 1.3; }

.bandeira { border-radius: 50%; object-fit: cover; vertical-align: middle; }

/* Chip circular branco pra logos escuros */
.logochip {
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 50%; background: #fff; flex-shrink: 0;
  box-shadow: 0 4px 18px rgba(0,0,0,.35);
}
.logochip img { width: 60%; height: 60%; object-fit: contain; }
`;

// ── Helpers ───────────────────────────────────────────────────────────────────

// Bandeiras: emoji de bandeira NÃO renderiza no Chromium headless/Windows.
// SVG circular do circle-flags, igual aos outros scripts.
function bandeira(iso, size, extraStyle = "") {
  return `<img class="bandeira" style="width:${size}px;height:${size}px;${extraStyle}" src="https://hatscripts.github.io/circle-flags/flags/${iso}.svg" />`;
}

// Logos de marcas (SVGs locais, alguns pretos) → chip circular branco + data URI.
function logo(name, size) {
  const p = path.join(V4_ROOT, "public", "logos", `${name}.svg`);
  const b64 = fs.readFileSync(p).toString("base64");
  return `<span class="logochip" style="width:${size}px;height:${size}px;">
    <img src="data:image/svg+xml;base64,${b64}" />
  </span>`;
}

function stars(n = 60) {
  return `
    <div class="stars" id="stars"></div>
    <script>
      const s=document.getElementById('stars'); let h='';
      for(let i=0;i<${n};i++){const z=1+Math.random()*2.2;h+='<i style="left:'+Math.random()*100+'%;top:'+Math.random()*100+'%;width:'+z+'px;height:'+z+'px;animation-delay:'+(Math.random()*2.6).toFixed(2)+'s"></i>';}
      s.innerHTML=h;
    </script>`;
}

function header(sub) {
  return `
    <div class="brand-mini" style="justify-content:center;">
      <span class="ball">⚽</span>
      <span>Bolão das IAs · ${sub}</span>
    </div>`;
}

function rodape() {
  return `
    <div class="rodape-mini">
      <div class="pill pill-site">🌐 ${SITE}</div>
      <div class="pill pill-insta">📸 ${INSTA}</div>
    </div>`;
}

// ── Cards ─────────────────────────────────────────────────────────────────────

const CARDS = [];

// 78 — A campeã que NENHUMA IA viu
CARDS.push({
  dir: "78_card_campea-que-nenhuma-ia-viu",
  body: `
    ${stars(70)}
    <div class="glow" style="background:radial-gradient(circle, rgba(255,211,77,.32) 0%, transparent 62%);"></div>
    <div class="wrap" style="text-align:center;">
      ${header("Balanço Final")}

      <div style="flex:1; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:26px;">

        <div style="filter:drop-shadow(0 0 50px rgba(255,211,77,.55));">
          ${bandeira("es", 250)}
        </div>

        <div>
          <div class="kicker" style="color:#ffd34d;">🏆 Espanha campeã do mundo</div>
          <h1 class="h-white" style="font-size:72px; max-width:920px;">
            A campeã que<br><span class="grad-red">NENHUMA IA viu</span>
          </h1>
        </div>

        <div class="hero-box" style="background:rgba(239,68,68,.12); border:2px solid rgba(239,68,68,.5);">
          <div class="hero-num grad-red" style="font-size:118px;">0 de 62</div>
          <div class="hero-cap">IAs apostaram na Espanha na semifinal<br><span style="color:#cdb4ff; font-weight:700;">França 0×2 Espanha · 49 previram 1×1, 13 deram França</span></div>
        </div>

        <div class="fato fato-gold" style="max-width:880px;">
          <div class="ico">🔮</div>
          <div>
            <div class="tit" style="color:#ffd34d;">1 voto em 56 predições de campeão</div>
            <div class="sub">Nas 6 rodadas de simulação: França 28 votos · Brasil 15 · Argentina 12 · <strong style="color:#ffd34d;">Espanha 1</strong></div>
          </div>
        </div>
      </div>

      ${rodape()}
    </div>
  `,
});

// 79 — Claude, a única que sabia
CARDS.push({
  dir: "79_card_claude-a-unica-que-sabia",
  body: `
    ${stars(70)}
    <div class="glow"></div>
    <div class="wrap" style="text-align:center;">
      ${header("Balanço Final")}

      <div style="flex:1; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:36px;">

        ${logo("anthropic", 180)}

        <div>
          <div class="kicker" style="font-size:22px;">Claude Opus 4.8</div>
          <h1 class="h-white" style="font-size:86px; max-width:940px;">
            A única IA<br><span class="grad-gold">que sabia</span>
          </h1>
        </div>

        <div style="display:flex; flex-direction:column; gap:20px; width:100%; max-width:920px;">
          <div class="fato fato-gold" style="padding:24px 30px;">
            <div class="ico" style="font-size:48px;">🗳️</div>
            <div>
              <div class="tit" style="color:#ffd34d; font-size:32px;">Único voto "Espanha campeã" do torneio</div>
              <div class="sub" style="font-size:21px;">1 predição em 56 — rodada de 02/07, quando ninguém acreditava</div>
            </div>
          </div>
          <div class="fato fato-green" style="padding:24px 30px;">
            <div class="ico" style="font-size:48px;">🎯</div>
            <div>
              <div class="tit" style="color:#4ade80; font-size:32px;">Cravou o 1×0 exato da final</div>
              <div class="sub" style="font-size:21px;">Espanha 1×0 Argentina — placar cheio, 20 pontos</div>
            </div>
          </div>
          <div class="fato fato-purp" style="padding:24px 30px;">
            <div class="ico" style="font-size:48px;">🥉</div>
            <div>
              <div class="tit" style="color:#cdb4ff; font-size:32px;">Pódio da Série A — 573 pts, 20 cravadas</div>
              <div class="sub" style="font-size:21px;">3ª entre as 12 grandes marcas — com mais placares exatos que o campeão</div>
            </div>
          </div>
        </div>

        <p style="font-size:30px; font-weight:700; color:rgba(255,255,255,.85); max-width:800px; line-height:1.4;">
          A IA que <strong class="grad-gold" style="font-weight:900;">"sabia"</strong> — e ninguém ouviu.
        </p>
      </div>

      ${rodape()}
    </div>
  `,
});

// 80 — As duas Llamas que previram a queda do Brasil
CARDS.push({
  dir: "80_card_llamas-previram-queda-brasil",
  body: `
    ${stars(70)}
    <div class="glow"></div>
    <div class="wrap" style="text-align:center;">
      ${header("Balanço Final")}

      <div style="flex:1; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:30px;">

        <div style="display:flex; align-items:center; gap:32px;">
          <div style="filter:grayscale(75%) brightness(.75); opacity:.85;">${bandeira("br", 190)}</div>
          <div style="font-size:136px; line-height:1; filter:drop-shadow(0 0 30px rgba(255,211,77,.4));">🦙🦙</div>
        </div>

        <div>
          <div class="kicker" style="color:#f87171; font-size:21px;">Oitavas · Brasil 1×2 Noruega</div>
          <h1 class="h-white" style="font-size:70px; max-width:960px;">
            As duas IAs que previram<br><span class="grad-red">a queda do Brasil</span>
          </h1>
        </div>

        <div class="hero-box" style="background:rgba(255,211,77,.10); border:2px solid rgba(255,211,77,.45); padding:24px 50px;">
          <div class="hero-num grad-gold" style="font-size:110px;">2 de 59</div>
          <div class="hero-cap" style="font-size:27px;">apostaram na zebra da Noruega —<br><span class="grad-gold" style="font-weight:900;">e as duas se chamam Llama</span></div>
        </div>

        <div style="display:flex; flex-direction:column; gap:14px; width:100%; max-width:880px;">
          <div class="fato fato-green">
            <div class="ico">🎯</div>
            <div>
              <div class="tit" style="color:#4ade80;">Llama 3.1 70B e Llama 3.3 70B cravaram o 1×2</div>
              <div class="sub">Placar exato, 20 pts cada — enquanto 32 IAs davam Brasil e 25 davam empate</div>
            </div>
          </div>
          <div class="fato">
            <div class="ico">${bandeira("br", 46)}</div>
            <div>
              <div class="tit">A melhor "brasilóloga" é open-source de 2024</div>
              <div class="sub">Llama 3.1 70B: 55 de 70 pts possíveis nos 5 jogos do Brasil</div>
            </div>
          </div>
        </div>
      </div>

      ${rodape()}
    </div>
  `,
});

// 81 — Pro consenso das IAs, o Brasil ia ser campeão
CARDS.push({
  dir: "81_card_brasil-campeao-ate-o-fim",
  body: `
    ${stars(70)}
    <div class="glow" style="background:radial-gradient(circle, rgba(255,211,77,.3) 0%, transparent 62%);"></div>
    <div class="wrap" style="text-align:center;">
      ${header("Bola de Cristal")}

      <div style="flex:1; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:26px;">

        <div style="position:relative; display:inline-block;">
          <div style="font-size:150px; line-height:1; filter:drop-shadow(0 0 44px rgba(255,211,77,.55));">🏆</div>
          <div style="position:absolute; right:-64px; bottom:-6px; filter:grayscale(80%) brightness(.65); opacity:.8;">
            ${bandeira("br", 110)}
          </div>
        </div>

        <div>
          <div class="kicker" style="color:#ffd34d;">A profecia que não rolou</div>
          <h1 class="h-white" style="font-size:64px; max-width:940px;">
            Pro consenso das IAs,<br><span class="grad-gold">o Brasil ia ser campeão</span>
          </h1>
        </div>

        <div class="hero-box" style="background:rgba(255,211,77,.10); border:2px solid rgba(255,211,77,.45); padding:20px 46px;">
          <div class="hero-num grad-gold" style="font-size:104px;">10 de 11</div>
          <div class="hero-cap">IAs coroaram o Brasil na última rodada<br>de predições (14/07) — a 11ª disse França</div>
        </div>

        <div style="display:flex; flex-direction:column; gap:14px; width:100%; max-width:880px;">
          <div class="fato fato-purp">
            <div class="ico">🔮</div>
            <div>
              <div class="tit" style="color:#cdb4ff;">Bola de Cristal cravou: BRASIL campeão</div>
              <div class="sub">Nas 6 rodadas, o consenso só oscilou entre Brasil (3×) e França (3×) — nunca Espanha</div>
            </div>
          </div>
          <div class="fato fato-red">
            <div class="ico">🫠</div>
            <div>
              <div class="tit" style="color:#f87171;">Só que o Brasil já estava eliminado</div>
              <div class="sub">Caiu 1×2 pra Noruega nas oitavas, em 05/07 — nove dias antes</div>
            </div>
          </div>
        </div>
      </div>

      ${rodape()}
    </div>
  `,
});

// 82 — David × Golias (baratos × caros)
CARDS.push({
  dir: "82_card_david-x-golias",
  body: `
    ${stars(60)}
    <div class="glow"></div>
    <div class="wrap">
      ${header("Balanço Final")}

      <div style="flex:1; display:flex; flex-direction:column; justify-content:center; gap:36px;">
        <div style="text-align:center;">
          <div class="kicker" style="color:#4ade80; font-size:21px;">🪨 David × Golias</div>
          <h1 class="h-white" style="font-size:68px;">
            Os modelos baratos<br><span class="grad-green">HUMILHARAM os caros</span>
          </h1>
        </div>

        <div style="display:flex; flex-direction:column; gap:18px;">
          ${[
            { lg: "mistral",   peq: "Mistral Small 3", pp: 636, gra: "Medium 3 601 · Large 562", coroa: "🏆 campeão do bolão" },
            { lg: "xai",       peq: "Grok 4 Fast",     pp: 636, gra: "Grok 4 Heavy 583 · Grok 4 569", coroa: "🏆 co-campeão" },
            { lg: "openai",    peq: "o4-mini",         pp: 634, gra: "o3 605", coroa: "🥉 3º lugar geral" },
            { lg: "google",    peq: "Gemini 2.5 Flash", pp: 562, gra: "Gemini 2.5 Pro 480", coroa: "+82 pts no irmão caro" },
          ].map(d => `
            <div style="
              display:flex; align-items:center; gap:24px;
              padding:24px 30px; border-radius:20px;
              background:rgba(255,255,255,.06); border:1.5px solid rgba(205,180,255,.22);
            ">
              ${logo(d.lg, 84)}
              <div style="flex:1; text-align:left;">
                <div style="display:flex; align-items:baseline; gap:14px;">
                  <span style="font-family:'Archivo Black',Impact,sans-serif; font-size:33px; color:#4ade80;">${d.peq}</span>
                  <span style="font-family:'Archivo Black',Impact,sans-serif; font-size:38px; color:#4ade80;">${d.pp}</span>
                  <span style="font-size:24px; font-weight:800; color:rgba(255,255,255,.45);">›</span>
                  <span style="font-size:24px; font-weight:700; color:rgba(255,255,255,.55);">${d.gra}</span>
                </div>
                <div style="font-size:20px; font-weight:700; color:#ffd34d; margin-top:5px;">${d.coroa}</div>
              </div>
            </div>
          `).join("")}
        </div>

        <div class="fato fato-green" style="justify-content:center; text-align:center; padding:24px 30px;">
          <div>
            <div class="tit" style="color:#4ade80; font-size:32px;">Em 4 das 5 famílias, o PEQUENO venceu</div>
            <div class="sub" style="font-size:21px;">Raciocinar caro não ajudou a prever futebol — o pequeno custa centavos</div>
          </div>
        </div>
      </div>

      ${rodape()}
    </div>
  `,
});

// 83 — Gabriel, o humano que bateu 121 IAs
CARDS.push({
  dir: "83_card_gabriel-humano-vs-maquinas",
  body: `
    ${stars(60)}
    <div class="glow" style="background:radial-gradient(circle, rgba(74,222,128,.28) 0%, transparent 62%);"></div>
    <div class="wrap" style="text-align:center;">
      ${header("Humanos × Máquinas")}

      <div style="flex:1; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:24px;">

        <div style="display:flex; align-items:center; gap:26px;">
          <div style="font-size:130px; line-height:1; filter:drop-shadow(0 0 40px rgba(74,222,128,.6));">🧠</div>
          <div style="font-family:'Archivo Black',Impact,sans-serif; font-size:44px; color:#ffd34d;">×</div>
          <div style="width:330px; font-size:34px; line-height:1.35; letter-spacing:4px; opacity:.55;">
            🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖
          </div>
        </div>

        <div>
          <div class="kicker" style="color:#4ade80;">Gabriel · bolão humano</div>
          <h1 class="h-white" style="font-size:64px; max-width:940px;">
            Um humano bateu<br><span class="grad-green">121 das 124 IAs</span>
          </h1>
        </div>

        <div class="hero-box" style="background:rgba(74,222,128,.10); border:2px solid rgba(74,222,128,.45); padding:20px 46px;">
          <div class="hero-num grad-green" style="font-size:96px;">629 pts · 4º</div>
          <div class="hero-cap">no ranking geral — a <strong class="grad-gold" style="font-weight:900;">7 pontos do título</strong></div>
        </div>

        <div style="display:flex; flex-direction:column; gap:14px; width:100%; max-width:880px;">
          <div class="fato">
            <div class="ico">🤖</div>
            <div>
              <div class="tit">Só perdeu pra 3 máquinas</div>
              <div class="sub">Mistral Small 3 (636), Grok 4 Fast (636) e o4-mini (634) — bateu GPT-5, Claude, Gemini e Grok Heavy</div>
            </div>
          </div>
          <div class="fato fato-gold">
            <div class="ico">📈</div>
            <div>
              <div class="tit" style="color:#ffd34d;">+96 pts acima da média das IAs</div>
              <div class="sub">Média das que palpitaram tudo: 533. Até o criador do bolão (551) bateu 95 das 124</div>
            </div>
          </div>
        </div>
      </div>

      ${rodape()}
    </div>
  `,
});

// 84 — A final que 17 IAs cravaram
CARDS.push({
  dir: "84_card_17-cravaram-final",
  body: `
    ${stars(70)}
    <div class="glow"></div>
    <div class="wrap" style="text-align:center;">
      ${header("A Final")}

      <div style="flex:1; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:32px;">

        <div style="display:flex; align-items:center; gap:38px;">
          ${bandeira("es", 170, "filter:drop-shadow(0 0 30px rgba(255,211,77,.45));")}
          <div class="hero-num grad-gold" style="font-size:170px;">1×0</div>
          ${bandeira("ar", 170, "opacity:.75; filter:grayscale(35%);")}
        </div>

        <div>
          <div class="kicker" style="color:#ffd34d; font-size:21px;">Espanha 1×0 Argentina</div>
          <h1 class="h-white" style="font-size:64px; max-width:960px;">
            A final que <span class="grad-gold">17 IAs cravaram</span><br>(mas o consenso errou)
          </h1>
        </div>

        <div style="display:flex; flex-direction:column; gap:16px; width:100%; max-width:920px;">
          <div class="fato fato-red" style="padding:22px 28px;">
            <div class="ico" style="font-size:44px;">🔮</div>
            <div>
              <div class="tit" style="color:#f87171; font-size:30px;">Consenso previu 1×1 — errou</div>
              <div class="sub" style="font-size:20px;">41 das 62 IAs apostaram no empate — pelo voto das máquinas, ia pros pênaltis</div>
            </div>
          </div>
          <div class="fato fato-green" style="padding:22px 28px;">
            <div class="ico" style="font-size:44px;">🎯</div>
            <div>
              <div class="tit" style="color:#4ade80; font-size:30px;">17 IAs cravaram o 1×0 — 20 pts cada</div>
              <div class="sub" style="font-size:20px;">ChatGPT 5, Claude Opus 4.8 web, o3, o4-mini, Grok 4 Heavy web, Qwen 3…</div>
            </div>
          </div>
          <div class="fato" style="padding:22px 28px;">
            <div class="ico">${bandeira("ar", 46)}</div>
            <div>
              <div class="tit" style="font-size:30px;">Só 1 IA em 62 deu título à Argentina</div>
              <div class="sub" style="font-size:20px;">Gemma 2 27B (legacy), com 0×1 — a solitária torcedora de Messi</div>
            </div>
          </div>
        </div>
      </div>

      ${rodape()}
    </div>
  `,
});

// 85 — O 7×1 que nenhuma IA cravou
CARDS.push({
  dir: "85_card_7x1-zero-cravadas",
  body: `
    ${stars(70)}
    <div class="glow" style="background:radial-gradient(circle, rgba(239,68,68,.32) 0%, transparent 62%);"></div>
    <div class="wrap" style="text-align:center;">
      ${header("Fase de Grupos")}

      <div style="flex:1; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:30px;">

        <div style="display:flex; align-items:center; gap:34px;">
          ${bandeira("de", 150)}
          <div class="hero-num grad-red" style="font-size:240px; filter:drop-shadow(0 0 40px rgba(239,68,68,.4));">7×1</div>
          ${bandeira("cw", 150, "opacity:.8;")}
        </div>

        <div>
          <div class="kicker" style="color:#f87171; font-size:21px;">Alemanha 7×1 Curaçao · J10</div>
          <h1 class="h-white" style="font-size:66px; max-width:960px;">
            O 7×1 voltou — e<br><span class="grad-red">nenhuma IA cravou</span>
          </h1>
        </div>

        <div style="display:flex; flex-direction:column; gap:16px; width:100%; max-width:920px;">
          <div class="fato fato-red" style="padding:22px 28px;">
            <div class="ico" style="font-size:44px;">🚫</div>
            <div>
              <div class="tit" style="color:#f87171; font-size:30px;">0 placares exatos em 54 palpites</div>
              <div class="sub" style="font-size:20px;">41 IAs votaram num modesto 3×0 — ninguém sonhou com a goleada</div>
            </div>
          </div>
          <div class="fato fato-gold" style="padding:22px 28px;">
            <div class="ico" style="font-size:44px;">😅</div>
            <div>
              <div class="tit" style="color:#ffd34d; font-size:30px;">Phi-4 mini apostou 0×1… pra Curaçao</div>
              <div class="sub" style="font-size:20px;">A única IA que deu vitória curaçolenha viu o time levar sete</div>
            </div>
          </div>
          <div class="fato" style="padding:22px 28px;">
            <div class="ico" style="font-size:44px;">🥅</div>
            <div>
              <div class="tit" style="font-size:30px;">As IAs jogaram retranqueiras a Copa toda</div>
              <div class="sub" style="font-size:20px;">Previram 2,17 gols/jogo — a Copa teve 2,99</div>
            </div>
          </div>
        </div>
      </div>

      ${rodape()}
    </div>
  `,
});

// 86 — Bola de Cristal em 8º
CARDS.push({
  dir: "86_card_bola-de-cristal-8o-lugar",
  body: `
    ${stars(70)}
    <div class="glow"></div>
    <div class="wrap" style="text-align:center;">
      ${header("Bola de Cristal")}

      <div style="flex:1; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:24px;">

        <div style="position:relative; display:inline-block;">
          <div style="font-size:150px; line-height:1; filter:drop-shadow(0 0 48px rgba(157,78,221,.9));">🔮</div>
          <div style="
            position:absolute; right:-66px; top:2px;
            font-family:'Archivo Black',Impact,sans-serif; font-size:40px; color:#0a0518;
            background:linear-gradient(135deg,#ffd34d,#ffb300); border-radius:999px;
            padding:10px 20px; box-shadow:0 6px 24px rgba(255,179,0,.5);
          ">8º</div>
        </div>

        <div>
          <div class="kicker">Sabedoria das multidões</div>
          <h1 class="h-white" style="font-size:60px; max-width:960px;">
            O consenso de 124 IAs<br><span class="grad-purple">ficou em 8º lugar</span>
          </h1>
        </div>

        <div class="hero-box" style="background:rgba(157,78,221,.13); border:2px solid rgba(157,78,221,.5); padding:20px 46px;">
          <div class="hero-num grad-purple" style="font-size:96px;">602 pts</div>
          <div class="hero-cap">o palpite mais votado em cada jogo<br>bateu <strong class="grad-gold" style="font-weight:900;">117 das 124 IAs</strong> individuais</div>
        </div>

        <div style="display:flex; flex-direction:column; gap:14px; width:100%; max-width:880px;">
          <div class="fato fato-green">
            <div class="ico">✅</div>
            <div>
              <div class="tit" style="color:#4ade80;">66 vencedores em 104 jogos (63,5%) · 20 exatos</div>
              <div class="sub">Ótima no óbvio: só 7 IAs no mundo fizeram mais pontos</div>
            </div>
          </div>
          <div class="fato fato-red">
            <div class="ico">🦓</div>
            <div>
              <div class="tit" style="color:#f87171;">Mas zerou nas 12 zebras do mata-mata</div>
              <div class="sub">Semi da Espanha, queda do Brasil, o 6×4 e a própria final — os jogos que decidiram o título</div>
            </div>
          </div>
        </div>

        <p style="font-size:25px; font-weight:700; color:rgba(255,255,255,.8); max-width:820px; line-height:1.4;">
          Sabedoria das multidões: <strong style="color:#4ade80;">funciona</strong> — até a <strong style="color:#f87171;">zebra</strong> passar.
        </p>
      </div>

      ${rodape()}
    </div>
  `,
});

// 87 — ChatGPT 5 Thinking campeão da Série A
CARDS.push({
  dir: "87_card_chatgpt-campeao-serie-a",
  body: `
    ${stars(70)}
    <div class="glow"></div>
    <div class="wrap" style="text-align:center;">
      ${header("Série A · Campeão")}

      <div style="flex:1; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:24px;">

        <div style="position:relative; display:inline-block;">
          ${logo("openai", 150)}
          <div style="
            position:absolute; right:-56px; top:-14px;
            font-size:76px; filter:drop-shadow(0 6px 20px rgba(255,211,77,.6));
          ">👑</div>
        </div>

        <div>
          <div class="kicker" style="font-size:22px;">ChatGPT 5 Thinking</div>
          <h1 class="h-white" style="font-size:64px; max-width:960px;">
            O campeão da<br><span class="grad-gold">Série A das IAs</span>
          </h1>
        </div>

        <div class="hero-box" style="background:rgba(255,211,77,.10); border:2px solid rgba(255,211,77,.5); padding:20px 46px;">
          <div class="hero-num grad-gold" style="font-size:104px;">616 pts</div>
          <div class="hero-cap">1º entre as 12 grandes marcas que palpitaram<br><strong style="color:#fff;">pesquisando a internet em tempo real</strong></div>
        </div>

        <div style="display:flex; flex-direction:column; gap:14px; width:100%; max-width:880px;">
          <div class="fato fato-green">
            <div class="ico">🚀</div>
            <div>
              <div class="tit" style="color:#4ade80;">Mata-mata quase perfeito: 332 pts em 32 jogos</div>
              <div class="sub">A melhor campanha de mata-mata da Série A — média de 10,4 pts/jogo</div>
            </div>
          </div>
          <div class="fato fato-purp">
            <div class="ico">🏁</div>
            <div>
              <div class="tit" style="color:#cdb4ff;">Pódio: 🥇 ChatGPT 616 · 🥈 Grok 4 Heavy 583 · 🥉 Claude Opus 4.8 573</div>
              <div class="sub">Gemini 2.5 Pro em 11º — e o bronze Claude com mais cravadas (20) que o campeão</div>
            </div>
          </div>
        </div>

        <p style="font-size:25px; font-weight:700; color:rgba(255,255,255,.8); max-width:820px; line-height:1.4;">
          Quando a IA pode <strong class="grad-gold" style="font-weight:900;">pesquisar antes de palpitar</strong>, o jogo muda.
        </p>
      </div>

      ${rodape()}
    </div>
  `,
});

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  const only = process.argv.slice(2); // ex.: ["82","85"]
  const cards = only.length
    ? CARDS.filter(c => only.some(n => c.dir.startsWith(n)))
    : CARDS;

  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1080, height: 1350 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();

  for (const card of cards) {
    const outDir = path.join(IG_DIR, card.dir);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>${BASE_CSS}</style>
</head>
<body>
${card.body}
</body>
</html>`;
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    const file = path.join(outDir, "card.png");
    await page.screenshot({ path: file });
    const stat = fs.statSync(file);
    console.log(`✓ ${card.dir}/card.png  (${Math.round(stat.size / 1024)} KB)`);
  }

  await browser.close();
  console.log(`\n${cards.length} cards gravados em:\n  ${IG_DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
