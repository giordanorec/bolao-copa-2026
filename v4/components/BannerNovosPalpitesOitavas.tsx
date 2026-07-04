import Link from "next/link";
import type { Locale } from "@/lib/i18n";

/**
 * Banner grande no topo da home: "NOVOS palpites das IAs pras Oitavas!"
 * Aparece só quando a rodada mais recente de simular_campeao é da fase
 * Oitavas ou seguinte. Idealmente controlado por prop ou checagem do
 * predicoes_campeao.json (rodada, fase mais avançada).
 */

const TX: Record<
  Locale,
  { kicker: string; h1: string; lede: string; cta: string }
> = {
  pt: {
    kicker: "🔥 NOVOS PALPITES · OITAVAS DE FINAL",
    h1: "As IAs REPALPITARAM. Palpites de placar dos 8 jogos das Oitavas!",
    lede: "R32 fechou com 5 empates e 2 zebras. Agora os 8 confrontos das Oitavas estão definidos — 52 IAs mandaram seus placares exatos pra cada jogo, com dossiê completo (odds, lesões, forma). Vem descobrir quem palpitou o quê.",
    cta: "Ver os palpites por jogo →",
  },
  en: {
    kicker: "🔥 NEW PREDICTIONS · ROUND OF 16",
    h1: "The AIs updated. Score predictions for all 8 Round of 16 games!",
    lede: "R32 closed with 5 draws and 2 upsets. Now the 8 Round of 16 matches are set — 52 AIs sent their exact score predictions, with full dossier (odds, injuries, form). Come see who called what.",
    cta: "See predictions per game →",
  },
  es: {
    kicker: "🔥 NUEVOS PRONÓSTICOS · OCTAVOS DE FINAL",
    h1: "Las IAs actualizaron. ¡Marcadores para los 8 partidos de Octavos!",
    lede: "Los 16avos cerraron con 5 empates y 2 sorpresas. Ya están definidos los 8 cruces de Octavos — 52 IAs mandaron sus marcadores exactos, con dossier completo (cuotas, lesiones, forma).",
    cta: "Ver pronósticos por partido →",
  },
  fr: {
    kicker: "🔥 NOUVEAUX PRONOSTICS · 8e DE FINALE",
    h1: "Les IA ont refait leurs pronos. Scores pour les 8 matchs des 8es !",
    lede: "Le R32 s'est terminé avec 5 nuls et 2 surprises. Les 8 confrontations des 8es sont fixées — 52 IA ont envoyé leurs scores exacts, avec dossier complet (cotes, blessures, forme).",
    cta: "Voir les pronos par match →",
  },
};

export default function BannerNovosPalpitesOitavas({ locale }: { locale: Locale }) {
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
          href="/jogos#89"
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
          52 IAs · 8 jogos das Oitavas · placar exato de cada uma · atualizado agora
        </div>
      </div>
    </section>
  );
}
