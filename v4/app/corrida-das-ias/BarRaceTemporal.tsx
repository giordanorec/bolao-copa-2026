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

    // Filtra IAs que terminaram com 0 pts (nao aparecem no race)
    const iasComPts = ias.filter((ia) => {
      const ult = frames[frames.length - 1];
      return (ult?.pts[ia.slug] ?? 0) > 0;
    });

    // Constroi o dataset no formato esperado pela lib racing-bars:
    // [{ date, name, value, category }, ...]
    const data: RaceRow[] = [];
    for (const f of frames) {
      const date = f.jogoNum === 0
        ? "00 · Antes da Copa"
        : `${String(f.jogoNum).padStart(2, "0")} · ${f.rotulo.replace(/^Jogo \d+: /, "")}`;
      for (const ia of iasComPts) {
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
      subTitle: "Top 10 pontos cumulativos por jogo apurado",
      caption: "bolao.arenadasias.com.br",
      labelsPosition: "outside",
      topN: 10,
      tickDuration: 4000,       // 4s por frame — bem mais lento, dá pra acompanhar
      loop: true,
      autorun: true,
      colorMap: colors,
      colorSeed: "fixed",
      showIcons: false,
      showGroups: false,
      mouseControls: true,
      keyboardControls: true,
      dateCounter: "date",
      controlButtons: "all",
      overlays: "all",
      theme: "dark",
      height: "640px",
      injectStyles: true,
      labelsWidth: 220,         // espaço pros nomes longos
      marginLeft: 16,
      marginRight: 30,
      marginTop: 60,
      marginBottom: 60,
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
