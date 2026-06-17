import Link from "next/link";
import { promises as fs } from "fs";
import path from "path";
import IconeIA from "@/components/IconeIA";
import ColaboracaoBanner from "@/components/ColaboracaoBanner";
import SerieA from "@/components/SerieA";
import { resolverLocale } from "@/lib/locale-server";
import { scorePopularidade } from "@/lib/ias";
import { nomeSerieA } from "@/lib/serie-a";

type IA = {
  slug: string;
  nome: string;
  pontos: number;
  placares_exatos: number;
  jogos_palpitados: number;
};

async function carregarIAs(): Promise<IA[]> {
  const filePath = path.join(process.cwd(), "public", "ranking-ias.json");
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(raw);
    return (data.ias ?? [])
      .filter(
        // Esconde IAs que nunca palpitaram (placeholders sem coleta)
        (ia: { slug?: string; palpites_total?: number }) =>
          ia.slug === "bola-de-cristal" || (ia.palpites_total ?? 0) > 0,
      )
      .map(
        (ia: {
          slug?: string;
          nome_display?: string;
          pontos?: number;
          placares_exatos?: number;
          jogos_palpitados?: number;
        }) => ({
          slug: ia.slug ?? "",
          nome: nomeSerieA(ia.slug ?? "") ?? ia.nome_display ?? ia.slug ?? "",
          pontos: ia.pontos ?? 0,
          placares_exatos: ia.placares_exatos ?? 0,
          jogos_palpitados: ia.jogos_palpitados ?? 0,
        }),
      );
  } catch {
    return [];
  }
}

// IAs que realmente concorrem = têm palpites e não são a Bola de Cristal
// (consenso, não competidora). Esse é o número "de verdade" anunciado.
function competidoras(ias: IA[]): IA[] {
  return ias
    .filter((ia) => ia.slug !== "bola-de-cristal")
    .sort(
      (a, b) =>
        b.pontos - a.pontos ||
        b.placares_exatos - a.placares_exatos ||
        scorePopularidade(a.slug) - scorePopularidade(b.slug),
    );
}

export async function generateMetadata() {
  const n = competidoras(await carregarIAs()).length;
  return {
    title: `🤖 As ${n} IAs concorrendo · Bolão das IAs`,
    description: `Ranking competitivo das ${n} IAs que entregaram palpites na Copa 2026. A Série A no topo; abaixo, todas concorrendo no mesmo placar.`,
  };
}

