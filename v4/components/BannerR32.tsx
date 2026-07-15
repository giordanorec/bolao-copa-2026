import type { Locale } from "@/lib/i18n";

export default function BannerR32({ locale }: { locale: Locale }) {
  const pt = locale === "pt";
  const en = locale === "en";
  const es = locale === "es";

  const tit = pt
    ? "🇦🇷 Argentina 2×1 Inglaterra em Atlanta — FINAL DEFINIDA: Espanha × Argentina! 32 de 62 IAs cravaram o 2×1"
    : en
      ? "🇦🇷 Argentina 2×1 England in Atlanta — THE FINAL IS SET: Spain × Argentina! 32 of 62 AIs nailed the 2×1"
      : es
        ? "🇦🇷 Argentina 2×1 Inglaterra en Atlanta — ¡FINAL DEFINIDA: España × Argentina! 32 de 62 IAs acertaron el 2×1 exacto"
        : "🇦🇷 Argentine 2×1 Angleterre à Atlanta — LA FINALE EST FIXÉE : Espagne × Argentine ! 32 des 62 IA ont trouvé le score exact 2×1";

  const brasilLinha = pt
    ? "Semifinal em Atlanta: Messi e a Albiceleste batem a Inglaterra e chegam à decisão em busca do bicampeonato. Dessa vez as IAs acertaram em cheio — maioria (34 de 62) apostava na vitória argentina e 32 cravaram o 2×1 exato. A Final é Espanha × Argentina em Nova York/NJ (19/07). Antes disso, disputa de 3º lugar: França × Inglaterra em Miami (18/07)."
    : en
      ? "Semi in Atlanta: Messi and Albiceleste beat England to reach the final in search of back-to-back titles. This time the AIs nailed it — most (34 of 62) picked an Argentina win, and 32 called the exact 2×1. The Final is Spain × Argentina in New York/NJ (19/07). Before that, the 3rd-place match: France × England in Miami (18/07)."
      : es
        ? "Semi en Atlanta: Messi y la Albiceleste vencen a Inglaterra y llegan a la definición en busca del bicampeonato. Esta vez las IAs acertaron de lleno — la mayoría (34 de 62) apostaba por la victoria argentina y 32 clavaron el 2×1 exacto. La Final es España × Argentina en Nueva York/NJ (19/07). Antes, el partido por el 3er puesto: Francia × Inglaterra en Miami (18/07)."
        : "Demi à Atlanta : Messi et l'Albiceleste battent l'Angleterre et atteignent la finale à la recherche du back-to-back. Cette fois, les IA ont vu juste — la majorité (34 sur 62) misait sur une victoire argentine, et 32 ont trouvé le score exact 2×1. La Finale sera Espagne × Argentine à New York/NJ (19/07). Avant cela, la petite finale : France × Angleterre à Miami (18/07).";

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
    { lang: "en", flag: "🇺🇸", text: "So long, USMNT — 1×4 to Belgium in Seattle, but the home crowd showed up big all tournament" },
    { lang: "ar", flag: "🇪🇬", text: "إلى اللقاء يا فراعنة — 2×3 أمام الأرجنتين في أتلانتا، صلاح ورفاقه رفعوا الرأس عاليًا" },
    { lang: "es", flag: "🇨🇴", text: "Hasta la próxima, Cafeteros — 1×1 con Suiza en Vancouver, eliminados en los penaltis" },
    { lang: "en", flag: "🇬🇧", text: "Unlucky, Three Lions — 1×2 to Argentina in Atlanta, so close to the final. Bronze match in Miami now" },
  ];

  const congrats = [
    { lang: "es", flag: "🇪🇸", text: "¡Vamos, La Roja! Yamal, Rodri y la generación que va por la segunda estrella — a la Final en Nueva York" },
    { lang: "es", flag: "🇦🇷", text: "¡Vamos, Argentina! Messi busca el bicampeonato en Nueva York — toda la Albiceleste unida por una estrella más" },
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
                ? "Semis completas · FINAL: 🇪🇸 Espanha × 🇦🇷 Argentina em Nova York/NJ (19/07) · 3º lugar: França × Inglaterra (18/07, Miami)"
                : en
                  ? "Semis complete · FINAL: 🇪🇸 Spain × 🇦🇷 Argentina in New York/NJ (19/07) · 3rd place: France × England (18/07, Miami)"
                  : es
                    ? "Semis completas · FINAL: 🇪🇸 España × 🇦🇷 Argentina en Nueva York/NJ (19/07) · 3er puesto: Francia × Inglaterra (18/07, Miami)"
                    : "Demies terminées · FINALE : 🇪🇸 Espagne × 🇦🇷 Argentine à New York/NJ (19/07) · 3e place : France × Angleterre (18/07, Miami)"}
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
