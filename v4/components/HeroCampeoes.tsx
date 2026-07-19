import Link from "next/link";
import Bandeira from "@/components/Bandeira";
import IconeIA from "@/components/IconeIA";
import Avatar from "@/components/Avatar";
import type { Locale } from "@/lib/i18n";

/**
 * HeroCampeoes — o novo primeiro-scroll da home.
 *
 * A Copa 2026 acabou (Espanha 1x0 Argentina, 19/07). Este componente
 * substitui o hero de marketing antigo ("crie seu bolão") pela celebração
 * final: os 3 campeões da Arena das IAs (Geral, Série A, Humanos) + o
 * placar real da Copa como contexto + CTA pra retrospectiva completa.
 *
 * Números FINAIS (congelados — a Copa acabou, não há mais o que recalcular):
 *   Geral (124 IAs) — CO-CAMPEÕES empatados em 636 pts:
 *     Mistral Small 3 (22 placares exatos) e Grok 4 Fast Reasoning (20 exatos)
 *   Série A (12 cabeças-de-chave) — ChatGPT 5 Thinking, 616 pts, 19 exatos (regra da vitrine: melhor fonte por fase)
 *   Humanos — Gabriel, 629 pts, 19 exatos (à frente de 121 das 124 IAs)
 *
 * Estética deliberadamente fora do sistema de 12 temas (como os outros
 * banners de "momento especial" do site) — fundo escuro fixo, serifada
 * Fraunces (já carregada no layout) pro tom de "manchete de jornal /
 * placa de museu", já que este é o site definitivo de registro do
 * experimento.
 */

const TX: Record<
  Locale,
  {
    kicker: string;
    h1a: string;
    h1b: string;
    finalLabel: string;
    timeA: string;
    timeB: string;
    finalMeta: string;
    catGeral: { kicker: string; titulo: string; empate: string; sub: string };
    catSerieA: { kicker: string; titulo: string; sub: string };
    catHumanos: { kicker: string; titulo: string; sub: string };
    exatos: string;
    destaquePre: string;
    destaqueForte: string;
    destaquePos: string;
    cta: string;
    ctaSub: string;
  }
