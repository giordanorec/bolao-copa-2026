"use client";

/**
 * SeletorIAV2 — visão IA-centrada da comparação v1 → v2.
 *
 * O resto da /analise-v2 é jogo-a-jogo (um card/modal por jogo). Aqui a pessoa
 * escolhe UMA IA num seletor e vê de uma vez como ela mudou (ou não) todos os
 * palpites dela. Sugestão do colaborador Denilson.
 */

import { useState } from "react";
import IconeIA from "@/components/IconeIA";
import Bandeira from "@/components/Bandeira";
import { marcaDe, MARCAS } from "@/lib/ias";
import type { Locale } from "@/lib/i18n";

type Placar = { gols_a: number; gols_b: number };

export type LinhaIA = {
  jogo: number;
  timeA: string;
  timeB: string;
  isoA?: string;
  isoB?: string;
  data: string;
  hora: string;
  v1: Placar | null;
  v2: Placar;
  v3?: Placar | null;
  mudou: boolean;
};

export type IAComparada = {
  slug: string;
  nome: string;
  linhas: LinhaIA[];
};

export default function SeletorIAV2({
  ias,
  locale,
}: {
  ias: IAComparada[];
  locale: Locale;
}) {
  const [slug, setSlug] = useState(ias[0]?.slug ?? "");
  const ia = ias.find((x) => x.slug === slug) ?? ias[0];

  if (!ia) return null;

  const tx = {
    titulo:
      locale === "en" ? "View by AI"
      : locale === "es" ? "Ver por IA"
      : locale === "fr" ? "Voir par IA"
      : "Ver por IA",
    desc:
      locale === "en" ? "Pick one AI and see all its v1 → v2 changes at once."
      : locale === "es" ? "Elige una IA y ve todos sus cambios v1 → v2 de una vez."
      : locale === "fr" ? "Choisissez une IA et voyez tous ses changements v1 → v2 d'un coup."
      : "Escolha uma IA e veja todas as mudanças dela (v1 → v2) de uma vez.",
    label:
      locale === "en" ? "AI"
      : locale === "es" ? "IA"
      : locale === "fr" ? "IA"
      : "IA",
    mudou:
      locale === "en" ? "changed"
      : locale === "es" ? "cambió"
      : locale === "fr" ? "a changé"
      : "mudou",
    de:
      locale === "en" ? "of"
      : locale === "es" ? "de"
      : locale === "fr" ? "sur"
      : "de",
    palpites:
      locale === "en" ? "picks"
      : locale === "es" ? "pronósticos"
      : locale === "fr" ? "pronostics"
      : "palpites",
    novo:
      locale === "en" ? "new in v2"
      : locale === "es" ? "nuevo en v2"
      : locale === "fr" ? "nouveau en v2"
      : "novo na v2",
  };

  const mudaram = ia.linhas.filter((l) => l.mudou).length;
  const marca = MARCAS[marcaDe(ia.slug).familia];

  return (
    <section className="card" style={{ marginBottom: 32 }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 22, marginBottom: 4 }}>🤖 {tx.titulo}</h2>
        <p style={{ color: "var(--fg-mid)", fontSize: 14 }}>{tx.desc}</p>
      </div>

      <label
        style={{
          display: "block",
          fontSize: 11,
          fontFamily: "var(--ff-mono)",
          color: "var(--fg-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 6,
        }}
      >
        {tx.label}
      </label>
      <select
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        className="input"
        style={{ maxWidth: 360, marginBottom: 20 }}
        aria-label={tx.label}
      >
        {ias.map((x) => (
          <option key={x.slug} value={x.slug}>
            {x.nome}
          </option>
        ))}
      </select>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <IconeIA slug={ia.slug} size={28} title={ia.nome} />
        <div>
          <div style={{ fontWeight: 700, color: "var(--fg)" }}>{ia.nome}</div>
          <small style={{ color: marca.cor, fontSize: 11 }}>{marca.nome}</small>
        </div>
        <div style={{ marginLeft: "auto", fontSize: 13, color: "var(--fg-mid)" }}>
          🔁 <strong>{mudaram}</strong> {tx.de} {ia.linhas.length} {tx.palpites}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {ia.linhas.map((l) => (
          <div
            key={l.jogo}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 12px",
              borderRadius: "var(--r-m)",
              background: l.mudou || !l.v1 ? "var(--bg-soft)" : "transparent",
              border:
                l.mudou || !l.v1
                  ? "1px solid var(--line)"
                  : "1px solid transparent",
              opacity: l.mudou || !l.v1 ? 1 : 0.6,
            }}
          >
            <span
              style={{
                fontFamily: "var(--ff-mono)",
                fontSize: 11,
                color: "var(--fg-muted)",
                minWidth: 28,
              }}
            >
              #{l.jogo}
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                flex: 1,
                minWidth: 0,
              }}
            >
              <Bandeira iso={l.isoA} nome={l.timeA} size={18} />
              <span
                style={{
                  fontSize: 13,
                  color: "var(--fg)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {l.timeA} × {l.timeB}
              </span>
              <Bandeira iso={l.isoB} nome={l.timeB} size={18} />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontFamily: "var(--ff-display)",
              }}
            >
              <span
                style={{
                  color: "var(--fg-muted)",
                  fontSize: l.v1 ? 15 : 11,
                  textDecoration: l.mudou ? "line-through" : "none",
                }}
              >
                {l.v1 ? `${l.v1.gols_a}×${l.v1.gols_b}` : tx.novo}
              </span>
              <span style={{ color: "var(--fg-muted)" }}>→</span>
              {l.v3 ? (
                <>
                  <span style={{ color: "var(--fg-mid)", fontSize: 15 }}>
                    {l.v2.gols_a}×{l.v2.gols_b}
                  </span>
                  <span style={{ color: "var(--fg-muted)" }}>→</span>
                  <span style={{ color: "var(--secondary)", fontSize: 18, fontWeight: 900 }}>
                    {l.v3.gols_a}×{l.v3.gols_b}
                  </span>
                </>
              ) : (
                <span
                  style={{
                    color: l.mudou || !l.v1 ? "var(--secondary)" : "var(--fg)",
                    fontSize: 18,
                    fontWeight: l.mudou || !l.v1 ? 900 : 700,
                  }}
                >
                  {l.v2.gols_a}×{l.v2.gols_b}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
