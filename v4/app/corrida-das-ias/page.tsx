import { promises as fs } from "fs";
import path from "path";
import CorridaComSelector from "./CorridaComSelector";
import BarRaceTemporal from "./BarRaceTemporal";
import { GraficoDistanciaComSelector } from "./GraficosComSelector";
import PageVisitTracker from "./PageVisitTracker";
import { ehSerieA, slugWebSerieA, nomeSerieA } from "@/lib/serie-a";

type IARanking = {
  slug: string;
  nome_display: string;
  pontos: number;
  placares_exatos: number;
  jogos_palpitados: number;
  palpites_total?: number;
};

type IA = {
  slug: string;
  nome_display: string;
  pontos: number;
};

export type Frame = { jogoNum: number; rotulo: string; pts: Record<string, number> };

type Resultado = { jogo_numero: number; gols_a: number; gols_b: number };
type Jogo = {
  numero: number;
  fase: string;
  data: string;
  hora: string;
  time_a: string;
  time_b: string;
};
type PorJogo = Record<string, { palpites: Record<string, { gols_a: number; gols_b: number }> }>;

// pontuação simplificada (igual a lib/scoring.ts mas inline pra usar em jogo a jogo)
function pts(
  pa: number, pb: number,
  ra: number, rb: number,
  mataMata: boolean,
): number {
  let base = 0;
  if (pa === ra && pb === rb) base = 10;
  else if (
    Math.sign(pa - pb) === Math.sign(ra - rb) &&
    pa - pb === ra - rb &&
    pa !== pb
  ) base = 7;
  else if (Math.sign(pa - pb) === Math.sign(ra - rb) && pa !== pb) base = 5;
  else if (pa === pb && ra === rb) base = 5;
  return mataMata ? base * 2 : base;
}

async function carregarTudo() {
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

  // mapa jogo -> jogo full pra saber a fase
  const mapJogo = new Map(jogos.map((j) => [j.numero, j]));

  // Série A é colhida via interface web, mas os palpites são salvos sob o slug
  // "irmão" (sem -web). Canonicalizamos pro slug -web pra cada modelo da Série A
  // aparecer UMA vez, com a marca certa e os pontos reais. (Sem isso, o preset
  // Série A seleciona os -web vazios e o gráfico vira 2 linhas chapadas.)
  const canonical = (slug: string): string =>
    ehSerieA(slug) ? slugWebSerieA(slug) : slug;
  const nomePorSlug = new Map(ranking.ias.map((ia) => [ia.slug, ia.nome_display]));
  const nomeDe = (canon: string): string =>
    nomeSerieA(canon) ?? nomePorSlug.get(canon) ?? canon;

  // Computa pts cumulativo por IA depois de cada jogo (em ordem)
  const resultOrdenados = [...resultados].sort((a, b) => a.jogo_numero - b.jogo_numero);

  // Acumulado por slug canônico (irmãos da Série A já fundidos no -web).
  // Só inclui IAs que de fato entregaram palpite (palpites_total > 0); a
  // Série A entra via o sibling não-web (que tem palpites). Quem nunca
  // palpitou some da corrida — não polui a vista de cima.
  const acumulado: Record<string, number> = {};
  for (const ia of ranking.ias) {
    if (ia.slug === "bola-de-cristal") continue;
    if ((ia.palpites_total ?? 0) === 0) continue;
    acumulado[canonical(ia.slug)] = 0;
  }

  // Frames: cada frame tem pts por IA ATÉ aquele jogo (cumulativo)
  const frames: Frame[] = [];

  // Frame inicial (zerado, antes de qualquer jogo)
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

  // Lista de IAs (slug canônico), pontos = acumulado final, ordenada por pts desc
  const finalFrame = frames[frames.length - 1].pts;
  const topIas: IA[] = Object.keys(acumulado)
    .map((slug) => ({
      slug,
      nome_display: nomeDe(slug),
      pontos: finalFrame[slug] ?? 0,
    }))
    .sort((a, b) => b.pontos - a.pontos || a.slug.localeCompare(b.slug));

  return { topIas, frames };
}

export const metadata = {
  title: "🏁 Corrida das IAs · Bolão das IAs",
  description: "Visualizações animadas do ranking das IAs.",
};

export default async function CorridaDasIAsPage() {
  const { topIas, frames } = await carregarTudo();

  // Pra bar races: top 15
  const ias15 = topIas.slice(0, 15);
  const ias15Slugs = new Set(ias15.map((ia) => ia.slug));
  const framesTop15 = frames.map((f) => ({
    jogoNum: f.jogoNum,
    rotulo: f.rotulo,
    pts: Object.fromEntries(
      Object.entries(f.pts).filter(([s]) => ias15Slugs.has(s)),
    ),
  }));

  // Pra C/D: TODAS as IAs (default seleciona todas; user pode filtrar)
  const iasAll = topIas; // ja ordenadas por pts desc
  // frames com TODAS as IAs (selector faz o filtro client-side)
  const framesAll = frames;

  return (
    <div style={{ marginTop: 24, marginBottom: 64 }}>
      <PageVisitTracker />
      <header style={{ textAlign: "center", marginBottom: 28 }}>
        <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)" }}>🏁 Corrida das IAs</h1>
        <p className="lede" style={{ marginTop: 10, maxWidth: 640, marginInline: "auto" }}>
          3 formas de visualizar a corrida das IAs ao longo dos jogos.
        </p>
      </header>

      <section style={{ marginBottom: 56 }}>
        <h2 style={{ marginBottom: 4, fontSize: 26 }}>🏃 Modo A — Corrida vista de cima</h2>
        <p style={{ color: "var(--fg-mid)", fontSize: 14, marginBottom: 16 }}>
          Cada IA avança jogo a jogo; a posição em cada rodada é a pontuação
          real acumulada até ali — não uma aproximação linear da posição final.
          Use os presets (Série A, Top 10, Todas) pra escolher quais exibir.
        </p>
        <CorridaComSelector ias={iasAll} frames={framesAll} />
      </section>

      <section style={{ marginBottom: 56 }}>
        <h2 style={{ marginBottom: 4, fontSize: 26 }}>📊 Modo B — Bar Race</h2>
        <p style={{ color: "var(--fg-mid)", fontSize: 14, marginBottom: 16 }}>
          Top 10 IAs subindo e descendo a cada jogo apurado. IAs entram
          desbaixo e saem por baixo quando passam dos top 10.
        </p>
        <BarRaceTemporal ias={ias15} frames={framesTop15} />
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ marginBottom: 4, fontSize: 26 }}>🎯 Modo C — Pontos acumulados</h2>
        <p style={{ color: "var(--fg-mid)", fontSize: 14, marginBottom: 16 }}>
          Pontuação real de cada IA acumulada jogo a jogo. Use os presets
          (Série A, Top 10, Todas) pra escolher quais exibir.
        </p>
        <GraficoDistanciaComSelector ias={iasAll} frames={framesAll} />
      </section>
    </div>
  );
}
