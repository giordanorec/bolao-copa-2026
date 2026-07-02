import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { isContribuinte } from "@/lib/admin";
import type { Locale } from "@/lib/i18n";

/**
 * Banner grande na home: "As IAs já palpitaram quem é o campeão".
 * - Contribuinte (apoiador/mantenedor/padrinho): CTA direto pra /animacao-campeao
 * - Não-contribuinte: CTA de contribuir (R$10+) que dá acesso
 */

const TX: Record<
  Locale,
  {
    kicker: string;
    h1: string[];
    lede: string;
    cta_ver: string;
    cta_ver_hint: string;
    cta_lib: string;
    cta_lib_hint: string;
    curiosidade: string;
  }
> = {
  pt: {
    kicker: "🔮 EXCLUSIVO · BOLA DE CRISTAL",
    h1: ["As IAs já escolheram", "quem vai ganhar a Copa 🏆"],
    lede: "9 das maiores inteligências artificiais do planeta cravaram um campeão. A Bola de Cristal fez o consenso. Você vai deixar as IAs decidirem sozinhas — ou vem descobrir agora?",
    cta_ver: "Ver a animação →",
    cta_ver_hint: "Acesso liberado pra você 🎬",
    cta_lib: "Liberar por R$10 →",
    cta_lib_hint: "Apoiadores (R$10+) veem tudo, sem tier",
    curiosidade:
      "🎯 Cada IA foi consultada fase por fase · O consenso das 9 apontou UM único campeão",
  },
  en: {
    kicker: "🔮 EXCLUSIVE · CRYSTAL BALL",
    h1: ["The AIs have already picked", "who wins the World Cup 🏆"],
    lede: "9 of the world's biggest AIs nailed a champion. The Crystal Ball made the consensus. Are you going to let the AIs decide alone — or come discover now?",
    cta_ver: "Watch the animation →",
    cta_ver_hint: "Access granted for you 🎬",
    cta_lib: "Unlock for R$10 →",
    cta_lib_hint: "Supporters (R$10+) see everything, no tier",
    curiosidade:
      "🎯 Each AI was consulted phase by phase · The 9-AI consensus pointed to ONE champion",
  },
  es: {
    kicker: "🔮 EXCLUSIVO · BOLA DE CRISTAL",
    h1: ["Las IAs ya eligieron", "quién gana la Copa 🏆"],
    lede: "9 de las mayores IAs del planeta eligieron un campeón. La Bola de Cristal hizo el consenso. ¿Vas a dejar que las IAs decidan solas — o vienes a descubrir ahora?",
    cta_ver: "Ver la animación →",
    cta_ver_hint: "Acceso liberado para ti 🎬",
    cta_lib: "Desbloquear por R$10 →",
    cta_lib_hint: "Apoyadores (R$10+) ven todo, sin tier",
    curiosidade:
      "🎯 Cada IA consultada fase por fase · El consenso de las 9 señaló UN solo campeón",
  },
  fr: {
    kicker: "🔮 EXCLUSIF · BOULE DE CRISTAL",
    h1: ["Les IA ont déjà choisi", "qui gagne la Coupe 🏆"],
    lede: "9 des plus grandes IA du monde ont choisi un champion. La Boule de Cristal a fait le consensus. Allez-vous laisser les IA décider seules — ou venir découvrir maintenant ?",
    cta_ver: "Voir l'animation →",
    cta_ver_hint: "Accès accordé pour vous 🎬",
    cta_lib: "Débloquer pour R$10 →",
    cta_lib_hint: "Supporters (R$10+) voient tout, sans tier",
    curiosidade:
      "🎯 Chaque IA consultée phase par phase · Le consensus des 9 pointe UN seul champion",
  },
};

