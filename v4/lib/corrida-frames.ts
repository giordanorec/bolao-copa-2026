import { promises as fs } from "fs";
import path from "path";
import { ehSerieA, slugWebSerieA, nomeSerieA } from "@/lib/serie-a";

// Fonte ÚNICA dos dados das animações da corrida (Modo A vista de cima,
// Modo B bar race, Modo C gráfico de pontos). Usado tanto em
// /corrida-das-ias quanto em qualquer outra página que renderize a corrida
// (ex.: home). Mudou algo aqui → muda nos dois lugares automaticamente.

export type IA = {
  slug: string;
  nome_display: string;
  pontos: number;
};

export type Frame = {
  jogoNum: number;
  rotulo: string;
  pts: Record<string, number>;
};

type IARanking = {
  slug: string;
  nome_display: string;
  pontos: number;
  placares_exatos: number;
  jogos_palpitados: number;
  palpites_total?: number;
};

type Resultado = { jogo_numero: number; gols_a: number; gols_b: number };
type Jogo = {
  numero: number;
  fase: string;
  data: string;
  hora: string;
  time_a: string;
  time_b: string;
};
type PorJogo = Record<
  string,
  { palpites: Record<string, { gols_a: number; gols_b: number }> }
>;

// pontuação simplificada — igual a lib/scoring.ts mas inline pra usar em
// jogo a jogo no cumulativo dos frames.
function pts(
  pa: number,
  pb: number,
  ra: number,
  rb: number,
  mataMata: boolean,
): number {
  let base = 0;
  if (pa === ra && pb === rb) base = 10;
  else if (
    Math.sign(pa - pb) === Math.sign(ra - rb) &&
    pa - pb === ra - rb &&
    pa !== pb
  )
    base = 7;
  else if (Math.sign(pa - pb) === Math.sign(ra - rb) && pa !== pb) base = 5;
  else if (pa === pb && ra === rb) base = 5;
  return mataMata ? base * 2 : base;
}

let cache: { topIas: IA[]; frames: Frame[] } | null = null;

export async function carregarCorrida(): Promise<{
  topIas: IA[];
  frames: Frame[];
}> {
  if (cache) return cache;
  const pub = path.join(process.cwd(), "public");
  const [rkRaw, jogosRaw, pjRaw, resRaw] = await Promise.all([
    fs.readFile(path.join(pub, "ranking-ias.json"), "utf-8"),
    fs.readFile(path.join(pub, "jogos.json"), "utf-8"),
    fs.readFile(path.join(pub, "palpites_por_jogo.json"), "utf-8"),
    fs.readFile(path.join(pub, "resultados.json"), "utf-8"),
  ]);
  const ranking = JSON.parse(rkRaw) as { ias: IARanking[] };
  const jogos = JSON.parse(jogosRaw) as Jogo[];
  const palpites = JSON.parse(pjRaw) as PorJogo;
  const resultados = JSON.parse(resRaw) as Resultado[];

  const mapJogo = new Map(jogos.map((j) => [j.numero, j]));

  // Série A colhida via interface web tem palpites_total=0 no -web; os
  // palpites reais ficam no slug "irmão" sem -web. Canonicalizamos pro
  // slug -web pra cada Série A aparecer UMA vez, com a marca certa.
  const canonical = (slug: string): string =>
    ehSerieA(slug) ? slugWebSerieA(slug) : slug;
  const nomePorSlug = new Map(
    ranking.ias.map((ia) => [ia.slug, ia.nome_display]),
  );
  const nomeDe = (canon: string): string =>
    nomeSerieA(canon) ?? nomePorSlug.get(canon) ?? canon;

  const resultOrdenados = [...resultados].sort(
    (a, b) => a.jogo_numero - b.jogo_numero,
  );

  // Acumulado por slug canônico — irmãos da Série A fundidos no -web.
  // Só inclui IAs que de fato entregaram palpite (palpites_total > 0);
  // quem nunca palpitou some da corrida pra não poluir a vista.
  const acumulado: Record<string, number> = {};
  for (const ia of ranking.ias) {
    if (ia.slug === "bola-de-cristal") continue;
    if ((ia.palpites_total ?? 0) === 0) continue;
    acumulado[canonical(ia.slug)] = 0;
  }

  const frames: Frame[] = [];
  frames.push({
    jogoNum: 0,
    rotulo: "Antes do 1º jogo",
    pts: { ...acumulado },
  });

  for (const r of resultOrdenados) {
    const jogo = mapJogo.get(r.jogo_numero);
    if (!jogo) continue;
    const fase = jogo.fase.toLowerCase();
    const mataMata = !fase.startsWith("grupo");
    const dados = palpites[String(r.jogo_numero)];
    if (!dados) continue;
    for (const [slug, p] of Object.entries(dados.palpites)) {
      const ganho = pts(p.gols_a, p.gols_b, r.gols_a, r.gols_b, mataMata);
      const c = canonical(slug);
      acumulado[c] = (acumulado[c] ?? 0) + ganho;
    }
    frames.push({
      jogoNum: r.jogo_numero,
      rotulo: `Jogo ${r.jogo_numero}: ${jogo.time_a} ${r.gols_a}×${r.gols_b} ${jogo.time_b}`,
      pts: { ...acumulado },
    });
  }

  const finalFrame = frames[frames.length - 1].pts;
  const topIas: IA[] = Object.keys(acumulado)
    .map((slug) => ({
      slug,
      nome_display: nomeDe(slug),
      pontos: finalFrame[slug] ?? 0,
    }))
    .sort((a, b) => b.pontos - a.pontos || a.slug.localeCompare(b.slug));

  cache = { topIas, frames };
  return cache;
}