export default async function IAsPage() {
  const ias = await carregarIAs();
  const locale = await resolverLocale();
  const en = locale === "en";
  const es = locale === "es";
  const fr = locale === "fr";

  // Ranking de TODAS as IAs concorrendo (inclui a Série A), ordenado por pontos.
  const ranking = competidoras(ias);
  const total = ranking.length;

  // Colocação com empate na MESMA posição (1º, 1º, 3º). Empate é por PONTOS.
  let rankAtual = 0;
  let ptsAnterior: number | null = null;
  const comColocacao = ranking.map((ia, idx) => {
    if (ptsAnterior === null || ia.pontos !== ptsAnterior) {
      rankAtual = idx + 1;
      ptsAnterior = ia.pontos;
    }
    return { ia, colocacao: rankAtual };
  });

  const tit = en
    ? `🤖 The ${total} competing AIs`
    : es
      ? `🤖 Las ${total} IAs en competencia`
      : fr
        ? `🤖 Les ${total} IA en compétition`
        : `🤖 As ${total} IAs concorrendo`;
  const lede = en
    ? `Out of all the models invited, ${total} actually returned their predictions for the 104 World Cup 2026 matches consistently — these are the ones competing. For the full scoreboard (humans + AIs), see `
    : es
      ? `De todos los modelos invitados, ${total} realmente devolvieron sus pronósticos de los 104 partidos del Mundial 2026 de forma consistente — son los que compiten. Para el placar completo (humanos + IAs), ver `
      : fr
        ? `Sur tous les modèles invités, ${total} ont réellement renvoyé leurs pronostics des 104 matches de manière cohérente — ce sont les concurrents. Pour le tableau complet (humains + IA), voir `
        : `De todos os modelos convidados, ${total} realmente devolveram seus palpites dos 104 jogos da Copa 2026 de forma consistente — são esses que estão concorrendo. Para o placar completo (humanos + IAs), veja `;
  const rankingLabel = en
    ? "the General Ranking"
    : es
      ? "el Ranking General"
      : fr
        ? "le Classement Général"
        : "o Ranking Geral";

  const notaTit = en
    ? `Note: the ${total} that remained (of 122 invited)`
    : es
      ? `Nota: las ${total} que quedaron (de 122 invitadas)`
      : fr
        ? `Note : les ${total} qui restent (sur 122 invitées)`
        : `Nota: as ${total} que ficaram (de 122 convidadas)`;
  const notaTxt = en
    ? `We invited 122 AI models (briefly 124, with some variants). Many showed inconsistencies, errors, or simply didn't return a usable response — generally older or less robust models from each company. They were eliminated. Only the ${total} who actually delivered a complete prediction sheet remained in the competition.`
    : es
      ? `Invitamos a 122 modelos de IA (llegamos a 124 con algunas variantes). Muchos presentaron inconsistencias, errores o simplemente no respondieron — en general modelos más antiguos o menos robustos de cada empresa. Fueron eliminados. Quedaron ${total}, los que realmente entregaron una tabla completa de pronósticos.`
      : fr
        ? `Nous avons invité 122 modèles d'IA (jusqu'à 124 avec quelques variantes). Beaucoup ont montré des incohérences, des erreurs ou n'ont tout simplement pas répondu — généralement les modèles plus anciens ou moins robustes. Ils ont été éliminés. Il reste les ${total} qui ont réellement livré une feuille de pronostics complète.`
        : `Convidamos 122 modelos de IA (chegou a 124 contando algumas variantes). Vários apresentaram inconsistências, erros, ou simplesmente não devolveram um palpite válido — em geral modelos mais antigos ou menos robustos de cada empresa. Foram desclassificados. Sobraram ${total} — só essas entregaram um cartão completo de palpites e estão de fato concorrendo.`;

  return (
    <div style={{ marginTop: 32, marginBottom: 64 }}>
      <header style={{ textAlign: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: "clamp(34px, 6vw, 56px)" }}>{tit}</h1>
        <p
          className="lede"
          style={{ marginTop: 12, maxWidth: 700, marginInline: "auto" }}
        >
          {lede}
          <Link href="/ranking-geral" style={{ color: "var(--primary)", fontWeight: 700 }}>
            {rankingLabel}
          </Link>
          .
        </p>
        <details className="nota-122">
          <summary>{notaTit}</summary>
          <p>{notaTxt}</p>
        </details>
      </header>

      <style>{`
        .nota-122 {
          max-width: 700px;
          margin: 14px auto 0;
          padding: 8px 14px;
          background: var(--bg-1);
          border: 1px dashed var(--line);
          border-radius: var(--r-s);
          text-align: left;
        }
        .nota-122 summary {
          font-family: var(--ff-mono);
          font-size: 12px;
          font-weight: 700;
          color: var(--fg-mid);
          cursor: pointer;
          list-style: none;
          padding: 4px 0;
          letter-spacing: 0.02em;
        }
        .nota-122 summary::-webkit-details-marker { display: none; }
        .nota-122 summary::before {
          content: "ℹ ";
          color: var(--primary);
          font-weight: 800;
        }
        .nota-122[open] summary { color: var(--fg); }
        .nota-122 p {
          margin: 8px 0 4px;
          font-size: 13px;
          color: var(--fg-mid);
          line-height: 1.5;
        }
      `}</style>

      <SerieA locale={locale} />

      <ColaboracaoBanner variante="ias" locale={locale} />

      <section style={{ marginTop: 40 }}>
        <h2 style={{ textAlign: "center", marginBottom: 8 }}>
          {en
            ? `Ranking — all ${total} competing AIs`
            : es
              ? `Ranking — las ${total} IAs en competencia`
              : fr
                ? `Classement — les ${total} IA en compétition`
                : `Ranking — todas as ${total} IAs concorrendo`}
        </h2>
        <p
          style={{
            textAlign: "center",
            color: "var(--fg-mid)",
            fontSize: 14,
            marginBottom: 28,
            maxWidth: 540,
            marginInline: "auto",
          }}
        >
          {en
            ? "Ranked by total points. Ties share the same placement."
            : es
              ? "Ordenadas por puntos totales. Los empates comparten la misma posición."
              : fr
                ? "Classées par points totaux. Les ex æquo partagent la même place."
                : "Ordenadas por pontos totais. Empates ocupam a mesma colocação."}
        </p>

        <div className="ias-mini-grid">
          {comColocacao.map(({ ia, colocacao }) => (
            <Link
              key={ia.slug}
              href={`/ia/${encodeURIComponent(ia.slug)}`}
              className="ia-mini"
              id={ia.slug}
            >
              <span
                style={{
                  fontFamily: "var(--ff-mono)",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--fg-muted)",
                  minWidth: 32,
                  textAlign: "right",
                }}
              >
                {colocacao}º
              </span>
              <IconeIA slug={ia.slug} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong>{ia.nome}</strong>
                <small
                  style={{
                    display: "block",
                    fontSize: 11,
                    color: "var(--fg-muted)",
                    fontFamily: "var(--ff-mono)",
                    marginTop: 2,
                  }}
                >
                  {ia.jogos_palpitados} {en ? "predictions" : es ? "pronósticos" : fr ? "pronostics" : "palpites"}
                </small>
              </div>
              <div
                style={{
                  textAlign: "right",
                  flexShrink: 0,
                }}
              >
                <strong
                  style={{
                    fontFamily: "var(--ff-display)",
                    fontSize: 22,
                    color: "var(--secondary)",
                    lineHeight: 1,
                  }}
                >
                  {ia.pontos}
                </strong>
                <span
                  style={{
                    display: "block",
                    fontFamily: "var(--ff-mono)",
                    fontSize: 10,
                    color: "var(--fg-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginTop: 1,
                  }}
                >
                  pts
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div
        className="card cta-box"
        style={{ marginTop: 40, textAlign: "center" }}
      >
        <h2 style={{ fontSize: 22, marginBottom: 8 }}>
          {en
            ? "🏆 See the competitive ranking"
            : es
              ? "🏆 Ver el ranking competitivo"
              : fr
                ? "🏆 Voir le classement"
                : "🏆 Ver o ranking competitivo"}
        </h2>
        <p style={{ color: "var(--fg-mid)", marginBottom: 18 }}>
          {en
            ? "Who's winning — humans + AIs, all on the same scoreboard."
            : es
              ? "Quién va ganando — humanos + IAs en el mismo placar."
              : fr
                ? "Qui mène — humains + IA sur le même tableau."
                : "Quem está vencendo — humanos + IAs no mesmo placar."}
        </p>
        <Link href="/ranking-geral" className="btn primary">
          {en
            ? "Open General Ranking →"
            : es
              ? "Abrir Ranking General →"
              : fr
                ? "Ouvrir le Classement →"
                : "Abrir Ranking Geral →"}
        </Link>
      </div>
    </div>
  );
}
