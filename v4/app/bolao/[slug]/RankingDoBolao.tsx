import { createClient } from "@/lib/supabase-server";
import { totalPontos } from "@/lib/scoring";
import { carregarJogos } from "@/lib/jogos";
import type { Palpite } from "@/lib/types";
import { Trophy } from "lucide-react";

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
      <div className="card text-center text-[--color-muted]">
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
      <h2 className="text-2xl mb-4 flex items-center gap-2">
        <Trophy className="text-[--color-secondary]" /> Ranking
      </h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[--color-line] text-left text-[--color-muted]">
            <th className="py-2 pr-4">#</th>
            <th className="py-2 pr-4">Quem</th>
            <th className="py-2 pr-4">Palpitou</th>
            <th className="py-2 text-right">Pontos</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l, i) => (
            <tr key={l.user_id} className="border-b border-[--color-line]/50">
              <td className="py-3 pr-4 font-mono">{i + 1}</td>
              <td className="py-3 pr-4 font-semibold">{l.nome}</td>
              <td className="py-3 pr-4 text-[--color-muted]">{l.preenchidos}/104</td>
              <td className="py-3 text-right font-bold text-[--color-primary]">{l.pontos}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
