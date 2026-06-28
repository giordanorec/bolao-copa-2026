import { promises as fs } from "fs";
import path from "path";
import {
  SLUGS_SERIE_A,
  APELIDOS_SERIE_A,
  FALLBACK_NAO_WEB,
} from "@/lib/serie-a";

// ──────────────────────────────────────────────────────────────────────────
// Dados narrativos da RETROSPECTIVA DA FASE DE GRUPOS.
// Tudo computado server-side a partir dos JSON públicos (fonte única). A página
// é estática/SSR; nenhuma chamada externa. Fase de grupos = jogos 1–72.
// ──────────────────────────────────────────────────────────────────────────

type FaseStats = {
  pontos: number;
  placares_exatos: number;
  vencedores_acertados: number;
  jogos_palpitados: number;
};

type IARaw = {
  slug: string;
  nome_display: string;
  grupos?: FaseStats;
};

type Jogo = {
  numero: number;
  fase: string;
  time_a: string;
  time_b: string;
  gols_a: number | null;
  gols_b: number | null;
};

type Cristal = Record<
  string,
  { gols_a: number; gols_b: number; votos: number; fonte_ias: string[] }
>;

export type PodioRetro = {
  slug: string;
  nome: string;
  pontos: number;
  exatos: number;
  posicao: 1 | 2 | 3;
};

export type CampeaRetro = {
  nome: string;
  pontos: number;
  exatos: number;
};

export type JogoNarrativo = {
  numero: number;
  timeA: string;
  timeB: string;
  isoA?: string;
  isoB?: string;
  golsA: number;
  golsB: number;
  cristalA: number;
  cristalB: number;
  votos: number;
};

export type GoleadaRetro = {
  numero: number;
  timeA: string;
  timeB: string;
  isoA?: string;
  isoB?: string;
  golsA: number;
  golsB: number;
  totalGols: number;
};

export type RetroData = {
  totalJogos: number;
  totalIas: number;
  totalPalpites: number;
  totalGols: number;
  mediaGolsJogo: string;
  // campeãs
  campeaGeral: CampeaRetro;
  podioSerieA: PodioRetro[];
  // precisão do consenso
  cristalAcertouVencedor: number;
  cristalPctVencedor: number;
  cristalExatos: number;
  cristalPctExatos: number;
  // narrativas
  zebras: JogoNarrativo[];
  zebraDestaque: JogoNarrativo | null;
  goleadas: GoleadaRetro[];
  goleadaDestaque: GoleadaRetro | null;
  jogoMaisConsenso: { numero: number; timeA: string; timeB: string; votos: number } | null;
};

const sign = (x: number) => (x > 0 ? 1 : x < 0 ? -1 : 0);

async function lerJson<T>(arquivo: string): Promise<T> {
  const p = path.join(process.cwd(), "public", arquivo);
  return JSON.parse(await fs.readFile(p, "utf-8")) as T;
}

