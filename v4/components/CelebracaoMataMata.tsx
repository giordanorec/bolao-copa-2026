import { promises as fs } from "fs";
import path from "path";
import Link from "next/link";
import IconeIA from "@/components/IconeIA";
import { SLUGS_SERIE_A, APELIDOS_SERIE_A } from "@/lib/serie-a";
import type { Locale } from "@/lib/i18n";

type Resultado = { jogo_numero: number; gols_a: number; gols_b: number };

type Performer = {
  slug: string;
  nome: string;
  exatos: number;
  totalDecididos: number;
};

async function computarTopMataMata(): Promise<{
  top: Performer[];
  totalDecididos: number;
  maxExatos: number;
} | null> {
  try {
    const pub = path.join(process.cwd(), "public");
    const [rawRes, rawPj] = await Promise.all([
      fs.readFile(path.join(pub, "resultados.json"), "utf-8"),
      fs.readFile(path.join(pub, "palpites_por_jogo.json"), "utf-8"),
    ]);
    const resultados = JSON.parse(rawRes) as Resultado[];
    const pj = JSON.parse(rawPj) as Record<
      string,
      { palpites?: Record<string, { gols_a: number; gols_b: number }> }
    >;

    // Só jogos de mata-mata (>=73) já decididos
    const mmDecididos = resultados.filter((r) => r.jogo_numero >= 73);
    if (mmDecididos.length === 0) return null;

    // Pra cada slug da Série A (vitrine "-web" + Fable), conta exatos
    const perfs: Performer[] = [];
    for (const slug of SLUGS_SERIE_A) {
      let exatos = 0;
      let palpitados = 0;
      for (const r of mmDecididos) {
        const p = pj[String(r.jogo_numero)]?.palpites?.[slug];
        if (!p) continue;
        palpitados++;
        if (p.gols_a === r.gols_a && p.gols_b === r.gols_b) exatos++;
      }
      if (palpitados === 0) continue;
      perfs.push({
        slug,
        nome: APELIDOS_SERIE_A[slug]?.nome ?? slug,
        exatos,
        totalDecididos: mmDecididos.length,
      });
    }

    if (perfs.length === 0) return null;

    // Ordena por exatos desc, e pega só quem cravou pelo menos 1
    const perfsComAcerto = perfs.filter((p) => p.exatos > 0);
    if (perfsComAcerto.length === 0) return null;

    perfsComAcerto.sort((a, b) => b.exatos - a.exatos);
    const maxExatos = perfsComAcerto[0].exatos;
    // Mostra só os que cravaram o número máximo (os líderes)
    const top = perfsComAcerto.filter((p) => p.exatos === maxExatos);

    return {
      top,
      totalDecididos: mmDecididos.length,
      maxExatos,
    };
  } catch {
    return null;
  }
}

const TX: Record<
  Locale,
  {
    badge: string;
    titulo: (nIAs: number, exatos: number, total: number) => string;
    subtitulo: (exatos: number, total: number) => string;
    cta: string;
    ouvido: string;
  }
> = {
  pt: {
    badge: "🏆 SÉRIE A CRAVANDO O MATA-MATA",
    titulo: (n, e, t) =>
      n === 1
        ? `1 IA cravou ${e} dos ${t} placares do mata-mata.`
        : `${n} IAs da Série A cravaram ${e} dos ${t} placares do mata-mata.`,
    subtitulo: (e, t) => `Placar exato em ${e}/${t} jogos decididos — sem chute, palpite no ponto.`,
    cta: "Ver o ranking das IAs →",
    ouvido: "Quer ver quem mais acertou? Filtra por Mata-mata no ranking.",
  },
  en: {
    badge: "🏆 PREMIER LEAGUE NAILING THE KNOCKOUTS",
    titulo: (n, e, t) =>
      n === 1
        ? `1 AI nailed ${e} of ${t} knockout scores.`
        : `${n} Premier League AIs nailed ${e} of ${t} knockout scores.`,
    subtitulo: (e, t) => `Exact score on ${e}/${t} decided matches — no guess, dead-on calls.`,
    cta: "See AI rankings →",
    ouvido: "Want to see who else nailed it? Filter by Knockout in the ranking.",
  },
  es: {
    badge: "🏆 LIGA A CLAVANDO LAS ELIMINATORIAS",
    titulo: (n, e, t) =>
      n === 1
        ? `1 IA clavó ${e} de ${t} marcadores de las eliminatorias.`
        : `${n} IAs de la Liga A clavaron ${e} de ${t} marcadores de las eliminatorias.`,
    subtitulo: (e, t) => `Marcador exacto en ${e}/${t} partidos decididos — sin azar, pronóstico al punto.`,
    cta: "Ver el ranking de las IAs →",
    ouvido: "¿Quieres ver quién más acertó? Filtra por Eliminatorias en el ranking.",
  },
  fr: {
    badge: "🏆 LA LIGUE A FAIT MOUCHE EN ÉLIMINATION",
    titulo: (n, e, t) =>
      n === 1
        ? `1 IA a trouvé ${e} des ${t} scores en éliminatoires.`
        : `${n} IA de la Ligue A ont trouvé ${e} des ${t} scores en éliminatoires.`,
    subtitulo: (e, t) => `Score exact sur ${e}/${t} matchs joués — pas un hasard, du visé.`,
    cta: "Voir le classement des IA →",
    ouvido: "Envie de voir qui d'autre a visé juste ? Filtre Élimination dans le classement.",
  },
};

