/**
 * Gera o carrossel "Novo Momento" (8 slides, 1080×1350).
 * Anuncia as novidades da Arena de IAs: palpites grátis, bola de cristal,
 * novas páginas, e o grande anúncio do Bolão Humanos × IAs.
 *
 * Uso (na raiz do repo ou na pasta v4/):
 *   node marketing/scripts/gerar_carrossel_novo_momento.js
 *
 * Saída: marketing/brainstorming_instagram/33_carrossel_novo-momento/
 */

"use strict";

const fs   = require("fs");
const path = require("path");

const V4_ROOT = path.resolve(__dirname, "../../v4");
const { chromium } = require(path.join(V4_ROOT, "node_modules", "playwright"));

const OUT = path.resolve(
  __dirname,
  "../brainstorming_instagram/33_carrossel_novo-momento"
);

const SITE  = "bolao.arenadasias.com.br";
const INSTA = "@arena.das.ias";

// ── Brand CSS (cosmic purple, Sora + Archivo Black) ─────────────────────────

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

/* Cosmic background */
body::before {
  content: "";
  position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(ellipse 900px 700px at 50% 30%, #2a1257 0%, #150a2e 55%, #0a0518 100%);
}

/* Stars layer */
.stars { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
.stars i {
  position: absolute; border-radius: 50%; background: #fff;
  animation: tw 2.6s ease-in-out infinite;
}
@keyframes tw { 0%,100%{opacity:.1;transform:scale(.5)} 50%{opacity:.7;transform:scale(1.2)} }

/* Ambient glow */
.glow {
  position: absolute; left: 50%; top: 30%; width: 780px; height: 780px;
  transform: translate(-50%, -50%); z-index: 0;
  background: radial-gradient(circle, rgba(157,78,221,.4) 0%, transparent 65%);
  filter: blur(16px);
}

/* Wrap */
.wrap {
  position: relative; z-index: 2;
  padding: 52px 72px 44px;
  height: 100%;
  display: flex; flex-direction: column;
}

/* Brand header */
.brand-mini {
  display: flex; align-items: center; gap: 12px;
  font-family: 'Sora', sans-serif;
  font-size: 22px; font-weight: 800;
  color: #cdb4ff; letter-spacing: -0.01em;
  flex-shrink: 0;
}
.brand-mini .ball { font-size: 30px; }

/* Footer */
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

/* Kicker */
.kicker {
  font-size: 16px; font-weight: 800; letter-spacing: 0.16em;
  text-transform: uppercase; color: #9d4edd; margin-bottom: 10px;
}

/* Swipe hint */
.swipe {
  position: absolute; bottom: 26px; right: 72px;
  font-size: 14px; font-weight: 800;
  color: rgba(205,180,255,.5); letter-spacing: 0.1em;
  text-transform: uppercase; z-index: 3;
}

/* Heading helpers */
.h-white {
  font-family: 'Archivo Black', Impact, sans-serif;
  color: #fff; line-height: 1.0; letter-spacing: -0.03em;
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
`;

// ── Slides ────────────────────────────────────────────────────────────────────

function buildSlides() {

  // ── SLIDE 1 — CAPA ──────────────────────────────────────────────────────────
  const slide1 = {
    nome: "slide-01.png",
    body: `
      <div class="stars" id="stars"></div>
      <div class="glow"></div>
      <div class="wrap" style="text-align:center; justify-content:space-between;">
        <div class="brand-mini" style="justify-content:center;">
          <span class="ball">⚽</span>
          <span>Bolão das IAs · Arena de IAs</span>
        </div>

        <div style="flex:1; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:28px;">

          <div style="
            display:inline-flex; align-items:center; gap:10px;
            padding:10px 28px; border-radius:999px;
            border: 1.5px solid rgba(205,180,255,.35);
            background: rgba(157,78,221,.15);
            font-size:18px; font-weight:800; color:#cdb4ff;
            letter-spacing:0.12em; text-transform:uppercase;
          ">
            <span>🚀</span> Copa 2026 · Novo Momento
          </div>

          <h1 class="h-white" style="font-size:96px; line-height:0.95; max-width:860px;">
            A Arena das IAs<br>
            <span class="grad-purple">entrou em campo</span>
          </h1>

          <div style="
            width:72px; height:4px; border-radius:2px;
            background: linear-gradient(90deg, #9d4edd, #ffd34d, #9d4edd);
          "></div>

          <p style="
            font-size:34px; font-weight:600; color:rgba(205,180,255,.85);
            line-height:1.45; max-width:780px;
          ">
            <strong style="color:#ffd34d;">55+ IAs</strong> palpitando a Copa.
            <strong style="color:#4ade80;">Palpites grátis</strong> pra todo mundo.
            E o maior anúncio ainda tá por vir.
          </p>

          <div style="
            font-size:24px; font-weight:800; color:#9d4edd;
            padding:12px 32px; border:1.5px solid rgba(157,78,221,.45);
            border-radius:999px; background:rgba(157,78,221,.12);
            letter-spacing:0.04em;
          ">arraste pra descobrir →</div>
        </div>

        <div class="rodape-mini" style="margin-top:0; padding-top:16px; width:100%;">
          <div class="pill pill-site">🌐 ${SITE}</div>
          <div class="pill pill-insta">📸 ${INSTA}</div>
        </div>
      </div>
      <script>
        const s=document.getElementById('stars'); let h='';
        for(let i=0;i<70;i++){const z=1+Math.random()*2.2;h+='<i style="left:'+Math.random()*100+'%;top:'+Math.random()*100+'%;width:'+z+'px;height:'+z+'px;animation-delay:'+(Math.random()*2.6).toFixed(2)+'s"></i>';}
        s.innerHTML=h;
      </script>
    `,
  };

  // ── SLIDE 2 — PALPITES GRÁTIS (destaque principal) ──────────────────────────
  const slide2 = {
    nome: "slide-02.png",
    body: `
      <div class="stars" id="stars"></div>
      <div class="glow"></div>
      <div class="wrap">
        <div class="brand-mini">
          <span class="ball">⚽</span>
          <span>Bolão das IAs · Novidade</span>
        </div>

        <div style="flex:1; display:flex; flex-direction:column; justify-content:center; gap:36px;">

          <div>
            <div class="kicker">🎉 Grande novidade</div>
            <h2 class="h-white grad-gold" style="font-size:86px; line-height:0.95;">
              Palpites grátis<br>pra todo mundo
            </h2>
            <div style="
              width:60px; height:4px; border-radius:2px; margin-top:14px;
              background: linear-gradient(90deg, #ffd34d, #9d4edd);
            "></div>
          </div>

          <!-- Antes/Depois -->
          <div style="display:flex; gap:20px;">
            <div style="
              flex:1; padding:28px 28px; border-radius:20px;
              background:rgba(255,255,255,.05); border:1.5px solid rgba(255,255,255,.12);
            ">
              <div style="font-size:22px; font-weight:800; color:rgba(205,180,255,.5); text-transform:uppercase; letter-spacing:.1em; margin-bottom:12px;">Antes</div>
              <div style="font-size:40px; margin-bottom:8px;">🔒</div>
              <div style="font-size:24px; font-weight:700; color:rgba(255,255,255,.6); line-height:1.4;">
                Parte dos palpites era exclusiva para contribuintes
              </div>
            </div>
            <div style="
              flex:1; padding:28px 28px; border-radius:20px;
              background:linear-gradient(135deg,rgba(74,222,128,.15),rgba(34,211,238,.08));
              border:1.5px solid rgba(74,222,128,.4);
            ">
              <div style="font-size:22px; font-weight:800; color:#4ade80; text-transform:uppercase; letter-spacing:.1em; margin-bottom:12px;">Agora</div>
              <div style="font-size:40px; margin-bottom:8px;">🔓</div>
              <div style="font-size:24px; font-weight:700; color:#e9d5ff; line-height:1.4;">
                Todos os palpites <strong style="color:#4ade80;">abertos</strong> — sem cadeado, sem Pix
              </div>
            </div>
          </div>

          <!-- Stat box -->
          <div style="
            padding:28px 36px; border-radius:20px;
            background:linear-gradient(135deg,rgba(157,78,221,.22),rgba(109,40,217,.12));
            border:1.5px solid rgba(157,78,221,.45);
            display:flex; align-items:center; gap:28px;
          ">
            <div style="font-size:64px; line-height:1; filter:drop-shadow(0 0 18px rgba(157,78,221,.6));">🤖</div>
            <div>
              <div style="font-family:'Archivo Black',Impact,sans-serif; font-size:72px; line-height:1; color:#ffd34d;">55+</div>
              <div style="font-size:26px; font-weight:700; color:#cdb4ff; margin-top:2px;">IAs com palpites visíveis a todos</div>
            </div>
          </div>

          <p style="font-size:28px; font-weight:600; color:rgba(205,180,255,.8); line-height:1.5;">
            <strong style="color:#fff;">3.902 palpites</strong> da fase de grupos disponíveis pra qualquer um acessar agora. De graça.
          </p>
        </div>

        <div class="rodape-mini">
          <div class="pill pill-site">🌐 ${SITE}</div>
          <div class="pill pill-insta">📸 ${INSTA}</div>
        </div>
      </div>
      <div class="swipe">arraste →</div>
      <script>
        const s=document.getElementById('stars'); let h='';
        for(let i=0;i<60;i++){const z=1+Math.random()*2;h+='<i style="left:'+Math.random()*100+'%;top:'+Math.random()*100+'%;width:'+z+'px;height:'+z+'px;animation-delay:'+(Math.random()*2.6).toFixed(2)+'s"></i>';}
        s.innerHTML=h;
      </script>
    `,
  };

  // ── SLIDE 3 — BOLA DE CRISTAL ────────────────────────────────────────────────
  const slide3 = {
    nome: "slide-03.png",
    body: `
      <div class="stars" id="stars"></div>
      <div class="glow"></div>
      <div class="wrap" style="text-align:center;">
        <div class="brand-mini" style="justify-content:center;">
          <span class="ball">⚽</span>
          <span>Bolão das IAs · Bola de Cristal</span>
        </div>

        <div style="flex:1; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:28px;">
          <div style="font-size:128px; line-height:1; filter:drop-shadow(0 0 48px rgba(157,78,221,.9));">🔮</div>

          <div>
            <div class="kicker">Consenso das IAs</div>
            <h2 class="h-white" style="font-size:78px; line-height:1.0; max-width:880px;">
              A <span class="grad-purple">Bola de Cristal</span><br>
              aponta o placar mais votado
            </h2>
          </div>

          <!-- Acerto stat -->
          <div style="
            position:relative; width:280px; height:280px; border-radius:50%;
            background: conic-gradient(#4ade80 64%, rgba(255,255,255,.08) 0);
            display:flex; align-items:center; justify-content:center;
          ">
            <div style="
              position:absolute; inset:22px; border-radius:50%;
              background: radial-gradient(ellipse at center, #1a0a2e, #0a0518);
              display:flex; flex-direction:column; align-items:center; justify-content:center;
            ">
              <div style="font-family:'Archivo Black',Impact,sans-serif; font-size:76px; color:#4ade80; line-height:1;">64%</div>
              <div style="font-size:18px; color:#cdb4ff; font-weight:700;">dos jogos</div>
            </div>
          </div>

          <div style="max-width:800px; display:flex; flex-direction:column; gap:14px;">
            <div style="
              padding:18px 28px; border-radius:16px;
              background:rgba(74,222,128,.1); border:1.5px solid rgba(74,222,128,.3);
              font-size:26px; font-weight:700; color:#e9d5ff; line-height:1.4;
            ">
              ✅ Acertou o vencedor em <strong style="color:#4ade80;">46 de 72</strong> jogos na fase de grupos
            </div>
            <div style="
              padding:18px 28px; border-radius:16px;
              background:rgba(157,78,221,.1); border:1.5px solid rgba(157,78,221,.3);
              font-size:26px; font-weight:700; color:#e9d5ff; line-height:1.4;
            ">
              🔮 Disponível para grupos E mata-mata (oitavas em diante)
            </div>
          </div>
        </div>

        <div class="rodape-mini">
          <div class="pill pill-site">🌐 ${SITE}</div>
          <div class="pill pill-insta">📸 ${INSTA}</div>
        </div>
      </div>
      <div class="swipe">arraste →</div>
      <script>
        const s=document.getElementById('stars'); let h='';
        for(let i=0;i<60;i++){const z=1+Math.random()*2;h+='<i style="left:'+Math.random()*100+'%;top:'+Math.random()*100+'%;width:'+z+'px;height:'+z+'px;animation-delay:'+(Math.random()*2.6).toFixed(2)+'s"></i>';}
        s.innerHTML=h;
      </script>
    `,
  };

  // ── SLIDE 4 — NOVIDADES: Retrospectiva + Ranking ─────────────────────────────
  const slide4 = {
    nome: "slide-04.png",
    body: `
      <div class="stars" id="stars"></div>
      <div class="glow"></div>
      <div class="wrap">
        <div class="brand-mini">
          <span class="ball">⚽</span>
          <span>Bolão das IAs · Tour do Site</span>
        </div>

        <div style="flex:1; display:flex; flex-direction:column; justify-content:center; gap:32px;">
          <div>
            <div class="kicker">🗺 Novidades no site</div>
            <h2 class="h-white" style="font-size:68px; line-height:1.0;">
              O que tem<br><span class="grad-purple">de novo por lá</span>
            </h2>
          </div>

          <div style="display:flex; flex-direction:column; gap:18px;">
            <!-- Item 1 -->
            <div style="
              display:flex; align-items:center; gap:24px;
              padding:24px 28px; border-radius:18px;
              background:rgba(255,255,255,.06); border:1.5px solid rgba(205,180,255,.2);
            ">
              <div style="font-size:52px; flex-shrink:0;">📊</div>
              <div>
                <div style="font-family:'Archivo Black',Impact,sans-serif; font-size:30px; color:#fff;">Retrospectiva da fase de grupos</div>
                <div style="font-size:21px; color:#cdb4ff; font-weight:600; margin-top:4px;">72 jogos analisados — zebras, goleadas, campeã geral</div>
              </div>
            </div>
            <!-- Item 2 -->
            <div style="
              display:flex; align-items:center; gap:24px;
              padding:24px 28px; border-radius:18px;
              background:rgba(255,255,255,.06); border:1.5px solid rgba(205,180,255,.2);
            ">
              <div style="font-size:52px; flex-shrink:0;">🏆</div>
              <div>
                <div style="font-family:'Archivo Black',Impact,sans-serif; font-size:30px; color:#fff;">Ranking Geral</div>
                <div style="font-size:21px; color:#cdb4ff; font-weight:600; margin-top:4px;">Geral · Série A · Humanos × IAs — 3 visões do bolão</div>
              </div>
            </div>
            <!-- Item 3 -->
            <div style="
              display:flex; align-items:center; gap:24px;
              padding:24px 28px; border-radius:18px;
              background:rgba(255,255,255,.06); border:1.5px solid rgba(205,180,255,.2);
            ">
              <div style="font-size:52px; flex-shrink:0;">🏁</div>
              <div>
                <div style="font-family:'Archivo Black',Impact,sans-serif; font-size:30px; color:#fff;">Corrida das IAs</div>
                <div style="font-size:21px; color:#cdb4ff; font-weight:600; margin-top:4px;">Animação placar a placar — vê quem liderou em cada rodada</div>
              </div>
            </div>
            <!-- Item 4 -->
            <div style="
              display:flex; align-items:center; gap:24px;
              padding:24px 28px; border-radius:18px;
              background:rgba(255,211,77,.08); border:1.5px solid rgba(255,211,77,.3);
            ">
              <div style="font-size:52px; flex-shrink:0;">⚔️</div>
              <div>
                <div style="font-family:'Archivo Black',Impact,sans-serif; font-size:30px; color:#ffd34d;">Palpites do mata-mata</div>
                <div style="font-size:21px; color:#cdb4ff; font-weight:600; margin-top:4px;">Oitavas já disponíveis — o que as IAs preveem?</div>
              </div>
            </div>
          </div>
        </div>

        <div class="rodape-mini">
          <div class="pill pill-site">🌐 ${SITE}</div>
          <div class="pill pill-insta">📸 ${INSTA}</div>
        </div>
      </div>
      <div class="swipe">arraste →</div>
      <script>
        const s=document.getElementById('stars'); let h='';
        for(let i=0;i<60;i++){const z=1+Math.random()*2;h+='<i style="left:'+Math.random()*100+'%;top:'+Math.random()*100+'%;width:'+z+'px;height:'+z+'px;animation-delay:'+(Math.random()*2.6).toFixed(2)+'s"></i>';}
        s.innerHTML=h;
      </script>
    `,
  };

  // ── SLIDE 5 — TOUR VISUAL: Corrida + Palpites ───────────────────────────────
  const slide5 = {
    nome: "slide-05.png",
    body: `
      <div class="stars" id="stars"></div>
      <div class="glow"></div>
      <div class="wrap">
        <div class="brand-mini">
          <span class="ball">⚽</span>
          <span>Bolão das IAs · Números</span>
        </div>

        <div style="flex:1; display:flex; flex-direction:column; justify-content:center; gap:36px;">
          <div>
            <div class="kicker">📈 A escala do bolão</div>
            <h2 class="h-white" style="font-size:72px; line-height:1.0;">
              Fase de grupos<br><span class="grad-purple">em números</span>
            </h2>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
            ${[
              { n: "3.902", label: "palpites registrados", icon: "📋", accent: "#9d4edd" },
              { n: "55+",   label: "IAs participando",     icon: "🤖", accent: "#ffd34d" },
              { n: "72",    label: "jogos disputados",      icon: "⚽", accent: "#4ade80" },
              { n: "64%",   label: "acurácia da Bola de Cristal", icon: "🔮", accent: "#cdb4ff" },
            ].map(st => `
              <div style="
                padding:30px 26px; border-radius:20px;
                background:rgba(255,255,255,.06); border:1.5px solid ${st.accent}33;
              ">
                <div style="font-size:40px; margin-bottom:6px;">${st.icon}</div>
                <div style="font-family:'Archivo Black',Impact,sans-serif; font-size:68px; color:${st.accent}; line-height:1;">${st.n}</div>
                <div style="font-size:20px; font-weight:700; color:#cdb4ff; margin-top:6px;">${st.label}</div>
              </div>
            `).join("")}
          </div>

          <div style="
            padding:22px 32px; border-radius:16px;
            background:rgba(157,78,221,.12); border:1.5px dashed rgba(157,78,221,.4);
            font-size:28px; font-weight:700; color:#e9d5ff; text-align:center;
          ">
            Tudo isso <strong style="color:#ffd34d;">de graça</strong> em bolao.arenadasias.com.br 🚀
          </div>
        </div>

        <div class="rodape-mini">
          <div class="pill pill-site">🌐 ${SITE}</div>
          <div class="pill pill-insta">📸 ${INSTA}</div>
        </div>
      </div>
      <div class="swipe">arraste →</div>
      <script>
        const s=document.getElementById('stars'); let h='';
        for(let i=0;i<60;i++){const z=1+Math.random()*2;h+='<i style="left:'+Math.random()*100+'%;top:'+Math.random()*100+'%;width:'+z+'px;height:'+z+'px;animation-delay:'+(Math.random()*2.6).toFixed(2)+'s"></i>';}
        s.innerHTML=h;
      </script>
    `,
  };

  // ── SLIDE 6 — O GRANDE ANÚNCIO (teaser) ────────────────────────────────────
  const slide6 = {
    nome: "slide-06.png",
    body: `
      <div class="stars" id="stars"></div>
      <div class="glow" style="top:35%; background:radial-gradient(circle, rgba(255,211,77,.3) 0%, transparent 60%);"></div>
      <div class="wrap" style="text-align:center;">
        <div class="brand-mini" style="justify-content:center;">
          <span class="ball">⚽</span>
          <span>Bolão das IAs · Anúncio</span>
        </div>

        <div style="flex:1; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:28px;">
          <div style="font-size:112px; line-height:1; filter:drop-shadow(0 0 36px rgba(255,211,77,.7));">🚨</div>

          <div style="
            display:inline-block; padding:10px 28px; border-radius:999px;
            background:rgba(255,211,77,.12); border:1.5px solid rgba(255,211,77,.45);
            font-size:18px; font-weight:900; letter-spacing:0.16em;
            text-transform:uppercase; color:#ffd34d;
          ">Vem aí</div>

          <h2 class="h-white" style="font-size:80px; line-height:0.98; max-width:860px;">
            Bolão da<br>
            <span class="grad-gold">Arena das IAs</span>
          </h2>

          <p style="
            font-size:38px; font-weight:800; color:#fff;
            line-height:1.3; max-width:780px;
          ">
            <span style="color:#4ade80;">Humanos</span>
            <span style="color:rgba(255,255,255,.5); font-size:32px;">×</span>
            <span style="color:#cdb4ff;">IAs</span>
          </p>

          <p style="
            font-size:28px; font-weight:600; color:rgba(205,180,255,.8);
            max-width:700px; line-height:1.5;
          ">
            Qualquer pessoa pode entrar e disputar contra as máquinas. Arrasta pra descobrir como.
          </p>
        </div>

        <div class="rodape-mini">
          <div class="pill pill-site">🌐 ${SITE}</div>
          <div class="pill pill-insta">📸 ${INSTA}</div>
        </div>
      </div>
      <div class="swipe">arraste →</div>
      <script>
        const s=document.getElementById('stars'); let h='';
        for(let i=0;i<80;i++){const z=1+Math.random()*2.5;h+='<i style="left:'+Math.random()*100+'%;top:'+Math.random()*100+'%;width:'+z+'px;height:'+z+'px;animation-delay:'+(Math.random()*2.6).toFixed(2)+'s"></i>';}
        s.innerHTML=h;
      </script>
    `,
  };

  // ── SLIDE 7 — HUMANOS × IAs DESTAQUE ────────────────────────────────────────
  const slide7 = {
    nome: "slide-07.png",
    body: `
      <div class="stars" id="stars"></div>
      <div class="glow" style="background:radial-gradient(circle, rgba(74,222,128,.25) 0%, rgba(157,78,221,.25) 50%, transparent 70%);"></div>
      <div class="wrap" style="text-align:center;">
        <div class="brand-mini" style="justify-content:center;">
          <span class="ball">⚽</span>
          <span>Bolão das IAs · Humanos × IAs</span>
        </div>

        <div style="flex:1; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:32px;">

          <!-- VS visual -->
          <div style="display:flex; align-items:center; gap:24px; width:100%; max-width:860px; justify-content:center;">
            <div style="
              flex:1; padding:32px 20px; border-radius:24px;
              background:linear-gradient(135deg,rgba(74,222,128,.15),rgba(74,222,128,.06));
              border:1.5px solid rgba(74,222,128,.4);
              display:flex; flex-direction:column; align-items:center; gap:12px;
            ">
              <div style="font-size:64px;">🧠</div>
              <div style="font-family:'Archivo Black',Impact,sans-serif; font-size:44px; color:#4ade80; line-height:1;">Você</div>
              <div style="font-size:21px; font-weight:700; color:rgba(74,222,128,.7);">& seus amigos</div>
            </div>

            <div style="
              font-family:'Archivo Black',Impact,sans-serif;
              font-size:56px; color:#ffd34d;
              filter:drop-shadow(0 0 20px rgba(255,211,77,.5));
              flex-shrink:0;
            ">VS</div>

            <div style="
              flex:1; padding:32px 20px; border-radius:24px;
              background:linear-gradient(135deg,rgba(157,78,221,.15),rgba(157,78,221,.06));
              border:1.5px solid rgba(157,78,221,.4);
              display:flex; flex-direction:column; align-items:center; gap:12px;
            ">
              <div style="font-size:64px;">🤖</div>
              <div style="font-family:'Archivo Black',Impact,sans-serif; font-size:44px; color:#cdb4ff; line-height:1;">55+ IAs</div>
              <div style="font-size:21px; font-weight:700; color:rgba(205,180,255,.7);">ChatGPT, Claude, Grok…</div>
            </div>
          </div>

          <h2 class="h-white" style="font-size:72px; line-height:1.0; max-width:840px;">
            Você acha que<br>
            <span class="grad-green">bate as IAs?</span>
          </h2>

          <p style="
            font-size:30px; font-weight:600; color:rgba(205,180,255,.85);
            max-width:720px; line-height:1.5;
          ">
            Entra no bolão, faz seus palpites do mata-mata e disputa no mesmo ranking que as máquinas. Sem desculpa.
          </p>

          <div style="
            padding:20px 40px; border-radius:18px;
            background:linear-gradient(135deg,rgba(74,222,128,.18),rgba(34,211,238,.1));
            border:1.5px solid rgba(74,222,128,.4);
            font-size:28px; font-weight:800; color:#4ade80;
          ">
            Gratuito · Mata-mata · Já disponível
          </div>
        </div>

        <div class="rodape-mini">
          <div class="pill pill-site">🌐 ${SITE}</div>
          <div class="pill pill-insta">📸 ${INSTA}</div>
        </div>
      </div>
      <div class="swipe">arraste →</div>
      <script>
        const s=document.getElementById('stars'); let h='';
        for(let i=0;i<80;i++){const z=1+Math.random()*2.5;h+='<i style="left:'+Math.random()*100+'%;top:'+Math.random()*100+'%;width:'+z+'px;height:'+z+'px;animation-delay:'+(Math.random()*2.6).toFixed(2)+'s"></i>';}
        s.innerHTML=h;
      </script>
    `,
  };

  // ── SLIDE 8 — CTA ────────────────────────────────────────────────────────────
  const slide8 = {
    nome: "slide-08.png",
    body: `
      <div class="stars" id="stars"></div>
      <div class="glow" style="background:radial-gradient(circle, rgba(157,78,221,.5) 0%, transparent 60%);"></div>
      <div class="wrap" style="text-align:center;">
        <div class="brand-mini" style="justify-content:center;">
          <span class="ball">⚽</span>
          <span>Bolão das IAs · Arena de IAs</span>
        </div>

        <div style="flex:1; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:28px;">
          <div style="font-size:108px; line-height:1; filter:drop-shadow(0 0 36px rgba(157,78,221,.8));">🤖⚽</div>

          <h2 class="h-white" style="font-size:84px; line-height:0.95;">
            Entra e prova
          </h2>

          <p style="font-size:32px; font-weight:700; color:rgba(205,180,255,.85); max-width:720px; line-height:1.45;">
            Palpites das IAs <strong style="color:#4ade80;">grátis</strong>.<br>
            Bolão Humanos × IAs <strong style="color:#ffd34d;">aberto</strong>.<br>
            Mata-mata começa agora.
          </p>

          <!-- CTA box -->
          <div style="
            padding:24px 48px; border-radius:20px;
            background:linear-gradient(135deg,#9d4edd,#6d28d9);
            box-shadow:0 12px 40px rgba(109,40,217,.6);
            width:100%; max-width:760px;
          ">
            <div style="font-size:18px; font-weight:800; color:rgba(255,255,255,.6); letter-spacing:.1em; text-transform:uppercase; margin-bottom:6px;">Acesse agora</div>
            <div style="font-family:'Archivo Black',Impact,sans-serif; font-size:38px; color:#ffd34d; letter-spacing:-.01em;">
              bolao.arenadasias.com.br
            </div>
          </div>

          <!-- Bullets -->
          <div style="display:flex; flex-direction:column; gap:12px; width:100%; max-width:720px;">
            ${[
              { icon:"🔓", text:"Todos os palpites das IAs — de graça" },
              { icon:"🔮", text:"Bola de Cristal: oitavas disponíveis" },
              { icon:"🏆", text:"Dispute no Ranking Humanos × IAs" },
            ].map(b => `
              <div style="
                display:flex; align-items:center; gap:16px;
                padding:14px 22px; border-radius:14px;
                background:rgba(255,255,255,.06); border:1.5px solid rgba(205,180,255,.2);
                text-align:left;
              ">
                <span style="font-size:32px; flex-shrink:0;">${b.icon}</span>
                <span style="font-size:22px; font-weight:700; color:#e9d5ff;">${b.text}</span>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="rodape-mini" style="border-top-color:rgba(157,78,221,.3);">
          <div class="pill pill-site" style="font-size:21px; padding:13px 26px;">🌐 ${SITE}</div>
          <div class="pill pill-insta" style="font-size:21px; padding:13px 26px;">📸 ${INSTA}</div>
        </div>
      </div>
      <script>
        const s=document.getElementById('stars'); let h='';
        for(let i=0;i<90;i++){const z=1+Math.random()*2.5;h+='<i style="left:'+Math.random()*100+'%;top:'+Math.random()*100+'%;width:'+z+'px;height:'+z+'px;animation-delay:'+(Math.random()*2.6).toFixed(2)+'s"></i>';}
        s.innerHTML=h;
      </script>
    `,
  };

  return [slide1, slide2, slide3, slide4, slide5, slide6, slide7, slide8];
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

  const SLIDES = buildSlides();

  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1080, height: 1350 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();

  for (const slide of SLIDES) {
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>${BASE_CSS}</style>
</head>
<body>
${slide.body}
</body>
</html>`;
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    const file = path.join(OUT, slide.nome);
    await page.screenshot({ path: file });
    const stat = fs.statSync(file);
    console.log(`✓ ${slide.nome}  (${Math.round(stat.size / 1024)} KB)`);
  }

  await browser.close();
  console.log(`\n${SLIDES.length} slides gravados em:\n  ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
