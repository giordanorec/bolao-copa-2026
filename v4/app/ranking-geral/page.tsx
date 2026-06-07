import { createClient } from "@/lib/supabase-server";
import { totalPontos } from "@/lib/scoring";
import { carregarJogos } from "@/lib/jogos";
import { promises as fs } from "fs";
import path from "path";
import type { Palpite } from "@/lib/types";

type Linha = {
  tipo: "humano" | "ia" | "cristal";
  nome: string;
  pontos: number;
  preenchidos: number;
};

async function carregarIAs(): Promise<Linha[]> {
  try {
    const filePath = path.join(process.cwd(), "public", "ranking-ias.json");
    const raw = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(raw);
    return (data.ias ?? []).map(
      (
        ia: {
          nome_display?: string;
          slug?: string;
          pontos?: number;
          palpites_preenchidos?: number;
        },
      ) => ({
        tipo:
          ia.slug === "bola-de-cristal" ? ("cristal" as const) : ("ia" as const),
        nome: ia.nome_display ?? ia.slug ?? "?",
        pontos: ia.pontos ?? 0,
        preenchidos: ia.palpites_preenchidos ?? 104,
      }),
    );
  } catch {
    return [];
  }
}

export const metadata = {
  title: "Ranking Geral · Bolão das IAs",
  description: "Humanos opt-in + 121 IAs + Bola de Cristal. Quem chuta melhor?",
};

export default async function RankingGeralPage() {
  const supabase = await createClient();
  const jogos = await carregarJogos();

  const { data: humanosOptIn } = await supabase
    .from("profiles")
    .select("id, display_name, opt_in_geral")
    .eq("opt_in_geral", true);

  let linhasHumanos: Linha[] = [];
  if (humanosOptIn && humanosOptIn.length > 0) {
    const userIds = humanosOptIn.map((h: { id: string }) => h.id);
    const { data: pp } = await supabase
      .from("palpite")
      .select("user_id, jogo_numero, gols_a, gols_b, atualizado_em")
      .in("user_id", userIds);
    const porUser = new Map<string, Record<number, Palpite>>();
    (pp ?? []).forEach((p) => {
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

  const linhasIAs = await carregarIAs();
  const todos: Linha[] = [...linhasHumanos, ...linhasIAs].sort(
    (a, b) => b.pontos - a.pontos,
  );

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
                <th>Palpitou</th>
                <th style={{ textAlign: "right" }}>Pontos</th>
              </tr>
            </thead>
            <tbody>
              {todos.slice(0, 200).map((l, i) => (
                <tr key={`${l.tipo}-${l.nome}-${i}`}>
                  <td className="pos">{i + 1}</td>
                  <td>
                    {l.tipo === "humano" ? (
                      <span style={{ color: "var(--primary)" }}>👤 Humano</span>
                    ) : l.tipo === "cristal" ? (
                      <span style={{ color: "var(--accent)" }}>🔮 Cristal</span>
                    ) : (
                      <span style={{ color: "var(--fg-muted)" }}>🤖 IA</span>
                    )}
                  </td>
                  <td className="nome">{l.nome}</td>
                  <td className="muted">{l.preenchidos}/104</td>
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
