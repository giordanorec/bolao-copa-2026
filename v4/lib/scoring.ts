import type { Jogo, Palpite } from "./types";

const FASES_MATA_MATA = new Set([
  "16-avos",
  "Oitavas",
  "Quartas",
  "Semifinal",
  "Semifinais",
  "3o-lugar",
  "Final",
]);

function isMataMata(fase: string): boolean {
  const f = fase.toLowerCase();
  return (
    f.includes("16-avos") ||
    f.includes("oitavas") ||
    f.includes("quartas") ||
    f.includes("semi") ||
    f.includes("3") ||
    f === "final"
  );
}

export function pontosJogo(palpite: Palpite | undefined, jogo: Jogo): number {
  if (!palpite || jogo.gols_a == null || jogo.gols_b == null) return 0;
  const { gols_a: pa, gols_b: pb } = palpite;
  const { gols_a: ra, gols_b: rb } = jogo;

  let base = 0;
  if (pa === ra && pb === rb) base = 10;
  else if (
    Math.sign(pa - pb) === Math.sign(ra - rb) &&
    pa - pb === ra - rb &&
    pa !== pb
  )
    base = 7;
  else if (Math.sign(pa - pb) === Math.sign(ra - rb) && pa !== pb) base = 5;
  else if (pa === pb && ra === rb) base = 5;
  else base = 0;

  return isMataMata(jogo.fase) ? base * 2 : base;
}

export function totalPontos(
  palpites: Record<number, Palpite>,
  jogos: Jogo[],
): number {
  return jogos.reduce((acc, j) => acc + pontosJogo(palpites[j.numero], j), 0);
}
