/**
 * /animacao-campeao — Chaveamento animado da Bola de Cristal.
 * Import direto do handoff do Claude Design (Chaveamento.dc.html), servido
 * como iframe fullscreen. Dados da rodada Cristal ficam hardcoded no HTML
 * em v4/public/design/chaveamento/index.html (por enquanto).
 *
 * Gate: apoiadores/mantenedores/padrinhos apenas (mesmo padrão de /predicoes-campeao).
 */

import Link from "next/link";
import { resolverLocale } from "@/lib/locale-server";
import { analiseLiberado } from "@/lib/analise-auth";
import type { Locale } from "@/lib/i18n";

export const metadata = {
  title: "🏆 Caminho até a Glória · Bolão das IAs",
  description:
    "Animação do bracket da Copa 2026 com o campeão previsto pela Bola de Cristal (consenso das IAs).",
};

const TX: Record<
  Locale,
  {
    titulo: string;
    lede: string;
    gate_titulo: string;
    gate_desc: string;
    gate_login: string;
    gate_colaborar: string;
    gate_naolib_titulo: string;
    gate_naolib_desc: string;
    voltar: string;
  }
> = {
  pt: {
    titulo: "🏆 Caminho até a Glória",
    lede: "Bracket animado do mata-mata da Copa 2026 com o campeão previsto pela Bola de Cristal (consenso das IAs). A animação começa sozinha; use os botões pra pausar ou reiniciar.",
    gate_titulo: "🏆 Espaço dos apoiadores",
    gate_desc:
      "Essa animação é exclusiva pra quem sustenta o Bolão das IAs (apoiador, mantenedor ou padrinho).",
    gate_login: "Entrar com conta liberada",
    gate_colaborar: "Virar apoiador (a partir de R$10)",
    gate_naolib_titulo: "Sua conta ainda não tem acesso",
    gate_naolib_desc:
      "Logada em {email}, mas essa conta não está na lista de apoiadores. Se você colaborou com outro e-mail, faça login com ele. Ou vire apoiador agora:",
    voltar: "← Voltar ao início",
  },
  en: {
    titulo: "🏆 Road to Glory",
    lede: "Animated knockout bracket of the 2026 World Cup with the predicted champion by the Crystal Ball (AI consensus). Animation starts on its own; use the buttons to pause or restart.",
    gate_titulo: "🏆 Supporters-only space",
    gate_desc:
      "This animation is exclusive to those who keep the AI Bolão running (supporter, maintainer, or godparent).",
    gate_login: "Sign in with a granted account",
    gate_colaborar: "Become a supporter (from R$10)",
    gate_naolib_titulo: "Your account doesn't have access yet",
    gate_naolib_desc:
      "Logged in as {email}, but this account isn't on the supporters list. If you contributed with another email, sign in with that. Or become a supporter now:",
    voltar: "← Back to home",
  },
  es: {
    titulo: "🏆 Camino a la Gloria",
    lede: "Bracket animado del mata-mata del Mundial 2026 con el campeón previsto por la Bola de Cristal (consenso de IAs). La animación comienza sola; usa los botones para pausar o reiniciar.",
    gate_titulo: "🏆 Espacio de apoyadores",
    gate_desc:
      "Esta animación es exclusiva para quienes sostienen el Bolão de IAs (apoyador, mantenedor o padrino).",
    gate_login: "Entrar con cuenta habilitada",
    gate_colaborar: "Volverse apoyador (desde R$10)",
    gate_naolib_titulo: "Tu cuenta aún no tiene acceso",
    gate_naolib_desc:
      "Conectado como {email}, pero esa cuenta no está en la lista de apoyadores. Si colaboraste con otro email, inicia sesión con ese. O hazte apoyador ahora:",
    voltar: "← Volver al inicio",
  },
  fr: {
    titulo: "🏆 Chemin vers la Gloire",
    lede: "Grille animée de la phase à élimination de la Coupe 2026 avec le champion prédit par la Boule de Cristal (consensus des IA). L'animation démarre seule ; utilisez les boutons pour mettre en pause ou redémarrer.",
    gate_titulo: "🏆 Espace des soutiens",
    gate_desc:
      "Cette animation est réservée à celles et ceux qui soutiennent le Bolão des IA (supporter, mainteneur ou parrain).",
    gate_login: "Se connecter avec un compte autorisé",
    gate_colaborar: "Devenir supporter (à partir de R$10)",
    gate_naolib_titulo: "Votre compte n'a pas encore accès",
    gate_naolib_desc:
      "Connecté avec {email}, mais ce compte n'est pas dans la liste des soutiens. Si vous avez contribué avec un autre email, connectez-vous avec celui-ci. Ou devenez supporter maintenant :",
    voltar: "← Retour à l'accueil",
  },
};

