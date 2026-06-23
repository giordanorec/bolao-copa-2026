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
      locale === "en" ? "Updated pick available"
      : locale === "es" ? "Pronóstico actualizado disponible"
      : locale === "fr" ? "Pronostic mis à jour disponible"
      : "Palpite atualizado disponível",
    consenso:
      locale === "en" ? "new consensus"
      : locale === "es" ? "nuevo consenso"
      : locale === "fr" ? "nouveau consensus"
      : "novo consenso",
    cta:
      locale === "en" ? "See the breakdown"
      : locale === "es" ? "Ver el análisis"
      : locale === "fr" ? "Voir l'analyse"
      : "Ver o raio-x",
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
