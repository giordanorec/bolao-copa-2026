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
    kicker: "🎉 Graças às contribuições",
    titulo: "Rodamos mais uma atualização de palpites",
    texto:
      "Com o apoio da galera, repassamos os 8 jogos finais dos Grupos I, J, K e L pelas IAs — agora com os resultados da 2ª rodada na mesa. Elas já sabem quem precisa vencer pra se classificar.",
    cta: "Ver os palpites atualizados →",
    obrigado: "Muito obrigado a quem contribuiu. Pra vocês, o acesso é liberado sem pagar de novo. 💜",
  },
  en: {
    kicker: "🎉 Thanks to your support",
    titulo: "We ran another prediction update",
    texto:
      "With the community's help, we re-ran the 8 final matches of Groups I, J, K and L through the AIs — now with the 2nd-round results in. They know who must win to qualify.",
    cta: "See the updated picks →",
    obrigado: "Huge thanks to everyone who contributed. For you, access is unlocked at no extra cost. 💜",
  },
  es: {
    kicker: "🎉 Gracias a las contribuciones",
    titulo: "Corrimos otra actualización de pronósticos",
    texto:
      "Con el apoyo de la gente, repasamos los 8 partidos finales de los Grupos I, J, K y L con las IAs — ahora con los resultados de la 2ª ronda. Ya saben quién debe ganar para clasificar.",
    cta: "Ver los pronósticos actualizados →",
    obrigado: "Muchas gracias a quienes contribuyeron. Para ustedes, el acceso está liberado sin pagar de nuevo. 💜",
  },
  fr: {
    kicker: "🎉 Grâce à vos contributions",
    titulo: "Nous avons lancé une nouvelle mise à jour",
    texto:
      "Avec l'aide de la communauté, nous avons repassé les 8 derniers matchs des Groupes I, J, K et L via les IA — avec les résultats du 2e tour. Elles savent qui doit gagner pour se qualifier.",
    cta: "Voir les pronostics mis à jour →",
    obrigado: "Un grand merci à tous ceux qui ont contribué. Pour vous, l'accès est débloqué sans payer à nouveau. 💜",
  },
};

export default function AvisoAtualizacaoV3({ locale }: { locale: Locale }) {
  const tx = TX[locale] ?? TX.pt;
  return (
    <section className="section" style={{ paddingTop: 8, paddingBottom: 0 }}>
      <div className="container">
        <Link href="/analise-v2" className="v3-aviso">
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
