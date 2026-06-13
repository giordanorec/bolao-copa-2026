"use client";

import { useEffect, useState } from "react";
import IconeIA from "@/components/IconeIA";

type IA = {
  slug: string;
  nome_display: string;
  pontos: number;
  placares_exatos: number;
};

// Duração da corrida + pausa no fim, em ms
const DURACAO_CORRIDA_MS = 6000;
const PAUSA_MS = 3000;
const CICLO_MS = DURACAO_CORRIDA_MS + PAUSA_MS;

export default function CorridaLanes({ ias }: { ias: IA[] }) {
  // chave que troca a cada ciclo pra forçar restart da animação
  const [ciclo, setCiclo] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setCiclo((c) => c + 1), CICLO_MS);
    return () => clearInterval(id);
  }, []);

  const maxPts = Math.max(1, ...ias.map((ia) => ia.pontos));

  return (
    <div className="corrida-card">
      <div className="corrida-pista" key={ciclo}>
        {ias.map((ia, i) => {
          const pct = (ia.pontos / maxPts) * 100;
          return (
            <div
              key={ia.slug}
              className="corrida-lane"
              style={{
                ["--target-pct" as string]: `${pct}%`,
                ["--delay" as string]: `${i * 0.05}s`,
              }}
            >
              <div className="lane-bg">
                <span className="lane-nome">{ia.nome_display}</span>
              </div>
              <div className="lane-runner">
                <div className="runner-emoji">💨</div>
                <div className="runner-iconwrap">
                  <IconeIA slug={ia.slug} size={32} />
                </div>
              </div>
              <div className="lane-pts">{ia.pontos}</div>
            </div>
          );
        })}
        <div className="corrida-finish" aria-hidden>
          <div className="finish-flag">🏁</div>
        </div>
      </div>

      <style>{`
        .corrida-card {
          background: linear-gradient(135deg, #0f0a26, #1a1238);
          border: 2px solid rgba(168, 85, 247, 0.4);
          border-radius: var(--r-l);
          padding: 24px 18px 18px;
          position: relative;
          overflow: hidden;
        }
        .corrida-pista {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .corrida-lane {
          position: relative;
          height: 44px;
          background: rgba(255, 255, 255, 0.04);
          border-radius: 22px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
        }
        .lane-bg {
          position: absolute;
          inset: 0 0 0 14px;
          display: flex;
          align-items: center;
          padding-left: 56px;
          pointer-events: none;
        }
        .lane-nome {
          font-family: var(--ff-display);
          font-size: 15px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.18);
          letter-spacing: -0.01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .lane-runner {
          position: absolute;
          top: 50%;
          left: 6px;
          transform: translate(0, -50%);
          display: flex;
          align-items: center;
          gap: 4px;
          z-index: 2;
          animation: correr var(--duracao, 6000ms) cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
          animation-delay: var(--delay, 0s);
        }
        @keyframes correr {
          0% { left: 6px; }
          100% { left: calc(var(--target-pct) - 1%); }
        }
        .runner-emoji {
          font-size: 18px;
          opacity: 0.55;
          transform: scaleX(-1);
          animation: vapor 0.4s ease-in-out infinite alternate;
        }
        @keyframes vapor {
          0% { transform: scaleX(-1) translateX(0); opacity: 0.4; }
          100% { transform: scaleX(-1) translateX(-3px); opacity: 0.8; }
        }
        .runner-iconwrap {
          width: 36px;
          height: 36px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(168, 85, 247, 0.5);
          animation: bob 0.5s ease-in-out infinite alternate;
        }
        @keyframes bob {
          0% { transform: translateY(0); }
          100% { transform: translateY(-3px); }
        }
        .lane-pts {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-family: var(--ff-mono);
          font-size: 14px;
          font-weight: 900;
          color: #fbbf24;
          z-index: 3;
        }
        .corrida-finish {
          position: absolute;
          top: 0; bottom: 0;
          right: 0;
          width: 6px;
          background: repeating-linear-gradient(
            45deg,
            #fff 0 6px,
            #000 6px 12px
          );
          opacity: 0.4;
          z-index: 1;
        }
        .finish-flag {
          position: absolute;
          top: -28px;
          right: -10px;
          font-size: 26px;
        }

        /* Velocidade individual: duração inversamente proporcional aos pontos */
        .corrida-lane {
          --duracao: ${DURACAO_CORRIDA_MS}ms;
        }
      `}</style>
    </div>
  );
}
