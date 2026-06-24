import Link from "next/link";
import { promises as fs } from "fs";
import path from "path";
import { notFound } from "next/navigation";
import IconeIA from "@/components/IconeIA";
import { resolverLocale } from "@/lib/locale-server";
import { marcaDe } from "@/lib/ias";
import { FALLBACK_NAO_WEB } from "@/lib/serie-a";
import { pontosJogo } from "@/lib/scoring";
import { analiseLiberado } from "@/lib/analise-auth";
import { carregarV2V3DoSlug, type PlacarV2 } from "@/lib/palpites-v2";
import type { Jogo as JogoFull, Palpite as PalpiteFull } from "@/lib/types";

type Jogo = {
  numero: number;
  fase: string;
  data: string;
  hora: string;
  local: string;
  time_a: string;
  time_b: string;
  gols_a: number | null;
  gols_b: number | null;
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
    // Série A "-web" são vitrines: os palpites reais vivem no irmão sem "-web".
    const fonteSlug = FALLBACK_NAO_WEB[slug] ?? slug;
    const palpites: Record<number, Palpite> = {};
    for (const [numStr, entry] of Object.entries(pj)) {
      const p = entry.palpites?.[fonteSlug];
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

  // Palpites atualizados (premium). Match direto pelo slug. v2/v3 só são
  // RENDERIZADOS quando `liberado`; o boolean temV2 (não vaza placar) decide o CTA.
  const [{ liberado }, { v2, v3 }] = await Promise.all([
    analiseLiberado(),
    carregarV2V3DoSlug(slug),
  ]);
  const temV2 = Object.keys(v2).length > 0 || Object.keys(v3).length > 0;

  const marca = marcaDe(slug);
  const totalPalpites = Object.keys(palpites).length;

  const tx = {
    voltar: en ? "← Back to AIs" : es ? "← Volver a las IAs" : fr ? "← Retour aux IA" : "← Voltar pra lista",
    palpites: en ? "predictions" : es ? "pronósticos" : fr ? "pronostics" : "palpites",
    exatos: en ? "exact scores" : es ? "exactos" : fr ? "exacts" : "placares exatos",
    pts: "pts",
    jogos_h2: en ? "Match-by-match predictions" : es ? "Pronósticos partido por partido" : fr ? "Pronostics match par match" : "Palpites jogo a jogo",
    semPalpite: en ? "no prediction" : es ? "sin pronóstico" : fr ? "pas de pronostic" : "sem palpite",
    palpiteAbrev: en ? "pick" : es ? "pron" : fr ? "pron" : "palpite",
    resultadoAbrev: en ? "result" : es ? "result" : fr ? "réel" : "real",
    ft: en ? "FT" : "FIM",
    v2Aviso: en
      ? "✨ This AI redid its picks mid-tournament — the v1 → v2 (→ v3) trail is shown below."
      : es
      ? "✨ Esta IA rehízo sus pronósticos con el Mundial en marcha — abajo el camino v1 → v2 (→ v3)."
      : fr
      ? "✨ Cette IA a refait ses pronostics en cours de tournoi — le parcours v1 → v2 (→ v3) est ci-dessous."
      : "✨ Esta IA refez os palpites com a Copa rolando — a trilha v1 → v2 (→ v3) aparece abaixo.",
    v2Cta: en
      ? "This AI updated its picks mid-tournament."
      : es
      ? "Esta IA actualizó sus pronósticos con el Mundial en marcha."
      : fr
      ? "Cette IA a mis à jour ses pronostics en cours de tournoi."
      : "Esta IA atualizou os palpites com a Copa em andamento.",
    v2CtaLink: en
      ? "See the updated picks →"
      : es
      ? "Ver los pronósticos actualizados →"
      : fr
      ? "Voir les pronostics mis à jour →"
      : "Ver os palpites atualizados →",
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

      {temV2 && liberado && (
        <div className="ia-v2-aviso">{tx.v2Aviso}</div>
      )}
      {temV2 && !liberado && (
        <Link href="/analise-v2" className="ia-v2-cta">
          <span>✨ {tx.v2Cta}</span>
          <strong>{tx.v2CtaLink}</strong>
        </Link>
      )}

      <h2 style={{ marginBottom: 16 }}>{tx.jogos_h2}</h2>

      <div className="palpites-lista">
        {jogos.map((jogo) => {
          const p = palpites[jogo.numero];
          const pv2: PlacarV2 | undefined = liberado ? v2[jogo.numero] : undefined;
          const pv3: PlacarV2 | undefined = liberado ? v3[jogo.numero] : undefined;
          const temTrail = !!(pv2 || pv3);
          const encerrado = jogo.gols_a != null && jogo.gols_b != null;
          // pontosJogo aceita o Jogo completo + palpite
          const pts = encerrado && p
            ? pontosJogo(p as PalpiteFull, jogo as JogoFull)
            : null;
          const tier =
            pts == null ? "" : pts >= 10 ? "exato" : pts >= 5 ? "venc" : "zero";
          return (
            <Link
              key={jogo.numero}
              href={`/jogo/${jogo.numero}`}
              className={`palpite-row${encerrado ? " encerrado" : ""}${
                pts != null && pts >= 10 ? " cravou" : ""
              }`}
            >
              <div className="palpite-meta">
                <span className="palpite-num">#{jogo.numero}</span>
                <span className="palpite-fase">{jogo.fase}</span>
                <span className="palpite-data">
                  {formatDataBR(jogo.data, jogo.hora)}
                </span>
                {encerrado && (
                  <span className="palpite-ft">✓ {tx.ft}</span>
                )}
              </div>
              <div className="palpite-jogo">
                <span className="palpite-time">{jogo.time_a}</span>
                <div className="palpite-placares">
                  <span className="placar-bloco palpite">
                    <span className="placar-lbl">{temTrail ? "v1" : tx.palpiteAbrev}</span>
                    {p ? (
                      <span className="placar-num">
                        <strong>{p.gols_a}</strong>
                        <span style={{ opacity: 0.5, margin: "0 4px" }}>×</span>
                        <strong>{p.gols_b}</strong>
                      </span>
                    ) : (
                      <em className="placar-vazio">{tx.semPalpite}</em>
                    )}
                  </span>
                  {pv2 && (
                    <>
                      <span className="placar-seta">→</span>
                      <span className="placar-bloco v2">
                        <span className="placar-lbl">v2</span>
                        <span className="placar-num">
                          <strong>{pv2.gols_a}</strong>
                          <span style={{ opacity: 0.5, margin: "0 4px" }}>×</span>
                          <strong>{pv2.gols_b}</strong>
                        </span>
                      </span>
                    </>
                  )}
                  {pv3 && (
                    <>
                      <span className="placar-seta">→</span>
                      <span className="placar-bloco v3">
                        <span className="placar-lbl">v3</span>
                        <span className="placar-num">
                          <strong>{pv3.gols_a}</strong>
                          <span style={{ opacity: 0.5, margin: "0 4px" }}>×</span>
                          <strong>{pv3.gols_b}</strong>
                        </span>
                      </span>
                    </>
                  )}
                  {encerrado && (
                    <span className="placar-bloco real">
                      <span className="placar-lbl">{tx.resultadoAbrev}</span>
                      <span className="placar-num">
                        <strong>{jogo.gols_a}</strong>
                        <span style={{ opacity: 0.5, margin: "0 4px" }}>×</span>
                        <strong>{jogo.gols_b}</strong>
                      </span>
                    </span>
                  )}
                  {pts != null && (
                    <span className="palpite-pts" data-tier={tier}>
                      {pts}
                    </span>
                  )}
                </div>
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
        .palpite-placares {
          display: flex;
          align-items: center;
          gap: 10px;
          justify-content: center;
        }
        .placar-bloco {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          line-height: 1;
        }
        .placar-lbl {
          font-family: var(--ff-mono);
          font-size: 9px;
          font-weight: 700;
          color: var(--fg-muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .placar-bloco.real .placar-lbl { color: #10b981; }
        .placar-bloco.v2 .placar-lbl,
        .placar-bloco.v3 .placar-lbl { color: var(--accent-2, #a855f7); }
        .placar-num {
          font-family: var(--ff-display);
          font-size: 20px;
          color: var(--secondary);
          white-space: nowrap;
        }
        .placar-bloco.real .placar-num { color: #10b981; font-weight: 800; }
        .placar-bloco.v2 .placar-num,
        .placar-bloco.v3 .placar-num { color: var(--accent-2, #a855f7); }
        .placar-bloco.v3 .placar-num { font-weight: 800; }
        .placar-seta {
          color: var(--fg-muted);
          font-size: 14px;
          align-self: center;
        }
        .ia-v2-aviso {
          margin-bottom: 20px;
          padding: 10px 16px;
          border-radius: var(--r-m);
          background: color-mix(in srgb, var(--accent-2, #a855f7) 10%, transparent);
          border: 1px solid color-mix(in srgb, var(--accent-2, #a855f7) 35%, transparent);
          color: var(--fg-mid);
          font-size: 14px;
        }
        .ia-v2-cta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 6px 10px;
          margin-bottom: 20px;
          padding: 12px 18px;
          border-radius: var(--r-m);
          background: color-mix(in srgb, var(--accent-2, #a855f7) 8%, var(--bg-1));
          border: 1px solid color-mix(in srgb, var(--accent-2, #a855f7) 30%, transparent);
          color: var(--fg);
          font-size: 14px;
          transition: border-color 0.15s ease;
        }
        .ia-v2-cta:hover {
          border-color: var(--accent-2, #a855f7);
        }
        .ia-v2-cta strong { color: var(--accent-2, #a855f7); }
        .placar-vazio {
          color: var(--fg-muted);
          font-size: 11px;
          font-style: italic;
        }
        .palpite-ft {
          font-family: var(--ff-mono);
          font-size: 10px;
          font-weight: 800;
          color: #10b981;
          padding: 1px 6px;
          background: color-mix(in srgb, #10b981 15%, transparent);
          border-radius: 999px;
          letter-spacing: 0.05em;
        }
        .palpite-pts {
          font-family: var(--ff-mono);
          font-size: 12px;
          font-weight: 800;
          padding: 3px 9px;
          border-radius: 999px;
          white-space: nowrap;
          align-self: center;
        }
        .palpite-pts[data-tier="exato"] { background: #10b981; color: #fff; }
        .palpite-pts[data-tier="venc"]  { background: #d4d4d4; color: #1a2657; }
        .palpite-pts[data-tier="zero"]  { background: var(--bg-soft); color: var(--fg-muted); }
        .palpite-row.cravou {
          background: color-mix(in srgb, #10b981 10%, var(--bg-1));
          border-color: #10b981;
        }
        @media (max-width: 520px) {
          .palpite-jogo { font-size: 13px; gap: 6px; }
          .palpite-placares { gap: 6px; }
          .placar-num { font-size: 16px; }
        }
      `}</style>
    </div>
  );
}