export async function carregarRetroGrupos(): Promise<RetroData> {
  const [rankRaw, jogosRaw, cristal, isoRaw] = await Promise.all([
    lerJson<{ ias: IARaw[] }>("ranking-ias.json"),
    lerJson<Jogo[] | { jogos: Jogo[] }>("jogos.json"),
    lerJson<Cristal>("bola_de_cristal.json"),
    lerJson<Record<string, string>>("paises_iso.json"),
  ]);

  const iso = { ...isoRaw } as Record<string, string>;
  delete iso._README;
  const isoDe = (time: string) => iso[time];

  const lista = Array.isArray(jogosRaw) ? jogosRaw : jogosRaw.jogos;
  const grupos = lista.filter(
    (j): j is Jogo & { gols_a: number; gols_b: number } =>
      j.numero <= 72 && j.gols_a != null && j.gols_b != null,
  );

  const porSlug = new Map<string, IARaw>();
  for (const ia of rankRaw.ias) porSlug.set(ia.slug, ia);

  // ── Campeã geral (todas as IAs, fase de grupos) ──
  const comGrupos = rankRaw.ias.filter(
    (x) => x.grupos && x.grupos.jogos_palpitados > 0,
  );
  const ordGeral = [...comGrupos].sort(
    (a, b) => (b.grupos!.pontos ?? 0) - (a.grupos!.pontos ?? 0),
  );
  const top = ordGeral[0];
  const campeaGeral: CampeaRetro = {
    nome: top.nome_display,
    pontos: top.grupos!.pontos,
    exatos: top.grupos!.placares_exatos,
  };
  const totalIas = comGrupos.length;

  // ── Pódio da Série A (palpites reais via irmão não-web) ──
  const cand: { slug: string; nome: string; pontos: number; exatos: number }[] =
    [];
  for (const slug of SLUGS_SERIE_A) {
    const oficial = porSlug.get(slug);
    const sibling = FALLBACK_NAO_WEB[slug]
      ? porSlug.get(FALLBACK_NAO_WEB[slug])
      : undefined;
    const fonte = sibling ?? oficial;
    if (!fonte?.grupos) continue;
    cand.push({
      slug,
      nome: APELIDOS_SERIE_A[slug]?.nome ?? oficial?.nome_display ?? slug,
      pontos: fonte.grupos.pontos,
      exatos: fonte.grupos.placares_exatos,
    });
  }
  cand.sort((a, b) => b.pontos - a.pontos);
  const podioSerieA: PodioRetro[] = cand.slice(0, 3).map((c, i) => ({
    slug: c.slug,
    nome: c.nome,
    pontos: c.pontos,
    exatos: c.exatos,
    posicao: (i + 1) as 1 | 2 | 3,
  }));

  // ── Precisão do consenso (Bola de Cristal) ──
  let acertouVenc = 0;
  let exatosCristal = 0;
  const zebras: JogoNarrativo[] = [];
  let totalGols = 0;
  let maisConsenso: { numero: number; timeA: string; timeB: string; votos: number } | null =
    null;

  for (const j of grupos) {
    totalGols += j.gols_a + j.gols_b;
    const c = cristal[String(j.numero)];
    if (!c) continue;
    const real = sign(j.gols_a - j.gols_b);
    const pred = sign(c.gols_a - c.gols_b);
    if (c.gols_a === j.gols_a && c.gols_b === j.gols_b) exatosCristal++;
    if (pred === real) acertouVenc++;
    else
      zebras.push({
        numero: j.numero,
        timeA: j.time_a,
        timeB: j.time_b,
        isoA: isoDe(j.time_a),
        isoB: isoDe(j.time_b),
        golsA: j.gols_a,
        golsB: j.gols_b,
        cristalA: c.gols_a,
        cristalB: c.gols_b,
        votos: c.votos,
      });
    if (!maisConsenso || c.votos > maisConsenso.votos) {
      maisConsenso = {
        numero: j.numero,
        timeA: j.time_a,
        timeB: j.time_b,
        votos: c.votos,
      };
    }
  }

  // Zebra destaque: a maior surpresa = consenso forte que deu errado
  // (mais votos no placar previsto, ranqueado por votos desc).
  const zebrasOrd = [...zebras].sort((a, b) => b.votos - a.votos);
  const zebraDestaque = zebrasOrd[0] ?? null;

  // ── Goleadas / maiores placares ──
  const goleadas: GoleadaRetro[] = [...grupos]
    .map((j) => ({
      numero: j.numero,
      timeA: j.time_a,
      timeB: j.time_b,
      isoA: isoDe(j.time_a),
      isoB: isoDe(j.time_b),
      golsA: j.gols_a,
      golsB: j.gols_b,
      totalGols: j.gols_a + j.gols_b,
    }))
    .sort((a, b) => b.totalGols - a.totalGols)
    .slice(0, 5);

  const totalJogos = grupos.length;
  // Estimativa de palpites: nº de IAs com grupos × jogos palpitados médios.
  const totalPalpites = comGrupos.reduce(
    (acc, x) => acc + (x.grupos!.jogos_palpitados ?? 0),
    0,
  );

  return {
    totalJogos,
    totalIas,
    totalPalpites,
    totalGols,
    mediaGolsJogo: (totalGols / Math.max(1, totalJogos)).toFixed(1),
    campeaGeral,
    podioSerieA,
    cristalAcertouVencedor: acertouVenc,
    cristalPctVencedor: Math.round((acertouVenc / Math.max(1, totalJogos)) * 100),
    cristalExatos: exatosCristal,
    cristalPctExatos: Math.round((exatosCristal / Math.max(1, totalJogos)) * 100),
    zebras: zebrasOrd,
    zebraDestaque,
    goleadas,
    goleadaDestaque: goleadas[0] ?? null,
    jogoMaisConsenso: maisConsenso,
  };
}