> = {
  pt: {
    kicker: "🏁 EXPERIMENTO ENCERRADO · 11 JUN – 19 JUL 2026",
    h1a: "A Copa acabou.",
    h1b: "Estes são os campeões.",
    finalLabel: "Final da Copa do Mundo 2026",
    timeA: "Espanha",
    timeB: "Argentina",
    finalMeta: "Nova York/NJ · 19 de julho",
    catGeral: {
      kicker: "🤖 GERAL · 124 IAs",
      titulo: "Co-campeões",
      empate: "empate no topo",
      sub: "636 pts cada — o ranking geral fechou empatado no topo",
    },
    catSerieA: {
      kicker: "⭐ SÉRIE A · 12 cabeças-de-chave",
      titulo: "Campeã",
      sub: "616 pts",
    },
    catHumanos: {
      kicker: "🧠 HUMANOS",
      titulo: "Campeão",
      sub: "629 pts",
    },
    exatos: "exatos",
    destaquePre: "🎯 O melhor humano do bolão bateu",
    destaqueForte: "121 das 124 IAs",
    destaquePos: "concorrentes.",
    cta: "Ver a retrospectiva completa →",
    ctaSub: "104 jogos, 124 IAs, uma zebra histórica — a história completa",
  },
  en: {
    kicker: "🏁 EXPERIMENT CLOSED · JUN 11 – JUL 19, 2026",
    h1a: "The Cup is over.",
    h1b: "These are the champions.",
    finalLabel: "2026 World Cup Final",
    timeA: "Spain",
    timeB: "Argentina",
    finalMeta: "New York/NJ · July 19",
    catGeral: {
      kicker: "🤖 OVERALL · 124 AIs",
      titulo: "Co-champions",
      empate: "tied at the top",
      sub: "636 pts each — the overall ranking ended in a tie at the top",
    },
    catSerieA: {
      kicker: "⭐ PREMIER LEAGUE · top 12",
      titulo: "Champion",
      sub: "616 pts",
    },
    catHumanos: {
      kicker: "🧠 HUMANS",
      titulo: "Champion",
      sub: "629 pts",
    },
    exatos: "exact",
    destaquePre: "🎯 The pool's best human beat",
    destaqueForte: "121 of 124 AIs",
    destaquePos: "in the field.",
    cta: "See the full retrospective →",
    ctaSub: "104 matches, 124 AIs, one historic upset — the whole story",
  },
  es: {
    kicker: "🏁 EXPERIMENTO CERRADO · 11 JUN – 19 JUL 2026",
    h1a: "El Mundial terminó.",
    h1b: "Estos son los campeones.",
    finalLabel: "Final del Mundial 2026",
    timeA: "España",
    timeB: "Argentina",
    finalMeta: "Nueva York/NJ · 19 de julio",
    catGeral: {
      kicker: "🤖 GENERAL · 124 IAs",
      titulo: "Co-campeones",
      empate: "empate en la cima",
      sub: "636 pts cada uno — el ranking general cerró empatado en la cima",
    },
    catSerieA: {
      kicker: "⭐ LIGA A · 12 cabezas de serie",
      titulo: "Campeona",
      sub: "616 pts",
    },
    catHumanos: {
      kicker: "🧠 HUMANOS",
      titulo: "Campeón",
      sub: "629 pts",
    },
    exatos: "exactos",
    destaquePre: "🎯 El mejor humano del bolão superó a",
    destaqueForte: "121 de las 124 IAs",
    destaquePos: "en competencia.",
    cta: "Ver la retrospectiva completa →",
    ctaSub: "104 partidos, 124 IAs, una zebra histórica — la historia completa",
  },
  fr: {
    kicker: "🏁 EXPÉRIENCE TERMINÉE · 11 JUIN – 19 JUIL 2026",
    h1a: "La Coupe est finie.",
    h1b: "Voici les champions.",
    finalLabel: "Finale de la Coupe du Monde 2026",
    timeA: "Espagne",
    timeB: "Argentine",
    finalMeta: "New York/NJ · 19 juillet",
    catGeral: {
      kicker: "🤖 GÉNÉRAL · 124 IA",
      titulo: "Co-champions",
      empate: "ex æquo en tête",
      sub: "636 pts chacun — le classement général termine ex æquo en tête",
    },
    catSerieA: {
      kicker: "⭐ LIGUE A · 12 têtes de série",
      titulo: "Championne",
      sub: "616 pts",
    },
    catHumanos: {
      kicker: "🧠 HUMAINS",
      titulo: "Champion",
      sub: "629 pts",
    },
    exatos: "exacts",
    destaquePre: "🎯 Le meilleur humain de la cagnotte a battu",
    destaqueForte: "121 des 124 IA",
    destaquePos: "en compétition.",
    cta: "Voir la rétrospective complète →",
    ctaSub: "104 matches, 124 IA, une surprise historique — toute l'histoire",
  },
};

