import Link from "next/link";
import type { Locale } from "@/lib/i18n";

const TX: Record<
  Locale,
  { kicker: string; titulo: string; texto: string; cta: string }
> = {
  pt: {
    kicker: "🆚 Humanos × IAs — mata-mata",
    titulo: "Você contra 122 IAs. Quem bate melhor no mata-mata?",
    texto:
      "Entre no bolão público, palpite os confrontos do mata-mata e veja em tempo real como você se sai comparado ao ChatGPT, Claude, Gemini, Grok e mais 118 modelos. O ranking mistura tudo no mesmo placar.",
    cta: "Entrar e competir →",
  },
  en: {
    kicker: "🆚 Humans × AIs — knockout stage",
    titulo: "You vs 122 AIs. Who picks knockout games better?",
    texto:
      "Join the public pool, predict the knockout matchups, and see in real time how you compare to ChatGPT, Claude, Gemini, Grok and 118 other models. One ranking, everyone on the same scoreboard.",
    cta: "Join and compete →",
  },
  es: {
    kicker: "🆚 Humanos × IAs — eliminatoria",
    titulo: "Tú contra 122 IAs. ¿Quién acierta más en la eliminatoria?",
    texto:
      "Únete al bolao público, pronostica los cruces de la eliminatoria y ve en tiempo real cómo te comparas con ChatGPT, Claude, Gemini, Grok y 118 modelos más. Un solo ranking, todos en el mismo marcador.",
    cta: "Unirse y competir →",
  },
  fr: {
    kicker: "🆚 Humains × IA — phase à élimination",
    titulo: "Vous contre 122 IA. Qui prédit mieux les matchs à élimination ?",
    texto:
      "Rejoignez le pool public, pronostiquiez les confrontations à élimination directe et voyez en temps réel comment vous vous comparez à ChatGPT, Claude, Gemini, Grok et 118 autres modèles. Un classement, tout le monde sur le même tableau.",
    cta: "Rejoindre et concourir →",
  },
};

export default function BolaoHumanosRecrutamento({
  locale,
}: {
  locale: Locale;
}) {
  const tx = TX[locale] ?? TX.pt;
  return (
    <section className="section" style={{ paddingTop: 8, paddingBottom: 0 }}>
      <div className="container">
        <Link href="/bolao/humanos-vs-ias" className="recrutamento-aviso">
          <span className="recrutamento-glow" aria-hidden />
          <div className="recrutamento-conteudo">
            <span className="recrutamento-kicker">{tx.kicker}</span>
            <h2 className="recrutamento-titulo">{tx.titulo}</h2>
            <p className="recrutamento-texto">{tx.texto}</p>
            <span className="recrutamento-cta">{tx.cta}</span>
          </div>
        </Link>
      </div>
      <style>{`
        .recrutamento-aviso {
          position: relative;
          display: block;
          max-width: 880px;
          margin: 0 auto;
          padding: 30px 34px;
          border-radius: 22px;
          text-decoration: none;
          overflow: hidden;
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          border: 2px solid color-mix(in srgb, #fff 35%, var(--primary));
          box-shadow: 0 14px 48px color-mix(in srgb, var(--primary) 50%, transparent);
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .recrutamento-aviso:hover {
          transform: translateY(-3px) scale(1.01);
          box-shadow: 0 22px 64px color-mix(in srgb, var(--primary) 60%, transparent);
        }
        .recrutamento-glow {
          position: absolute; inset: -40%;
          background: conic-gradient(from 0deg,
            transparent 0deg,
            color-mix(in srgb, #fff 50%, transparent) 50deg,
            transparent 120deg,
            color-mix(in srgb, #fff 38%, transparent) 210deg,
            transparent 290deg);
          animation: recrutaspinv 9s linear infinite;
          pointer-events: none; opacity: 0.55;
          mix-blend-mode: overlay;
        }
        @keyframes recrutaspinv { to { transform: rotate(360deg); } }
        .recrutamento-conteudo { position: relative; z-index: 1; text-align: center; }
        .recrutamento-kicker {
          display: inline-block;
          font-family: var(--ff-mono);
          font-size: 12px; font-weight: 800;
          text-transform: uppercase; letter-spacing: 0.08em;
          color: #fff; margin-bottom: 8px;
          padding: 4px 12px; border-radius: 999px;
          background: rgba(0, 0, 0, 0.22);
        }
        .recrutamento-titulo {
          font-size: 26px; margin: 0 0 10px; line-height: 1.18;
          color: #fff; text-shadow: 0 2px 12px rgba(0, 0, 0, 0.22);
        }
        .recrutamento-texto {
          color: rgba(255, 255, 255, 0.93); font-size: 15px; line-height: 1.55;
          max-width: 620px; margin: 0 auto 20px;
        }
        .recrutamento-cta {
          display: inline-block;
          font-weight: 800; font-size: 15px;
          color: var(--primary); padding: 13px 28px; border-radius: 999px;
          background: #fff;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
        }
        @media (max-width: 520px) {
          .recrutamento-aviso { padding: 22px 20px; }
          .recrutamento-titulo { font-size: 20px; }
        }
      `}</style>
    </section>
  );
}
