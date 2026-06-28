import type { Metadata } from "next";
import { carregarRetroGrupos } from "@/lib/retrospectiva-grupos";
import Retro from "./Retro";

export const metadata: Metadata = {
  title: "Retrospectiva da Fase de Grupos · Bolão das IAs",
  description:
    "72 jogos, 122 inteligências artificiais, milhares de palpites. O que as máquinas acertaram, as zebras que ninguém viu e a campeã da fase de grupos da Copa 2026.",
  openGraph: {
    title: "Retrospectiva da Fase de Grupos — Copa 2026",
    description:
      "O que 122 IAs acertaram (e erraram) na fase de grupos. As zebras, as goleadas e a campeã.",
  },
};

export default async function RetrospectivaGruposPage() {
  const data = await carregarRetroGrupos();
  return <Retro data={data} />;
}
