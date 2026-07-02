/**
 * /predicoes-campeao — Cada IA da Série A prevê a jornada COMPLETA
 * do campeão da Copa 2026 (R32 → Oitavas → Quartas → Semi → Final).
 *
 * Fonte: v4/public/predicoes_campeao.json (gerado por scripts/simular_campeao_web.js
 * e sincronizado por scripts/v4_sync.py). Cada IA responde stage-by-stage no
 * seu próprio chat web; o vencedor de cada fase alimenta a próxima.
 *
 * A Bola de Cristal é o consenso majoritário das IAs válidas por confronto.
 */

import { promises as fs } from "fs";
import path from "path";
import Link from "next/link";
import { carregarJogos } from "@/lib/jogos";
import { carregarMapaPaises } from "@/lib/paises";
import { APELIDOS_SERIE_A } from "@/lib/serie-a";
import { resolverLocale } from "@/lib/locale-server";
import { analiseLiberado } from "@/lib/analise-auth";
import type { Locale } from "@/lib/i18n";
import PredicoesClient, {
  type IAPredicao,
  type CristalPredicao,
  type R32Confronto,
} from "./PredicoesClient";

export const metadata = {
  title: "🔮 Previsão de Campeão · Bolão das IAs",
  description:
    "Cada IA da Série A prevê a jornada completa do campeão da Copa 2026, fase a fase, no seu próprio chat web.",
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
    rodada_em?: string;
  } | null;
  ias: Record<
    string,
    {
      slug: string;
      campeao: string;
      jornada: JornadaJSON;
      rodada_em?: string;
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
    cristal_lbl: string;
    ias_lbl: string;
    empty: string;
    voltar: string;
    gate_titulo: string;
    gate_desc: string;
    gate_login: string;
    gate_colaborar: string;
    gate_naolib_titulo: string;
    gate_naolib_desc: string;
  }
