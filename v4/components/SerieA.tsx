import { promises as fs } from "fs";
import path from "path";
import { t, type Locale } from "@/lib/i18n";
import { scorePopularidade } from "@/lib/ias";
import {
  SLUG_FABLE,
  SLUGS_SERIE_A,
  APELIDOS_SERIE_A as APELIDOS,
  FALLBACK_NAO_WEB,
} from "@/lib/serie-a";
import SerieAVitrine, { type IAVitrine, type SerieAVitrineLabels } from "@/components/SerieAVitrine";

type Fase = "grupos" | "matamata" | "geral";

type FaseStats = {
  pontos: number;
  placares_exatos: number;
  vencedores_acertados: number;
  jogos_palpitados: number;
};

type IA = {
  slug: string;
  nome_display: string;
  pontos: number;
  placares_exatos: number;
  jogos_palpitados: number;
  rank: number;
  grupos?: FaseStats;
  matamata?: FaseStats;
  geral?: FaseStats;
};

async function carregarSerieA(): Promise<IA[]> {
  try {
    const arquivo = path.join(process.cwd(), "public", "ranking-ias.json");
    const raw = await fs.readFile(arquivo, "utf-8");
    const dados = JSON.parse(raw) as { ias: IA[] };
    const porSlug = new Map<string, IA>();
    for (const ia of dados.ias) porSlug.set(ia.slug, ia);

    // Pra cada slug da Série A: escolhe entre o "-web" (vitrine) e o irmão
    // sem "-web" (API) pelo que tem MAIS jogos apurados para a fase geral.
    const ias: IA[] = [];
    for (const slug of SLUGS_SERIE_A) {
      const oficial = porSlug.get(slug);
      const irmao = FALLBACK_NAO_WEB[slug]
        ? porSlug.get(FALLBACK_NAO_WEB[slug])
        : undefined;
      let fonte = oficial;
      if (
        irmao &&
        (!oficial || irmao.jogos_palpitados > oficial.jogos_palpitados)
      ) {
        fonte = irmao;
      }
      if (!fonte) continue;
      ias.push({
        slug,
        nome_display: oficial?.nome_display ?? fonte.nome_display,
        pontos: fonte.pontos,
        placares_exatos: fonte.placares_exatos,
        jogos_palpitados: fonte.jogos_palpitados,
        rank: 0,
        grupos: fonte.grupos,
        matamata: fonte.matamata,
        geral: fonte.geral,
      });
    }

    return ias;
  } catch {
    return [];
  }
}

// Calcula rank com empate (dense ranking estilo "1, 1, 3").
function calcularRanks(ias: { pontos: number }[]): number[] {
  const ranks: number[] = [];
  let rankAtual = 1;
  for (let i = 0; i < ias.length; i++) {
    if (i === 0) {
      ranks.push(1);
      continue;
    }
    if (ias[i].pontos === ias[i - 1].pontos) {
      ranks.push(rankAtual);
    } else {
      rankAtual = i + 1;
      ranks.push(rankAtual);
    }
  }
  return ranks;
}

// Extrai pontos/stats de uma IA para a fase pedida.
// Para o sibling resolver, usa jogos_palpitados da fase específica
// quando disponível, caindo para o top-level como fallback.
function statsParaFase(
  ia: IA,
  fase: Fase,
): { pontos: number; placares_exatos: number; jogos_palpitados: number } {
  const sub = ia[fase];
  if (sub) {
    return {
      pontos: sub.pontos,
      placares_exatos: sub.placares_exatos,
      jogos_palpitados: sub.jogos_palpitados,
    };
  }
  // fallback pro top-level (geral) se o sub-objeto não existe
  return {
    pontos: ia.pontos,
    placares_exatos: ia.placares_exatos,
    jogos_palpitados: ia.jogos_palpitados,
  };
}

