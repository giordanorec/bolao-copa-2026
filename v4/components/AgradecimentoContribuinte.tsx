/**
 * AgradecimentoContribuinte — banner de agradecimento na landing para
 * contribuintes logados (conta na allowlist `contribuintes` ou admin).
 *
 * Server component: lê o usuário logado e checa a allowlist server-side
 * (service_role, RLS bypass). Não renderiza nada para visitantes comuns.
 *
 * O nível (apoiador/mantenedor/padrinho) é só PRESTÍGIO — não muda função.
 * Para Mantenedor+ (R$25+) o banner vira um bloco VIP bem chamativo, com
 * reconhecimento forte e um pedido explícito de sugestões de melhoria.
 */

import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { isContribuinte, notaContribuinte, nivelContribuinte } from "@/lib/admin";
import type { NivelContribuinte } from "@/lib/admin";
import type { Locale } from "@/lib/i18n";

const TX: Record<
  Locale,
  { kicker: string; ola: string; texto: string; cta: string }
> = {
  pt: {
    kicker: "Acesso de contribuinte",
    ola: "Obrigado por contribuir",
    texto: "Os Palpites Atualizados das IAs já estão liberados na sua conta.",
    cta: "Ver Palpites Atualizados",
  },
  en: {
    kicker: "Supporter access",
    ola: "Thanks for contributing",
    texto: "The AIs' Updated Picks are unlocked on your account.",
    cta: "See Updated Picks",
  },
  es: {
    kicker: "Acceso de colaborador",
    ola: "Gracias por colaborar",
    texto: "Los Pronósticos Actualizados de las IAs están habilitados en tu cuenta.",
    cta: "Ver Pronósticos Actualizados",
  },
  fr: {
    kicker: "Accès soutien",
    ola: "Merci pour votre soutien",
    texto: "Les Pronostics Mis à Jour des IA sont débloqués sur votre compte.",
    cta: "Voir les Pronostics Mis à Jour",
  },
};

// Nome + emblema de cada nível (prestígio).
const TIERS: Record<
  NivelContribuinte,
  { badge: string; nome: Record<Locale, string> }
> = {
  cortesia: {
    badge: "🎁",
    nome: { pt: "Convidado", en: "Guest", es: "Invitado", fr: "Invité" },
  },
  apoiador: {
    badge: "💛",
    nome: { pt: "Apoiador", en: "Supporter", es: "Apoyador", fr: "Soutien" },
  },
  mantenedor: {
    badge: "🛟",
    nome: { pt: "Mantenedor", en: "Maintainer", es: "Mantenedor", fr: "Mainteneur" },
  },
  padrinho: {
    badge: "👑",
    nome: { pt: "Padrinho", en: "Patron", es: "Padrino", fr: "Mécène" },
  },
};

// Textos do bloco VIP (Mantenedor+). Reconhecimento forte + pedido de sugestão.
const VIP_TX: Record<
  Locale,
  {
    titulo: (nome: string) => string;
    texto: string;
    askTitulo: string;
    askTexto: string;
    askCta: string;
    palpitesCta: string;
  }
