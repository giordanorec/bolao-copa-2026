"use client";

import { useEffect, useState } from "react";
import IconeIA from "@/components/IconeIA";
import { marcaDe } from "@/lib/ias";

type IA = {
  slug: string;
  nome_display: string;
  pontos: number;
};

const DURACAO_MS = 6000;
const PAUSA_MS = 3000;
const CICLO_MS = DURACAO_MS + PAUSA_MS;

export default function BarRace({ ias }: { ias: IA[] }) {
  const [ciclo, setCiclo] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setCiclo((c) => c + 1), CICLO_MS);
    return () => clearInterval(id);
  }, []);

  const maxPts = Math.max(1, ...ias.map((ia) => ia.pontos));

  return (
    <div className="barrace-card">
      <div className="barrace-lista" key={ciclo}>
        {ias.map((ia, i) => {
          const pct = (ia.pontos / maxPts) * 100;
          const marca = marcaDe(ia.slug);
          return (
            <div
              key={ia.slug}
              className="barrace-row"
              style={{
                ["--target-pct" as string]: `${pct}%`,
                ["--delay" as string]: `${i * 0.06}s`,
                ["--cor-marca" as string]: marca.cor,
              }}
            >
              <span className="barrace-rank">{i + 1}º</span>
              <div className="barrace-track">
                <div className="barrace-fill">
                  <div className="barrace-fill-info">
                    <IconeIA slug={ia.slug} size={22} />
                    <span className="barrace-nome">{ia.nome_display}</span>
                  </div>
                </div>
              </div>
              <span className="barrace-pts">{ia.pontos}</span>
            </div>
          );
        })}
      </div>

      <style>{`
        .barrace-card {
          background: var(--bg-2);
          border: 1px solid var(--line);
          border-radius: var(--r-l);
          padding: 20px 18px;
        }
        .barrace-lista {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .barrace-row {
          display: grid;
          grid-template-columns: 40px 1fr 60px;
          align-items: center;
          gap: 12px;
        }
        .barrace-rank {
          font-family: var(--ff-mono);
          font-size: 13px;
          font-weight: 700;
          color: var(--fg-muted);
          text-align: right;
        }
        .barrace-track {
          height: 36px;
          background: var(--bg-1);
          border: 1px solid var(--line);
          border-radius: 18px;
          overflow: hidden;
          position: relative;
        }
        .barrace-fill {
          height: 100%;
          background: linear-gradient(
            90deg,
            var(--cor-marca),
            color-mix(in srgb, var(--cor-marca) 60%, var(--accent))
          );
          border-radius: 18px;
          width: 0;
          animation: cresce ${DURACAO_MS}ms cubic-bezier(0.16, 0.84, 0.44, 1) forwards;
          animation-delay: var(--delay);
          display: flex;
          align-items: center;
          min-width: 32px;
        }
        @keyframes cresce {
          0% { width: 0; }
          100% { width: var(--target-pct); }
        }
        .barrace-fill-info {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-left: 8px;
          white-space: nowrap;
          opacity: 0;
          animation: aparece ${DURACAO_MS}ms ease-out forwards;
          animation-delay: var(--delay);
          color: #fff;
          mix-blend-mode: difference;
          filter: brightness(1.3);
        }
        @keyframes aparece {
          0%, 60% { opacity: 0; transform: translateX(-4px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        .barrace-nome {
          font-family: var(--ff-display);
          font-size: 14px;
          font-weight: 800;
          letter-spacing: -0.01em;
        }
        .barrace-pts {
          font-family: var(--ff-display);
          font-size: 22px;
          font-weight: 900;
          color: var(--secondary);
          text-align: right;
          opacity: 0;
          animation: pts-aparece ${DURACAO_MS}ms ease-out forwards;
          animation-delay: var(--delay);
        }
        @keyframes pts-aparece {
          0%, 70% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
