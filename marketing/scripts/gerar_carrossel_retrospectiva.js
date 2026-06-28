/**
 * Gera o carrossel de retrospectiva da fase de grupos (8 slides, 1080×1350).
 * Fonte de verdade: v4/public/ranking-ias.json, jogos.json, bola_de_cristal.json, paises_iso.json.
 * Lógica fiel a v4/lib/retrospectiva-grupos.ts + v4/lib/serie-a.ts.
 *
 * Uso (na pasta v4/):
 *   node ../marketing/scripts/gerar_carrossel_retrospectiva.js
 */

"use strict";

const fs = require("fs");
const path = require("path");

const V4_ROOT = path.resolve(__dirname, "../../v4");
const { chromium } = require(path.join(V4_ROOT, "node_modules", "playwright"));
const LOGOS_DIR = path.join(V4_ROOT, "public", "logos");
const OUT = path.resolve(
  __dirname,
  "../brainstorming_instagram/31_carrossel_retrospectiva-grupos"
);

const SITE = "bolao.arenadasias.com.br";
const INSTA = "@arena.das.ias";

// ── helpers ────────────────────────────────────────────────────────────────

function logoIA(familia, size = 80) {
  const arq = path.join(LOGOS_DIR, `${familia}.svg`);
  if (!fs.existsSync(arq)) return `<div style="width:${size}px;height:${size}px;"></div>`;
  const svg = fs.readFileSync(arq).toString("base64");
  return `<img src="data:image/svg+xml;base64,${svg}" style="width:${size}px;height:${size}px;object-fit:contain;flex-shrink:0;" />`;
}

// ISO alpha-2 → circle flag URL (hatscripts CDN)
function flagUrl(iso) {
  if (!iso) return null;
  return `https://hatscripts.github.io/circle-flags/flags/${iso}.svg`;
}

// Inline flag via data URI (fetched at render time by Playwright)
// We use <img> with direct URL since Playwright fetches external assets
function flag(iso, size = 56) {
  if (!iso) return `<span style="font-size:${size}px;">🏳️</span>`;
  return `<img src="${flagUrl(iso)}" width="${size}" height="${size}"
    style="border-radius:50%;object-fit:cover;box-shadow:0 3px 10px rgba(0,0,0,.25);flex-shrink:0;" />`;
}

function readJson(file) {
  return JSON.parse(
    fs.readFileSync(path.join(V4_ROOT, "public", file), "utf8")
  );
}

// ── Série A config (mirrors v4/lib/serie-a.ts) ────────────────────────────

const SLUGS_SERIE_A = [
  "chatgpt-5-thinking-web",
  "claude-opus-4-8-web",
  "gemini-2-5-pro-web",
  "grok-4-heavy-web",
  "deepseek-r1-web",
  "copilot-microsoft-web",
  "perplexity-sonar-pro-web",
  "meta-llama-4-web",
  "le-chat-mistral-web",
  "qwen-3-max-web",
  "manus-web",
  "claude-fable-5",
];

const APELIDOS_SERIE_A = {
  "chatgpt-5-thinking-web": "ChatGPT 5 Thinking",
  "claude-opus-4-8-web": "Claude Opus 4.8",
  "gemini-2-5-pro-web": "Gemini 2.5 Pro",
  "grok-4-heavy-web": "Grok 4 Heavy",
  "deepseek-r1-web": "DeepSeek R1",
  "copilot-microsoft-web": "Microsoft Copilot",
  "perplexity-sonar-pro-web": "Perplexity Sonar",
  "meta-llama-4-web": "Meta Llama 4",
  "le-chat-mistral-web": "Le Chat Mistral",
  "qwen-3-max-web": "Qwen 3 Max",
  "manus-web": "Manus",
  "claude-fable-5": "Claude Code + Fable",
};

const FALLBACK_NAO_WEB = {
  "chatgpt-5-thinking-web": "chatgpt-5-thinking",
  "claude-opus-4-8-web": "claude-opus-4-7",
  "gemini-2-5-pro-web": "gemini-2-5-pro",
  "grok-4-heavy-web": "grok-4-heavy",
  "deepseek-r1-web": "deepseek-r1",
  "copilot-microsoft-web": "copilot-microsoft",
  "perplexity-sonar-pro-web": "perplexity-sonar-pro",
  "meta-llama-4-web": "meta-llama-4",
  "le-chat-mistral-web": "le-chat-mistral",
  "qwen-3-max-web": "qwen-3-max",
  "manus-web": "manus",
};

// Logos das famílias para a Série A
const FAMILIA_SERIE_A = {
  "chatgpt-5-thinking-web": "openai",
  "claude-opus-4-8-web": "anthropic",
  "gemini-2-5-pro-web": "google",
  "grok-4-heavy-web": "xai",
  "deepseek-r1-web": "deepseek",
  "copilot-microsoft-web": "microsoft",
  "perplexity-sonar-pro-web": "perplexity",
  "meta-llama-4-web": "meta",
  "le-chat-mistral-web": "mistral",
  "qwen-3-max-web": "alibaba",
  "manus-web": "manus",
  "claude-fable-5": "anthropic",
};

