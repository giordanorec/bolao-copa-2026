import Link from "next/link";
import Bandeira from "@/components/Bandeira";
import { carregarJogos } from "@/lib/jogos";
import { carregarPalpitesIAs } from "@/lib/palpites-ias";
import { carregarMapaPaises } from "@/lib/paises";
import type { Locale } from "@/lib/i18n";

// Zebra = jogo em que ≥ 70% das IAs erraram completamente (palpite que não
// bate placar exato, nem saldo, nem vencedor, nem empate). É o critério
// operacional: pegou o resultado de surpresa.
const LIMIAR_ZEBRA = 0.7;

type Zebra = {
  jogoNum: number;
  timeA: string;
  timeB: string;
  isoA?: string;
  isoB?: string;
  golsA: number;
  golsB: number;
  data: string;
  erraram: number;
  total: number;
  pct: number;        // 0..100
  cravadas: number;
  cristalCravou: boolean;
};

type Resumo = {
  totalJogosEncerrados: number;
  zebras: Zebra[];        // mais recentes primeiro
  pctZebra: number;       // 0..100
  brutal: Zebra | null;   // a pior (% mais alto, desempata pela mais recente)
};

async function calcular(): Promise<Resumo | null> {
  const [jogos, pj, mapaPaises] = await Promise.all([
    carregarJogos(),
    carregarPalpitesIAs(),
    carregarMapaPaises(),
  ]);

  const encerrados = jogos.filter(
    (j) => j.gols_a != null && j.gols_b != null,
  );
  if (encerrados.length === 0) return null;

  const zebras: Zebra[] = [];

  for (const j of encerrados) {
    const dados = pj[String(j.numero)];
    if (!dados) continue;
    const ra = j.gols_a as number;
    const rb = j.gols_b as number;
    let err = 0;
    let cravadas = 0;
    let total = 0;
    for (const p of Object.values(dados.palpites)) {
      total++;
      const exato = p.gols_a === ra && p.gols_b === rb;
      if (exato) cravadas++;
      const empOk = p.gols_a === p.gols_b && ra === rb;
      const vencOk =
        Math.sign(p.gols_a - p.gols_b) === Math.sign(ra - rb) &&
        p.gols_a !== p.gols_b;
      if (!exato && !empOk && !vencOk) err++;
    }
    if (total === 0) continue;
    const pct = err / total;
    if (pct < LIMIAR_ZEBRA) continue;
    const bola = dados.bola_de_cristal;
    zebras.push({
      jogoNum: j.numero,
      timeA: j.time_a,
      timeB: j.time_b,
      isoA: mapaPaises[j.time_a],
      isoB: mapaPaises[j.time_b],
      golsA: ra,
      golsB: rb,
      data: j.data,
      erraram: err,
      total,
      pct: Math.round(pct * 100),
      cravadas,
      cristalCravou: bola ? bola.gols_a === ra && bola.gols_b === rb : false,
    });
  }

  if (zebras.length === 0) return null;

  // Mais recentes primeiro (jogo número desc).
  zebras.sort((a, b) => b.jogoNum - a.jogoNum);

  // A "brutal" = maior pct; em empate, a mais recente.
  const brutal = zebras
    .slice()
    .sort((a, b) => b.pct - a.pct || b.jogoNum - a.jogoNum)[0];

  return {
    totalJogosEncerrados: encerrados.length,
    zebras,
    pctZebra: Math.round((zebras.length / encerrados.length) * 100),
    brutal,
  };
}

const TX: Record<
  Locale,
  {
    badge: string;
    titulo: (z: number) => string;
    sub: (z: number, total: number, pct: number) => string;
    brutal: string;
    listaTit: string;
    erraramFmt: (err: number, total: number) => string;
    ver: string;
    cta: string;
    cravadasInfo: (n: number) => string;
  }
