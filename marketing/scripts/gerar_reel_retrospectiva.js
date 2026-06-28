/**
 * Reel animado (1080×1920) — Retrospectiva da Fase de Grupos do Bolão das IAs.
 * 8 cenas sequenciais em uma única página HTML com timeline CSS.
 * Renderizado por CAPTURA DE FRAMES (lib_reel_capture) — determinístico, sem
 * stutter e sem cortar antes do fim da animação.
 *
 * Uso:
 *   node marketing/scripts/gerar_reel_retrospectiva.js
 *
 * Saída: marketing/brainstorming_instagram/32_reel_retrospectiva-grupos/
 *   retrospectiva.mp4  poster.png
 */

const fs   = require('fs');
const path = require('path');
const { renderReel } = require('./lib_reel_capture');

const OUT = path.resolve(__dirname, '../brainstorming_instagram/32_reel_retrospectiva-grupos');
fs.mkdirSync(OUT, { recursive: true });

// ------------------------------------------------------------------
// Timeline CSS: última cena (CTA) entra em 18.8s, fica visível e só faz
// sceneOut em 21.6s. Capturamos até 21.5s pra terminar com o CTA na tela.
// Poster: clímax do pódio (cena 4, centro ≈ 9.9s de timeline CSS).
// ------------------------------------------------------------------

const TOTAL_MS  = 21500;   // captura 0 → 21.5s (CTA ainda visível no fim)
const POSTER_MS = 9900;    // centro da cena do pódio
const FPS       = 30;

// Converte ms para string CSS de segundos (ex: 2800 -> "2.80s")
function cs(ms) { return (ms / 1000).toFixed(2) + 's'; }

// Offset global de cada cena (ms desde o início do timeline)
const S = {
  capa:    0,
  numeros: 2800,
  campea:  5600,
  podio:   8400,
  cristal: 11200,
  exato:   13600,
  zebra:   16000,
  cta:     18800,
};

const VIS = 2400;   // duração visível de cada cena (ms)
const VIS_PODIO = 3000;  // pódio fica mais tempo

// Gera bloco de CSS para uma cena: fade in no offset, fade out após visível
function sceneCSS(name, offsetMs, visibleMs) {
  return `
.${name} {
  position:absolute; top:0; left:0; right:0; height:1920px;
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:28px;
  opacity:0;
  animation:
    sceneIn  .55s cubic-bezier(.2,.9,.25,1) ${cs(offsetMs)} forwards,
    sceneOut .40s ease-in ${cs(offsetMs + visibleMs)} forwards;
}`;
}

