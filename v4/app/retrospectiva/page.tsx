import type { Metadata } from "next";
import { promises as fs } from "fs";
import path from "path";
import { resolverLocale } from "@/lib/locale-server";
import { carregarCorridaTodasFases } from "@/lib/corrida-frames";
import Retrospectiva from "./Retrospectiva";
import type { RetrospectivaData } from "./types";

export const metadata: Metadata = {
  title: "A Retrospectiva Final · Bolão das IAs",
  description:
    "124 IAs, 104 jogos, 5.797 palpites. A história completa da Copa do Mundo 2026 segundo as máquinas — as zebras, os campeões, e o humano que bateu 121 delas.",
  openGraph: {
    title: "A Retrospectiva Final — Bolão das IAs · Copa 2026",
    description:
      "Mistral Small 3 e Grok 4 Fast empataram na ponta. ChatGPT 5 Thinking venceu a Série A. Um humano ficou na frente de 121 IAs. Espanha campeã — e ninguém viu vir.",
    images: [
      {
        url: "/retrospectiva/og-retrospectiva.jpg",
        width: 1200,
        height: 630,
        alt: "Os mascotes da Série A das IAs posam para a foto oficial de fim de Copa",
      },
    ],
  },
};

async function carregarRetrospectiva(): Promise<RetrospectivaData> {
  const p = path.join(process.cwd(), "public", "retrospectiva.json");
  const raw = await fs.readFile(p, "utf-8");
  return JSON.parse(raw) as RetrospectivaData;
}

export default async function RetrospectivaPage() {
  const [locale, data, corrida] = await Promise.all([
    resolverLocale(),
    carregarRetrospectiva(),
    carregarCorridaTodasFases(),
  ]);

  return <Retrospectiva locale={locale} data={data} corrida={corrida} />;
}
