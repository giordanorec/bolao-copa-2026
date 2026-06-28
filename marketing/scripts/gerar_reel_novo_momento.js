/**
 * Reel animado (1080×1920) — "Novo Momento" da Arena de IAs.
 * 8 cenas sequenciais: capa → palpites grátis → bola de cristal →
 * tour de features → anúncio Humanos×IAs (clímax) → CTA.
 *
 * Uso:
 *   node marketing/scripts/gerar_reel_novo_momento.js
 *
 * Saída: marketing/brainstorming_instagram/34_reel_novo-momento/
 *   novo-momento.webm  novo-momento.mp4  poster.png
 */

"use strict";

const fs   = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const FFMPEG_BIN =
  process.env.FFMPEG_BIN ||
  "C:/Users/grec/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1.2-full_build/bin/ffmpeg.exe";

const V4_ROOT = path.resolve(__dirname, "../../v4");
const { chromium } = require(path.join(V4_ROOT, "node_modules", "playwright"));

const OUT = path.resolve(
  __dirname,
  "../brainstorming_instagram/34_reel_novo-momento"
);
fs.mkdirSync(OUT, { recursive: true });

// ------------------------------------------------------------------
// Timeline total: ~22s
// Poster: extraído do mp4 final com ffmpeg (t=21s = cena Humanos×IAs).
// Nota: Google Fonts adiciona ~8s de overhead de rede, então o poster
// via Playwright screenshot não é confiável. Usamos ffmpeg no mp4.
// ------------------------------------------------------------------

const TOTAL_MS  = 26000;   // gravação total (ms reais)
const POSTER_MS = null;    // não usamos screenshot de Playwright para o poster
const POSTER_T  = 21;      // segundo no mp4 final para extração do poster
const TRIM_TO   = 23;      // duração final do mp4 (s)

function toMp4(webm, mp4, trimSec) {
  if (!fs.existsSync(FFMPEG_BIN)) {
    console.warn("  (ffmpeg não encontrado — pulando mp4)");
    return false;
  }
  const args = [
    "-y", "-i", webm,
    "-t", String(trimSec),
    "-vf", "scale=1080:1920:flags=lanczos",
    "-c:v", "libx264",
    "-preset", "fast",
    "-crf", "20",
    "-movflags", "+faststart",
    "-pix_fmt", "yuv420p",
    "-r", "30",
    mp4,
  ];
  execFileSync(FFMPEG_BIN, args, { stdio: "ignore" });
  return true;
}

// ms → CSS seconds string
function cs(ms) { return (ms / 1000).toFixed(2) + "s"; }

// Offsets de cada cena (ms desde início)
const S = {
  capa:       0,
  gratis:     2600,
  cristal:    5200,
  tour:       7800,
  numeros:    10400,
  humanos:    13000,
  climax:     15800,
  cta:        18600,
};

const VIS      = 2200;  // visível normal
const VIS_LONG = 2800;  // cenas de clímax

