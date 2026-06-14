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

export default function GraficoDistancia({
  ias,
  frames,
}: {
  ias: IA[];
  frames: Frame[];
}) {
  // Pra cada frame:
  // - calcula min e max dos pts entre as IAs mostradas
  // - mid = (min + max) / 2
  // - range = (max - min) / 2  (com floor de 1 pra evitar /0)
  // - Y = 50 + ((pts - mid) / range) * 40
  //   -> pts == max  -> Y = 90
  //   -> pts == mid  -> Y = 50
  //   -> pts == min  -> Y = 10
  const data = frames.map((f) => {
    const ptsFrame = ias.map((ia) => f.pts[ia.slug] ?? 0);
    const min = Math.min(...ptsFrame);
    const max = Math.max(...ptsFrame);
    const mid = (min + max) / 2;
    const range = Math.max(1, (max - min) / 2);
    const ponto: Record<string, string | number> = {
      rodada: f.jogoNum === 0 ? "Início" : `Jogo ${f.jogoNum}`,
      _max: max,
      _min: min,
    };
    for (const ia of ias) {
      const pts = f.pts[ia.slug] ?? 0;
      const y = 50 + ((pts - mid) / range) * 40;
      ponto[ia.nome_display] = Math.round(y * 10) / 10;
      ponto[`__pts_${ia.nome_display}`] = pts;
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
        Y centrado em 50. Líder do frame fica em 90, último em 10, meio do
        pelotão fica no centro. As linhas se espalham pra mostrar quem subiu e
        quem caiu em relação ao pelotão da rodada.
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
              domain={[0, 100]}
              tick={{
                fill: "var(--fg-mid)",
                fontSize: 12,
                fontFamily: "var(--ff-mono)",
              }}
              tickLine={{ stroke: "var(--line)" }}
              axisLine={{ stroke: "var(--line)" }}
              label={{
                value: "Posição relativa",
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
              y={50}
              stroke="var(--line-strong)"
              strokeDasharray="4 4"
              label={{
                value: "MEIO DO PELOTÃO",
                fill: "var(--fg-muted)",
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
              formatter={(value, name, item) => {
                // recharts passa item.payload com todos os dados do ponto
                const ptsKey = `__pts_${name}`;
                const pts = (item.payload as Record<string, number>)?.[ptsKey];
                return [`${value}  ·  ${pts} pts`, name as string];
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
