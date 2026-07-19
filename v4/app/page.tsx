import Link from "next/link";
import SerieA from "@/components/SerieA";
import HeroCampeoes from "@/components/HeroCampeoes";
import ResumoExperimento from "@/components/ResumoExperimento";
import SeguirInstagram from "@/components/SeguirInstagram";
import CorridaHome from "@/components/CorridaHome";
import AgradecimentoContribuinte from "@/components/AgradecimentoContribuinte";
import { resolverLocale } from "@/lib/locale-server";
import { t } from "@/lib/i18n";

/**
 * Home — site definitivo/arquivo do experimento (a Copa 2026 acabou em
 * 19/07). Estrutura: hero de celebração dos campeões → resumo do
 * experimento → vitrine Série A → corrida animada → atalhos pras seções →
 * Instagram → agradecimento a contribuintes → regras (referência) → footer.
 *
 * Removido nesta remodelagem (arquivo continua no repo, só não é mais
 * chamado aqui): BannerR32 (banner de resultado ao vivo — obsoleto, a Copa
 * acabou), BannerAnimacaoCampeao (previa "Brasil campeão" pré-Copa, não
 * bate mais com o resultado real), CelebracaoMataMata e PodioGrupos
 * (memórias de fases intermediárias, superadas pelo pódio final no hero),
 * BolaoHumanosRecrutamento (recrutamento pro bolão — encerrado),
 * CaixaDeSugestao (pedia sugestões "pras próximas rodadas" — não há mais
 * rodadas), callout de melhoria v1→v2 (mensagem de meio de torneio),
 * card promocional de "próximo jogo" (jogos#73) e CTA de "crie seu bolão".
 */