> = {
  pt: {
    titulo: (nome) => `Você é especial${nome ? `, ${nome}` : ""}! 🎉`,
    texto:
      "Mantenedores como você bancam as APIs das IAs e dão fôlego pra testar coisas novas por aqui. De coração: muito obrigado. 🙏",
    askTitulo: "Tem alguma ideia pro site?",
    askTexto:
      "Você ajuda a testar o que vem por aí — então sua sugestão tem prioridade. O que você gostaria de ver, o que falta, o que dá pra melhorar?",
    askCta: "Mandar uma sugestão",
    palpitesCta: "Ver Palpites Atualizados",
  },
  en: {
    titulo: (nome) => `You're special${nome ? `, ${nome}` : ""}! 🎉`,
    texto:
      "Maintainers like you fund the AIs' APIs and give us room to test new things here. From the heart: thank you so much. 🙏",
    askTitulo: "Got an idea for the site?",
    askTexto:
      "You help test what's coming — so your suggestion gets priority. What would you like to see, what's missing, what could be better?",
    askCta: "Send a suggestion",
    palpitesCta: "See Updated Picks",
  },
  es: {
    titulo: (nome) => `¡Eres especial${nome ? `, ${nome}` : ""}! 🎉`,
    texto:
      "Los mantenedores como tú financian las APIs de las IAs y nos dan margen para probar cosas nuevas. De corazón: muchas gracias. 🙏",
    askTitulo: "¿Tienes alguna idea para el sitio?",
    askTexto:
      "Tú ayudas a probar lo que viene — así que tu sugerencia tiene prioridad. ¿Qué te gustaría ver, qué falta, qué se puede mejorar?",
    askCta: "Enviar una sugerencia",
    palpitesCta: "Ver Pronósticos Actualizados",
  },
  fr: {
    titulo: (nome) => `Vous êtes spécial${nome ? `, ${nome}` : ""} ! 🎉`,
    texto:
      "Les mécènes comme vous financent les API des IA et nous donnent de quoi tester de nouvelles choses. Du fond du cœur : merci beaucoup. 🙏",
    askTitulo: "Une idée pour le site ?",
    askTexto:
      "Vous aidez à tester ce qui arrive — votre suggestion est donc prioritaire. Que voudriez-vous voir, qu'est-ce qui manque, qu'est-ce qu'on peut améliorer ?",
    askCta: "Envoyer une suggestion",
    palpitesCta: "Voir les Pronostics Mis à Jour",
  },
};

