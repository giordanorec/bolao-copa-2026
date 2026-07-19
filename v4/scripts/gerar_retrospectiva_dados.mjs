#!/usr/bin/env node
/**
 * Gera v4/public/retrospectiva.json — todos os números pré-computados que a
 * página /retrospectiva precisa. Roda uma vez (a Copa já acabou), lê os JSON
 * estáticos em public/ + (opcional) Supabase pros humanos. Sem chamadas em
 * runtime na página — ela só lê o JSON gerado aqui.
 *
 * Uso: node scripts/gerar_retrospectiva_dados.mjs
 */
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");

// ── Config Série A (espelha v4/lib/serie-a.ts — mantido em sync manualmente) ─
const SLUG_FABLE = "claude-fable-5";
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
  SLUG_FABLE,
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
  [SLUG_FABLE]: "Claude Code + Fable",
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
  "manus-web": "kimi-k2",
};

async function lerJson(nome) {
  const p = path.join(PUBLIC, nome);
  return JSON.parse(await fs.readFile(p, "utf-8"));
}

const sign = (x) => (x > 0 ? 1 : x < 0 ? -1 : 0);

/** Empates ocupam a MESMA colocação (1º, 1º, 3º). */
function colocacoes(pts) {
  const sorted = [...pts].sort((a, b) => b - a);
  return pts.map((p) => sorted.indexOf(p) + 1);
}

// ── Scoring (espelha v4/lib/scoring.ts) ──────────────────────────────────
function isMataMata(fase) {
  const f = fase.toLowerCase();
  return (
    f.includes("16-avos") ||
    f.includes("oitavas") ||
    f.includes("quartas") ||
    f.includes("semi") ||
    f.includes("3") ||
    f === "final"
  );
}
function pontosJogo(palpite, jogo) {
  if (!palpite || jogo.gols_a == null || jogo.gols_b == null) return 0;
  const { gols_a: pa, gols_b: pb } = palpite;
  const { gols_a: ra, gols_b: rb } = jogo;
  let base = 0;
  if (pa === ra && pb === rb) base = 10;
  else if (sign(pa - pb) === sign(ra - rb) && pa - pb === ra - rb && pa !== pb) base = 7;
  else if (sign(pa - pb) === sign(ra - rb) && pa !== pb) base = 5;
  else if (pa === pb && ra === rb) base = 5;
  else base = 0;
  return isMataMata(jogo.fase) ? base * 2 : base;
}

// ── Humanos via Supabase (opcional — cai pra fallback fixo se faltar env) ──
async function carregarHumanos(jogos) {
  try {
    const envRaw = await fs.readFile(path.join(ROOT, ".env.local"), "utf-8");
    const urlM = envRaw.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
    const keyM = envRaw.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);
    if (!urlM || !keyM) throw new Error("env ausente");
    const url = urlM[1].trim();
    const key = keyM[1].trim();
    const { createClient } = await import("@supabase/supabase-js");
    const admin = createClient(url, key, { auth: { persistSession: false } });

    const { data: perfis, error: e1 } = await admin
      .from("profiles")
      .select("id, display_name, opt_in_geral, avatar_url");
    if (e1 || !perfis || perfis.length === 0) throw new Error(e1?.message ?? "sem perfis");

    const userIds = perfis.map((h) => h.id);
    const PAGINA = 1000;
    const pp = [];
    for (let inicio = 0; ; inicio += PAGINA) {
      const { data: lote, error: e2 } = await admin
        .from("palpite")
        .select("user_id, jogo_numero, gols_a, gols_b")
        .in("user_id", userIds)
        .order("user_id", { ascending: true })
        .order("jogo_numero", { ascending: true })
        .range(inicio, inicio + PAGINA - 1);
      if (e2) throw new Error(e2.message);
      const arr = lote ?? [];
      pp.push(...arr);
      if (arr.length < PAGINA) break;
    }

    const porUser = new Map();
    for (const p of pp) {
      if (!porUser.has(p.user_id)) porUser.set(p.user_id, {});
      porUser.get(p.user_id)[p.jogo_numero] = p;
    }

    const humanos = perfis.map((h) => {
      const palps = porUser.get(h.id) ?? {};
      let pontos = 0;
      let exatos = 0;
      let jogados = 0;
      for (const jogo of jogos) {
        const p = palps[jogo.numero];
        if (!p) continue;
        jogados += 1;
        pontos += pontosJogo(p, jogo);
        if (jogo.gols_a != null && p.gols_a === jogo.gols_a && p.gols_b === jogo.gols_b) exatos += 1;
      }
      return {
        nome: h.display_name || "Anônimo",
        optIn: !!h.opt_in_geral,
        pontos,
        exatos,
        jogados,
      };
    });
    return humanos.filter((h) => h.jogados > 0);
  } catch (err) {
    console.warn("[retrospectiva] Supabase indisponível, usando fallback fixo pro capítulo humanos:", err.message);
    return null;
  }
}

