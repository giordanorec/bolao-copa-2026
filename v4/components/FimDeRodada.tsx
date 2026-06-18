import Link from "next/link";
import IconeIA from "@/components/IconeIA";
import Bandeira from "@/components/Bandeira";
import { carregarJogos } from "@/lib/jogos";
import { carregarPalpitesIAs, carregarDictIAs } from "@/lib/palpites-ias";
import { carregarMapaPaises } from "@/lib/paises";
import { ehSerieA, nomeSerieA } from "@/lib/serie-a";
import type { Locale } from "@/lib/i18n";

// 12 jogos por rodada da fase de grupos (1 por grupo).
const JOGOS_POR_RODADA = 12;
const LIMIAR_ZEBRA = 0.7; // mesmo do DiasDeZebra

type JogoFinalizado = {
  numero: number;
  time_a: string;
  time_b: string;
  isoA?: string;
  isoB?: string;
  gols_a: number;
  gols_b: number;
};

type Insight = {
  rodada: number;
  jogos: JogoFinalizado[];
  // resumo
  totalPalpitesIAs: number;
  cravadas: number;
  zebras: number;
  cristalAcertos: number;
  cristalTotal: number;
  // tops
  topIAs: { slug: string; nome: string; pts: number; serieA: boolean }[];
  jogoSurpresa: JogoFinalizado & { pctErrou: number };
  jogoPrevisivel: JogoFinalizado & { pctErrou: number };
};

function pontosJogo(
  pa: number,
  pb: number,
  ra: number,
  rb: number,
): number {
  if (pa === ra && pb === rb) return 10;
  if (pa === pb && ra === rb) return 5;
  if (Math.sign(pa - pb) === Math.sign(ra - rb) && pa !== pb) {
    return pa - pb === ra - rb ? 7 : 5;
  }
  return 0;
}

async function calcular(): Promise<Insight | null> {
  const [jogos, palpitesIAs, iasDict, mapaPaises] = await Promise.all([
    carregarJogos(),
    carregarPalpitesIAs(),
    carregarDictIAs(),
    carregarMapaPaises(),
  ]);

  const encerrados = jogos.filter(
    (j) => j.gols_a != null && j.gols_b != null,
  );
  if (encerrados.length < JOGOS_POR_RODADA) return null;

  // Qual a última rodada COMPLETA?
  // Rodada R completa = jogos (R-1)*12+1 .. R*12 todos encerrados.
  let rodadaCompleta = 0;
  for (let R = 1; R * JOGOS_POR_RODADA <= 104; R++) {
    const lo = (R - 1) * JOGOS_POR_RODADA + 1;
    const hi = R * JOGOS_POR_RODADA;
    const completos = encerrados.filter(
      (j) => j.numero >= lo && j.numero <= hi,
    );
    if (completos.length === JOGOS_POR_RODADA) rodadaCompleta = R;
    else break;
  }
  if (rodadaCompleta === 0) return null;

  const lo = (rodadaCompleta - 1) * JOGOS_POR_RODADA + 1;
  const hi = rodadaCompleta * JOGOS_POR_RODADA;
  const daRodada = encerrados.filter(
    (j) => j.numero >= lo && j.numero <= hi,
  );

  let totalPalpitesIAs = 0;
  let cravadasIAs = 0;
  let zebras = 0;
  let cristalAcertos = 0;
  let cristalTotal = 0;
  const ptsPorSlug: Record<string, number> = {};

  const jogoStats: (JogoFinalizado & { pctErrou: number })[] = [];

  for (const j of daRodada) {
    const dados = palpitesIAs[String(j.numero)];
    const ra = j.gols_a as number;
    const rb = j.gols_b as number;
    if (!dados) {
      jogoStats.push({
        numero: j.numero,
        time_a: j.time_a,
        time_b: j.time_b,
        isoA: mapaPaises[j.time_a],
        isoB: mapaPaises[j.time_b],
        gols_a: ra,
        gols_b: rb,
        pctErrou: 0,
      });
      continue;
    }
    // cristal
    if (dados.bola_de_cristal) {
      cristalTotal++;
      if (
        dados.bola_de_cristal.gols_a === ra &&
        dados.bola_de_cristal.gols_b === rb
      )
        cristalAcertos++;
    }
    // por IA
    let err = 0;
    let n = 0;
    for (const [slug, p] of Object.entries(dados.palpites)) {
      n++;
      totalPalpitesIAs++;
      const pts = pontosJogo(p.gols_a, p.gols_b, ra, rb);
      ptsPorSlug[slug] = (ptsPorSlug[slug] ?? 0) + pts;
      if (pts === 10) cravadasIAs++;
      if (pts === 0) err++;
    }
    const pctErrou = n > 0 ? err / n : 0;
    if (pctErrou >= LIMIAR_ZEBRA) zebras++;
    jogoStats.push({
      numero: j.numero,
      time_a: j.time_a,
      time_b: j.time_b,
      isoA: mapaPaises[j.time_a],
      isoB: mapaPaises[j.time_b],
      gols_a: ra,
      gols_b: rb,
      pctErrou,
    });
  }

  // Top 3 IAs na rodada
  const topIAs = Object.entries(ptsPorSlug)
    .map(([slug, pts]) => ({
      slug,
      nome: nomeSerieA(slug) ?? iasDict[slug] ?? slug,
      pts,
      serieA: ehSerieA(slug),
    }))
    .sort((a, b) => b.pts - a.pts || a.slug.localeCompare(b.slug))
    .slice(0, 3);

  // Mais surpresa = maior pctErrou; mais previsível = menor
  const sorted = [...jogoStats].sort((a, b) => b.pctErrou - a.pctErrou);
  const jogoSurpresa = sorted[0];
  const jogoPrevisivel = sorted[sorted.length - 1];

  return {
    rodada: rodadaCompleta,
    jogos: daRodada.map((j) => ({
      numero: j.numero,
      time_a: j.time_a,
      time_b: j.time_b,
      isoA: mapaPaises[j.time_a],
      isoB: mapaPaises[j.time_b],
      gols_a: j.gols_a as number,
      gols_b: j.gols_b as number,
    })),
    totalPalpitesIAs,
    cravadas: cravadasIAs,
    zebras,
    cristalAcertos,
    cristalTotal,
    topIAs,
    jogoSurpresa,
    jogoPrevisivel,
  };
}

