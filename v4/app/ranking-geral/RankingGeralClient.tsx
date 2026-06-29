"use client";

import { useState, useMemo } from "react";
import { ehSerieA } from "@/lib/serie-a";
import Avatar from "@/components/Avatar";

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

      {/* Card com tabela */}
      <div className="card">
        {vazia ? (
          <div
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
          <div className="table-scroll">
            <table className="ranking-table">
              <thead>
                <tr>
                  <th className="pos">#</th>
                  <th>Tipo</th>
                  <th>Quem</th>
                  <th style={{ textAlign: "right" }}>Pts</th>
                  <th style={{ textAlign: "right", fontSize: 12, color: "var(--fg-muted)" }}>
                    Exatos
                  </th>
                  <th style={{ textAlign: "right", fontSize: 12, color: "var(--fg-muted)" }}>
                    Jogos
                  </th>
                </tr>
              </thead>
              <tbody>
                {ordenadas.slice(0, limite).map((l, i) => (
                  <tr
                    key={`${l.tipo}-${l.slug ?? l.nome}-${l.v2 ? "v2" : "v1"}`}
                    style={
                      l.v2
                        ? {
                            background:
                              "color-mix(in srgb, var(--accent) 9%, transparent)",
                          }
                        : undefined
                    }
                  >
                    <td className="pos">{ranks[i]}º</td>
                    <td>
                      <BadgeTipo l={l} />
                    </td>
                    <td className="nome">
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        {l.tipo === "humano" && (
                          <Avatar
                            src={l.avatar_url ?? null}
                            nome={l.nome}
                            size={32}
                          />
                        )}
                        {l.nome}
                      </span>
                      {l.v2 && (
                        <>
                          {" "}
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              padding: "1px 6px",
                              borderRadius: 999,
                              background:
                                "linear-gradient(135deg, var(--accent), var(--accent-2))",
                              color: "var(--secondary)",
                            }}
                          >
                            v2 🔄
                          </span>
                          {l.delta != null && l.delta !== 0 && (
                            <span
                              style={{
                                marginLeft: 6,
                                fontSize: 12,
                                fontWeight: 700,
                                color:
                                  l.delta > 0
                                    ? "var(--ok, #16a34a)"
                                    : "var(--err, #dc2626)",
                              }}
                            >
                              {l.delta > 0 ? `+${l.delta}` : l.delta}
                            </span>
                          )}
                        </>
                      )}
                    </td>
                    <td className="pts">{l[fase].pontos}</td>
                    <td
                      style={{
                        textAlign: "right",
                        fontSize: 13,
                        color: "var(--fg-muted)",
                      }}
                    >
                      {l[fase].placares_exatos}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        fontSize: 13,
                        color: "var(--fg-muted)",
                      }}
                    >
                      {l[fase].jogos_palpitados}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