function sceneCSS(name, offsetMs, visibleMs) {
  return `
.${name} {
  position:absolute; top:0; left:0; right:0; height:1920px;
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:24px;
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
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&family=Archivo+Black&display=swap');
* { margin:0; padding:0; box-sizing:border-box; }
html,body { width:1080px; height:1920px; overflow:hidden; background:#0a0518; }

.stage {
  width:1080px; height:1920px; position:relative;
  background: radial-gradient(ellipse 900px 960px at 50% 32%, #2a1257 0%, #150a2e 50%, #0a0518 100%);
  font-family:'Sora','Segoe UI',Arial,sans-serif; color:#fff; overflow:hidden;
}

/* partículas */
.stars { position:absolute; inset:0; pointer-events:none; z-index:0; }
.stars i {
  position:absolute; border-radius:50%; background:#fff;
  animation:tw 2.6s ease-in-out infinite;
}
@keyframes tw { 0%,100%{opacity:.1;transform:scale(.5)} 50%{opacity:.7;transform:scale(1.2)} }

/* glow */
.glow {
  position:absolute; left:50%; top:28%; width:860px; height:860px;
  transform:translate(-50%,-50%); z-index:0;
  background:radial-gradient(circle, rgba(157,78,221,.45) 0%, transparent 65%);
  filter:blur(14px); animation:pulse 3.4s ease-in-out infinite;
}
@keyframes pulse {
  0%,100%{opacity:.5;transform:translate(-50%,-50%) scale(.94)}
  50%    {opacity:1; transform:translate(-50%,-50%) scale(1.07)}
}

/* keyframes das cenas */
@keyframes sceneIn  { from{opacity:0;transform:translateY(40px) scale(.97)} to{opacity:1;transform:none} }
@keyframes sceneOut { from{opacity:1} to{opacity:0} }

/* cenas */
${sceneCSS("c1", S.capa,    VIS)}
${sceneCSS("c2", S.gratis,  VIS)}
${sceneCSS("c3", S.cristal, VIS)}
${sceneCSS("c4", S.tour,    VIS)}
${sceneCSS("c5", S.numeros, VIS)}
${sceneCSS("c6", S.humanos, VIS_LONG)}
${sceneCSS("c7", S.climax,  VIS_LONG)}
${sceneCSS("c8", S.cta,     VIS + 400)}

/* utilitários */
.z1 { position:relative; z-index:1; }
.kicker { font-weight:900; letter-spacing:.16em; font-size:30px; color:#9d4edd; text-transform:uppercase; }

/* grad helpers */
.grad-purple {
  background:linear-gradient(135deg,#cdb4ff,#9d4edd);
  -webkit-background-clip:text; background-clip:text; color:transparent;
}
.grad-gold {
  background:linear-gradient(135deg,#ffd34d,#ffb300 50%,#fff7a0);
  -webkit-background-clip:text; background-clip:text; color:transparent;
}
.grad-green {
  background:linear-gradient(135deg,#4ade80,#22d3ee);
  -webkit-background-clip:text; background-clip:text; color:transparent;
}
.h-white {
  font-family:'Archivo Black',Impact,sans-serif;
  color:#fff; line-height:1.0; letter-spacing:-0.03em;
}

/* ====== CENA 1: CAPA ====== */
.c1 .big-emoji { font-size:130px; line-height:1; filter:drop-shadow(0 0 36px rgba(157,78,221,.8)); }
.c1 .titulo {
  font-family:'Archivo Black',Impact,sans-serif; font-size:90px; line-height:1.0;
  text-align:center; padding:0 60px;
  background:linear-gradient(160deg,#fff 30%,#cdb4ff 100%);
  -webkit-background-clip:text; background-clip:text; color:transparent;
}
.c1 .sub { font-size:38px; font-weight:700; color:#cdb4ff; text-align:center; padding:0 60px; line-height:1.4; }
.c1 .tag {
  display:inline-block; padding:12px 32px; border-radius:999px;
  background:rgba(157,78,221,.2); border:1.5px solid rgba(157,78,221,.4);
  font-size:28px; font-weight:800; color:#9d4edd; letter-spacing:.1em; text-transform:uppercase;
}

/* ====== CENA 2: PALPITES GRÁTIS ====== */
.c2 .lock-emoji { font-size:96px; filter:drop-shadow(0 0 24px rgba(74,222,128,.7)); }
.c2 .titulo { font-family:'Archivo Black',Impact,sans-serif; font-size:80px; text-align:center; padding:0 56px; line-height:1.0; }
.c2 .before-after { display:flex; gap:18px; width:920px; }
.c2 .ba-box {
  flex:1; padding:28px 22px; border-radius:18px;
  display:flex; flex-direction:column; align-items:center; gap:10px; text-align:center;
}
.c2 .ba-antes {
  background:rgba(255,255,255,.05); border:1.5px solid rgba(255,255,255,.12);
}
.c2 .ba-depois {
  background:linear-gradient(135deg,rgba(74,222,128,.15),rgba(34,211,238,.07));
  border:1.5px solid rgba(74,222,128,.45);
}
.c2 .ba-label { font-size:24px; font-weight:900; letter-spacing:.1em; text-transform:uppercase; }
.c2 .ba-icon  { font-size:52px; }
.c2 .ba-text  { font-size:22px; font-weight:700; color:#cdb4ff; line-height:1.4; }
.c2 .stat-box {
  background:linear-gradient(135deg,rgba(157,78,221,.2),rgba(109,40,217,.12));
  border:1.5px solid rgba(157,78,221,.4); border-radius:18px;
  padding:24px 36px; display:flex; align-items:center; gap:24px; width:920px;
}
.c2 .stat-val { font-family:'Archivo Black',Impact,sans-serif; font-size:80px; color:#ffd34d; line-height:1; }
.c2 .stat-lbl { font-size:28px; font-weight:700; color:#cdb4ff; line-height:1.3; }

/* ====== CENA 3: BOLA DE CRISTAL ====== */
.c3 .cristal { font-size:140px; line-height:1; filter:drop-shadow(0 0 48px rgba(157,78,221,.9)); animation:float 3s ease-in-out infinite; }
@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-18px)} }
.c3 .titulo { font-family:'Archivo Black',Impact,sans-serif; font-size:62px; text-align:center; padding:0 56px; color:#cdb4ff; }
.ring-wrap { position:relative; width:300px; height:300px; }
.ring-svg { width:100%; height:100%; transform:rotate(-90deg); }
.rbg { fill:none; stroke:rgba(255,255,255,.08); stroke-width:22; }
.rfg {
  fill:none; stroke:#4ade80; stroke-width:22; stroke-linecap:round;
  stroke-dasharray:942; stroke-dashoffset:942;
  animation:ringFill 1.4s ease ${cs(S.cristal + 600)} forwards;
}
/* 64% → offset = 942*(1-0.64) = 339 */
@keyframes ringFill { to { stroke-dashoffset:339; } }
.ring-inner { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); text-align:center; }
.ring-pct { font-family:'Archivo Black',Impact,sans-serif; font-size:82px; color:#4ade80; line-height:1; }
.ring-sub { font-size:26px; color:#cdb4ff; font-weight:700; }
.c3 .badges { display:flex; flex-direction:column; gap:14px; width:920px; }
.c3 .badge {
  padding:18px 26px; border-radius:14px;
  font-size:26px; font-weight:700; color:#e9d5ff; line-height:1.4;
}

/* ====== CENA 4: TOUR SITE ====== */
.c4 .titulo { font-family:'Archivo Black',Impact,sans-serif; font-size:64px; text-align:center; color:#cdb4ff; padding:0 56px; }
.c4 .items { display:flex; flex-direction:column; gap:16px; width:920px; }
.c4 .item {
  display:flex; align-items:center; gap:20px; padding:22px 24px;
  border-radius:16px; background:rgba(255,255,255,.06); border:1.5px solid rgba(205,180,255,.2);
}
.c4 .item-icon { font-size:48px; flex-shrink:0; }
.c4 .item-title { font-family:'Archivo Black',Impact,sans-serif; font-size:28px; color:#fff; }
.c4 .item-sub   { font-size:20px; color:#cdb4ff; font-weight:600; margin-top:3px; }

/* ====== CENA 5: NÚMEROS ====== */
.c5 .titulo { font-family:'Archivo Black',Impact,sans-serif; font-size:64px; text-align:center; color:#cdb4ff; padding:0 56px; }
.c5 .num-grid { display:grid; grid-template-columns:1fr 1fr; gap:18px; width:920px; }
.c5 .ncard {
  background:rgba(255,255,255,.07); border:1.5px solid rgba(205,180,255,.2);
  border-radius:20px; padding:28px 22px; text-align:center;
}
.c5 .ncard .val {
  font-family:'Archivo Black',Impact,sans-serif; font-size:72px; line-height:1;
  background:linear-gradient(160deg,#fff 30%,#cdb4ff);
  -webkit-background-clip:text; background-clip:text; color:transparent;
}
.c5 .ncard .lbl { font-size:22px; font-weight:700; color:#cdb4ff; margin-top:6px; }

/* ====== CENA 6: HUMANOS × IAs ====== */
.c6 .alert { font-size:100px; filter:drop-shadow(0 0 32px rgba(255,211,77,.7)); }
.c6 .badge-label {
  padding:10px 28px; border-radius:999px;
  background:rgba(255,211,77,.12); border:1.5px solid rgba(255,211,77,.45);
  font-size:24px; font-weight:900; letter-spacing:.14em; text-transform:uppercase; color:#ffd34d;
}
.c6 .titulo { font-family:'Archivo Black',Impact,sans-serif; font-size:78px; text-align:center; line-height:0.95; padding:0 56px; }
.c6 .vs-row { display:flex; align-items:center; gap:20px; width:920px; justify-content:center; }
.c6 .vs-box {
  flex:1; padding:28px 18px; border-radius:20px;
  display:flex; flex-direction:column; align-items:center; gap:10px; text-align:center;
}
.c6 .vs-human {
  background:linear-gradient(135deg,rgba(74,222,128,.15),rgba(74,222,128,.06));
  border:1.5px solid rgba(74,222,128,.4);
}
.c6 .vs-ia {
  background:linear-gradient(135deg,rgba(157,78,221,.15),rgba(157,78,221,.06));
  border:1.5px solid rgba(157,78,221,.4);
}
.c6 .vs-icon  { font-size:60px; }
.c6 .vs-name  { font-family:'Archivo Black',Impact,sans-serif; font-size:40px; line-height:1; }
.c6 .vs-sub   { font-size:20px; font-weight:700; color:rgba(205,180,255,.7); }
.c6 .vs-sep   { font-family:'Archivo Black',Impact,sans-serif; font-size:52px; color:#ffd34d; filter:drop-shadow(0 0 16px rgba(255,211,77,.5)); flex-shrink:0; }
.c6 .call     { font-size:34px; font-weight:800; color:#4ade80; text-align:center; padding:0 60px; line-height:1.4; }

/* ====== CENA 7: CLÍMAX ====== */
.c7 .big { font-size:112px; filter:drop-shadow(0 0 40px rgba(74,222,128,.7)); }
.c7 .titulo { font-family:'Archivo Black',Impact,sans-serif; font-size:86px; text-align:center; padding:0 56px; line-height:0.95; }
.c7 .sub { font-size:34px; font-weight:700; color:rgba(205,180,255,.85); text-align:center; padding:0 60px; line-height:1.5; }
.c7 .bullets { display:flex; flex-direction:column; gap:14px; width:900px; }
.c7 .bullet {
  display:flex; align-items:center; gap:18px; padding:16px 22px;
  border-radius:14px; background:rgba(255,255,255,.07); border:1.5px solid rgba(205,180,255,.2);
}
.c7 .bullet-icon { font-size:32px; flex-shrink:0; }
.c7 .bullet-text { font-size:24px; font-weight:700; color:#e9d5ff; }

/* ====== CENA 8: CTA ====== */
.c8 .cta-emoji { font-size:100px; }
.c8 .titulo {
  font-family:'Archivo Black',Impact,sans-serif; font-size:72px; text-align:center; padding:0 56px; line-height:1.0;
  background:linear-gradient(160deg,#fff 30%,#cdb4ff);
  -webkit-background-clip:text; background-clip:text; color:transparent;
}
.c8 .url-box {
  background:linear-gradient(135deg,#9d4edd,#6d28d9); border-radius:18px;
  padding:22px 48px; text-align:center; box-shadow:0 16px 56px rgba(109,40,217,.6); width:920px;
}
.c8 .url-text { font-family:'Archivo Black',Impact,sans-serif; font-size:36px; color:#ffd34d; line-height:1.3; }
.c8 .url-sub  { font-size:28px; font-weight:700; color:rgba(255,255,255,.7); margin-top:4px; }
.c8 .handle   { font-size:32px; color:#cdb4ff; font-weight:700; }
.c8 .tags     { font-size:24px; color:rgba(205,180,255,.5); text-align:center; padding:0 60px; line-height:1.7; }
</style>
</head>
<body>
<div class="stage">
  <div class="stars" id="stars"></div>
  <div class="glow"></div>

  <!-- CENA 1: CAPA -->
  <div class="c1">
    <div class="big-emoji z1">🚀🤖</div>
    <div class="titulo z1">A Arena das IAs<br>entrou em campo</div>
    <div class="sub z1">Novo momento · Copa 2026</div>
    <div class="tag z1">Bolão das IAs</div>
  </div>

  <!-- CENA 2: PALPITES GRÁTIS -->
  <div class="c2">
    <div class="lock-emoji z1">🔓</div>
    <div class="titulo z1">
      <span class="grad-gold">Palpites das IAs<br>agora são grátis</span>
    </div>
    <div class="before-after z1">
      <div class="ba-box ba-antes">
        <div class="ba-label" style="color:rgba(255,255,255,.4);">Antes</div>
        <div class="ba-icon">🔒</div>
        <div class="ba-text">Parte era exclusiva para contribuintes</div>
      </div>
      <div class="ba-box ba-depois">
        <div class="ba-label" style="color:#4ade80;">Agora</div>
        <div class="ba-icon">🔓</div>
        <div class="ba-text"><strong style="color:#4ade80;">Todos abertos</strong><br>sem cadeado, sem Pix</div>
      </div>
    </div>
    <div class="stat-box z1">
      <div style="font-size:56px;">🤖</div>
      <div>
        <div class="stat-val">55+</div>
        <div class="stat-lbl">IAs com palpites visíveis a todos</div>
      </div>
    </div>
  </div>

  <!-- CENA 3: BOLA DE CRISTAL -->
  <div class="c3">
    <div class="cristal z1">🔮</div>
    <div class="titulo z1">Bola de Cristal<br><span style="color:#4ade80;">acertou o vencedor em</span></div>
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
    <div class="badges z1">
      <div class="badge" style="background:rgba(74,222,128,.1);border:1.5px solid rgba(74,222,128,.3);">
        ✅ Consenso das IAs — fase de grupos <strong style="color:#4ade80;">E</strong> mata-mata
      </div>
      <div class="badge" style="background:rgba(157,78,221,.1);border:1.5px solid rgba(157,78,221,.3);">
        ⚔️ Oitavas: placar mais votado já disponível
      </div>
    </div>
  </div>

  <!-- CENA 4: TOUR DO SITE -->
  <div class="c4">
    <div class="kicker z1">🗺 Tour do site</div>
    <div class="titulo z1">O que tem<br><span class="grad-purple">de novo</span></div>
    <div class="items z1">
      <div class="item">
        <div class="item-icon">📊</div>
        <div>
          <div class="item-title">Retrospectiva de grupos</div>
          <div class="item-sub">72 jogos — zebras, goleadas, campeã</div>
        </div>
      </div>
      <div class="item">
        <div class="item-icon">🏆</div>
        <div>
          <div class="item-title">Ranking Geral</div>
          <div class="item-sub">Geral · Série A · Humanos × IAs</div>
        </div>
      </div>
      <div class="item">
        <div class="item-icon">🏁</div>
        <div>
          <div class="item-title">Corrida das IAs</div>
          <div class="item-sub">Animação placar a placar</div>
        </div>
      </div>
      <div class="item" style="border-color:rgba(255,211,77,.4);background:rgba(255,211,77,.07);">
        <div class="item-icon">⚔️</div>
        <div>
          <div class="item-title" style="color:#ffd34d;">Palpites do mata-mata</div>
          <div class="item-sub">Oitavas disponíveis agora</div>
        </div>
      </div>
    </div>
  </div>

  <!-- CENA 5: NÚMEROS -->
  <div class="c5">
    <div class="kicker z1">📈 A escala do bolão</div>
    <div class="titulo z1">Fase de grupos<br><span class="grad-purple">em números</span></div>
    <div class="num-grid z1">
      <div class="ncard"><div class="val">3.902</div><div class="lbl">palpites</div></div>
      <div class="ncard"><div class="val">55+</div><div class="lbl">IAs</div></div>
      <div class="ncard"><div class="val">72</div><div class="lbl">jogos</div></div>
      <div class="ncard"><div class="val" style="background:linear-gradient(135deg,#4ade80,#22d3ee);-webkit-background-clip:text;background-clip:text;color:transparent;">64%</div><div class="lbl">Bola de Cristal</div></div>
    </div>
  </div>

  <!-- CENA 6: HUMANOS × IAs ANÚNCIO -->
  <div class="c6">
    <div class="alert z1">🚨</div>
    <div class="badge-label z1">Vem aí</div>
    <div class="titulo z1">
      Bolão da Arena<br>
      <span class="grad-gold">Humanos × IAs</span>
    </div>
    <div class="vs-row z1">
      <div class="vs-box vs-human">
        <div class="vs-icon">🧠</div>
        <div class="vs-name" style="color:#4ade80;">Você</div>
        <div class="vs-sub">& seus amigos</div>
      </div>
      <div class="vs-sep">VS</div>
      <div class="vs-box vs-ia">
        <div class="vs-icon">🤖</div>
        <div class="vs-name" style="color:#cdb4ff;">55+ IAs</div>
        <div class="vs-sub">ChatGPT, Claude, Grok…</div>
      </div>
    </div>
    <div class="call z1">Qualquer pessoa entra.<br>De graça.</div>
  </div>

  <!-- CENA 7: CLÍMAX -->
  <div class="c7">
    <div class="big z1">⚽🏆</div>
    <div class="titulo z1">
      <span class="grad-green">Você acha que<br>bate as IAs?</span>
    </div>
    <div class="sub z1">Entra e prova. Mata-mata.<br>Dispute no ranking ao vivo.</div>
    <div class="bullets z1">
      <div class="bullet">
        <div class="bullet-icon">🔓</div>
        <div class="bullet-text">Palpites das 55+ IAs — de graça</div>
      </div>
      <div class="bullet">
        <div class="bullet-icon">🔮</div>
        <div class="bullet-text">Bola de Cristal: oitavas disponíveis</div>
      </div>
      <div class="bullet" style="border-color:rgba(74,222,128,.35);background:rgba(74,222,128,.08);">
        <div class="bullet-icon">🏁</div>
        <div class="bullet-text" style="color:#4ade80;">Você vs 55+ IAs — começa agora</div>
      </div>
    </div>
  </div>

  <!-- CENA 8: CTA -->
  <div class="c8">
    <div class="cta-emoji z1">🤖⚽</div>
    <div class="titulo z1">Acessa agora</div>
    <div class="url-box z1">
      <div class="url-text">bolao.arenadasias.com.br</div>
      <div class="url-sub">palpites grátis · bolão Humanos × IAs</div>
    </div>
    <div class="handle z1">@arena.das.ias</div>
    <div class="tags z1">#BolaoDasIAs #Copa2026 #ArenaDasIAs<br>#HumanosXIAs #ChatGPT #Claude #Grok</div>
  </div>

</div>
<script>
  const s=document.getElementById('stars'); let h='';
  for(let i=0;i<90;i++){
    const z=1+Math.random()*2.3;
    h+='<i style="left:'+Math.random()*100+'%;top:'+Math.random()*100+'%;'
      +'width:'+z+'px;height:'+z+'px;'
      +'animation-delay:'+(Math.random()*2.6).toFixed(2)+'s"></i>';
  }
  s.innerHTML=h;
</script>
</body></html>`;
  return html;
}