export default async function Home() {
  const locale = await resolverLocale();

  const pt = locale === "pt";
  const en = locale === "en";
  const es = locale === "es";

  const destinos = [
    {
      href: "/retrospectiva",
      emoji: "🎬",
      titulo: pt ? "A Retrospectiva Completa" : en ? "The Full Retrospective" : es ? "La Retrospectiva Completa" : "La Rétrospective Complète",
      sub: pt ? "O experimento, do início ao fim" : en ? "The experiment, start to finish" : es ? "El experimento, de principio a fin" : "L'expérience, du début à la fin",
      desc: pt
        ? "Como cada fase virou o ranking, os maiores acertos, as maiores zebras — e como tudo terminou."
        : en
          ? "How each stage reshaped the ranking, the biggest hits, the biggest upsets — and how it all ended."
          : es
            ? "Cómo cada fase cambió el ranking, los mayores aciertos, las mayores sorpresas — y cómo terminó todo."
            : "Comment chaque phase a changé le classement, les plus beaux coups, les plus grosses surprises — et comment tout s'est terminé.",
      cta: pt ? "Explorar →" : en ? "Explore →" : es ? "Explorar →" : "Explorer →",
    },
    {
      href: "/ranking-geral",
      emoji: "🏅",
      titulo: pt ? "Hall da Fama" : en ? "Hall of Fame" : es ? "Salón de la Fama" : "Panthéon",
      sub: pt ? "124 IAs + humanos, um só placar" : en ? "124 AIs + humans, one scoreboard" : es ? "124 IAs + humanos, un solo marcador" : "124 IA + humains, un seul tableau",
      desc: pt
        ? "O ranking geral final: quem chutou melhor entre todo mundo — IA ou humano — do primeiro ao último jogo."
        : en
          ? "The final overall ranking: who called it best across the board — AI or human — from first match to last."
          : es
            ? "El ranking general final: quién acertó más entre todos — IA o humano — del primer al último partido."
            : "Le classement général final : qui a le mieux deviné — IA ou humain — du premier au dernier match.",
      cta: pt ? "Ver o ranking →" : en ? "See the ranking →" : es ? "Ver el ranking →" : "Voir le classement →",
    },
    {
      href: "/ranking-ias",
      emoji: "🏆",
      titulo: pt ? "Série A das IAs" : en ? "AI Premier League" : es ? "La Liga de las IAs" : "Ligue des IA",
      sub: pt ? "Os 12 cabeças de chave" : en ? "The top 12" : es ? "Las 12 cabezas de serie" : "Les 12 têtes de série",
      desc: pt
        ? "ChatGPT, Claude, Gemini, Grok, DeepSeek, Copilot, Perplexity, Le Chat, Meta AI, Qwen, Manus e o Fable — coletados via interface web, resultado final."
        : en
          ? "ChatGPT, Claude, Gemini, Grok, DeepSeek, Copilot, Perplexity, Le Chat, Meta AI, Qwen, Manus and Fable — gathered via web, final result."
          : es
            ? "ChatGPT, Claude, Gemini, Grok, DeepSeek, Copilot, Perplexity, Le Chat, Meta AI, Qwen, Manus y Fable — recogidos vía web, resultado final."
            : "ChatGPT, Claude, Gemini, Grok, DeepSeek, Copilot, Perplexity, Le Chat, Meta AI, Qwen, Manus et Fable — via le web, résultat final.",
      cta: pt ? "Ver os 12 →" : en ? "See the 12 →" : es ? "Ver los 12 →" : "Voir les 12 →",
    },
    {
      href: "/jogos",
      emoji: "⚽",
      titulo: pt ? "Palpites jogo a jogo" : en ? "Match by match" : es ? "Partido por partido" : "Match par match",
      sub: pt ? "Os 104 jogos, um por um" : en ? "All 104 matches" : es ? "Los 104 partidos" : "Les 104 matches",
      desc: pt
        ? "Pra cada jogo da Copa: o placar que cada IA chutou, o consenso, e quantas acertaram."
        : en
          ? "For every match: which score each AI predicted, the consensus, and how many got it right."
          : es
            ? "Para cada partido: qué marcador predijo cada IA, el consenso, y cuántas acertaron."
            : "Pour chaque match : le score pronostiqué par chaque IA, le consensus, et combien ont eu raison.",
      cta: pt ? "Ver os jogos →" : en ? "See the matches →" : es ? "Ver los partidos →" : "Voir les matches →",
    },
    {
      href: "/chaveamento",
      emoji: "🗂️",
      titulo: pt ? "Chaveamento" : en ? "Bracket" : es ? "Eliminatoria" : "Tableau final",
      sub: pt ? "O mata-mata inteiro" : en ? "The whole knockout stage" : es ? "Toda la eliminatoria" : "Toute la phase finale",
      desc: pt
        ? "Dos 16-avos até a Final, com o caminho que cada seleção percorreu — e onde as IAs previram diferente."
        : en
          ? "From the round of 32 to the Final, with each team's path — and where the AIs called it differently."
          : es
            ? "De los dieciseisavos a la Final, con el camino de cada selección — y dónde las IAs fallaron."
            : "Des seizièmes à la Finale, avec le parcours de chaque équipe — et où les IA se sont trompées.",
      cta: pt ? "Ver o chaveamento →" : en ? "See the bracket →" : es ? "Ver la eliminatoria →" : "Voir le tableau →",
    },
    {
      href: "/cristal",
      emoji: "🔮",
      titulo: pt ? "Bola de Cristal" : en ? "Crystal Ball" : es ? "Bola de Cristal" : "Boule de Cristal",
      sub: pt ? "O consenso das 124 IAs" : en ? "The consensus of 124 AIs" : es ? "El consenso de las 124 IAs" : "Le consensus des 124 IA",
      desc: pt
        ? "Pra cada jogo, o placar mais votado entre todas as IAs. Sabedoria das massas aplicada a futebol."
        : en
          ? "For each match, the score most voted by every AI. Wisdom of the crowd applied to football."
          : es
            ? "Para cada partido, el marcador más votado por todas las IAs. La sabiduría de las masas aplicada al fútbol."
            : "Pour chaque match, le score le plus voté par toutes les IA. La sagesse des foules appliquée au football.",
      cta: pt ? "Olhar a Cristal →" : en ? "See the Ball →" : es ? "Ver la Bola →" : "Voir la Boule →",
    },
    {
      href: "/zebras",
      emoji: "🦓",
      titulo: pt ? "Placar das Zebras" : en ? "Upset Scoreboard" : es ? "Placar de las Zebras" : "Tableau des Surprises",
      sub: pt ? "Quando o esperado falhou" : en ? "When the expected failed" : es ? "Cuando lo esperado falló" : "Quand l'attendu a raté",
      desc: pt
        ? "Os jogos em que ≥ 70% das IAs erraram tudo — incluindo a semifinal Espanha 2×0 França, que 0 das 62 IAs viu vir."
        : en
          ? "Matches where ≥ 70% of AIs got it all wrong — including the Spain 2–0 France semifinal, which 0 of 62 AIs saw coming."
          : es
            ? "Partidos donde ≥ 70% de las IAs fallaron todo — incluida la semifinal España 2×0 Francia, que 0 de las 62 IAs previó."
            : "Matches où ≥ 70% des IA ont tout faux — dont la demi-finale Espagne 2–0 France, qu'aucune des 62 IA n'a vue venir.",
      cta: pt ? "Ver as zebras →" : en ? "See the upsets →" : es ? "Ver las zebras →" : "Voir les surprises →",
    },
    {
      href: "/analise",
      emoji: "🔬",
      titulo: pt ? "Análise das IAs" : en ? "AI Analysis" : es ? "Análisis de las IAs" : "Analyse des IA",
      sub: pt ? "Como cada uma pensa" : en ? "How each one thinks" : es ? "Cómo piensa cada una" : "Comment chacune pense",
      desc: pt
        ? "Famílias de comportamento, quem acertou em qual continente, quem palpitou parecido — do início ao fim da Copa."
        : en
          ? "Behavior clusters, who nailed which continent, who predicted alike — from start to finish of the Cup."
          : es
            ? "Familias de comportamiento, quién acertó en qué continente, quién pronosticó parecido — de principio a fin."
            : "Familles de comportement, qui a réussi sur quel continent, qui a pronostiqué pareil — du début à la fin.",
      cta: pt ? "Abrir análise →" : en ? "Open analysis →" : es ? "Abrir análisis →" : "Ouvrir →",
    },
    {
      href: "/ias-vs-humanos",
      emoji: "⚔️",
      titulo: pt ? "IAs × Humanos" : en ? "AIs × Humans" : es ? "IAs × Humanos" : "IA × Humains",
      sub: pt ? "Quem previu melhor?" : en ? "Who predicted better?" : es ? "¿Quién predijo mejor?" : "Qui a le mieux prédit ?",
      desc: pt
        ? "Comparativo final: médias, medianas, % de placares exatos, e o pódio lado a lado de humanos e IAs."
        : en
          ? "Final comparison: averages, medians, % exact scores, and a side-by-side podium of humans and AIs."
          : es
            ? "Comparativo final: promedios, medianas, % de marcadores exactos y podio lado a lado de humanos e IAs."
            : "Comparatif final : moyennes, médianes, % de scores exacts, et podium côte à côte humains/IA.",
      cta: pt ? "Ver análise →" : en ? "See analysis →" : es ? "Ver análisis →" : "Voir l'analyse →",
    },
  ];

  return (
    <>
      <HeroCampeoes locale={locale} />

      <ResumoExperimento locale={locale} />

      {/* fase="geral": é o padrão do site pós-Copa (pedido do usuário) e bate
          1:1 com o hero — o campeão oficial da Série A (ChatGPT 5 Thinking,
          616) vem exatamente deste merge por fase (melhorFonte), regra
          confirmada como oficial em 19/07/2026. */}
      <SerieA locale={locale} variante="destaque" fase="geral" mostrarSeletor />

      <CorridaHome locale={locale} />

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

      <SeguirInstagram locale={locale} />

      <AgradecimentoContribuinte locale={locale} />

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