export default async function BannerAnimacaoCampeao({ locale }: { locale: Locale }) {
  // Detecta se o visitante é contribuinte pra alternar o CTA
  let ehContrib = false;
  try {
    const sb = await createClient();
    const { data } = await sb.auth.getUser();
    const email = data.user?.email;
    if (email) ehContrib = await isContribuinte(email);
  } catch {
    // sem sessão / sem env — cai no CTA de virar apoiador
  }

  const tx = TX[locale];

  return (
    <section
      style={{
        padding: "36px 20px 44px",
        margin: "16px 0",
        background:
          "linear-gradient(135deg, #0a0e1a 0%, #241b3a 45%, #1e1030 80%, #0a0e1a 100%)",
        color: "#fff",
        position: "relative",
        overflow: "hidden",
        borderTop: "1px solid rgba(255,215,0,0.20)",
        borderBottom: "1px solid rgba(255,215,0,0.20)",
      }}
    >
      {/* Confete/estrelas de fundo */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage:
            "radial-gradient(2px 2px at 20% 30%, rgba(255,215,0,0.35), transparent 60%), radial-gradient(3px 3px at 70% 60%, rgba(155,120,255,0.28), transparent 60%), radial-gradient(2px 2px at 85% 20%, rgba(255,215,0,0.30), transparent 60%), radial-gradient(2px 2px at 15% 80%, rgba(120,180,255,0.30), transparent 60%)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: 940,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 3,
            color: "#FFD700",
            marginBottom: 14,
            textShadow: "0 0 12px rgba(255,215,0,0.35)",
          }}
        >
          {tx.kicker}
        </div>

        <h2
          style={{
            fontSize: "clamp(28px, 5vw, 46px)",
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: -0.8,
            marginBottom: 16,
            color: "#fff",
          }}
        >
          {tx.h1[0]}
          <br />
          <span
            style={{
              background:
                "linear-gradient(90deg, #FFD700, #F0B400, #FFD700)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {tx.h1[1]}
          </span>
        </h2>

        <p
          style={{
            fontSize: "clamp(14px, 1.5vw, 16px)",
            lineHeight: 1.6,
            color: "rgba(255,255,255,0.75)",
            maxWidth: 640,
            margin: "0 auto 26px",
          }}
        >
          {tx.lede}
        </p>

        {/* Mock-up visual das bandeiras (blurred) — pra dar "vontade de clicar" */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 10,
            marginBottom: 26,
            opacity: 0.85,
          }}
        >
          {["fr", "ar", "es", "br"].map((iso, i) => (
            <div
              key={iso}
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: `url(https://hatscripts.github.io/circle-flags/flags/${iso}.svg) center/cover`,
                filter: "blur(4px) opacity(0.55)",
                boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
                transform: `translateY(${i % 2 === 0 ? "-4px" : "4px"})`,
              }}
              title="?"
            />
          ))}
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,215,0,0.4), rgba(139,92,246,0.2))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              boxShadow: "0 4px 20px rgba(255,215,0,0.35)",
              transform: "translateY(-4px)",
            }}
          >
            🔮
          </div>
        </div>

        {ehContrib ? (
          <>
            <Link
              href="/animacao-campeao"
              style={{
                display: "inline-block",
                padding: "16px 36px",
                background: "linear-gradient(180deg, #FFD700, #F0B400)",
                color: "#0a0e1a",
                borderRadius: 999,
                fontWeight: 900,
                fontSize: 17,
                textDecoration: "none",
                boxShadow: "0 8px 30px rgba(255,215,0,0.35), 0 0 0 1px rgba(255,215,0,0.5)",
                letterSpacing: 0.3,
                transition: "transform 0.15s",
              }}
            >
              {tx.cta_ver}
            </Link>
            <div style={{ marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
              {tx.cta_ver_hint}
            </div>
          </>
        ) : (
          <>
            <Link
              href="/colaborar?redirect=/animacao-campeao"
              style={{
                display: "inline-block",
                padding: "16px 36px",
                background: "linear-gradient(180deg, #FFD700, #F0B400)",
                color: "#0a0e1a",
                borderRadius: 999,
                fontWeight: 900,
                fontSize: 17,
                textDecoration: "none",
                boxShadow: "0 8px 30px rgba(255,215,0,0.35), 0 0 0 1px rgba(255,215,0,0.5)",
                letterSpacing: 0.3,
              }}
            >
              {tx.cta_lib}
            </Link>
            <div style={{ marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
              {tx.cta_lib_hint}
            </div>
          </>
        )}

        <div
          style={{
            marginTop: 22,
            fontSize: 11,
            color: "rgba(255,255,255,0.4)",
            letterSpacing: 0.5,
            fontStyle: "italic",
          }}
        >
          {tx.curiosidade}
        </div>
      </div>
    </section>
  );
}
