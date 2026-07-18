import type { Locale } from "@/lib/i18n";

export default function BannerR32({ locale }: { locale: Locale }) {
  const pt = locale === "pt";
  const en = locale === "en";
  const es = locale === "es";

  const tit = pt
    ? "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra 6×4 França em Miami — JOGO LOUCO no 3º lugar! Só 5 de 63 IAs previram vitória inglesa, NINGUÉM cravou o placar"
    : en
      ? "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England 6×4 France in Miami — WILD 3rd-place game! Only 5 of 63 AIs called an English win, NOBODY nailed the score"
      : es
        ? "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra 6×4 Francia en Miami — ¡PARTIDO LOCO por el 3er puesto! Solo 5 de 63 IAs previeron la victoria inglesa, NADIE acertó el marcador"
        : "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Angleterre 6×4 France à Miami — MATCH FOU pour la 3e place ! Seules 5 des 63 IA ont prédit la victoire anglaise, PERSONNE n'a trouvé le score exact";

  const brasilLinha = pt
    ? "Disputa de 3º lugar em Miami vira um vendaval: Inglaterra bate a França de virada por 6×4, 10 gols na conta, na última partida de Didier Deschamps no comando francês. As IAs não viram nada disso vindo — só 5 de 63 apostavam em vitória inglesa e nenhuma cravou o placar exato. Agora só falta a Final: Espanha × Argentina em Nova York/NJ (19/07), com as IAs empatadas no maior consenso do mata-mata (1×1)."
    : en
      ? "The 3rd-place match in Miami turns into a goal-fest: England comes from behind to beat France 6×4, 10 goals total, in Didier Deschamps' last game in charge of Les Bleus. The AIs never saw it coming — only 5 of 63 picked an English win, and none called the exact score. Now only the Final remains: Spain × Argentina in New York/NJ (19/07), with the AIs at their biggest mata-mata consensus yet (1×1)."
      : es
        ? "El partido por el 3er puesto en Miami se convierte en un vendaval: Inglaterra remonta y vence a Francia 6×4, 10 goles en total, en el último partido de Didier Deschamps al mando de Francia. Las IAs no lo vieron venir — solo 5 de 63 apostaban por la victoria inglesa y ninguna acertó el marcador exacto. Ahora solo queda la Final: España × Argentina en Nueva York/NJ (19/07), con las IAs en el mayor consenso del mata-mata (1×1)."
        : "La petite finale à Miami tourne à la folie offensive : l'Angleterre renverse la France 6×4, 10 buts au total, lors du dernier match de Didier Deschamps à la tête des Bleus. Les IA n'ont rien vu venir — seules 5 des 63 misaient sur une victoire anglaise, et aucune n'a trouvé le score exact. Il ne reste plus que la Finale : Espagne × Argentine à New York/NJ (19/07), avec le plus grand consensus IA de tout le tournoi (1×1).";

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
                ? "3º lugar: 🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra 6×4 França em Miami · Falta só a FINAL: 🇪🇸 Espanha × 🇦🇷 Argentina em Nova York/NJ (19/07)"
                : en
                  ? "3rd place: 🏴󠁧󠁢󠁥󠁮󠁧󠁿 England 6×4 France in Miami · Only the FINAL remains: 🇪🇸 Spain × 🇦🇷 Argentina in New York/NJ (19/07)"
                  : es
                    ? "3er puesto: 🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra 6×4 Francia en Miami · Solo falta la FINAL: 🇪🇸 España × 🇦🇷 Argentina en Nueva York/NJ (19/07)"
                    : "3e place : 🏴󠁧󠁢󠁥󠁮󠁧󠁿 Angleterre 6×4 France à Miami · Il ne reste que la FINALE : 🇪🇸 Espagne × 🇦🇷 Argentine à New York/NJ (19/07)"}
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