function buildHtml() {
  const html = `<!doctype html><html lang="pt-BR"><head>
<meta charset="utf-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Archivo+Black&display=swap');
* { margin:0; padding:0; box-sizing:border-box; }
html,body { width:1080px; height:1920px; overflow:hidden; background:#0a0518; }

.stage {
  width:1080px; height:1920px; position:relative;
  background: radial-gradient(ellipse 900px 900px at 50% 32%, #2a1257 0%, #150a2e 50%, #0a0518 100%);
  font-family:'Sora','Segoe UI',Arial,sans-serif; color:#fff; overflow:hidden;
}

/* partículas */
.stars { position:absolute; inset:0; pointer-events:none; z-index:0; }
.stars i {
  position:absolute; border-radius:50%; background:#fff;
  animation:tw 2.6s ease-in-out infinite;
}
@keyframes tw { 0%,100%{opacity:.12;transform:scale(.6)} 50%{opacity:.85;transform:scale(1.3)} }

/* glow ambiente */
.glow {
  position:absolute; left:50%; top:28%; width:840px; height:840px;
  transform:translate(-50%,-50%); z-index:0;
  background:radial-gradient(circle, rgba(157,78,221,.48) 0%, rgba(157,78,221,0) 65%);
  filter:blur(12px); animation:pulse 3.4s ease-in-out infinite;
}
@keyframes pulse {
  0%,100%{opacity:.5;transform:translate(-50%,-50%) scale(.94)}
  50%    {opacity:1; transform:translate(-50%,-50%) scale(1.07)}
}

/* cenas compartilham os mesmos keyframes de entrada/saída */
@keyframes sceneIn  { from{opacity:0;transform:translateY(36px) scale(.97)} to{opacity:1;transform:none} }
@keyframes sceneOut { from{opacity:1} to{opacity:0} }

/* --- cenas individuais --- */
${sceneCSS('c1', S.capa,    VIS)}
${sceneCSS('c2', S.numeros, VIS)}
${sceneCSS('c3', S.campea,  VIS)}
${sceneCSS('c4', S.podio,   VIS_PODIO)}
${sceneCSS('c5', S.cristal, VIS)}
${sceneCSS('c6', S.exato,   VIS)}
${sceneCSS('c7', S.zebra,   VIS)}
${sceneCSS('c8', S.cta,     VIS + 400)}

/* utilitários */
.z1 { position:relative; z-index:1; }
.kicker { font-weight:800; letter-spacing:.18em; font-size:28px; color:#cdb4ff; text-transform:uppercase; }
.pill {
  display:inline-block; padding:10px 30px; border-radius:999px;
  background:rgba(255,255,255,.1); border:1px solid rgba(205,180,255,.35);
  font-weight:700; font-size:28px;
}

/* ====== CENA 1: CAPA ====== */
.c1 .emoji-big { font-size:120px; line-height:1; filter:drop-shadow(0 0 36px rgba(157,78,221,.8)); }
.c1 .titulo {
  font-family:'Archivo Black','Impact',sans-serif; font-size:84px; line-height:1.08;
  text-align:center; padding:0 64px;
  background:linear-gradient(170deg,#fff 30%,#cdb4ff 100%);
  -webkit-background-clip:text; background-clip:text; color:transparent;
  filter:drop-shadow(0 4px 16px rgba(157,78,221,.5));
}
.c1 .subtitulo { font-weight:700; font-size:36px; color:#cdb4ff; text-align:center; padding:0 60px; line-height:1.5; }
.c1 .marca { font-weight:800; font-size:28px; color:#9d4edd; letter-spacing:.1em; text-transform:uppercase; margin-top:4px; }

/* ====== CENA 2: NÚMEROS ====== */
.c2 .titulo-sec { font-family:'Archivo Black','Impact',sans-serif; font-size:52px; color:#cdb4ff; text-align:center; }
.num-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; padding:0 64px; }
.ncard {
  background:rgba(255,255,255,.07); border:1px solid rgba(205,180,255,.2);
  border-radius:22px; padding:32px 24px; text-align:center;
}
.ncard .val {
  font-family:'Archivo Black','Impact',sans-serif; font-size:76px; line-height:1;
  background:linear-gradient(170deg,#fff 30%,#cdb4ff 100%);
  -webkit-background-clip:text; background-clip:text; color:transparent;
}
.ncard .lbl { font-weight:700; font-size:26px; color:#cdb4ff; margin-top:6px; }
.ncard.wide {
  grid-column:1/-1;
  background:linear-gradient(135deg,rgba(157,78,221,.22),rgba(109,40,217,.15));
  border-color:rgba(157,78,221,.45);
  display:flex; align-items:center; justify-content:center; gap:16px;
  padding:24px 36px;
}
.ncard.wide .val { font-size:60px; }
.ncard.wide .lbl { font-size:28px; margin-top:0; }

/* ====== CENA 3: CAMPEÃ ====== */
.c3 .trophy { font-size:120px; line-height:1; filter:drop-shadow(0 0 36px rgba(255,211,77,.7)); }
.c3 .lbl-campea { font-weight:800; font-size:30px; color:#cdb4ff; letter-spacing:.12em; text-transform:uppercase; }
.c3 .nome {
  font-family:'Archivo Black','Impact',sans-serif; font-size:62px; line-height:1.1; text-align:center; padding:0 64px;
  background:linear-gradient(135deg,#ffd34d,#ffb300 40%,#fff7c2 70%,#ffd34d);
  -webkit-background-clip:text; background-clip:text; color:transparent;
  filter:drop-shadow(0 0 28px rgba(255,211,77,.5));
}
.c3 .pts-row { display:flex; gap:48px; align-items:flex-end; }
.c3 .pts-item { text-align:center; }
.c3 .pts-val { font-family:'Archivo Black','Impact',sans-serif; font-size:68px; color:#ffd34d; line-height:1; }
.c3 .pts-lbl { font-weight:700; font-size:26px; color:#cdb4ff; }
.c3 .top5box {
  background:rgba(255,255,255,.07); border:1px solid rgba(205,180,255,.2);
  border-radius:20px; padding:20px 36px; width:880px;
}
.c3 .top5-ttl { font-weight:800; font-size:24px; color:#9d4edd; text-transform:uppercase; letter-spacing:.12em; margin-bottom:10px; }
.c3 .t5i { font-size:26px; font-weight:600; color:#e9d5ff; padding:6px 0; border-bottom:1px solid rgba(255,255,255,.07); display:flex; gap:12px; align-items:center; }
.c3 .t5i:last-child { border-bottom:none; }
.c3 .t5n { font-family:'Archivo Black','Impact',sans-serif; font-size:28px; color:#ffd34d; min-width:36px; }

/* ====== CENA 4: PÓDIO ====== */
.c4 { gap:24px; }
.c4 .lbl-serie { font-weight:800; font-size:28px; color:#9d4edd; letter-spacing:.14em; text-transform:uppercase; }
.c4 .titulo-sec { font-family:'Archivo Black','Impact',sans-serif; font-size:50px; color:#cdb4ff; text-align:center; }
.podio-wrap { display:flex; align-items:flex-end; justify-content:center; width:960px; gap:0; }
.pcol { display:flex; flex-direction:column; align-items:center; flex:1; }
.pplaca {
  width:100%; display:flex; flex-direction:column; align-items:center;
  justify-content:flex-end; padding-bottom:18px; border-radius:18px 18px 0 0;
  background:rgba(255,255,255,.08); border:1px solid rgba(205,180,255,.2);
}
.pplaca.gold   { background:linear-gradient(180deg,rgba(255,211,77,.22),rgba(255,211,77,.07)); border-color:rgba(255,211,77,.4); }
.pplaca.silver { background:linear-gradient(180deg,rgba(200,200,220,.18),rgba(200,200,220,.05)); border-color:rgba(200,200,220,.35); }
.pplaca.bronze { background:linear-gradient(180deg,rgba(205,127,50,.18),rgba(205,127,50,.05)); border-color:rgba(205,127,50,.35); }
.prank { font-family:'Archivo Black','Impact',sans-serif; font-size:64px; line-height:1; }
.prank.gold   { color:#ffd34d; filter:drop-shadow(0 0 18px rgba(255,211,77,.6)); }
.prank.silver { color:#d0d0e0; }
.prank.bronze { color:#cd7f32; }
.pnome { font-weight:800; font-size:24px; text-align:center; padding:0 10px; color:#fff; line-height:1.2; margin-top:6px; }
.ppts  { font-size:22px; color:#cdb4ff; font-weight:700; margin-top:4px; }
.pex   { font-size:20px; color:#ffd34d; font-weight:700; }
.pbase { width:100%; height:28px; border-radius:0 0 6px 6px; }
.pbase.gold   { background:linear-gradient(90deg,#b8860b,#ffd34d,#b8860b); }
.pbase.silver { background:linear-gradient(90deg,#888,#d0d0e0,#888); }
.pbase.bronze { background:linear-gradient(90deg,#7a4a1e,#cd7f32,#7a4a1e); }

/* ====== CENA 5: CRISTAL ====== */
.c5 .cristal-big { font-size:140px; line-height:1; filter:drop-shadow(0 0 48px rgba(157,78,221,.9)); animation:float 3s ease-in-out infinite; }
@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-18px)} }
.c5 .titulo-sec { font-family:'Archivo Black','Impact',sans-serif; font-size:50px; color:#cdb4ff; text-align:center; padding:0 60px; }
.ring-wrap { position:relative; width:320px; height:320px; }
.ring-svg { width:100%; height:100%; transform:rotate(-90deg); }
.rbg  { fill:none; stroke:rgba(255,255,255,.08); stroke-width:22; }
.rfg  {
  fill:none; stroke:#4ade80; stroke-width:22; stroke-linecap:round;
  /* circumference of r=150 circle = 2π*150 ≈ 942 */
  stroke-dasharray:942; stroke-dashoffset:942;
  animation:ringFill 1.3s ease ${cs(S.cristal + 500)} forwards;
}
/* 64% filled → dashoffset = 942*(1-0.64) = 339 */
@keyframes ringFill { to { stroke-dashoffset: 339; } }
.ring-inner { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); text-align:center; }
.ring-pct  { font-family:'Archivo Black','Impact',sans-serif; font-size:78px; color:#4ade80; line-height:1; }
.ring-sub  { font-size:24px; color:#cdb4ff; font-weight:700; }
.c5 .frase { font-size:34px; font-weight:700; color:#e9d5ff; text-align:center; padding:0 80px; line-height:1.45; }
.c5 .detalhe { font-size:28px; color:#9d4edd; font-weight:700; text-align:center; padding:0 80px; }

/* ====== CENA 6: EXATO ====== */
.c6 .titulo-sec { font-family:'Archivo Black','Impact',sans-serif; font-size:50px; color:#f472b6; text-align:center; padding:0 64px; line-height:1.1; }
.dois-rings { display:flex; gap:56px; align-items:center; }
.rmini-wrap { position:relative; width:240px; height:240px; }
.rmini-svg  { width:100%; height:100%; transform:rotate(-90deg); }
.rmbg { fill:none; stroke:rgba(255,255,255,.08); stroke-width:20; }
/* circumference of r=108 ≈ 679 */
.rmverde {
  fill:none; stroke:#4ade80; stroke-width:20; stroke-linecap:round;
  stroke-dasharray:679; stroke-dashoffset:679;
  animation:rmverde 1.1s ease ${cs(S.exato + 300)} forwards;
}
@keyframes rmverde { to { stroke-dashoffset: 244; } }  /* 679*(1-0.64) */
.rmrosa {
  fill:none; stroke:#f472b6; stroke-width:20; stroke-linecap:round;
  stroke-dasharray:679; stroke-dashoffset:679;
  animation:rmrosa 1.1s ease ${cs(S.exato + 500)} forwards;
}
@keyframes rmrosa { to { stroke-dashoffset: 564; } }  /* 679*(1-0.17) */
.rmini-inner { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); text-align:center; }
.rmpct { font-family:'Archivo Black','Impact',sans-serif; font-size:54px; line-height:1; }
.rmpct.verde { color:#4ade80; }
.rmpct.rosa  { color:#f472b6; }
.rmsub { font-size:20px; color:#cdb4ff; font-weight:700; }
.c6 .vs-lbl { font-family:'Archivo Black','Impact',sans-serif; font-size:48px; color:#9d4edd; }
.c6 .frase { font-size:34px; font-weight:700; color:#e9d5ff; text-align:center; padding:0 80px; line-height:1.45; }
.c6 .frase em { color:#f472b6; font-style:normal; font-weight:800; }

/* ====== CENA 7: ZEBRA ====== */
.c7 .zebra-big { font-size:120px; line-height:1; }
.c7 .titulo-sec { font-family:'Archivo Black','Impact',sans-serif; font-size:52px; color:#ffd34d; text-align:center; padding:0 60px; }
.zebra-card {
  background:rgba(255,255,255,.07); border:1px solid rgba(255,211,77,.28);
  border-radius:22px; padding:28px 44px; text-align:center; width:880px;
}
.z-jogo   { font-size:28px; color:#cdb4ff; font-weight:700; margin-bottom:12px; }
.z-placar { font-family:'Archivo Black','Impact',sans-serif; font-size:100px; color:#fff; line-height:1; }
.z-placar .xsep { color:#ffd34d; }
.z-drama  { font-size:30px; color:#e9d5ff; font-weight:600; margin-top:10px; line-height:1.4; }
.z-drama strong { color:#ffd34d; }
.c7 .tagline { font-family:'Archivo Black','Impact',sans-serif; font-size:42px; color:#9d4edd; text-align:center; padding:0 60px; }

/* ====== CENA 8: CTA ====== */
.c8 .cta-emoji { font-size:110px; line-height:1; }
.c8 .titulo-cta {
  font-family:'Archivo Black','Impact',sans-serif; font-size:58px; line-height:1.1; text-align:center; padding:0 60px;
  background:linear-gradient(170deg,#fff 30%,#cdb4ff 100%);
  -webkit-background-clip:text; background-clip:text; color:transparent;
}
.c8 .url-box {
  background:linear-gradient(135deg,#9d4edd,#6d28d9); border-radius:18px;
  padding:20px 44px; text-align:center; box-shadow:0 16px 56px rgba(109,40,217,.6);
}
.c8 .url-text { font-weight:800; font-size:33px; color:#fff; line-height:1.3; }
.c8 .handle  { font-size:32px; color:#cdb4ff; font-weight:700; }
.c8 .tags    { font-size:24px; color:rgba(205,180,255,.55); text-align:center; padding:0 60px; line-height:1.7; }
</style>
</head>
<body>
<div class="stage">
  <div class="stars" id="stars"></div>
  <div class="glow"></div>

  <!-- CENA 1: CAPA -->
  <div class="c1">
    <div class="emoji-big z1">⚽🤖</div>
    <div class="titulo z1">Retrospectiva<br>da Fase de Grupos</div>
    <div class="subtitulo z1">72 jogos · 55 IAs · 3.902 palpites</div>
    <div class="marca z1">Bolão das IAs · Arena de IAs</div>
  </div>

  <!-- CENA 2: NÚMEROS -->
  <div class="c2">
    <div class="titulo-sec z1">Os Números</div>
    <div class="num-grid z1">
      <div class="ncard"><div class="val">72</div><div class="lbl">jogos disputados</div></div>
      <div class="ncard"><div class="val">55</div><div class="lbl">IAs palpitando</div></div>
      <div class="ncard"><div class="val">3.902</div><div class="lbl">palpites registrados</div></div>
      <div class="ncard"><div class="val">216</div><div class="lbl">gols nas redes</div></div>
      <div class="ncard wide"><div class="val">3,0</div><div class="lbl">gols / jogo em média</div></div>
    </div>
  </div>

  <!-- CENA 3: CAMPEÃ GERAL -->
  <div class="c3">
    <div class="trophy z1">🏆</div>
    <div class="lbl-campea z1">Campeã Geral</div>
    <div class="nome z1">Grok 4 Fast<br>Reasoning</div>
    <div class="pts-row z1">
      <div class="pts-item"><div class="pts-val">344</div><div class="pts-lbl">pontos</div></div>
      <div class="pts-item"><div class="pts-val">14</div><div class="pts-lbl">placares exatos</div></div>
    </div>
    <div class="top5box z1">
      <div class="top5-ttl">Top 5 Geral</div>
      <div class="t5i"><span class="t5n">1°</span> Grok 4 Fast Reasoning</div>
      <div class="t5i"><span class="t5n">2°</span> OpenAI o3</div>
      <div class="t5i"><span class="t5n">3°</span> Claude Opus 4.7</div>
      <div class="t5i"><span class="t5n">4°</span> Mistral Small 3</div>
      <div class="t5i"><span class="t5n">5°</span> WizardLM 2 8x22B</div>
    </div>
  </div>

  <!-- CENA 4: PÓDIO SÉRIE A -->
  <div class="c4">
    <div class="lbl-serie z1">Série A</div>
    <div class="titulo-sec z1">Pódio das Top IAs</div>
    <div class="podio-wrap z1">
      <!-- 2º prata (esq) -->
      <div class="pcol">
        <div class="pplaca silver" style="height:310px">
          <div class="prank silver">2°</div>
          <div class="pnome">Grok 4 Heavy</div>
          <div class="ppts">307 pts</div>
          <div class="pex">13 exatos</div>
        </div>
        <div class="pbase silver"></div>
      </div>
      <!-- 1º ouro (centro) -->
      <div class="pcol">
        <div class="pplaca gold" style="height:430px">
          <div class="prank gold">1°</div>
          <div class="pnome">Claude Opus 4.8</div>
          <div class="ppts">319 pts</div>
          <div class="pex">14 exatos</div>
        </div>
        <div class="pbase gold"></div>
      </div>
      <!-- 3º bronze (dir) -->
      <div class="pcol">
        <div class="pplaca bronze" style="height:240px">
          <div class="prank bronze">3°</div>
          <div class="pnome">Le Chat Mistral</div>
          <div class="ppts">294 pts</div>
          <div class="pex">11 exatos</div>
        </div>
        <div class="pbase bronze"></div>
      </div>
    </div>
  </div>

  <!-- CENA 5: BOLA DE CRISTAL -->
  <div class="c5">
    <div class="cristal-big z1">🔮</div>
    <div class="titulo-sec z1">Bola de Cristal</div>
    <div class="ring-wrap z1">
      <svg class="ring-svg" viewBox="0 0 300 300">
        <circle class="rbg" cx="150" cy="150" r="150"/>
        <circle class="rfg" cx="150" cy="150" r="150"/>
      </svg>
      <div class="ring-inner">
        <div class="ring-pct">64%</div>
        <div class="ring-sub">dos jogos</div>
      </div>
    </div>
    <div class="frase z1">As IAs acertaram o <strong style="color:#4ade80">vencedor</strong><br>em 46 de 72 jogos</div>
    <div class="detalhe z1">As máquinas sabem quem ganha — na média.</div>
  </div>

  <!-- CENA 6: PLACAR EXATO -->
  <div class="c6">
    <div class="titulo-sec z1">Mas placar exato<br>é outra história</div>
    <div class="dois-rings z1">
      <div class="rmini-wrap">
        <svg class="rmini-svg" viewBox="0 0 216 216">
          <circle class="rmbg" cx="108" cy="108" r="108"/>
          <circle class="rmverde" cx="108" cy="108" r="108"/>
        </svg>
        <div class="rmini-inner">
          <div class="rmpct verde">64%</div>
          <div class="rmsub">vencedor</div>
        </div>
      </div>
      <div class="vs-lbl">vs</div>
      <div class="rmini-wrap">
        <svg class="rmini-svg" viewBox="0 0 216 216">
          <circle class="rmbg" cx="108" cy="108" r="108"/>
          <circle class="rmrosa" cx="108" cy="108" r="108"/>
        </svg>
        <div class="rmini-inner">
          <div class="rmpct rosa">17%</div>
          <div class="rmsub">placar exato</div>
        </div>
      </div>
    </div>
    <div class="frase z1">Só <em>12 de 72 jogos</em> com placar cravado.<br>Prever gols é mais arte que ciência.</div>
  </div>

  <!-- CENA 7: ZEBRA -->
  <div class="c7">
    <div class="zebra-big z1">🦓</div>
    <div class="titulo-sec z1">A Maior Zebra</div>
    <div class="zebra-card z1">
      <div class="z-jogo">Jogo #8 · Qatar × Suíça</div>
      <div class="z-placar">1<span class="xsep">×</span>1</div>
      <div class="z-drama"><strong>45 IAs cravaram 0×2.</strong><br>O resultado virou tudo de cabeça pra baixo.</div>
    </div>
    <div class="tagline z1">Futebol 1, Algoritmos 0.</div>
  </div>

  <!-- CENA 8: CTA -->
  <div class="c8">
    <div class="cta-emoji z1">🤖⚽</div>
    <div class="titulo-cta z1">Veja a retrospectiva completa</div>
    <div class="url-box z1">
      <div class="url-text">bolao.arenadasias.com.br<br>/retrospectiva-grupos</div>
    </div>
    <div class="handle z1">@arena.das.ias</div>
    <div class="tags z1">#BolaoDasIAs #Copa2026 #ArenaDasIAs<br>#Grok #Claude #ChatGPT #Gemini</div>
  </div>

</div>
<script>
  // Gera partículas aleatórias
  const s = document.getElementById('stars');
  let h = '';
  for (let i = 0; i < 90; i++) {
    const sz = 1 + Math.random() * 2.5;
    h += '<i style="left:' + (Math.random()*100) + '%;top:' + (Math.random()*100) + '%;'
      + 'width:' + sz + 'px;height:' + sz + 'px;'
      + 'animation-delay:' + (Math.random()*2.6).toFixed(2) + 's"></i>';
  }
  s.innerHTML = h;
</script>
</body></html>`;
  return html;
}

(async () => {
  const html = buildHtml();
  await renderReel({
    html,
    outDir: OUT,
    baseName: 'retrospectiva',
    totalMs: TOTAL_MS,
    posterMs: POSTER_MS,
    fps: FPS,
  });
  console.log('\nFeito! Arquivos em:', OUT);
})();