(async () => {
  const html     = buildHtml();
  const htmlPath = path.join(OUT, "_reel_novo_momento.html");
  fs.writeFileSync(htmlPath, html, "utf-8");

  const webmPath   = path.join(OUT, "novo-momento.webm");
  const mp4Path    = path.join(OUT, "novo-momento.mp4");
  const posterPath = path.join(OUT, "poster.png");

  console.log("Iniciando Playwright...");
  const browser = await chromium.launch({
    args: ["--disable-web-security", "--allow-file-access-from-files"],
  });

  const context = await browser.newContext({
    viewport: { width: 1080, height: 1920 },
    deviceScaleFactor: 1,
    recordVideo: { dir: OUT, size: { width: 1080, height: 1920 } },
  });

  const page = await context.newPage();
  await page.goto("file://" + htmlPath.replace(/\\/g, "/"));

  // Aguarda toda a timeline (Google Fonts pode adicionar vários segundos de overhead)
  console.log(`  aguardando ${TOTAL_MS}ms de timeline...`);
  await page.waitForTimeout(TOTAL_MS);

  await page.close();
  const tmpVideo = await page.video().path();
  await context.close();

  // Copia webm
  fs.copyFileSync(tmpVideo, webmPath);
  try { fs.rmSync(tmpVideo, { force: true }); } catch (_) {}
  console.log("  webm:", webmPath);

  // Converte mp4
  const hasMp4 = toMp4(webmPath, mp4Path, TRIM_TO);
  console.log(hasMp4 ? `  mp4 (${TRIM_TO}s): ${mp4Path}` : "  (sem mp4 — ffmpeg ausente)");

  // Extrai poster do mp4 no frame certo (mais confiável que screenshot mid-run)
  if (hasMp4 && fs.existsSync(FFMPEG_BIN)) {
    const args = ["-y", "-ss", String(POSTER_T), "-i", mp4Path, "-frames:v", "1", "-update", "1", posterPath];
    execFileSync(FFMPEG_BIN, args, { stdio: "ignore" });
    console.log(`  poster (t=${POSTER_T}s mp4): ${posterPath}`);
  }

  // Remove html temp
  try { fs.rmSync(htmlPath, { force: true }); } catch (_) {}

  await browser.close();
  console.log("\nFeito! Arquivos em:", OUT);
  console.log("  poster.png :", posterPath);
  console.log("  webm       :", webmPath);
  if (hasMp4) console.log("  mp4        :", mp4Path);
})();
