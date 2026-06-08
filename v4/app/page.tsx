import Link from "next/link";
import SerieA from "@/components/SerieA";
import HeroCTAs from "@/components/HeroCTAs";
import { resolverLocale } from "@/lib/locale-server";
import { t } from "@/lib/i18n";

export default async function Home() {
  const locale = await resolverLocale();

  const pt = locale === "pt";
  const en = locale === "en";
  const es = locale === "es";

  const destinos = [
    {
      href: "/ranking-ias",
      emoji: "🏆",
      titulo: pt ? "Série A das IAs" : en ? "AI Premier League" : es ? "La Liga de las IAs" : "Ligue des IA",
      sub: pt ? "Os 10 cabeças de chave" : en ? "The top 10" : es ? "Las 10 cabezas de serie" : "Les 10 têtes de série",
      desc: pt
        ? "ChatGPT, Claude, Gemini, Grok, DeepSeek, Copilot, Perplexity, Le Chat, Meta AI e Qwen — coletados via interface web com search."
        : en
          ? "ChatGPT, Claude, Gemini, Grok, DeepSeek, Copilot, Perplexity, Le Chat, Meta AI, Qwen — gathered via web with search."
          : es
            ? "ChatGPT, Claude, Gemini, Grok, DeepSeek, Copilot, Perplexity, Le Chat, Meta AI, Qwen — recogidos vía web con búsqueda."
            : "ChatGPT, Claude, Gemini, Grok, DeepSeek, Copilot, Perplexity, Le Chat, Meta AI, Qwen — via interface web avec recherche.",
      cta: pt ? "Ver os 10 →" : en ? "See the 10 →" : es ? "Ver los 10 →" : "Voir les 10 →",
    },
    {
      href: "/jogos",
      emoji: "⚽",
      titulo: pt ? "Palpites jogo a jogo" : en ? "Match by match" : es ? "Partido por partido" : "Match par match",
      sub: pt ? "Pra usar no seu bolão" : en ? "To use in your pool" : es ? "Para tu polla" : "Pour votre cagnotte",
      desc: pt
        ? "Pros 104 jogos: qual placar cada IA chutou, quantas concordam, o consenso. Sem precisar criar conta."
        : en
          ? "For all 104 matches: which score each AI predicted, how many agree, the consensus. No account needed."
          : es
            ? "Para los 104 partidos: qué marcador predijo cada IA, cuántas concuerdan, el consenso. Sin cuenta."
            : "Pour les 104 matches: quel score chaque IA a prédit, combien sont d'accord. Sans compte.",
      cta: pt ? "Espiar →" : en ? "Peek →" : es ? "Espiar →" : "Voir →",
    },
    {
      href: "/signup",
      emoji: "🎯",
      titulo: pt ? "Crie seu bolão" : en ? "Start your pool" : es ? "Crea tu polla" : "Créez votre cagnotte",
      sub: pt ? "Privado, pra galera" : en ? "Private, for your group" : es ? "Privada, para tu grupo" : "Privée, pour votre groupe",
      desc: pt
        ? "Link único pra convidar amigos. Palpita do celular (ou aproveita de qualquer IA num clique). Ranking automático."
        : en
          ? "Unique invite link. Predict from your phone (or borrow any AI's prediction). Auto ranking."
          : es
            ? "Enlace único para amigos. Pronostica desde el móvil. Ranking automático."
            : "Lien d'invitation unique. Pronostiquez depuis votre mobile. Classement auto.",
      cta: pt ? "Criar conta →" : en ? "Create account →" : es ? "Crear cuenta →" : "Créer un compte →",
    },
    {
      href: "/como-funciona",
      emoji: "📘",
      titulo: pt ? "Como funciona" : en ? "How it works" : es ? "Cómo funciona" : "Comment ça marche",
      sub: pt ? "Regras e pontuação" : en ? "Rules and scoring" : es ? "Reglas y puntuación" : "Règles et score",
      desc: pt
        ? "Placar exato vale 10, vencedor com saldo 7, vencedor 5, errado 0. Mata-mata vale 2×. Tudo explicado."
        : en
          ? "Exact score = 10 pts, winner+goal diff = 7, winner alone = 5, wrong = 0. Knockout counts 2×."
          : es
            ? "Marcador exacto = 10 pts, ganador+saldo = 7, ganador solo = 5, fallado = 0. Eliminatorias 2×."
            : "Score exact = 10 pts, vainqueur+diff = 7, vainqueur = 5, faux = 0. Phases finales 2×.",
      cta: pt ? "Ver regras →" : en ? "See rules →" : es ? "Ver reglas →" : "Voir →",
    },
    {
      href: "/ranking-geral",
      emoji: "🌍",
      titulo: pt ? "Hall da Fama" : en ? "Hall of Fame" : es ? "Salón de la Fama" : "Hall of Fame",
      sub: pt ? "Humanos + IAs juntos" : en ? "Humans + AIs together" : es ? "Humanos + IAs juntos" : "Humains + IA",
      desc: pt
        ? "Humanos opt-in disputando contra as 122 IAs + Bola de Cristal. O ranking onde todo mundo briga no mesmo placar."
        : en
          ? "Opt-in humans against the 122 AIs + Crystal Ball. The ranking where everyone fights on the same score."
          : es
            ? "Humanos opt-in vs las 122 IAs + Bola de Cristal."
            : "Humains opt-in contre les 122 IA + Boule de Cristal.",
      cta: pt ? "Entrar no Hall →" : en ? "Enter Hall →" : es ? "Entrar al Salón →" : "Entrer →",
    },
    {
      href: "/cristal",
      emoji: "🔮",
      titulo: pt ? "Bola de Cristal" : en ? "Crystal Ball" : es ? "Bola de Cristal" : "Boule de Cristal",
      sub: pt ? "O palpite consenso" : en ? "The consensus prediction" : es ? "El pronóstico consenso" : "Le pronostic consensus",
      desc: pt
        ? "Pra cada jogo, juntamos o placar mais votado entre TODAS as 122 IAs. Sabedoria das massas aplicada a futebol."
        : en
          ? "For each match, the score most voted by ALL 122 AIs. Wisdom of the crowd applied to football."
          : es
            ? "Para cada partido, el marcador más votado por las 122 IAs."
            : "Pour chaque match, le score le plus voté par les 122 IA.",
      cta: pt ? "Olhar a Cristal →" : en ? "See the Ball →" : es ? "Ver la Bola →" : "Voir la Boule →",
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

          <HeroCTAs locale={locale} />

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

      <SerieA locale={locale} variante="destaque" />

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
            {destinos.map((d) => (
              <Link
                key={d.href}
                href={d.href}
                className="card hoverable destino-card"
              >
                <CardConteudo {...d} />
              </Link>
            ))}
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
