import { createClient } from "@/lib/supabase-server";
import { createAdminClient, isContribuinte } from "@/lib/admin";
import { totalPontos } from "@/lib/scoring";
import { carregarJogos } from "@/lib/jogos";
import { promises as fs } from "fs";
import path from "path";
import type { Palpite } from "@/lib/types";
import { ehSerieA, nomeSerieA } from "@/lib/serie-a";

type Linha = {
  tipo: "humano" | "ia" | "cristal";
  nome: string;
  pontos: number;
  preenchidos: number;
  serieA?: boolean;
  v2?: boolean;
  delta?: number | null;
};

async function carregarIAs(): Promise<Linha[]> {
  try {
    const filePath = path.join(process.cwd(), "public", "ranking-ias.json");
    const raw = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(raw);
    return (data.ias ?? [])
      .filter(
        // Esconde IAs que nunca palpitaram (placeholders sem coleta)
        (ia: { slug?: string; palpites_total?: number }) =>
          ia.slug === "bola-de-cristal" || (ia.palpites_total ?? 0) > 0,
      )
      .map(
        (
          ia: {
            nome_display?: string;
            slug?: string;
            pontos?: number;
            palpites_total?: number;
          },
        ) => {
          const slug = ia.slug ?? "";
          const serieA = ehSerieA(slug);
          return {
            tipo:
              slug === "bola-de-cristal"
                ? ("cristal" as const)
                : ("ia" as const),
            nome: nomeSerieA(slug) ?? ia.nome_display ?? slug ?? "?",
            pontos: ia.pontos ?? 0,
            preenchidos: ia.palpites_total ?? 104,
            serieA,
          };
        },
      );
  } catch {
    return [];
  }
}

