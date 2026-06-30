import type { Locale } from "@/lib/i18n";

export default function BannerR32({ locale }: { locale: Locale }) {
  const pt = locale === "pt";
  const en = locale === "en";
  const es = locale === "es";

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

  const noruegaTit = pt
    ? "🇨🇮 Costa do Marfim 1×2 Noruega 🇳🇴 — fim da tarde 🌅"
    : en
      ? "🇨🇮 Ivory Coast 1×2 Norway 🇳🇴 — late afternoon 🌅"
      : es
        ? "🇨🇮 Costa de Marfil 1×2 Noruega 🇳🇴 — al final de la tarde 🌅"
        : "🇨🇮 Côte d'Ivoire 1×2 Norvège 🇳🇴 — fin d'après-midi 🌅";

  const noruegaLinha = pt
    ? "Vitória aliada à massa: 23 IAs cravaram o 1×2 exato. Noruega vai pras oitavas."
    : en
      ? "Vindicated by the crowd: 23 AIs nailed the exact 1×2. Norway moves on to round 16."
      : es
        ? "Vindicación de la masa: 23 IAs clavaron el 1×2 exacto. Noruega va a octavos."
        : "Vindiqué par la foule : 23 IA ont trouvé le 1×2 exact. La Norvège passe en 8es.";

  const francaTit = pt
    ? "🇫🇷 França 3×0 Suécia 🇸🇪 — passeio europeu 🏰"
    : en
      ? "🇫🇷 France 3×0 Sweden 🇸🇪 — European cruise 🏰"
      : es
        ? "🇫🇷 Francia 3×0 Suecia 🇸🇪 — paseo europeo 🏰"
        : "🇫🇷 France 3×0 Suède 🇸🇪 — promenade européenne 🏰";

  const francaLinha = pt
    ? "Consenso massivo: 62 de 63 IAs viam vitória francesa, e 17 cravaram o 3×0 exato (Grok 4 Fast salta pra 404 pts liderando com folga). Suécia segue calorosa, mas dá adeus."
    : en
      ? "Massive consensus: 62 of 63 AIs predicted a French win, and 17 nailed the exact 3×0 (Grok 4 Fast jumps to 404 pts, leading comfortably). Sweden bows out warmly."
      : es
        ? "Consenso masivo: 62 de 63 IAs preveían victoria francesa, y 17 clavaron el 3×0 exacto (Grok 4 Fast salta a 404 pts liderando con holgura). Suecia se despide."
        : "Consensus massif : 62 IA sur 63 prévoyaient la victoire française, et 17 ont trouvé le 3×0 exact (Grok 4 Fast bondit à 404 pts, en tête confortable). La Suède dit au revoir.";

  const proximos = pt
    ? "Ainda hoje (30/06): 🇲🇽 México × Equador 🇪🇨 — 22h."
    : en
      ? "Still today (30 June): 🇲🇽 Mexico × Ecuador 🇪🇨 — 22:00 BRT."
      : es
        ? "Aún hoy (30/06): 🇲🇽 México × Ecuador 🇪🇨 — 22h."
        : "Encore aujourd'hui (30/06) : 🇲🇽 Mexique × Équateur 🇪🇨 — 22h.";

  // Frases nas línguas nativas (sem tradução — descobrir é a graça).
  // Eliminados → "até a próxima". Classificados → parabéns + segue na Copa.
  // Japão tem frase especial porque foi adversário do Brasil.
  const farewells = [
    { lang: "ja", flag: "🇯🇵", text: "日本、あなたは素晴らしい対戦相手でした" },
    { lang: "af", flag: "🇿🇦", text: "Tot siens, Bafana Bafana — sien jou weer" },
    { lang: "nl", flag: "🇳🇱", text: "Tot de volgende keer, Oranje — kom snel terug" },
    { lang: "de", flag: "🇩🇪", text: "Bis zum nächsten Mal, Mannschaft — Kopf hoch" },
    { lang: "fr", flag: "🇨🇮", text: "À la prochaine, les Éléphants — vous reviendrez plus forts" },
    { lang: "sv", flag: "🇸🇪", text: "Tack för matchen, Blågult — vi ses snart igen" },
  ];

  const congrats = [
    { lang: "en", flag: "🇨🇦", text: "Way to go, Canada — round of 16, here we come, eh!" },
    { lang: "gn", flag: "🇵🇾", text: "¡Iporã, Albirroja! Tereguahē porãite ko'ãgaite — vamos por más" },
    { lang: "ar", flag: "🇲🇦", text: "مبروك يا أسود الأطلس — الطريق ما زال طويلًا" },
    { lang: "nb", flag: "🇳🇴", text: "Bra jobba, Løvene — vi sees i åttedelsfinalen!" },
    { lang: "fr", flag: "🇫🇷", text: "Allez les Bleus ! Le rêve continue — la coupe nous attend" },
  ];

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

          <h3
            style={{
              fontSize: "clamp(17px, 2.6vw, 20px)",
              fontWeight: 800,
              marginBottom: 6,
              lineHeight: 1.2,
              color: "var(--fg)",
            }}
          >
            {noruegaTit}
          </h3>
          <p style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 18, color: "var(--fg-mid)" }}>
            {noruegaLinha}
          </p>

          <h3
            style={{
              fontSize: "clamp(17px, 2.6vw, 20px)",
              fontWeight: 800,
              marginBottom: 6,
              lineHeight: 1.2,
              color: "var(--fg)",
            }}
          >
            {francaTit}
          </h3>
          <p style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 18, color: "var(--fg-mid)" }}>
            {francaLinha}
          </p>

          <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 18, color: "var(--fg-mid)" }}>
            {proximos}
          </p>

          {/* Bloco BRASIL + recados em línguas nativas */}
          <div
            style={{
              borderTop: "1px dashed color-mix(in srgb, var(--secondary) 30%, transparent)",
              paddingTop: 16,
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

            <div style={{ marginTop: 22 }}>
              <p
                style={{
                  fontFamily: "var(--ff-mono)",
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: "var(--fg-muted)",
                  fontWeight: 700,
                  marginBottom: 10,
                }}
              >
                {pt
                  ? "Até a próxima"
                  : en
                    ? "Until next time"
                    : es
                      ? "Hasta la próxima"
                      : "À la prochaine"}
              </p>
              {farewells.map((f) => (
                <p
                  key={f.lang}
                  lang={f.lang}
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--fg)",
                    lineHeight: 1.5,
                    margin: "4px 0",
                  }}
                >
                  {f.flag} {f.text}
                </p>
              ))}
            </div>

            <div style={{ marginTop: 20 }}>
              <p
                style={{
                  fontFamily: "var(--ff-mono)",
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: "var(--fg-muted)",
                  fontWeight: 700,
                  marginBottom: 10,
                }}
              >
                {pt
                  ? "Parabéns aos que seguem"
                  : en
                    ? "Congrats to those advancing"
                    : es
                      ? "Felicidades a los que siguen"
                      : "Bravo aux qualifiés"}
              </p>
              {congrats.map((c) => (
                <p
                  key={c.lang}
                  lang={c.lang}
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--fg)",
                    lineHeight: 1.5,
                    margin: "4px 0",
                  }}
                >
                  {c.flag} {c.text}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