> = {
  pt: {
    badge: "🦓 PLACAR DAS ZEBRAS",
    titulo: (z) => (z === 1 ? "1 zebra até agora." : `${z} zebras na Copa.`),
    sub: (z, total, pct) =>
      `Em ${total} jogo${total === 1 ? "" : "s"} encerrado${total === 1 ? "" : "s"}, em ${z} a maioria das IAs errou tudo — só ${pct}%${
        pct === 100 ? "" : ""
      } dos jogos foram previsíveis pra elas. Quer dizer: ${pct}% de zebras.`,
    brutal: "Zebra mais brutal",
    listaTit: "As zebras, do mais recente pro primeiro",
    erraramFmt: (err, total) => `${err}/${total} erraram tudo`,
    ver: "Ver palpites →",
    cta: "Ver todos os jogos →",
    cravadasInfo: (n) =>
      n === 0
        ? "Zerou geral · 0 cravaram"
        : `${n} cravara${n === 1 ? "m o placar" : "m o placar"}`,
  },
  en: {
    badge: "🦓 UPSET SCOREBOARD",
    titulo: (z) =>
      z === 1 ? "1 upset so far." : `${z} upsets at the World Cup.`,
    sub: (z, total, pct) =>
      `Out of ${total} finished match${total === 1 ? "" : "es"}, ${z} blew the AIs' picks — that's ${pct}% upsets.`,
    brutal: "Most brutal upset",
    listaTit: "Upsets, latest first",
    erraramFmt: (err, total) => `${err}/${total} got it all wrong`,
    ver: "See picks →",
    cta: "See all matches →",
    cravadasInfo: (n) =>
      n === 0 ? "Total wipe · 0 nailed it" : `${n} nailed the exact score`,
  },
  es: {
    badge: "🦓 PLACAR DE LAS ZEBRAS",
    titulo: (z) =>
      z === 1 ? "1 zebra hasta ahora." : `${z} zebras en el Mundial.`,
    sub: (z, total, pct) =>
      `De ${total} partido${total === 1 ? "" : "s"} terminado${total === 1 ? "" : "s"}, ${z} dejaron a las IAs en blanco — ${pct}% de zebras.`,
    brutal: "La zebra más brutal",
    listaTit: "Las zebras, del más reciente al primero",
    erraramFmt: (err, total) => `${err}/${total} fallaron todo`,
    ver: "Ver pronósticos →",
    cta: "Ver todos los partidos →",
    cravadasInfo: (n) =>
      n === 0 ? "Cero aciertos · 0 clavaron" : `${n} clavaron el marcador`,
  },
  fr: {
    badge: "🦓 TABLEAU DES SURPRISES",
    titulo: (z) =>
      z === 1 ? "1 surprise jusqu'ici." : `${z} surprises à la Coupe.`,
    sub: (z, total, pct) =>
      `Sur ${total} match${total === 1 ? "" : "s"} terminé${total === 1 ? "" : "s"}, ${z} ont pris les IA à contre-pied — ${pct}% de surprises.`,
    brutal: "La plus grosse surprise",
    listaTit: "Surprises, de la plus récente à la première",
    erraramFmt: (err, total) => `${err}/${total} ont tout raté`,
    ver: "Voir pronostics →",
    cta: "Voir tous les matches →",
    cravadasInfo: (n) =>
      n === 0 ? "Aucune IA visé juste" : `${n} ont visé juste`,
  },
};

function formatData(data: string, locale: Locale): string {
  const [ano, mes, dia] = data.split("-");
  if (locale === "en") return `${mes}/${dia}/${ano.slice(2)}`;
  return `${dia}/${mes}`;
}

