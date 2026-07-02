import { promises as fs } from "fs";
import path from "path";
import { ehSerieA, slugWebSerieA, nomeSerieA, SLUGS_SERIE_A } from "@/lib/serie-a";

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

export type FaseCorrida = "grupos" | "matamata" | "geral";

export type DadosFase = {
  topIas: IA[];
  frames: Frame[];
};

export type TodasFases = {
  grupos: DadosFase;
  matamata: DadosFase;
  geral: DadosFase;
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

// Cache por fase para evitar re-leitura de disco
const cacheTodasFases: Map<FaseCorrida, DadosFase> = new Map();

// Lê os JSONs uma vez e retorna os dados brutos compartilhados
type DadosBrutos = {
  ranking: { ias: IARanking[] };
  jogos: Jogo[];
  palpites: PorJogo;
  resultados: Resultado[];
};

let cacheBruto: DadosBrutos | null = null;

async function carregarDadosBrutos(): Promise<DadosBrutos> {
  if (cacheBruto) return cacheBruto;
  const pub = path.join(process.cwd(), "public");
  const [rkRaw, jogosRaw, pjRaw, resRaw] = await Promise.all([
    fs.readFile(path.join(pub, "ranking-ias.json"), "utf-8"),
    fs.readFile(path.join(pub, "jogos.json"), "utf-8"),
    fs.readFile(path.join(pub, "palpites_por_jogo.json"), "utf-8"),
    fs.readFile(path.join(pub, "resultados.json"), "utf-8"),
  ]);
  cacheBruto = {
    ranking: JSON.parse(rkRaw) as { ias: IARanking[] },
    jogos: JSON.parse(jogosRaw) as Jogo[],
    palpites: JSON.parse(pjRaw) as PorJogo,
    resultados: JSON.parse(resRaw) as Resultado[],
  };
  return cacheBruto;
}

// Monta frames para uma seleção de resultados (já ordenados por jogo_numero).
// A acumulação começa do zero no início da fase.
function montarFrames(
  resultadosFase: Resultado[],
  slugsAtivos: Set<string>,
  palpites: PorJogo,
  mapJogo: Map<number, Jogo>,
  canonical: (s: string) => string,
  nomeDe: (s: string) => string,
  rotuloInicial: string,
): DadosFase {
  // Acumulado inicializado em 0 para todos os slugs ativos
  const acumulado: Record<string, number> = {};
  for (const slug of slugsAtivos) {
    acumulado[slug] = 0;
  }

  const frames: Frame[] = [];
  frames.push({
    jogoNum: 0,
    rotulo: rotuloInicial,
    pts: { ...acumulado },
  });

  // Set das vitrines "-web" (slugs oficiais da Série A) — usado pra desempatar
  // quando a vitrine E o irmão API palpitaram o MESMO jogo: preferimos o -web.
  // Sem isso, o slug canonicalizado receberia +ambos e o placar dobraria.
  const vitrinesWeb = new Set(SLUGS_SERIE_A);

  for (const r of resultadosFase) {
    const jogo = mapJogo.get(r.jogo_numero);
    if (!jogo) continue;
    const fase = jogo.fase.toLowerCase();
    const mataMata = !fase.startsWith("grupo");
    const dados = palpites[String(r.jogo_numero)];
    if (!dados) continue;

    // Dedupe por slug canônico dentro de UM jogo. Se a vitrine "-web" e o irmão
    // API palpitaram o mesmo jogo, ambos canonicalizam pro mesmo slug; sem
    // dedupe, os dois somariam. Preferência: quem for vitrine "-web" vence
    // (alinhado com SerieA.melhorFonte na home).
    const ganhoPorCanon: Record<string, { ganho: number; fromWeb: boolean }> = {};
    for (const [slug, p] of Object.entries(dados.palpites)) {
      const c = canonical(slug);
      if (!(c in acumulado)) continue;
      const ganho = pts(p.gols_a, p.gols_b, r.gols_a, r.gols_b, mataMata);
      const fromWeb = vitrinesWeb.has(slug);
      const prev = ganhoPorCanon[c];
      // Prefere -web quando disponível; caso contrário mantém o primeiro visto.
      if (!prev || (fromWeb && !prev.fromWeb)) {
        ganhoPorCanon[c] = { ganho, fromWeb };
      }
    }
    for (const [c, { ganho }] of Object.entries(ganhoPorCanon)) {
      acumulado[c] = (acumulado[c] ?? 0) + ganho;
    }

    frames.push({
      jogoNum: r.jogo_numero,
      rotulo: `Jogo ${r.jogo_numero}: ${jogo.time_a} ${r.gols_a}×${r.gols_b} ${jogo.time_b}`,
      pts: { ...acumulado },
    });
  }

  const finalFrame = frames[frames.length - 1].pts;
  const topIas: IA[] = [...slugsAtivos]
    .map((slug) => ({
      slug,
      nome_display: nomeDe(slug),
      pontos: finalFrame[slug] ?? 0,
    }))
    .sort((a, b) => b.pontos - a.pontos || a.slug.localeCompare(b.slug));

  return { topIas, frames };
}

export async function carregarCorridaTodasFases(): Promise<TodasFases> {
  // Se tudo já está em cache, retorna direto
  const cachedGrupos = cacheTodasFases.get("grupos");
  const cachedMata = cacheTodasFases.get("matamata");
  const cachedGeral = cacheTodasFases.get("geral");
  if (cachedGrupos && cachedMata && cachedGeral) {
    return { grupos: cachedGrupos, matamata: cachedMata, geral: cachedGeral };
  }

  const { ranking, jogos, palpites, resultados } = await carregarDadosBrutos();

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

  // Conjunto de slugs ativos (IAs que de fato palpitaram)
  const slugsAtivos = new Set<string>();
  for (const ia of ranking.ias) {
    if (ia.slug === "bola-de-cristal") continue;
    if ((ia.palpites_total ?? 0) === 0) continue;
    slugsAtivos.add(canonical(ia.slug));
  }

  const resultOrdenados = [...resultados].sort(
    (a, b) => a.jogo_numero - b.jogo_numero,
  );

  // Separa resultados por fase
  // Grupos: jogos 1-72; Mata-mata: jogos > 72
  const resGrupos = resultOrdenados.filter((r) => r.jogo_numero <= 72);
  const resMata = resultOrdenados.filter((r) => r.jogo_numero > 72);

  const dadosGrupos = montarFrames(
    resGrupos,
    slugsAtivos,
    palpites,
    mapJogo,
    canonical,
    nomeDe,
    "Antes do 1º jogo",
  );

  const dadosMata = montarFrames(
    resMata,
    slugsAtivos,
    palpites,
    mapJogo,
    canonical,
    nomeDe,
    "Início do mata-mata",
  );

  const dadosGeral = montarFrames(
    resultOrdenados,
    slugsAtivos,
    palpites,
    mapJogo,
    canonical,
    nomeDe,
    "Antes do 1º jogo",
  );

  cacheTodasFases.set("grupos", dadosGrupos);
  cacheTodasFases.set("matamata", dadosMata);
  cacheTodasFases.set("geral", dadosGeral);

  return { grupos: dadosGrupos, matamata: dadosMata, geral: dadosGeral };
}

// Alias de compatibilidade: retorna os dados da fase geral (comportamento original)
export async function carregarCorrida(): Promise<DadosFase> {
  const { geral } = await carregarCorridaTodasFases();
  return geral;
}
