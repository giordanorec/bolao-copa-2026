import Link from "next/link";
import type { Locale } from "@/lib/i18n";

/**
 * Banner grande no topo da home: "NOVOS palpites das IAs pras Quartas!"
 * Aparece quando os 4 confrontos das Quartas estão definidos (após Oitavas)
 * e as IAs mandaram placares via API.
 */

const TX: Record<
  Locale,
  { kicker: string; h1: string; lede: string; cta: string; rodape: string }
> = {
  pt: {
    kicker: "🔥 NOVOS PALPITES · QUARTAS DE FINAL",
    h1: "As IAs REPALPITARAM. 52 placares pras 4 Quartas — e Argentina×Suíça surpreendeu.",
    lede:
      "Oitavas fecharam: França, Marrocos, Espanha, Bélgica, Noruega, Inglaterra, Argentina e Suíça estão vivos. As IAs cravaram consensos claros — Espanha 1×0 (79%), Inglaterra 2×1 (85%) — e uma surpresa: 55% preveem Argentina 1×1 Suíça no regulamentar. Dossiê completo com odds, lesões (Onana fora, Saibari dúvida, doença varre elenco norueguês) e escalações prováveis.",
    cta: "Ver os palpites por jogo →",
    rodape:
      "52 IAs · 4 jogos das Quartas · placar exato de cada uma · atualizado agora",
  },
  en: {
    kicker: "🔥 NEW PREDICTIONS · QUARTERFINALS",
    h1: "The AIs updated. 52 predictions for the 4 QFs — and Argentina×Switzerland shocked.",
    lede:
      "Round of 16 closed: France, Morocco, Spain, Belgium, Norway, England, Argentina and Switzerland are still alive. The AIs delivered strong consensus — Spain 1×0 (79%), England 2×1 (85%) — and one surprise: 55% predict Argentina 1×1 Switzerland in regulation. Full dossier with odds, injuries (Onana out, Saibari doubtful, Norway hit by illness), and probable lineups.",
    cta: "See predictions per game →",
    rodape:
      "52 AIs · 4 QF matches · exact score from each · updated just now",
  },
  es: {
    kicker: "🔥 NUEVOS PRONÓSTICOS · CUARTOS DE FINAL",
    h1: "Las IAs actualizaron. 52 pronósticos para los 4 de Cuartos — Argentina×Suiza sorprende.",
    lede:
      "Los Octavos cerraron: Francia, Marruecos, España, Bélgica, Noruega, Inglaterra, Argentina y Suiza siguen vivos. Consenso claro — España 1×0 (79%), Inglaterra 2×1 (85%) — y una sorpresa: 55% predice Argentina 1×1 Suiza en el 90'. Dossier completo con cuotas, lesiones (Onana fuera, Saibari dudoso, brote de gripe en Noruega) y alineaciones probables.",
    cta: "Ver pronósticos por partido →",
    rodape:
      "52 IAs · 4 partidos de Cuartos · marcador exacto de cada una · actualizado ahora",
  },
  fr: {
    kicker: "🔥 NOUVEAUX PRONOSTICS · QUARTS DE FINALE",
    h1: "Les IA ont refait leurs pronos. 52 scores pour les 4 Quarts — Argentine×Suisse crée la surprise.",
    lede:
      "Les 8es sont bouclés : France, Maroc, Espagne, Belgique, Norvège, Angleterre, Argentine et Suisse restent en lice. Consensus net — Espagne 1×0 (79%), Angleterre 2×1 (85%) — et une surprise : 55% prédisent Argentine 1×1 Suisse dans le temps réglementaire. Dossier complet avec cotes, blessures (Onana forfait, Saibari incertain, virus dans le camp norvégien) et compositions probables.",
    cta: "Voir les pronos par match →",
    rodape:
      "52 IA · 4 matchs des Quarts · score exact de chacune · mis à jour à l'instant",
  },
};

export default function BannerNovosPalpitesQuartas({ locale }: { locale: Locale }) {
  const tx = TX[locale];
  return (
    <section
      style={{
        padding: "44px 20px 52px",
        margin: "16px 0",
        background:
          "linear-gradient(135deg, #FF6B00 0%, #FF3D00 45%, #B71C1C 100%)",
        color: "#fff",
        position: "relative",
        overflow: "hidden",
        borderTop: "1px solid rgba(255,215,0,0.35)",
        borderBottom: "1px solid rgba(255,215,0,0.35)",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage:
            "radial-gradient(3px 3px at 15% 25%, rgba(255,215,0,.6), transparent 60%), radial-gradient(4px 4px at 65% 55%, rgba(255,255,255,.35), transparent 60%), radial-gradient(3px 3px at 88% 20%, rgba(255,215,0,.5), transparent 60%), radial-gradient(3px 3px at 12% 75%, rgba(255,255,255,.4), transparent 60%)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: 960,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: 3,
            color: "#FFD700",
            marginBottom: 16,
            textShadow: "0 0 16px rgba(255,215,0,.45)",
          }}
        >
          {tx.kicker}
        </div>
        <h2
          style={{
            fontSize: "clamp(32px, 6vw, 54px)",
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: -0.8,
            marginBottom: 18,
            color: "#fff",
            textShadow: "0 4px 20px rgba(0,0,0,.35)",
          }}
        >
          {tx.h1}
        </h2>
        <p
          style={{
            fontSize: "clamp(15px, 1.7vw, 18px)",
            lineHeight: 1.55,
            color: "rgba(255,255,255,0.92)",
            maxWidth: 720,
            margin: "0 auto 30px",
          }}
        >
          {tx.lede}
        </p>
        <Link
          href="/jogos#97"
          style={{
            display: "inline-block",
            padding: "18px 42px",
            background: "linear-gradient(180deg, #FFD700, #F0B400)",
            color: "#0a0e1a",
            borderRadius: 999,
            fontWeight: 900,
            fontSize: 18,
            textDecoration: "none",
            boxShadow:
              "0 12px 40px rgba(0,0,0,.35), 0 0 0 1px rgba(255,215,0,.6)",
            letterSpacing: 0.3,
          }}
        >
          {tx.cta}
        </Link>
        <div
          style={{
            marginTop: 22,
            fontSize: 12,
            color: "rgba(255,255,255,0.7)",
            letterSpacing: 0.4,
            fontStyle: "italic",
          }}
        >
          {tx.rodape}
        </div>
      </div>
    </section>
  );
}