const TX: Record<
  Locale,
  {
    badge: (r: number) => string;
    titulo: (r: number) => string;
    cravadas: (n: number, total: number) => string;
    zebras: (n: number) => string;
    cristal: (acertos: number, total: number) => string;
    topIAs: string;
    surpresa: string;
    previsivel: string;
    cta: string;
  }
> = {
  pt: {
    badge: (r) => `✅ FIM DA RODADA ${r}`,
    titulo: (r) =>
      `Rodada ${r} da fase de grupos encerrada — 12 jogos no caderno.`,
    cravadas: (n, total) =>
      `${n} placares cravados pelas IAs nessa rodada (${Math.round((n / total) * 100)}% dos palpites).`,
    zebras: (n) =>
      n === 0
        ? "Sem zebras na rodada — o pelotão das IAs leu bem os jogos."
        : `${n} ${n === 1 ? "zebra" : "zebras"} na rodada (≥70% das IAs erraram tudo).`,
    cristal: (a, t) =>
      `Bola de Cristal: ${a}/${t} cravadas (${t > 0 ? Math.round((a / t) * 100) : 0}%).`,
    topIAs: "Top 3 na rodada",
    surpresa: "Jogo mais surpreendente",
    previsivel: "Mais previsível",
    cta: "Ver todos os jogos →",
  },
  en: {
    badge: (r) => `✅ ROUND ${r} ENDED`,
    titulo: (r) => `Group stage round ${r} is done — 12 matches in the books.`,
    cravadas: (n, total) =>
      `${n} exact scores nailed by AIs this round (${Math.round((n / total) * 100)}% of picks).`,
    zebras: (n) =>
      n === 0
        ? "No upsets this round — the AI pack read the games well."
        : `${n} ${n === 1 ? "upset" : "upsets"} this round (≥70% of AIs got it all wrong).`,
    cristal: (a, t) =>
      `Crystal Ball: ${a}/${t} exact scores (${t > 0 ? Math.round((a / t) * 100) : 0}%).`,
    topIAs: "Top 3 of the round",
    surpresa: "Biggest upset",
    previsivel: "Most predictable",
    cta: "See all matches →",
  },
  es: {
    badge: (r) => `✅ FIN DE LA JORNADA ${r}`,
    titulo: (r) => `Jornada ${r} de la fase de grupos terminada — 12 partidos.`,
    cravadas: (n, total) =>
      `${n} marcadores exactos clavados por IAs (${Math.round((n / total) * 100)}% de los pronósticos).`,
    zebras: (n) =>
      n === 0
        ? "Sin zebras en la jornada — las IAs leyeron bien los partidos."
        : `${n} ${n === 1 ? "zebra" : "zebras"} (≥70% de las IAs falló todo).`,
    cristal: (a, t) =>
      `Bola de Cristal: ${a}/${t} aciertos exactos (${t > 0 ? Math.round((a / t) * 100) : 0}%).`,
    topIAs: "Top 3 de la jornada",
    surpresa: "Mayor sorpresa",
    previsivel: "Más previsible",
    cta: "Ver todos los partidos →",
  },
  fr: {
    badge: (r) => `✅ FIN DE LA JOURNÉE ${r}`,
    titulo: (r) => `Journée ${r} de la phase de groupes terminée — 12 matches.`,
    cravadas: (n, total) =>
      `${n} scores exacts visés justes par les IA (${Math.round((n / total) * 100)}% des pronostics).`,
    zebras: (n) =>
      n === 0
        ? "Aucune surprise — les IA ont bien lu les matches."
        : `${n} ${n === 1 ? "surprise" : "surprises"} (≥70% des IA tout faux).`,
    cristal: (a, t) =>
      `Boule de Cristal : ${a}/${t} scores exacts (${t > 0 ? Math.round((a / t) * 100) : 0}%).`,
    topIAs: "Top 3 de la journée",
    surpresa: "Plus grosse surprise",
    previsivel: "Plus prévisible",
    cta: "Voir tous les matches →",
  },
};

