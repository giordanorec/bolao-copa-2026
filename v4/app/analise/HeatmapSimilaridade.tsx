"use client";

import { useMemo, useState } from "react";

type Perfil = {
  slug: string;
  nome_display: string;
  pontos: number;
  cluster: number;
};

export default function HeatmapSimilaridade({
  perfis,
  similaridade,
}: {
  perfis: Perfil[];
  similaridade: Record<string, Record<string, number>>;
}) {
  const [hover, setHover] = useState<{ a: string; b: string; v: number } | null>(null);

  // Ordena perfis pelo CLUSTER pra agrupar visualmente quem é parecido,
  // depois por pts dentro do cluster.
  const ordenados = useMemo(
    () =>
      [...perfis].sort(
        (a, b) => a.cluster - b.cluster || b.pontos - a.pontos,
      ),
    [perfis],
  );

  const n = ordenados.length;
  const CELL = 11;
  const GAP_CLUSTER = 4;
  const PAD = 4;
  // posição de cada slug -> { idx, posOffset (acrescenta gap entre clusters) }
  const positions = useMemo(() => {
    const out: Record<string, number> = {};
    let off = 0;
    let prevCluster = -1;
    ordenados.forEach((p, i) => {
      if (i > 0 && p.cluster !== prevCluster) off += GAP_CLUSTER;
      out[p.slug] = i * CELL + off;
      prevCluster = p.cluster;
    });
    return out;
  }, [ordenados]);

  const lastIdx = ordenados[n - 1];
  const total = (lastIdx ? positions[lastIdx.slug] : 0) + CELL + PAD * 2;

  // Cor por similaridade. Quanto maior, mais escura (roxo).
  function cor(v: number): string {
    const a = Math.min(1, Math.max(0.05, v));
    return `rgba(168, 85, 247, ${a})`;
  }

  return (
    <div className="hm-wrap">
      <div className="hm-scroll">
        <svg
          width={total}
          height={total}
          style={{ display: "block" }}
        >
          {ordenados.map((a) =>
            ordenados.map((b) => {
              const v = similaridade[a.slug]?.[b.slug] ?? 0;
              const x = positions[a.slug] + PAD;
              const y = positions[b.slug] + PAD;
              return (
                <rect
                  key={`${a.slug}-${b.slug}`}
                  x={x}
                  y={y}
                  width={CELL - 1}
                  height={CELL - 1}
                  fill={cor(v)}
                  onMouseEnter={() =>
                    setHover({ a: a.nome_display, b: b.nome_display, v })
                  }
                  onMouseLeave={() => setHover(null)}
                  style={{ cursor: "pointer" }}
                />
              );
            }),
          )}
        </svg>
      </div>

      {hover && (
        <div className="hm-tooltip" role="status">
          <strong>{hover.a}</strong> × <strong>{hover.b}</strong>
          <span className="hm-tooltip-v">
            {Math.round(hover.v * 100)}% iguais
          </span>
        </div>
      )}

      <div className="hm-legenda">
        <span>Menos parecidas</span>
        <div className="hm-gradient" />
        <span>Mais parecidas</span>
      </div>

      <style>{`
        .hm-wrap {
          background: var(--bg-1);
          border: 1px solid var(--line);
          border-radius: var(--r-m);
          padding: 12px;
        }
        .hm-scroll {
          overflow: auto;
          max-width: 100%;
        }
        .hm-tooltip {
          margin-top: 10px;
          padding: 8px 12px;
          background: var(--bg-soft);
          border-radius: var(--r-s);
          font-size: 13px;
          display: flex; gap: 8px; align-items: center;
          flex-wrap: wrap;
        }
        .hm-tooltip-v {
          margin-left: auto;
          font-family: var(--ff-mono);
          font-weight: 800;
          color: var(--primary);
        }
        .hm-legenda {
          display: flex; align-items: center; gap: 10px;
          margin-top: 10px;
          font-family: var(--ff-mono);
          font-size: 10px;
          color: var(--fg-muted);
        }
        .hm-gradient {
          flex: 1;
          height: 8px; border-radius: 4px;
          background: linear-gradient(
            90deg,
            rgba(168, 85, 247, 0.05),
            rgba(168, 85, 247, 1)
          );
        }
      `}</style>
    </div>
  );
}
