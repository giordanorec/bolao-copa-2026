"use client";

import { useMemo, useState } from "react";

type Perfil = {
  slug: string;
  nome_display: string;
  serie_a: boolean;
  pct_empates_palpitados: number;
  avg_gols_total: number;
  concordancia_cristal: number;
  taxa_exato: number;
  pontos: number;
  cluster: number;
};

const EIXOS = [
  { id: "estilo", x: "avg_gols_total", y: "pct_empates_palpitados", xl: "Gols por jogo previstos →", yl: "% de palpites em empate ↑" },
  { id: "comportamento", x: "concordancia_cristal", y: "taxa_exato", xl: "Concordância com a Bola de Cristal →", yl: "Taxa de placar exato ↑" },
] as const;

type EixoId = (typeof EIXOS)[number]["id"];

export default function ScatterClusters({
  perfis,
  cores,
}: {
  perfis: Perfil[];
  cores: string[];
}) {
  const [eixo, setEixo] = useState<EixoId>("estilo");
  const [hover, setHover] = useState<string | null>(null);
  const def = EIXOS.find((e) => e.id === eixo)!;

  const pts = useMemo(() => {
    const xs = perfis.map((p) => p[def.x as keyof Perfil] as number);
    const ys = perfis.map((p) => p[def.y as keyof Perfil] as number);
    const xMin = Math.min(...xs), xMax = Math.max(...xs);
    const yMin = Math.min(...ys), yMax = Math.max(...ys);
    const xPad = (xMax - xMin) * 0.08 || 0.1;
    const yPad = (yMax - yMin) * 0.08 || 0.1;
    const xLo = xMin - xPad, xHi = xMax + xPad;
    const yLo = yMin - yPad, yHi = yMax + yPad;
    const W = 700, H = 460, ML = 60, MR = 20, MT = 20, MB = 50;
    const plotW = W - ML - MR;
    const plotH = H - MT - MB;
    const sx = (v: number) => ML + ((v - xLo) / (xHi - xLo)) * plotW;
    const sy = (v: number) => MT + plotH - ((v - yLo) / (yHi - yLo)) * plotH;
    const items = perfis.map((p) => ({
      slug: p.slug,
      nome: p.nome_display,
      x: sx(p[def.x as keyof Perfil] as number),
      y: sy(p[def.y as keyof Perfil] as number),
      vx: p[def.x as keyof Perfil] as number,
      vy: p[def.y as keyof Perfil] as number,
      r: 4 + Math.sqrt(p.pontos / 4),
      cluster: p.cluster,
      serieA: p.serie_a,
    }));
    return { items, W, H, ML, MR, MT, MB, xLo, xHi, yLo, yHi };
  }, [perfis, def]);

  const hoverPt = pts.items.find((it) => it.slug === hover);

  return (
    <section style={{ marginBottom: 48 }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>📌 Mapa das IAs</h2>
        <div className="scl-toggle">
          {EIXOS.map((e) => (
            <button
              key={e.id}
              type="button"
              className={eixo === e.id ? "ativo" : ""}
              onClick={() => setEixo(e.id)}
            >
              {e.id === "estilo" ? "🎨 Estilo" : "🎯 Comportamento"}
            </button>
          ))}
        </div>
      </div>
      <p style={{ color: "var(--fg-mid)", fontSize: 13, marginBottom: 12 }}>
        Cores = cluster K-means. Tamanho do círculo = pontos. Bordas brancas = Série A.
      </p>
      <div className="scl-card">
        <svg
          viewBox={`0 0 ${pts.W} ${pts.H}`}
          width="100%"
          preserveAspectRatio="xMidYMid meet"
          style={{ display: "block", background: "var(--bg-1)" }}
        >
          {/* eixos */}
          <line x1={pts.ML} y1={pts.H - pts.MB} x2={pts.W - pts.MR} y2={pts.H - pts.MB} stroke="var(--line)" />
          <line x1={pts.ML} y1={pts.MT} x2={pts.ML} y2={pts.H - pts.MB} stroke="var(--line)" />
          {/* eixo X labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
            const v = pts.xLo + t * (pts.xHi - pts.xLo);
            const x = pts.ML + t * (pts.W - pts.ML - pts.MR);
            return (
              <g key={i}>
                <line x1={x} y1={pts.H - pts.MB} x2={x} y2={pts.H - pts.MB + 4} stroke="var(--line)" />
                <text x={x} y={pts.H - pts.MB + 16} textAnchor="middle" fontSize="10" fill="var(--fg-muted)" fontFamily="var(--ff-mono)">
                  {v.toFixed(eixo === "estilo" && def.x === "avg_gols_total" ? 1 : 2)}
                </text>
              </g>
            );
          })}
          {/* eixo Y labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
            const v = pts.yLo + t * (pts.yHi - pts.yLo);
            const y = pts.MT + (1 - t) * (pts.H - pts.MT - pts.MB);
            return (
              <g key={i}>
                <line x1={pts.ML - 4} y1={y} x2={pts.ML} y2={y} stroke="var(--line)" />
                <text x={pts.ML - 8} y={y + 4} textAnchor="end" fontSize="10" fill="var(--fg-muted)" fontFamily="var(--ff-mono)">
                  {`${Math.round(v * 100)}%`}
                </text>
              </g>
            );
          })}
          {/* axis labels */}
          <text x={(pts.W) / 2} y={pts.H - 8} textAnchor="middle" fontSize="11" fill="var(--fg-mid)" fontFamily="var(--ff-mono)">{def.xl}</text>
          <text transform={`translate(14 ${(pts.H) / 2}) rotate(-90)`} textAnchor="middle" fontSize="11" fill="var(--fg-mid)" fontFamily="var(--ff-mono)">{def.yl}</text>
          {/* pontos */}
          {pts.items.map((it) => {
            const cor = cores[it.cluster % cores.length];
            return (
              <g key={it.slug}>
                <circle
                  cx={it.x}
                  cy={it.y}
                  r={it.r}
                  fill={cor}
                  fillOpacity={hover && hover !== it.slug ? 0.18 : 0.75}
                  stroke={it.serieA ? "#fff" : cor}
                  strokeWidth={it.serieA ? 2 : 0}
                  style={{ cursor: "pointer", transition: "fill-opacity 0.15s ease" }}
                  onMouseEnter={() => setHover(it.slug)}
                  onMouseLeave={() => setHover(null)}
                />
              </g>
            );
          })}
          {/* tooltip do hover */}
          {hoverPt && (
            <g pointerEvents="none">
              <rect
                x={hoverPt.x + 10}
                y={hoverPt.y - 30}
                width="180"
                height="44"
                rx="6"
                fill="rgba(0,0,0,0.85)"
              />
              <text x={hoverPt.x + 16} y={hoverPt.y - 14} fontSize="11" fill="#fff" fontFamily="var(--ff-display)" fontWeight="700">
                {hoverPt.nome}
              </text>
              <text x={hoverPt.x + 16} y={hoverPt.y + 1} fontSize="10" fill="#a1a1aa" fontFamily="var(--ff-mono)">
                {def.x === "avg_gols_total" ? `${hoverPt.vx.toFixed(1)} gols/jogo` : `${Math.round(hoverPt.vx * 100)}% concordância`}
                {" · "}
                {def.y === "pct_empates_palpitados" ? `${Math.round(hoverPt.vy * 100)}% empates`
                  : def.y === "taxa_exato" ? `${Math.round(hoverPt.vy * 100)}% exato`
                  : hoverPt.vy.toFixed(2)}
              </text>
            </g>
          )}
        </svg>
      </div>
      <style>{`
        .scl-toggle {
          display: inline-flex; gap: 0;
          background: var(--bg-1); border: 1px solid var(--line);
          border-radius: var(--r-s); padding: 3px;
        }
        .scl-toggle button {
          background: transparent; border: none;
          padding: 6px 12px;
          font-family: var(--ff-mono);
          font-size: 12px; font-weight: 700;
          color: var(--fg-muted); cursor: pointer;
          border-radius: calc(var(--r-s) - 2px);
        }
        .scl-toggle button.ativo {
          background: var(--primary); color: #fff;
        }
        .scl-card {
          background: var(--bg-1);
          border: 1px solid var(--line);
          border-radius: var(--r-m);
          padding: 8px;
        }
      `}</style>
    </section>
  );
}
