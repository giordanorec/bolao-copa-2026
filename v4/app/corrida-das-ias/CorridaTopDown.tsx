"use client";

import { useEffect, useMemo, useState } from "react";
import IconeIA from "@/components/IconeIA";

type IA = {
  slug: string;
  nome_display: string;
  pontos: number;
};

const DURACAO_MS = 7000;
const PAUSA_MS = 3000;
const CICLO_MS = DURACAO_MS + PAUSA_MS;

const NUM_LANES = 22;
const MIN_DIST_X_PCT = 12; // 12% de distancia minima na mesma raia
const NOME_LARGURA_APROX_PCT = 11; // nome ocupa ~11% de largura — packing leva isso em conta

type Posicionada = IA & { x: number; lane: number };

/**
 * Empacota IAs em raias virtuais.
 * - Sort por pts desc
 * - Pra cada IA, calcula X em % baseado nos pts
 * - Procura a primeira raia onde nenhuma IA ja-posicionada esta a menos de
 *   MIN_DIST_X_PCT em X. Se nenhuma raia livre, cai na que tem o "vizinho" mais distante.
 */
function packLanes(ias: IA[]): Posicionada[] {
  const maxPts = Math.max(1, ...ias.map((ia) => ia.pontos));
  const out: Posicionada[] = [];
  // Pra cada raia, lista de X ja ocupados (precisamos checar ALL, nao so o ultimo)
  const ocupados: number[][] = Array.from({ length: NUM_LANES }, () => []);

  for (const ia of ias) {
    const x = (ia.pontos / maxPts) * 90; // 90% pra deixar margem na chegada

    let bestLane = 0;
    let bestGap = -Infinity;
    for (let l = 0; l < NUM_LANES; l++) {
      // calcula menor distancia desta IA pra qualquer outra ja na raia l
      let menorGap = Infinity;
      for (const xOutro of ocupados[l]) {
        const g = Math.abs(x - xOutro);
        if (g < menorGap) menorGap = g;
      }
      // espaco minimo: nome ocupa NOME_LARGURA_APROX_PCT, entao 2 IAs precisam
      // estar pelo menos NOME_LARGURA_APROX_PCT + ~icone (5%) afastadas
      const minDist = NOME_LARGURA_APROX_PCT + 5;
      if (menorGap >= Math.max(MIN_DIST_X_PCT, minDist)) {
        bestLane = l;
        ocupados[l].push(x);
        out.push({ ...ia, x, lane: l });
        break;
      }
      if (menorGap > bestGap) {
        bestGap = menorGap;
        bestLane = l;
      }
    }
    // se nenhuma raia atendeu (out.length nao mudou nesse loop), cai no bestLane
    if (out.length === 0 || out[out.length - 1].slug !== ia.slug) {
      ocupados[bestLane].push(x);
      out.push({ ...ia, x, lane: bestLane });
    }
  }
  return out;
}

export default function CorridaTopDown({ ias }: { ias: IA[] }) {
  const [ciclo, setCiclo] = useState(0);
  const posicionadas = useMemo(() => packLanes(ias), [ias]);

  useEffect(() => {
    const id = setInterval(() => setCiclo((c) => c + 1), CICLO_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="cn-card">
      <div className="cn-pista" key={ciclo}>
        {/* linhas guia das raias */}
        {Array.from({ length: NUM_LANES }, (_, i) => (
          <div
            key={i}
            className="cn-raia"
            style={{ top: `${(i + 0.5) * (100 / NUM_LANES)}%` }}
          />
        ))}

        {posicionadas.map((p, i) => (
          <div
            key={p.slug}
            className="cn-runner"
            style={{
              top: `${(p.lane + 0.5) * (100 / NUM_LANES)}%`,
              ["--target-x" as string]: `${p.x}%`,
              ["--delay" as string]: `${(i % 8) * 0.03}s`,
            }}
          >
            <div className="cn-icon">
              <IconeIA slug={p.slug} size={22} />
            </div>
            <span className="cn-nome">{p.nome_display}</span>
            <span className="cn-pts">{p.pontos}</span>
          </div>
        ))}

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
        .cn-pista {
          position: relative;
          width: 100%;
          height: 720px;
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
          background: rgba(255,255,255,0.05);
          border-top: 1px dashed rgba(255,255,255,0.06);
        }
        .cn-largada {
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 32px;
          background: linear-gradient(90deg, rgba(0,156,59,0.25), transparent);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          z-index: 1;
        }
        .cn-chegada {
          position: absolute;
          right: 0; top: 0; bottom: 0;
          width: 8px;
          background: repeating-linear-gradient(
            45deg,
            #fff 0 6px,
            #000 6px 12px
          );
          opacity: 0.5;
          z-index: 1;
        }
        .cn-bandeira {
          position: absolute;
          right: -2px; top: -8px;
          font-size: 28px;
          z-index: 3;
        }
        .cn-runner {
          position: absolute;
          left: 0;
          transform: translate(0, -50%);
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          animation: avancar ${DURACAO_MS}ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
          animation-delay: var(--delay);
          z-index: 2;
        }
        @keyframes avancar {
          0%  { left: 32px; }
          100% { left: calc(var(--target-x) - 16px); }
        }
        .cn-icon {
          width: 24px; height: 24px;
          border-radius: 50%;
          background: #fff;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 3px 10px rgba(168,85,247,0.5), 0 0 0 2px rgba(168,85,247,0.3);
          flex-shrink: 0;
          animation: bob 0.45s ease-in-out infinite alternate;
        }
        @keyframes bob {
          0% { transform: translateY(0) rotate(-2deg); }
          100% { transform: translateY(-2px) rotate(2deg); }
        }
        .cn-nome {
          font-family: var(--ff-display);
          font-weight: 800;
          font-size: 11px;
          color: rgba(255,255,255,0.95);
          text-shadow: 0 1px 2px #000, 0 0 8px rgba(168,85,247,0.5);
          letter-spacing: -0.01em;
          max-width: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .cn-pts {
          font-family: var(--ff-mono);
          font-size: 11px;
          font-weight: 800;
          color: #fbbf24;
          background: rgba(0,0,0,0.6);
          padding: 1px 6px;
          border-radius: 6px;
        }
      `}</style>
    </div>
  );
}
