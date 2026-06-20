import { promises as fs } from "fs";
import path from "path";
import Link from "next/link";
import IconeIA from "@/components/IconeIA";
import ScatterClusters from "./ScatterClusters";
import HeatmapSimilaridade from "./HeatmapSimilaridade";

export const metadata = {
  title: "🔬 Análise das IAs · Bolão das IAs",
  description:
    "Painel exploratório: como cada IA palpita, quais grupos formam, em que jogos acertam, e como se correlacionam.",
};

const CORES_CLUSTER = ["#a855f7", "#10b981", "#f59e0b", "#ef4444"];
const CORES_CONTINENTE: Record<string, string> = {
  UEFA: "#3b82f6",
  CONMEBOL: "#facc15",
  CONCACAF: "#ef4444",
  CAF: "#10b981",
  AFC: "#a855f7",
  OFC: "#f97316",
};
const NOMES_CONTINENTE: Record<string, string> = {
  UEFA: "Europa",
  CONMEBOL: "América do Sul",
  CONCACAF: "Am. Norte/Central",
  CAF: "África",
  AFC: "Ásia",
  OFC: "Oceania",
};

type Perfil = {
  slug: string;
  nome_display: string;
  serie_a: boolean;
  n_palpites: number;
  n_encerrados_palpitou: number;
  pct_empates_palpitados: number;
  avg_gols_total: number;
  avg_saldo_abs: number;
  tendencia_continente: Record<string, number>;
  pontos: number;
  exatos: number;
  saldo_acertados: number;
  venc_acertados: number;
  emp_acertados: number;
  erros: number;
  taxa_acerto: number;
  taxa_exato: number;
  acerto_por_continente: Record<
    string,
    { jogos: number; pts: number; media_pts: number; taxa_acerto: number }
  >;
  concordancia_cristal: number;
  jogos_com_favorito: number;
  pts_em_jogos_com_favorito: number;
  media_pts_jogos_com_favorito: number;
  jogos_equilibrados: number;
  pts_em_jogos_equilibrados: number;
  media_pts_jogos_equilibrados: number;
  cluster: number;
};

type Cluster = {
  id: number;
  emoji: string;
  nome: string;
  descricao: string;
  eh_lider: boolean;
  n_ias: number;
  pct_empates_palpitados: number;
  avg_gols_total: number;
  avg_saldo_abs: number;
  concordancia_cristal: number;
  taxa_exato: number;
  taxa_acerto: number;
  media_pontos: number;
  ias_exemplo: string[];
};

type Analise = {
  gerado_em: string;
  n_ias: number;
  n_jogos_encerrados: number;
  perfis: Perfil[];
  similaridade: Record<string, Record<string, number>>;
  clusters: Cluster[];
  rankings: Record<string, { slug: string; nome: string; valor: number }[]>;
};

async function carregar(): Promise<Analise | null> {
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), "public", "analise.json"),
      "utf-8",
    );
    return JSON.parse(raw) as Analise;
  } catch {
    return null;
  }
}

