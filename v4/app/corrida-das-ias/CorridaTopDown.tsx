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

const LANE_H = 30; // altura de cada raia (px)
const ICON = 20;
const SPAN = 78; // % da pista usada pra mapear pontos (deixa margem p/ fan + chegada)
const START_PX = 34; // offset da linha de largada
const MIN_GAP = 6; // distância % mínima entre dois ícones na MESMA raia (final limpo)
const DURACAO_FRAME_MS = 2200;
const PAUSA_FINAL_MS = 4500;

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

export default function CorridaTopDown({
  ias,
  frames,
}: {
  ias: IA[];
  frames: Frame[];
}) {
  const [idx, setIdx] = useState(0);
  const [pausado, setPausado] = useState(false);

  const ordenadas = useMemo(
    () =>
      [...ias].sort(
        (a, b) => b.pontos - a.pontos || a.slug.localeCompare(b.slug),
      ),
    [ias],
  );

  // Escala fixa do eixo X (maior pontuação em qualquer frame).
  const maxPts = useMemo(
    () =>
      Math.max(
        1,
        ...frames.flatMap((f) => ordenadas.map((ia) => f.pts[ia.slug] ?? 0)),
      ),
    [frames, ordenadas],
  );

  const finalFrame = useMemo(
    () => frames[frames.length - 1]?.pts ?? {},
    [frames],
  );

  // Fan: IAs empatadas (mesma pontuação final) caem no MESMO X. Pra não
  // empilharem, damos um deslocamento horizontal constante (mesmo em todos os
  // frames — é só um nudge visual, a progressão real continua intacta).
  const fanOffset = useMemo(() => {
    const porPts: Record<number, IA[]> = {};
    for (const ia of ordenadas) {
      const p = finalFrame[ia.slug] ?? 0;
      (porPts[p] ??= []).push(ia);
    }
    const off: Record<string, number> = {};
    for (const k of Object.keys(porPts)) {
      const grp = porPts[Number(k)]
        .slice()
        .sort((a, b) => a.slug.localeCompare(b.slug));
      const n = grp.length;
      if (n === 1) {
        off[grp[0].slug] = 0;
        continue;
      }
      const win = Math.min((n - 1) * 4.5, 24); // largura total da janela (%)
      const step = win / (n - 1);
      grp.forEach((ia, i) => {
        off[ia.slug] = (i - (n - 1) / 2) * step;
      });
    }
    return off;
  }, [ordenadas, finalFrame]);

  const xDe = (slug: string, pts: number) =>
    clamp((pts / maxPts) * SPAN + (fanOffset[slug] ?? 0), 0, SPAN);

  // Empacota IAs em poucas raias: first-fit por X final desc; reaproveita a raia
  // se o último ocupante estiver a >= MIN_GAP de distância.
  const { laneOf, numLanes } = useMemo(() => {
    const items = ordenadas
      .map((ia) => ({ slug: ia.slug, x: xDe(ia.slug, finalFrame[ia.slug] ?? 0) }))
      .sort((a, b) => b.x - a.x);
    const lanesLast: number[] = [];
    const lane: Record<string, number> = {};
    for (const it of items) {
      let placed = -1;
      for (let l = 0; l < lanesLast.length; l++) {
        if (lanesLast[l] - it.x >= MIN_GAP) {
          placed = l;
          lanesLast[l] = it.x;
          break;
        }
      }
      if (placed < 0) {
        lanesLast.push(it.x);
        placed = lanesLast.length - 1;
      }
      lane[it.slug] = placed;
    }
    return { laneOf: lane, numLanes: lanesLast.length };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordenadas, finalFrame, fanOffset, maxPts]);

  useEffect(() => {
    if (pausado) return;
    const ehUltimo = idx === frames.length - 1;
    const t = ehUltimo ? PAUSA_FINAL_MS : DURACAO_FRAME_MS;
    const id = setTimeout(() => setIdx((i) => (i + 1) % frames.length), t);
    return () => clearTimeout(id);
  }, [idx, frames.length, pausado]);

  const f = frames[idx];
  const alturaPista = numLanes * LANE_H + 14;
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
        {Array.from({ length: numLanes }).map((_, i) => (
          <div
            key={i}
            className="cn-raia"
            style={{ top: `${i * LANE_H + LANE_H / 2 + 6}px` }}
          />
        ))}

        {ordenadas.map((ia) => {
          const pts = f?.pts[ia.slug] ?? 0;
          const x = xDe(ia.slug, pts);
          const lane = laneOf[ia.slug] ?? 0;
          const marca = marcaDe(ia.slug);
          return (
            <div
              key={ia.slug}
              className="cn-runner"
              title={`${ia.nome_display} — ${pts} pts`}
              style={{
                top: `${lane * LANE_H + LANE_H / 2 + 6}px`,
                left: `calc(${START_PX}px + ${x}%)`,
                zIndex: Math.round(pts) + 1,
                transition: semTransicao
                  ? "none"
                  : "left 1.9s cubic-bezier(0.34, 1.2, 0.4, 1)",
                ["--cor" as string]: marca.cor,
              }}
            >
              <span className="cn-nome">{ia.nome_display}</span>
              <span className="cn-pts">{pts}</span>
              <div className="cn-icon">
                <IconeIA slug={ia.slug} size={ICON - 6} />
              </div>
            </div>
          );
        })}

        <div className="cn-largada">
          <span>🚦</span>
        </div>
        <div className="cn-chegada" aria-hidden />
        <div className="cn-bandeira">🏁</div>
      </div>

      <p className="cn-legenda">
        Cada ícone é uma IA; quanto mais à direita, mais pontos. Empatadas dividem
        a mesma faixa — passe o dedo/mouse pra ver o nome.
      </p>

      <style>{`
        .cn-card {
          background: linear-gradient(135deg, #0a0d1a 0%, #1a1238 100%);
          border: 2px solid rgba(168, 85, 247, 0.4);
          border-radius: var(--r-l);
          padding: 16px;
          overflow: hidden;
        }
        .cn-header {
          display: flex; align-items: center; justify-content: space-between;
          gap: 14px; flex-wrap: wrap; margin-bottom: 10px;
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
          font-size: 16px; font-weight: 800;
          color: #fff;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .cn-controles { display: flex; gap: 8px; }
        .cn-btn {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.15);
          padding: 7px 12px;
          font-size: 12px; font-weight: 700;
          color: rgba(255,255,255,0.85);
          border-radius: var(--r-s);
          cursor: pointer;
        }
        .cn-btn:hover { background: rgba(255,255,255,0.12); }
        .cn-progress { display: flex; gap: 3px; margin-bottom: 12px; }
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
          width: 30px;
          background: linear-gradient(90deg, rgba(0,156,59,0.25), transparent);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; z-index: 1;
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
          font-size: 24px; z-index: 3;
        }
        .cn-runner {
          position: absolute;
          transform: translate(-100%, -50%);
          display: flex; align-items: center; gap: 4px;
          white-space: nowrap;
          pointer-events: auto;
        }
        .cn-icon {
          flex-shrink: 0;
          width: ${ICON}px; height: ${ICON}px;
          border-radius: 50%;
          background: #fff;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 1px 5px rgba(0,0,0,0.5), 0 0 0 2px var(--cor, rgba(168,85,247,0.4));
        }
        .cn-nome {
          font-family: var(--ff-display);
          font-weight: 800;
          font-size: 9px;
          color: rgba(255,255,255,0.95);
          text-shadow: 0 1px 3px #000, 0 0 6px rgba(168,85,247,0.6);
          max-width: 58px;
          overflow: hidden; text-overflow: ellipsis;
        }
        .cn-pts {
          font-family: var(--ff-mono);
          font-size: 9px; font-weight: 800;
          color: #fbbf24;
          background: rgba(0,0,0,0.65);
          padding: 0 4px; border-radius: 5px;
          flex-shrink: 0;
        }
        .cn-legenda {
          margin-top: 10px;
          font-family: var(--ff-mono);
          font-size: 11px;
          color: rgba(255,255,255,0.5);
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}
