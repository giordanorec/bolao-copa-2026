import type { Locale } from "@/lib/i18n";

export default function BannerR32({ locale }: { locale: Locale }) {
  const pt = locale === "pt";
  const en = locale === "en";
  const es = locale === "es";

  const tit = pt
    ? "🇫🇷 Les Bleus 2×0 Marrocos — 23 IAs cravaram + Bola de Cristal ACERTOU!"
    : en
      ? "🇫🇷 Les Bleus 2×0 Morocco — 23 AIs nailed it + Crystal Ball got it right!"
      : es
        ? "🇫🇷 Les Bleus 2×0 Marruecos — 23 IAs clavaron + ¡Bola de Cristal acertó!"
        : "🇫🇷 Les Bleus 2×0 Maroc — 23 IA ont trouvé + La Boule de Cristal a réussi !";

  const brasilLinha = pt
    ? "Primeira Quartas da Copa 2026 em Boston. 57 de 60 IAs (95%) previram vitória francesa; 23 cravaram o 0×2 exato (chatgpt-5-mini, claude-haiku, claude-sonnet-4-5, deepseek-r1, deepseek-v3, gemini-2-5-pro e mais 17). A Bola de Cristal também apostou 2×0 e ganhou 20 pts. França encara vencedor de Espanha × Bélgica na Semi."
    : en
      ? "First quarterfinal of Copa 2026 in Boston. 57 of 60 AIs (95%) predicted a French win; 23 nailed the exact 0×2 (chatgpt-5-mini, claude-haiku, claude-sonnet-4-5, deepseek-r1, deepseek-v3, gemini-2-5-pro and 17 more). The Crystal Ball also called 2×0 and scored 20 pts. France meets the winner of Spain × Belgium in the Semi."
      : es
        ? "Primer partido de Cuartos de Copa 2026 en Boston. 57 de 60 IAs (95%) pronosticaron victoria francesa; 23 clavaron el 0×2 exacto (chatgpt-5-mini, claude-haiku, claude-sonnet-4-5, deepseek-r1, deepseek-v3, gemini-2-5-pro y 17 más). La Bola de Cristal también apostó 2×0 y ganó 20 pts. Francia enfrenta al ganador de España × Bélgica en Semifinales."
        : "Premier Quart de la Coupe 2026 à Boston. 57 des 60 IA (95%) ont prédit la victoire française ; 23 ont trouvé le 0×2 exact (chatgpt-5-mini, claude-haiku, claude-sonnet-4-5, deepseek-r1, deepseek-v3, gemini-2-5-pro et 17 autres). La Boule de Cristal a également misé 2×0 et gagné 20 pts. La France affronte le vainqueur d'Espagne × Belgique en Demi.";

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
    { lang: "en", flag: "🇬🇭", text: "See you later, Black Stars — you fought hard, come back stronger" },
    { lang: "fr", flag: "🇨🇦", text: "À la prochaine, les Canucks — 0–3 contre le Maroc, mais l'hôte a fait rêver le pays" },
    { lang: "gn", flag: "🇵🇾", text: "Jajotopatajevýta, Albirroja — 0–1 la Francia-pe, ha katu ojeguerova'e ojerure porãite" },
    { lang: "pt", flag: "🇧🇷", text: "Doeu, Canarinho. 1×2 pra Noruega em Nova York — o Brasil inteiro chora junto. Ainda vai ser hexa, um dia. 💔" },
    { lang: "es", flag: "🇲🇽", text: "Hasta la próxima, Tri — 2×3 con Inglaterra en el Azteca, un partidazo. México sale de cabeza erguida" },
    { lang: "pt", flag: "🇵🇹", text: "Até à próxima, Seleção das Quinas — 0×1 frente à Espanha em Dallas. CR7 despede-se com honra, o legado fica" },
    { lang: "ar", flag: "🇲🇦", text: "إلى اللقاء يا أسود الأطلس — 0×2 أمام فرنسا في بوسطن، لكن مغاربة العالم فخورون بجيل استثنائي" },
    { lang: "nl", flag: "🇧🇪", text: "Tot ziens, Rode Duivels — 1×2 tegen Spanje in Los Angeles, maar de gouden generatie liet alles op het veld" },
  ];

  const congrats = [
    { lang: "nb", flag: "🇳🇴", text: "Bra jobba, Løvene — vi sees i åttedelsfinalen!" },
    { lang: "fr", flag: "🇫🇷", text: "Allez les Bleus ! Le rêve continue — la coupe nous attend" },
    { lang: "en", flag: "🇬🇧", text: "Come on, Three Lions — one more trophy, this could be the year" },
    { lang: "en", flag: "🇺🇸", text: "Let's go, USMNT — host and hero, keep the crowd loud" },
    { lang: "es", flag: "🇪🇸", text: "¡Vamos, La Roja! Yamal, Rodri y la generación que quiere el segundo mundial" },
    { lang: "de", flag: "🇨🇭", text: "Hopp Schwiiz — Nati wiiter uf em Weg, mir sind so stolz!" },
    { lang: "ar", flag: "🇪🇬", text: "مبروك يا فراعنة — أول ثمن نهائي في تاريخ الحديث، صلاح إن شاء الله معنا" },
    { lang: "es", flag: "🇦🇷", text: "¡Vamos, Argentina! Messi otra vez a los octavos — bicampeones vienen fuertes" },
    { lang: "es", flag: "🇨🇴", text: "¡Fuerza, Cafeteros! Luis Díaz, James y una defensa de hierro — a soñar con la Copa" },
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
                ? "Quartas · 2/4 jogos · Espanha 2×1 Bélgica em LA · França × Espanha na Semi!"
                : en
                  ? "Quarterfinals · 2/4 · Spain 2×1 Belgium in LA · France × Spain in the Semi!"
                  : es
                    ? "Cuartos · 2/4 · España 2×1 Bélgica en LA · ¡Francia × España en Semis!"
                    : "Quarts · 2/4 · Espagne 2×1 Belgique à LA · France × Espagne en Demi !"}
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
              Até 2030, Brasil 🇧🇷 💚💛
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
