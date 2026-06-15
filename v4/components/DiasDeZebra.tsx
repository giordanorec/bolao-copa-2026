import Link from "next/link";
import IconeIA from "@/components/IconeIA";
import { carregarJogos } from "@/lib/jogos";
import { carregarPalpitesIAs, carregarDictIAs } from "@/lib/palpites-ias";
import { ehSerieA, nomeSerieA } from "@/lib/serie-a";
import type { Locale } from "@/lib/i18n";

type Cravou = { slug: string; nome: string; jogoNum: number; placar: string; jogoLabel: string };

type Resumo = {
  inicio: string;        // YYYY-MM-DD do dia mais antigo considerado
  nJogos: number;        // jogos encerrados no período
  totalPalpitesIAs: number;
  cravadas: Cravou[];    // todos os placares exatos do período (com IA + jogo)
  serieACravadas: number;
  serieATotalPalp: number;
};

// Hoje e ontem em America/Sao_Paulo (YYYY-MM-DD)
function janelaDias(diasAtras: number): string {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const d = new Date(Date.now() - diasAtras * 24 * 60 * 60 * 1000);
  return ymd.format(d);
}

async function calcular(): Promise<Resumo | null> {
  const inicio = janelaDias(1); // "ontem" em SP
  const [jogos, pj, dict] = await Promise.all([
    carregarJogos(),
    carregarPalpitesIAs(),
    carregarDictIAs(),
  ]);

  const recentes = jogos.filter(
    (j) => j.gols_a != null && j.gols_b != null && j.data >= inicio,
  );
  if (recentes.length === 0) return null;

  const cravadas: Cravou[] = [];
  let totalPalpitesIAs = 0;
  let serieACravadas = 0;
  let serieATotalPalp = 0;

  for (const j of recentes) {
    const dados = pj[String(j.numero)];
    if (!dados) continue;
    const entries = Object.entries(dados.palpites);
    totalPalpitesIAs += entries.length;
    for (const [slug, p] of entries) {
      const ehSA = ehSerieA(slug);
      if (ehSA) serieATotalPalp++;
      if (p.gols_a === j.gols_a && p.gols_b === j.gols_b) {
        cravadas.push({
          slug,
          nome: nomeSerieA(slug) ?? dict[slug] ?? slug,
          jogoNum: j.numero,
          placar: `${j.gols_a}×${j.gols_b}`,
          jogoLabel: `${j.time_a} × ${j.time_b}`,
        });
        if (ehSA) serieACravadas++;
      }
    }
  }

  return {
    inicio,
    nJogos: recentes.length,
    totalPalpitesIAs,
    cravadas,
    serieACravadas,
    serieATotalPalp,
  };
}

// Frase pegada: zebra se cravadas ≤ 1 por jogo em média OU Série A zerou no período.
function ehDiaDeZebra(r: Resumo): boolean {
  return r.serieACravadas === 0 && r.nJogos >= 3;
}

const TX: Record<
  Locale,
  {
    badge: string;
    titulo: (nJogos: number, nCravadas: number) => string;
    serieAZerou: string;
    seCravou: string;
    semCravadas: string;
    ningemAcertou: string;
    cta: string;
  }
> = {
  pt: {
    badge: "🦓 SÓ DEU ZEBRA",
    titulo: (n, c) =>
      `Desde ontem, em ${n} jogo${n === 1 ? "" : "s"}, só ${c} ${c === 1 ? "IA cravou" : "IAs cravaram"} o placar.`,
    serieAZerou: "Das 12 da Série A: nenhuma acertou um placar exato.",
    seCravou: "Quem cravou",
    semCravadas: "Nenhuma IA cravou nenhum placar — todas erraram.",
    ningemAcertou: "Ninguém da Série A acertou nada.",
    cta: "Ver todos os jogos →",
  },
  en: {
    badge: "🦓 UPSET STREAK",
    titulo: (n, c) =>
      `Since yesterday, across ${n} match${n === 1 ? "" : "es"}, only ${c} ${c === 1 ? "AI nailed" : "AIs nailed"} the exact score.`,
    serieAZerou: "From the Premier League 12: not a single exact-score hit.",
    seCravou: "Who nailed it",
    semCravadas: "No AI nailed any score — all wrong.",
    ningemAcertou: "Premier League: nothing.",
    cta: "See all matches →",
  },
  es: {
    badge: "🦓 SÓLO ZEBRAS",
    titulo: (n, c) =>
      `Desde ayer, en ${n} partido${n === 1 ? "" : "s"}, sólo ${c} ${c === 1 ? "IA clavó" : "IAs clavaron"} el marcador.`,
    serieAZerou: "De las 12 de la Liga A: ninguna acertó un marcador exacto.",
    seCravou: "Quién clavó",
    semCravadas: "Ninguna IA clavó nada — todas fallaron.",
    ningemAcertou: "Nadie de la Liga A acertó.",
    cta: "Ver todos los partidos →",
  },
  fr: {
    badge: "🦓 QUE DES SURPRISES",
    titulo: (n, c) =>
      `Depuis hier, sur ${n} match${n === 1 ? "" : "s"}, seules ${c} IA ont visé juste.`,
    serieAZerou: "Sur les 12 de la Ligue 1 : aucun score exact.",
    seCravou: "Qui a visé juste",
    semCravadas: "Aucune IA n'a visé juste — toutes fausses.",
    ningemAcertou: "Personne de la Ligue 1 n'a marqué.",
    cta: "Voir tous les matches →",
  },
};

