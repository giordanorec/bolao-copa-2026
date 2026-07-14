import type { Locale } from "@/lib/i18n";

export default function BannerR32({ locale }: { locale: Locale }) {
  const pt = locale === "pt";
  const en = locale === "en";
  const es = locale === "es";

  const tit = pt
    ? "🇪🇸 Espanha 2×0 França — ZEBRA HISTÓRICA! 0 de 62 IAs previram vitória espanhola"
    : en
      ? "🇪🇸 Spain 2×0 France — HISTORIC UPSET! 0 of 62 AIs predicted a Spanish win"
      : es
        ? "🇪🇸 España 2×0 Francia — ¡SORPRESA HISTÓRICA! 0 de 62 IAs pronosticaron la victoria"
        : "🇪🇸 Espagne 2×0 France — SURPRISE HISTORIQUE ! 0 des 62 IA n'a prédit la victoire espagnole";

  const brasilLinha = pt
    ? "Semifinal em Dallas: La Roja bate a França com Yamal (18) e Pedri dominando o meio. Consenso quase absoluto das IAs era empate (1×1 com 43 votos, 69%) ou vitória francesa. NENHUMA IA e nem a Bola de Cristal apostaram na Espanha — todos zeraram este jogo. La Roja vai à Final e espera o vencedor de Inglaterra × Argentina (15/07 Atlanta)."
    : en
      ? "Semi in Dallas: La Roja beats France with Yamal (18) and Pedri controlling midfield. AI consensus was overwhelmingly a draw (1×1 with 43 votes, 69%) or French win. NO AI, not even the Crystal Ball, called Spain — everyone zeroed this match. La Roja goes to the Final and awaits the winner of England × Argentina (15/07 Atlanta)."
      : es
        ? "Semi en Dallas: La Roja bate a Francia con Yamal (18) y Pedri dominando el mediocampo. Consenso IA fue casi absoluto por empate (1×1 con 43 votos, 69%) o victoria francesa. NINGUNA IA ni la Bola de Cristal apostaron por España — todos ceraron este juego. La Roja va a la Final y espera al ganador de Inglaterra × Argentina (15/07 Atlanta)."
        : "Demi à Dallas : La Roja bat la France avec Yamal (18) et Pedri dominant le milieu. Le consensus IA était massivement un nul (1×1 avec 43 votes, 69%) ou une victoire française. AUCUNE IA ni la Boule de Cristal n'a misé sur l'Espagne — tous ont fait zéro sur ce match. La Roja va en Finale et attend le vainqueur d'Angleterre × Argentine (15/07 Atlanta).";

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
    { lang: "nb", flag: "🇳🇴", text: "Takk for kampen, Løvene — 1×2 mot England i Miami, men dere gjorde hele Skandinavia stolt" },
    { lang: "de", flag: "🇨🇭", text: "Uf Wiederluege, Nati — 1×3 gäge Argentinie in Kansas City, aber s'Team het bis am Schluss kämpft" },
    { lang: "fr", flag: "🇫🇷", text: "Adieu les Bleus — 0×2 face à l'Espagne à Dallas, Yamal a fait la différence. Mbappé pleure, mais quelle génération" },
  ];

  const congrats = [
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
                ? "Semis 1/2 · 🇪🇸 Espanha 2×0 França em Dallas · La Roja na Final · quem vem: Inglaterra ou Argentina?"
                : en
                  ? "Semis 1/2 · 🇪🇸 Spain 2×0 France in Dallas · La Roja into the Final · England or Argentina next?"
                  : es
                    ? "Semis 1/2 · 🇪🇸 España 2×0 Francia en Dallas · ¡La Roja a la Final! · Inglaterra o Argentina?"
                    : "Demis 1/2 · 🇪🇸 Espagne 2×0 France à Dallas · La Roja en Finale · Angleterre ou Argentine ?"}
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