export default async function FimDeRodada({
  locale = "pt",
}: {
  locale?: Locale;
}) {
  const r = await calcular();
  if (!r) return null;
  const tx = TX[locale];

  return (
    <section className="section fim-rodada">
      <div className="container">
        <div className="fr-card">
          <div className="fr-badge">{tx.badge(r.rodada)}</div>
          <h2 className="fr-titulo">{tx.titulo(r.rodada)}</h2>

          <div className="fr-grid">
            <div className="fr-stat">
              <div className="fr-num">{r.cravadas}</div>
              <div className="fr-lbl">{tx.cravadas(r.cravadas, r.totalPalpitesIAs)}</div>
            </div>
            <div className="fr-stat">
              <div className="fr-num">{r.zebras}</div>
              <div className="fr-lbl">{tx.zebras(r.zebras)}</div>
            </div>
            <div className="fr-stat">
              <div className="fr-num">
                {r.cristalAcertos}<span className="fr-num-sub">/{r.cristalTotal}</span>
              </div>
              <div className="fr-lbl">{tx.cristal(r.cristalAcertos, r.cristalTotal)}</div>
            </div>
          </div>

          {r.topIAs.length > 0 && (
            <>
              <div className="fr-h">{tx.topIAs}</div>
              <div className="fr-tops">
                {r.topIAs.map((ia, idx) => (
                  <Link
                    key={ia.slug}
                    href={`/ia/${encodeURIComponent(ia.slug)}`}
                    className={`fr-top${ia.serieA ? " serieA" : ""}`}
                  >
                    <span className="fr-top-pos">{idx + 1}º</span>
                    <IconeIA slug={ia.slug} size={26} />
                    <span className="fr-top-nome">{ia.nome}</span>
                    <span className="fr-top-pts">+{ia.pts}</span>
                  </Link>
                ))}
              </div>
            </>
          )}

          <div className="fr-jogos-destaque">
            <Link
              href={`/jogo/${r.jogoSurpresa.numero}`}
              className="fr-jogo-destaque surpresa"
            >
              <span className="fr-jogo-lbl">🦓 {tx.surpresa}</span>
              <span className="fr-jogo-meio">
                <Bandeira iso={r.jogoSurpresa.isoA} nome={r.jogoSurpresa.time_a} size={22} />
                <strong>{r.jogoSurpresa.time_a}</strong>
                <span className="fr-jogo-placar">{r.jogoSurpresa.gols_a}×{r.jogoSurpresa.gols_b}</span>
                <strong>{r.jogoSurpresa.time_b}</strong>
                <Bandeira iso={r.jogoSurpresa.isoB} nome={r.jogoSurpresa.time_b} size={22} />
              </span>
              <span className="fr-jogo-pct">
                {Math.round(r.jogoSurpresa.pctErrou * 100)}% erraram
              </span>
            </Link>
            <Link
              href={`/jogo/${r.jogoPrevisivel.numero}`}
              className="fr-jogo-destaque previsivel"
            >
              <span className="fr-jogo-lbl">🎯 {tx.previsivel}</span>
              <span className="fr-jogo-meio">
                <Bandeira iso={r.jogoPrevisivel.isoA} nome={r.jogoPrevisivel.time_a} size={22} />
                <strong>{r.jogoPrevisivel.time_a}</strong>
                <span className="fr-jogo-placar">{r.jogoPrevisivel.gols_a}×{r.jogoPrevisivel.gols_b}</span>
                <strong>{r.jogoPrevisivel.time_b}</strong>
                <Bandeira iso={r.jogoPrevisivel.isoB} nome={r.jogoPrevisivel.time_b} size={22} />
              </span>
              <span className="fr-jogo-pct">
                {Math.round(r.jogoPrevisivel.pctErrou * 100)}% erraram
              </span>
            </Link>
          </div>

          <Link href="/jogos" className="fr-cta">{tx.cta}</Link>
        </div>
      </div>

      <style>{`
        .fim-rodada { padding: 16px 0 12px; }
        .fr-card {
          background:
            radial-gradient(ellipse at top right, rgba(16, 185, 129, 0.20), transparent 60%),
            linear-gradient(135deg, #051910 0%, #0a2b1c 100%);
          border: 2px solid rgba(16, 185, 129, 0.45);
          border-radius: 24px;
          padding: 30px 26px 26px;
          color: #fff; max-width: 900px; margin: 0 auto;
          overflow: hidden;
          box-shadow: 0 18px 50px rgba(16, 185, 129, 0.14), 0 6px 20px rgba(0,0,0,0.45);
        }
        .fr-badge {
          display: inline-block;
          background: linear-gradient(90deg, #34d399, #10b981);
          color: #042111;
          padding: 7px 16px;
          border-radius: 999px;
          font-family: var(--ff-mono);
          font-weight: 900; font-size: 13px;
          letter-spacing: 0.06em; margin-bottom: 14px;
        }
        .fr-titulo {
          font-family: var(--ff-display);
          font-size: clamp(22px, 3.6vw, 32px);
          font-weight: 900; line-height: 1.15;
          margin: 0 0 18px; color: #fff;
          letter-spacing: -0.01em;
        }
        .fr-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px; margin-bottom: 22px;
        }
        .fr-stat {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 14px; padding: 14px 16px;
        }
        .fr-num {
          font-family: var(--ff-display);
          font-size: 38px; font-weight: 900;
          color: #6ee7b7; line-height: 1;
          margin-bottom: 6px;
        }
        .fr-num-sub { font-size: 18px; color: #9ca3af; }
        .fr-lbl {
          font-size: 13px; color: #d1d5db;
          line-height: 1.4;
        }
        .fr-h {
          font-family: var(--ff-mono);
          font-size: 11px; font-weight: 800;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: #6ee7b7; margin-bottom: 10px;
        }
        .fr-tops {
          display: flex; flex-direction: column; gap: 6px;
          margin-bottom: 22px;
        }
        .fr-top {
          display: grid;
          grid-template-columns: 36px 26px 1fr auto;
          gap: 12px; align-items: center;
          padding: 8px 14px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 10px;
          color: #fff; text-decoration: none;
          transition: background 0.15s ease, transform 0.15s ease;
        }
        .fr-top:hover {
          background: rgba(255,255,255,0.10);
          transform: translateX(2px);
        }
        .fr-top.serieA {
          background: rgba(16, 185, 129, 0.10);
          border-color: rgba(16, 185, 129, 0.4);
        }
        .fr-top-pos {
          font-family: var(--ff-mono); font-weight: 800;
          color: #6ee7b7;
        }
        .fr-top-nome {
          font-weight: 700; overflow: hidden;
          text-overflow: ellipsis; white-space: nowrap;
        }
        .fr-top-pts {
          font-family: var(--ff-display);
          font-weight: 900; color: #fbbf24;
        }
        .fr-jogos-destaque {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 10px; margin-bottom: 22px;
        }
        .fr-jogo-destaque {
          display: flex; flex-direction: column; gap: 8px;
          padding: 12px 14px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 12px;
          color: #fff; text-decoration: none;
          transition: border-color 0.15s ease, transform 0.15s ease;
        }
        .fr-jogo-destaque:hover {
          border-color: #6ee7b7; transform: translateY(-1px);
        }
        .fr-jogo-destaque.surpresa { border-color: rgba(253, 224, 71, 0.4); }
        .fr-jogo-destaque.previsivel { border-color: rgba(16, 185, 129, 0.4); }
        .fr-jogo-lbl {
          font-family: var(--ff-mono); font-size: 10px;
          font-weight: 800; letter-spacing: 0.1em;
          text-transform: uppercase; color: #d1d5db;
        }
        .fr-jogo-meio {
          display: flex; align-items: center; gap: 8px;
          font-size: 14px; flex-wrap: wrap;
        }
        .fr-jogo-placar {
          font-family: var(--ff-display); font-weight: 900;
          color: #fde047; padding: 2px 8px;
          background: rgba(253, 224, 71, 0.10);
          border-radius: 6px;
        }
        .fr-jogo-pct {
          font-family: var(--ff-mono);
          font-size: 11px; color: #9ca3af;
        }
        .fr-cta {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 13px 24px;
          background: #6ee7b7; color: #042111;
          border-radius: 12px;
          font-weight: 800; font-size: 15px;
          text-decoration: none;
          box-shadow: 0 6px 18px rgba(110, 231, 183, 0.3);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .fr-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 26px rgba(110, 231, 183, 0.45);
        }
      `}</style>
    </section>
  );
}
