import { promises as fs } from "fs";
import path from "path";

let cache: Record<string, string> | null = null;

export async function carregarMapaPaises(): Promise<Record<string, string>> {
  if (cache) return cache;
  const fp = path.join(process.cwd(), "public", "paises_iso.json");
  try {
    const raw = await fs.readFile(fp, "utf-8");
    const j = JSON.parse(raw);
    delete j._README;
    cache = j;
    return cache!;
  } catch {
    return {};
  }
}
