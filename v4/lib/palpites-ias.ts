import { promises as fs } from "fs";
import path from "path";

export type PalpiteIA = { gols_a: number; gols_b: number };

export type ConsensoLinha = {
  gols_a: number;
  gols_b: number;
  votos: number;
  ias: string[];
};

export type DadosPorJogo = {
  palpites: Record<string, PalpiteIA>;
  consenso: ConsensoLinha[];
  bola_de_cristal: {
    gols_a: number;
    gols_b: number;
    votos: number;
    fonte_ias: string[];
  } | null;
};

let cachePalpites: Record<string, DadosPorJogo> | null = null;
let cacheIAs: Record<string, string> | null = null;

export async function carregarPalpitesIAs(): Promise<
  Record<string, DadosPorJogo>
> {
  if (cachePalpites) return cachePalpites;
  const fp = path.join(process.cwd(), "public", "palpites_por_jogo.json");
  try {
    const raw = await fs.readFile(fp, "utf-8");
    cachePalpites = JSON.parse(raw);
    return cachePalpites!;
  } catch {
    return {};
  }
}

export async function carregarDictIAs(): Promise<Record<string, string>> {
  if (cacheIAs) return cacheIAs;
  const fp = path.join(process.cwd(), "public", "ias_dict.json");
  try {
    const raw = await fs.readFile(fp, "utf-8");
    cacheIAs = JSON.parse(raw);
    return cacheIAs!;
  } catch {
    return {};
  }
}
