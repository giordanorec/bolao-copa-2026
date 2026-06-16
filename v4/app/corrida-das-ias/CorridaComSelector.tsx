"use client";

import { useMemo, useState } from "react";
import IASelector from "./IASelector";
import CorridaTopDown from "./CorridaTopDown";
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

function serieADe(ias: IA[]): Set<string> {
  return new Set(
    ias.filter((ia) => SLUGS_SERIE_A.has(ia.slug)).map((ia) => ia.slug),
  );
}

export default function CorridaComSelector({
  ias,
  frames,
}: {
  ias: IA[];
  frames: Frame[];
}) {
  // Default: só a Série A (no celular em pé, "todas" vira um emaranhado)
  const [selecionadas, setSelecionadas] = useState<Set<string>>(() => {
    const sa = serieADe(ias);
    return sa.size > 0 ? sa : new Set(ias.slice(0, 10).map((ia) => ia.slug));
  });

  function toggle(slug: string) {
    setSelecionadas((s) => {
      const n = new Set(s);
      if (n.has(slug)) {
        n.delete(slug);
        track("corrida_ia_toggle", { modo: "A", slug, ligado: false });
      } else {
        n.add(slug);
        track("corrida_ia_toggle", { modo: "A", slug, ligado: true });
      }
      return n;
    });
  }

  function selectAll() {
    track("corrida_preset", { modo: "A", preset: "todas" });
    setSelecionadas(new Set(ias.map((ia) => ia.slug)));
  }

  function selectTop10() {
    track("corrida_preset", { modo: "A", preset: "top10" });
    setSelecionadas(new Set(ias.slice(0, 10).map((ia) => ia.slug)));
  }

  function selectSerieA() {
    track("corrida_preset", { modo: "A", preset: "serie_a" });
    setSelecionadas(serieADe(ias));
  }

  const visiveis = useMemo(
    () => ias.filter((ia) => selecionadas.has(ia.slug)),
    [ias, selecionadas],
  );

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
        <CorridaTopDown ias={visiveis} frames={framesFiltrados} />
      )}
    </>
  );
}