export default async function DiasDeZebra({
  locale = "pt",
}: {
  locale?: Locale;
}) {
  const r = await calcular();
  if (!r) return null;
  const tx = TX[locale];

  return (
    <section className="section zebra">
      <div className="container">
        <div className="zebra-card">
          <div className="zebra-head">
            <div className="zebra-head-text">
              <div className="zebra-badge">{tx.badge}</div>
              <h2 className="zebra-titulo">{tx.titulo(r.zebras.length)}</h2>
              <p className="zebra-sub">
                {tx.sub(r.zebras.length, r.totalJogosEncerrados, r.pctZebra)}
              </p>
            </div>
            <div className="zebra-big">
              <span className="zebra-big-num">{r.zebras.length}</span>
              <span className="zebra-big-lbl">/ {r.totalJogosEncerrados}</span>
              <span className="zebra-big-pct">{r.pctZebra}%</span>
            </div>
          </div>

          {r.brutal && (
            <Link href={`/jogo/${r.brutal.jogoNum}`} className="zebra-brutal">
              <span className="zebra-brutal-lbl">⚡ {tx.brutal}</span>
              <div className="zebra-brutal-jogo">
                <span className="zb-time">
                  <Bandeira iso={r.brutal.isoA} nome={r.brutal.timeA} size={30} />
                  <strong>{r.brutal.timeA}</strong>
                </span>
                <span className="zb-placar">
                  {r.brutal.golsA}×{r.brutal.golsB}
                </span>
                <span className="zb-time">
                  <Bandeira iso={r.brutal.isoB} nome={r.brutal.timeB} size={30} />
                  <strong>{r.brutal.timeB}</strong>
                </span>
              </div>
              <span className="zebra-brutal-stat">
                {r.brutal.pct}% das IAs erraram tudo · {tx.cravadasInfo(r.brutal.cravadas)}
              </span>
            </Link>
          )}

          <div className="zebra-lista-titulo">{tx.listaTit}</div>
          <div className="zebra-lista">
            {r.zebras.map((z) => (
              <Link
                key={z.jogoNum}
                href={`/jogo/${z.jogoNum}`}
                className={`zebra-linha${z.pct === 100 ? " total" : ""}`}
              >
                <span className="zebra-data">
                  #{z.jogoNum} · {formatData(z.data, locale)}
                </span>
                <span className="zebra-confronto">
                  <Bandeira iso={z.isoA} nome={z.timeA} size={20} />
                  <span className="zebra-time-nome">{z.timeA}</span>
                  <span className="zebra-placar">
                    {z.golsA}×{z.golsB}
                  </span>
                  <span className="zebra-time-nome">{z.timeB}</span>
                  <Bandeira iso={z.isoB} nome={z.timeB} size={20} />
                </span>
                <span
                  className="zebra-stat"
                  data-tier={z.pct === 100 ? "max" : z.pct >= 90 ? "alto" : "ok"}
                >
                  {z.erraram}/{z.total} ({z.pct}%)
                </span>
              </Link>
            ))}
          </div>

          <Link href="/jogos" className="zebra-cta">
            {tx.cta}
          </Link>
        </div>
      </div>

      <style>{`
        .zebra { padding: 16px 0 12px; }
        .zebra-card {
          position: relative;
          background:
            repeating-linear-gradient(
              135deg,
              rgba(255,255,255,0.035) 0 16px,
              rgba(255,255,255,0.00) 16px 32px
            ),
            linear-gradient(135deg, #0c0c12 0%, #1d1d2a 100%);
          border: 2px solid rgba(255,255,255,0.4);
          border-radius: 24px;
          padding: 30px 26px 26px;
          color: #fff;
          max-width: 900px;
          margin: 0 auto;
          overflow: hidden;
          box-shadow: 0 18px 50px rgba(255, 255, 255, 0.08), 0 6px 20px rgba(0,0,0,0.45);
        }
        .zebra-head {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 16px;
          align-items: start;
          margin-bottom: 22px;
        }
        .zebra-head-text { min-width: 0; }
        .zebra-badge {
          display: inline-block;
          background: linear-gradient(90deg, #f4f4f5, #d4d4d8);
          color: #18181b;
          padding: 7px 16px;
          border-radius: 999px;
          font-family: var(--ff-mono);
          font-weight: 900;
          font-size: 13px;
          letter-spacing: 0.06em;
          margin-bottom: 14px;
        }
        .zebra-titulo {
          font-family: var(--ff-display);
          font-size: clamp(24px, 4vw, 38px);
          font-weight: 900;
          line-height: 1.12;
          margin: 0 0 10px;
          color: #fff;
          letter-spacing: -0.02em;
        }
        .zebra-sub {
          color: #d4d4d8;
          font-size: 15px;
          line-height: 1.5;
          margin: 0;
          max-width: 600px;
        }
        .zebra-big {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          padding: 4px 12px;
          border-left: 2px solid rgba(255,255,255,0.18);
          min-width: 110px;
        }
        .zebra-big-num {
          font-family: var(--ff-display);
          font-size: clamp(48px, 8vw, 72px);
          font-weight: 900;
          color: #fde047;
          line-height: 1;
        }
        .zebra-big-lbl {
          font-family: var(--ff-mono);
          font-size: 13px;
          color: #d4d4d8;
          margin-top: 2px;
        }
        .zebra-big-pct {
          margin-top: 6px;
          padding: 3px 10px;
          background: rgba(253, 224, 71, 0.15);
          border: 1px solid rgba(253, 224, 71, 0.4);
          border-radius: 999px;
          font-family: var(--ff-mono);
          font-weight: 800;
          font-size: 12px;
          color: #fde047;
        }
        .zebra-brutal {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 16px 18px;
          margin-bottom: 22px;
          background:
            linear-gradient(135deg, rgba(253, 224, 71, 0.10), rgba(245, 158, 11, 0.04)),
            rgba(255,255,255,0.04);
          border: 1.5px solid rgba(253, 224, 71, 0.35);
          border-radius: 16px;
          color: #fff;
          text-decoration: none;
          transition: transform 0.15s ease, border-color 0.15s ease;
        }
        .zebra-brutal:hover {
          transform: translateY(-2px);
          border-color: rgba(253, 224, 71, 0.7);
        }
        .zebra-brutal-lbl {
          font-family: var(--ff-mono);
          font-size: 11px;
          font-weight: 900;
          color: #fde047;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .zebra-brutal-jogo {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 14px;
          align-items: center;
        }
        .zb-time {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 15px;
        }
        .zb-time:last-child { justify-content: flex-end; }
        .zb-time strong { font-weight: 800; }
        .zb-placar {
          font-family: var(--ff-display);
          font-weight: 900;
          font-size: clamp(28px, 5vw, 40px);
          color: #fde047;
          white-space: nowrap;
        }
        .zebra-brutal-stat {
          font-family: var(--ff-mono);
          font-size: 12px;
          color: #d4d4d8;
        }
        .zebra-lista-titulo {
          font-family: var(--ff-mono);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #d4d4d8;
          margin-bottom: 12px;
        }
        .zebra-lista {
          display: flex; flex-direction: column;
          gap: 6px; margin-bottom: 22px;
        }
        .zebra-linha {
          display: grid;
          grid-template-columns: 100px 1fr auto;
          gap: 12px;
          align-items: center;
          padding: 10px 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 12px;
          color: #fff;
          font-size: 14px;
          text-decoration: none;
          transition: background 0.15s ease, transform 0.15s ease, border-color 0.15s ease;
        }
        .zebra-linha:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.25);
          transform: translateX(2px);
        }
        .zebra-linha.total {
          background: rgba(239, 68, 68, 0.10);
          border-color: rgba(239, 68, 68, 0.4);
        }
        .zebra-data {
          font-family: var(--ff-mono);
          font-size: 11px;
          color: #a1a1aa;
          letter-spacing: 0.04em;
        }
        .zebra-confronto {
          display: flex; align-items: center; gap: 8px;
          flex-wrap: wrap;
          min-width: 0;
        }
        .zebra-time-nome {
          font-weight: 700;
          white-space: nowrap;
        }
        .zebra-placar {
          font-family: var(--ff-display);
          font-weight: 900;
          color: #fde047;
          padding: 2px 10px;
          background: rgba(253, 224, 71, 0.12);
          border-radius: 6px;
        }
        .zebra-stat {
          font-family: var(--ff-mono);
          font-size: 12px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(255,255,255,0.08);
          color: #fff;
          white-space: nowrap;
        }
        .zebra-stat[data-tier="alto"] {
          background: rgba(253, 224, 71, 0.18);
          color: #fde047;
        }
        .zebra-stat[data-tier="max"] {
          background: rgba(239, 68, 68, 0.25);
          color: #fca5a5;
        }
        .zebra-cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 13px 24px;
          background: #fff;
          color: #18181b;
          border-radius: 12px;
          font-weight: 800;
          font-size: 15px;
          text-decoration: none;
          box-shadow: 0 6px 18px rgba(255, 255, 255, 0.18);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .zebra-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 26px rgba(255, 255, 255, 0.3);
        }
        @media (max-width: 640px) {
          .zebra-head {
            grid-template-columns: 1fr;
          }
          .zebra-big {
            flex-direction: row;
            align-items: baseline;
            gap: 8px;
            border-left: 0;
            border-top: 2px solid rgba(255,255,255,0.18);
            padding: 12px 0 0;
            min-width: 0;
          }
          .zebra-big-lbl { margin-top: 0; }
          .zebra-big-pct { margin-top: 0; margin-left: auto; }
          .zebra-linha {
            grid-template-columns: 1fr auto;
          }
          .zebra-data {
            grid-column: 1 / -1;
            font-size: 10px;
          }
          .zebra-confronto { font-size: 13px; gap: 6px; }
          .zebra-placar { font-size: 14px; padding: 2px 6px; }
          .zb-placar { font-size: 28px; }
        }
      `}</style>
    </section>
  );
}
