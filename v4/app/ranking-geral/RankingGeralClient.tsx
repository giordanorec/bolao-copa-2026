"use client";

import { useState, useMemo } from "react";
import { ehSerieA } from "@/lib/serie-a";
import Avatar from "@/components/Avatar";
import IconeIA from "@/components/IconeIA";

export type LinhaFase = {
  tipo: "humano" | "ia" | "cristal";
  slug?: string;
  nome: string;
  serieA?: boolean;
  v2?: boolean;
  delta?: number | null;
  avatar_url?: string | null;
  // pontos por fase
  grupos: { pontos: number; placares_exatos: number; vencedores_acertados: number; jogos_palpitados: number };
  matamata: { pontos: number; placares_exatos: number; vencedores_acertados: number; jogos_palpitados: number };
  geral: { pontos: number; placares_exatos: number; vencedores_acertados: number; jogos_palpitados: number };
  popularidade?: number;
};

type Fase = "grupos" | "matamata" | "geral";
type Nivel = 1 | 2 | 3;

const LABELS_FASE: Record<Fase, string> = {
  grupos: "Grupos",
  matamata: "Mata-mata",
  geral: "Geral",
};

const LABELS_NIVEL: Record<Nivel, string> = {
  1: "Só Série A",
  2: "Série A + demais IAs",
  3: "Todas as IAs + Humanos",
};

// Desempate: pontos → placares_exatos → vencedores_acertados → popularidade
function ordenar(linhas: LinhaFase[], fase: Fase): LinhaFase[] {
  return [...linhas].sort((a, b) => {
    const fa = a[fase];
    const fb = b[fase];
    if (fb.pontos !== fa.pontos) return fb.pontos - fa.pontos;
    if (fb.placares_exatos !== fa.placares_exatos) return fb.placares_exatos - fa.placares_exatos;
    if (fb.vencedores_acertados !== fa.vencedores_acertados) return fb.vencedores_acertados - fa.vencedores_acertados;
    // popularidade (menor índice = mais popular = melhor)
    return (a.popularidade ?? 999) - (b.popularidade ?? 999);
  });
}

function colocacoes(linhas: LinhaFase[], fase: Fase): number[] {
  let rankAtual = 0;
  let ptsAnterior: number | null = null;
  return linhas.map((l, idx) => {
    const pts = l[fase].pontos;
    if (ptsAnterior === null || pts !== ptsAnterior) {
      rankAtual = idx + 1;
      ptsAnterior = pts;
    }
    return rankAtual;
  });
}

function BadgeTipo({ l }: { l: LinhaFase }) {
  if (l.tipo === "cristal")
    return <span style={{ color: "var(--accent)" }}>🔮 Cristal</span>;
  if (l.tipo === "humano")
    return <span style={{ color: "var(--primary)" }}>👤 Humano</span>;
  if (l.serieA)
    return (
      <span style={{ color: "var(--secondary)", fontWeight: 700 }}>
        🏆 Série A
      </span>
    );
  return <span style={{ color: "var(--fg-muted)" }}>🤖 IA</span>;
}

