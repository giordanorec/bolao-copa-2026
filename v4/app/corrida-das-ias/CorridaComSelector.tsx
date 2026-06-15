"use client";

import { useMemo, useState } from "react";
import IASelector from "./IASelector";
import CorridaTopDown from "./CorridaTopDown";
import { SLUGS_SERIE_A as SLUGS_SERIE_A_LISTA } from "@/lib/serie-a";

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

  // Modo de exibição do corredor: ícone da marca (default) ou mascote (só Série A).
  const [usarMascote, setUsarMascote] = useState(false);

  function modoIcone() {
    setUsarMascote(false);
  }

  function modoMascote() {
    // Mascotes só existem pra Série A → ao ligar, mostra só a Série A.
    setUsarMascote(true);
    setSelecionadas(serieADe(ias));
  }

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

  function selectTop10() {
    setSelecionadas(new Set(ias.slice(0, 10).map((ia) => ia.slug)));
  }

  function selectSerieA() {
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

      <div className="cn-modo">
        <span className="cn-modo-lbl">Mostrar como:</span>
        <div className="cn-modo-switch">
          <button
            type="button"
            className={`cn-modo-btn${usarMascote ? "" : " ativo"}`}
            onClick={modoIcone}
          >
            🎨 Ícone
          </button>
          <button
            type="button"
            className={`cn-modo-btn${usarMascote ? " ativo" : ""}`}
            onClick={modoMascote}
          >
            🧸 Mascote (Série A)
          </button>
        </div>
        <style>{`
          .cn-modo {
            display: flex; align-items: center; gap: 10px;
            flex-wrap: wrap; margin-bottom: 14px;
          }
          .cn-modo-lbl {
            font-family: var(--ff-mono); font-size: 12px; font-weight: 700;
            color: var(--fg-muted); text-transform: uppercase; letter-spacing: 0.05em;
          }
          .cn-modo-switch {
            display: inline-flex; gap: 4px;
            background: var(--bg-1); border: 1px solid var(--line);
            border-radius: var(--r-s); padding: 3px;
          }
          .cn-modo-btn {
            background: transparent; border: none;
            padding: 6px 12px; font-size: 13px; font-weight: 700;
            color: var(--fg-muted); border-radius: calc(var(--r-s) - 2px);
            cursor: pointer;
          }
          .cn-modo-btn.ativo {
            background: var(--primary); color: #fff;
          }
        `}</style>
      </div>

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
        <CorridaTopDown
          ias={visiveis}
          frames={framesFiltrados}
          usarMascote={usarMascote}
        />
      )}
    </>
  );
}