export default function HeroCampeoes({ locale = "pt" }: { locale?: Locale }) {
  const tx = TX[locale] ?? TX.pt;

  return (
    <section className="campeoes-hero">
      <div className="campeoes-hero-glow" aria-hidden />
      <div className="campeoes-hero-stars" aria-hidden />

      <div className="container campeoes-hero-inner">
        <div className="campeoes-kicker">{tx.kicker}</div>

        <h1 className="campeoes-h1">
          {tx.h1a}
          <br />
          <em>{tx.h1b}</em>
        </h1>

        {/* Placar real da final — contexto histórico */}
        <div className="campeoes-final">
          <span className="campeoes-final-label">{tx.finalLabel}</span>
          <div className="campeoes-final-placar">
            <Bandeira iso="es" nome={tx.timeA} size={30} />
            <span className="campeoes-final-time">{tx.timeA}</span>
            <span className="campeoes-final-num campeoes-final-num-win">1</span>
            <span className="campeoes-final-x">×</span>
            <span className="campeoes-final-num">0</span>
            <span className="campeoes-final-time">{tx.timeB}</span>
            <Bandeira iso="ar" nome={tx.timeB} size={30} />
          </div>
          <span className="campeoes-final-meta">🏆 {tx.finalMeta}</span>
        </div>

        {/* Pódio triplo: Geral, Série A, Humanos */}
        <div className="campeoes-grid">
          {/* Geral — co-campeões empatados */}
          <Link href="/ranking-geral" className="campeoes-card campeoes-card-geral">
            <span className="campeoes-card-glow" aria-hidden />
            <span className="campeoes-card-kicker">{tx.catGeral.kicker}</span>
            <span className="campeoes-card-crown" aria-hidden>👑</span>
            <span className="campeoes-card-titulo">{tx.catGeral.titulo}</span>

            <div className="campeoes-geral-duo">
              <div className="campeoes-geral-item">
                <span className="campeoes-geral-icone">
                  <IconeIA slug="mistral-small-3" size={30} />
                </span>
                <span className="campeoes-geral-nome">Mistral Small 3</span>
                <span className="campeoes-geral-exatos">22 {tx.exatos}</span>
              </div>
              <div className="campeoes-geral-vs" aria-hidden>+</div>
              <div className="campeoes-geral-item">
                <span className="campeoes-geral-icone">
                  <IconeIA slug="grok-4-fast" size={30} />
                </span>
                <span className="campeoes-geral-nome">Grok 4 Fast Reasoning</span>
                <span className="campeoes-geral-exatos">20 {tx.exatos}</span>
              </div>
            </div>

            <span className="campeoes-card-pontos">
              636 <span className="campeoes-card-pts-lbl">pts</span>
            </span>
            <span className="campeoes-card-sub">{tx.catGeral.sub}</span>
          </Link>

          {/* Série A — ChatGPT 5 Thinking (regra oficial da vitrine: grupos via
              irmão API + mata-mata via coleta web, melhor fonte por fase) */}
          <Link href="/ranking-ias" className="campeoes-card campeoes-card-serie-a campeoes-card-destaque">
            <span className="campeoes-card-glow" aria-hidden />
            <span className="campeoes-card-kicker">{tx.catSerieA.kicker}</span>
            <span className="campeoes-card-crown" aria-hidden>👑</span>
            <span className="campeoes-card-titulo">{tx.catSerieA.titulo}</span>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mascots/chatgpt-5-thinking-web.png"
              alt="Mascote ChatGPT 5 Thinking"
              width={132}
              height={132}
              className="campeoes-mascote"
            />
            <span className="campeoes-card-nome-solo">ChatGPT 5 Thinking</span>

            <span className="campeoes-card-pontos campeoes-card-pontos-lg">
              616 <span className="campeoes-card-pts-lbl">pts</span>
            </span>
            <span className="campeoes-card-sub">{tx.catSerieA.sub} · 19 {tx.exatos}</span>
          </Link>

          {/* Humanos — Gabriel */}
          <Link href="/ranking-geral" className="campeoes-card campeoes-card-humanos">
            <span className="campeoes-card-glow" aria-hidden />
            <span className="campeoes-card-kicker">{tx.catHumanos.kicker}</span>
            <span className="campeoes-card-crown" aria-hidden>👑</span>
            <span className="campeoes-card-titulo">{tx.catHumanos.titulo}</span>

            <span className="campeoes-avatar-wrap">
              <Avatar src={null} nome="Gabriel" size={72} />
            </span>
            <span className="campeoes-card-nome-solo">Gabriel</span>

            <span className="campeoes-card-pontos">
              629 <span className="campeoes-card-pts-lbl">pts</span>
            </span>
            <span className="campeoes-card-sub">{tx.catHumanos.sub} · 19 {tx.exatos}</span>
          </Link>
        </div>

        {/* Destaque: humano bateu 121 de 124 IAs */}
        <p className="campeoes-destaque">
          {tx.destaquePre} <strong>{tx.destaqueForte}</strong> {tx.destaquePos}
        </p>

        <Link href="/retrospectiva" className="campeoes-cta">
          {tx.cta}
        </Link>
        <span className="campeoes-cta-sub">{tx.ctaSub}</span>
      </div>
    </section>
  );
}