export default async function AnalisePage() {
  const a = await carregar();
  if (!a) {
    return (
      <div style={{ padding: 60, textAlign: "center" }}>
        <h1>🔬 Análise das IAs</h1>
        <p style={{ color: "var(--fg-mid)", marginTop: 16 }}>
          Arquivo de análise ainda não gerado. Rode{" "}
          <code>python scripts/analise.py</code> primeiro.
        </p>
      </div>
    );
  }

  const continentes = ["UEFA", "CONMEBOL", "CONCACAF", "CAF", "AFC", "OFC"];

  // Agrega: para cada continente, pega top 3 IAs por média de pts naquele continente
  const topPorContinente: Record<
    string,
    { slug: string; nome: string; media: number; jogos: number }[]
  > = {};
  for (const c of continentes) {
    const lista = a.perfis
      .map((p) => ({
        slug: p.slug,
        nome: p.nome_display,
        media: p.acerto_por_continente?.[c]?.media_pts ?? 0,
        jogos: p.acerto_por_continente?.[c]?.jogos ?? 0,
      }))
      .filter((x) => x.jogos >= 2)
      .sort((a, b) => b.media - a.media)
      .slice(0, 3);
    topPorContinente[c] = lista;
  }

  const RANKING_LABELS: Record<string, { titulo: string; emoji: string; fmt: (v: number) => string }> = {
    mais_empates_palpitados: { titulo: "Apostam mais em empate", emoji: "🤝", fmt: (v) => `${Math.round(v * 100)}%` },
    menos_empates_palpitados: { titulo: "Quase nunca apostam empate", emoji: "🚫", fmt: (v) => `${Math.round(v * 100)}%` },
    mais_goleadeiras: { titulo: "Mais goleadeiras (gols/jogo)", emoji: "⚽⚽", fmt: (v) => v.toFixed(2) },
    mais_conservadoras: { titulo: "Mais conservadoras (gols/jogo)", emoji: "🥱", fmt: (v) => v.toFixed(2) },
    mais_alinhadas_cristal: { titulo: "Manada — apostam com a maioria", emoji: "🐑", fmt: (v) => `${Math.round(v * 100)}%` },
    mais_contrarian: { titulo: "Contrarian — fogem da manada", emoji: "🎭", fmt: (v) => `${Math.round(v * 100)}%` },
    maior_taxa_exato: { titulo: "Maior taxa de placar exato", emoji: "🎯", fmt: (v) => `${Math.round(v * 100)}%` },
    melhor_em_jogos_equilibrados: { titulo: "Melhor em jogos sem favorito (média pts/jogo)", emoji: "🧠", fmt: (v) => v.toFixed(1) },
  };

  return (
    <div style={{ marginTop: 32, marginBottom: 64 }}>
      <header style={{ textAlign: "center", marginBottom: 32 }}>
        <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)" }}>🔬 Análise das IAs</h1>
        <p className="lede" style={{ marginTop: 12, maxWidth: 720, marginInline: "auto" }}>
          {a.n_ias} IAs analisadas em {a.n_jogos_encerrados} jogos encerrados.
          Como cada uma pensa, em que tipo de jogo acerta, e quais formam
          grupos parecidos.
        </p>
      </header>

      {/* CLUSTERS */}
      <section style={{ marginBottom: 48 }}>
        <h2 style={{ marginBottom: 4, fontSize: 26 }}>🧩 Famílias de comportamento</h2>
        <p style={{ color: "var(--fg-mid)", fontSize: 14, marginBottom: 18 }}>
          K-means (k=4) sobre vetor de estilo (empates, gols, saldo) +
          comportamento (concordância com a Bola de Cristal, taxa de placar
          exato, desempenho em jogos equilibrados). Cada IA cai num grupo. O
          que tem badge 🏆 é o que pontua melhor em média no bolão.
        </p>
        <div className="clusters-grid">
          {a.clusters.map((c) => (
            <div
              key={c.id}
              className={`cluster-card${c.eh_lider ? " lider" : ""}`}
              style={{ ["--cor" as string]: CORES_CLUSTER[c.id % CORES_CLUSTER.length] }}
            >
              {c.eh_lider && (
                <span className="cluster-badge" title="Melhor média de pontos no bolão">🏆 Líder</span>
              )}
              <div className="cluster-head">
                <span className="cluster-emoji" aria-hidden>{c.emoji}</span>
                <div className="cluster-head-text">
                  <strong>{c.nome}</strong>
                  <span className="cluster-n">{c.n_ias} IAs · {Math.round(c.media_pontos)} pts médios</span>
                </div>
              </div>
              <p className="cluster-desc">{c.descricao}</p>
              <div className="cluster-stats">
                <div><strong>{Math.round(c.pct_empates_palpitados * 100)}%</strong><span>empates</span></div>
                <div><strong>{c.avg_gols_total.toFixed(1)}</strong><span>gols/jogo</span></div>
                <div><strong>{Math.round(c.concordancia_cristal * 100)}%</strong><span>cristal</span></div>
                <div><strong>{Math.round(c.taxa_exato * 100)}%</strong><span>cravam</span></div>
              </div>
              <div className="cluster-exemplos">
                <span className="cluster-exemplo-lbl">Top 5 por pts:</span>
                <ul>
                  {c.ias_exemplo.map((nome) => (
                    <li key={nome}>{nome}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      <ScatterClusters
        perfis={a.perfis}
        cores={CORES_CLUSTER}
        clusters={a.clusters.map((c) => ({
          id: c.id,
          emoji: c.emoji,
          nome: c.nome,
          eh_lider: c.eh_lider,
        }))}
      />

      {/* RANKINGS */}
      <section style={{ marginTop: 48, marginBottom: 48 }}>
        <h2 style={{ marginBottom: 4, fontSize: 26 }}>🏅 Rankings por traço</h2>
        <p style={{ color: "var(--fg-mid)", fontSize: 14, marginBottom: 18 }}>
          Top 5 por cada característica. Pra saber quem tem que tipo de cabeça.
        </p>
        <div className="rankings-grid">
          {Object.entries(RANKING_LABELS).map(([key, def]) => {
            const lista = a.rankings[key] ?? [];
            return (
              <div key={key} className="ranking-card">
                <h3>
                  <span>{def.emoji}</span> {def.titulo}
                </h3>
                <ol>
                  {lista.map((r) => (
                    <li key={r.slug}>
                      <Link href={`/ia/${encodeURIComponent(r.slug)}`}>
                        <IconeIA slug={r.slug} size={18} />
                        <span className="rk-nome">{r.nome}</span>
                        <span className="rk-valor">{def.fmt(r.valor)}</span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            );
          })}
        </div>
      </section>

      {/* CONTINENTES */}
      <section style={{ marginBottom: 48 }}>
        <h2 style={{ marginBottom: 4, fontSize: 26 }}>🌍 Quem acerta em qual continente</h2>
        <p style={{ color: "var(--fg-mid)", fontSize: 14, marginBottom: 18 }}>
          Top 3 IAs por média de pontos em jogos cruzando cada confederação. Só conta
          IAs com ≥ 2 jogos envolvendo aquele continente.
        </p>
        <div className="continentes-grid">
          {continentes.map((c) => (
            <div
              key={c}
              className="continente-card"
              style={{ ["--cor" as string]: CORES_CONTINENTE[c] }}
            >
              <div className="continente-head">
                <span className="continente-dot" />
                <strong>{NOMES_CONTINENTE[c]}</strong>
                <span className="continente-sub">{c}</span>
              </div>
              <ol>
                {topPorContinente[c].length === 0 && (
                  <li className="continente-vazio">Sem dados ainda.</li>
                )}
                {topPorContinente[c].map((x) => (
                  <li key={x.slug}>
                    <Link href={`/ia/${encodeURIComponent(x.slug)}`}>
                      <IconeIA slug={x.slug} size={18} />
                      <span className="rk-nome">{x.nome}</span>
                      <span className="rk-valor">{x.media.toFixed(1)} pts/jogo</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      {/* HEATMAP SIMILARIDADE */}
      <section style={{ marginBottom: 48 }}>
        <h2 style={{ marginBottom: 4, fontSize: 26 }}>🔗 Quem palpita parecido</h2>
        <p style={{ color: "var(--fg-mid)", fontSize: 14, marginBottom: 18 }}>
          % de palpites idênticos em jogos comuns. Quanto mais escuro, mais o par
          de IAs "pensa igual". Diagonal = 100% (cada IA consigo mesma).
        </p>
        <HeatmapSimilaridade
          perfis={a.perfis}
          similaridade={a.similaridade}
        />
      </section>

      <p
        style={{
          textAlign: "center",
          color: "var(--fg-muted)",
          fontSize: 11,
          fontFamily: "var(--ff-mono)",
          marginTop: 32,
        }}
      >
        análise gerada em {new Date(a.gerado_em).toLocaleString("pt-BR")}
      </p>

      <style>{`
        .clusters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 14px;
        }
        .cluster-card {
          position: relative;
          background: var(--bg-1);
          border: 1px solid var(--line);
          border-left: 4px solid var(--cor, var(--primary));
          border-radius: var(--r-m);
          padding: 16px;
          overflow: hidden;
        }
        .cluster-card.lider {
          border: 2px solid var(--cor, var(--primary));
          box-shadow: 0 8px 24px color-mix(in srgb, var(--cor, var(--primary)) 25%, transparent);
          background:
            linear-gradient(135deg, color-mix(in srgb, var(--cor, var(--primary)) 6%, var(--bg-1)), var(--bg-1));
        }
        .cluster-badge {
          position: absolute;
          top: 10px; right: 10px;
          padding: 4px 10px;
          background: linear-gradient(135deg, #facc15, #f59e0b);
          color: #1a1300;
          border-radius: 999px;
          font-family: var(--ff-mono);
          font-size: 10px; font-weight: 900;
          letter-spacing: 0.05em;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.45);
        }
        .cluster-head {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 10px;
        }
        .cluster-emoji {
          font-size: 32px; line-height: 1;
          flex-shrink: 0;
        }
        .cluster-head-text {
          display: flex; flex-direction: column;
          min-width: 0;
        }
        .cluster-head-text strong {
          font-family: var(--ff-display);
          font-size: 20px; font-weight: 900;
          color: var(--cor, var(--primary));
          line-height: 1.1;
        }
        .cluster-n {
          font-family: var(--ff-mono);
          font-size: 11px; color: var(--fg-muted);
          margin-top: 2px;
        }
        .cluster-desc {
          margin: 0 0 12px;
          font-size: 13px; line-height: 1.5;
          color: var(--fg-mid);
        }
        .cluster-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
          margin-bottom: 12px;
          padding: 8px;
          background: var(--bg-soft);
          border-radius: var(--r-s);
        }
        .cluster-stats div {
          display: flex; flex-direction: column;
          align-items: center; text-align: center;
        }
        .cluster-stats strong {
          font-family: var(--ff-display);
          font-size: 16px;
          color: var(--fg);
        }
        .cluster-stats span {
          font-family: var(--ff-mono);
          font-size: 9px;
          color: var(--fg-muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .cluster-exemplos { font-size: 12px; }
        .cluster-exemplo-lbl {
          font-family: var(--ff-mono);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--fg-muted);
        }
        .cluster-exemplos ul {
          margin: 4px 0 0; padding-left: 18px;
          color: var(--fg);
        }
        .cluster-exemplos li { padding: 1px 0; }

        .rankings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 14px;
        }
        .ranking-card {
          background: var(--bg-1);
          border: 1px solid var(--line);
          border-radius: var(--r-m);
          padding: 14px;
        }
        .ranking-card h3 {
          font-size: 14px;
          margin: 0 0 10px;
          display: flex; gap: 6px; align-items: center;
        }
        .ranking-card h3 span:first-child { font-size: 16px; }
        .ranking-card ol {
          margin: 0; padding: 0; list-style: none;
          counter-reset: rk;
        }
        .ranking-card ol li {
          counter-increment: rk;
        }
        .ranking-card ol li a {
          display: flex; align-items: center; gap: 8px;
          padding: 6px 8px;
          color: var(--fg);
          text-decoration: none;
          border-radius: var(--r-s);
          font-size: 13px;
        }
        .ranking-card ol li a:hover { background: var(--bg-soft); }
        .ranking-card ol li a::before {
          content: counter(rk) "º";
          font-family: var(--ff-mono);
          font-size: 11px; font-weight: 700;
          color: var(--fg-muted);
          min-width: 18px;
        }
        .rk-nome {
          flex: 1; min-width: 0;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .rk-valor {
          font-family: var(--ff-mono);
          font-weight: 800;
          color: var(--secondary);
          flex-shrink: 0;
        }

        .continentes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 14px;
        }
        .continente-card {
          background: var(--bg-1);
          border: 1px solid var(--line);
          border-left: 4px solid var(--cor);
          border-radius: var(--r-m);
          padding: 14px;
        }
        .continente-head {
          display: flex; align-items: center; gap: 8px;
          margin-bottom: 10px;
        }
        .continente-dot {
          width: 10px; height: 10px; border-radius: 50%;
          background: var(--cor);
        }
        .continente-head strong {
          font-size: 16px; font-weight: 800; color: var(--cor);
        }
        .continente-sub {
          margin-left: auto;
          font-family: var(--ff-mono);
          font-size: 10px;
          color: var(--fg-muted);
        }
        .continente-card ol {
          margin: 0; padding: 0; list-style: none;
        }
        .continente-card ol li a {
          display: flex; align-items: center; gap: 8px;
          padding: 5px 6px;
          color: var(--fg);
          text-decoration: none;
          border-radius: var(--r-s);
          font-size: 13px;
        }
        .continente-card ol li a:hover { background: var(--bg-soft); }
        .continente-vazio {
          color: var(--fg-muted);
          font-style: italic;
          padding: 6px;
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}
