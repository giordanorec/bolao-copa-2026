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
    kicker: "🔥 Mata-mata no ar",
    titulo: "Os palpites pro mata-mata já começaram a sair!",
    texto:
      "As IAs já cravaram placar para os confrontos do mata-mata — cada uma com dossiê completo de lesões, suspensões, forma e odds. Confrontos e probabilidades são públicos; os placares de cada IA são premium.",
    cta: "Ver os palpites do mata-mata →",
    obrigado: "Acesso antecipado liberado pra quem contribuiu 💜 Antes do primeiro jogo da fase, abrimos pra todo mundo.",
  },
  en: {
    kicker: "🔥 Knockout stage is live",
    titulo: "The AIs' knockout predictions are starting to drop!",
    texto:
      "The AIs have started locking in scorelines for the knockout matchups — each with a full dossier of injuries, suspensions, form and odds. Matchups and probabilities are public; each AI's scores are premium.",
    cta: "See the knockout picks →",
    obrigado: "Early access unlocked for contributors 💜 Before the first match of the round, we open it to everyone.",
  },
  es: {
    kicker: "🔥 La eliminatoria ya está en vivo",
    titulo: "¡Empezaron a salir los pronósticos para la eliminatoria!",
    texto:
      "Las IAs ya marcaron resultado para los cruces de la eliminatoria — cada una con un dossier completo de lesiones, suspensiones, forma y cuotas. Cruces y probabilidades son públicos; los marcadores de cada IA son premium.",
    cta: "Ver los pronósticos de la eliminatoria →",
    obrigado: "Acceso anticipado habilitado para quien colaboró 💜 Antes del primer partido de la ronda, lo abrimos para todos.",
  },
  fr: {
    kicker: "🔥 La phase à élimination est en ligne",
    titulo: "Les pronostics pour les matchs à élimination commencent à sortir !",
    texto:
      "Les IA ont commencé à fixer les scores des confrontations à élimination directe — chacune avec un dossier complet de blessures, suspensions, forme et cotes. Confrontations et probabilités sont publiques ; les scores de chaque IA sont premium.",
    cta: "Voir les pronostics du tableau final →",
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
          padding: 30px 34px;
          border-radius: 22px;
          text-decoration: none;
          overflow: hidden;
          background: linear-gradient(135deg, var(--secondary), var(--accent));
          border: 2px solid color-mix(in srgb, #fff 35%, var(--accent));
          box-shadow: 0 14px 48px color-mix(in srgb, var(--secondary) 55%, transparent);
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .v3-aviso:hover {
          transform: translateY(-3px) scale(1.01);
          box-shadow: 0 22px 64px color-mix(in srgb, var(--secondary) 65%, transparent);
        }
        .v3-aviso-glow {
          position: absolute; inset: -40%;
          background: conic-gradient(from 0deg,
            transparent 0deg,
            color-mix(in srgb, #fff 55%, transparent) 50deg,
            transparent 120deg,
            color-mix(in srgb, #fff 40%, transparent) 210deg,
            transparent 290deg);
          animation: v3spin 7s linear infinite;
          pointer-events: none; opacity: 0.6;
          mix-blend-mode: overlay;
        }
        @keyframes v3spin { to { transform: rotate(360deg); } }
        .v3-aviso-conteudo { position: relative; z-index: 1; text-align: center; }
        .v3-aviso-kicker {
          display: inline-block;
          font-family: var(--ff-mono);
          font-size: 12px; font-weight: 800;
          text-transform: uppercase; letter-spacing: 0.08em;
          color: #fff; margin-bottom: 8px;
          padding: 4px 12px; border-radius: 999px;
          background: rgba(0, 0, 0, 0.22);
        }
        .v3-aviso-titulo {
          font-size: 27px; margin: 0 0 10px; line-height: 1.15;
          color: #fff; text-shadow: 0 2px 12px rgba(0, 0, 0, 0.25);
        }
        .v3-aviso-texto {
          color: rgba(255, 255, 255, 0.95); font-size: 15px; line-height: 1.55;
          max-width: 640px; margin: 0 auto 12px;
        }
        .v3-aviso-obrigado {
          color: rgba(255, 255, 255, 0.9); font-size: 14px; font-weight: 600;
          max-width: 600px; margin: 0 auto 16px;
        }
        .v3-aviso-cta {
          display: inline-block;
          font-weight: 800; font-size: 15px;
          color: var(--secondary); padding: 13px 28px; border-radius: 999px;
          background: #fff;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
        }
        @media (max-width: 520px) {
          .v3-aviso { padding: 22px 20px; }
          .v3-aviso-titulo { font-size: 22px; }
        }
      `}</style>
    </section>
  );
}
