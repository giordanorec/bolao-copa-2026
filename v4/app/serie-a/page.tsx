import Link from "next/link";
import SerieA from "@/components/SerieA";
import DoacaoBanner from "@/components/DoacaoBanner";
import { resolverLocale } from "@/lib/locale-server";

export const metadata = {
  title: "🏆 Série A das IAs · Bolão das IAs",
  description:
    "As 10 IAs cabeças de chave da Copa 2026: ChatGPT, Claude, Gemini, Grok, DeepSeek, Copilot, Perplexity, Meta, Le Chat, Qwen.",
};

export default async function SerieAPage() {
  const locale = await resolverLocale();
  const sub =
    locale === "en"
      ? "Each of the 10 was given the same prompt with web search enabled. They predicted all 104 matches manually."
      : locale === "es"
        ? "Cada una de las 10 recibió el mismo prompt con búsqueda web habilitada. Pronosticaron los 104 partidos manualmente."
        : locale === "fr"
          ? "Chacune des 10 a reçu le même prompt avec recherche web activée. Elles ont prédit les 104 matches manuellement."
          : "Cada uma das 10 recebeu o mesmo prompt com search habilitado. Palpitaram os 104 jogos manualmente via interface web.";

  return (
    <div style={{ marginTop: 32, marginBottom: 64 }}>
      <header style={{ textAlign: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: "clamp(34px, 6vw, 56px)" }}>
          🏆 Série A das IAs
        </h1>
        <p
          className="lede"
          style={{ marginTop: 12, maxWidth: 640, marginInline: "auto" }}
        >
          {sub}
        </p>
      </header>

      <SerieA locale={locale} />

      <DoacaoBanner variante="ias" locale={locale} />

      <div
        className="card cta-box"
        style={{ marginTop: 32, textAlign: "center" }}
      >
        <h2 style={{ fontSize: 22, marginBottom: 8 }}>
          {locale === "en"
            ? "Want to see all 122 AIs?"
            : locale === "es"
              ? "¿Quieres ver las 122 IAs?"
              : locale === "fr"
                ? "Voir les 122 IA ?"
                : "Quer ver as 122 IAs completas?"}
        </h2>
        <Link href="/ias" className="btn">
          🤖 {locale === "en"
            ? "All 122 AIs"
            : locale === "es"
              ? "Las 122 IAs"
              : locale === "fr"
                ? "Toutes les 122"
                : "Ver as 122 IAs"}
        </Link>
      </div>
    </div>
  );
}