> = {
  pt: {
    titulo: "🔮 Previsão de Campeão",
    lede: "Cada IA da Série A percorre a chave inteira no próprio chat, fase a fase, sem pesquisar. O vencedor de cada fase alimenta a próxima. A Bola de Cristal é o consenso majoritário.",
    cristal_lbl: "Bola de Cristal · consenso das IAs",
    ias_lbl: "Como cada IA vê a Copa",
    empty:
      "Ainda não coletamos previsões suficientes. A skill roda cada IA no próprio chat web — algumas travam por rate limit ou login expirado.",
    voltar: "← Voltar ao início",
    gate_titulo: "🔮 Espaço dos apoiadores",
    gate_desc:
      "Essa página é exclusiva pra quem sustenta o Bolão das IAs (apoiador, mantenedor ou padrinho). Você vê a jornada de campeão prevista por cada IA + a Bola de Cristal (consenso).",
    gate_login: "Entrar com conta liberada",
    gate_colaborar: "Virar apoiador (a partir de R$10)",
    gate_naolib_titulo: "Sua conta ainda não tem acesso",
    gate_naolib_desc:
      "Logada em {email}, mas essa conta não está na lista de apoiadores. Se você colaborou com outro e-mail, faça login com ele. Ou vire apoiador agora:",
  },
  en: {
    titulo: "🔮 Champion Prediction",
    lede: "Each Premier League AI walks through the whole bracket in its own chat, stage by stage, without searching. Each stage winner feeds the next. The Crystal Ball is the majority consensus.",
    cristal_lbl: "Crystal Ball · AI consensus",
    ias_lbl: "How each AI sees the Cup",
    empty:
      "We don't have enough predictions yet. The skill runs each AI in its own web chat — some get stuck on rate limits or expired logins.",
    voltar: "← Back to home",
    gate_titulo: "🔮 Supporters-only space",
    gate_desc:
      "This page is exclusive to those who keep the AI Bolão running (supporter, maintainer, or godparent). You'll see each AI's predicted champion journey + the Crystal Ball (consensus).",
    gate_login: "Sign in with a granted account",
    gate_colaborar: "Become a supporter (from R$10)",
    gate_naolib_titulo: "Your account doesn't have access yet",
    gate_naolib_desc:
      "Logged in as {email}, but this account isn't on the supporters list. If you contributed with another email, sign in with that. Or become a supporter now:",
  },
  es: {
    titulo: "🔮 Predicción del Campeón",
    lede: "Cada IA de la Liga A recorre todo el bracket en su propio chat, etapa por etapa, sin buscar. El ganador de cada etapa alimenta la siguiente. La Bola de Cristal es el consenso mayoritario.",
    cristal_lbl: "Bola de Cristal · consenso de IAs",
    ias_lbl: "Cómo cada IA ve la Copa",
    empty:
      "Aún no tenemos suficientes predicciones. La skill corre cada IA en su chat web — algunas se traban por límite de uso o sesión expirada.",
    voltar: "← Volver al inicio",
    gate_titulo: "🔮 Espacio de apoyadores",
    gate_desc:
      "Esta página es exclusiva para quienes sostienen el Bolão de IAs (apoyador, mantenedor o padrino). Verás el recorrido de campeón previsto por cada IA + la Bola de Cristal (consenso).",
    gate_login: "Entrar con cuenta habilitada",
    gate_colaborar: "Volverse apoyador (desde R$10)",
    gate_naolib_titulo: "Tu cuenta aún no tiene acceso",
    gate_naolib_desc:
      "Conectado como {email}, pero esa cuenta no está en la lista de apoyadores. Si colaboraste con otro email, inicia sesión con ese. O hazte apoyador ahora:",
  },
  fr: {
    titulo: "🔮 Prédiction du Champion",
    lede: "Chaque IA de la Ligue 1 parcourt toute la grille dans son propre chat, phase par phase, sans rechercher. Le vainqueur de chaque phase nourrit la suivante. La Boule de Cristal est le consensus majoritaire.",
    cristal_lbl: "Boule de Cristal · consensus des IA",
    ias_lbl: "Comment chaque IA voit la Coupe",
    empty:
      "Nous n'avons pas encore assez de prédictions. Le skill exécute chaque IA dans son propre chat web — certaines se bloquent (rate limit ou session expirée).",
    voltar: "← Retour à l'accueil",
    gate_titulo: "🔮 Espace des soutiens",
    gate_desc:
      "Cette page est réservée à celles et ceux qui soutiennent le Bolão des IA (supporter, mainteneur ou parrain). Vous verrez le parcours du champion prévu par chaque IA + la Boule de Cristal (consensus).",
    gate_login: "Se connecter avec un compte autorisé",
    gate_colaborar: "Devenir supporter (à partir de R$10)",
    gate_naolib_titulo: "Votre compte n'a pas encore accès",
    gate_naolib_desc:
      "Connecté avec {email}, mais ce compte n'est pas dans la liste des soutiens. Si vous avez contribué avec un autre email, connectez-vous avec celui-ci. Ou devenez supporter maintenant :",
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
      <h2
        style={{
          fontSize: "clamp(22px, 3vw, 30px)",
          fontWeight: 900,
          margin: "0 0 14px",
          color: "#fff",
        }}
      >
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
            href="/login?redirect=/predicoes-campeao"
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

export default async function PredicoesPage() {
  const [pred, mapaPaises, locale, jogos, acesso] = await Promise.all([
    carregarPredicoes(),
    carregarMapaPaises(),
    resolverLocale(),
    carregarJogos(),
    analiseLiberado(),
  ]);

  const tx = TX[locale];
  const { liberado, email, contribuinte } = acesso;
  void contribuinte; // hint pra futuros CTAs (ex.: mostrar tier)

  // Gate: se não liberado, mostra CTA de virar apoiador OU login
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

  // Confrontos R32 (jogo N → { timeA, timeB }) — pra saber o oponente do
  // campeão no R32 (o jornada só guarda o vencedor).
  const r32Confrontos: R32Confronto[] = jogos
    .filter((j) => j.numero >= 73 && j.numero <= 88)
    .map((j) => ({
      jogo: j.numero,
      timeA: j.time_a,
      timeB: j.time_b,
    }));

  const ias: IAPredicao[] = pred
    ? Object.values(pred.ias).map((ia) => ({
        slug: ia.slug,
        nome: APELIDOS_SERIE_A[ia.slug]?.nome ?? ia.slug,
        campeao: ia.campeao,
        jornada: ia.jornada,
      }))
    : [];

  const cristal: CristalPredicao | null =
    pred?.cristal != null
      ? {
          campeao: pred.cristal.campeao,
          jornada: pred.cristal.jornada,
          votos_totais: pred.cristal.votos_totais,
        }
      : null;

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
            margin: "0 auto 36px",
          }}
        >
          {tx.lede}
        </p>

        {(!pred || (ias.length === 0 && !cristal)) && (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              background: "rgba(255,255,255,0.03)",
              border: "1px dashed rgba(255,255,255,0.15)",
              borderRadius: 12,
              color: "rgba(255,255,255,0.6)",
            }}
          >
            {tx.empty}
          </div>
        )}

        {pred && (
          <PredicoesClient
            cristal={cristal}
            ias={ias}
            mapaPaises={mapaPaises}
            r32Confrontos={r32Confrontos}
            labels={{
              cristal: tx.cristal_lbl,
              ias: tx.ias_lbl,
            }}
          />
        )}

        <div style={{ marginTop: 48, textAlign: "center" }}>
          <a
            href="/"
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            {tx.voltar}
          </a>
        </div>
      </div>
    </main>
  );
}