function GateBox({ locale, emailLogado }: { locale: Locale; emailLogado: string | null }) {
  const tx = TX[locale];
  return (
    <div
      style={{
        maxWidth: 560,
        margin: "60px auto 40px",
        padding: "36px 32px",
        background:
          "linear-gradient(135deg, rgba(255,215,0,0.06), rgba(139,92,246,0.04))",
        border: "1px solid rgba(255,215,0,0.20)",
        borderRadius: 20,
        textAlign: "center",
      }}
    >
      <h2 style={{ fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 900, margin: "0 0 14px", color: "#fff" }}>
        {tx.gate_titulo}
      </h2>
      {emailLogado ? (
        <>
          <p style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.85)", marginBottom: 8 }}>
            {tx.gate_naolib_titulo}
          </p>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.5, marginBottom: 24 }}>
            {tx.gate_naolib_desc.replace("{email}", emailLogado)}
          </p>
          <Link
            href="/colaborar"
            style={{
              display: "block",
              padding: "12px 22px",
              background: "#FFD700",
              color: "#0a0e1a",
              borderRadius: 10,
              fontWeight: 800,
              textDecoration: "none",
              fontSize: 15,
            }}
          >
            {tx.gate_colaborar} →
          </Link>
        </>
      ) : (
        <>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.75)", lineHeight: 1.55, marginBottom: 24 }}>
            {tx.gate_desc}
          </p>
          <Link
            href="/login?redirect=/animacao-campeao"
            style={{
              display: "block",
              padding: "12px 22px",
              background: "rgba(255,255,255,0.1)",
              color: "#fff",
              borderRadius: 10,
              fontWeight: 700,
              textDecoration: "none",
              fontSize: 15,
              marginBottom: 10,
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            {tx.gate_login}
          </Link>
          <Link
            href="/colaborar"
            style={{
              display: "block",
              padding: "12px 22px",
              background: "#FFD700",
              color: "#0a0e1a",
              borderRadius: 10,
              fontWeight: 800,
              textDecoration: "none",
              fontSize: 15,
            }}
          >
            {tx.gate_colaborar} →
          </Link>
        </>
      )}
    </div>
  );
}

export default async function AnimacaoCampeaoPage() {
  const [locale, acesso] = await Promise.all([resolverLocale(), analiseLiberado()]);
  const tx = TX[locale];
  const { liberado, email } = acesso;

  if (!liberado) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(135deg, #0a0e1a 0%, #111827 60%, #0d1520 100%)",
          color: "#fff",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "40px 20px 80px",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h1
            style={{
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 900,
              textAlign: "center",
              marginBottom: 12,
              letterSpacing: -0.5,
            }}
          >
            {tx.titulo}
          </h1>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.55,
              color: "rgba(255,255,255,0.65)",
              textAlign: "center",
              maxWidth: 720,
              margin: "0 auto 12px",
            }}
          >
            {tx.lede}
          </p>
          <GateBox locale={locale} emailLogado={email} />
        </div>
      </main>
    );
  }

  // Liberado — mostra iframe fullscreen com o handoff do Claude Design.
  // Ocupa a viewport toda (viewport-100vh) subtraindo só o HeaderNavBar
  // (~90px) e o rodapé pequeno de "voltar" (~26px).
  return (
    <main
      style={{
        height: "calc(100vh - 90px)",
        background: "#05070c",
        color: "#fff",
        fontFamily: "system-ui, -apple-system, sans-serif",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <iframe
        src="/design/chaveamento/index.html"
        title="Chaveamento animado da Copa 2026"
        style={{
          width: "100%",
          flex: "1 1 auto",
          border: "none",
          display: "block",
        }}
        allow="autoplay"
      />
      <div
        style={{
          background: "#000",
          padding: "6px 20px",
          textAlign: "center",
          flex: "0 0 auto",
        }}
      >
        <Link href="/animacao-campeao" style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, textDecoration: "none" }}>
          ← Voltar às IAs
        </Link>
      </div>
    </main>
  );
}
