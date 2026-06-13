"use client";

import { useEffect, useMemo, useState } from "react";
import IconeIA from "@/components/IconeIA";
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

const DURACAO_FRAME_MS = 2000;
const PAUSA_FINAL_MS = 3000;
const ALTURA_BARRA = 38;
const GAP_BARRA = 8;

type Posicionado = IA & { pts: number; rank: number };

export default function BarRaceTemporal({
  ias,
  frames,
}: {
  ias: IA[];
  frames: Frame[];
}) {
  const [frameIdx, setFrameIdx] = useState(0);
  const [pausado, setPausado] = useState(false);

  // mantemos os slugs ordenados pra desenhar bars na ordem fixa, e a posicao Y vem do rank
  const slugs = useMemo(() => ias.map((ia) => ia.slug), [ias]);
  const dictIas = useMemo(
    () => Object.fromEntries(ias.map((ia) => [ia.slug, ia])),
    [ias],
  );

  // Computa posicionamento do frame atual
  const posicionadas = useMemo(() => {
    const f = frames[frameIdx];
    if (!f) return [] as Posicionado[];
    const lista = slugs.map((s) => ({
      ...(dictIas[s] as IA),
      pts: f.pts[s] ?? 0,
    }));
    lista.sort((a, b) => b.pts - a.pts || a.slug.localeCompare(b.slug));
    return lista.map((ia, i) => ({ ...ia, rank: i }));
  }, [frameIdx, frames, slugs, dictIas]);

  // Avança frames automaticamente
  useEffect(() => {
    if (pausado) return;
    const intervalo =
      frameIdx === frames.length - 1 ? PAUSA_FINAL_MS : DURACAO_FRAME_MS;
    const id = setTimeout(() => {
      setFrameIdx((i) => (i + 1) % frames.length);
    }, intervalo);
    return () => clearTimeout(id);
  }, [frameIdx, frames.length, pausado]);

  const maxPts = Math.max(1, ...posicionadas.map((p) => p.pts));
  const alturaTotal = ias.length * (ALTURA_BARRA + GAP_BARRA);

  const f = frames[frameIdx];

  return (
    <div className="br-card">
      {/* Header com info do frame */}
      <div className="br-header">
        <div className="br-frame-info">
          <span className="br-frame-lbl">
            {frameIdx === 0 ? "INÍCIO" : `JOGO ${f?.jogoNum}`}
          </span>
          <span className="br-frame-rotulo">{f?.rotulo ?? ""}</span>
        </div>
        <div className="br-controles">
          <button
            onClick={() => setPausado((p) => !p)}
            className="br-btn"
            aria-label={pausado ? "Continuar" : "Pausar"}
          >
            {pausado ? "▶ Continuar" : "⏸ Pausar"}
          </button>
          <button
            onClick={() => setFrameIdx(0)}
            className="br-btn"
            aria-label="Reiniciar"
          >
            ⟲ Reiniciar
          </button>
        </div>
      </div>

      {/* Progresso dos frames */}
      <div className="br-progress">
        {frames.map((_, i) => (
          <div
            key={i}
            className={`br-progress-tick ${i <= frameIdx ? "ativo" : ""}`}
            onClick={() => setFrameIdx(i)}
            style={{ flex: 1 }}
            title={frames[i].rotulo}
          />
        ))}
      </div>

      {/* Lista */}
      <div className="br-pista" style={{ height: alturaTotal }}>
        {posicionadas.map((p) => {
          const marca = marcaDe(p.slug);
          const widthPct = maxPts > 0 ? (p.pts / maxPts) * 100 : 0;
          const top = p.rank * (ALTURA_BARRA + GAP_BARRA);
          return (
            <div
              key={p.slug}
              className="br-row"
              style={{
                top,
                ["--cor" as string]: marca.cor,
              }}
            >
              <span className="br-pos">{p.rank + 1}º</span>
              <div className="br-bar-track">
                <div
                  className="br-bar-fill"
                  style={{ width: `${widthPct}%` }}
                >
                  <div className="br-bar-info">
                    <IconeIA slug={p.slug} size={22} />
                    <span className="br-nome">{p.nome_display}</span>
                  </div>
                </div>
              </div>
              <span className="br-pts">{p.pts}</span>
            </div>
          );
        })}
      </div>

      <style>{`
        .br-card {
          background: var(--bg-2);
          border: 1px solid var(--line);
          border-radius: var(--r-l);
          padding: 18px;
        }
        .br-header {
          display: flex; align-items: center; justify-content: space-between;
          gap: 14px; flex-wrap: wrap; margin-bottom: 12px;
        }
        .br-frame-info {
          display: flex; flex-direction: column; min-width: 0;
        }
        .br-frame-lbl {
          font-family: var(--ff-mono);
          font-size: 11px; font-weight: 900;
          color: var(--primary);
          letter-spacing: 0.1em;
        }
        .br-frame-rotulo {
          font-family: var(--ff-display);
          font-size: 18px; font-weight: 800;
          color: var(--fg);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .br-controles {
          display: flex; gap: 8px;
        }
        .br-btn {
          background: var(--bg-1);
          border: 1px solid var(--line);
          padding: 8px 14px;
          font-size: 12px; font-weight: 700;
          color: var(--fg-mid);
          border-radius: var(--r-s);
          cursor: pointer;
        }
        .br-btn:hover { background: var(--bg-soft); }
        .br-progress {
          display: flex; gap: 3px; margin-bottom: 14px;
        }
        .br-progress-tick {
          height: 4px;
          background: var(--bg-1);
          border-radius: 2px;
          cursor: pointer;
          transition: background 0.3s;
        }
        .br-progress-tick.ativo { background: var(--primary); }
        .br-pista {
          position: relative;
        }
        .br-row {
          position: absolute;
          left: 0; right: 0;
          height: ${ALTURA_BARRA}px;
          display: grid;
          grid-template-columns: 36px 1fr 56px;
          align-items: center;
          gap: 10px;
          transition: top 1.6s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .br-pos {
          font-family: var(--ff-mono);
          font-size: 13px; font-weight: 800;
          color: var(--fg-muted);
          text-align: right;
        }
        .br-bar-track {
          height: 100%;
          background: var(--bg-1);
          border-radius: 19px;
          overflow: hidden;
          border: 1px solid var(--line);
        }
        .br-bar-fill {
          height: 100%;
          background: linear-gradient(
            90deg,
            var(--cor),
            color-mix(in srgb, var(--cor) 70%, var(--accent))
          );
          border-radius: 19px;
          min-width: 30px;
          display: flex;
          align-items: center;
          transition: width 1.6s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .br-bar-info {
          display: flex; align-items: center;
          gap: 8px; padding-left: 8px;
          white-space: nowrap;
        }
        .br-nome {
          font-family: var(--ff-display);
          font-size: 13px; font-weight: 800;
          color: #fff;
          text-shadow: 0 1px 2px rgba(0,0,0,0.4);
        }
        .br-pts {
          font-family: var(--ff-display);
          font-size: 22px; font-weight: 900;
          color: var(--secondary);
          text-align: right;
          transition: color 0.3s;
        }
      `}</style>
    </div>
  );
}
