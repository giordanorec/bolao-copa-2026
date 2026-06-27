import Link from "next/link";
import type { Locale } from "@/lib/i18n";

const TX: Record<Locale, {
  kicker: string;
  titulo: string;
  texto: string;
  cta: string;
  obrigado: string;
}> = {
  pt: {
    kicker: "🔥 Segunda fase no ar",
    titulo: "Os palpites das IAs para os 16-avos já saíram!",
    texto:
      "As IAs cravaram placar para os 16 confrontos do mata-mata — cada uma com dossiê completo de lesões, suspensões, forma e odds. Confrontos e probabilidades são públicos; os placares de cada IA são premium.",
    cta: "Ver os palpites dos 16-avos →",
    obrigado: "Acesso antecipado liberado pra quem contribuiu 💜 Antes do primeiro jogo da fase, abrimos pra todo mundo.",
  },
  en: {
    kicker: "🔥 Knockout stage is live",
    titulo: "The AIs' Round of 32 predictions are out!",
    texto:
      "The AIs locked in a scoreline for all 16 knockout matchups — each with a full dossier of injuries, suspensions, form and odds. Matchups and probabilities are public; each AI's scores are premium.",
    cta: "See the Round of 32 picks →",
    obrigado: "Early access unlocked for contributors 💜 Before the first match of the round, we open it to everyone.",
  },
  es: {
    kicker: "🔥 La fase eliminatoria ya está en vivo",
    titulo: "¡Salieron los pronósticos de las IAs para los dieciseisavos!",
    texto:
      "Las IAs marcaron un resultado para los 16 cruces de la eliminatoria — cada una con un dossier completo de lesiones, suspensiones, forma y cuotas. Cruces y probabilidades son públicos; los marcadores de cada IA son premium.",
    cta: "Ver los pronósticos de dieciseisavos →",
    obrigado: "Acceso anticipado habilitado para quien colaboró 💜 Antes del primer partido de la ronda, lo abrimos para todos.",
  },
  fr: {
    kicker: "🔥 La phase à élimination est en ligne",
    titulo: "Les pronostics des IA pour les seizièmes sont sortis !",
    texto:
      "Les IA ont fixé un score pour les 16 confrontations à élimination directe — chacune avec un dossier complet de blessures, suspensions, forme et cotes. Confrontations et probabilités sont publiques ; les scores de chaque IA sont premium.",
    cta: "Voir les pronostics des seizièmes →",
    obrigado: "Accès anticipé débloqué pour les contributeurs 💜 Avant le premier match du tour, on ouvre à tout le monde.",
  },
};

export default function AvisoAtualizacaoV3({ locale }: { locale: Locale }) {
  const tx = TX[locale] ?? TX.pt;
  return (
    <section className="section" style={{ paddingTop: 8, paddingBottom: 0 }}>
      <div className="container">
        <Link href="/jogos#73" className="v3-aviso">
          <span className="v3-aviso-glow" aria-hidden />
          <div className="v3-aviso-conteudo">
            <span className="v3-aviso-kicker">{tx.kicker}</span>
            <h2 className="v3-aviso-titulo">{tx.titulo}</h2>
            <p className="v3-aviso-texto">{tx.texto}</p>
            <p className="v3-aviso-obrigado">{tx.obrigado}</p>
            <span className="v3-aviso-cta">{tx.cta}</span>
          </div>
        </Link>
      </div>
      <style>{`
        .v3-aviso {
          position: relative;
          display: block;
          max-width: 880px;
          margin: 0 auto;
          padding: 28px 32px;
          border-radius: 20px;
          text-decoration: none;
          overflow: hidden;
          background: linear-gradient(135deg,
            color-mix(in srgb, var(--secondary) 18%, transparent),
            color-mix(in srgb, var(--accent) 16%, transparent));
          border: 2px solid color-mix(in srgb, var(--secondary) 45%, transparent);
          box-shadow: 0 10px 40px color-mix(in srgb, var(--secondary) 22%, transparent);
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .v3-aviso:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 50px color-mix(in srgb, var(--secondary) 32%, transparent);
        }
        .v3-aviso-glow {
          position: absolute; inset: -40%;
          background: conic-gradient(from 0deg,
            transparent 0deg,
            color-mix(in srgb, var(--secondary) 30%, transparent) 60deg,
            transparent 120deg,
            color-mix(in srgb, var(--accent) 28%, transparent) 220deg,
            transparent 300deg);
          animation: v3spin 9s linear infinite;
          pointer-events: none; opacity: 0.5;
        }
        @keyframes v3spin { to { transform: rotate(360deg); } }
        .v3-aviso-conteudo { position: relative; z-index: 1; text-align: center; }
        .v3-aviso-kicker {
          display: inline-block;
          font-family: var(--ff-mono);
          font-size: 12px; font-weight: 800;
          text-transform: uppercase; letter-spacing: 0.08em;
          color: var(--secondary); margin-bottom: 8px;
        }
        .v3-aviso-titulo {
          font-size: 26px; margin: 0 0 10px; line-height: 1.15;
        }
        .v3-aviso-texto {
          color: var(--fg-mid); font-size: 15px; line-height: 1.55;
          max-width: 640px; margin: 0 auto 12px;
        }
        .v3-aviso-obrigado {
          color: var(--fg-mid); font-size: 14px; font-weight: 600;
          max-width: 600px; margin: 0 auto 16px;
        }
        .v3-aviso-cta {
          display: inline-block;
          font-weight: 800; font-size: 15px;
          color: #fff; padding: 12px 26px; border-radius: 999px;
          background: linear-gradient(135deg, var(--secondary), var(--accent));
        }
        @media (max-width: 520px) {
          .v3-aviso { padding: 22px 20px; }
          .v3-aviso-titulo { font-size: 22px; }
        }
      `}</style>
    </section>
  );
}
