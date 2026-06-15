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
  // - mid = (min + max) / 2 das IAs mostradas
  // - Y = 50 + (pts - mid) * SCALE
  // O SCALE é GLOBAL (calculado a partir do frame mais desigual), então a
  // distância vertical entre as IAs reflete o GAP REAL de pontos: quando o
  // pelotão está junto (early game, todo mundo perto de 0), as linhas ficam
  // justas no meio; quando o gap aumenta, elas abrem leque. O meio do
  // pelotão de cada frame fica SEMPRE em Y=50 (o "alinhador").
  const prep = frames.map((f) => {
    const ptsFrame = ias.map((ia) => f.pts[ia.slug] ?? 0);
    const min = Math.min(...ptsFrame);
    const max = Math.max(...ptsFrame);
    const mid = (min + max) / 2;
    return { f, ptsFrame, min, max, mid };
  });

  // SCALE: o maior |pts - mid| em qualquer frame mapeia pra 40 (limita Y em
  // 10..90, deixando margem). Sem isso, frames cedo (todo mundo a 0) sumiam
  // numa linha só, ou frames tardios estouravam o gráfico.
  let maxDelta = 1;
  for (const d of prep) {
    for (const pts of d.ptsFrame) {
      const delta = Math.abs(pts - d.mid);
      if (delta > maxDelta) maxDelta = delta;
    }
  }
  const SCALE = 40 / maxDelta;

  const data = prep.map((d) => {
    const ponto: Record<string, string | number> = {
      rodada: d.f.jogoNum === 0 ? "Início" : `Jogo ${d.f.jogoNum}`,
      _max: d.max,
      _min: d.min,
    };
    for (const ia of ias) {
      const pts = d.f.pts[ia.slug] ?? 0;
      const y = 50 + (pts - d.mid) * SCALE;
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
        Y centrado em 50: o meio do pelotão de cada frame fica sempre na
        linha do meio. A distância vertical entre as IAs escala com o gap
        REAL de pontos — quando todo mundo está junto, as linhas ficam justas;
        quando o pelotão se espalha, elas abrem.
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
