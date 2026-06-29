"use client";

import { useState, useMemo } from "react";
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

export type RankingGeralLabels = {
  faseGrupos: string;
  faseMatamata: string;
  faseGeral: string;
  nivelSerieA: string;
  nivelMaisIAs: string;
  nivelTodas: string;
  toggleV2: string;
  // Templates com placeholders {n}, {nIAs}, {nHumanos} —
  // funções não cruzam a fronteira server→client (Next.js 15).
  competidoresTpl: string; // "{n} competidores nessa visão"
  mostrandoSerieA: string;
  mostrandoIAsTpl: string; // "{n} IAs + Bola de Cristal"
  mostrandoTodasTpl: string; // "{nIAs} IAs + Bola de Cristal + {nHumanos} humanos opt-in"
  matamataVazio: string;
  matamataVazioDesc: string;
  cristal: string;
  humano: string;
  serieA: string;
  ia: string;
  exatosTpl: string; // "{n} exatos"
  jogosTpl: string; // "{n} jogos"
};

function fmt(tpl: string, vars: Record<string, string | number>): string {
  return tpl.replace(/\{(\w+)\}/g, (_m, k) => String(vars[k] ?? ""));
}

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

function BadgeTipo({ l, labels }: { l: LinhaFase; labels: RankingGeralLabels }) {
  if (l.tipo === "cristal")
    return <span style={{ color: "var(--accent)" }}>🔮 {labels.cristal}</span>;
  if (l.tipo === "humano")
    return <span style={{ color: "var(--primary)" }}>👤 {labels.humano}</span>;
  if (l.serieA)
    return (
      <span style={{ color: "var(--secondary)", fontWeight: 700 }}>
        🏆 {labels.serieA}
      </span>
    );
  return <span style={{ color: "var(--fg-muted)" }}>🤖 {labels.ia}</span>;
}

export default function RankingGeralClient({
  linhas,
  contribuinte,
  labels,
}: {
  linhas: LinhaFase[];
  contribuinte: boolean;
  labels: RankingGeralLabels;
}) {
  const [fase, setFase] = useState<Fase>("geral");
  const [nivel, setNivel] = useState<Nivel>(1);
  const [mostrarV2, setMostrarV2] = useState(false);

  const linhasFiltradas = useMemo(() => {
    return linhas.filter((l) => {
      // v2 só aparece se toggle ativo
      if (l.v2) return contribuinte && mostrarV2;
      // Cristal aparece em todos os níveis
      if (l.tipo === "cristal") return true;
      // Humanos só no nível 3
      if (l.tipo === "humano") return nivel === 3;
      // IAs Série A: níveis 1, 2, 3
      if (l.serieA) return true;
      // Demais IAs: níveis 2, 3
      return nivel >= 2;
    });
  }, [linhas, nivel, contribuinte, mostrarV2]);

  const ordenadas = useMemo(() => ordenar(linhasFiltradas, fase), [linhasFiltradas, fase]);
  const ranks = useMemo(() => colocacoes(ordenadas, fase), [ordenadas, fase]);

  const vazia = fase === "matamata" && ordenadas.every((l) => l.matamata.pontos === 0);
  const limite = contribuinte ? 400 : 200;

  const numHumanos = linhas.filter((l) => l.tipo === "humano").length;
  const numIAs = linhas.filter((l) => l.tipo === "ia" && !l.v2).length;

  // Contador de competidores na visão atual (excluindo v2 linhas p/ contar)
  const totalVisiveis = linhasFiltradas.filter((l) => !l.v2).length;

  const legendaAtual =
    nivel === 1
      ? labels.mostrandoSerieA
      : nivel === 2
        ? fmt(labels.mostrandoIAsTpl, { n: numIAs })
        : fmt(labels.mostrandoTodasTpl, { nIAs: numIAs, nHumanos: numHumanos });

  const chipFase: { key: Fase; label: string }[] = [
    { key: "grupos", label: labels.faseGrupos },
    { key: "matamata", label: labels.faseMatamata },
    { key: "geral", label: labels.faseGeral },
  ];

  const chipNivel: { key: Nivel; label: string }[] = [
    { key: 1, label: labels.nivelSerieA },
    { key: 2, label: labels.nivelMaisIAs },
    { key: 3, label: labels.nivelTodas },
  ];

  return (
    <>
      {/* Abas de fase */}
      <div
        style={{
          display: "flex",
          gap: 8,
          justifyContent: "center",
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        {chipFase.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFase(key)}
            style={{
              padding: "8px 22px",
              borderRadius: 999,
              border: `2px solid ${fase === key ? "var(--primary)" : "var(--line-strong)"}`,
              background:
                fase === key
                  ? "color-mix(in srgb, var(--primary) 12%, transparent)"
                  : "var(--bg-2)",
              color: fase === key ? "var(--primary)" : "var(--fg)",
              fontWeight: fase === key ? 700 : 500,
              fontSize: 14,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Filtro de escopo */}
      <div
        style={{
          display: "flex",
          gap: 8,
          justifyContent: "center",
          marginBottom: 8,
          flexWrap: "wrap",
        }}
      >
        {chipNivel.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setNivel(key)}
            style={{
              padding: "6px 16px",
              borderRadius: 999,
              border: `1.5px solid ${nivel === key ? "var(--secondary)" : "var(--line)"}`,
              background:
                nivel === key
                  ? "color-mix(in srgb, var(--secondary) 10%, transparent)"
                  : "var(--bg-1)",
              color: nivel === key ? "var(--secondary)" : "var(--fg-muted)",
              fontWeight: nivel === key ? 700 : 400,
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "var(--ff-mono)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              transition: "all 0.15s ease",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Toggle v2 (só contribuintes) */}
      {contribuinte && (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
          <button
            onClick={() => setMostrarV2((v) => !v)}
            style={{
              padding: "5px 14px",
              borderRadius: 999,
              border: `1.5px solid ${mostrarV2 ? "var(--accent)" : "var(--line)"}`,
              background: mostrarV2
                ? "color-mix(in srgb, var(--accent) 12%, transparent)"
                : "var(--bg-1)",
              color: mostrarV2 ? "var(--accent)" : "var(--fg-muted)",
              fontWeight: mostrarV2 ? 700 : 400,
              fontSize: 11,
              cursor: "pointer",
              fontFamily: "var(--ff-mono)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              transition: "all 0.15s ease",
            }}
          >
            {labels.toggleV2}
          </button>
        </div>
      )}

      {/* Contador */}
      <p
        style={{
          textAlign: "center",
          fontSize: 13,
          color: "var(--fg-muted)",
          marginBottom: 24,
          fontFamily: "var(--ff-mono)",
        }}
      >
        {fmt(labels.competidoresTpl, { n: totalVisiveis })} · {legendaAtual}
      </p>

      {/* Grid de cards */}
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
            {labels.matamataVazio}
          </h3>
          <p style={{ maxWidth: 480, margin: "0 auto", fontSize: 14, lineHeight: 1.6 }}>
            {labels.matamataVazioDesc}
          </p>
        </div>
      ) : (
        <div
          className="ias-mini-grid"
          style={{ gridTemplateColumns: "1fr", maxWidth: 720, marginInline: "auto" }}
        >
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
                    <BadgeTipo l={l} labels={labels} /> · {fmt(labels.exatosTpl, { n: stats.placares_exatos })} · {fmt(labels.jogosTpl, { n: stats.jogos_palpitados })}
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
    </>
  );
}
