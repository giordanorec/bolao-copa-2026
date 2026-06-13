"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { marcaDe } from "@/lib/ias";

type IA = {
  slug: string;
  nome_display: string;
  pontos: number;
};

type Frame = {
  jogoNum: number;
  rotulo: string;
  pts: Record<string, number>;
};

const TOPO = 100;

export default function GraficoDistancia({
  ias,
  frames,
}: {
  ias: IA[];
  frames: Frame[];
}) {
  // Pra cada frame, calcula o lider e converte cada IA pra (100 - delta)
  const data = frames.map((f) => {
    const ptsFrame = ias.map((ia) => f.pts[ia.slug] ?? 0);
    const maxPts = Math.max(0, ...ptsFrame);
    const ponto: Record<string, string | number> = {
      rodada: f.jogoNum === 0 ? "Início" : `Jogo ${f.jogoNum}`,
      _max: maxPts,
    };
    for (const ia of ias) {
      const pts = f.pts[ia.slug] ?? 0;
      // Y = 100 - (lider - pts) = 100 - delta
      // Se a IA é o líder ou empata com ele: Y = 100
      // Se está 30 pts atrás: Y = 70
      const delta = maxPts - pts;
      ponto[ia.nome_display] = TOPO - delta;
    }
    return ponto;
  });

  return (
    <div
      style={{
        background: "var(--bg-2)",
        border: "1px solid var(--line)",
        borderRadius: "var(--r-l)",
        padding: 20,
      }}
    >
      <div
        style={{
          marginBottom: 12,
          fontSize: 12,
          color: "var(--fg-muted)",
          fontFamily: "var(--ff-mono)",
        }}
      >
        Y = {TOPO} − (líder − IA). Quem está em {TOPO} é o líder do momento.
        Quanto mais baixa a linha, mais atrás do líder.
      </div>
      <div style={{ width: "100%", height: 480 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 12, right: 20, left: 0, bottom: 8 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--line)"
              vertical={false}
            />
            <XAxis
              dataKey="rodada"
              tick={{
                fill: "var(--fg-mid)",
                fontSize: 12,
                fontFamily: "var(--ff-mono)",
              }}
              tickLine={{ stroke: "var(--line)" }}
              axisLine={{ stroke: "var(--line)" }}
            />
            <YAxis
              domain={[0, TOPO]}
              tick={{
                fill: "var(--fg-mid)",
                fontSize: 12,
                fontFamily: "var(--ff-mono)",
              }}
              tickLine={{ stroke: "var(--line)" }}
              axisLine={{ stroke: "var(--line)" }}
              label={{
                value: "Distância do líder",
                angle: -90,
                position: "insideLeft",
                offset: 16,
                style: {
                  fill: "var(--fg-muted)",
                  fontSize: 11,
                  fontFamily: "var(--ff-mono)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                },
              }}
            />
            <ReferenceLine
              y={TOPO}
              stroke="var(--accent)"
              strokeDasharray="3 3"
              label={{
                value: "LÍDER",
                fill: "var(--accent)",
                fontSize: 10,
                fontFamily: "var(--ff-mono)",
                position: "insideTopRight",
              }}
            />
            <Tooltip
              contentStyle={{
                background: "var(--bg-1)",
                border: "1px solid var(--line-strong)",
                borderRadius: 12,
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--fg)", fontWeight: 700 }}
              itemStyle={{ color: "var(--fg-mid)" }}
              formatter={(value) => {
                const n = typeof value === "number" ? value : Number(value);
                if (Number.isNaN(n)) return String(value);
                return `${n} (${TOPO - n} pts atrás)`;
              }}
            />
            <Legend
              wrapperStyle={{
                paddingTop: 12,
                fontSize: 11,
                fontFamily: "var(--ff-mono)",
              }}
            />
            {ias.map((ia) => {
              const marca = marcaDe(ia.slug);
              return (
                <Line
                  key={ia.slug}
                  type="monotone"
                  dataKey={ia.nome_display}
                  stroke={marca.cor}
                  strokeWidth={2.5}
                  dot={{ r: 4, strokeWidth: 0, fill: marca.cor }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
                  isAnimationActive={false}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
