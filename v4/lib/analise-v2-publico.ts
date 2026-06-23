import { promises as fs } from "fs";
import path from "path";

export type AnaliseV2Agg = {
  comparacoes: number;
  mudaram: number;
  pct_mudaram: number;
  pts_v1: number;
  pts_v2: number;
  delta: number;
  delta_pct: number;
  media_v1: number;
  media_v2: number;
  media_delta: number;
  melhoraram: number;
  pioraram: number;
  iguais: number;
  exatos_v1: number;
  exatos_v2: number;
  total: number;
  pct_exato_v1: number;
  pct_exato_v2: number;
};

export type AnaliseV2Jogo = {
  numero: number;
  time_a: string;
  time_b: string;
  gols_a: number;
  gols_b: number;
  consenso_v1: { a: number; b: number } | null;
  consenso_v2: { a: number; b: number } | null;
  mudaram: number;
  total: number;
  pts_v1: number;
  pts_v2: number;
};

export type AnaliseV2Destaque = {
  slug: string;
  nome: string;
  v1: number;
  v2: number;
  delta: number;
};

export type AnaliseV2Publico = {
  gerado_em: string;
  corte_v2: number;
  jogos: number[];
  n_ias: number;
  agg: AnaliseV2Agg;
  por_jogo: AnaliseV2Jogo[];
  destaques: AnaliseV2Destaque[];
};

export async function carregarAnaliseV2Publico(): Promise<AnaliseV2Publico | null> {
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), "public", "analise-v2-publico.json"),
      "utf-8",
    );
    return JSON.parse(raw) as AnaliseV2Publico;
  } catch {
    return null;
  }
}
