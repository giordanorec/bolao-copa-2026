import { createClient } from "@/lib/supabase-server";
import { totalPontos, pontosJogo } from "@/lib/scoring";
import { carregarJogos } from "@/lib/jogos";
import type { Palpite, Jogo } from "@/lib/types";

type MembroRow = { user_id: string; profiles: { display_name: string } };

export default async function RankingDoBolao({
  bolaoId: _bolaoId,
  membros,
}: {
  bolaoId: string;
  membros: MembroRow[];
}) {
  void _bolaoId;
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

  // Só os jogos já encerrados (com resultado) — esses é que importam pra
  // ver palpite × real × pts. Ordem decrescente: o mais recente em cima.
  const jogosEncerrados = jogos
    .filter((j): j is Jogo & { gols_a: number; gols_b: number } =>
      j.gols_a != null && j.gols_b != null,
    )
    .sort((a, b) => b.numero - a.numero);

  // Colocação com empate na MESMA posição (1º, 1º, 3º).
  const linhas = membros
    .map((m) => {
      const palps = porUser.get(m.user_id) ?? {};
      return {
        user_id: m.user_id,
        nome: m.profiles.display_name,
        pontos: totalPontos(palps, jogos),
        preenchidos: Object.keys(palps).length,
        palpites: palps,
      };
    })
    .sort((a, b) => b.pontos - a.pontos);

  let rankAtual = 0;
  let ptsAnterior: number | null = null;
  const linhasComRank = linhas.map((l, idx) => {
    if (ptsAnterior === null || l.pontos !== ptsAnterior) {
      rankAtual = idx + 1;
      ptsAnterior = l.pontos;
    }
    return { ...l, rank: rankAtual };
  });

  return (
    <div className="card">
      <h2 style={{ fontSize: 28, marginBottom: 16 }}>🏆 Ranking</h2>
      <p style={{ color: "var(--fg-mid)", fontSize: 13, marginBottom: 12 }}>
        Clique em cada membro pra ver os palpites jogo a jogo, com o resultado
        real e quantos pontos cada um fez.
      </p>
      <div className="bolao-membros">
        {linhasComRank.map((l) => (
          <details key={l.user_id} className="bolao-membro">
            <summary className="bolao-membro-head">
              <span className="bolao-membro-rank">{l.rank}º</span>
              <span className="bolao-membro-nome">{l.nome}</span>
              <span className="bolao-membro-palp">
                {l.preenchidos}/104 palpites
              </span>
              <span className="bolao-membro-pts">{l.pontos}</span>
            </summary>
            <div className="bolao-membro-detalhe">
              {jogosEncerrados.length === 0 ? (
                <p className="muted" style={{ padding: 12 }}>
                  Nenhum jogo encerrado ainda.
                </p>
              ) : (
                <ul className="bolao-jogos-lista">
                  {jogosEncerrados.map((j) => {
                    const p = l.palpites[j.numero];
                    const pts = p ? pontosJogo(p, j) : null;
                    const tier =
                      pts == null
                        ? "vazio"
                        : pts >= 10
                          ? "exato"
                          : pts >= 5
                            ? "venc"
                            : "zero";
                    return (
                      <li
                        key={j.numero}
                        className="bolao-jogo-linha"
                        data-tier={tier}
                      >
                        <span className="bj-num">#{j.numero}</span>
                        <span className="bj-times">
                          {j.time_a} × {j.time_b}
                        </span>
                        <span className="bj-placares">
                          <span className="bj-bloco">
                            <span className="bj-lbl">palpite</span>
                            <span className="bj-num-pal">
                              {p ? `${p.gols_a}×${p.gols_b}` : "—"}
                            </span>
                          </span>
                          <span className="bj-bloco real">
                            <span className="bj-lbl">real</span>
                            <span className="bj-num-real">
                              {j.gols_a}×{j.gols_b}
                            </span>
                          </span>
                        </span>
                        <span className="bj-pts" data-tier={tier}>
                          {pts == null ? "—" : pts}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </details>
        ))}
      </div>
      <style>{`
        .bolao-membros {
          display: flex; flex-direction: column; gap: 8px;
        }
        .bolao-membro {
          background: var(--bg-1);
          border: 1px solid var(--line);
          border-radius: var(--r-m);
          overflow: hidden;
        }
        .bolao-membro[open] { border-color: var(--primary); }
        .bolao-membro-head {
          display: grid;
          grid-template-columns: 16px 40px 1fr auto 64px;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          cursor: pointer;
          list-style: none;
          user-select: none;
        }
        .bolao-membro-head::-webkit-details-marker { display: none; }
        .bolao-membro-head::before {
          content: "▸";
          color: var(--fg-muted);
          font-size: 12px;
          transition: transform 0.15s ease;
        }
        .bolao-membro[open] .bolao-membro-head::before {
          transform: rotate(90deg);
          color: var(--primary);
        }
        .bolao-membro-rank {
          font-family: var(--ff-mono);
          font-weight: 800;
          color: var(--fg-mid);
        }
        .bolao-membro-nome {
          font-weight: 700;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .bolao-membro-palp {
          font-family: var(--ff-mono);
          font-size: 11px;
          color: var(--fg-muted);
        }
        .bolao-membro-pts {
          font-family: var(--ff-display);
          font-size: 22px;
          font-weight: 900;
          color: var(--secondary);
          text-align: right;
        }
        .bolao-membro-detalhe {
          border-top: 1px solid var(--line);
          padding: 8px;
          background: var(--bg-2);
        }
        .bolao-jogos-lista {
          list-style: none;
          padding: 0; margin: 0;
          display: flex; flex-direction: column;
          gap: 4px;
        }
        .bolao-jogo-linha {
          display: grid;
          grid-template-columns: 44px 1fr auto 44px;
          gap: 10px;
          align-items: center;
          padding: 8px 12px;
          background: var(--bg-1);
          border: 1px solid var(--line);
          border-radius: var(--r-s);
          font-size: 13px;
        }
        .bolao-jogo-linha[data-tier="exato"] {
          background: color-mix(in srgb, #10b981 12%, var(--bg-1));
          border-color: #10b981;
        }
        .bolao-jogo-linha[data-tier="venc"] {
          background: color-mix(in srgb, #d4d4d4 10%, var(--bg-1));
        }
        .bj-num {
          font-family: var(--ff-mono);
          font-size: 11px;
          font-weight: 700;
          color: var(--fg-muted);
        }
        .bj-times {
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .bj-placares {
          display: flex; gap: 10px; align-items: center;
        }
        .bj-bloco {
          display: flex; flex-direction: column;
          align-items: center;
          line-height: 1.1;
        }
        .bj-lbl {
          font-family: var(--ff-mono);
          font-size: 9px;
          font-weight: 700;
          color: var(--fg-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .bj-bloco.real .bj-lbl { color: #10b981; }
        .bj-num-pal {
          font-family: var(--ff-display);
          font-weight: 800;
          color: var(--secondary);
        }
        .bj-num-real {
          font-family: var(--ff-display);
          font-weight: 900;
          color: #10b981;
        }
        .bj-pts {
          font-family: var(--ff-mono);
          font-size: 12px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 999px;
          text-align: center;
        }
        .bj-pts[data-tier="exato"] { background: #10b981; color: #fff; }
        .bj-pts[data-tier="venc"]  { background: #d4d4d4; color: #1a2657; }
        .bj-pts[data-tier="zero"]  { background: var(--bg-soft); color: var(--fg-muted); }
        .bj-pts[data-tier="vazio"] { background: transparent; color: var(--fg-muted); }
        @media (max-width: 520px) {
          .bolao-membro-head {
            grid-template-columns: 16px 32px 1fr 56px;
          }
          .bolao-membro-palp { display: none; }
          .bolao-jogo-linha {
            grid-template-columns: 36px 1fr 40px;
          }
          .bj-times { font-size: 12px; }
          .bj-placares {
            grid-column: 1 / -1;
            justify-content: center;
            padding-top: 4px;
          }
          .bolao-jogo-linha {
            grid-template-columns: 36px 1fr 40px;
            row-gap: 2px;
          }
        }
      `}</style>
    </div>
  );
}