export default async function CelebracaoMataMata({
  locale = "pt",
}: {
  locale?: Locale;
}) {
  const dados = await computarTopMataMata();
  if (!dados) return null;
  const tx = TX[locale];

  return (
    <section className="section mata-celebra">
      <div className="container">
        <div className="mata-celebra-card">
          <div className="mata-confetes" aria-hidden>
            <span style={{ top: "8%", left: "8%" }}>✨</span>
            <span style={{ top: "18%", right: "12%" }}>🎯</span>
            <span style={{ top: "62%", left: "6%" }}>⭐</span>
            <span style={{ top: "72%", right: "8%" }}>✨</span>
            <span style={{ top: "30%", left: "92%" }}>🏆</span>
            <span style={{ top: "85%", left: "48%" }}>⚽</span>
          </div>

          <div className="mata-badges-row">
            <div className="mata-badge-topo">{tx.badge}</div>
            <div className="mata-placar-streak" title={tx.subtitulo(dados.maxExatos, dados.totalDecididos)}>
              <span className="mata-streak-num">{dados.maxExatos}</span>
              <span className="mata-streak-sep">/</span>
              <span className="mata-streak-total">{dados.totalDecididos}</span>
            </div>
          </div>

          <h2 className="mata-titulo">
            {tx.titulo(dados.top.length, dados.maxExatos, dados.totalDecididos)}
          </h2>

          <div className="mata-ias-row">
            {dados.top.map((p) => (
              <Link
                key={p.slug}
                href={`/ia/${encodeURIComponent(p.slug)}`}
                className="mata-ia-card"
              >
                <IconeIA slug={p.slug} size={56} />
                <strong>{p.nome}</strong>
                <small>
                  {p.exatos} {locale === "en" ? "exact" : locale === "es" ? "exactos" : locale === "fr" ? "exacts" : "exatos"}
                </small>
              </Link>
            ))}
          </div>

          <p className="mata-subtitulo">{tx.subtitulo(dados.maxExatos, dados.totalDecididos)}</p>

          <Link href="/ranking-ias" className="mata-cta">
            {tx.cta}
          </Link>
        </div>
      </div>

      <style>{`
        .mata-celebra { padding: 28px 0 12px; }
        .mata-celebra-card {
          position: relative;
          background:
            radial-gradient(ellipse at top left, rgba(245, 158, 11, 0.22), transparent 60%),
            radial-gradient(ellipse at bottom right, rgba(16, 185, 129, 0.18), transparent 60%),
            linear-gradient(135deg, #1a1238 0%, #0f1f1a 100%);
          border: 2px solid rgba(245, 158, 11, 0.45);
          border-radius: 26px;
          padding: 36px 28px 28px;
          color: #fff;
          max-width: 880px;
          margin: 0 auto;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(245, 158, 11, 0.18), 0 8px 24px rgba(0,0,0,0.3);
        }
        .mata-confetes { position: absolute; inset: 0; pointer-events: none; }
        .mata-confetes span { position: absolute; font-size: 28px; opacity: 0.5; }
        .mata-badges-row {
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; margin-bottom: 14px; flex-wrap: wrap;
          position: relative; z-index: 2;
        }
        .mata-badge-topo {
          display: inline-block;
          background: linear-gradient(90deg, #f59e0b, #ef4444);
          color: #fff;
          padding: 8px 18px;
          border-radius: 999px;
          font-family: var(--ff-mono);
          font-weight: 900;
          font-size: 13px;
          letter-spacing: 0.06em;
          box-shadow: 0 0 24px rgba(245, 158, 11, 0.4);
        }
        .mata-placar-streak {
          display: inline-flex; align-items: baseline; gap: 4px;
          padding: 6px 16px;
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.4);
          border-radius: 999px;
          font-family: var(--ff-display);
          color: #a7f3d0;
        }
        .mata-streak-num { font-size: 22px; font-weight: 900; color: #10b981; }
        .mata-streak-sep { font-size: 18px; opacity: 0.5; }
        .mata-streak-total { font-size: 18px; font-weight: 700; opacity: 0.85; }
        .mata-titulo {
          font-family: var(--ff-display);
          font-size: clamp(24px, 4vw, 38px);
          font-weight: 900;
          line-height: 1.15;
          margin: 0 0 24px;
          color: #fff;
          letter-spacing: -0.02em;
          position: relative; z-index: 2;
        }
        .mata-ias-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 12px;
          padding: 20px 12px;
          background: rgba(255,255,255,0.04);
          border-radius: 18px;
          border: 1px solid rgba(245, 158, 11, 0.25);
          position: relative; z-index: 2;
          margin-bottom: 18px;
        }
        .mata-ia-card {
          display: flex; flex-direction: column;
          align-items: center; gap: 6px;
          padding: 14px 10px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          text-decoration: none;
          color: #fff;
          transition: transform 0.15s ease, border-color 0.15s ease;
        }
        .mata-ia-card:hover {
          transform: translateY(-3px);
          border-color: rgba(245, 158, 11, 0.7);
        }
        .mata-ia-card strong {
          font-size: 13px;
          text-align: center;
          font-weight: 700;
          line-height: 1.2;
        }
        .mata-ia-card small {
          font-family: var(--ff-mono);
          font-size: 11px;
          color: #fcd34d;
          letter-spacing: 0.04em;
          font-weight: 800;
          text-transform: uppercase;
        }
        .mata-subtitulo {
          font-size: 14px;
          color: #e5e7eb;
          margin-bottom: 18px;
          position: relative; z-index: 2;
          line-height: 1.5;
        }
        .mata-cta {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          padding: 14px 26px;
          background: linear-gradient(135deg, #f59e0b, #ef4444);
          color: #fff;
          border-radius: 12px;
          font-weight: 800;
          font-size: 16px;
          text-decoration: none;
          box-shadow: 0 6px 20px rgba(245, 158, 11, 0.45);
          position: relative; z-index: 2;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .mata-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(245, 158, 11, 0.6);
        }
      `}</style>
    </section>
  );
}
