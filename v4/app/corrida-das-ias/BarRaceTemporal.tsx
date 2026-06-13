"use client";

import { useEffect, useRef, useId } from "react";
import { race } from "racing-bars";
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

type RaceRow = {
  date: string;
  name: string;
  value: number;
  category: string;
  icon?: string;
};

export default function BarRaceTemporal({
  ias,
  frames,
}: {
  ias: IA[];
  frames: Frame[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const idAuto = useId();
  const containerId = `racing-bars-${idAuto.replace(/[:]/g, "")}`;

  useEffect(() => {
    if (!containerRef.current || frames.length === 0) return;

    // Constroi o dataset no formato esperado pela lib:
    // [{ date, name, value, category }, ...]
    const data: RaceRow[] = [];
    const dictIa = Object.fromEntries(ias.map((ia) => [ia.slug, ia]));
    for (const f of frames) {
      const date = f.jogoNum === 0
        ? "Jogo 0"
        : `Jogo ${String(f.jogoNum).padStart(2, "0")}`;
      for (const ia of ias) {
        const pts = f.pts[ia.slug] ?? 0;
        const marca = marcaDe(ia.slug);
        data.push({
          date,
          name: ia.nome_display,
          value: pts,
          category: marca.nome,
        });
      }
    }

    // Cores por categoria (marca) — racing-bars aceita um objeto categoria -> cor
    const colors: Record<string, string> = {};
    for (const ia of ias) {
      const marca = marcaDe(ia.slug);
      colors[marca.nome] = marca.cor;
    }

    let cancelled = false;
    const racePromise = race(data, `#${containerId}`, {
      title: "Corrida das IAs · Copa 2026",
      subTitle: "Pontos cumulativos ao longo dos jogos apurados",
      caption: "bolao.arenadasias.com.br",
      labelsPosition: "outside",
      topN: 10,
      tickDuration: 1200,           // 1.2s por frame — mais lento que antes
      loop: true,
      autorun: true,
      colorMap: colors,
      colorSeed: "fixed",
      showIcons: false,
      showGroups: false,
      dateCounter: "date",
      controlButtons: "all",
      theme: "dark",
      height: "560px",
    });

    return () => {
      cancelled = true;
      racePromise.then((ctrl) => {
        if (!cancelled) return;
        try {
          (ctrl as unknown as { destroy?: () => void })?.destroy?.();
        } catch {
          if (containerRef.current) containerRef.current.innerHTML = "";
        }
      }).catch(() => {
        if (containerRef.current) containerRef.current.innerHTML = "";
      });
    };
  }, [containerId, frames, ias]);

  return (
    <div className="brt-wrap">
      <div id={containerId} ref={containerRef} />
      <style>{`
        .brt-wrap {
          background: #0f0a26;
          border: 2px solid rgba(168, 85, 247, 0.4);
          border-radius: var(--r-l);
          padding: 12px;
          overflow: hidden;
        }
        .brt-wrap :global(.racing-bars) {
          font-family: var(--ff-display);
        }
      `}</style>
    </div>
  );
}
