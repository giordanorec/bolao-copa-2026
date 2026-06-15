"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import IconeIA from "@/components/IconeIA";
import { marcaDe } from "@/lib/ias";
import { SLUGS_SERIE_A } from "@/lib/serie-a";

// Slugs que têm arquivo de mascote em /public/mascots/<slug>.png (= Série A).
const COM_MASCOTE = new Set(SLUGS_SERIE_A);

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
const SEG_MS = 1500; // tempo pra animar UM jogo (segmento) — movimento contínuo
const PAUSA_FINAL_MS = 4000;

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

export default function CorridaTopDown({
  ias,
  frames,
}: {
  ias: IA[];
  frames: Frame[];
}) {
  // pos é um índice de frame CONTÍNUO (float). Entre dois frames inteiros a
  // posição é interpolada → corrida fluida, sem "anda e para". Cada inteiro
  // pousa exatamente na pontuação real daquele jogo (nada de trajetória falsa).
  const [pos, setPos] = useState(0);
  const [pausado, setPausado] = useState(false);
  // Nome ao lado do mascote: default escondido (só os bichinhos ficam mais
  // limpos visualmente). Usuário pode ligar via checkbox.
  const [mostrarNome, setMostrarNome] = useState(false);
  const posRef = useRef(0);
  const lastRef = useRef(0);
  const rafRef = useRef(0);
  const esperandoFimRef = useRef(false);
  const segFastRef = useRef<boolean[]>([]);

  const ultimo = frames.length - 1;

  const irPara = (i: number) => {
    posRef.current = i;
    setPos(i);
    lastRef.current = performance.now();
    esperandoFimRef.current = false;
  };

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

  // Segmento "rápido": jogo em que NINGUÉM pontuou (todos erraram) — anima na
  // metade do tempo. segFast[s] cobre a transição do frame s → s+1.
  const segFast = useMemo(() => {
    const arr: boolean[] = [];
    for (let s = 0; s < frames.length - 1; s++) {
      const a = frames[s].pts;
      const b = frames[s + 1].pts;
      arr[s] = ordenadas.every(
        (ia) => (b[ia.slug] ?? 0) === (a[ia.slug] ?? 0),
      );
    }
    return arr;
  }, [frames, ordenadas]);
  segFastRef.current = segFast;

  // Posição X só por pontos — sem offset por empate. IAs empatadas no mesmo X
  // são desempilhadas pelo lane packing (raias diferentes em Y). Antes existia
  // um "fan" que espalhava as empatadas no eixo X, mas isso podia fazer uma
  // IA com menos pontos visualmente ultrapassar outra com mais (quando o fan
  // somava mais que a folga em X entre dois grupos vizinhos).
  const xDe = (_slug: string, pts: number) =>
    clamp((pts / maxPts) * SPAN, 0, SPAN);

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
  }, [ordenadas, finalFrame, maxPts]);

  useEffect(() => {
    if (pausado || ultimo <= 0) return;
    lastRef.current = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(now - lastRef.current, 60); // ignora saltos (aba oculta)
      lastRef.current = now;
      if (!esperandoFimRef.current) {
        const seg = Math.min(Math.floor(posRef.current), ultimo - 1);
        const segDur = segFastRef.current[seg] ? SEG_MS / 2 : SEG_MS;
        let np = posRef.current + dt / segDur;
        if (np >= ultimo) {
          np = ultimo;
          esperandoFimRef.current = true;
          window.setTimeout(() => irPara(0), PAUSA_FINAL_MS);
        }
        posRef.current = np;
        setPos(np);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pausado, ultimo]);

  // Frame inteiro corrente (fA) e o próximo (fB); frac = progresso no segmento.
  const fA = Math.min(Math.floor(pos), ultimo);
  const fB = Math.min(fA + 1, ultimo);
  const frac = pos - fA;
  const emMovimento = fB > fA;
  // Rótulo: enquanto anima um segmento, mostra o jogo que está sendo apurado.
  const idxRotulo = emMovimento && frac > 0.001 ? fB : fA;
  const f = frames[idxRotulo];
  const alturaPista = numLanes * LANE_H + 14;

  return (
    <div className="cn-card">
      <div className="cn-header">
        <div className="cn-frame-info">
          <span className="cn-frame-lbl">
            {idxRotulo === 0 ? "INÍCIO" : `JOGO ${f?.jogoNum}`}
          </span>
          <span className="cn-frame-rotulo">{f?.rotulo ?? ""}</span>
        </div>
        <div className="cn-controles">
          <label className="cn-check" title="Mostrar nome ao lado de cada IA">
            <input
              type="checkbox"
              checked={mostrarNome}
              onChange={(e) => setMostrarNome(e.target.checked)}
            />
            <span>nome</span>
          </label>
          <button onClick={() => setPausado((p) => !p)} className="cn-btn">
            {pausado ? "▶ Tocar" : "⏸ Pausar"}
          </button>
          <button onClick={() => irPara(0)} className="cn-btn">
            ⟲ Início
          </button>
        </div>
      </div>

      <div className="cn-progress">
        {frames.map((fr, i) => (
          <button
            key={i}
            className={`cn-progress-tick ${i <= pos ? "ativo" : ""}`}
            onClick={() => irPara(i)}
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

        {ordenadas.map((ia, idx) => {
          const ptsA = frames[fA]?.pts[ia.slug] ?? 0;
          const ptsB = frames[fB]?.pts[ia.slug] ?? 0;
          // posição interpolada (linear = velocidade constante, sem freadas)
          const ptsNow = ptsA + (ptsB - ptsA) * frac;
          const ptsLabel = Math.round(ptsNow);
          const x = xDe(ia.slug, ptsNow);
          const lane = laneOf[ia.slug] ?? 0;
          const marca = marcaDe(ia.slug);
          const temMascote = COM_MASCOTE.has(ia.slug);
          // "Bateu": errou completamente o jogo em apuração (ganhou 0 ponto).
          const bateu = emMovimento && ptsB - ptsA === 0;
          // Cada IA ganha um delay próprio pra não saltitar em uníssono.
          const swingDelay = `-${(idx * 0.137) % 0.9}s`;
          return (
            <div
              key={ia.slug}
              className={`cn-runner${bateu ? " batendo" : ""}${
                emMovimento && !pausado ? " correndo" : ""
              }`}
              title={`${ia.nome_display} — ${ptsLabel} pts`}
              style={{
                top: `${lane * LANE_H + LANE_H / 2 + 6}px`,
                left: `calc(${START_PX}px + ${x}%)`,
                zIndex: Math.round(ptsNow) + 1,
                ["--cor" as string]: marca.cor,
                ["--swing-delay" as string]: swingDelay,
              }}
            >
              {bateu && <span className="cn-fumaca" aria-hidden>💨</span>}
              {mostrarNome && (
                <span className="cn-nome">{ia.nome_display}</span>
              )}
              <span className="cn-pts">{ptsLabel}</span>
              {temMascote ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  className="cn-mascote"
                  src={`/mascots/${ia.slug}.png`}
                  alt={ia.nome_display}
                />
              ) : (
                <span className="cn-marca">
                  <IconeIA slug={ia.slug} size={26} />
                </span>
              )}
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
        .cn-check {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 6px 10px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: var(--r-s);
          font-family: var(--ff-mono);
          font-size: 11px; font-weight: 700;
          color: rgba(255,255,255,0.75);
          cursor: pointer;
          user-select: none;
        }
        .cn-check input { margin: 0; accent-color: #a855f7; cursor: pointer; }
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
          transform: translate3d(-100%, -50%, 0);
          will-change: left, top;
          backface-visibility: hidden;
          display: flex; align-items: center; gap: 4px;
          white-space: nowrap;
          pointer-events: auto;
        }
        .cn-marca {
          flex-shrink: 0;
          width: ${ICON + 6}px; height: ${ICON + 6}px;
          display: inline-flex;
          align-items: center; justify-content: center;
          background: transparent;
          filter: drop-shadow(0 2px 3px rgba(0,0,0,0.55));
        }
        .cn-mascote {
          flex-shrink: 0;
          width: 38px; height: 38px;
          object-fit: contain;
          background: transparent;
          border: none;
          /* sombra suave por baixo, sem moldura */
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.55));
        }
        .cn-runner.batendo .cn-mascote {
          animation: cn-rodopio 0.5s linear infinite;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.55))
                  drop-shadow(0 0 6px #ef4444);
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
        @keyframes cn-rodopio {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        /* Gait sutil: saltita um pouquinho enquanto pendula. Cada IA recebe
           um animation-delay próprio via --swing-delay pra ficar desencontrado. */
        @keyframes cn-trote {
          0%   { transform: translateY(0)   rotate(-2deg); }
          25%  { transform: translateY(-1.5px) rotate(0deg); }
          50%  { transform: translateY(0)   rotate(2deg); }
          75%  { transform: translateY(-1.5px) rotate(0deg); }
          100% { transform: translateY(0)   rotate(-2deg); }
        }
        .cn-runner.correndo:not(.batendo) .cn-mascote,
        .cn-runner.correndo:not(.batendo) .cn-marca {
          animation: cn-trote 0.62s ease-in-out infinite;
          animation-delay: var(--swing-delay, 0s);
          transform-origin: 50% 85%;
        }
        @keyframes cn-fumacinha {
          0%   { opacity: 0;   transform: translate(0, 0) scale(0.4); }
          25%  { opacity: 0.9; }
          100% { opacity: 0;   transform: translate(-12px, -14px) scale(1.5); }
        }
        @keyframes cn-tremor {
          0%, 100% { margin-top: 0; }
          25% { margin-top: -1px; }
          75% { margin-top: 1px; }
        }
        .cn-runner.batendo { animation: cn-tremor 0.18s linear infinite; }
        .cn-runner.batendo .cn-marca {
          animation: cn-rodopio 0.5s linear infinite;
          filter: drop-shadow(0 2px 3px rgba(0,0,0,0.55))
                  drop-shadow(0 0 6px #ef4444);
        }
        .cn-fumaca {
          position: absolute;
          left: -4px; top: -10px;
          font-size: 14px;
          pointer-events: none;
          z-index: 4;
          animation: cn-fumacinha 0.7s ease-out infinite;
        }
      `}</style>
    </div>
  );
}
