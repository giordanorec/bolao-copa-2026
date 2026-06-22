"use client";

/**
 * CadeadoV2 — Selo público para jogos 41-72.
 *
 * Exibe um CTA convidando a contribuir via Pix e seguir @arena.das.ias
 * para receber a senha e acessar os palpites v2. NÃO expõe nenhum dado v2.
 * Client component: usa stopPropagation pra não disparar o clique do card.
 */

import type { Locale } from "@/lib/i18n";

const COLABORAR_URL = "/colaborar";

// ─── Texto localizado ────────────────────────────────────────────
// [docs-writer]: substituir estes textos pelo copy aprovado quando
// o guia do contribuinte estiver pronto. Por ora, texto provisório
// claro o suficiente pra comunicar a proposta.

const TX: Record<
  Locale,
  { badge: string; titulo: string; desc: string; cta: string }
> = {
  pt: {
    badge: "Palpite atualizado disponível",
    titulo: "Palpites v2 — informados pela fase de grupos",
    desc: "Contribua via Pix (e-mail no comentário) e siga @arena.das.ias pra receber a senha.",
    cta: "💛 Colaborar via Pix",
  },
  en: {
    badge: "Updated pick available",
    titulo: "v2 picks — informed by group-stage results",
    desc: "Support via Pix (email in the note) and follow @arena.das.ias to receive the password.",
    cta: "💛 Support via Pix",
  },
  es: {
    badge: "Pronóstico actualizado disponible",
    titulo: "Pronósticos v2 — informados por la fase de grupos",
    desc: "Colabora vía Pix (e-mail en el comentario) y sigue @arena.das.ias para recibir la contraseña.",
    cta: "💛 Colaborar vía Pix",
  },
  fr: {
    badge: "Pronostic mis à jour disponible",
    titulo: "Pronostics v2 — informés par la phase de groupes",
    desc: "Soutenez via Pix (e-mail dans le commentaire) et suivez @arena.das.ias pour recevoir le mot de passe.",
    cta: "💛 Soutenir via Pix",
  },
};

export default function CadeadoV2({ locale = "pt" }: { locale?: Locale }) {
  const tx = TX[locale] ?? TX.pt;
  return (
    <div className="cadeado-v2">
      <span className="cadeado-v2-badge">
        <span className="cadeado-v2-icon" aria-hidden="true">🔒</span>
        {tx.badge}
      </span>
      <p className="cadeado-v2-titulo">{tx.titulo}</p>
      <p className="cadeado-v2-desc">{tx.desc}</p>
      <a
        href={COLABORAR_URL}
        className="cadeado-v2-cta"
        onClick={(e) => e.stopPropagation()}
        aria-label={tx.cta}
      >
        {tx.cta} →
      </a>
    </div>
  );
}
