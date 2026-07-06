import type { Locale } from "@/lib/i18n";

export default function BannerR32({ locale }: { locale: Locale }) {
  const pt = locale === "pt";
  const en = locale === "en";
  const es = locale === "es";

  const tit = pt
    ? "💔 Brasil eliminado nas Oitavas — 1×2 pra Noruega"
    : en
      ? "💔 Brazil out in the Round of 16 — Norway wins 2×1"
      : es
        ? "💔 Brasil eliminado en Octavos — Noruega 2×1"
        : "💔 Le Brésil éliminé en 8es — Norvège 2×1";

  const brasilLinha = pt
    ? "Meus pêsames à torcida brasileira. Só 2 de 59 IAs (llama-3-1-70b e llama-3-3-70b) tinham previsto vitória norueguesa — e AS DUAS cravaram o 1×2 exato. Cabeça erguida, Canarinho. A jornada continua em 2030, e o hexa vai vir."
    : en
      ? "Condolences to Brazilian fans. Only 2 of 59 AIs (llama-3-1-70b and llama-3-3-70b) had predicted a Norway win — and BOTH nailed the exact 1×2. Head up, Canarinho. The road continues in 2030, and the sixth title will come."
      : es
        ? "Mis condolencias a la afición brasileña. Solo 2 de 59 IAs (llama-3-1-70b y llama-3-3-70b) habían pronosticado la victoria noruega — y AMBAS clavaron el 1×2 exacto. Cabeza en alto, Canarinho. El camino sigue en 2030 y el hexa llegará."
        : "Toutes nos condoléances aux supporters brésiliens. Seulement 2 des 59 IA (llama-3-1-70b et llama-3-3-70b) avaient prédit la victoire norvégienne — et les DEUX ont trouvé le 1×2 exact. Tête haute, Canarinho. La route continue en 2030, et le sixième titre viendra.";

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
  ];

  const congrats = [
    { lang: "ar", flag: "🇲🇦", text: "مبروك يا أسود الأطلس — الطريق ما زال طويلًا" },
    { lang: "nb", flag: "🇳🇴", text: "Bra jobba, Løvene — vi sees i åttedelsfinalen!" },
    { lang: "fr", flag: "🇫🇷", text: "Allez les Bleus ! Le rêve continue — la coupe nous attend" },
    { lang: "en", flag: "🇬🇧", text: "Come on, Three Lions — one more trophy, this could be the year" },
    { lang: "en", flag: "🇺🇸", text: "Let's go, USMNT — host and hero, keep the crowd loud" },
    { lang: "nl", flag: "🇧🇪", text: "Kom op, Rode Duivels — een gouden generatie die eindelijk terugkomt" },
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
                ? "Oitavas · 5/8 jogos · Espanha 1×0 Portugal em Dallas · CR7 dá adeus, Espanha nas Quartas"
                : en
                  ? "Round of 16 · 5/8 · Spain 1×0 Portugal in Dallas · CR7 bows out, Spain into QF"
                  : es
                    ? "Octavos · 5/8 · España 1×0 Portugal en Dallas · CR7 se despide, España a Cuartos"
                    : "8es · 5/8 · Espagne 1×0 Portugal à Dallas · CR7 tire sa révérence, l'Espagne en Quarts"}
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