export default function RankingGeralClient({
  linhas,
  contribuinte,
}: {
  linhas: LinhaFase[];
  contribuinte: boolean;
}) {
  const [fase, setFase] = useState<Fase>("geral");
  const [nivel, setNivel] = useState<Nivel>(1);

  const linhasFiltradas = useMemo(() => {
    return linhas.filter((l) => {
      // Cristal aparece em todos os níveis
      if (l.tipo === "cristal") return true;
      // Humanos só no nível 3
      if (l.tipo === "humano") return nivel === 3;
      // IAs Série A: níveis 1, 2, 3
      if (l.serieA) return true;
      // Demais IAs: níveis 2, 3
      return nivel >= 2;
    });
  }, [linhas, nivel]);

  const ordenadas = useMemo(() => ordenar(linhasFiltradas, fase), [linhasFiltradas, fase]);
  const ranks = useMemo(() => colocacoes(ordenadas, fase), [ordenadas, fase]);

  const vazia = fase === "matamata" && ordenadas.every((l) => l.matamata.pontos === 0);
  const limite = contribuinte ? 400 : 200;

  const numHumanos = linhas.filter((l) => l.tipo === "humano").length;
  const numIAs = linhas.filter((l) => l.tipo === "ia").length;

  return (
    <>
      {/* Abas de fase */}
      <div
        style={{
          display: "flex",
          gap: 8,
          justifyContent: "center",
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        {(["grupos", "matamata", "geral"] as Fase[]).map((f) => (
          <button
            key={f}
            onClick={() => setFase(f)}
            style={{
              padding: "8px 22px",
              borderRadius: 999,
              border: `2px solid ${fase === f ? "var(--primary)" : "var(--line-strong)"}`,
              background:
                fase === f
                  ? "color-mix(in srgb, var(--primary) 12%, transparent)"
                  : "var(--bg-2)",
              color: fase === f ? "var(--primary)" : "var(--fg)",
              fontWeight: fase === f ? 700 : 500,
              fontSize: 14,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {LABELS_FASE[f]}
          </button>
        ))}
      </div>

      {/* Filtro de escopo */}
      <div
        style={{
          display: "flex",
          gap: 8,
          justifyContent: "center",
          marginBottom: 28,
          flexWrap: "wrap",
        }}
      >
        {([1, 2, 3] as Nivel[]).map((n) => (
          <button
            key={n}
            onClick={() => setNivel(n)}
            style={{
              padding: "6px 16px",
              borderRadius: 999,
              border: `1.5px solid ${nivel === n ? "var(--secondary)" : "var(--line)"}`,
              background:
                nivel === n
                  ? "color-mix(in srgb, var(--secondary) 10%, transparent)"
                  : "var(--bg-1)",
              color: nivel === n ? "var(--secondary)" : "var(--fg-muted)",
              fontWeight: nivel === n ? 700 : 400,
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "var(--ff-mono)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              transition: "all 0.15s ease",
            }}
          >
            {LABELS_NIVEL[n]}
          </button>
        ))}
      </div>

      {/* Grid de cards (estilo /ranking-ias) */}
      {vazia ? (
        <div
          className="card"
          style={{
            textAlign: "center",
            padding: "48px 24px",
            color: "var(--fg-muted)",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <h3 style={{ marginBottom: 8, color: "var(--fg)" }}>
            O mata-mata ainda não começou
          </h3>
          <p style={{ maxWidth: 480, margin: "0 auto", fontSize: 14, lineHeight: 1.6 }}>
            Os palpites de todas as IAs para os confrontos do mata-mata já
            estão registrados — assim que os jogos começarem os pontos
            aparecem aqui automaticamente.
          </p>
        </div>
      ) : (
        <div className="ias-mini-grid">
          {ordenadas.slice(0, limite).map((l, i) => {
            const stats = l[fase];
            const isLink = l.tipo === "ia" && l.slug && l.slug !== "bola-de-cristal";
            const cardStyle: React.CSSProperties = l.v2
              ? {
                  background: "color-mix(in srgb, var(--accent) 9%, transparent)",
                  borderColor: "color-mix(in srgb, var(--accent) 30%, var(--line))",
                }
              : {};
            const inner = (
              <>
                <span
                  style={{
                    fontFamily: "var(--ff-mono)",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--fg-muted)",
                    minWidth: 36,
                    textAlign: "right",
                  }}
                >
                  {ranks[i]}º
                </span>
                {l.tipo === "humano" ? (
                  <Avatar src={l.avatar_url ?? null} nome={l.nome} size={36} />
                ) : l.tipo === "cristal" ? (
                  <span style={{ fontSize: 28, lineHeight: 1, width: 36, textAlign: "center" }}>🔮</span>
                ) : (
                  <IconeIA slug={l.slug ?? ""} size={36} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {l.nome}
                    </span>
                    {l.v2 && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: "1px 6px",
                          borderRadius: 999,
                          background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
                          color: "var(--secondary)",
                        }}
                      >
                        v2 🔄
                      </span>
                    )}
                    {l.v2 && l.delta != null && l.delta !== 0 && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: l.delta > 0 ? "var(--ok, #16a34a)" : "var(--err, #dc2626)",
                        }}
                      >
                        {l.delta > 0 ? `+${l.delta}` : l.delta}
                      </span>
                    )}
                  </strong>
                  <small
                    style={{
                      display: "block",
                      fontSize: 11,
                      color: "var(--fg-muted)",
                      fontFamily: "var(--ff-mono)",
                      marginTop: 2,
                    }}
                  >
                    <BadgeTipo l={l} /> · {stats.placares_exatos} exato{stats.placares_exatos === 1 ? "" : "s"} · {stats.jogos_palpitados} jogo{stats.jogos_palpitados === 1 ? "" : "s"}
                  </small>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <strong
                    style={{
                      fontFamily: "var(--ff-display)",
                      fontSize: 22,
                      color: "var(--secondary)",
                      lineHeight: 1,
                    }}
                  >
                    {stats.pontos}
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
              </>
            );
            const key = `${l.tipo}-${l.slug ?? l.nome}-${l.v2 ? "v2" : "v1"}`;
            return isLink ? (
              <a
                key={key}
                href={`/ia/${encodeURIComponent(l.slug ?? "")}`}
                className="ia-mini"
                style={cardStyle}
              >
                {inner}
              </a>
            ) : (
              <div key={key} className="ia-mini" style={cardStyle}>
                {inner}
              </div>
            );
          })}
        </div>
      )}

      {/* Legenda */}
      <p
        style={{
          marginTop: 12,
          fontSize: 13,
          color: "var(--fg-muted)",
          textAlign: "center",
        }}
      >
        {nivel === 1 && "Mostrando: Série A (12 IAs) + Bola de Cristal"}
        {nivel === 2 &&
          `Mostrando: ${numIAs} IAs + Bola de Cristal`}
        {nivel === 3 &&
          `Mostrando: ${numIAs} IAs + Bola de Cristal + ${numHumanos} humanos opt-in`}
      </p>
    </>
  );
}