export default async function AgradecimentoContribuinte({
  locale,
}: {
  locale: Locale;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  if (!(await isContribuinte(user.email))) return null;

  const [{ data: perfil }, nota, nivelInfo] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    notaContribuinte(user.email),
    nivelContribuinte(user.email),
  ]);

  const nome = (perfil?.display_name as string | undefined)?.trim() ?? "";
  const tx = TX[locale] ?? TX.pt;
  const nivel = nivelInfo?.nivel ?? "cortesia";
  const tier = TIERS[nivel];
  const isVip = nivel === "mantenedor" || nivel === "padrinho";

  // ── Bloco VIP chamativo: Mantenedor+ (R$25+) ──
  if (isVip) {
    const v = VIP_TX[locale] ?? VIP_TX.pt;
    return (
      <section className="section" style={{ paddingTop: 16, paddingBottom: 0 }}>
        <div className="container">
          <div className="vip-callout">
            <div className="vip-callout-inner">
              <div className="vip-crown" aria-hidden="true">
                <span className="vip-crown-spark vip-crown-spark-1">✨</span>
                <span className="vip-crown-spark vip-crown-spark-2">✨</span>
                {tier.badge}
              </div>
              <span className="vip-tier-pill">
                {tier.badge} {tier.nome[locale]}
              </span>
              <strong className="vip-titulo">{v.titulo(nome)}</strong>
              <p className="vip-texto">{nota ?? v.texto}</p>

              <div className="vip-ask">
                <strong className="vip-ask-titulo">💡 {v.askTitulo}</strong>
                <p className="vip-ask-texto">{v.askTexto}</p>
                <div className="vip-ask-ctas">
                  <Link href="/#caixa-sugestao" className="vip-ask-btn">
                    {v.askCta} →
                  </Link>
                  <Link href="/analise-v2" className="vip-ask-link">
                    {v.palpitesCta} →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          .vip-callout {
            position: relative;
            border-radius: 24px;
            padding: 2px;
            background: linear-gradient(125deg,
              #FFD700, #FF8A00, #FF385C, #8134AF, #007AFF, #00B040, #FFD700);
            background-size: 300% 300%;
            animation: vipBorder 8s ease infinite;
            box-shadow:
              0 10px 40px color-mix(in srgb, #FF8A00 28%, transparent),
              0 4px 16px color-mix(in srgb, #8134AF 24%, transparent);
            overflow: hidden;
          }
          @keyframes vipBorder {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .vip-callout-inner {
            position: relative;
            background:
              radial-gradient(120% 120% at 100% 0%, rgba(255, 215, 0, 0.10), transparent 55%),
              radial-gradient(120% 120% at 0% 100%, rgba(129, 52, 175, 0.12), transparent 55%),
              var(--bg-1);
            border-radius: 22px;
            padding: 30px 28px;
            text-align: center;
            overflow: hidden;
          }
          .vip-crown {
            position: relative;
            display: inline-block;
            font-size: 54px;
            line-height: 1;
            margin-bottom: 12px;
            filter: drop-shadow(0 6px 16px color-mix(in srgb, #FF8A00 45%, transparent));
            animation: vipFloat 3.5s ease-in-out infinite;
          }
          @keyframes vipFloat {
            0%, 100% { transform: translateY(0) rotate(-4deg); }
            50% { transform: translateY(-7px) rotate(4deg); }
          }
          .vip-crown-spark {
            position: absolute;
            font-size: 20px;
            animation: vipSpark 2.2s ease-in-out infinite;
          }
          .vip-crown-spark-1 { top: -6px; right: -16px; animation-delay: 0s; }
          .vip-crown-spark-2 { bottom: -4px; left: -16px; font-size: 15px; animation-delay: 1.1s; }
          @keyframes vipSpark {
            0%, 100% { opacity: 0.3; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.2); }
          }
          .vip-tier-pill {
            display: inline-block;
            font-family: var(--ff-mono);
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            padding: 5px 14px;
            border-radius: 999px;
            color: #fff;
            background: linear-gradient(135deg, #FF8A00, #FF385C);
            box-shadow: 0 4px 14px color-mix(in srgb, #FF385C 38%, transparent);
            margin-bottom: 12px;
          }
          .vip-titulo {
            display: block;
            font-family: var(--ff-display);
            font-size: clamp(24px, 4.5vw, 36px);
            font-weight: 900;
            line-height: 1.1;
            margin: 0 0 10px;
            background: linear-gradient(120deg, #FFD700, #FF8A00, #FF385C);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .vip-texto {
            max-width: 560px;
            margin: 0 auto 22px;
            color: var(--fg-mid);
            font-size: 15px;
            line-height: 1.55;
          }
          .vip-ask {
            text-align: left;
            max-width: 580px;
            margin: 0 auto;
            background: color-mix(in srgb, var(--primary) 7%, var(--bg-2));
            border: 1.5px solid color-mix(in srgb, var(--primary) 30%, transparent);
            border-radius: 18px;
            padding: 20px 22px;
          }
          .vip-ask-titulo {
            display: block;
            font-family: var(--ff-display);
            font-size: 18px;
            font-weight: 900;
            color: var(--fg);
            margin-bottom: 6px;
          }
          .vip-ask-texto {
            margin: 0 0 16px;
            color: var(--fg-mid);
            font-size: 14px;
            line-height: 1.5;
          }
          .vip-ask-ctas {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            align-items: center;
          }
          .vip-ask-btn {
            display: inline-block;
            padding: 11px 22px;
            border-radius: 999px;
            font-family: var(--ff-display);
            font-weight: 800;
            font-size: 14px;
            color: #fff;
            text-decoration: none;
            background: linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 60%, var(--accent)));
            box-shadow: 0 4px 16px color-mix(in srgb, var(--primary) 38%, transparent);
            transition: transform 0.15s ease, box-shadow 0.15s ease;
          }
          .vip-ask-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px color-mix(in srgb, var(--primary) 52%, transparent);
          }
          .vip-ask-link {
            font-family: var(--ff-display);
            font-weight: 700;
            font-size: 14px;
            color: var(--primary);
            text-decoration: none;
          }
          .vip-ask-link:hover { text-decoration: underline; }
        `}</style>
      </section>
    );
  }

  // ── Banner padrão: Apoiador / Convidado ──
  return (
    <section className="section" style={{ paddingTop: 16, paddingBottom: 0 }}>
      <div className="container">
        <Link href="/analise-v2" className="pa-callout">
          <div className="pa-callout-glow" aria-hidden="true" />
          <div className="pa-callout-icon" aria-hidden="true">
            <span className="pa-callout-spark">✨</span>
            {tier.badge}
          </div>
          <div className="pa-callout-body">
            <span className="pa-callout-kicker">
              {tier.badge} {tier.nome[locale]} · {tx.kicker}
            </span>
            <strong className="pa-callout-titulo">
              {tx.ola}
              {nome ? `, ${nome}` : ""}!
            </strong>
            <span className="pa-callout-texto">{nota ?? tx.texto}</span>
          </div>
          <span className="pa-callout-cta">{tx.cta} →</span>
        </Link>
      </div>
    </section>
  );
}
