"use client";

import { useMemo, useState } from "react";
import IASelector from "./IASelector";
import CorridaTopDown from "./CorridaTopDown";
import { SLUGS_SERIE_A as SLUGS_SERIE_A_LISTA } from "@/lib/serie-a";
import { track } from "@/lib/analytics";
import type { DadosFase, FaseCorrida } from "@/lib/corrida-frames";

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

const LABELS_FASE: Record<FaseCorrida, string> = {
  grupos: "Grupos",
  matamata: "Mata-mata",
  geral: "Geral",
};

function serieADe(ias: IA[]): Set<string> {
  return new Set(
    ias.filter((ia) => SLUGS_SERIE_A.has(ia.slug)).map((ia) => ia.slug),
  );
}

export default function CorridaComSelector({
  grupos,
  matamata,
  geral,
}: {
  grupos: DadosFase;
  matamata: DadosFase;
  geral: DadosFase;
}) {
  // Default: mata-mata (fase atual da Copa)
  const [fase, setFase] = useState<FaseCorrida>("matamata");

  // Dados da fase selecionada
  const dadosFase: DadosFase =
    fase === "grupos" ? grupos : fase === "matamata" ? matamata : geral;

  const ias: IA[] = dadosFase.topIas;
  const frames: Frame[] = dadosFase.frames;

  // Default: só a Série A (no celular em pé, "todas" vira um emaranhado)
  // Reset ao trocar de fase para manter consistência
  const [selecionadas, setSelecionadas] = useState<Set<string>>(() => {
    const sa = serieADe(ias);
    return sa.size > 0 ? sa : new Set(ias.slice(0, 10).map((ia) => ia.slug));
  });

  function handleFase(f: FaseCorrida) {
    track("corrida_fase", { fase: f });
    setFase(f);
    // Reaplica preset Série A com as IAs da nova fase
    const faseDados: DadosFase =
      f === "grupos" ? grupos : f === "matamata" ? matamata : geral;
    const sa = serieADe(faseDados.topIas);
    setSelecionadas(
      sa.size > 0
        ? sa
        : new Set(faseDados.topIas.slice(0, 10).map((ia) => ia.slug)),
    );
  }

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

  // Mata-mata ainda sem resultados: só o frame inicial (todos em 0)
  const mataMataVazia =
    fase === "matamata" && frames.length <= 1;

  return (
    <>
      {/* Seletor de fase */}
      <div
        style={{
          display: "flex",
          gap: 8,
          justifyContent: "center",
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        {(["grupos", "matamata", "geral"] as FaseCorrida[]).map((f) => (
          <button
            key={f}
            onClick={() => handleFase(f)}
            style={{
              padding: "8px 22px",
              borderRadius: 999,
              border: `2px solid ${fase === f ? "var(--primary)" : "var(--line-strong)"}`,
              background:
                fase === f
                  ? "color-mix(in srgb, var(--primary) 12%, transparent)"
                  : "var(--bg-2)",
              color: fase === f ? "var(--primary)" : "var(--fg)",
              fontWeight: fase === f ? 700 : 500,
              fontSize: 14,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {LABELS_FASE[f]}
          </button>
        ))}
      </div>

      {mataMataVazia ? (
        <div
          style={{
            textAlign: "center",
            padding: "48px 24px",
            background: "var(--bg-1)",
            border: "1px dashed var(--line)",
            borderRadius: "var(--r-m)",
            color: "var(--fg-muted)",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <h3 style={{ marginBottom: 8, color: "var(--fg)" }}>
            Corrida fresca do mata-mata
          </h3>
          <p style={{ maxWidth: 480, margin: "0 auto", fontSize: 14, lineHeight: 1.6 }}>
            Os confrontos do mata-mata foram definidos e os palpites das IAs já estão
            registrados. Assim que os jogos começarem, a corrida atualiza automaticamente.
          </p>
        </div>
      ) : (
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
      )}
    </>
  );
}
