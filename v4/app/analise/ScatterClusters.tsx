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

type ClusterMeta = {
  id: number;
  emoji: string;
  nome: string;
  eh_lider: boolean;
};

const EIXOS = [
  {
    id: "estilo",
    x: "avg_gols_total",
    y: "pct_empates_palpitados",
    xl: "Gols por jogo previstos →",
    yl: "% de palpites em empate ↑",
  },
  {
    id: "comportamento",
    x: "concordancia_cristal",
    y: "taxa_exato",
    xl: "Concordância com a Bola de Cristal →",
    yl: "Taxa de placar exato ↑",
  },
] as const;

type EixoId = (typeof EIXOS)[number]["id"];

export default function ScatterClusters({
  perfis,
  cores,
  clusters,
}: {
  perfis: Perfil[];
  cores: string[];
  clusters: ClusterMeta[];
}) {
  const [eixo, setEixo] = useState<EixoId>("estilo");
  const [hover, setHover] = useState<string | null>(null);
  const def = EIXOS.find((e) => e.id === eixo)!;

  const W = 720,
    H = 500,
    ML = 70,
    MR = 30,
    MT = 30,
    MB = 60;
  const plotW = W - ML - MR;
  const plotH = H - MT - MB;

  const calc = useMemo(() => {
    const xs = perfis.map((p) => p[def.x as keyof Perfil] as number);
    const ys = perfis.map((p) => p[def.y as keyof Perfil] as number);
    const xMin = Math.min(...xs),
      xMax = Math.max(...xs);
    const yMin = Math.min(...ys),
      yMax = Math.max(...ys);
    const xPad = (xMax - xMin) * 0.12 || 0.1;
    const yPad = (yMax - yMin) * 0.12 || 0.1;
    const xLo = xMin - xPad,
      xHi = xMax + xPad;
    const yLo = yMin - yPad,
      yHi = yMax + yPad;
    const sx = (v: number) => ML + ((v - xLo) / (xHi - xLo)) * plotW;
    const sy = (v: number) => MT + plotH - ((v - yLo) / (yHi - yLo)) * plotH;
    const items = perfis.map((p) => ({
      slug: p.slug,
      nome: p.nome_display,
      x: sx(p[def.x as keyof Perfil] as number),
      y: sy(p[def.y as keyof Perfil] as number),
      vx: p[def.x as keyof Perfil] as number,
      vy: p[def.y as keyof Perfil] as number,
      r: 9 + Math.sqrt(Math.max(0, p.pontos)) * 1.2,
      cluster: p.cluster,
      serieA: p.serie_a,
      pontos: p.pontos,
    }));
    // centroide de cada cluster pra plantar rótulos
    const centroides: Record<
      number,
      { x: number; y: number; n: number }
    > = {};
    for (const it of items) {
      const c = centroides[it.cluster] ?? { x: 0, y: 0, n: 0 };
      c.x += it.x;
      c.y += it.y;
      c.n += 1;
      centroides[it.cluster] = c;
    }
    const labels = Object.entries(centroides).map(([cid, c]) => ({
      cid: Number(cid),
      x: c.x / c.n,
      y: c.y / c.n,
    }));
    return { items, xLo, xHi, yLo, yHi, labels };
  }, [perfis, def, plotW, plotH]);

  const hoverPt = calc.items.find((it) => it.slug === hover);

  return (
    <section style={{ marginBottom: 48 }}>
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 10,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
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
      <p
        style={{ color: "var(--fg-mid)", fontSize: 13, marginBottom: 12 }}
      >
        Cada bolha = IA. Cor = cluster. Tamanho cresce com os pontos. Borda
        prateada = Série A. Passa o mouse pra ver o nome.
      </p>
      <div className="scl-card">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          preserveAspectRatio="xMidYMid meet"
          style={{ display: "block" }}
        >
          {/* defs: glow filter + gradients radiais por cluster */}
          <defs>
            <filter id="scl-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="scl-strong-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {cores.map((cor, i) => (
              <radialGradient key={i} id={`scl-grad-${i}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={cor} stopOpacity="0.95" />
                <stop offset="70%" stopColor={cor} stopOpacity="0.75" />
                <stop offset="100%" stopColor={cor} stopOpacity="0.35" />
              </radialGradient>
            ))}
            {/* tinta de fundo do plot */}
            <linearGradient id="scl-bg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(168, 85, 247, 0.06)" />
              <stop offset="100%" stopColor="rgba(168, 85, 247, 0.00)" />
            </linearGradient>
          </defs>

          {/* fundo do plot */}
          <rect
            x={ML}
            y={MT}
            width={plotW}
            height={plotH}
            fill="url(#scl-bg)"
            rx="12"
          />

          {/* grid leve */}
          {[0.25, 0.5, 0.75].map((t, i) => {
            const y = MT + (1 - t) * plotH;
            const x = ML + t * plotW;
            return (
              <g key={i} opacity="0.25">
                <line x1={ML} y1={y} x2={ML + plotW} y2={y} stroke="var(--line)" strokeDasharray="2 4" />
                <line x1={x} y1={MT} x2={x} y2={MT + plotH} stroke="var(--line)" strokeDasharray="2 4" />
              </g>
            );
          })}

          {/* axis labels mínimos */}
          {[0, 0.5, 1].map((t, i) => {
            const v = calc.xLo + t * (calc.xHi - calc.xLo);
            const x = ML + t * plotW;
            return (
              <text
                key={`xl-${i}`}
                x={x}
                y={H - MB + 18}
                textAnchor="middle"
                fontSize="11"
                fill="var(--fg-muted)"
                fontFamily="var(--ff-mono)"
              >
                {def.x === "avg_gols_total" ? v.toFixed(1) : `${Math.round(v * 100)}%`}
              </text>
            );
          })}
          {[0, 0.5, 1].map((t, i) => {
            const v = calc.yLo + t * (calc.yHi - calc.yLo);
            const y = MT + (1 - t) * plotH;
            return (
              <text
                key={`yl-${i}`}
                x={ML - 10}
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fill="var(--fg-muted)"
                fontFamily="var(--ff-mono)"
              >{`${Math.round(v * 100)}%`}</text>
            );
          })}

          <text
            x={W / 2}
            y={H - 12}
            textAnchor="middle"
            fontSize="12"
            fill="var(--fg-mid)"
            fontFamily="var(--ff-mono)"
          >
            {def.xl}
          </text>
          <text
            transform={`translate(18 ${H / 2}) rotate(-90)`}
            textAnchor="middle"
            fontSize="12"
            fill="var(--fg-mid)"
            fontFamily="var(--ff-mono)"
          >
            {def.yl}
          </text>

          {/* halos por trás dos pontos pra fluffy */}
          {calc.items.map((it) => {
            const dim = hover && hover !== it.slug;
            return (
              <circle
                key={`halo-${it.slug}`}
                cx={it.x}
                cy={it.y}
                r={it.r * 1.6}
                fill={cores[it.cluster % cores.length]}
                opacity={dim ? 0.04 : 0.12}
                style={{ transition: "opacity 0.2s ease" }}
              />
            );
          })}

          {/* bolhas */}
          {calc.items.map((it) => {
            const dim = hover && hover !== it.slug;
            const focus = hover === it.slug;
            return (
              <g key={it.slug}>
                <circle
                  cx={it.x}
                  cy={it.y}
                  r={focus ? it.r * 1.18 : it.r}
                  fill={`url(#scl-grad-${it.cluster % cores.length})`}
                  fillOpacity={dim ? 0.2 : 1}
                  stroke={it.serieA ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.18)"}
                  strokeWidth={it.serieA ? 2.5 : 1}
                  filter={focus ? "url(#scl-strong-glow)" : undefined}
                  onMouseEnter={() => setHover(it.slug)}
                  onMouseLeave={() => setHover(null)}
                  style={{
                    cursor: "pointer",
                    transition: "fill-opacity 0.2s ease, r 0.2s ease",
                  }}
                />
              </g>
            );
          })}

          {/* rótulos de cluster no centróide */}
          {calc.labels.map((l) => {
            const meta = clusters.find((c) => c.id === l.cid);
            if (!meta) return null;
            const cor = cores[l.cid % cores.length];
            return (
              <g key={l.cid} pointerEvents="none">
                <rect
                  x={l.x - 70}
                  y={l.y - 16}
                  width="140"
                  height="32"
                  rx="16"
                  fill="rgba(10, 12, 25, 0.78)"
                  stroke={cor}
                  strokeWidth="1.5"
                />
                <text
                  x={l.x}
                  y={l.y + 5}
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="800"
                  fontFamily="var(--ff-display)"
                  fill="#fff"
                >
                  {meta.emoji} {meta.nome}
                  {meta.eh_lider ? " 🏆" : ""}
                </text>
              </g>
            );
          })}

          {/* tooltip do hover */}
          {hoverPt && (
            <g pointerEvents="none">
              <rect
                x={Math.min(hoverPt.x + 14, W - 200)}
                y={Math.max(hoverPt.y - 40, 10)}
                width="186"
                height="50"
                rx="8"
                fill="rgba(10, 12, 25, 0.92)"
                stroke="rgba(255,255,255,0.18)"
              />
              <text
                x={Math.min(hoverPt.x + 22, W - 192)}
                y={Math.max(hoverPt.y - 22, 28)}
                fontSize="12"
                fill="#fff"
                fontFamily="var(--ff-display)"
                fontWeight="800"
              >
                {hoverPt.nome}
              </text>
              <text
                x={Math.min(hoverPt.x + 22, W - 192)}
                y={Math.max(hoverPt.y - 6, 44)}
                fontSize="11"
                fill="#a1a1aa"
                fontFamily="var(--ff-mono)"
              >
                {hoverPt.pontos} pts ·{" "}
                {def.x === "avg_gols_total"
                  ? `${hoverPt.vx.toFixed(1)} gols`
                  : `${Math.round(hoverPt.vx * 100)}% cristal`}
                {" · "}
                {def.y === "pct_empates_palpitados"
                  ? `${Math.round(hoverPt.vy * 100)}% empate`
                  : `${Math.round(hoverPt.vy * 100)}% exato`}
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
          background:
            radial-gradient(ellipse at center, rgba(168, 85, 247, 0.05), transparent 70%),
            linear-gradient(135deg, #0a0d1a 0%, #1a1238 100%);
          border: 1px solid rgba(168, 85, 247, 0.25);
          border-radius: var(--r-l);
          padding: 12px;
          overflow: hidden;
        }
      `}</style>
    </section>
  );
}
