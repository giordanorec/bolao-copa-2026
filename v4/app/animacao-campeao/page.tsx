/**
 * /animacao-campeao — Landing com reveal-por-cliques.
 * Cada IA tem um card. Usuário clica pra revelar o palpite. Ao revelar
 * todas as 8, a Bola de Cristal desbloqueia e ele pode iniciar a animação
 * do bracket (em /animacao-campeao/bracket).
 *
 * Gate: apoiadores/mantenedores/padrinhos apenas (sem tier intermediário).
 */

import { promises as fs } from "fs";
import path from "path";
import Link from "next/link";
import { carregarMapaPaises } from "@/lib/paises";
import { APELIDOS_SERIE_A } from "@/lib/serie-a";
import { resolverLocale } from "@/lib/locale-server";
import { analiseLiberado } from "@/lib/analise-auth";
import type { Locale } from "@/lib/i18n";
import LandingClient, { type IALanding, type CristalLanding } from "./LandingClient";

export const metadata = {
  title: "🎬 Caminho até a Glória · Bolão das IAs",
  description:
    "9 IAs foram consultadas. Cada uma escolheu um campeão. Descubra e libere o consenso da Bola de Cristal.",
};

type Fase = "R32" | "Oitavas" | "Quartas" | "Semifinal" | "Final";
type JornadaJSON = Record<Fase, Record<string, string>>;

type PredicoesData = {
  rodada: string;
  cristal: {
    slug: "_bola-de-cristal";
    campeao: string;
    jornada: JornadaJSON;
    votos_totais: number;
  } | null;
  ias: Record<
    string,
    {
      slug: string;
      campeao: string;
      jornada: JornadaJSON;
    }
  >;
};

async function carregarPredicoes(): Promise<PredicoesData | null> {
  try {
    const fp = path.join(process.cwd(), "public", "predicoes_campeao.json");
    const raw = await fs.readFile(fp, "utf-8");
    return JSON.parse(raw) as PredicoesData;
  } catch {
    return null;
  }
}

const TX: Record<
  Locale,
  {
    titulo: string;
    lede: string;
    ias_lbl: string;
    cristal_lbl: string;
    cristal_locked: string;
    cristal_unlocked_cta: string;
    reveal_all_first: string;
    progresso: string;
    gate_titulo: string;
    gate_desc: string;
    gate_login: string;
    gate_colaborar: string;
    gate_naolib_titulo: string;
    gate_naolib_desc: string;
    voltar: string;
    stats_titulo: string;
  }
