import Link from "next/link";
import CorridaComSelector from "@/app/corrida-das-ias/CorridaComSelector";
import { carregarCorridaTodasFases } from "@/lib/corrida-frames";
import type { Locale } from "@/lib/i18n";

// Renderiza o MESMO CorridaComSelector (Modo A vista de cima) da página
// /corrida-das-ias na home. Fonte de dados ÚNICA via carregarCorridaTodasFases().
// Qualquer mudança no componente, no scoring ou na trilha de pontos
// reflete nos dois lugares automaticamente.

const TX: Record<
  Locale,
  { titulo: string; lede: string; cta: string }
> = {
  pt: {
    titulo: "🏃 A corrida das IAs",
    lede: "Cada IA avança jogo a jogo; a posição é a pontuação real acumulada. Default: Mata-mata, Série A. Use os seletores pra explorar.",
    cta: "Ver mais visualizações (bar race + gráfico) →",
  },
  en: {
    titulo: "🏃 The AI Race",
    lede: "Each AI advances match by match; position is the real cumulative score. Default: Knockout, Premier League. Use the selectors to explore.",
    cta: "See more views (bar race + chart) →",
  },
  es: {
    titulo: "🏃 La carrera de las IAs",
    lede: "Cada IA avanza partido a partido; la posición es el puntaje real acumulado. Por defecto: Mata-mata, Liga A. Usa los selectores para explorar.",
    cta: "Ver más visualizaciones (bar race + gráfico) →",
  },
  fr: {
    titulo: "🏃 La course des IA",
    lede: "Chaque IA avance match par match ; la position est le score réel cumulé. Par défaut : Éliminatoires, Ligue 1. Utilisez les sélecteurs pour explorer.",
    cta: "Voir plus de visualisations (bar race + graphique) →",
  },
};

export default async function CorridaHome({
  locale = "pt",
}: {
  locale?: Locale;
}) {
  const { grupos, matamata, geral } = await carregarCorridaTodasFases();
  // Mostra a home apenas se há IAs e ao menos um frame além do inicial (geral ou grupos)
  if (geral.topIas.length === 0 && grupos.topIas.length === 0) return null;
  const tx = TX[locale];

  return (
    <section className="section" style={{ paddingTop: 12, paddingBottom: 12 }}>
      <div className="container">
        <div style={{ marginBottom: 16, textAlign: "center" }}>
          <h2 style={{ marginBottom: 6, fontSize: "clamp(22px, 4vw, 30px)" }}>
            {tx.titulo}
          </h2>
          <p
            style={{
              color: "var(--fg-mid)",
              fontSize: 14,
              maxWidth: 600,
              marginInline: "auto",
            }}
          >
            {tx.lede}
          </p>
        </div>

        <CorridaComSelector grupos={grupos} matamata={matamata} geral={geral} />

        <div style={{ marginTop: 18, textAlign: "center" }}>
          <Link
            href="/corrida-das-ias"
            style={{ color: "var(--primary)", fontWeight: 700, fontSize: 14 }}
          >
            {tx.cta}
          </Link>
        </div>
      </div>
    </section>
  );
}
