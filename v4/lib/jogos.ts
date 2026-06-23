import { promises as fs } from "fs";
import path from "path";
import type { Jogo } from "./types";

let cache: Jogo[] | null = null;

export async function carregarJogos(): Promise<Jogo[]> {
  if (cache) return cache;
  const filePath = path.join(process.cwd(), "public", "jogos.json");
  const raw = await fs.readFile(filePath, "utf-8");
  cache = JSON.parse(raw) as Jogo[];
  return cache;
}

/**
 * Jogo já começou? (tem resultado OU o horário de início já passou)
 * Usado pra esconder os "Palpites Atualizados" (v2) de jogos em andamento ou
 * encerrados — o palpite v2 só faz sentido antes da bola rolar.
 * `hora` é tratado como horário de Brasília (-03:00), convenção do projeto.
 */
export function jogoComecou(jogo: Jogo, agora: Date = new Date()): boolean {
  if (jogo.gols_a != null && jogo.gols_b != null) return true;
  const kickoff = new Date(`${jogo.data}T${jogo.hora}:00-03:00`);
  if (Number.isNaN(kickoff.getTime())) return false;
  return agora.getTime() >= kickoff.getTime();
}
