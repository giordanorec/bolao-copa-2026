import Link from "next/link";
import IconeIA from "@/components/IconeIA";
import type { AnaliseV2Publico } from "@/lib/analise-v2-publico";

function Placar({ p }: { p: { a: number; b: number } | null }) {
  if (!p) return <span style={{ opacity: 0.5 }}>—</span>;
  return (
    <span>
      {p.a}×{p.b}
    </span>
  );
}

export default function RetrospectivaV2({ a }: { a: AnaliseV2Publico }) {
  const g = a.agg;
  const cards = [
    {
      valor: `+${g.delta_pct}%`,
      label: "mais pontos com a v2",
      cor: "var(--ok, #16a34a)",
    },
    {
      valor: `${g.pct_mudaram}%`,
      label: "dos palpites mudaram",
      cor: "var(--secondary)",
    },
    {
      valor: `${g.pct_exato_v1}% → ${g.pct_exato_v2}%`,
      label: "taxa de placar exato",
      cor: "var(--accent)",
    },
    {
      valor: `${g.melhoraram} ↑ / ${g.pioraram} ↓`,
      label: `IAs (de ${a.n_ias}) subiram / caíram`,
      cor: "var(--primary)",
    },
  ];

  return (
    <section style={{ marginBottom: 48 }}>
      <h2 style={{ marginBottom: 4, fontSize: 26 }}>
        ✨ As IAs melhoram quando revisam? (v1 → v2)
      </h2>
      <p style={{ color: "var(--fg-mid)", fontSize: 14, marginBottom: 18 }}>
        Em {a.jogos.length} jogos já decididos a partir do #{a.corte_v2}, as IAs
        refizeram os palpites com a Copa rolando (classificação, forma, lesões,
        odds). Aqui a comparação é maçã-com-maçã: os <strong>mesmos jogos</strong>{" "}
        pontuados com o palpite original (v1) e depois com o revisado (v2). Os 40
        primeiros jogos não entram — ali não há revisão. Os palpites v2 dos jogos
        que <strong>ainda vão acontecer</strong> ficam exclusivos pra quem
        colabora, em{" "}
        <Link href="/analise-v2" style={{ color: "var(--secondary)" }}>
          /analise-v2
        </Link>
        .
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 12,
          marginBottom: 24,
        }}
      >
        {cards.map((c) => (
          <div
            key={c.label}
            className="card"
            style={{ padding: "16px 18px", textAlign: "center" }}
          >
            <div
              style={{
                fontSize: 26,
                fontWeight: 900,
                fontFamily: "var(--ff-display)",
                color: c.cor,
              }}
            >
              {c.valor}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--fg-muted)",
                fontFamily: "var(--ff-mono)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginTop: 6,
                lineHeight: 1.3,
              }}
            >
              {c.label}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          alignItems: "start",
        }}
        className="retro-v2-grid"
      >
        {/* Jogo a jogo */}
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 15, marginBottom: 12 }}>
            🗓️ Jogo a jogo — consenso v1 → v2 vs. resultado
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {a.por_jogo.map((j) => {
              const ganho = j.pts_v2 - j.pts_v1;
              return (
                <div
                  key={j.numero}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 4px",
                    borderBottom: "1px solid var(--line)",
                    fontSize: 13,
                  }}
                >
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {j.time_a} {j.gols_a}×{j.gols_b} {j.time_b}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--ff-display)",
                      color: "var(--fg-muted)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Placar p={j.consenso_v1} /> → <Placar p={j.consenso_v2} />
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--ff-mono)",
                      fontWeight: 800,
                      minWidth: 44,
                      textAlign: "right",
                      color:
                        ganho > 0
                          ? "var(--ok, #16a34a)"
                          : ganho < 0
                            ? "var(--err, #dc2626)"
                            : "var(--fg-muted)",
                    }}
                  >
                    {ganho > 0 ? `+${ganho}` : ganho} pts
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quem mais melhorou */}
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 15, marginBottom: 12 }}>
            🚀 Quem mais ganhou com a revisão
          </h3>
          <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {a.destaques.map((d) => (
              <li key={d.slug}>
                <Link
                  href={`/ia/${encodeURIComponent(d.slug)}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "7px 6px",
                    color: "var(--fg)",
                    textDecoration: "none",
                    borderRadius: "var(--r-s)",
                    fontSize: 13,
                  }}
                >
                  <IconeIA slug={d.slug} size={18} />
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {d.nome}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--ff-mono)",
                      color: "var(--fg-muted)",
                      fontSize: 12,
                    }}
                  >
                    {d.v1}→{d.v2}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--ff-mono)",
                      fontWeight: 800,
                      color:
                        d.delta > 0
                          ? "var(--ok, #16a34a)"
                          : d.delta < 0
                            ? "var(--err, #dc2626)"
                            : "var(--fg-muted)",
                      minWidth: 34,
                      textAlign: "right",
                    }}
                  >
                    {d.delta > 0 ? `+${d.delta}` : d.delta}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .retro-v2-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
