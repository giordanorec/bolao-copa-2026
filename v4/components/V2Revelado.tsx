"use client";

/**
 * V2Revelado — substitui o CadeadoV2 nos jogos 41–72 para contribuintes.
 *
 * Mostra o consenso v2 (palpite atualizado) direto no card da /jogos e
 * linka pro raio-x v1→v2 em /analise-v2#<jogo>. Client component pra
 * dar stopPropagation no link (senão o clique abriria o JogoModal).
 */

import Link from "next/link";
import type { Locale } from "@/lib/i18n";

export default function V2Revelado({
  locale = "pt",
  jogoNumero,
  golsA,
  golsB,
  votos,
  total,
}: {
  locale?: Locale;
  jogoNumero: number;
  golsA: number;
  golsB: number;
  votos: number;
  total: number;
}) {
  const tx = {
    badge:
      locale === "en" ? "v2 pick unlocked"
      : locale === "es" ? "pronóstico v2 desbloqueado"
      : locale === "fr" ? "pronostic v2 débloqué"
      : "palpite v2 liberado",
    consenso:
      locale === "en" ? "v2 consensus"
      : locale === "es" ? "consenso v2"
      : locale === "fr" ? "consensus v2"
      : "consenso v2",
    cta:
      locale === "en" ? "See v1 → v2"
      : locale === "es" ? "Ver v1 → v2"
      : locale === "fr" ? "Voir v1 → v2"
      : "Ver v1 → v2",
  };
  return (
    <div className="v2-revelado">
      <span className="v2-revelado-badge">✨ {tx.badge}</span>
      <div className="v2-revelado-placar">
        {golsA}×{golsB}
      </div>
      <small className="v2-revelado-sub">
        🔮 {tx.consenso} · {votos}/{total}
      </small>
      <Link
        href={`/analise-v2#${jogoNumero}`}
        className="v2-revelado-cta"
        onClick={(e) => e.stopPropagation()}
      >
        {tx.cta} →
      </Link>
    </div>
  );
}
