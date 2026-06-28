import type { Jogo } from "./types";

// Escopo de jogos de um bolão. Como `palpite` é global por (user_id,
// jogo_numero) — um único conjunto de palpites reaproveitado em N bolões —,
// o que distingue um bolão do outro é APENAS o intervalo de jogos que conta.
//
// - "humanos-vs-ias" é o bolão público do MATA-MATA: só jogos ≥ 73 contam.
//   Nenhum ponto da fase de grupos entra.
// - Qualquer outro bolão (privados) usa a Copa toda (1–104).
export type EscopoBolao = {
  minJogo: number;
  maxJogo: number;
  label: string;
};

const ESCOPO_COPA_TODA: EscopoBolao = {
  minJogo: 1,
  maxJogo: 104,
  label: "Copa toda",
};

const ESCOPOS: Record<string, EscopoBolao> = {
  "humanos-vs-ias": { minJogo: 73, maxJogo: 104, label: "Mata-mata" },
};

export function escopoDoBolao(slug: string): EscopoBolao {
  return ESCOPOS[slug] ?? ESCOPO_COPA_TODA;
}

export function jogoNoEscopo(numero: number, escopo: EscopoBolao): boolean {
  return numero >= escopo.minJogo && numero <= escopo.maxJogo;
}

export function jogosNoEscopo(jogos: Jogo[], escopo: EscopoBolao): Jogo[] {
  return jogos.filter((j) => jogoNoEscopo(j.numero, escopo));
}
