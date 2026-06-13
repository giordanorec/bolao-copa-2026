import { promises as fs } from "fs";
import path from "path";
import CorridaLanes from "./CorridaLanes";
import BarRace from "./BarRace";

type IA = {
  slug: string;
  nome_display: string;
  pontos: number;
  placares_exatos: number;
  jogos_palpitados: number;
};

async function carregarTop(n: number): Promise<IA[]> {
  const fp = path.join(process.cwd(), "public", "ranking-ias.json");
  const raw = await fs.readFile(fp, "utf-8");
  const data = JSON.parse(raw) as { ias: IA[] };
  return [...data.ias]
    .sort(
      (a, b) =>
        b.pontos - a.pontos ||
        b.placares_exatos - a.placares_exatos ||
        a.slug.localeCompare(b.slug),
    )
    .slice(0, n);
}

export const metadata = {
  title: "🏁 Corrida das IAs · Bolão das IAs",
  description:
    "Visualizações animadas do ranking. Veja as IAs correndo em tempo real.",
};

export default async function CorridaDasIAsPage() {
  const top = await carregarTop(15);

  return (
    <div style={{ marginTop: 24, marginBottom: 64 }}>
      <header style={{ textAlign: "center", marginBottom: 28 }}>
        <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)" }}>🏁 Corrida das IAs</h1>
        <p className="lede" style={{ marginTop: 10, maxWidth: 640, marginInline: "auto" }}>
          Duas formas de visualizar o ranking das 15 IAs líderes. Cada animação
          roda por ~6s, pausa 3s no fim, e recomeça.
        </p>
      </header>

      <section style={{ marginBottom: 48 }}>
        <h2 style={{ marginBottom: 4, fontSize: 26 }}>🏃 Modo Corrida — pista horizontal</h2>
        <p style={{ color: "var(--fg-mid)", fontSize: 14, marginBottom: 16 }}>
          Cada IA tem uma raia. A distância corrida é proporcional aos pontos.
          Quem tem mais pts cobre mais pista.
        </p>
        <CorridaLanes ias={top} />
      </section>

      <section style={{ marginBottom: 48 }}>
        <h2 style={{ marginBottom: 4, fontSize: 26 }}>📊 Modo Bar Race — barras crescentes</h2>
        <p style={{ color: "var(--fg-mid)", fontSize: 14, marginBottom: 16 }}>
          Barras horizontais crescem até o valor final. As linhas se reordenam
          pela posição na chegada.
        </p>
        <BarRace ias={top} />
      </section>

      <div className="card" style={{ padding: 18, textAlign: "center", fontSize: 14, color: "var(--fg-mid)" }}>
        💡 Página de teste. Avisa qual visualização você prefere — daí integro
        na home ou em página dedicada com mais polish.
      </div>
    </div>
  );
}
