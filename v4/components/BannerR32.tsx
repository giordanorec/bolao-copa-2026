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

  const empatesTit = pt
    ? "🤝 Duas batalhas decididas nos pênaltis"
    : en
      ? "🤝 Two battles decided on penalties"
      : es
        ? "🤝 Dos batallas decididas en penales"
        : "🤝 Deux batailles décidées aux tirs au but";

  const alePara = pt
    ? "🇩🇪 Alemanha 1×1 Paraguai 🇵🇾 — só UMA IA cravou que ia dar empate (Liquid LFM-40B chutou 0×0). Paraguai venceu nos pênaltis."
    : en
      ? "🇩🇪 Germany 1×1 Paraguay 🇵🇾 — only ONE AI predicted a tie (Liquid LFM-40B picked 0×0). Paraguay won on penalties."
      : es
        ? "🇩🇪 Alemania 1×1 Paraguay 🇵🇾 — solo UNA IA acertó que sería empate (Liquid LFM-40B pronosticó 0×0). Paraguay ganó en penales."
        : "🇩🇪 Allemagne 1×1 Paraguay 🇵🇾 — une SEULE IA a prédit le match nul (Liquid LFM-40B a misé 0×0). Le Paraguay a gagné aux tirs au but.";

  const holMar = pt
    ? "🇳🇱 Holanda 1×1 Marrocos 🇲🇦 — 6 IAs cravaram o placar exato (meta-llama-4, deepseek-v3-1, deepseek-v3-2, ministral-8b, chatgpt-5, llama-4-maverick). Marrocos venceu por 3×2 nos pênaltis."
    : en
      ? "🇳🇱 Netherlands 1×1 Morocco 🇲🇦 — 6 AIs nailed the exact 1×1 (meta-llama-4, deepseek-v3-1, deepseek-v3-2, ministral-8b, chatgpt-5, llama-4-maverick). Morocco won 3×2 on penalties."
      : es
        ? "🇳🇱 Países Bajos 1×1 Marruecos 🇲🇦 — 6 IAs clavaron el 1×1 exacto (meta-llama-4, deepseek-v3-1, deepseek-v3-2, ministral-8b, chatgpt-5, llama-4-maverick). Marruecos ganó 3×2 en penales."
        : "🇳🇱 Pays-Bas 1×1 Maroc 🇲🇦 — 6 IA ont trouvé le 1×1 exact (meta-llama-4, deepseek-v3-1, deepseek-v3-2, ministral-8b, chatgpt-5, llama-4-maverick). Le Maroc s'est imposé 3×2 aux tirs au but.";

  const classificados = pt
    ? "Parabéns aos classificados de ontem: 🇨🇦 Canadá, 🇧🇷 Brasil, 🇵🇾 Paraguai e 🇲🇦 Marrocos!"
    : en
      ? "Congrats to yesterday's qualifiers: 🇨🇦 Canada, 🇧🇷 Brazil, 🇵🇾 Paraguay and 🇲🇦 Morocco!"
      : es
        ? "Felicidades a los clasificados de ayer: 🇨🇦 Canadá, 🇧🇷 Brasil, 🇵🇾 Paraguay y 🇲🇦 Marruecos."
        : "Bravo aux qualifiés d'hier : 🇨🇦 Canada, 🇧🇷 Brésil, 🇵🇾 Paraguay et 🇲🇦 Maroc !";

  const proximos = pt
    ? "Hoje (30/06): 🇨🇮 Costa do Marfim × Noruega 🇳🇴 — 14h · 🇫🇷 França × Suécia 🇸🇪 — 18h · 🇲🇽 México × Equador 🇪🇨 — 22h."
    : en
      ? "Today (30 June): 🇨🇮 Ivory Coast × Norway 🇳🇴 — 14:00 BRT · 🇫🇷 France × Sweden 🇸🇪 — 18:00 BRT · 🇲🇽 Mexico × Ecuador 🇪🇨 — 22:00 BRT."
      : es
        ? "Hoy (30/06): 🇨🇮 Costa de Marfil × Noruega 🇳🇴 — 14h · 🇫🇷 Francia × Suecia 🇸🇪 — 18h · 🇲🇽 México × Ecuador 🇪🇨 — 22h."
        : "Aujourd'hui (30/06) : 🇨🇮 Côte d'Ivoire × Norvège 🇳🇴 — 14h · 🇫🇷 France × Suède 🇸🇪 — 18h · 🇲🇽 Mexique × Équateur 🇪🇨 — 22h.";

  return (
    <section className="section" style={{ paddingTop: 8, paddingBottom: 8 }}>
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
              fontSize: "clamp(17px, 2.6vw, 20px)",
              fontWeight: 800,
              marginBottom: 8,
              lineHeight: 1.2,
              color: "var(--fg)",
            }}
          >
            {empatesTit}
          </h3>
          <p style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 10, color: "var(--fg-mid)" }}>
            {alePara}
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 18, color: "var(--fg-mid)" }}>
            {holMar}
          </p>

          <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 6, color: "var(--fg)" }}>
            {classificados}
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 18, color: "var(--fg-mid)" }}>
            {proximos}
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
                marginTop: 2,
                marginBottom: 14,
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
            <p
              lang="nl"
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "var(--fg)",
                lineHeight: 1.5,
              }}
            >
              Bedankt voor de strijd, Nederland 🇳🇱
            </p>
            <p
              style={{
                fontSize: 12,
                color: "var(--fg-muted)",
                fontStyle: "italic",
                marginTop: 2,
                marginBottom: 14,
              }}
            >
              {pt
                ? "(Obrigado pela luta, Holanda)"
                : en
                  ? "(Thanks for the fight, Netherlands)"
                  : es
                    ? "(Gracias por la lucha, Países Bajos)"
                    : "(Merci pour le combat, Pays-Bas)"}
            </p>
            <p
              lang="de"
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "var(--fg)",
                lineHeight: 1.5,
              }}
            >
              Danke für den Kampf, Deutschland 🇩🇪
            </p>
            <p
              style={{
                fontSize: 12,
                color: "var(--fg-muted)",
                fontStyle: "italic",
                marginTop: 2,
              }}
            >
              {pt
                ? "(Obrigado pela luta, Alemanha)"
                : en
                  ? "(Thanks for the fight, Germany)"
                  : es
                    ? "(Gracias por la lucha, Alemania)"
                    : "(Merci pour le combat, Allemagne)"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
