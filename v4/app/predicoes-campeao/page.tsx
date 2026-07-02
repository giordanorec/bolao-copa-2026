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
import { carregarJogos } from "@/lib/jogos";
import { carregarMapaPaises } from "@/lib/paises";
import { APELIDOS_SERIE_A } from "@/lib/serie-a";
import { resolverLocale } from "@/lib/locale-server";
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
  },
  en: {
    titulo: "🔮 Champion Prediction",
    lede: "Each Premier League AI walks through the whole bracket in its own chat, stage by stage, without searching. Each stage winner feeds the next. The Crystal Ball is the majority consensus.",
    cristal_lbl: "Crystal Ball · AI consensus",
    ias_lbl: "How each AI sees the Cup",
    empty:
      "We don't have enough predictions yet. The skill runs each AI in its own web chat — some get stuck on rate limits or expired logins.",
    voltar: "← Back to home",
  },
  es: {
    titulo: "🔮 Predicción del Campeón",
    lede: "Cada IA de la Liga A recorre todo el bracket en su propio chat, etapa por etapa, sin buscar. El ganador de cada etapa alimenta la siguiente. La Bola de Cristal es el consenso mayoritario.",
    cristal_lbl: "Bola de Cristal · consenso de IAs",
    ias_lbl: "Cómo cada IA ve la Copa",
    empty:
      "Aún no tenemos suficientes predicciones. La skill corre cada IA en su chat web — algunas se traban por límite de uso o sesión expirada.",
    voltar: "← Volver al inicio",
  },
  fr: {
    titulo: "🔮 Prédiction du Champion",
    lede: "Chaque IA de la Ligue 1 parcourt toute la grille dans son propre chat, phase par phase, sans rechercher. Le vainqueur de chaque phase nourrit la suivante. La Boule de Cristal est le consensus majoritaire.",
    cristal_lbl: "Boule de Cristal · consensus des IA",
    ias_lbl: "Comment chaque IA voit la Coupe",
    empty:
      "Nous n'avons pas encore assez de prédictions. Le skill exécute chaque IA dans son propre chat web — certaines se bloquent (rate limit ou session expirée).",
    voltar: "← Retour à l'accueil",
  },
};

export default async function PredicoesPage() {
  const [pred, mapaPaises, locale, jogos] = await Promise.all([
    carregarPredicoes(),
    carregarMapaPaises(),
    resolverLocale(),
    carregarJogos(),
  ]);

  const tx = TX[locale];

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
