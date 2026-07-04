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

  // Trio de 01/07 (J80, J81, J82) — Inglaterra, EUA e Bélgica avançam.
  const trioTit = pt
    ? "🇬🇧 Inglaterra · 🇺🇸 EUA · 🇧🇪 Bélgica — trio anglo-atlântico avança"
    : en
      ? "🇬🇧 England · 🇺🇸 USA · 🇧🇪 Belgium — Anglo-Atlantic trio advances"
      : es
        ? "🇬🇧 Inglaterra · 🇺🇸 EE.UU. · 🇧🇪 Bélgica — trío anglo-atlántico avanza"
        : "🇬🇧 Angleterre · 🇺🇸 États-Unis · 🇧🇪 Belgique — trio anglo-atlantique passe";

  const trioLinha = pt
    ? "Inglaterra 2×1 Congo (RD) 🇨🇩 — 3 IAs cravaram o exato (llama-4-scout, perplexity-sonar-reasoning, qwen-3-coder). EUA 2×0 Bósnia 🇧🇦 — 4 exatos (copilot-microsoft-web, le-chat-mistral-web, chatgpt-5-nano, llama-4-scout). Bélgica 3×2 Senegal 🇸🇳 — decidido na prorrogação (Tielemans no 120'), 1 exato (cohere-command-r-plus) e 36 IAs pegaram vencedor+saldo. Bola de Cristal palpitou 2×1 e ganhou 14 pts."
    : en
      ? "England 2×1 DR Congo 🇨🇩 — 3 AIs nailed the exact score (llama-4-scout, perplexity-sonar-reasoning, qwen-3-coder). USA 2×0 Bosnia 🇧🇦 — 4 exact (copilot-microsoft-web, le-chat-mistral-web, chatgpt-5-nano, llama-4-scout). Belgium 3×2 Senegal 🇸🇳 — decided in extra time (Tielemans in the 120th), 1 exact (cohere-command-r-plus) and 36 AIs got winner+goal-difference. Crystal Ball predicted 2×1 and earned 14 pts."
      : es
        ? "Inglaterra 2×1 Congo (RD) 🇨🇩 — 3 IAs clavaron el marcador exacto (llama-4-scout, perplexity-sonar-reasoning, qwen-3-coder). EE.UU. 2×0 Bosnia 🇧🇦 — 4 exactos (copilot-microsoft-web, le-chat-mistral-web, chatgpt-5-nano, llama-4-scout). Bélgica 3×2 Senegal 🇸🇳 — decidido en la prórroga (Tielemans en el 120'), 1 exacto (cohere-command-r-plus) y 36 IAs acertaron ganador+diferencia. Bola de Cristal predijo 2×1 y ganó 14 pts."
        : "Angleterre 2×1 RD Congo 🇨🇩 — 3 IA ont trouvé le score exact (llama-4-scout, perplexity-sonar-reasoning, qwen-3-coder). USA 2×0 Bosnie 🇧🇦 — 4 exacts (copilot-microsoft-web, le-chat-mistral-web, chatgpt-5-nano, llama-4-scout). Belgique 3×2 Sénégal 🇸🇳 — décidé en prolongation (Tielemans à la 120e), 1 exact (cohere-command-r-plus) et 36 IA ont trouvé vainqueur+différence. La Boule de Cristal a prédit 2×1 et a gagné 14 pts.";

  const proximos = pt
    ? "Falta apenas 🇨🇴 Colômbia × Gana 🇬🇭 pra fechar o R32. Argentina, Egito, Suíça, Portugal, Espanha e Marrocos foram nos pen ou prorrogação em algum momento — R32 histórico."
    : en
      ? "Only 🇨🇴 Colombia × Ghana 🇬🇭 left to close R32. Argentina, Egypt, Switzerland, Portugal, Spain and Morocco all had extra-time or penalty moments — a historic R32."
      : es
        ? "Solo falta 🇨🇴 Colombia × Ghana 🇬🇭 para cerrar los 16avos. Argentina, Egipto, Suiza, Portugal, España y Marruecos pasaron por prórroga o penales — 16avos históricos."
        : "Il ne reste que 🇨🇴 Colombie × Ghana 🇬🇭 pour clore le R32. Argentine, Égypte, Suisse, Portugal, Espagne et Maroc sont passés par la prolongation ou les tirs au but — un R32 historique.";

  const cincoJogos = pt
    ? "🇵🇹 Portugal 2×1 Croácia 🇭🇷 · 🇪🇸 Espanha 3×0 Áustria 🇦🇹 · 🇨🇭 Suíça 2×0 Argélia 🇩🇿 · 🇦🇺 Austrália 1×1 Egito 🇪🇬 (Egito nos pên.) · 🇦🇷 Argentina 3×2 Cabo Verde 🇨🇻 (na prorrogação)"
    : en
      ? "🇵🇹 Portugal 2×1 Croatia 🇭🇷 · 🇪🇸 Spain 3×0 Austria 🇦🇹 · 🇨🇭 Switzerland 2×0 Algeria 🇩🇿 · 🇦🇺 Australia 1×1 Egypt 🇪🇬 (Egypt on pens) · 🇦🇷 Argentina 3×2 Cape Verde 🇨🇻 (extra time)"
      : es
        ? "🇵🇹 Portugal 2×1 Croacia 🇭🇷 · 🇪🇸 España 3×0 Austria 🇦🇹 · 🇨🇭 Suiza 2×0 Argelia 🇩🇿 · 🇦🇺 Australia 1×1 Egipto 🇪🇬 (Egipto en penales) · 🇦🇷 Argentina 3×2 Cabo Verde 🇨🇻 (en la prórroga)"
        : "🇵🇹 Portugal 2×1 Croatie 🇭🇷 · 🇪🇸 Espagne 3×0 Autriche 🇦🇹 · 🇨🇭 Suisse 2×0 Algérie 🇩🇿 · 🇦🇺 Australie 1×1 Égypte 🇪🇬 (Égypte aux TAB) · 🇦🇷 Argentine 3×2 Cap-Vert 🇨🇻 (prolongation)";

  const cincoJogosTit = pt
    ? "⚡ Últimos 5 jogos do R32 (02-03/07)"
    : en
      ? "⚡ Last 5 R32 games (2-3 Jul)"
      : es
        ? "⚡ Últimos 5 partidos de 16avos (02-03/07)"
        : "⚡ Derniers 5 matchs du R32 (02-03/07)";

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
    { lang: "es", flag: "🇪🇨", text: "Hasta la próxima, Tricolor — la Copa continúa sin ustedes" },
    { lang: "fr", flag: "🇨🇩", text: "À bientôt, Léopards — vous êtes revenus loin, et vous reviendrez plus fort" },
    { lang: "bs", flag: "🇧🇦", text: "Doviđenja, Zmajevi — vidimo se u sljedećoj Copi" },
    { lang: "wo", flag: "🇸🇳", text: "Ba beneen yoon, Lions de la Teranga — dinañu la ci mburu" },
    { lang: "hr", flag: "🇭🇷", text: "Doviđenja, Vatreni — hvala na nezaboravnoj generaciji" },
    { lang: "de", flag: "🇦🇹", text: "Auf Wiedersehen, Nationalteam — nach 72 Jahren wieder hier, kommt bald zurück" },
    { lang: "ar", flag: "🇩🇿", text: "إلى اللقاء يا محاربي الصحراء — ستعودون أقوى" },
    { lang: "en", flag: "🇦🇺", text: "Cheers, Socceroos — one goal short in Dallas, but a fight to remember" },
    { lang: "pt", flag: "🇨🇻", text: "Até à próxima, Tubarões Azuis — orgulho de uma ilha inteira que virou lenda" },
  ];

  const congrats = [
    { lang: "en", flag: "🇨🇦", text: "Way to go, Canada — round of 16, here we come, eh!" },
    { lang: "gn", flag: "🇵🇾", text: "¡Iporã, Albirroja! Tereguahē porãite ko'ãgaite — vamos por más" },
    { lang: "ar", flag: "🇲🇦", text: "مبروك يا أسود الأطلس — الطريق ما زال طويلًا" },
    { lang: "nb", flag: "🇳🇴", text: "Bra jobba, Løvene — vi sees i åttedelsfinalen!" },
    { lang: "fr", flag: "🇫🇷", text: "Allez les Bleus ! Le rêve continue — la coupe nous attend" },
    { lang: "es", flag: "🇲🇽", text: "¡Vamos, Tri! A octavos después de 40 años — sigan haciéndonos soñar" },
    { lang: "en", flag: "🇬🇧", text: "Come on, Three Lions — one more trophy, this could be the year" },
    { lang: "en", flag: "🇺🇸", text: "Let's go, USMNT — host and hero, keep the crowd loud" },
    { lang: "nl", flag: "🇧🇪", text: "Kom op, Rode Duivels — een gouden generatie die eindelijk terugkomt" },
    { lang: "pt", flag: "🇵🇹", text: "Força, Seleção das Quinas — vamos com CR7 até onde ele quiser!" },
    { lang: "es", flag: "🇪🇸", text: "¡Vamos, La Roja! Yamal, Rodri y la generación que quiere el segundo mundial" },
    { lang: "de", flag: "🇨🇭", text: "Hopp Schwiiz — Nati wiiter uf em Weg, mir sind so stolz!" },
    { lang: "ar", flag: "🇪🇬", text: "مبروك يا فراعنة — أول ثمن نهائي في تاريخ الحديث، صلاح إن شاء الله معنا" },
    { lang: "es", flag: "🇦🇷", text: "¡Vamos, Argentina! Messi otra vez a los octavos — bicampeones vienen fuertes" },
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
                ? "Rodada R32 · 29/06 → 03/07"
                : en
                  ? "Round of 32 · 29 Jun → 3 Jul"
                  : es
                    ? "16avos · 29/06 → 03/07"
                    : "8e de finale · 29/06 → 03/07"}
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

          <h3
            style={{
              fontSize: "clamp(17px, 2.6vw, 20px)",
              fontWeight: 800,
              marginBottom: 6,
              lineHeight: 1.2,
              color: "var(--fg)",
            }}
          >
            {trioTit}
          </h3>
          <p style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 18, color: "var(--fg-mid)" }}>
            {trioLinha}
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
            {cincoJogosTit}
          </h3>
          <p style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 18, color: "var(--fg-mid)" }}>
            {cincoJogos}
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
