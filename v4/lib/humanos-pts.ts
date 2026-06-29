/**
 * Carrega pontuação de TODOS os humanos (opt-in e privados).
 * Usado pela página /ias-vs-humanos para análise comparativa.
 * NÃO usar dados retornados aqui pra exibir nomes de usuários privados.
 */

import { createAdminClient } from "@/lib/admin";
import { pontosJogo } from "@/lib/scoring";
import { carregarJogos } from "@/lib/jogos";
import type { Palpite } from "@/lib/types";

// Jogo 1-72 = grupos; >=73 = mata-mata
function fasePorNumero(num: number): "grupos" | "matamata" {
  return num <= 72 ? "grupos" : "matamata";
}

export type HumanoPts = {
  user_id: string;
  display_name: string;
  opt_in_geral: boolean;
  grupos: { pontos: number; placares_exatos: number; vencedores_acertados: number; jogos_palpitados: number };
  matamata: { pontos: number; placares_exatos: number; vencedores_acertados: number; jogos_palpitados: number };
  geral: { pontos: number; placares_exatos: number; vencedores_acertados: number; jogos_palpitados: number };
};

export async function carregarTodosHumanos(): Promise<HumanoPts[]> {
  const admin = createAdminClient();
  if (!admin) return [];

  const jogos = await carregarJogos();

  const { data: todos } = await admin
    .from("profiles")
    .select("id, display_name, opt_in_geral");

  if (!todos || todos.length === 0) return [];

  const userIds = todos.map((h: { id: string }) => h.id);
  const PAGINA = 1000;
  const pp: Palpite[] = [];
  for (let inicio = 0; ; inicio += PAGINA) {
    const { data: lote } = await admin
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
    porUser.get(p.user_id)![p.jogo_numero] = p;
  });

  return todos.map((h: { id: string; display_name: string; opt_in_geral: boolean }) => {
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
      user_id: h.id,
      display_name: h.display_name,
      opt_in_geral: h.opt_in_geral,
      grupos: grp,
      matamata: mm,
      geral: {
        pontos: grp.pontos + mm.pontos,
        placares_exatos: grp.placares_exatos + mm.placares_exatos,
        vencedores_acertados: grp.vencedores_acertados + mm.vencedores_acertados,
        jogos_palpitados: grp.jogos_palpitados + mm.jogos_palpitados,
      },
    } satisfies HumanoPts;
  });
}
