import Link from "next/link";
import SerieA from "@/components/SerieA";
import PodioGrupos from "@/components/PodioGrupos";
import HeroCTAs from "@/components/HeroCTAs";
import SeguirInstagram from "@/components/SeguirInstagram";
import CorridaHome from "@/components/CorridaHome";
import CaixaDeSugestao from "@/components/CaixaDeSugestao";
import CelebracaoCristal from "@/components/CelebracaoCristal";
import AgradecimentoContribuinte from "@/components/AgradecimentoContribuinte";
import BolaoHumanosRecrutamento from "@/components/BolaoHumanosRecrutamento";
import { resolverLocale } from "@/lib/locale-server";
import { t } from "@/lib/i18n";
import { carregarAnaliseV2Publico } from "@/lib/analise-v2-publico";

export default async function Home() {
  const locale = await resolverLocale();
  const retroV2 = await carregarAnaliseV2Publico();

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
    {
      href: "/corrida-das-ias",
      emoji: "🏁",
      titulo: pt ? "Corrida das IAs" : en ? "AI Race" : es ? "Carrera de las IAs" : "Course des IA",
      sub: pt ? "Quem está na frente" : en ? "Who's ahead" : es ? "Quién va al frente" : "Qui mène",
      desc: pt
        ? "Visualizações animadas do ranking jogo a jogo: corrida vista de cima com mascotes, bar race, gráfico de pontos acumulados. A Série A trotando na pista."
        : en
          ? "Animated views of the ranking match by match: top-down race with mascots, bar race, accumulated points chart. The Premier League trotting on the track."
          : es
            ? "Visualizaciones animadas del ranking partido a partido: carrera vista desde arriba con mascotas, bar race, gráfico de puntos acumulados."
            : "Visualisations animées du classement match par match : course vue de dessus avec mascottes, bar race, graphique des points cumulés.",
      cta: pt ? "Ver a corrida →" : en ? "Watch the race →" : es ? "Ver la carrera →" : "Voir la course →",
    },
    {
      href: "/zebras",
      emoji: "🦓",
      titulo: pt ? "Placar das Zebras" : en ? "Upset Scoreboard" : es ? "Placar de las Zebras" : "Tableau des Surprises",
      sub: pt ? "Quando o esperado falha" : en ? "When the expected fails" : es ? "Cuando lo esperado falla" : "Quand l'attendu rate",
      desc: pt
        ? "Lista dos jogos em que ≥ 70% das IAs erraram tudo. As maiores surpresas da Copa contadas pelo placar e por quantas IAs comeram poeira em cada uma."
        : en
          ? "Matches where ≥ 70% of AIs got it all wrong. The biggest upsets of the World Cup, counted by score and by how many AIs ate dust."
          : es
            ? "Partidos donde ≥ 70% de las IAs fallaron todo. Las mayores sorpresas del Mundial."
            : "Matches où ≥ 70% des IA ont tout faux. Les plus grosses surprises de la Coupe.",
      cta: pt ? "Ver as zebras →" : en ? "See the upsets →" : es ? "Ver las zebras →" : "Voir les surprises →",
    },
    {
      href: "/analise",
      emoji: "🔬",
      titulo: pt ? "Análise das IAs" : en ? "AI Analysis" : es ? "Análisis de las IAs" : "Analyse des IA",
      sub: pt ? "Como cada uma pensa" : en ? "How each one thinks" : es ? "Cómo piensa cada una" : "Comment chacune pense",
      desc: pt
        ? "Painel de dados: famílias de comportamento, quem acerta em qual continente, quem palpita parecido — e se as IAs melhoram quando revisam o palpite (v1 → v2)."
        : en
          ? "Data panel: behavior clusters, who nails which continent, who predicts alike — and whether AIs improve when they revise (v1 → v2)."
          : es
            ? "Panel de datos: familias de comportamiento, quién acierta en qué continente, y si las IAs mejoran al revisar (v1 → v2)."
            : "Panneau de données : familles de comportement, qui réussit sur quel continent, et si les IA s'améliorent en révisant (v1 → v2).",
      cta: pt ? "Abrir análise →" : en ? "Open analysis →" : es ? "Abrir análisis →" : "Ouvrir →",
    },
    {
      href: "/jogos#73",
      emoji: "⚔️",
      titulo: pt ? "16-avos de Final" : en ? "Round of 32" : es ? "Dieciseisavos de Final" : "Seizièmes de Finale",
      sub: pt ? "🚀 Já no ar — early access contribuintes" : en ? "🚀 Now live — contributor early access" : es ? "🚀 Ya en vivo — acceso anticipado" : "🚀 En ligne — accès anticipé",
      desc: pt
        ? "Os palpites das 54 IAs para os 16 confrontos do mata-mata já estão na página de Jogos — cada jogo com placar de consenso e detalhe por IA. Confrontos + probabilidades são públicos; placares são premium."
        : en
          ? "The 54 AIs' predictions for the 16 knockout matchups are now on the Games page — each game with a consensus score and per-AI detail. Matchups + odds are public; scores are premium."
          : es
            ? "Los pronósticos de las 54 IAs para los 16 cruces de la eliminatoria ya están en la página de Partidos — cada partido con marcador de consenso y detalle por IA. Cruces + probabilidades son públicos; marcadores son premium."
            : "Les pronostics des 54 IA pour les 16 confrontations à élimination sont sur la page Matchs — chaque match avec un score de consensus et le détail par IA. Confrontations + probabilités sont publics ; scores sont premium.",
      cta: pt ? "Ver os 16-avos →" : en ? "See the R32 →" : es ? "Ver los dieciseisavos →" : "Voir les 16es →",
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
              <div className="stat-num">12k+</div>
              <span className="stat-lbl">
                {t(locale, "home.stats.palpites")}
              </span>
            </div>
          </div>
        </div>
      </section>

      <CelebracaoCristal locale={locale} />

      <section className="section" style={{ paddingTop: 8, paddingBottom: 8 }}>
        <div className="container">
          <Link
            href="/jogos"
            className="card hoverable"
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              textDecoration: "none",
              maxWidth: 880,
              margin: "0 auto",
              textAlign: "center",
              background:
                "linear-gradient(135deg, color-mix(in srgb, var(--secondary) 16%, transparent), color-mix(in srgb, var(--accent) 14%, transparent))",
              border: "1px solid color-mix(in srgb, var(--secondary) 36%, transparent)",
            }}
          >
            <span style={{ fontSize: 40, lineHeight: 1 }}>🔮</span>
            <span style={{ flex: "1 1 320px", minWidth: 0 }}>
              <span
                style={{
                  display: "block",
                  fontFamily: "var(--ff-mono)",
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--secondary)",
                  fontWeight: 700,
                  marginBottom: 4,
                }}
              >
                {pt ? "✨ No ar agora · de graça"
                : en ? "✨ Live now · free"
                : es ? "✨ En vivo · gratis"
                : "✨ En direct · gratuit"}
              </span>
              <span
                style={{
                  display: "block",
                  fontSize: 20,
                  fontWeight: 800,
                  color: "var(--fg)",
                  lineHeight: 1.2,
                }}
              >
                {pt ? "Os palpites das IAs pro próximo jogo já saíram"
                : en ? "The AIs' picks for the next match are out"
                : es ? "Los pronósticos de las IAs para el próximo partido ya están"
                : "Les pronostics des IA pour le prochain match sont là"}
              </span>
            </span>
            <span
              className="btn yellow"
              style={{ flex: "0 0 auto", pointerEvents: "none" }}
            >
              {pt ? "Ver os palpites agora →"
              : en ? "See the picks now →"
              : es ? "Ver ahora →"
              : "Voir maintenant →"}
            </span>
          </Link>
        </div>
      </section>

      <BolaoHumanosRecrutamento locale={locale} />

      <AgradecimentoContribuinte locale={locale} />

      <section className="section" style={{ paddingTop: 8 }}>
        <div className="container">
          <CaixaDeSugestao locale={locale} />
        </div>
      </section>

      <SeguirInstagram locale={locale} />

      <PodioGrupos locale={locale} />

      <SerieA locale={locale} variante="destaque" fase="geral" />

      <CorridaHome locale={locale} />

      {/* Só destaca a melhoria v1→v2 quando o ganho for relevante (>5%).
          Abaixo disso é ruído — não vai pra home (mesma regra do /analise). */}
      {retroV2 && retroV2.n_ias > 0 && retroV2.agg.delta_pct > 5 && (
        <section className="section" style={{ paddingTop: 8 }}>
          <div className="container">
            <Link
              href="/analise"
              className="card hoverable"
              style={{
                display: "block",
                textDecoration: "none",
                maxWidth: 880,
                margin: "0 auto",
                background:
                  "linear-gradient(135deg, color-mix(in srgb, var(--secondary) 12%, transparent), color-mix(in srgb, var(--accent) 10%, transparent))",
                border: "1px solid color-mix(in srgb, var(--secondary) 30%, transparent)",
              }}
            >
              <p
                style={{
                  textAlign: "center",
                  fontFamily: "var(--ff-mono)",
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--secondary)",
                  marginBottom: 4,
                }}
              >
                {pt ? "✨ As IAs estão melhorando"
                : en ? "✨ The AIs are improving"
                : es ? "✨ Las IAs están mejorando"
                : "✨ Les IA s'améliorent"}
              </p>
              <h2 style={{ textAlign: "center", marginBottom: 6, fontSize: 24 }}>
                {pt ? "Quando revisam o palpite, acertam mais"
                : en ? "When they revise their pick, they score more"
                : es ? "Cuando revisan, aciertan más"
                : "Quand elles révisent, elles marquent plus"}
              </h2>
              <p
                style={{
                  textAlign: "center",
                  color: "var(--fg-mid)",
                  fontSize: 14,
                  maxWidth: 600,
                  margin: "0 auto 18px",
                }}
              >
                {pt
                  ? `Nos ${retroV2.jogos.length} jogos já decididos em que as IAs refizeram o palpite com a Copa rolando (v2):`
                  : en
                    ? `Across the ${retroV2.jogos.length} decided matches where the AIs redid their pick mid-tournament (v2):`
                    : es
                      ? `En los ${retroV2.jogos.length} partidos decididos donde las IAs rehicieron el pronóstico (v2):`
                      : `Sur les ${retroV2.jogos.length} matchs décidés où les IA ont refait leur pronostic (v2) :`}
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: 14,
                }}
              >
                {[
                  {
                    valor: `+${retroV2.agg.delta_pct}%`,
                    lbl: pt ? "mais pontos" : en ? "more points" : es ? "más puntos" : "de points",
                    cor: "var(--ok, #16a34a)",
                  },
                  {
                    valor: `${retroV2.agg.pct_exato_v1}%→${retroV2.agg.pct_exato_v2}%`,
                    lbl: pt ? "placar exato" : en ? "exact score" : es ? "marcador exacto" : "score exact",
                    cor: "var(--secondary)",
                  },
                  {
                    valor: `${retroV2.agg.melhoraram}↑/${retroV2.agg.pioraram}↓`,
                    lbl: pt ? `de ${retroV2.n_ias} IAs` : en ? `of ${retroV2.n_ias} AIs` : es ? `de ${retroV2.n_ias} IAs` : `sur ${retroV2.n_ias} IA`,
                    cor: "var(--accent)",
                  },
                  {
                    valor: `${retroV2.agg.pct_mudaram}%`,
                    lbl: pt ? "palpites mudaram" : en ? "picks changed" : es ? "cambiaron" : "ont changé",
                    cor: "var(--primary)",
                  },
                ].map((s) => (
                  <div key={s.lbl} style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: 28,
                        fontWeight: 900,
                        fontFamily: "var(--ff-display)",
                        color: s.cor,
                      }}
                    >
                      {s.valor}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--fg-muted)",
                        fontFamily: "var(--ff-mono)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        marginTop: 4,
                      }}
                    >
                      {s.lbl}
                    </div>
                  </div>
                ))}
              </div>
              <p
                style={{
                  textAlign: "center",
                  marginTop: 18,
                  color: "var(--secondary)",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                {pt ? "Ver a análise completa →"
                : en ? "See the full analysis →"
                : es ? "Ver el análisis completo →"
                : "Voir l'analyse complète →"}
              </p>
            </Link>
          </div>
        </section>
      )}

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
