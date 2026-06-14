"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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

const TOP_N = 10;
const DURACAO_FRAME_MS = 3500;
const PAUSA_FINAL_MS = 4000;
const ALTURA_BARRA = 44;
const GAP_BARRA = 10;

type Posicionada = IA & { pts: number; rank: number };

export default function BarRaceTemporal({
  ias,
  frames,
}: {
  ias: IA[];
  frames: Frame[];
}) {
  const [frameIdx, setFrameIdx] = useState(0);
  const [pausado, setPausado] = useState(false);

  // top N do frame atual, calculado em cada render
  const topNDoFrame = useMemo<Posicionada[]>(() => {
    const f = frames[frameIdx];
    if (!f) return [];
    const lista = ias.map((ia) => ({
      ...ia,
      pts: f.pts[ia.slug] ?? 0,
    }));
    lista.sort((a, b) => b.pts - a.pts || a.slug.localeCompare(b.slug));
    return lista.slice(0, TOP_N).map((ia, i) => ({ ...ia, rank: i }));
  }, [frameIdx, frames, ias]);

  // maxPts pra escalar as bars
  const maxPts = Math.max(1, ...topNDoFrame.map((p) => p.pts));

  // auto-avanca os frames
  useEffect(() => {
    if (pausado) return;
    const ehUltimo = frameIdx === frames.length - 1;
    const tempo = ehUltimo ? PAUSA_FINAL_MS : DURACAO_FRAME_MS;
    const id = setTimeout(() => {
      setFrameIdx((i) => (i + 1) % frames.length);
    }, tempo);
    return () => clearTimeout(id);
  }, [frameIdx, frames.length, pausado]);

  const alturaPista = TOP_N * (ALTURA_BARRA + GAP_BARRA);
  const f = frames[frameIdx];

  return (
    <div className="brt-card">
      <div className="brt-header">
        <div className="brt-frame-info">
          <span className="brt-frame-lbl">
            {frameIdx === 0 ? "INÍCIO" : `JOGO ${f?.jogoNum}`}
          </span>
          <span className="brt-frame-rotulo">{f?.rotulo ?? ""}</span>
        </div>
        <div className="brt-controles">
          <button onClick={() => setPausado((p) => !p)} className="brt-btn">
            {pausado ? "▶ Tocar" : "⏸ Pausar"}
          </button>
          <button onClick={() => setFrameIdx(0)} className="brt-btn">
            ⟲ Inicio
          </button>
        </div>
      </div>

      <div className="brt-progress">
        {frames.map((_, i) => (
          <button
            key={i}
            className={`brt-progress-tick ${i <= frameIdx ? "ativo" : ""}`}
            onClick={() => setFrameIdx(i)}
            title={frames[i].rotulo}
            aria-label={`Pular para ${frames[i].rotulo}`}
          />
        ))}
      </div>

      <div className="brt-pista" style={{ height: alturaPista }}>
        <AnimatePresence>
          {topNDoFrame.map((p) => {
            const marca = marcaDe(p.slug);
            const widthPct = (p.pts / maxPts) * 100;
            const top = p.rank * (ALTURA_BARRA + GAP_BARRA);
            return (
              <motion.div
                key={p.slug}
                className="brt-row"
                initial={{ opacity: 0, y: 30 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  top,
                }}
                exit={{ opacity: 0, y: 30 }}
                transition={{
                  top: { duration: 2.5, ease: [0.22, 1, 0.36, 1] },
                  opacity: { duration: 0.8 },
                  y: { duration: 0.8 },
                }}
                style={{
                  ["--cor" as string]: marca.cor,
                }}
              >
                <span className="brt-pos">{p.rank + 1}º</span>
                <div className="brt-bar-track">
                  <motion.div
                    className="brt-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${widthPct}%` }}
                    transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
                  />
                  <div className="brt-bar-info">
                    <span className="brt-logo">
                      <IconeIA slug={p.slug} size={22} />
                    </span>
                    <span className="brt-nome">{p.nome_display}</span>
                  </div>
                </div>
                <motion.span
                  className="brt-pts"
                  key={`${p.slug}-${p.pts}`}
                  initial={{ scale: 1.4, color: "#fbbf24" }}
                  animate={{ scale: 1, color: "var(--secondary)" }}
                  transition={{ duration: 0.6 }}
                >
                  {p.pts}
                </motion.span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <style>{`
        .brt-card {
          background: var(--bg-2);
          border: 1px solid var(--line);
          border-radius: var(--r-l);
          padding: 18px;
        }
        .brt-header {
          display: flex; align-items: center; justify-content: space-between;
          gap: 14px; flex-wrap: wrap; margin-bottom: 12px;
        }
        .brt-frame-info {
          display: flex; flex-direction: column; min-width: 0; flex: 1;
        }
        .brt-frame-lbl {
          font-family: var(--ff-mono);
          font-size: 11px; font-weight: 900;
          color: var(--primary);
          letter-spacing: 0.1em;
        }
        .brt-frame-rotulo {
          font-family: var(--ff-display);
          font-size: 18px; font-weight: 800;
          color: var(--fg);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .brt-controles { display: flex; gap: 8px; }
        .brt-btn {
          background: var(--bg-1);
          border: 1px solid var(--line);
          padding: 8px 14px;
          font-size: 12px; font-weight: 700;
          color: var(--fg-mid);
          border-radius: var(--r-s);
          cursor: pointer;
        }
        .brt-btn:hover { background: var(--bg-soft); }
        .brt-progress {
          display: flex; gap: 3px; margin-bottom: 14px;
        }
        .brt-progress-tick {
          flex: 1; height: 6px;
          background: var(--bg-1);
          border: 1px solid var(--line);
          border-radius: 3px;
          cursor: pointer;
          padding: 0;
          transition: background 0.3s;
        }
        .brt-progress-tick.ativo { background: var(--primary); border-color: var(--primary); }
        .brt-pista { position: relative; }
        .brt-row {
          position: absolute;
          left: 0; right: 0;
          height: ${ALTURA_BARRA}px;
          display: grid;
          grid-template-columns: 40px 1fr 70px;
          align-items: center;
          gap: 12px;
        }
        .brt-pos {
          font-family: var(--ff-mono);
          font-size: 14px; font-weight: 900;
          color: var(--fg-muted);
          text-align: right;
        }
        .brt-bar-track {
          position: relative;
          height: 100%;
          background: var(--bg-1);
          border-radius: ${ALTURA_BARRA / 2}px;
          overflow: hidden;
          border: 1px solid var(--line);
        }
        .brt-bar-fill {
          height: 100%;
          background: linear-gradient(
            90deg,
            var(--cor),
            color-mix(in srgb, var(--cor) 70%, var(--accent))
          );
          border-radius: ${ALTURA_BARRA / 2}px;
          min-width: ${ALTURA_BARRA}px;
        }
        .brt-bar-info {
          position: absolute;
          left: 0; top: 0;
          height: 100%;
          display: flex; align-items: center;
          gap: 9px; padding-left: 7px;
          white-space: nowrap;
          z-index: 2;
          pointer-events: none;
        }
        .brt-logo {
          flex-shrink: 0;
          width: ${ALTURA_BARRA - 14}px; height: ${ALTURA_BARRA - 14}px;
          border-radius: 50%;
          background: #fff;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.45);
        }
        .brt-nome {
          font-family: var(--ff-display);
          font-size: 14px; font-weight: 800;
          color: #fff;
          text-shadow: 0 1px 2px rgba(0,0,0,0.45);
        }
        .brt-pts {
          font-family: var(--ff-display);
          font-size: 24px; font-weight: 900;
          text-align: right;
        }
      `}</style>
    </div>
  );
}
