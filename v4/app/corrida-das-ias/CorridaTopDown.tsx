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

const LANE_H = 30; // altura de cada raia
const DURACAO_FRAME_MS = 2200; // tempo entre jogos (a glide acontece dentro)
const PAUSA_FINAL_MS = 4500;

export default function CorridaTopDown({
  ias,
  frames,
}: {
  ias: IA[];
  frames: Frame[];
}) {
  const [idx, setIdx] = useState(0);
  const [pausado, setPausado] = useState(false);

  // Raia fixa por IA, ordenada pela pontuação final (líder no topo).
  const ordenadas = useMemo(
    () =>
      [...ias].sort(
        (a, b) => b.pontos - a.pontos || a.slug.localeCompare(b.slug),
      ),
    [ias],
  );

  // Maior pontuação alcançada em qualquer frame — escala fixa do eixo X,
  // pra que a posição não "estique" conforme o líder cresce.
  const maxPts = useMemo(
    () =>
      Math.max(
        1,
        ...frames.flatMap((f) => ordenadas.map((ia) => f.pts[ia.slug] ?? 0)),
      ),
    [frames, ordenadas],
  );

  useEffect(() => {
    if (pausado) return;
    const ehUltimo = idx === frames.length - 1;
    const t = ehUltimo ? PAUSA_FINAL_MS : DURACAO_FRAME_MS;
    const id = setTimeout(
      () => setIdx((i) => (i + 1) % frames.length),
      t,
    );
    return () => clearTimeout(id);
  }, [idx, frames.length, pausado]);

  const f = frames[idx];
  const alturaPista = ordenadas.length * LANE_H + 16;
  // Ao dar loop pro início, corta a transição (senão tudo desliza de volta).
  const semTransicao = idx === 0;

  return (
    <div className="cn-card">
      <div className="cn-header">
        <div className="cn-frame-info">
          <span className="cn-frame-lbl">
            {idx === 0 ? "INÍCIO" : `JOGO ${f?.jogoNum}`}
          </span>
          <span className="cn-frame-rotulo">{f?.rotulo ?? ""}</span>
        </div>
        <div className="cn-controles">
          <button onClick={() => setPausado((p) => !p)} className="cn-btn">
            {pausado ? "▶ Tocar" : "⏸ Pausar"}
          </button>
          <button onClick={() => setIdx(0)} className="cn-btn">
            ⟲ Início
          </button>
        </div>
      </div>

      <div className="cn-progress">
        {frames.map((fr, i) => (
          <button
            key={i}
            className={`cn-progress-tick ${i <= idx ? "ativo" : ""}`}
            onClick={() => setIdx(i)}
            title={fr.rotulo}
            aria-label={`Pular para ${fr.rotulo}`}
          />
        ))}
      </div>

      <div className="cn-pista" style={{ height: alturaPista }}>
        {/* linhas guia das raias */}
        {ordenadas.map((_, i) => (
          <div
            key={i}
            className="cn-raia"
            style={{ top: `${i * LANE_H + LANE_H / 2 + 8}px` }}
          />
        ))}

        {ordenadas.map((ia, i) => {
          const pts = f?.pts[ia.slug] ?? 0;
          const x = (pts / maxPts) * 90; // 90% deixa margem pra chegada
          const marca = marcaDe(ia.slug);
          return (
            <div
              key={ia.slug}
              className="cn-runner"
              style={{
                top: `${i * LANE_H + LANE_H / 2 + 8}px`,
                left: `calc(36px + ${x}%)`,
                transition: semTransicao
                  ? "none"
                  : "left 1.9s cubic-bezier(0.34, 1.2, 0.4, 1)",
                ["--cor" as string]: marca.cor,
              }}
            >
              <span className="cn-nome">{ia.nome_display}</span>
              <div className="cn-icon">
                <IconeIA slug={ia.slug} size={20} />
              </div>
              <span className="cn-pts">{pts}</span>
            </div>
          );
        })}

        {/* linha de partida */}
        <div className="cn-largada">
          <span>🚦</span>
        </div>
        {/* linha de chegada */}
        <div className="cn-chegada" aria-hidden />
        <div className="cn-bandeira">🏁</div>
      </div>

      <style>{`
        .cn-card {
          background: linear-gradient(135deg, #0a0d1a 0%, #1a1238 100%);
          border: 2px solid rgba(168, 85, 247, 0.4);
          border-radius: var(--r-l);
          padding: 18px;
          overflow: hidden;
        }
        .cn-header {
          display: flex; align-items: center; justify-content: space-between;
          gap: 14px; flex-wrap: wrap; margin-bottom: 12px;
        }
        .cn-frame-info { display: flex; flex-direction: column; min-width: 0; flex: 1; }
        .cn-frame-lbl {
          font-family: var(--ff-mono);
          font-size: 11px; font-weight: 900;
          color: #c084fc;
          letter-spacing: 0.1em;
        }
        .cn-frame-rotulo {
          font-family: var(--ff-display);
          font-size: 17px; font-weight: 800;
          color: #fff;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .cn-controles { display: flex; gap: 8px; }
        .cn-btn {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.15);
          padding: 8px 14px;
          font-size: 12px; font-weight: 700;
          color: rgba(255,255,255,0.85);
          border-radius: var(--r-s);
          cursor: pointer;
        }
        .cn-btn:hover { background: rgba(255,255,255,0.12); }
        .cn-progress { display: flex; gap: 3px; margin-bottom: 14px; }
        .cn-progress-tick {
          flex: 1; height: 6px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 3px;
          cursor: pointer; padding: 0;
          transition: background 0.3s;
        }
        .cn-progress-tick.ativo { background: #a855f7; border-color: #a855f7; }
        .cn-pista {
          position: relative;
          width: 100%;
          background:
            repeating-linear-gradient(
              90deg,
              transparent 0 50px,
              rgba(255,255,255,0.02) 50px 51px
            ),
            radial-gradient(ellipse at center, rgba(168, 85, 247, 0.07), transparent 70%);
          border-radius: var(--r-m);
          overflow: hidden;
        }
        .cn-raia {
          position: absolute;
          left: 0; right: 0;
          height: 1px;
          border-top: 1px dashed rgba(255,255,255,0.06);
          transform: translateY(-50%);
        }
        .cn-largada {
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 32px;
          background: linear-gradient(90deg, rgba(0,156,59,0.25), transparent);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; z-index: 1;
        }
        .cn-chegada {
          position: absolute;
          right: 0; top: 0; bottom: 0;
          width: 8px;
          background: repeating-linear-gradient(45deg, #fff 0 6px, #000 6px 12px);
          opacity: 0.5; z-index: 1;
        }
        .cn-bandeira {
          position: absolute;
          right: -2px; top: -8px;
          font-size: 26px; z-index: 3;
        }
        .cn-runner {
          position: absolute;
          transform: translate(0, -50%);
          width: 0; height: 0;
          z-index: 2;
        }
        .cn-icon {
          position: absolute;
          top: -10px; left: -10px;
          width: 20px; height: 20px;
          border-radius: 50%;
          background: #fff;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.5), 0 0 0 2px var(--cor, rgba(168,85,247,0.4));
          z-index: 2;
        }
        .cn-nome {
          position: absolute;
          top: 50%;
          right: calc(100% + 16px);
          transform: translateY(-50%);
          font-family: var(--ff-display);
          font-weight: 800;
          font-size: 11px;
          color: rgba(255,255,255,0.95);
          text-shadow: 0 1px 3px #000, 0 0 8px rgba(168,85,247,0.6);
          letter-spacing: -0.01em;
          max-width: 120px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          z-index: 1;
        }
        .cn-pts {
          position: absolute;
          top: 50%;
          left: calc(100% + 14px);
          transform: translateY(-50%);
          font-family: var(--ff-mono);
          font-size: 11px; font-weight: 800;
          color: #fbbf24;
          background: rgba(0,0,0,0.7);
          padding: 1px 6px; border-radius: 6px;
          z-index: 1;
        }
      `}</style>
    </div>
  );
}
