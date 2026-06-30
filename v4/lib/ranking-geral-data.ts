/**
 * Carrega as linhas para o ranking geral (humanos opt-in + IAs + Bola de Cristal + v2).
 * Usado por /ranking-ias e /ranking-geral (redirect).
 */

import { promises as fs } from "fs";
import path from "path";
import { pontosJogo } from "@/lib/scoring";
import { carregarJogos } from "@/lib/jogos";
import { ehSerieA, nomeSerieA, SLUGS_SERIE_A, FALLBACK_NAO_WEB, SLUGS_SIBLINGS_SERIE_A } from "@/lib/serie-a";
import { scorePopularidade } from "@/lib/ias";
import type { Palpite } from "@/lib/types";
import type { LinhaFase } from "@/app/ranking-geral/RankingGeralClient";

// Jogo 1-72 = grupos; >=73 = mata-mata
function fasePorNumero(num: number): "grupos" | "matamata" {
  return num <= 72 ? "grupos" : "matamata";
}

type FaseStat = {
  pontos: number;
  placares_exatos: number;
  vencedores_acertados: number;
  jogos_palpitados: number;
};

type IARaw = {
  slug?: string;
  nome_display?: string;
  pontos?: number;
  palpites_total?: number;
  grupos?: FaseStat;
  matamata?: FaseStat;
  geral?: FaseStat;
  placares_exatos?: number;
  jogos_palpitados?: number;
};

const ZERO_FASE: FaseStat = {
  pontos: 0,
  placares_exatos: 0,
  vencedores_acertados: 0,
  jogos_palpitados: 0,
};

/** Escolhe a fonte da fase com MAIS jogos apurados (empate → fica com a oficial). */
function melhorFaseFonte(
  oficial: FaseStat | undefined,
  irmao: FaseStat | undefined,
): FaseStat {
  const o = oficial ?? ZERO_FASE;
  const i = irmao ?? ZERO_FASE;
  return i.jogos_palpitados > o.jogos_palpitados ? i : o;
}

export async function carregarLinhasIAs(): Promise<LinhaFase[]> {
  try {
    const filePath = path.join(process.cwd(), "public", "ranking-ias.json");
    const raw = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(raw);
    const todas: IARaw[] = (data.ias ?? []).filter(
      (ia: IARaw) =>
        ia.slug === "bola-de-cristal" || (ia.palpites_total ?? 0) > 0,
    );
    const porSlug = new Map<string, IARaw>();
    for (const ia of todas) {
      if (ia.slug) porSlug.set(ia.slug, ia);
    }

    const linhas: LinhaFase[] = [];

    // 1) Série A: UMA entrada sintética por slug da vitrine, com merge por
    //    fase (grupos do irmão API se tiver mais jogos, mata-mata do web).
    for (const slug of SLUGS_SERIE_A) {
      const oficial = porSlug.get(slug);
      const irmaoSlug = FALLBACK_NAO_WEB[slug];
      const irmao = irmaoSlug ? porSlug.get(irmaoSlug) : undefined;
      if (!oficial && !irmao) continue;
      const grupos = melhorFaseFonte(oficial?.grupos, irmao?.grupos);
      const matamata = melhorFaseFonte(oficial?.matamata, irmao?.matamata);
      const geral: FaseStat = {
        pontos: grupos.pontos + matamata.pontos,
        placares_exatos: grupos.placares_exatos + matamata.placares_exatos,
        vencedores_acertados:
          grupos.vencedores_acertados + matamata.vencedores_acertados,
        jogos_palpitados:
          grupos.jogos_palpitados + matamata.jogos_palpitados,
      };
      linhas.push({
        tipo: "ia" as const,
        slug,
        nome: nomeSerieA(slug) ?? oficial?.nome_display ?? irmao?.nome_display ?? slug,
        serieA: true,
        grupos,
        matamata,
        geral,
        popularidade: scorePopularidade(slug),
      } satisfies LinhaFase);
    }

    // 2) IAs fora da Série A: cada slug entra com seus próprios dados.
    //    Os irmãos API de Série A (claude-opus-4-7 etc.) ENTRAM aqui como
    //    IA "regular" (serieA=false), pra quem quiser ver a versão crua —
    //    sem confundir com a vitrine acima.
    for (const ia of todas) {
      const slug = ia.slug ?? "";
      if (SLUGS_SERIE_A.includes(slug)) continue; // já entrou no merge acima
      linhas.push({
        tipo: slug === "bola-de-cristal" ? ("cristal" as const) : ("ia" as const),
        slug,
        nome: nomeSerieA(slug) ?? ia.nome_display ?? slug ?? "?",
        serieA: false, // siblings deixam de ser marcados Série A — só o slot canônico
        grupos: ia.grupos ?? ZERO_FASE,
        matamata: ia.matamata ?? ZERO_FASE,
        geral: ia.geral ?? {
          pontos: ia.pontos ?? 0,
          placares_exatos: 0,
          vencedores_acertados: 0,
          jogos_palpitados: ia.palpites_total ?? 0,
        },
        popularidade: scorePopularidade(slug),
      } satisfies LinhaFase);
    }

    return linhas;
  } catch {
    return [];
  }
}

