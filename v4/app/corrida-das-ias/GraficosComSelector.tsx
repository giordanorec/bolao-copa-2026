"use client";

import { useEffect, useMemo, useState } from "react";
import IASelector from "./IASelector";
import GraficoDistancia from "./GraficoDistancia";
import { SLUGS_SERIE_A as SLUGS_SERIE_A_LISTA } from "@/lib/serie-a";
import { track } from "@/lib/analytics";

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

const SLUGS_SERIE_A = new Set(SLUGS_SERIE_A_LISTA);

export function GraficoDistanciaComSelector({
  ias,
  frames,
}: {
  ias: IA[];
  frames: Frame[];
}) {
  // Default: só a Série A (no celular em pé, "todas" vira milhões de linhas)
  const [selecionadas, setSelecionadas] = useState<Set<string>>(() => {
    const sa = new Set(
      ias.filter((ia) => SLUGS_SERIE_A.has(ia.slug)).map((ia) => ia.slug),
    );
    return sa.size > 0 ? sa : new Set(ias.slice(0, 10).map((ia) => ia.slug));
  });

  // Disparo único ao montar — engagement com Modo C.
  useEffect(() => {
    track("corrida_view", { modo: "analise", ias_visiveis: ias.length });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle(slug: string) {
    setSelecionadas((s) => {
      const n = new Set(s);
      if (n.has(slug)) {
        n.delete(slug);
        track("corrida_ia_toggle", { modo: "analise", slug, ligado: false });
      } else {
        n.add(slug);
        track("corrida_ia_toggle", { modo: "analise", slug, ligado: true });
      }
      return n;
    });
  }

  function selectAll() {
    track("corrida_preset", { modo: "analise", preset: "todas" });
    setSelecionadas(new Set(ias.map((ia) => ia.slug)));
  }

  function selectTop10() {
    track("corrida_preset", { modo: "analise", preset: "top10" });
    setSelecionadas(new Set(ias.slice(0, 10).map((ia) => ia.slug)));
  }

  function selectSerieA() {
    track("corrida_preset", { modo: "analise", preset: "serie_a" });
    setSelecionadas(
      new Set(ias.filter((ia) => SLUGS_SERIE_A.has(ia.slug)).map((ia) => ia.slug)),
    );
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
        onTop10={selectTop10}
        onSerieA={selectSerieA}
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
          Nenhuma IA selecionada. Use um dos presets acima.
        </div>
      ) : (
        <GraficoDistancia ias={visiveis} frames={framesFiltrados} />
      )}
    </>
  );
}