export default async function DiasDeZebra({
  locale = "pt",
}: {
  locale?: Locale;
}) {
  const r = await calcular();
  if (!r || !ehDiaDeZebra(r)) return null;
  const tx = TX[locale];

  return (
    <section className="section zebra">
      <div className="container">
        <div className="zebra-card">
          <div className="zebra-badge">{tx.badge}</div>
          <h2 className="zebra-titulo">{tx.titulo(r.nJogos, r.cravadas.length)}</h2>
          <p className="zebra-sub">
            <strong>{tx.serieAZerou}</strong>
          </p>

          {r.cravadas.length === 0 ? (
            <p className="zebra-vazio">{tx.semCravadas}</p>
          ) : (
            <>
              <div className="zebra-rebeldes-lbl">{tx.seCravou}</div>
              <div className="zebra-grid">
                {r.cravadas.map((c) => (
                  <Link
                    key={`${c.slug}-${c.jogoNum}`}
                    href={`/jogo/${c.jogoNum}`}
                    className="zebra-chip"
                  >
                    <IconeIA slug={c.slug} size={28} />
                    <span className="zebra-chip-nome">
                      <strong>{c.nome}</strong>
                      <small>
                        {c.jogoLabel} · {c.placar}
                      </small>
                    </span>
                  </Link>
                ))}
              </div>
            </>
          )}

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
              rgba(255,255,255,0.04) 0 18px,
              rgba(255,255,255,0.00) 18px 36px
            ),
            linear-gradient(135deg, #0c0c12 0%, #1d1d2a 100%);
          border: 2px solid rgba(255,255,255,0.4);
          border-radius: 24px;
          padding: 30px 26px 26px;
          color: #fff;
          max-width: 880px;
          margin: 0 auto;
          overflow: hidden;
          box-shadow: 0 18px 50px rgba(255, 255, 255, 0.08), 0 6px 20px rgba(0,0,0,0.45);
        }
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
          font-size: clamp(22px, 3.6vw, 34px);
          font-weight: 900;
          line-height: 1.15;
          margin: 0 0 12px;
          color: #fff;
          letter-spacing: -0.01em;
        }
        .zebra-sub {
          color: #e5e5e5;
          font-size: 15px;
          line-height: 1.5;
          margin: 0 0 20px;
          max-width: 620px;
        }
        .zebra-sub strong {
          background: linear-gradient(90deg, #fde047, #f59e0b);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          font-weight: 800;
        }
        .zebra-vazio {
          font-family: var(--ff-mono);
          font-size: 13px;
          color: #fca5a5;
          padding: 14px 16px;
          background: rgba(248, 113, 113, 0.1);
          border: 1px solid rgba(248, 113, 113, 0.3);
          border-radius: 12px;
          margin-bottom: 20px;
        }
        .zebra-rebeldes-lbl {
          font-family: var(--ff-mono);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #d4d4d8;
          margin-bottom: 12px;
        }
        .zebra-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 22px;
        }
        .zebra-chip {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 8px 14px 8px 8px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 999px;
          color: #fff;
          font-size: 13px;
          text-decoration: none;
          transition: background 0.15s ease, transform 0.15s ease;
        }
        .zebra-chip:hover {
          background: rgba(255,255,255,0.14);
          transform: translateY(-1px);
        }
        .zebra-chip-nome {
          display: flex;
          flex-direction: column;
          line-height: 1.1;
        }
        .zebra-chip-nome strong {
          font-weight: 800;
          font-size: 13px;
        }
        .zebra-chip-nome small {
          font-family: var(--ff-mono);
          font-size: 10px;
          color: #d4d4d8;
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
      `}</style>
    </section>
  );
}