export async function carregarLinhasV2(): Promise<LinhaFase[]> {
  try {
    const [rawV2, rawV1] = await Promise.all([
      fs.readFile(path.join(process.cwd(), "public", "ranking-ias-v2.json"), "utf-8"),
      fs.readFile(path.join(process.cwd(), "public", "ranking-ias.json"), "utf-8"),
    ]);
    const dataV2 = JSON.parse(rawV2);
    const dataV1 = JSON.parse(rawV1);
    const ptsV1 = new Map<string, number>();
    for (const ia of dataV1.ias ?? []) ptsV1.set(ia.slug, ia.pontos ?? 0);

    return (dataV2.ias ?? [])
      .filter((ia: { tem_v2?: boolean }) => ia.tem_v2)
      .map(
        (ia: {
          nome_display?: string;
          slug?: string;
          pontos?: number;
          palpites_total?: number;
          grupos?: { pontos: number; placares_exatos: number; vencedores_acertados: number; jogos_palpitados: number };
          matamata?: { pontos: number; placares_exatos: number; vencedores_acertados: number; jogos_palpitados: number };
          geral?: { pontos: number; placares_exatos: number; vencedores_acertados: number; jogos_palpitados: number };
        }) => {
          const slug = ia.slug ?? "";
          const serieA = ehSerieA(slug);
          const pts = ia.pontos ?? 0;
          const orig = ptsV1.get(slug);
          const zero = { pontos: 0, placares_exatos: 0, vencedores_acertados: 0, jogos_palpitados: 0 };
          return {
            tipo: "ia" as const,
            slug,
            nome: nomeSerieA(slug) ?? ia.nome_display ?? slug ?? "?",
            serieA,
            v2: true,
            delta: orig != null ? pts - orig : null,
            grupos: ia.grupos ?? zero,
            matamata: ia.matamata ?? zero,
            geral: ia.geral ?? {
              pontos: pts,
              placares_exatos: 0,
              vencedores_acertados: 0,
              jogos_palpitados: ia.palpites_total ?? 72,
            },
            popularidade: scorePopularidade(slug),
          } satisfies LinhaFase;
        },
      );
  } catch {
    return [];
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function carregarLinhasRankingGeral(supabase: any, contribuinte: boolean): Promise<LinhaFase[]> {
  const jogos = await carregarJogos();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: humanosOptIn } = await supabase
    .from("profiles")
    .select("id, display_name, opt_in_geral, avatar_url")
    .eq("opt_in_geral", true);

  let linhasHumanos: LinhaFase[] = [];
  if (humanosOptIn && humanosOptIn.length > 0) {
    const userIds = humanosOptIn.map((h: { id: string }) => h.id);
    const PAGINA = 1000;
    const pp: Palpite[] = [];
    for (let inicio = 0; ; inicio += PAGINA) {
      const { data: lote } = await supabase
        .from("palpite")
        .select("user_id, jogo_numero, gols_a, gols_b, atualizado_em")
        .in("user_id", userIds)
        .order("user_id", { ascending: true })
        .order("jogo_numero", { ascending: true })
        .range(inicio, inicio + PAGINA - 1);
      const arr = (lote ?? []) as Palpite[];
      pp.push(...arr);
      if (arr.length < PAGINA) break;
    }
    const porUser = new Map<string, Record<number, Palpite>>();
    pp.forEach((p) => {
      if (!porUser.has(p.user_id)) porUser.set(p.user_id, {});
      porUser.get(p.user_id)![p.jogo_numero] = p as Palpite;
    });

    linhasHumanos = humanosOptIn.map(
      (h: { id: string; display_name: string; avatar_url?: string | null }) => {
        const palps = porUser.get(h.id) ?? {};
        const zero = () => ({ pontos: 0, placares_exatos: 0, vencedores_acertados: 0, jogos_palpitados: 0 });
        const grp = zero();
        const mm = zero();

        for (const jogo of jogos) {
          const p = palps[jogo.numero];
          if (!p) continue;
          const fase = fasePorNumero(jogo.numero);
          const bucket = fase === "grupos" ? grp : mm;
          const pts = pontosJogo(p, jogo);
          bucket.pontos += pts;
          bucket.jogos_palpitados += 1;
          if (jogo.gols_a != null && jogo.gols_b != null) {
            if (p.gols_a === jogo.gols_a && p.gols_b === jogo.gols_b) bucket.placares_exatos += 1;
            else if (Math.sign(p.gols_a - p.gols_b) === Math.sign(jogo.gols_a - jogo.gols_b)) bucket.vencedores_acertados += 1;
          }
        }

        return {
          tipo: "humano" as const,
          nome: h.display_name,
          avatar_url: h.avatar_url ?? null,
          grupos: grp,
          matamata: mm,
          geral: {
            pontos: grp.pontos + mm.pontos,
            placares_exatos: grp.placares_exatos + mm.placares_exatos,
            vencedores_acertados: grp.vencedores_acertados + mm.vencedores_acertados,
            jogos_palpitados: grp.jogos_palpitados + mm.jogos_palpitados,
          },
          popularidade: 999,
        } satisfies LinhaFase;
      },
    );
  }

  const linhasIAs = await carregarLinhasIAs();
  const linhasV2 = contribuinte ? await carregarLinhasV2() : [];

  return [...linhasHumanos, ...linhasIAs, ...linhasV2];
}
