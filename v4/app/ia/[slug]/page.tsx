import Link from "next/link";
import { promises as fs } from "fs";
import path from "path";
import { notFound } from "next/navigation";
import IconeIA from "@/components/IconeIA";
import { resolverLocale } from "@/lib/locale-server";
import { marcaDe } from "@/lib/ias";

type Jogo = {
  numero: number;
  fase: string;
  data: string;
  hora: string;
  local: string;
  time_a: string;
  time_b: string;
};

type Palpite = { gols_a: number; gols_b: number };

type PorJogo = Record<
  string,
  { palpites: Record<string, Palpite> }
>;

type IA = {
  slug: string;
  nome_display: string;
  pontos: number;
  placares_exatos: number;
  vencedores_acertados: number;
  jogos_palpitados: number;
  rank: number;
};

async function carregarTudo(slug: string): Promise<{
  ia: IA | null;
  jogos: Jogo[];
  palpites: Record<number, Palpite>;
}> {
  const pub = path.join(process.cwd(), "public");
  try {
    const [rkRaw, jogosRaw, pjRaw] = await Promise.all([
      fs.readFile(path.join(pub, "ranking-ias.json"), "utf-8"),
      fs.readFile(path.join(pub, "jogos.json"), "utf-8"),
      fs.readFile(path.join(pub, "palpites_por_jogo.json"), "utf-8"),
    ]);
    const rk = JSON.parse(rkRaw) as { ias: IA[] };
    const jogos = JSON.parse(jogosRaw) as Jogo[];
    const pj = JSON.parse(pjRaw) as PorJogo;

    const ia = rk.ias.find((i) => i.slug === slug) ?? null;
    const palpites: Record<number, Palpite> = {};
    for (const [numStr, entry] of Object.entries(pj)) {
      const p = entry.palpites?.[slug];
      if (p) palpites[Number(numStr)] = p;
    }
    return { ia, jogos, palpites };
  } catch {
    return { ia: null, jogos: [], palpites: {} };
  }
}

function formatDataBR(data: string, hora: string): string {
  const [, mes, dia] = data.split("-");
  const meses = ["", "jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${dia}/${meses[Number(mes)] ?? mes} ${hora}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { ia } = await carregarTudo(slug);
  const nome = ia?.nome_display ?? slug;
  return {
    title: `${nome} — Palpites · Bolão das IAs`,
    description: `Veja todos os palpites de ${nome} para a Copa 2026.`,
  };
}

export default async function IADetalhePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await resolverLocale();
  const en = locale === "en";
  const es = locale === "es";
  const fr = locale === "fr";

  const { ia, jogos, palpites } = await carregarTudo(slug);
  if (!ia) notFound();

  const marca = marcaDe(slug);
  const totalPalpites = Object.keys(palpites).length;

  const tx = {
    voltar: en ? "← Back to AIs" : es ? "← Volver a las IAs" : fr ? "← Retour aux IA" : "← Voltar pra lista",
    palpites: en ? "predictions" : es ? "pronósticos" : fr ? "pronostics" : "palpites",
    exatos: en ? "exact scores" : es ? "exactos" : fr ? "exacts" : "placares exatos",
    pts: "pts",
    jogos_h2: en ? "Match-by-match predictions" : es ? "Pronósticos partido por partido" : fr ? "Pronostics match par match" : "Palpites jogo a jogo",
    semPalpite: en ? "no prediction" : es ? "sin pronóstico" : fr ? "pas de pronostic" : "sem palpite",
  };

  return (
    <div style={{ marginTop: 24, marginBottom: 64 }}>
      <div style={{ marginBottom: 16 }}>
        <Link
          href="/ranking-ias"
          style={{ color: "var(--fg-mid)", fontSize: 14, fontWeight: 600 }}
        >
          {tx.voltar}
        </Link>
      </div>

      <header
        className="card"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <IconeIA slug={slug} size={64} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            style={{
              fontFamily: "var(--ff-display)",
              fontSize: "clamp(24px, 4vw, 36px)",
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            {ia.nome_display}
          </h1>
          <p
            style={{
              margin: "4px 0 0",
              color: marca.cor,
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            {marca.nome}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontFamily: "var(--ff-display)",
              fontSize: 40,
              fontWeight: 800,
              color: "var(--secondary)",
              lineHeight: 1,
            }}
          >
            {ia.pontos}
          </div>
          <div
            style={{
              fontFamily: "var(--ff-mono)",
              fontSize: 11,
              color: "var(--fg-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginTop: 2,
            }}
          >
            {tx.pts}
          </div>
        </div>
      </header>

      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 28,
          color: "var(--fg-mid)",
          fontSize: 14,
        }}
      >
        <span>
          <strong>{totalPalpites}</strong>/{jogos.length} {tx.palpites}
        </span>
        <span>·</span>
        <span>
          <strong>{ia.placares_exatos}</strong> {tx.exatos}
        </span>
      </div>

      <h2 style={{ marginBottom: 16 }}>{tx.jogos_h2}</h2>

      <div className="palpites-lista">
        {jogos.map((jogo) => {
          const p = palpites[jogo.numero];
          return (
            <Link
              key={jogo.numero}
              href={`/jogos#jogo-${jogo.numero}`}
              className="palpite-row"
            >
              <div className="palpite-meta">
                <span className="palpite-num">#{jogo.numero}</span>
                <span className="palpite-fase">{jogo.fase}</span>
                <span className="palpite-data">
                  {formatDataBR(jogo.data, jogo.hora)}
                </span>
              </div>
              <div className="palpite-jogo">
                <span className="palpite-time">{jogo.time_a}</span>
                <span className="palpite-placar">
                  {p ? (
                    <>
                      <strong>{p.gols_a}</strong>
                      <span style={{ opacity: 0.5, margin: "0 6px" }}>×</span>
                      <strong>{p.gols_b}</strong>
                    </>
                  ) : (
                    <em
                      style={{
                        color: "var(--fg-muted)",
                        fontSize: 13,
                        fontStyle: "italic",
                      }}
                    >
                      {tx.semPalpite}
                    </em>
                  )}
                </span>
                <span className="palpite-time palpite-time-b">{jogo.time_b}</span>
              </div>
            </Link>
          );
        })}
      </div>

      <style>{`
        .palpites-lista {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .palpite-row {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 12px 16px;
          background: var(--bg-1);
          border: 1px solid var(--line);
          border-radius: var(--r-m);
          color: var(--fg);
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .palpite-row:hover {
          border-color: var(--primary);
          background: var(--bg-soft);
        }
        .palpite-meta {
          display: flex;
          gap: 10px;
          align-items: center;
          font-family: var(--ff-mono);
          font-size: 11px;
          color: var(--fg-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .palpite-num { font-weight: 700; color: var(--fg-mid); }
        .palpite-jogo {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 12px;
          align-items: center;
          font-size: 15px;
        }
        .palpite-time {
          font-weight: 600;
          text-align: right;
        }
        .palpite-time-b { text-align: left; }
        .palpite-placar {
          font-family: var(--ff-display);
          font-size: 22px;
          color: var(--secondary);
          white-space: nowrap;
        }
        @media (max-width: 520px) {
          .palpite-jogo { font-size: 13px; gap: 8px; }
          .palpite-placar { font-size: 18px; }
        }
      `}</style>
    </div>
  );
}
