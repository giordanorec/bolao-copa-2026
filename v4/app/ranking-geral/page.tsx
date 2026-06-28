import { createClient } from "@/lib/supabase-server";
import { createAdminClient, isContribuinte } from "@/lib/admin";
import { pontosJogo } from "@/lib/scoring";
import { carregarJogos } from "@/lib/jogos";
import { promises as fs } from "fs";
import path from "path";
import type { Palpite } from "@/lib/types";
import { ehSerieA, nomeSerieA } from "@/lib/serie-a";
import { ORDEM_POPULARIDADE, scorePopularidade } from "@/lib/ias";
import RankingGeralClient, { type LinhaFase } from "./RankingGeralClient";

// Jogo 1-72 = grupos; >=73 = mata-mata
function fasePorNumero(num: number): "grupos" | "matamata" {
  return num <= 72 ? "grupos" : "matamata";
}

async function carregarIAs(): Promise<LinhaFase[]> {
  try {
    const filePath = path.join(process.cwd(), "public", "ranking-ias.json");
    const raw = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(raw);
    return (data.ias ?? [])
      .filter(
        (ia: { slug?: string; palpites_total?: number }) =>
          ia.slug === "bola-de-cristal" || (ia.palpites_total ?? 0) > 0,
      )
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
          const zero = { pontos: 0, placares_exatos: 0, vencedores_acertados: 0, jogos_palpitados: 0 };
          return {
            tipo:
              slug === "bola-de-cristal"
                ? ("cristal" as const)
                : ("ia" as const),
            slug,
            nome: nomeSerieA(slug) ?? ia.nome_display ?? slug ?? "?",
            serieA,
            grupos: ia.grupos ?? zero,
            matamata: ia.matamata ?? zero,
            geral: ia.geral ?? {
              pontos: ia.pontos ?? 0,
              placares_exatos: 0,
              vencedores_acertados: 0,
              jogos_palpitados: ia.palpites_total ?? 0,
            },
            popularidade: scorePopularidade(slug),
          } satisfies LinhaFase;
        },
      );
  } catch {
    return [];
  }
}

async function carregarIAsV2(): Promise<LinhaFase[]> {
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
            geral: ia.geral ?? { pontos: pts, placares_exatos: 0, vencedores_acertados: 0, jogos_palpitados: ia.palpites_total ?? 72 },
            popularidade: scorePopularidade(slug),
          } satisfies LinhaFase;
        },
      );
  } catch {
    return [];
  }
}

export const metadata = {
  title: "Ranking Geral · Bolão das IAs",
  description:
    "Humanos opt-in + as IAs concorrendo + Bola de Cristal, no mesmo placar. Quem chuta melhor?",
};

export default async function RankingGeralPage() {
  const supabase = await createClient();
  const jogos = await carregarJogos();

  const db = createAdminClient() ?? supabase;

  const { data: humanosOptIn } = await db
    .from("profiles")
    .select("id, display_name, opt_in_geral")
    .eq("opt_in_geral", true);

  let linhasHumanos: LinhaFase[] = [];
  if (humanosOptIn && humanosOptIn.length > 0) {
    const userIds = humanosOptIn.map((h: { id: string }) => h.id);
    const PAGINA = 1000;
    const pp: Palpite[] = [];
    for (let inicio = 0; ; inicio += PAGINA) {
      const { data: lote } = await db
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
      (h: { id: string; display_name: string }) => {
        const palps = porUser.get(h.id) ?? {};

        // Agregar por fase
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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email ?? null;
  const contribuinte = email ? await isContribuinte(email) : false;

  const linhasIAs = await carregarIAs();
  const linhasV2 = contribuinte ? await carregarIAsV2() : [];

  const numHumanos = linhasHumanos.length;
  const numIAs = linhasIAs.filter((l) => l.tipo === "ia").length;

  const todasLinhas: LinhaFase[] = [
    ...linhasHumanos,
    ...linhasIAs,
    ...linhasV2,
  ];

  return (
    <div style={{ marginTop: 40 }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h1 style={{ fontSize: "clamp(36px, 6vw, 64px)" }}>
          🏆 Ranking Geral
        </h1>
        <p className="lede" style={{ marginTop: 16 }}>
          Humanos {numHumanos > 0 ? `(${numHumanos})` : ""} + {numIAs} IAs
          juntos. Quem chuta melhor?
        </p>
        {contribuinte && linhasV2.length > 0 && (
          <p
            className="muted"
            style={{ marginTop: 8, fontSize: 14, maxWidth: 640, marginInline: "auto" }}
          >
            Visão de colaborador: as linhas{" "}
            <span style={{ fontWeight: 800, color: "var(--accent-3)" }}>v2 🔄</span>{" "}
            são a versão atualizada de cada IA. O número verde/vermelho é o
            ganho/perda vs. a versão original.
          </p>
        )}
      </div>

      <RankingGeralClient linhas={todasLinhas} contribuinte={contribuinte} />

      <div
        className="card"
        style={{
          marginTop: 24,
          background: "var(--bg-1)",
          textAlign: "center",
        }}
      >
        <h3 style={{ marginBottom: 12, fontSize: 20 }}>
          Quer aparecer aqui?
        </h3>
        <p style={{ color: "var(--fg-mid)", marginBottom: 16 }}>
          Entre no bolão público "Humanos × IAs", palpite os jogos e concorra
          contra as 122 IAs no mesmo placar.
        </p>
        <a href="/bolao/humanos-vs-ias" className="btn primary">
          Entrar no Bolão Humanos × IAs →
        </a>
      </div>
    </div>
  );
}
