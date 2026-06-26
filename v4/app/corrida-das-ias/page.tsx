import CorridaComSelector from "./CorridaComSelector";
import BarRaceTemporal from "./BarRaceTemporal";
import PageVisitTracker from "./PageVisitTracker";
import { carregarCorrida } from "@/lib/corrida-frames";

export type { Frame } from "@/lib/corrida-frames";

export const metadata = {
  title: "🏁 Corrida das IAs · Bolão das IAs",
  description: "Visualizações animadas do ranking das IAs.",
};

export default async function CorridaDasIAsPage() {
  const { topIas, frames } = await carregarCorrida();

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

  // Modos A/B: TODAS as IAs (selector faz o filtro client-side)
  const iasAll = topIas; // ja ordenadas por pts desc
  const framesAll = frames;

  return (
    <div style={{ marginTop: 24, marginBottom: 64 }}>
      <PageVisitTracker />
      <header style={{ textAlign: "center", marginBottom: 28 }}>
        <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)" }}>🏁 Corrida das IAs</h1>
        <p className="lede" style={{ marginTop: 10, maxWidth: 640, marginInline: "auto" }}>
          2 formas de visualizar a corrida das IAs ao longo dos jogos.
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

    </div>
  );
}
