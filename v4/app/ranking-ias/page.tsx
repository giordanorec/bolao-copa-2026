import { createClient } from "@/lib/supabase-server";
import { createAdminClient, isContribuinte } from "@/lib/admin";
import ColaboracaoBanner from "@/components/ColaboracaoBanner";
import SerieA from "@/components/SerieA";
import { resolverLocale } from "@/lib/locale-server";
import { carregarLinhasRankingGeral } from "@/lib/ranking-geral-data";
import RankingGeralClient, { type RankingGeralLabels } from "../ranking-geral/RankingGeralClient";

function buildLabels(locale: string): RankingGeralLabels {
  const en = locale === "en";
  const es = locale === "es";
  const fr = locale === "fr";

  return {
    faseGrupos: en ? "Groups" : es ? "Grupos" : fr ? "Groupes" : "Grupos",
    faseMatamata: en ? "Knockout" : es ? "Eliminatoria" : fr ? "Éliminatoires" : "Mata-mata",
    faseGeral: en ? "Overall" : es ? "General" : fr ? "Général" : "Geral",

    nivelSerieA: en ? "PREMIER LEAGUE" : es ? "LIGA A" : fr ? "LIGUE A" : "SÓ SÉRIE A",
    nivelMaisIAs: en ? "SERIES A + ALL AIs" : es ? "LIGA A + TODAS IAs" : fr ? "LIGUE A + TOUTES IA" : "SÉRIE A + DEMAIS IAs",
    nivelTodas: en ? "AIs + HUMANS" : es ? "IAs + HUMANOS" : fr ? "IA + HUMAINS" : "TODAS + HUMANOS",

    toggleV2: en ? "🔄 SHOW V2 VARIANTS" : es ? "🔄 MOSTRAR VARIANTES V2" : fr ? "🔄 VARIANTES V2" : "🔄 MOSTRAR VARIAÇÕES V2",

    competidoresTpl:
      en ? "{n} competitors in this view"
        : es ? "{n} competidores en esta vista"
          : fr ? "{n} concurrents dans cette vue"
            : "{n} competidores nessa visão",

    mostrandoSerieA:
      en ? "Premier League (top 10) + Crystal Ball"
        : es ? "Liga A (top 10) + Bola de Cristal"
          : fr ? "Ligue A (top 10) + Boule de Cristal"
            : "Série A (top 10) + Bola de Cristal",

    mostrandoIAsTpl:
      en ? "{n} AIs + Crystal Ball"
        : es ? "{n} IAs + Bola de Cristal"
          : fr ? "{n} IA + Boule de Cristal"
            : "{n} IAs + Bola de Cristal",

    mostrandoTodasTpl:
      en ? "{nIAs} AIs + Crystal Ball + {nHumanos} humans opt-in"
        : es ? "{nIAs} IAs + Bola de Cristal + {nHumanos} humanos opt-in"
          : fr ? "{nIAs} IA + Boule de Cristal + {nHumanos} humains opt-in"
            : "{nIAs} IAs + Bola de Cristal + {nHumanos} humanos opt-in",

    matamataVazio:
      en ? "Knockout hasn't started yet"
        : es ? "La eliminatoria aún no ha comenzado"
          : fr ? "La phase éliminatoire n'a pas encore commencé"
            : "O mata-mata ainda não começou",

    matamataVazioDesc:
      en
        ? "All AI predictions for the knockout matches are already saved — points will appear here automatically once the matches begin."
        : es
          ? "Los pronósticos de todas las IAs para los partidos de eliminatoria ya están registrados — los puntos aparecerán aquí automáticamente cuando comiencen los partidos."
          : fr
            ? "Les pronostics de toutes les IA pour les matches éliminatoires sont déjà enregistrés — les points apparaîtront ici automatiquement dès le début des matches."
            : "Os palpites de todas as IAs para os confrontos do mata-mata já estão registrados — assim que os jogos começarem os pontos aparecem aqui automaticamente.",

    cristal: en ? "Crystal" : es ? "Cristal" : fr ? "Cristal" : "Cristal",
    humano: en ? "Human" : es ? "Humano" : fr ? "Humain" : "Humano",
    serieA: en ? "Premier League" : es ? "Liga A" : fr ? "Ligue A" : "Série A",
    ia: en ? "AI" : es ? "IA" : fr ? "IA" : "IA",

    exatosTpl:
      en ? "{n} exatos"
        : es ? "{n} exactos"
          : fr ? "{n} exacts"
            : "{n} exatos",

    jogosTpl:
      en ? "{n} matches"
        : es ? "{n} partidos"
          : fr ? "{n} matches"
            : "{n} jogos",
  };
}

export async function generateMetadata() {
  return {
    title: "🤖 Ranking das IAs · Bolão das IAs",
    description:
      "Ranking competitivo das IAs que palpitaram na Copa 2026. Filtre por fase (grupos / mata-mata / geral) e escopo (Série A / todas IAs / IAs + Humanos).",
  };
}