async function main() {
  const [rankRaw, jogosRaw, cristal, palpitesPorJogo, iso] = await Promise.all([
    lerJson("ranking-ias.json"),
    lerJson("jogos.json"),
    lerJson("bola_de_cristal.json"),
    lerJson("palpites_por_jogo.json"),
    lerJson("paises_iso.json"),
  ]);

  const isoDe = (time) => iso[time];
  const jogos = Array.isArray(jogosRaw) ? jogosRaw : jogosRaw.jogos;
  const finalizados = jogos.filter((j) => j.gols_a != null && j.gols_b != null);
  const grupos = finalizados.filter((j) => j.numero <= 72);

  // IAs "de verdade" — exclui o meta-slug bola-de-cristal (é o consenso, não um modelo).
  const ias = rankRaw.ias.filter((x) => x.slug !== "bola-de-cristal");
  const totalIas = ias.length;
  const totalPalpites = ias.reduce((s, x) => s + (x.geral?.jogos_palpitados ?? 0), 0);
  const totalGols = finalizados.reduce((s, j) => s + j.gols_a + j.gols_b, 0);
  const totalGolsGrupos = grupos.reduce((s, j) => s + j.gols_a + j.gols_b, 0);

  // ── Datas do torneio ──
  const dataInicio = new Date("2026-06-11");
  const dataFim = new Date("2026-07-19");
  const dias = Math.round((dataFim - dataInicio) / 86400000);

  // ── Pódio geral (empates = mesma colocação) ──
  const comGeral = ias.filter((x) => x.geral && x.geral.jogos_palpitados > 0);
  const ordGeral = [...comGeral].sort((a, b) => b.geral.pontos - a.geral.pontos);
  const posicoesGeral = colocacoes(ordGeral.map((x) => x.geral.pontos));
  const campeoesGeral = ordGeral
    .filter((_, i) => posicoesGeral[i] === 1)
    .map((x) => ({
      slug: x.slug,
      nome: x.nome_display,
      pontos: x.geral.pontos,
      exatos: x.geral.placares_exatos,
    }));
  // Pódio geral completo (1º, 1º, 3º — empate ocupa a mesma colocação),
  // pra render de pódio com 3 degraus reais mesmo com 2 pessoas no topo.
  const podioGeral = ordGeral.slice(0, 4).map((x, i) => ({
    slug: x.slug,
    nome: x.nome_display,
    pontos: x.geral.pontos,
    exatos: x.geral.placares_exatos,
    posicao: posicoesGeral[i],
  }));
  const podioGeralTop3 = podioGeral.filter((x) => x.posicao <= 3);

  // ── Pódio Série A — MESMA regra da vitrine oficial (SerieA.tsx, melhorFonte):
  // por fase, vale a fonte com MAIS jogos apurados (empate → vitrine -web).
  // Grupos vêm do irmão API (coleta web só existiu no mata-mata); mata-mata
  // vem da coleta web quando completa. Campeão oficial: ChatGPT 5 Thinking 616.
  const porSlug = new Map(rankRaw.ias.map((x) => [x.slug, x]));
  const ZERO_FASE = { pontos: 0, placares_exatos: 0, jogos_palpitados: 0 };
  const melhorFonte = (oficial, irmao) => {
    const o = oficial ?? ZERO_FASE;
    const i = irmao ?? ZERO_FASE;
    return i.jogos_palpitados > o.jogos_palpitados ? i : o;
  };
  const candSerieA = [];
  for (const slug of SLUGS_SERIE_A) {
    const sib = FALLBACK_NAO_WEB[slug];
    const oficial = porSlug.get(slug);
    const irmao = sib ? porSlug.get(sib) : undefined;
    if (!oficial && !irmao) continue;
    const g = melhorFonte(oficial?.grupos, irmao?.grupos);
    const m = melhorFonte(oficial?.matamata, irmao?.matamata);
    candSerieA.push({
      slug,
      nome: APELIDOS_SERIE_A[slug] ?? (oficial ?? irmao).nome_display,
      pontos: g.pontos + m.pontos,
      exatos: g.placares_exatos + m.placares_exatos,
    });
  }
  candSerieA.sort((a, b) => b.pontos - a.pontos);
  const posicoesSerieA = colocacoes(candSerieA.map((c) => c.pontos));
  const podioSerieA = candSerieA.slice(0, 3).map((c, i) => ({ ...c, posicao: posicoesSerieA[i] }));

  // ── Líderes de cravadas (placares exatos, geral) ──
  const lideresExatos = [...comGeral]
    .sort((a, b) => b.geral.placares_exatos - a.geral.placares_exatos || b.geral.pontos - a.geral.pontos)
    .slice(0, 6)
    .map((x) => ({
      slug: x.slug,
      nome: x.nome_display,
      exatos: x.geral.placares_exatos,
      pontos: x.geral.pontos,
    }));

  // ── Precisão do consenso (Bola de Cristal) — torneio inteiro ──
  let acertouVenc = 0;
  let exatosCristal = 0;
  const upsets = [];
  let jogoMaisPrevisivelGrupos = null; // maior consenso ENTRE OS QUE O CONSENSO ACERTOU
  let zebraDestaqueGrupos = null; // maior consenso ENTRE OS QUE O CONSENSO ERROU

  for (const j of finalizados) {
    const c = cristal[String(j.numero)];
    if (!c) continue;
    const real = sign(j.gols_a - j.gols_b);
    const pred = sign(c.gols_a - c.gols_b);
    const acertou = pred === real;
    if (c.gols_a === j.gols_a && c.gols_b === j.gols_b) exatosCristal++;
    if (acertou) acertouVenc++;
    const item = {
      numero: j.numero,
      fase: j.fase,
      timeA: j.time_a,
      timeB: j.time_b,
      isoA: isoDe(j.time_a),
      isoB: isoDe(j.time_b),
      golsA: j.gols_a,
      golsB: j.gols_b,
      cristalA: c.gols_a,
      cristalB: c.gols_b,
      votos: c.votos,
    };
    if (!acertou) upsets.push(item);
    if (j.numero <= 72) {
      if (acertou && (!jogoMaisPrevisivelGrupos || c.votos > jogoMaisPrevisivelGrupos.votos)) {
        jogoMaisPrevisivelGrupos = item;
      }
      if (!acertou && (!zebraDestaqueGrupos || c.votos > zebraDestaqueGrupos.votos)) {
        zebraDestaqueGrupos = item;
      }
    }
  }
  // Torneio inteiro, excluindo J101 (semifinal Espanha) e J104 (final) que já
  // ganham cenas dedicadas — evita repetir a mesma zebra duas vezes na grid.
  const upsetsOrd = [...upsets]
    .filter((u) => u.numero !== 101 && u.numero !== 104)
    .sort((a, b) => b.votos - a.votos);

  // ── Cravada mais impressionante: jogo de muitos gols com >=1 IA exata ──
  let cravadaImpressionante = null;
  for (const j of finalizados) {
    const pj = palpitesPorJogo[String(j.numero)]?.palpites ?? {};
    const totalGolsJogo = j.gols_a + j.gols_b;
    const exatosJogo = Object.entries(pj).filter(
      ([, v]) => v.gols_a === j.gols_a && v.gols_b === j.gols_b,
    );
    if (exatosJogo.length === 0) continue;
    if (!cravadaImpressionante || totalGolsJogo > cravadaImpressionante.totalGols) {
      cravadaImpressionante = {
        numero: j.numero,
        fase: j.fase,
        timeA: j.time_a,
        timeB: j.time_b,
        isoA: isoDe(j.time_a),
        isoB: isoDe(j.time_b),
        golsA: j.gols_a,
        golsB: j.gols_b,
        totalGols: totalGolsJogo,
        quemCravou: exatosJogo.length,
      };
    }
  }

  // ── Brasil eliminado (J91, Oitavas, Noruega) ──
  const jBrasil = finalizados.find((j) => j.numero === 91);
  const predicoes = await lerJson("predicoes_campeao.json").catch(() => null);
  const consensoCampeao = predicoes?.cristal?.campeao ?? "Brasil";

  // ── Semifinal: Espanha 2x0 França (J101) — 0 IAs previram vitória espanhola ──
  const j101 = finalizados.find((j) => j.numero === 101);
  const c101 = cristal["101"];
  const pj101 = palpitesPorJogo["101"]?.palpites ?? {};
  const previramVitoriaEspanha = Object.values(pj101).filter((v) => v.gols_b > v.gols_a).length;

  // ── 3º lugar: Inglaterra 6x4 França (J103) ──
  const j103 = finalizados.find((j) => j.numero === 103);
  const c103 = cristal["103"];
  const pj103 = palpitesPorJogo["103"]?.palpites ?? {};
  const exatos103 = Object.values(pj103).filter((v) => v.gols_a === j103.gols_a && v.gols_b === j103.gols_b).length;
  const previramVitoriaInglaterra = Object.values(pj103).filter((v) => v.gols_b > v.gols_a).length;

  // ── Final: Espanha 1x0 Argentina (J104) ──
  const j104 = finalizados.find((j) => j.numero === 104);
  const c104 = cristal["104"];
  const pj104 = palpitesPorJogo["104"]?.palpites ?? {};
  const DESTAQUES_FINAL = ["claude-opus-4-8-web", "grok-4-heavy-web", "le-chat-mistral-web", "chatgpt-5-thinking-web"];
  const cravaramFinal = Object.entries(pj104)
    .filter(([, v]) => v.gols_a === j104.gols_a && v.gols_b === j104.gols_b)
    .map(([slug]) => slug);
  const destaquesFinal = DESTAQUES_FINAL.filter((s) => cravaramFinal.includes(s)).map((slug) => ({
    slug,
    nome: APELIDOS_SERIE_A[slug] ?? slug,
  }));

  // ── Humanos ──
  const humanosRaw = await carregarHumanos(finalizados);
  let gabriel;
  let totalHumanos;
  let humanosNoTop = [];
  if (humanosRaw && humanosRaw.length > 0) {
    const g = humanosRaw.find((h) => h.nome?.toLowerCase().includes("gabriel"));
    totalHumanos = humanosRaw.length;
    const todosPontos = [...comGeral.map((x) => x.geral.pontos), ...humanosRaw.map((h) => h.pontos)];
    if (g) {
      const rankHumano = colocacoes(todosPontos)[comGeral.length + humanosRaw.indexOf(g)];
      const iasAtras = comGeral.filter((x) => x.geral.pontos < g.pontos).length;
      gabriel = { nome: "Gabriel", pontos: g.pontos, exatos: g.exatos, rank: rankHumano, iasAtras, totalIas };
    }
    humanosNoTop = [...humanosRaw].sort((a, b) => b.pontos - a.pontos).slice(0, 5).map((h) => ({
      nome: h.optIn ? h.nome : "Anônimo",
      pontos: h.pontos,
      exatos: h.exatos,
    }));
  }
  // Fallback: fatos verificados manualmente (fonte: dono do projeto), caso o
  // Supabase não esteja acessível no momento de gerar o JSON.
  if (!gabriel) {
    gabriel = { nome: "Gabriel", pontos: 629, exatos: 19, rank: 4, iasAtras: 121, totalIas };
  }
  if (!totalHumanos) totalHumanos = null;

  const maxTeorico = 72 * 10 + 32 * 20; // 1360
  const pctMaxCampeoes = Math.round((campeoesGeral[0].pontos / maxTeorico) * 1000) / 10;

  const retro = {
    geradoEm: new Date().toISOString(),
    overview: {
      dias,
      totalJogos: finalizados.length,
      totalIas,
      totalPalpites,
      totalGols,
      mediaGolsJogo: (totalGols / finalizados.length).toFixed(2),
      maxTeorico,
    },
    grupos: {
      totalJogos: grupos.length,
      totalGols: totalGolsGrupos,
      mediaGolsJogo: (totalGolsGrupos / grupos.length).toFixed(2),
      jogoMaisPrevisivel: jogoMaisPrevisivelGrupos,
      zebraDestaque: zebraDestaqueGrupos,
    },
    zebras: {
      lista: upsetsOrd.slice(0, 8),
      brasil: jBrasil
        ? {
            numero: 91,
            fase: "Oitavas",
            timeA: jBrasil.time_a,
            timeB: jBrasil.time_b,
            isoA: isoDe(jBrasil.time_a),
            isoB: isoDe(jBrasil.time_b),
            golsA: jBrasil.gols_a,
            golsB: jBrasil.gols_b,
            consensoCampeao,
          }
        : null,
      semifinalEspanha: j101
        ? {
            numero: 101,
            fase: "Semifinal",
            timeA: j101.time_a,
            timeB: j101.time_b,
            isoA: isoDe(j101.time_a),
            isoB: isoDe(j101.time_b),
            golsA: j101.gols_a,
            golsB: j101.gols_b,
            cristalA: c101?.gols_a,
            cristalB: c101?.gols_b,
            votos: c101?.votos,
            totalIas: Object.keys(pj101).length,
            previramVitoriaB: previramVitoriaEspanha,
          }
        : null,
      terceiroLugar: j103
        ? {
            numero: 103,
            fase: "3º lugar",
            timeA: j103.time_a,
            timeB: j103.time_b,
            isoA: isoDe(j103.time_a),
            isoB: isoDe(j103.time_b),
            golsA: j103.gols_a,
            golsB: j103.gols_b,
            totalGols: j103.gols_a + j103.gols_b,
            totalIas: Object.keys(pj103).length,
            exatos: exatos103,
            previramVitoriaB: previramVitoriaInglaterra,
          }
        : null,
    },
    cravadas: {
      lideres: lideresExatos,
      maisImpressionante: cravadaImpressionante,
    },
    humanos: {
      gabriel,
      totalHumanos,
      top: humanosNoTop,
    },
    campeoes: {
      geral: campeoesGeral,
      geralPodio: podioGeralTop3,
      serieA: podioSerieA,
      humano: gabriel,
    },
    final: j104
      ? {
          numero: 104,
          fase: "Final",
          timeA: j104.time_a,
          timeB: j104.time_b,
          isoA: isoDe(j104.time_a),
          isoB: isoDe(j104.time_b),
          golsA: j104.gols_a,
          golsB: j104.gols_b,
          cristalA: c104?.gols_a,
          cristalB: c104?.gols_b,
          votos: c104?.votos,
          totalIas: Object.keys(pj104).length,
          cravaramTotal: cravaramFinal.length,
          destaques: destaquesFinal,
        }
      : null,
    consenso: {
      acertouVencedor: acertouVenc,
      totalComCristal: finalizados.filter((j) => cristal[String(j.numero)]).length,
      pctVencedor: Math.round((acertouVenc / finalizados.length) * 100),
      exatos: exatosCristal,
      pctExatos: Math.round((exatosCristal / finalizados.length) * 100),
    },
    pctMaxCampeoes,
  };

  const outPath = path.join(PUBLIC, "retrospectiva.json");
  await fs.writeFile(outPath, JSON.stringify(retro, null, 2), "utf-8");
  console.log(`[retrospectiva] escrito em ${outPath}`);
  console.log(
    `[retrospectiva] resumo: ${retro.overview.totalIas} IAs, ${retro.overview.totalPalpites} palpites, ` +
      `campeões geral: ${retro.campeoes.geral.map((c) => c.nome).join(" & ")}, ` +
      `Série A: ${retro.campeoes.serieA[0]?.nome}, humano: ${retro.humanos.gabriel.nome} (${retro.humanos.gabriel.pontos}pts)`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
