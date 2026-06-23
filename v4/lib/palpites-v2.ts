/**
 * Leitura dos palpites v2 (premium) server-side, via service_role.
 *
 * REGRA DE OURO: nunca chame isto sem antes confirmar que o viewer tem
 * direito (contribuinte/admin). A tabela palpite_v2 tem RLS sem policy de
 * SELECT — só o service_role lê. Expor o resultado ao browser de um
 * não-contribuinte fura o paywall.
 */

import { createAdminClient } from "./admin";

export type PlacarV2 = { gols_a: number; gols_b: number };

export type ConsensoV2 = {
  gols_a: number;
  gols_b: number;
  votos: number;
  total: number;
} | null;

/** Map<jogo_numero, { slug → placar }>. Vazio se service_role ausente. */
export async function carregarV2PorJogo(): Promise<
  Map<number, Record<string, PlacarV2>>
> {
  const map = new Map<number, Record<string, PlacarV2>>();
  const admin = createAdminClient();
  if (!admin) return map;

  // PostgREST limita a 1000 linhas por requisição — pagina.
  const PAGINA = 1000;
  for (let inicio = 0; ; inicio += PAGINA) {
    const { data, error } = await admin
      .from("palpite_v2")
      .select("slug, jogo_numero, gols_a, gols_b")
      .range(inicio, inicio + PAGINA - 1);
    if (error) {
      console.error("[palpites-v2] erro ao carregar:", error.message);
      break;
    }
    const lote = (data ?? []) as {
      slug: string;
      jogo_numero: number;
      gols_a: number;
      gols_b: number;
    }[];
    for (const r of lote) {
      const m = map.get(r.jogo_numero) ?? {};
      m[r.slug] = { gols_a: r.gols_a, gols_b: r.gols_b };
      map.set(r.jogo_numero, m);
    }
    if (lote.length < PAGINA) break;
  }
  return map;
}

/** Placar mais votado entre os palpites v2 de um jogo. */
export function consensoV2(palpites: Record<string, PlacarV2>): ConsensoV2 {
  const total = Object.keys(palpites).length;
  if (!total) return null;
  const contagem = new Map<
    string,
    { gols_a: number; gols_b: number; votos: number }
  >();
  for (const p of Object.values(palpites)) {
    const k = `${p.gols_a}-${p.gols_b}`;
    const c = contagem.get(k) ?? { gols_a: p.gols_a, gols_b: p.gols_b, votos: 0 };
    c.votos += 1;
    contagem.set(k, c);
  }
  const top = [...contagem.values()].sort(
    (a, b) => b.votos - a.votos || b.gols_a + b.gols_b - (a.gols_a + a.gols_b),
  )[0];
  return { gols_a: top.gols_a, gols_b: top.gols_b, votos: top.votos, total };
}