// Linhas "IA v2" (bifurcação) — só pra contribuintes. Lê ranking-ias-v2.json
// (v1 nos jogos 1-40 + v2 nos 41-72) e cruza com o original pra mostrar o delta.
async function carregarIAsV2(): Promise<Linha[]> {
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
      .filter((ia: { tem_v2?: boolean }) => ia.tem_v2) // só IAs com palpite v2 real
      .map(
        (ia: {
          nome_display?: string;
          slug?: string;
          pontos?: number;
          palpites_total?: number;
        }) => {
          const slug = ia.slug ?? "";
          const serieA = ehSerieA(slug);
          const pts = ia.pontos ?? 0;
          const orig = ptsV1.get(slug);
          return {
            tipo: "ia" as const,
            nome: nomeSerieA(slug) ?? ia.nome_display ?? slug ?? "?",
            pontos: pts,
            preenchidos: ia.palpites_total ?? 72,
            serieA,
            v2: true,
            delta: orig != null ? pts - orig : null,
          };
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

  // Visitantes anônimos não passam pela RLS de `palpite` (a policy exige
  // auth.uid() dono ou companheiro de bolão), então os palpites dos humanos
  // viriam vazios e todos pontuariam 0. Usamos o service_role (bypass de RLS)
  // só pra LER as pontuações de quem fez opt-in no ranking geral.
  const db = createAdminClient() ?? supabase;

  const { data: humanosOptIn } = await db
    .from("profiles")
    .select("id, display_name, opt_in_geral")
    .eq("opt_in_geral", true);

  let linhasHumanos: Linha[] = [];
  if (humanosOptIn && humanosOptIn.length > 0) {
    const userIds = humanosOptIn.map((h: { id: string }) => h.id);
    // PostgREST corta em 1000 linhas por requisição. Com ~72 palpites por
    // pessoa, poucos usuários opt-in já estouram o limite e os palpites de
    // quem fica além do corte sumiriam (pontuando 0). Por isso paginamos.
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
        return {
          tipo: "humano" as const,
          nome: h.display_name,
          pontos: totalPontos(palps, jogos),
          preenchidos: Object.keys(palps).length,
        };
      },
    );
  }

  // Contribuinte (allowlist/admin) vê o Hall bifurcado: cada IA com palpite v2
  // aparece também na versão atualizada (v1 nos jogos 1-40 + v2 nos 41-72).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email ?? null;
  const contribuinte = email ? await isContribuinte(email) : false;

  const linhasIAs = await carregarIAs();
  const linhasV2 = contribuinte ? await carregarIAsV2() : [];
  const todos: Linha[] = [...linhasHumanos, ...linhasIAs, ...linhasV2].sort(
    (a, b) => b.pontos - a.pontos,
  );

  // Colocação com empate na MESMA posição (1º, 1º, 3º) — vale em todo ranking.
  let rankAtual = 0;
  let ptsAnterior: number | null = null;
  const colocacoes = todos.map((l, idx) => {
    if (ptsAnterior === null || l.pontos !== ptsAnterior) {
      rankAtual = idx + 1;
      ptsAnterior = l.pontos;
    }
    return rankAtual;
  });

  return (
    <div style={{ marginTop: 40 }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h1 style={{ fontSize: "clamp(36px, 6vw, 64px)" }}>
          🏆 Ranking Geral
        </h1>
        <p className="lede" style={{ marginTop: 16 }}>
          Humanos {linhasHumanos.length > 0 ? `(${linhasHumanos.length})` : ""}{" "}
          + {linhasIAs.length} IAs juntos. Quem chuta melhor?
        </p>
        {contribuinte && linhasV2.length > 0 && (
          <p
            className="muted"
            style={{ marginTop: 8, fontSize: 14, maxWidth: 640, marginInline: "auto" }}
          >
            🔓 Visão de colaborador: as linhas{" "}
            <span style={{ fontWeight: 800, color: "var(--accent-3)" }}>v2 🔄</span>{" "}
            são a versão atualizada de cada IA (palpites originais nos jogos 1–40 +
            palpites revisados a partir do 41). O número verde/vermelho é o ganho/perda
            de pontos vs. a versão original. Dá pra ver quem melhora com mais informação.
          </p>
        )}
      </div>

      <div className="card">
        {todos.length === 0 ? (
          <p className="muted center" style={{ padding: 40 }}>
            Aguardando palpites…
          </p>
        ) : (
          <div className="table-scroll">
          <table className="ranking-table">
            <thead>
              <tr>
                <th className="pos">#</th>
                <th>Tipo</th>
                <th>Quem</th>
                <th style={{ textAlign: "right" }}>Pontos</th>
              </tr>
            </thead>
            <tbody>
              {todos.slice(0, contribuinte ? 400 : 200).map((l, i) => (
                <tr
                  key={`${l.tipo}-${l.nome}-${l.v2 ? "v2" : "v1"}-${i}`}
                  style={
                    l.v2
                      ? { background: "color-mix(in srgb, var(--accent) 9%, transparent)" }
                      : undefined
                  }
                >
                  <td className="pos">{colocacoes[i]}º</td>
                  <td>
                    {l.tipo === "humano" ? (
                      <span style={{ color: "var(--primary)" }}>👤 Humano</span>
                    ) : l.tipo === "cristal" ? (
                      <span style={{ color: "var(--accent)" }}>🔮 Cristal</span>
                    ) : l.serieA ? (
                      <span style={{ color: "var(--secondary)", fontWeight: 700 }}>
                        🏆 Série A
                      </span>
                    ) : (
                      <span style={{ color: "var(--fg-muted)" }}>🤖 IA</span>
                    )}
                  </td>
                  <td className="nome">
                    {l.nome}
                    {l.v2 && (
                      <>
                        {" "}
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            padding: "1px 6px",
                            borderRadius: 999,
                            background:
                              "linear-gradient(135deg, var(--accent), var(--accent-2))",
                            color: "var(--secondary)",
                          }}
                        >
                          v2 🔄
                        </span>
                        {l.delta != null && l.delta !== 0 && (
                          <span
                            style={{
                              marginLeft: 6,
                              fontSize: 12,
                              fontWeight: 700,
                              color:
                                l.delta > 0
                                  ? "var(--ok, #16a34a)"
                                  : "var(--err, #dc2626)",
                            }}
                          >
                            {l.delta > 0 ? `+${l.delta}` : l.delta}
                          </span>
                        )}
                      </>
                    )}
                  </td>
                  <td className="pts">{l.pontos}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

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
          Cria conta, palpita, e ativa o opt-in no teu perfil.
        </p>
        <a href="/signup" className="btn primary">
          Criar conta →
        </a>
      </div>
    </div>
  );
}