// ── Compute data (mirrors carregarRetroGrupos) ──────────────────────────────

function computeData() {
  const rankRaw = readJson("ranking-ias.json");
  const jogosRaw = readJson("jogos.json");
  const cristal = readJson("bola_de_cristal.json");
  const isoRaw = readJson("paises_iso.json");

  const iso = { ...isoRaw };
  delete iso._README;
  const isoDe = (time) => iso[time];

  const lista = Array.isArray(jogosRaw) ? jogosRaw : jogosRaw.jogos;
  const grupos = lista.filter(
    (j) => j.numero <= 72 && j.gols_a != null && j.gols_b != null
  );

  const porSlug = new Map(rankRaw.ias.map((ia) => [ia.slug, ia]));
  const sign = (x) => (x > 0 ? 1 : x < 0 ? -1 : 0);

  // Campeã geral
  const comGrupos = rankRaw.ias.filter(
    (x) => x.grupos && x.grupos.jogos_palpitados > 0
  );
  const ordGeral = [...comGrupos].sort(
    (a, b) => (b.grupos.pontos ?? 0) - (a.grupos.pontos ?? 0)
  );
  const top = ordGeral[0];
  const campeaGeral = {
    nome: top.nome_display,
    pontos: top.grupos.pontos,
    exatos: top.grupos.placares_exatos,
  };
  const totalIas = comGrupos.length;

  // Top 5 geral
  const top5 = ordGeral.slice(0, 5).map((ia) => ({
    nome: ia.nome_display,
    pontos: ia.grupos.pontos,
    exatos: ia.grupos.placares_exatos,
  }));

  // Pódio Série A
  const cand = [];
  for (const slug of SLUGS_SERIE_A) {
    const oficial = porSlug.get(slug);
    const siblingSlug = FALLBACK_NAO_WEB[slug];
    const sibling = siblingSlug ? porSlug.get(siblingSlug) : undefined;
    const fonte = sibling ?? oficial;
    if (!fonte?.grupos) continue;
    cand.push({
      slug,
      nome: APELIDOS_SERIE_A[slug] ?? slug,
      familia: FAMILIA_SERIE_A[slug] ?? "",
      pontos: fonte.grupos.pontos,
      exatos: fonte.grupos.placares_exatos,
    });
  }
  cand.sort((a, b) => b.pontos - a.pontos);
  const podioSerieA = cand.slice(0, 3).map((c, i) => ({
    ...c,
    posicao: i + 1,
  }));

  // Métricas do cristal + zebras + goleadas
  let totalGols = 0;
  let acertouVenc = 0;
  let exatosCristal = 0;
  let maisConsenso = null;
  const zebras = [];

  for (const j of grupos) {
    totalGols += j.gols_a + j.gols_b;
    const c = cristal[String(j.numero)];
    if (!c) continue;
    const real = sign(j.gols_a - j.gols_b);
    const pred = sign(c.gols_a - c.gols_b);
    if (c.gols_a === j.gols_a && c.gols_b === j.gols_b) exatosCristal++;
    if (pred === real) acertouVenc++;
    else
      zebras.push({
        numero: j.numero,
        timeA: j.time_a,
        timeB: j.time_b,
        isoA: isoDe(j.time_a),
        isoB: isoDe(j.time_b),
        golsA: j.gols_a,
        golsB: j.gols_b,
        cristalA: c.gols_a,
        cristalB: c.gols_b,
        votos: c.votos,
      });
    if (!maisConsenso || c.votos > maisConsenso.votos) {
      maisConsenso = {
        numero: j.numero,
        timeA: j.time_a,
        timeB: j.time_b,
        votos: c.votos,
        cristalA: c.gols_a,
        cristalB: c.gols_b,
      };
    }
  }

  zebras.sort((a, b) => b.votos - a.votos);

  const goleadas = [...grupos]
    .map((j) => ({
      numero: j.numero,
      timeA: j.time_a,
      timeB: j.time_b,
      isoA: isoDe(j.time_a),
      isoB: isoDe(j.time_b),
      golsA: j.gols_a,
      golsB: j.gols_b,
      totalGols: j.gols_a + j.gols_b,
    }))
    .sort((a, b) => b.totalGols - a.totalGols);

  const totalJogos = grupos.length;
  const totalPalpites = comGrupos.reduce(
    (acc, x) => acc + (x.grupos.jogos_palpitados ?? 0),
    0
  );

  return {
    totalJogos,
    totalIas,
    totalPalpites,
    totalGols,
    mediaGolsJogo: (totalGols / Math.max(1, totalJogos)).toFixed(1),
    campeaGeral,
    top5,
    podioSerieA,
    cristalPctVencedor: Math.round((acertouVenc / Math.max(1, totalJogos)) * 100),
    cristalAcertouVencedor: acertouVenc,
    cristalExatos: exatosCristal,
    cristalPctExatos: Math.round((exatosCristal / Math.max(1, totalJogos)) * 100),
    zebraDestaque: zebras[0] ?? null,
    goleadaDestaque: goleadas[0] ?? null,
    goleadasResto: goleadas.slice(1, 4),
  };
}

