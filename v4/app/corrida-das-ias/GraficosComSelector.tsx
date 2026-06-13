"use client";

import { useMemo, useState } from "react";
import IASelector from "./IASelector";
import GraficoEstatico from "./GraficoEstatico";
import GraficoDistancia from "./GraficoDistancia";

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

export function GraficoEstaticoComSelector({
  ias,
  frames,
}: {
  ias: IA[];
  frames: Frame[];
}) {
  return (
    <ChartWithSelector
      ias={ias}
      frames={frames}
      modo="C"
      Chart={GraficoEstatico}
    />
  );
}

export function GraficoDistanciaComSelector({
  ias,
  frames,
}: {
  ias: IA[];
  frames: Frame[];
}) {
  return (
    <ChartWithSelector
      ias={ias}
      frames={frames}
      modo="D"
      Chart={GraficoDistancia}
    />
  );
}

function ChartWithSelector({
  ias,
  frames,
  modo,
  Chart,
}: {
  ias: IA[];
  frames: Frame[];
  modo: "C" | "D";
  Chart: React.ComponentType<{ ias: IA[]; frames: Frame[] }>;
}) {
  // Default: TODAS as IAs marcadas
  const [selecionadas, setSelecionadas] = useState<Set<string>>(
    () => new Set(ias.map((ia) => ia.slug)),
  );

  function toggle(slug: string) {
    setSelecionadas((s) => {
      const n = new Set(s);
      if (n.has(slug)) n.delete(slug);
      else n.add(slug);
      return n;
    });
  }

  function selectAll() {
    setSelecionadas(new Set(ias.map((ia) => ia.slug)));
  }

  function clearAll() {
    setSelecionadas(new Set());
  }

  function topN(n: number) {
    setSelecionadas(new Set(ias.slice(0, n).map((ia) => ia.slug)));
  }

  // Filtra IAs visiveis no chart
  const visiveis = useMemo(
    () => ias.filter((ia) => selecionadas.has(ia.slug)),
    [ias, selecionadas],
  );

  // Filtra frames pra incluir só as IAs visiveis
  const framesFiltrados = useMemo(
    () =>
      frames.map((f) => ({
        jogoNum: f.jogoNum,
        rotulo: f.rotulo,
        pts: Object.fromEntries(
          Object.entries(f.pts).filter(([s]) => selecionadas.has(s)),
        ),
      })),
    [frames, selecionadas],
  );

  return (
    <>
      <IASelector
        ias={ias}
        selecionadas={selecionadas}
        onToggle={toggle}
        onAll={selectAll}
        onClear={clearAll}
        onTopN={topN}
        modo={modo}
      />
      {visiveis.length === 0 ? (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            color: "var(--fg-muted)",
            background: "var(--bg-1)",
            border: "1px dashed var(--line)",
            borderRadius: "var(--r-m)",
          }}
        >
          Nenhuma IA selecionada. Use os presets ou clique em uma IA pra
          adicionar ao gráfico.
        </div>
      ) : (
        <Chart ias={visiveis} frames={framesFiltrados} />
      )}
    </>
  );
}