> = {
  pt: {
    titulo: "🎬 Caminho até a Glória",
    lede: "9 IAs de ponta consultaram os dados da Copa 2026. Cada uma escolheu quem vai ganhar. Revele os palpites um a um e desbloqueie a Bola de Cristal — o consenso de todas.",
    ias_lbl: "As 9 IAs consultadas",
    cristal_lbl: "🔮 Bola de Cristal — o consenso",
    cristal_locked: "Revele os palpites das IAs para liberar o consenso da Bola de Cristal.",
    cristal_unlocked_cta: "🏆 Iniciar a animação do bracket →",
    reveal_all_first: "Falta pouco! Clique nas IAs restantes.",
    progresso: "IAs reveladas",
    gate_titulo: "🎬 Espaço dos apoiadores",
    gate_desc:
      "Essa página é exclusiva pra quem sustenta o Bolão das IAs (apoiador, mantenedor ou padrinho).",
    gate_login: "Entrar com conta liberada",
    gate_colaborar: "Virar apoiador (a partir de R$10)",
    gate_naolib_titulo: "Sua conta ainda não tem acesso",
    gate_naolib_desc:
      "Logada em {email}, mas essa conta não está na lista de apoiadores. Se você colaborou com outro e-mail, faça login com ele. Ou vire apoiador agora:",
    voltar: "← Voltar ao início",
    stats_titulo: "📊 Curiosidades do consenso",
  },
  en: {
    titulo: "🎬 Road to Glory",
    lede: "9 top AIs analyzed the 2026 World Cup data. Each picked a champion. Reveal their picks one by one to unlock the Crystal Ball — the consensus.",
    ias_lbl: "The 9 consulted AIs",
    cristal_lbl: "🔮 Crystal Ball — the consensus",
    cristal_locked: "Reveal the AI picks to unlock the Crystal Ball consensus.",
    cristal_unlocked_cta: "🏆 Start the bracket animation →",
    reveal_all_first: "Almost there! Click the remaining AIs.",
    progresso: "AIs revealed",
    gate_titulo: "🎬 Supporters-only space",
    gate_desc: "This page is exclusive to those who keep the AI Bolão running.",
    gate_login: "Sign in with a granted account",
    gate_colaborar: "Become a supporter (from R$10)",
    gate_naolib_titulo: "Your account doesn't have access yet",
    gate_naolib_desc:
      "Logged in as {email}, but this account isn't on the supporters list. If you contributed with another email, sign in with that. Or become a supporter now:",
    voltar: "← Back to home",
    stats_titulo: "📊 Consensus insights",
  },
  es: {
    titulo: "🎬 Camino a la Gloria",
    lede: "9 IAs de punta analizaron los datos del Mundial 2026. Cada una eligió un campeón. Revela sus predicciones para desbloquear la Bola de Cristal — el consenso.",
    ias_lbl: "Las 9 IAs consultadas",
    cristal_lbl: "🔮 Bola de Cristal — el consenso",
    cristal_locked: "Revela las predicciones para desbloquear el consenso.",
    cristal_unlocked_cta: "🏆 Iniciar la animación del bracket →",
    reveal_all_first: "¡Ya casi! Clica en las IAs restantes.",
    progresso: "IAs reveladas",
    gate_titulo: "🎬 Espacio de apoyadores",
    gate_desc: "Esta página es exclusiva para quienes sostienen el Bolão.",
    gate_login: "Entrar con cuenta habilitada",
    gate_colaborar: "Volverse apoyador (desde R$10)",
    gate_naolib_titulo: "Tu cuenta aún no tiene acceso",
    gate_naolib_desc:
      "Conectado como {email}, pero esa cuenta no está en la lista. Si colaboraste con otro email, inicia sesión con ese. O hazte apoyador ahora:",
    voltar: "← Volver al inicio",
    stats_titulo: "📊 Datos del consenso",
  },
  fr: {
    titulo: "🎬 Chemin vers la Gloire",
    lede: "9 IA de pointe ont analysé les données de la Coupe 2026. Chacune a choisi un champion. Révélez leurs prédictions pour débloquer la Boule de Cristal — le consensus.",
    ias_lbl: "Les 9 IA consultées",
    cristal_lbl: "🔮 Boule de Cristal — le consensus",
    cristal_locked: "Révélez les prédictions pour débloquer le consensus.",
    cristal_unlocked_cta: "🏆 Démarrer l'animation du bracket →",
    reveal_all_first: "Presque là ! Cliquez sur les IA restantes.",
    progresso: "IA révélées",
    gate_titulo: "🎬 Espace des soutiens",
    gate_desc: "Cette page est réservée aux soutiens du Bolão.",
    gate_login: "Se connecter avec un compte autorisé",
    gate_colaborar: "Devenir supporter (à partir de R$10)",
    gate_naolib_titulo: "Votre compte n'a pas encore accès",
    gate_naolib_desc:
      "Connecté avec {email}, mais ce compte n'est pas dans la liste. Si vous avez contribué avec un autre email, connectez-vous avec celui-ci. Ou devenez supporter maintenant :",
    voltar: "← Retour à l'accueil",
    stats_titulo: "📊 Faits du consensus",
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

export default async function AnimacaoLandingPage() {
  const [pred, mapaPaises, locale, acesso] = await Promise.all([
    carregarPredicoes(),
    carregarMapaPaises(),
    resolverLocale(),
    analiseLiberado(),
  ]);
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
          <h1 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 900, textAlign: "center", marginBottom: 12, letterSpacing: -0.5 }}>
            {tx.titulo}
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.55, color: "rgba(255,255,255,0.65)", textAlign: "center", maxWidth: 720, margin: "0 auto 12px" }}>
            {tx.lede}
          </p>
          <GateBox locale={locale} emailLogado={email} />
        </div>
      </main>
    );
  }

  // Extrai dados p/ passar ao client
  const ias: IALanding[] = pred
    ? Object.values(pred.ias).map((ia) => ({
        slug: ia.slug,
        nome: APELIDOS_SERIE_A[ia.slug]?.nome ?? ia.slug,
        campeao: ia.campeao,
      }))
    : [];

  const cristal: CristalLanding | null =
    pred?.cristal != null
      ? {
          campeao: pred.cristal.campeao,
          votos_totais: pred.cristal.votos_totais,
        }
      : null;

  // Estatísticas: quantos votos por campeão
  const votos: Record<string, number> = {};
  for (const ia of ias) {
    votos[ia.campeao] = (votos[ia.campeao] || 0) + 1;
  }
  const distribuicao = Object.entries(votos)
    .map(([campeao, n]) => ({ campeao, n }))
    .sort((a, b) => b.n - a.n);

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
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <h1
          style={{
            fontSize: "clamp(30px, 5vw, 48px)",
            fontWeight: 900,
            textAlign: "center",
            marginBottom: 14,
            letterSpacing: -0.5,
            lineHeight: 1.1,
          }}
        >
          {tx.titulo}
        </h1>
        <p
          style={{
            fontSize: 16,
            lineHeight: 1.6,
            color: "rgba(255,255,255,0.7)",
            textAlign: "center",
            maxWidth: 760,
            margin: "0 auto 40px",
          }}
        >
          {tx.lede}
        </p>

        <LandingClient
          ias={ias}
          cristal={cristal}
          mapaPaises={mapaPaises}
          distribuicao={distribuicao}
          labels={{
            iasLabel: tx.ias_lbl,
            cristalLabel: tx.cristal_lbl,
            cristalLocked: tx.cristal_locked,
            cristalUnlockedCta: tx.cristal_unlocked_cta,
            revealAllFirst: tx.reveal_all_first,
            progresso: tx.progresso,
            statsTitulo: tx.stats_titulo,
          }}
        />

        <div style={{ marginTop: 48, textAlign: "center" }}>
          <Link
            href="/"
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            {tx.voltar}
          </Link>
        </div>
      </div>
    </main>
  );
}