// ── Brand CSS (1080×1350) ─────────────────────────────────────────────────

const BASE_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1080px; height: 1350px;
    font-family: -apple-system, 'Segoe UI', system-ui, sans-serif;
    color: #1A1A1A; background: #FFFFFF;
    overflow: hidden; position: relative;
  }
  body::before {
    content: ""; position: absolute; inset: 0; pointer-events: none;
    background:
      radial-gradient(circle at 0% 0%, rgba(0,156,59,0.07), transparent 40%),
      radial-gradient(circle at 100% 100%, rgba(255,206,0,0.09), transparent 40%);
  }
  body::after {
    content: ""; position: absolute; top: 0; left: 0; right: 0;
    height: 7px;
    background: linear-gradient(90deg, #009C3B 0%, #FFCE00 50%, #002776 100%);
  }
  .wrap {
    position: relative; z-index: 2;
    padding: 56px 80px 48px;
    height: 100%;
    display: flex; flex-direction: column;
  }
  .brand-mini {
    display: flex; align-items: center; gap: 12px;
    font-size: 22px; font-weight: 900;
    color: #002776; letter-spacing: -0.01em;
    flex-shrink: 0;
  }
  .brand-mini .ball { font-size: 34px; transform: rotate(-8deg); }
  .rodape-mini {
    margin-top: auto;
    padding-top: 22px;
    border-top: 2px dashed #DDD;
    display: flex; gap: 12px; justify-content: center; align-items: center;
    flex-wrap: wrap;
    flex-shrink: 0;
  }
  .pill {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 11px 22px; border-radius: 999px;
    font-size: 19px; font-weight: 800; color: #fff;
  }
  .pill-site { background: #009C3B; }
  .pill-insta {
    background: linear-gradient(135deg, #F58529, #DD2A7B, #8134AF);
  }
  .kicker {
    font-size: 15px; font-weight: 900; letter-spacing: 0.18em;
    text-transform: uppercase; color: #009C3B; margin-bottom: 8px;
  }
  .swipe {
    position: absolute; bottom: 28px; right: 80px;
    font-size: 13px; font-weight: 800;
    color: #002776; letter-spacing: 0.1em;
    text-transform: uppercase;
    z-index: 3;
  }
`;

// ── Slides ────────────────────────────────────────────────────────────────

function buildSlides(d) {
  // helpers
  const {
    totalJogos, totalIas, totalPalpites, totalGols, mediaGolsJogo,
    campeaGeral, top5, podioSerieA,
    cristalPctVencedor, cristalAcertouVencedor, cristalExatos, cristalPctExatos,
    zebraDestaque, goleadaDestaque, goleadasResto,
  } = d;

  const zd = zebraDestaque;
  const gd = goleadaDestaque;

  // ── SLIDE 1 — Capa ──────────────────────────────────────────────────────
  const slide1 = {
    nome: "slide-01.png",
    body: `
      <div class="wrap" style="text-align:center; justify-content:space-between;">
        <div class="brand-mini" style="justify-content:center;">
          <span class="ball">⚽</span>
          <span>Bolão das IAs</span>
        </div>

        <div style="flex:1; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:28px;">
          <div style="
            display:inline-block; padding:10px 28px; border-radius:999px;
            background: linear-gradient(135deg,rgba(0,156,59,.10),rgba(0,39,118,.10));
            border: 2px solid rgba(0,156,59,.25);
            font-size:19px; font-weight:900; letter-spacing:0.12em;
            text-transform:uppercase; color:#002776;
          ">Copa do Mundo 2026 · Bolão das IAs</div>

          <h1 style="
            font-size:108px; font-weight:900;
            color:#002776; line-height:0.95;
            letter-spacing:-0.04em;
            max-width:900px;
          ">
            Retrospectiva<br>
            <span style="
              background: linear-gradient(135deg, #009C3B, #002776);
              -webkit-background-clip:text; -webkit-text-fill-color:transparent;
              background-clip:text;
            ">da Fase de Grupos</span>
          </h1>

          <div style="
            width:80px; height:4px; border-radius:2px;
            background: linear-gradient(90deg, #009C3B, #FFCE00, #002776);
          "></div>

          <p style="
            font-size:36px; font-weight:700; color:#3A3A3A;
            line-height:1.4; max-width:780px;
          ">
            <strong style="color:#009C3B;">${totalJogos} jogos</strong> ·
            <strong style="color:#002776;">${totalIas} IAs</strong> ·
            <strong style="color:#DD2A7B;">milhares de palpites</strong>
            <br>
            o que as máquinas acertaram — e o que escapou de todas elas.
          </p>
        </div>

        <div style="display:flex; flex-direction:column; align-items:center; gap:16px;">
          <div style="
            font-size:24px; font-weight:800; color:#009C3B;
            padding:12px 32px; border:2px solid #009C3B;
            border-radius:999px; background:rgba(0,156,59,.07);
            letter-spacing:0.04em;
          ">arraste pra ver →</div>
          <div class="rodape-mini" style="margin-top:0; padding-top:16px; width:100%;">
            <div class="pill pill-site">🌐 ${SITE}</div>
            <div class="pill pill-insta">📸 ${INSTA}</div>
          </div>
        </div>
      </div>
    `,
  };

  // ── SLIDE 2 — Números ────────────────────────────────────────────────────
  const slide2 = {
    nome: "slide-02.png",
    body: `
      <div class="wrap">
        <div class="brand-mini">
          <span class="ball">⚽</span>
          <span>Bolão das IAs · Fase de Grupos</span>
        </div>

        <div style="flex:1; display:flex; flex-direction:column; justify-content:center; gap:40px;">
          <div>
            <div class="kicker">Em números</div>
            <h2 style="
              font-size:74px; font-weight:900;
              color:#002776; line-height:1.0;
              letter-spacing:-0.03em; margin-bottom:8px;
            ">A escala do bolão</h2>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px;">
            ${[
              { n: totalJogos,    label: "jogos disputados",      cor: "#009C3B", icon: "⚽" },
              { n: totalIas,      label: "IAs palpitando",        cor: "#002776", icon: "🤖" },
              { n: totalPalpites, label: "palpites registrados",  cor: "#DD2A7B", icon: "📊" },
              { n: totalGols,     label: "gols nas redes",        cor: "#FFCE00", bg: "#002776", icon: "🥅" },
            ].map(st => `
              <div style="
                padding:36px 32px; border-radius:24px;
                background: ${st.bg ?? '#F8F9FC'};
                border: 2.5px solid ${st.cor}22;
                box-shadow: 0 4px 20px rgba(0,0,0,.06);
              ">
                <div style="font-size:44px; margin-bottom:8px;">${st.icon}</div>
                <div style="
                  font-size:76px; font-weight:900; line-height:1;
                  color: ${st.bg ? '#fff' : st.cor};
                ">${st.n.toLocaleString("pt-BR")}</div>
                <div style="
                  font-size:21px; font-weight:700; margin-top:8px;
                  color: ${st.bg ? 'rgba(255,255,255,.8)' : '#555'};
                ">${st.label}</div>
              </div>
            `).join("")}
          </div>

          <div style="
            text-align:center; padding:24px 32px; border-radius:20px;
            background: linear-gradient(135deg,rgba(0,156,59,.08),rgba(0,39,118,.06));
            border: 2px dashed rgba(0,156,59,.3);
          ">
            <span style="font-size:32px; font-weight:800; color:#1A1A1A;">
              Média de <strong style="color:#009C3B; font-size:40px;">${mediaGolsJogo}</strong> gols por jogo
              — uma fase de grupos movimentada 🔥
            </span>
          </div>
        </div>

        <div class="rodape-mini">
          <div class="pill pill-site">🌐 ${SITE}</div>
          <div class="pill pill-insta">📸 ${INSTA}</div>
        </div>
      </div>
      <div class="swipe">arraste →</div>
    `,
  };

  // ── SLIDE 3 — Campeã Geral ───────────────────────────────────────────────
  const slide3 = {
    nome: "slide-03.png",
    body: `
      <div class="wrap" style="text-align:center;">
        <div class="brand-mini" style="justify-content:center;">
          <span class="ball">⚽</span>
          <span>Bolão das IAs · Fase de Grupos</span>
        </div>

        <div style="flex:1; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:24px;">
          <div class="kicker" style="color:#FFCE00; font-size:16px;">🏆 A melhor entre ${totalIas}</div>

          <div style="font-size:140px; line-height:1; filter:drop-shadow(0 12px 36px rgba(255,199,0,.4));">🏆</div>

          <div style="
            font-size: 82px; font-weight:900;
            background: linear-gradient(100deg, #FFCE00, #FF8C00);
            -webkit-background-clip:text; -webkit-text-fill-color:transparent;
            background-clip:text; line-height:1.0; letter-spacing:-0.03em;
          ">${campeaGeral.nome}</div>

          <p style="font-size:26px; color:#555; font-weight:600; max-width:600px;">
            A IA mais precisa da fase de grupos entre todos os ${totalIas} modelos.
          </p>

          <div style="display:flex; gap:48px; justify-content:center; margin-top:16px;">
            <div style="
              padding:28px 44px; border-radius:20px;
              background: linear-gradient(135deg,#002776,#004AB5);
              box-shadow:0 8px 28px rgba(0,39,118,.30);
            ">
              <div style="font-size:80px; font-weight:900; color:#FFCE00; line-height:1;">${campeaGeral.pontos}</div>
              <div style="font-size:19px; font-weight:800; color:rgba(255,255,255,.8); text-transform:uppercase; letter-spacing:.08em; margin-top:6px;">pontos</div>
            </div>
            <div style="
              padding:28px 44px; border-radius:20px;
              background: linear-gradient(135deg,#009C3B,#006B28);
              box-shadow:0 8px 28px rgba(0,156,59,.30);
            ">
              <div style="font-size:80px; font-weight:900; color:#fff; line-height:1;">${campeaGeral.exatos}</div>
              <div style="font-size:19px; font-weight:800; color:rgba(255,255,255,.8); text-transform:uppercase; letter-spacing:.08em; margin-top:6px;">placares exatos</div>
            </div>
          </div>

          <div style="
            margin-top:16px; padding:20px 32px; border-radius:16px;
            background:#F8F9FC; border:2px solid #EEE;
            font-size:22px; color:#444; font-weight:600; max-width:760px; text-align:left;
          ">
            <div style="font-size:16px; font-weight:900; color:#002776; text-transform:uppercase; letter-spacing:.08em; margin-bottom:10px;">Top 5 geral</div>
            ${top5.map((ia, i) => `
              <div style="display:flex; align-items:center; gap:12px; padding:6px 0; ${i < 4 ? 'border-bottom:1px solid #EEE;' : ''}">
                <span style="font-size:18px; font-weight:900; color:#002776; min-width:28px;">${i+1}º</span>
                <span style="font-size:18px; font-weight:700; color:#1A1A1A; flex:1;">${ia.nome}</span>
                <span style="font-size:18px; font-weight:900; color:#009C3B;">${ia.pontos} pts</span>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="rodape-mini">
          <div class="pill pill-site">🌐 ${SITE}</div>
          <div class="pill pill-insta">📸 ${INSTA}</div>
        </div>
      </div>
      <div class="swipe">arraste →</div>
    `,
  };

  // ── SLIDE 4 — Pódio Série A ──────────────────────────────────────────────
  // visual order: 2nd, 1st, 3rd
  const visual = [podioSerieA[1], podioSerieA[0], podioSerieA[2]];
  const medals = ["🥈", "🥇", "🥉"];
  const heights = [200, 280, 160]; // step heights for the podium
  const logoSizes = [84, 108, 76];

  const slide4 = {
    nome: "slide-04.png",
    body: `
      <div class="wrap" style="text-align:center;">
        <div class="brand-mini" style="justify-content:center;">
          <span class="ball">⚽</span>
          <span>Bolão das IAs · Série A</span>
        </div>

        <div style="flex:1; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:28px;">
          <div>
            <div class="kicker" style="font-size:16px;">🎖 As 12 IAs que você usa no dia a dia</div>
            <h2 style="
              font-size:78px; font-weight:900;
              color:#002776; line-height:1.0;
              letter-spacing:-0.03em;
            ">Pódio da Série A</h2>
            <p style="font-size:24px; color:#555; font-weight:600; margin-top:10px;">
              As estrelas da interface pública — quem brilhou mais?
            </p>
          </div>

          <div style="display:flex; align-items:flex-end; justify-content:center; gap:16px; width:100%; max-width:880px;">
            ${visual.map((it, i) => {
              const is1 = it.posicao === 1;
              const h = heights[i];
              const ls = logoSizes[i];
              return `
                <div style="
                  flex:${is1 ? '1.3' : '1'}; display:flex; flex-direction:column;
                  align-items:center;
                ">
                  ${is1 ? '<div style="font-size:40px; line-height:1; margin-bottom:4px; filter:drop-shadow(0 2px 8px rgba(255,206,0,.6));">👑</div>' : '<div style="height:44px;"></div>'}
                  <div style="margin-bottom:10px;">
                    ${logoIA(it.familia, ls)}
                  </div>
                  <div style="
                    width:100%; height:${h}px; border-radius:16px 16px 0 0;
                    background: ${is1 ? 'linear-gradient(165deg,rgba(255,206,0,.35),rgba(224,161,0,.2))' : 'rgba(0,39,118,.06)'};
                    border: 2px solid ${is1 ? 'rgba(255,206,0,.55)' : 'rgba(0,39,118,.15)'};
                    border-bottom:none;
                    display:flex; flex-direction:column; align-items:center;
                    justify-content:flex-start; padding:14px 10px; gap:4px;
                  ">
                    <span style="font-size:32px; line-height:1;">${medals[i]}</span>
                    <span style="
                      font-size:${is1 ? 21 : 17}px; font-weight:900; color:#002776;
                      line-height:1.2; text-align:center;
                    ">${it.nome}</span>
                    <span style="
                      font-size:${is1 ? 32 : 26}px; font-weight:900;
                      color:${is1 ? '#009C3B' : '#555'};
                    ">${it.pontos}</span>
                    <span style="font-size:13px; color:#888; font-weight:700;">pts</span>
                    <span style="font-size:13px; color:#555; font-weight:700;">${it.exatos} exatos</span>
                  </div>
                </div>
              `;
            }).join("")}
          </div>

          <p style="
            font-size:23px; color:#555; font-weight:600;
            max-width:700px; line-height:1.4;
          ">
            Ranking completo das 12 IAs da Série A em
            <strong style="color:#009C3B;">${SITE}/retrospectiva-grupos</strong>
          </p>
        </div>

        <div class="rodape-mini">
          <div class="pill pill-site">🌐 ${SITE}</div>
          <div class="pill pill-insta">📸 ${INSTA}</div>
        </div>
      </div>
      <div class="swipe">arraste →</div>
    `,
  };

  // ── SLIDE 5 — Bola de Cristal: acertou o vencedor ───────────────────────
  const slide5 = {
    nome: "slide-05.png",
    body: `
      <div class="wrap" style="background:linear-gradient(165deg,#06070f,#0a1230);">
        <div class="brand-mini" style="color:#fff;">
          <span class="ball">⚽</span>
          <span style="color:#fff;">Bolão das IAs · Fase de Grupos</span>
        </div>

        <div style="flex:1; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; gap:32px;">
          <div style="font-size:120px; line-height:1; filter:drop-shadow(0 12px 40px rgba(129,52,175,.5));">🔮</div>

          <div>
            <div style="
              font-size:17px; font-weight:900; letter-spacing:0.18em;
              text-transform:uppercase; color:rgba(255,255,255,.6); margin-bottom:14px;
            ">A Bola de Cristal</div>
            <h2 style="
              font-size:76px; font-weight:900; color:#fff;
              line-height:1.0; letter-spacing:-0.03em;
            ">
              O consenso das IAs<br>
              <span style="
                background:linear-gradient(100deg,#4ADE80,#22d3ee);
                -webkit-background-clip:text; -webkit-text-fill-color:transparent;
                background-clip:text;
              ">acertou o vencedor…</span>
            </h2>
          </div>

          <!-- Big percentage ring -->
          <div style="
            position:relative; width:260px; height:260px;
            border-radius:50%;
            background: conic-gradient(#4ADE80 ${cristalPctVencedor}%, rgba(255,255,255,.08) 0);
            display:flex; align-items:center; justify-content:center;
          ">
            <div style="
              position:absolute; inset:20px; border-radius:50%;
              background: linear-gradient(165deg,#06070f,#0a1230);
              display:flex; flex-direction:column; align-items:center; justify-content:center;
            ">
              <div style="font-size:80px; font-weight:900; color:#4ADE80; line-height:1;">${cristalPctVencedor}%</div>
              <div style="font-size:16px; color:rgba(255,255,255,.6); font-weight:700;">${cristalAcertouVencedor} de ${totalJogos} jogos</div>
            </div>
          </div>

          <p style="
            font-size:28px; color:rgba(255,255,255,.8); font-weight:600;
            max-width:680px; line-height:1.5;
          ">
            A <strong style="color:#4ADE80;">Bola de Cristal</strong> (o placar que mais IAs cravaram em cada jogo)
            acertou o <strong style="color:#fff;">vencedor correto</strong> em ${cristalAcertouVencedor} dos ${totalJogos} jogos.
          </p>

          <div style="
            padding:18px 32px; border-radius:16px;
            border:2px solid rgba(74,222,128,.3);
            background:rgba(74,222,128,.08);
            font-size:26px; font-weight:800; color:rgba(255,255,255,.9);
          ">
            As máquinas sabem quem ganha — na média. 🤖
          </div>
        </div>

        <div class="rodape-mini" style="border-color:rgba(255,255,255,.15);">
          <div class="pill pill-site">🌐 ${SITE}</div>
          <div class="pill pill-insta">📸 ${INSTA}</div>
        </div>
      </div>
      <div class="swipe" style="color:rgba(255,255,255,.7);">arraste →</div>
    `,
  };

  // ── SLIDE 6 — Mas placar exato é outra história ─────────────────────────
  const slide6 = {
    nome: "slide-06.png",
    body: `
      <div class="wrap" style="background:linear-gradient(165deg,#1a0a24,#0a1230);">
        <div class="brand-mini" style="color:#fff;">
          <span class="ball">⚽</span>
          <span style="color:#fff;">Bolão das IAs · Fase de Grupos</span>
        </div>

        <div style="flex:1; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; gap:28px;">
          <div>
            <div style="
              font-size:17px; font-weight:900; letter-spacing:0.18em;
              text-transform:uppercase; color:rgba(255,255,255,.5); margin-bottom:14px;
            ">Mas placar exato é outra história</div>
            <h2 style="
              font-size:76px; font-weight:900; color:#fff;
              line-height:1.0; letter-spacing:-0.03em;
            ">
              <span style="
                background:linear-gradient(100deg,#F472B6,#FB923C);
                -webkit-background-clip:text; -webkit-text-fill-color:transparent;
                background-clip:text;
              ">…só ${cristalPctExatos}% de<br>placares exatos.</span>
            </h2>
          </div>

          <!-- Split: big vs small ring -->
          <div style="display:flex; gap:48px; align-items:center; justify-content:center;">
            <div style="display:flex; flex-direction:column; align-items:center; gap:12px;">
              <div style="
                width:160px; height:160px; border-radius:50%;
                background: conic-gradient(#4ADE80 ${cristalPctVencedor}%, rgba(255,255,255,.08) 0);
                display:flex; align-items:center; justify-content:center; position:relative;
              ">
                <div style="position:absolute; inset:14px; border-radius:50%; background:#1a0a24; display:flex; align-items:center; justify-content:center;">
                  <span style="font-size:46px; font-weight:900; color:#4ADE80;">${cristalPctVencedor}%</span>
                </div>
              </div>
              <div style="font-size:18px; font-weight:700; color:rgba(255,255,255,.7);">Vencedor certo</div>
            </div>

            <div style="font-size:56px; color:rgba(255,255,255,.3);">→</div>

            <div style="display:flex; flex-direction:column; align-items:center; gap:12px;">
              <div style="
                width:220px; height:220px; border-radius:50%;
                background: conic-gradient(#F472B6 ${cristalPctExatos}%, rgba(255,255,255,.08) 0);
                display:flex; align-items:center; justify-content:center; position:relative;
              ">
                <div style="position:absolute; inset:18px; border-radius:50%; background:#1a0a24; display:flex; align-items:center; justify-content:center;">
                  <span style="font-size:60px; font-weight:900; color:#F472B6;">${cristalPctExatos}%</span>
                </div>
              </div>
              <div style="font-size:18px; font-weight:700; color:rgba(255,255,255,.7);">Placar exato</div>
            </div>
          </div>

          <p style="
            font-size:28px; color:rgba(255,255,255,.75); font-weight:600;
            max-width:700px; line-height:1.5;
          ">
            Apenas <strong style="color:#F472B6;">${cristalExatos} jogos</strong> de ${totalJogos}
            tiveram o placar exato cravado pelo consenso.
          </p>

          <div style="
            padding:20px 36px; border-radius:16px;
            background:rgba(244,114,182,.10); border:2px solid rgba(244,114,182,.3);
            font-size:28px; font-weight:800; color:#fff;
          ">
            Prever gols é mais arte do que ciência. 🎲
          </div>
        </div>

        <div class="rodape-mini" style="border-color:rgba(255,255,255,.15);">
          <div class="pill pill-site">🌐 ${SITE}</div>
          <div class="pill pill-insta">📸 ${INSTA}</div>
        </div>
      </div>
      <div class="swipe" style="color:rgba(255,255,255,.7);">arraste →</div>
    `,
  };

  // ── SLIDE 7 — A maior zebra ──────────────────────────────────────────────
  const slide7 = {
    nome: "slide-07.png",
    body: `
      <div class="wrap" style="background:linear-gradient(165deg,#1c1c22,#06070f);">
        <div class="brand-mini" style="color:#fff;">
          <span class="ball">⚽</span>
          <span style="color:#fff;">Bolão das IAs · Fase de Grupos</span>
        </div>

        <div style="flex:1; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; gap:28px;">
          <div style="font-size:104px; line-height:1;">🦓</div>

          <div>
            <div style="
              font-size:17px; font-weight:900; letter-spacing:0.18em;
              text-transform:uppercase; color:rgba(255,255,255,.55); margin-bottom:10px;
            ">A maior zebra da fase de grupos</div>
            <h2 style="
              font-size:78px; font-weight:900; color:#fff;
              line-height:1.0; letter-spacing:-0.03em;
            ">
              Futebol 1,<br>
              <span style="
                background:linear-gradient(100deg,#FBBF24,#F97316);
                -webkit-background-clip:text; -webkit-text-fill-color:transparent;
                background-clip:text;
              ">Algoritmos 0.</span>
            </h2>
          </div>

          <!-- Match result -->
          <div style="
            display:flex; align-items:center; justify-content:center;
            gap:40px; padding:32px 48px; border-radius:28px;
            background:rgba(255,255,255,.05); border:2px solid rgba(255,255,255,.12);
            width:100%; max-width:800px;
          ">
            <div style="display:flex; flex-direction:column; align-items:center; gap:14px;">
              ${flag(zd.isoA, 80)}
              <span style="font-size:24px; font-weight:800; color:#fff;">${zd.timeA}</span>
            </div>
            <div style="
              font-size:100px; font-weight:900; color:#fff; line-height:1;
              display:flex; align-items:center; gap:8px;
            ">
              <span>${zd.golsA}</span>
              <span style="color:#FBBF24; font-size:60px;">×</span>
              <span>${zd.golsB}</span>
            </div>
            <div style="display:flex; flex-direction:column; align-items:center; gap:14px;">
              ${flag(zd.isoB, 80)}
              <span style="font-size:24px; font-weight:800; color:#fff;">${zd.timeB}</span>
            </div>
          </div>

          <div style="
            padding:20px 32px; border-radius:16px;
            background:rgba(251,191,36,.10); border:2px solid rgba(251,191,36,.3);
            font-size:26px; font-weight:700; color:rgba(255,255,255,.9);
            max-width:760px; line-height:1.5;
          ">
            <strong style="color:#FBBF24;">${zd.votos} IAs</strong> estavam tão certas
            que cravaram <strong style="color:#fff;">${zd.cristalA}×${zd.cristalB}</strong>.
            Jogo com mais consenso da fase — e o resultado virou tudo de cabeça pra baixo.
          </div>

          <div style="
            font-size:20px; color:rgba(255,255,255,.5); font-weight:600;
          ">
            Jogo #${zd.numero} · Grupo H · Fase de Grupos
          </div>
        </div>

        <div class="rodape-mini" style="border-color:rgba(255,255,255,.15);">
          <div class="pill pill-site">🌐 ${SITE}</div>
          <div class="pill pill-insta">📸 ${INSTA}</div>
        </div>
      </div>
      <div class="swipe" style="color:rgba(255,255,255,.7);">arraste →</div>
    `,
  };

  // ── SLIDE 8 — CTA ─────────────────────────────────────────────────────────
  const slide8 = {
    nome: "slide-08.png",
    body: `
      <div class="wrap" style="text-align:center;">
        <div class="brand-mini" style="justify-content:center;">
          <span class="ball">⚽</span>
          <span>Bolão das IAs</span>
        </div>

        <div style="flex:1; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:32px;">
          <div style="font-size:110px; line-height:1; filter:drop-shadow(0 10px 32px rgba(221,42,123,.35));">🔮</div>

          <div>
            <h2 style="
              font-size:82px; font-weight:900;
              color:#002776; line-height:1.0;
              letter-spacing:-0.03em; margin-bottom:12px;
            ">Veja a retrospectiva<br>completa</h2>
            <p style="font-size:28px; color:#444; font-weight:600;">
              Rankings, placares, zebras, goleadas e muito mais.
            </p>
          </div>

          <div style="
            padding:24px 48px; border-radius:20px;
            background: linear-gradient(135deg,#002776,#004AB5);
            box-shadow:0 10px 36px rgba(0,39,118,.25);
          ">
            <div style="font-size:18px; font-weight:800; color:rgba(255,255,255,.7); letter-spacing:.08em; text-transform:uppercase; margin-bottom:8px;">Acesse agora</div>
            <div style="font-size:38px; font-weight:900; color:#FFCE00; letter-spacing:-.01em;">
              ${SITE}/retrospectiva-grupos
            </div>
          </div>

          <div style="display:flex; flex-direction:column; gap:16px; width:100%; max-width:700px;">
            <div style="
              display:flex; align-items:center; gap:20px; padding:20px 28px;
              border-radius:18px; background:#F8F9FC; border:2px solid rgba(0,156,59,.2);
            ">
              <div style="font-size:48px;">📊</div>
              <div style="text-align:left;">
                <div style="font-size:22px; font-weight:900; color:#002776;">Ranking completo das ${totalIas} IAs</div>
                <div style="font-size:17px; color:#555; font-weight:600;">Quem ficou em cada posição?</div>
              </div>
            </div>
            <div style="
              display:flex; align-items:center; gap:20px; padding:20px 28px;
              border-radius:18px; background:#F8F9FC; border:2px solid rgba(221,42,123,.2);
            ">
              <div style="font-size:48px;">🤖</div>
              <div style="text-align:left;">
                <div style="font-size:22px; font-weight:900; color:#002776;">Entre no bolão do mata-mata</div>
                <div style="font-size:17px; color:#555; font-weight:600;">Dispute contra as IAs a partir das oitavas</div>
              </div>
            </div>
          </div>
        </div>

        <div class="rodape-mini" style="border-top:2px solid #DDD;">
          <div class="pill pill-site" style="font-size:22px; padding:14px 28px;">🌐 ${SITE}</div>
          <div class="pill pill-insta" style="font-size:22px; padding:14px 28px;">📸 ${INSTA}</div>
        </div>
      </div>
    `,
  };

  return [slide1, slide2, slide3, slide4, slide5, slide6, slide7, slide8];
}

// ── main ─────────────────────────────────────────────────────────────────

async function main() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

  console.log("Computando dados da retrospectiva...");
  const data = computeData();
  console.log(
    `Dados: ${data.totalJogos} jogos | ${data.totalIas} IAs | ${data.totalPalpites} palpites | ${data.totalGols} gols`
  );
  console.log(`Campeã geral: ${data.campeaGeral.nome} (${data.campeaGeral.pontos} pts)`);
  console.log(
    `Cristal: ${data.cristalPctVencedor}% vencedor | ${data.cristalPctExatos}% exatos`
  );
  console.log(
    `Zebra destaque: #${data.zebraDestaque?.numero} ${data.zebraDestaque?.timeA} ${data.zebraDestaque?.golsA}×${data.zebraDestaque?.golsB} ${data.zebraDestaque?.timeB} (${data.zebraDestaque?.votos} votos)`
  );
  console.log("Pódio Série A:");
  data.podioSerieA.forEach((p) =>
    console.log(`  ${p.posicao}º ${p.nome} — ${p.pontos} pts, ${p.exatos} exatos`)
  );

  const SLIDES = buildSlides(data);

  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1080, height: 1350 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();

  for (const slide of SLIDES) {
    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><style>${BASE_CSS}</style></head><body>${slide.body}</body></html>`;
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.waitForTimeout(300);
    const file = path.join(OUT, slide.nome);
    await page.screenshot({ path: file });
    const stat = fs.statSync(file);
    console.log(`✓ ${slide.nome} (${Math.round(stat.size / 1024)} KB)`);
  }

  await browser.close();
  console.log(`\n${SLIDES.length} slides gravados em:\n  ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
