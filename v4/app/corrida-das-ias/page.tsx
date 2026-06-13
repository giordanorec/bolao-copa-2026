import { promises as fs } from "fs";
import path from "path";
import CorridaTopDown from "./CorridaTopDown";
import BarRaceTemporal from "./BarRaceTemporal";
import BarRaceCustom from "./BarRaceCustom";
import {
  GraficoEstaticoComSelector,
  GraficoDistanciaComSelector,
} from "./GraficosComSelector";

type IA = {
  slug: string;
  nome_display: string;
  pontos: number;
  placares_exatos: number;
  jogos_palpitados: number;
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
  const ranking = JSON.parse(rkRaw) as { ias: IA[] };
  const jogos = JSON.parse(jogosRaw) as Jogo[];
  const palpites = JSON.parse(pjRaw) as PorJogo;
  const resultados = JSON.parse(resRaw) as Resultado[];

  // mapa jogo -> jogo full pra saber a fase
  const mapJogo = new Map(jogos.map((j) => [j.numero, j]));

  // Computa pts cumulativo por IA depois de cada jogo (em ordem)
  const resultOrdenados = [...resultados].sort((a, b) => a.jogo_numero - b.jogo_numero);

  // Lista de IAs com >0 pts no fim (pra não poluir gráfico)
  const topIas = [...ranking.ias]
    .filter((ia) => ia.slug !== "bola-de-cristal")
    .sort(
      (a, b) =>
        b.pontos - a.pontos ||
        b.placares_exatos - a.placares_exatos ||
        a.slug.localeCompare(b.slug),
    );

  // Frames: cada frame tem pts por IA ATÉ aquele jogo (cumulativo)
  type Frame = { jogoNum: number; rotulo: string; pts: Record<string, number> };
  const frames: Frame[] = [];
  const acumulado: Record<string, number> = {};
  for (const ia of topIas) acumulado[ia.slug] = 0;

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
      acumulado[slug] = (acumulado[slug] ?? 0) + ganho;
    }
    frames.push({
      jogoNum: r.jogo_numero,
      rotulo: `Jogo ${r.jogo_numero}: ${jogo.time_a} ${r.gols_a}×${r.gols_b} ${jogo.time_b}`,
      pts: { ...acumulado },
    });
  }

  return { topIas, frames };
}

export const metadata = {
  title: "🏁 Corrida das IAs · Bolão das IAs",
  description: "Visualizações animadas do ranking das IAs.",
};

export default async function CorridaDasIAsPage() {
  const { topIas, frames } = await carregarTudo();

  // Pra corrida top-down: usa as 50 primeiras pra dar movimento
  const ias50 = topIas.slice(0, 50);

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
      <header style={{ textAlign: "center", marginBottom: 28 }}>
        <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)" }}>🏁 Corrida das IAs</h1>
        <p className="lede" style={{ marginTop: 10, maxWidth: 640, marginInline: "auto" }}>
          3 formas de visualizar o ranking. Cada modo mostra os dados de um
          ângulo diferente.
        </p>
      </header>

      <section style={{ marginBottom: 56 }}>
        <h2 style={{ marginBottom: 4, fontSize: 26 }}>🏃 Modo A — Corrida vista de cima</h2>
        <p style={{ color: "var(--fg-mid)", fontSize: 14, marginBottom: 16 }}>
          50 IAs correndo num campo aberto. Líderes na frente, retardatários
          atrás. Algoritmo de empacotamento distribui as IAs em raias virtuais
          pra evitar sobreposição. Nome segue o ícone.
        </p>
        <CorridaTopDown ias={ias50} />
      </section>

      <section style={{ marginBottom: 56 }}>
        <h2 style={{ marginBottom: 4, fontSize: 26 }}>📊 Modo B1 — Bar Race (custom)</h2>
        <p style={{ color: "var(--fg-mid)", fontSize: 14, marginBottom: 16 }}>
          Versão custom — todas as 15 IAs sempre visíveis, posicionadas por
          rank, transições suaves. Mais fácil de seguir uma IA específica.
        </p>
        <BarRaceCustom ias={ias15} frames={framesTop15} />
      </section>

      <section style={{ marginBottom: 56 }}>
        <h2 style={{ marginBottom: 4, fontSize: 26 }}>📊 Modo B2 — Bar Race (lib racing-bars)</h2>
        <p style={{ color: "var(--fg-mid)", fontSize: 14, marginBottom: 16 }}>
          Versão da biblioteca <code>racing-bars</code> — só top 10 visíveis,
          IAs entram e saem do quadro como nos vídeos do YouTube.
        </p>
        <BarRaceTemporal ias={ias15} frames={framesTop15} />
      </section>

      <section style={{ marginBottom: 56 }}>
        <h2 style={{ marginBottom: 4, fontSize: 26 }}>📈 Modo C — Gráfico de linhas (absoluto)</h2>
        <p style={{ color: "var(--fg-mid)", fontSize: 14, marginBottom: 16 }}>
          Y = pontos absolutos. Eixo X = rodadas. Mostra TODAS as {iasAll.length}{" "}
          IAs por padrão — use o seletor pra filtrar grupos ou IAs específicas.
        </p>
        <GraficoEstaticoComSelector ias={iasAll} frames={framesAll} />
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ marginBottom: 4, fontSize: 26 }}>🎯 Modo D — Posição relativa</h2>
        <p style={{ color: "var(--fg-mid)", fontSize: 14, marginBottom: 16 }}>
          Y centrado em 50. Líder de cada rodada vai pra 90, último vai pra 10,
          meio do pelotão fica no meio. TODAS as {iasAll.length} IAs por padrão
          — use o seletor pra focar.
        </p>
        <GraficoDistanciaComSelector ias={iasAll} frames={framesAll} />
      </section>
    </div>
  );
}
