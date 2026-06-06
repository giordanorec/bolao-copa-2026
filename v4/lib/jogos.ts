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
