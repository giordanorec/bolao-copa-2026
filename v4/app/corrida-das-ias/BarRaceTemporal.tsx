"use client";

/// <reference types="racing-bars/racing-bars" />
// @ts-expect-error — racing-bars expoe types via module-augment, mas package.json nao mapeia "./react" pros types
import RacingBars from "racing-bars/react";
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
};

export default function BarRaceTemporal({
  ias,
  frames,
}: {
  ias: IA[];
  frames: Frame[];
}) {
  // Filtra IAs com 0 pts no fim (não aparecem no race)
  const iasComPts = ias.filter((ia) => {
    const ult = frames[frames.length - 1];
    return (ult?.pts[ia.slug] ?? 0) > 0;
  });

  // Constroi o dataset
  // Datas precisam ser sortáveis lexicograficamente
  const data: RaceRow[] = [];
  for (let frameIdx = 0; frameIdx < frames.length; frameIdx++) {
    const f = frames[frameIdx];
    const date = `Jogo ${String(frameIdx).padStart(2, "0")}`;
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

  // Mapeia cores por marca
  const colorMap: Record<string, string> = {};
  for (const ia of iasComPts) {
    const marca = marcaDe(ia.slug);
    colorMap[marca.nome] = marca.cor;
  }

  return (
    <div
      style={{
        background: "#0f0a26",
        border: "2px solid rgba(168, 85, 247, 0.4)",
        borderRadius: "var(--r-l)",
        padding: 12,
      }}
    >
      <RacingBars
        data={data}
        title="Corrida das IAs · Copa 2026"
        subTitle="Top 10 pontos cumulativos por jogo apurado"
        caption="bolao.arenadasias.com.br"
        labelsPosition="outside"
        topN={10}
        tickDuration={4000}
        loop={true}
        autorun={true}
        colorMap={colorMap}
        colorSeed="fixed"
        showIcons={false}
        showGroups={false}
        mouseControls={true}
        keyboardControls={true}
        dateCounter="date"
        controlButtons="all"
        overlays="all"
        theme="dark"
        height={640}
        injectStyles={true}
        labelsWidth={220}
        marginLeft={16}
        marginRight={30}
        marginTop={60}
        marginBottom={60}
      />
    </div>
  );
}