export default async function IAsPage() {
  const locale = await resolverLocale();
  const en = locale === "en";
  const es = locale === "es";
  const fr = locale === "fr";

  const supabase = await createClient();
  const db = createAdminClient() ?? supabase;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email ?? null;
  const contribuinte = email ? await isContribuinte(email) : false;

  const todasLinhas = await carregarLinhasRankingGeral(db, contribuinte);

  const numIAs = todasLinhas.filter((l) => l.tipo === "ia" && !l.v2).length;

  const tit = en
    ? `🤖 The ${numIAs} competing AIs`
    : es
      ? `🤖 Las ${numIAs} IAs en competencia`
      : fr
        ? `🤖 Les ${numIAs} IA en compétition`
        : `🤖 As ${numIAs} IAs concorrendo`;

  const lede = en
    ? `Out of all the models invited, ${numIAs} delivered consistent predictions for the 104 World Cup 2026 matches — these are the ones competing. Filter by stage and scope below.`
    : es
      ? `De todos los modelos invitados, ${numIAs} entregaron pronósticos consistentes de los 104 partidos del Mundial 2026 — son los que compiten. Filtra por fase y alcance abajo.`
      : fr
        ? `Sur tous les modèles invités, ${numIAs} ont livré des pronostics cohérents pour les 104 matches de la Coupe 2026 — ce sont les concurrents. Filtrez par phase et portée ci-dessous.`
        : `De todos os modelos convidados, ${numIAs} entregaram palpites consistentes dos 104 jogos da Copa 2026 — são esses que estão concorrendo. Filtre por fase e escopo abaixo.`;

  const notaTit = en
    ? `Note: the ${numIAs} that remained (of 122 invited)`
    : es
      ? `Nota: las ${numIAs} que quedaron (de 122 invitadas)`
      : fr
        ? `Note : les ${numIAs} qui restent (sur 122 invitées)`
        : `Nota: as ${numIAs} que ficaram (de 122 convidadas)`;

  const notaTxt = en
    ? `We invited 122 AI models (briefly 124, with some variants). Many showed inconsistencies, errors, or simply didn't return a usable response — generally older or less robust models from each company. They were eliminated. Only the ${numIAs} who actually delivered a complete prediction sheet remained in the competition.`
    : es
      ? `Invitamos a 122 modelos de IA (llegamos a 124 con algunas variantes). Muchos presentaron inconsistencias, errores o simplemente no respondieron — en general modelos más antiguos o menos robustos de cada empresa. Fueron eliminados. Quedaron ${numIAs}, los que realmente entregaron una tabla completa de pronósticos.`
      : fr
        ? `Nous avons invité 122 modèles d'IA (jusqu'à 124 avec quelques variantes). Beaucoup ont montré des incohérences, des erreurs ou n'ont tout simplement pas répondu — généralement les modèles plus anciens ou moins robustes. Ils ont été éliminés. Il reste les ${numIAs} qui ont réellement livré une feuille de pronostics complète.`
        : `Convidamos 122 modelos de IA (chegou a 124 contando algumas variantes). Vários apresentaram inconsistências, erros, ou simplesmente não devolveram um palpite válido — em geral modelos mais antigos ou menos robustos de cada empresa. Foram desclassificados. Sobraram ${numIAs} — só essas entregaram um cartão completo de palpites e estão de fato concorrendo.`;

  const h2Ranking = en
    ? "Ranking — choose your view"
    : es
      ? "Ranking — elige tu vista"
      : fr
        ? "Classement — choisissez votre vue"
        : "Ranking — escolha sua visão";

  const labels = buildLabels(locale);

  return (
    <div style={{ marginTop: 32, marginBottom: 64 }}>
      <header style={{ textAlign: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: "clamp(34px, 6vw, 56px)" }}>{tit}</h1>
        <p
          className="lede"
          style={{ marginTop: 12, maxWidth: 700, marginInline: "auto" }}
        >
          {lede}
        </p>
        <details className="nota-122">
          <summary>{notaTit}</summary>
          <p>{notaTxt}</p>
        </details>
      </header>

      <style>{`
        .nota-122 {
          max-width: 700px;
          margin: 14px auto 0;
          padding: 8px 14px;
          background: var(--bg-1);
          border: 1px dashed var(--line);
          border-radius: var(--r-s);
          text-align: left;
        }
        .nota-122 summary {
          font-family: var(--ff-mono);
          font-size: 12px;
          font-weight: 700;
          color: var(--fg-mid);
          cursor: pointer;
          list-style: none;
          padding: 4px 0;
          letter-spacing: 0.02em;
        }
        .nota-122 summary::-webkit-details-marker { display: none; }
        .nota-122 summary::before {
          content: "ℹ ";
          color: var(--primary);
          font-weight: 800;
        }
        .nota-122[open] summary { color: var(--fg); }
        .nota-122 p {
          margin: 8px 0 4px;
          font-size: 13px;
          color: var(--fg-mid);
          line-height: 1.5;
        }
      `}</style>

      <SerieA locale={locale} />

      <ColaboracaoBanner variante="ias" locale={locale} />

      <section style={{ marginTop: 48 }}>
        <h2 style={{ textAlign: "center", marginBottom: 24 }}>
          {h2Ranking}
        </h2>

        <RankingGeralClient
          linhas={todasLinhas}
          contribuinte={contribuinte}
          labels={labels}
        />
      </section>
    </div>
  );
}
