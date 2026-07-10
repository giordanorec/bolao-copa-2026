import { promises as fs } from "fs";
import path from "path";
import { nomeSerieA, SLUGS_SERIE_A, FALLBACK_NAO_WEB } from "@/lib/serie-a";

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

// Mapa reverso: irmão sem-web -> vitrine -web (pra localizar a fonte oficial
// do mata-mata quando o slug alvo é o irmão sem-web).
const IRMAO_PARA_WEB: Record<string, string> = Object.fromEntries(
  Object.entries(FALLBACK_NAO_WEB).map(([web, irmao]) => [irmao, web]),
);
const SLUGS_SERIE_A_SET = new Set<string>(SLUGS_SERIE_A);

/** Retorna o slug cujos palpites devem ser SOMADOS na fase dada, pra o slug
 *  alvo. Regra: merge por fase pra Série A. Se a vitrine -web tem 0 pontos
 *  no ranking (palpites fantasmas/inválidos), cai pro irmão sem-web também
 *  no mata-mata — assim a corrida bate 1:1 com a Série A oficial.
 */
function fonteDoSlug(
  slug: string,
  mataMata: boolean,
  temPontos: (s: string) => boolean,
): string {
  if (SLUGS_SERIE_A_SET.has(slug)) {
    if (!mataMata) return FALLBACK_NAO_WEB[slug] ?? slug; // grupos → irmão
    return temPontos(slug) ? slug : FALLBACK_NAO_WEB[slug] ?? slug;
  }
  if (IRMAO_PARA_WEB[slug]) {
    if (!mataMata) return slug; // grupos → o próprio (irmão)
    const web = IRMAO_PARA_WEB[slug];
    return temPontos(web) ? web : slug;
  }
  return slug;
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
  temPontos: (s: string) => boolean,
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

  for (const r of resultadosFase) {
    const jogo = mapJogo.get(r.jogo_numero);
    if (!jogo) continue;
    const fase = jogo.fase.toLowerCase();
    const mataMata = !fase.startsWith("grupo");
    const dados = palpites[String(r.jogo_numero)];
    if (!dados) continue;

    // Acumula pra cada slug ativo, com regra especial pra Série A: se o slug
    // alvo é irmão sem-web de uma vitrine (ex.: claude-opus-4-7 <-> claude-
    // opus-4-8-web), no MATA-MATA a fonte oficial é a vitrine -web (mesmo
    // critério da /ranking-ias oficial, que faz "melhor fonte por fase"). Na
    // fase de grupos usamos o próprio slug sem-web (que tem os 72 jogos).
    // Assim os pontos da corrida batem 1:1 com os da Série A oficial.
    for (const slug of Object.keys(acumulado)) {
      const fontePref = fonteDoSlug(slug, mataMata, temPontos);
      const p = dados.palpites[fontePref] ?? dados.palpites[slug];
      if (!p) continue;
      const ganho = pts(p.gols_a, p.gols_b, r.gols_a, r.gols_b, mataMata);
      acumulado[slug] = (acumulado[slug] ?? 0) + ganho;
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

  // Sem canonicalização: cada slug do ranking-ias.json é uma linha na corrida,
  // pra bater 1:1 com o total exibido no ranking geral. Se um modelo tem duas
  // fontes (ex.: qwen-3-max API + qwen-3-max-web Série A), ambas correm.
  const nomePorSlug = new Map(
    ranking.ias.map((ia) => [ia.slug, ia.nome_display]),
  );
  const canonical = (slug: string): string => slug;
  // Kimi K2 é o irmão (sibling) do slot Manus na Série A — o mascote é Manus
  // (via SIBLING_PARA_WEB no CorridaTopDown), então o nome também precisa ser
  // "Manus", não "Kimi K2".
  const APELIDO_OVERRIDE: Record<string, string> = {
    "kimi-k2": "Manus",
  };
  const nomeDe = (slug: string): string =>
    APELIDO_OVERRIDE[slug] ?? nomeSerieA(slug) ?? nomePorSlug.get(slug) ?? slug;

  // Conjunto de slugs ativos (IAs que de fato palpitaram). Exclui as
  // vitrines "-web" da Série A (chatgpt-5-thinking-web, claude-opus-4-8-web,
  // etc.) — o irmão sem-web já representa a marca com dados completos
  // (grupos+matamata) e mascote via arquivoMascote(). Ter as duas rende
  // mascote duplicado do mesmo modelo (Claude Opus 4.7 + Claude Opus 4.8 lado
  // a lado).
  const slugsAtivos = new Set<string>();
  for (const ia of ranking.ias) {
    if (ia.slug === "bola-de-cristal") continue;
    if ((ia.palpites_total ?? 0) === 0) continue;
    // Vitrine -web da Série A que TEM irmão sem-web: pula (o irmão já
    // representa a marca com mascote via arquivoMascote). Slugs sem irmão
    // (ex.: claude-fable-5) ficam.
    if (SLUGS_SERIE_A_SET.has(ia.slug) && FALLBACK_NAO_WEB[ia.slug]) continue;
    if (ia.slug === "manus-web" || ia.slug === "manus") continue;
    slugsAtivos.add(ia.slug);
  }
  // Mapa "slug tem pontos > 0" pra fonteDoSlug decidir se cai pro sem-web
  // quando a vitrine -web tem palpites fantasmas (registrados mas 0 pts).
  const pontosPorSlug = new Map(
    ranking.ias.map((ia) => [ia.slug, ia.pontos ?? 0]),
  );
  const temPontos = (s: string) => (pontosPorSlug.get(s) ?? 0) > 0;

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
    temPontos,
    "Antes do 1º jogo",
  );

  const dadosMata = montarFrames(
    resMata,
    slugsAtivos,
    palpites,
    mapJogo,
    canonical,
    nomeDe,
    temPontos,
    "Início do mata-mata",
  );

  const dadosGeral = montarFrames(
    resultOrdenados,
    slugsAtivos,
    palpites,
    mapJogo,
    canonical,
    nomeDe,
    temPontos,
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
