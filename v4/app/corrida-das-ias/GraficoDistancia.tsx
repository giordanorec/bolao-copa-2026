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
  // Cada ponto do gráfico = pontuação real acumulada de cada IA naquele jogo.
  const data = frames.map((f) => {
    const ponto: Record<string, string | number> = {
      rodada: f.jogoNum === 0 ? "Início" : `Jogo ${f.jogoNum}`,
    };
    for (const ia of ias) {
      ponto[ia.nome_display] = f.pts[ia.slug] ?? 0;
    }
    return ponto;
  });

  const maxPts = Math.max(
    1,
    ...frames.flatMap((f) => ias.map((ia) => f.pts[ia.slug] ?? 0)),
  );

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
        Pontos acumulados de cada IA, jogo a jogo. Quanto mais alto, mais pontos.
        Linhas que se cruzam = ultrapassagens reais no ranking.
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
              domain={[0, Math.ceil(maxPts / 5) * 5]}
              allowDecimals={false}
              tick={{
                fill: "var(--fg-mid)",
                fontSize: 12,
                fontFamily: "var(--ff-mono)",
              }}
              tickLine={{ stroke: "var(--line)" }}
              axisLine={{ stroke: "var(--line)" }}
              label={{
                value: "Pontos",
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
            <Tooltip
              contentStyle={{
                background: "var(--bg-1)",
                border: "1px solid var(--line-strong)",
                borderRadius: 12,
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--fg)", fontWeight: 700 }}
              itemStyle={{ color: "var(--fg-mid)" }}
              formatter={(value, name) => [`${value} pts`, name as string]}
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
