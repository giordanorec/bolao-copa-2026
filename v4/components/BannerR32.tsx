import type { Locale } from "@/lib/i18n";

export default function BannerR32({ locale }: { locale: Locale }) {
  const pt = locale === "pt";
  const en = locale === "en";
  const es = locale === "es";
  const fr = locale === "fr";

  const tit = pt
    ? "🇧🇷 BRASIL 2×1 JAPÃO!"
    : en
      ? "🇧🇷 BRAZIL 2×1 JAPAN!"
      : es
        ? "🇧🇷 ¡BRASIL 2×1 JAPÓN!"
        : "🇧🇷 BRÉSIL 2×1 JAPON !";

  const brasilLinha = pt
    ? "11 IAs cravaram o placar exato — incluindo 7 da Série A via Web (ChatGPT 5 Thinking, Claude Opus 4.8, Gemini 2.5 Pro, DeepSeek R1, Meta Llama 4, Perplexity Sonar, Qwen 3 Max)."
    : en
      ? "11 AIs nailed the exact score — including 7 of the Premier League via Web (ChatGPT 5 Thinking, Claude Opus 4.8, Gemini 2.5 Pro, DeepSeek R1, Meta Llama 4, Perplexity Sonar, Qwen 3 Max)."
      : es
        ? "11 IAs clavaron el marcador exacto — incluyendo 7 de la Liga A via Web (ChatGPT 5 Thinking, Claude Opus 4.8, Gemini 2.5 Pro, DeepSeek R1, Meta Llama 4, Perplexity Sonar, Qwen 3 Max)."
        : "11 IA ont trouvé le score exact — dont 7 de la Ligue A via Web (ChatGPT 5 Thinking, Claude Opus 4.8, Gemini 2.5 Pro, DeepSeek R1, Meta Llama 4, Perplexity Sonar, Qwen 3 Max).";

  const tituloAleParaTit = pt
    ? "🇩🇪 ALEMANHA 1×1 PARAGUAI 🇵🇾"
    : en
      ? "🇩🇪 GERMANY 1×1 PARAGUAY 🇵🇾"
      : es
        ? "🇩🇪 ALEMANIA 1×1 PARAGUAY 🇵🇾"
        : "🇩🇪 ALLEMAGNE 1×1 PARAGUAY 🇵🇾";

  const aleParaLinha = pt
    ? "Só UMA IA cravou que ia dar empate (Liquid LFM-40B chutou 0×0). Paraguai venceu nos pênaltis."
    : en
      ? "Only ONE AI predicted a tie (Liquid LFM-40B picked 0×0). Paraguay won on penalties."
      : es
        ? "Solo UNA IA acertó que sería empate (Liquid LFM-40B pronosticó 0×0). Paraguay ganó en penales."
        : "Une SEULE IA a prédit le match nul (Liquid LFM-40B a misé 0×0). Le Paraguay a gagné aux tirs au but.";

  const parabens = pt
    ? "Parabéns 🇨🇦 Canadá e 🇵🇾 Paraguai pela classificação!"
    : en
      ? "Congrats 🇨🇦 Canada and 🇵🇾 Paraguay on advancing!"
      : es
        ? "Felicidades 🇨🇦 Canadá y 🇵🇾 Paraguay por la clasificación."
        : "Bravo 🇨🇦 Canada et 🇵🇾 Paraguay pour la qualification !";

  const ansioso = pt
    ? "Aguardando ansioso 🇳🇱 Holanda × Marrocos 🇲🇦 — 22h."
    : en
      ? "Eagerly awaiting 🇳🇱 Netherlands × Morocco 🇲🇦 — kickoff 22:00 BRT."
      : es
        ? "Esperando ansiosos 🇳🇱 Países Bajos × Marruecos 🇲🇦 — 22h BRT."
        : "Vivement 🇳🇱 Pays-Bas × Maroc 🇲🇦 — 22h BRT.";

  return (
    <section
      className="section"
      style={{ paddingTop: 8, paddingBottom: 8 }}
    >
      <div className="container">
        <div
          className="card"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in srgb, #009C3B 14%, transparent), color-mix(in srgb, #FFC700 12%, transparent))",
            border: "2px solid color-mix(in srgb, #009C3B 40%, transparent)",
            padding: "20px 22px",
            maxWidth: 880,
            margin: "0 auto",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 12,
            }}
          >
            <span
              style={{
                fontFamily: "var(--ff-mono)",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--fg-muted)",
                fontWeight: 700,
              }}
            >
              {pt
                ? "Rodada R32 · 29/06"
                : en
                  ? "Round of 32 · 29 June"
                  : es
                    ? "Octavos · 29/06"
                    : "8e de finale · 29/06"}
            </span>
            <span style={{ fontSize: 28, lineHeight: 1 }}>⚽</span>
          </div>

          <h2
            style={{
              fontSize: "clamp(22px, 4vw, 32px)",
              fontWeight: 900,
              marginBottom: 6,
              lineHeight: 1.15,
              color: "var(--fg)",
            }}
          >
            {tit}
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.5, marginBottom: 18, color: "var(--fg-mid)" }}>
            {brasilLinha}
          </p>

          <h3
            style={{
              fontSize: "clamp(18px, 3vw, 22px)",
              fontWeight: 800,
              marginBottom: 6,
              lineHeight: 1.2,
              color: "var(--fg)",
            }}
          >
            {tituloAleParaTit}
          </h3>
          <p style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 18, color: "var(--fg-mid)" }}>
            {aleParaLinha}
          </p>

          <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 6, color: "var(--fg)" }}>
            {parabens}
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 18, color: "var(--fg-mid)" }}>
            {ansioso}
          </p>

          <div
            style={{
              borderTop: "1px dashed color-mix(in srgb, var(--secondary) 30%, transparent)",
              paddingTop: 14,
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontFamily: "var(--ff-display)",
                fontSize: "clamp(28px, 5vw, 40px)",
                fontWeight: 900,
                color: "#009C3B",
                lineHeight: 1.1,
                margin: 0,
                letterSpacing: "0.02em",
              }}
            >
              VAAAAAAI BRASIL 🇧🇷
            </p>
            <p
              lang="ja"
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: "var(--fg)",
                marginTop: 14,
                lineHeight: 1.5,
              }}
            >
              日本、あなたは素晴らしい対戦相手でした 🇯🇵
            </p>
            <p
              style={{
                fontSize: 12,
                color: "var(--fg-muted)",
                fontStyle: "italic",
                marginTop: 4,
              }}
            >
              {pt
                ? "(Japão, você foi um grande oponente)"
                : en
                  ? "(Japan, you were a great opponent)"
                  : es
                    ? "(Japón, fuiste un gran rival)"
                    : "(Japon, tu as été un grand adversaire)"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
