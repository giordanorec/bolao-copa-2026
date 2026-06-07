import { createClient } from "@/lib/supabase-server";
import { totalPontos } from "@/lib/scoring";
import { carregarJogos } from "@/lib/jogos";
import type { Palpite } from "@/lib/types";

type MembroRow = { user_id: string; profiles: { display_name: string } };

export default async function RankingDoBolao({
  bolaoId,
  membros,
}: {
  bolaoId: string;
  membros: MembroRow[];
}) {
  if (membros.length === 0) {
    return (
      <div className="card empty">
        Nenhum membro ainda. Compartilhe o link!
      </div>
    );
  }

  const supabase = await createClient();
  const userIds = membros.map((m) => m.user_id);
  const { data: todosPalpites } = await supabase
    .from("palpite")
    .select("user_id, jogo_numero, gols_a, gols_b, atualizado_em")
    .in("user_id", userIds);

  const jogos = await carregarJogos();
  const porUser = new Map<string, Record<number, Palpite>>();
  (todosPalpites ?? []).forEach((p) => {
    if (!porUser.has(p.user_id)) porUser.set(p.user_id, {});
    porUser.get(p.user_id)![p.jogo_numero] = p as Palpite;
  });

  const linhas = membros
    .map((m) => {
      const palps = porUser.get(m.user_id) ?? {};
      return {
        user_id: m.user_id,
        nome: m.profiles.display_name,
        pontos: totalPontos(palps, jogos),
        preenchidos: Object.keys(palps).length,
      };
    })
    .sort((a, b) => b.pontos - a.pontos);

  return (
    <div className="card">
      <h2 style={{ fontSize: 28, marginBottom: 16 }}>🏆 Ranking</h2>
      <div className="table-scroll">
      <table className="ranking-table">
        <thead>
          <tr>
            <th className="pos">#</th>
            <th>Quem</th>
            <th>Palpitou</th>
            <th style={{ textAlign: "right" }}>Pontos</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l, i) => (
            <tr key={l.user_id}>
              <td className="pos">{i + 1}</td>
              <td className="nome">{l.nome}</td>
              <td className="muted">{l.preenchidos}/104</td>
              <td className="pts">{l.pontos}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
