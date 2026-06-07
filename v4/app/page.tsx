import Link from "next/link";
import SerieA from "@/components/SerieA";
import { resolverLocale } from "@/lib/locale-server";
import { t } from "@/lib/i18n";

export default async function Home() {
  const locale = await resolverLocale();

  const destinos = [
    {
      href: "https://giordanorec.github.io/bolao-copa-2026/serie-a.html",
      external: true,
      emoji: "🏆",
      titulo: t(locale, "home.hero.cta.serie_a"),
      sub: "Top 10",
      desc:
        locale === "pt"
          ? "ChatGPT 5 Pro, Claude Opus 4.7, Gemini 2.5 Pro, Grok 4 Heavy, DeepSeek R1, Perplexity, Copilot, Le Chat, Meta AI e Qwen 3 Max — coletados via interface web com search."
          : locale === "en"
            ? "ChatGPT 5 Pro, Claude Opus 4.7, Gemini 2.5 Pro, Grok 4 Heavy, DeepSeek R1, Perplexity, Copilot, Le Chat, Meta AI, Qwen 3 Max — gathered via web interface with search."
            : locale === "es"
              ? "ChatGPT 5 Pro, Claude Opus 4.7, Gemini 2.5 Pro, Grok 4 Heavy, DeepSeek R1, Perplexity, Copilot, Le Chat, Meta AI, Qwen 3 Max — recogidos vía web con búsqueda."
              : "ChatGPT 5 Pro, Claude Opus 4.7, Gemini 2.5 Pro, Grok 4 Heavy, DeepSeek R1, Perplexity, Copilot, Le Chat, Meta AI, Qwen 3 Max — collectés via interface web avec recherche.",
      cta:
        locale === "pt"
          ? "Ver os 10 →"
          : locale === "en"
            ? "See the 10 →"
            : locale === "es"
              ? "Ver los 10 →"
              : "Voir les 10 →",
    },
    {
      href: "https://giordanorec.github.io/bolao-copa-2026/jogos.html",
      external: true,
      emoji: "⚽",
      titulo: t(locale, "home.hero.cta.jogos"),
      sub:
        locale === "pt"
          ? "Pra usar no seu bolão"
          : locale === "en"
            ? "To use in your pool"
            : locale === "es"
              ? "Para usar en tu polla"
              : "À utiliser dans votre cagnotte",
      desc:
        locale === "pt"
          ? "Pros 104 jogos: qual placar cada IA chutou, quantas concordam, o consenso. Sem precisar criar conta."
          : locale === "en"
            ? "For all 104 matches: which score each AI predicted, how many agree, the consensus. No account needed."
            : locale === "es"
              ? "Para los 104 partidos: qué marcador predijo cada IA, cuántas concuerdan, el consenso. Sin cuenta."
              : "Pour les 104 matches : quel score chaque IA a prédit, combien sont d'accord, le consensus. Sans compte.",
      cta:
        locale === "pt"
          ? "Espiar →"
          : locale === "en"
            ? "Peek →"
            : locale === "es"
              ? "Espiar →"
              : "Voir →",
    },
    {
      href: "/signup",
      external: false,
      emoji: "🎯",
      titulo: t(locale, "home.hero.cta.criar"),
      sub:
        locale === "pt"
          ? "Privado, pra galera"
          : locale === "en"
            ? "Private, for your group"
            : locale === "es"
              ? "Privada, para tu grupo"
              : "Privée, pour votre groupe",
      desc:
        locale === "pt"
          ? "Link único pra convidar amigos. Palpita do celular. Ranking automático. Tudo grátis."
          : locale === "en"
            ? "Unique invite link. Predict from your phone. Auto ranking. All free."
            : locale === "es"
              ? "Enlace único para invitar amigos. Predice desde el móvil. Ranking automático. Todo gratis."
              : "Lien d'invitation unique. Pronostiquez depuis votre mobile. Classement automatique. Tout gratuit.",
      cta: t(locale, "login.criar") + " →",
    },
  ];

  return (
    <>
      <section className="hero">
        <div className="container">
          <div className="hero-emojis">
            <span>🇧🇷</span>
            <span>⚽</span>
            <span>🔮</span>
          </div>
          <h1>
            {t(locale, "home.hero.h1.l1")}
            <br />
            <span className="accent">{t(locale, "home.hero.h1.l2")}</span>
          </h1>
          <p className="lede">
            <strong>122 {t(locale, "home.hero.lede.parte1")}</strong>{" "}
            {t(locale, "home.hero.lede.parte2")}{" "}
            <strong>{t(locale, "home.hero.lede.gratis")}</strong> 🏆
          </p>

          <div className="hero-cta">
            <a
              href="https://giordanorec.github.io/bolao-copa-2026/serie-a.html"
              className="btn primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t(locale, "home.hero.cta.serie_a")}
            </a>
            <a
              href="https://giordanorec.github.io/bolao-copa-2026/jogos.html"
              className="btn yellow"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t(locale, "home.hero.cta.jogos")}
            </a>
            <Link href="/signup" className="btn">
              {t(locale, "home.hero.cta.criar")}
            </Link>
          </div>

          <div className="stats">
            <div className="stat">
              <div className="stat-num">122</div>
              <span className="stat-lbl">{t(locale, "home.stats.ias")}</span>
            </div>
            <div className="stat">
              <div className="stat-num">104</div>
              <span className="stat-lbl">{t(locale, "home.stats.jogos")}</span>
            </div>
            <div className="stat">
              <div className="stat-num">8.6k+</div>
              <span className="stat-lbl">
                {t(locale, "home.stats.palpites")}
              </span>
            </div>
          </div>
        </div>
      </section>

      <SerieA locale={locale} />

      <section className="section">
        <div className="container">
          <h2 style={{ textAlign: "center", marginBottom: 12 }}>
            {t(locale, "home.destinos.titulo")}
          </h2>
          <p
            style={{
              textAlign: "center",
              color: "var(--fg-mid)",
              fontSize: 17,
              marginBottom: 48,
              maxWidth: 600,
              marginInline: "auto",
            }}
          >
            {t(locale, "home.destinos.sub")}
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 22,
            }}
          >
            {destinos.map((d) =>
              d.external ? (
                <a
                  key={d.href}
                  href={d.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card hoverable destino-card"
                >
                  <CardConteudo {...d} />
                </a>
              ) : (
                <Link
                  key={d.href}
                  href={d.href}
                  className="card hoverable destino-card"
                >
                  <CardConteudo {...d} />
                </Link>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 style={{ textAlign: "center", marginBottom: 32 }}>
            {t(locale, "home.regras.titulo")}
          </h2>
          <div className="card" style={{ maxWidth: 640, margin: "0 auto" }}>
            <table className="regras-table">
              <thead>
                <tr>
                  <th>{t(locale, "home.regras.cabecalho.acerto")}</th>
                  <th style={{ textAlign: "right" }}>
                    {t(locale, "home.regras.cabecalho.pts")}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{t(locale, "home.regras.placar_exato")}</td>
                  <td className="pts">10</td>
                </tr>
                <tr>
                  <td>{t(locale, "home.regras.vencedor_saldo")}</td>
                  <td className="pts">7</td>
                </tr>
                <tr>
                  <td>{t(locale, "home.regras.vencedor")}</td>
                  <td className="pts">5</td>
                </tr>
                <tr>
                  <td>{t(locale, "home.regras.empate")}</td>
                  <td className="pts">5</td>
                </tr>
                <tr>
                  <td>{t(locale, "home.regras.errado")}</td>
                  <td className="pts" style={{ color: "var(--fg-muted)" }}>
                    0
                  </td>
                </tr>
              </tbody>
            </table>
            <p
              style={{
                marginTop: 20,
                padding: 14,
                background: "var(--bg-soft)",
                borderRadius: "var(--r-m)",
                fontSize: 14,
                color: "var(--fg-mid)",
                textAlign: "center",
              }}
            >
              🏆 <strong>{t(locale, "home.regras.nota")}</strong>{" "}
              <Link
                href="/como-funciona"
                style={{ color: "var(--primary)", fontWeight: 700 }}
              >
                {t(locale, "home.regras.link")}
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

function CardConteudo({
  emoji,
  titulo,
  sub,
  desc,
  cta,
}: {
  emoji: string;
  titulo: string;
  sub: string;
  desc: string;
  cta: string;
}) {
  return (
    <>
      <div style={{ fontSize: 56, marginBottom: 12, lineHeight: 1 }}>
        {emoji}
      </div>
      <h3
        style={{
          fontFamily: "var(--ff-display)",
          fontVariationSettings: "var(--ff-display-vs)",
          fontStyle: "var(--ff-display-style)",
          fontWeight: "var(--ff-display-weight)",
          fontSize: 28,
          color: "var(--secondary)",
          marginBottom: 4,
          letterSpacing: "var(--letterspacing-display)",
          lineHeight: 1.05,
        }}
      >
        {titulo}
      </h3>
      <p
        style={{
          fontFamily: "var(--ff-mono)",
          fontSize: 12,
          color: "var(--fg-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 14,
          fontWeight: 700,
        }}
      >
        {sub}
      </p>
      <p
        style={{
          color: "var(--fg-mid)",
          fontSize: 14,
          lineHeight: 1.5,
          marginBottom: 18,
          flexGrow: 1,
        }}
      >
        {desc}
      </p>
      <p
        style={{
          color: "var(--primary)",
          fontWeight: 700,
          fontSize: 15,
          margin: 0,
        }}
      >
        {cta}
      </p>
    </>
  );
}