// Constrói a lista de IAVitrine para uma fase específica,
// aplicando o sibling resolver por fase + sort por pontos + popularidade.
function construirIasPorFase(iasRaw: IA[], fase: Fase): IAVitrine[] {
  const ias = iasRaw
    .map((ia) => ({ ...ia, ...statsParaFase(ia, fase) }))
    .sort(
      (a, b) =>
        b.pontos - a.pontos ||
        scorePopularidade(a.slug) - scorePopularidade(b.slug),
    );

  const ranks = calcularRanks(ias);

  return ias.map((ia, i) => {
    const ap = APELIDOS[ia.slug];
    return {
      slug: ia.slug,
      nome: ap?.nome ?? ia.nome_display,
      modelo: ap?.modelo ?? "",
      pontos: ia.pontos,
      placares_exatos: ia.placares_exatos,
      jogos_palpitados: ia.jogos_palpitados,
      rank: ranks[i],
      ehFable: ia.slug === SLUG_FABLE,
    };
  });
}

// Labels dos chips — declarados inline para não precisar tocar no i18n.ts
const CHIP_LABELS: Record<Locale, Record<Fase, string>> = {
  pt: { grupos: "Grupos", matamata: "Mata-mata", geral: "Geral" },
  en: { grupos: "Groups", matamata: "Knockout", geral: "Overall" },
  es: { grupos: "Grupos", matamata: "Eliminatoria", geral: "General" },
  fr: { grupos: "Groupes", matamata: "Éliminatoires", geral: "Général" },
};

export default async function SerieA({
  locale = "pt",
  variante = "compact",
  fase = "geral",
  mostrarSeletor = false,
}: {
  locale?: Locale;
  variante?: "compact" | "destaque";
  fase?: Fase;
  mostrarSeletor?: boolean;
}) {
  const iasRaw = await carregarSerieA();
  if (iasRaw.length === 0) return null;

  // Sufixos de texto
  const sufixoJogos =
    locale === "en" ? "matches" : locale === "es" ? "partidos" : locale === "fr" ? "matches" : "jogos";
  const sufixoExatos =
    locale === "en" ? "exact" : locale === "es" ? "exactos" : locale === "fr" ? "exacts" : "exatos";

  // Títulos por fase — fallback para titulo genérico se key específica ausente
  const tituloGrupos = t(locale, "home.serie_a.titulo_grupos") !== "home.serie_a.titulo_grupos"
    ? t(locale, "home.serie_a.titulo_grupos")
    : t(locale, "home.serie_a.titulo");
  const tituloMatamata = t(locale, "home.serie_a.titulo_matamata");
  const tituloGeral = t(locale, "home.serie_a.titulo");

  // Subtítulos por fase — fallback para sub genérico se key específica ausente
  const subGrupos = t(locale, "home.serie_a.sub_grupos") !== "home.serie_a.sub_grupos"
    ? t(locale, "home.serie_a.sub_grupos")
    : t(locale, "home.serie_a.sub");
  const subMatamata = t(locale, "home.serie_a.sub_matamata");
  const subGeral = t(locale, "home.serie_a.sub");

  const labels: SerieAVitrineLabels = {
    titulos: {
      grupos: tituloGrupos,
      matamata: tituloMatamata,
      geral: tituloGeral,
    },
    subs: {
      grupos: subGrupos,
      matamata: subMatamata,
      geral: subGeral,
    },
    chips: CHIP_LABELS[locale],
    sufixoJogos,
    sufixoExatos,
  };

  const FASES: Fase[] = ["grupos", "matamata", "geral"];
  const iasPorFase = Object.fromEntries(
    FASES.map((f) => [f, construirIasPorFase(iasRaw, f)]),
  ) as Record<Fase, IAVitrine[]>;

  return (
    <SerieAVitrine
      variante={variante}
      defaultFase={fase}
      mostrarSeletor={mostrarSeletor}
      iasPorFase={iasPorFase}
      labels={labels}
    />
  );
}
