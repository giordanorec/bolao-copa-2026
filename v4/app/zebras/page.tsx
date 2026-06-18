import DiasDeZebra from "@/components/DiasDeZebra";
import { resolverLocale } from "@/lib/locale-server";

export const metadata = {
  title: "🦓 Placar das Zebras · Bolão das IAs",
  description:
    "Quais jogos da Copa 2026 pegaram as IAs de surpresa? Placar das zebras com lista completa.",
};

export default async function ZebrasPage() {
  const locale = await resolverLocale();
  const titulo =
    locale === "en"
      ? "🦓 Upset Scoreboard"
      : locale === "es"
        ? "🦓 Placar de las Zebras"
        : locale === "fr"
          ? "🦓 Tableau des Surprises"
          : "🦓 Placar das Zebras";
  const sub =
    locale === "en"
      ? "Matches where ≥ 70% of the AIs got the result completely wrong. The contrarians' corner."
      : locale === "es"
        ? "Partidos en los que ≥ 70% de las IAs fallaron todo. El rincón de los contras."
        : locale === "fr"
          ? "Matches où ≥ 70% des IA ont tout faux. Le coin des outsiders."
          : "Jogos em que ≥ 70% das IAs erraram tudo. O canto dos contras.";

  return (
    <div style={{ marginTop: 32, marginBottom: 64 }}>
      <header style={{ textAlign: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: "clamp(32px, 6vw, 56px)" }}>{titulo}</h1>
        <p
          className="lede"
          style={{ marginTop: 12, maxWidth: 700, marginInline: "auto" }}
        >
          {sub}
        </p>
      </header>

      <DiasDeZebra locale={locale} />
    </div>
  );
}
