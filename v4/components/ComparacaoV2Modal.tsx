"use client";

/**
 * ComparacaoV2Modal — card + modal mostrando o antes→depois (v1 × v2) de cada IA.
 *
 * O card mantém o visual da página /jogos, mas o conteúdo é a COMPARAÇÃO:
 * consenso v1 → consenso v2 e quantas IAs mudaram o palpite. O modal lista
 * cada IA com o palpite v1 e o v2, destacando quem mudou.
 */

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Bandeira from "@/components/Bandeira";
import IconeIA from "@/components/IconeIA";
import { scorePopularidade, marcaDe, MARCAS } from "@/lib/ias";
import type { Locale } from "@/lib/i18n";

export type Placar = { gols_a: number; gols_b: number };

export type LinhaComparacao = {
  slug: string;
  nome: string;
  v1: Placar | null;
  v2: Placar;
  v3?: Placar | null;
  mudou: boolean;
};

export type ConsensoSimples = {
  gols_a: number;
  gols_b: number;
  votos: number;
  total: number;
} | null;

export default function ComparacaoV2Modal({
  jogoNumero,
  timeA,
  timeB,
  isoA,
  isoB,
  data,
  hora,
  local,
  linhas,
  consensoV1,
  consensoV2,
  consensoV3,
  locale,
  domId,
  kickoff,
  trigger,
}: {
  jogoNumero: number;
  timeA: string;
  timeB: string;
  isoA?: string;
  isoB?: string;
  data: string;
  hora: string;
  local?: string;
  linhas: LinhaComparacao[];
  consensoV1: ConsensoSimples;
  consensoV2: ConsensoSimples;
  consensoV3?: ConsensoSimples;
  locale: Locale;
  domId?: string;
  kickoff?: string;
  trigger: React.ReactNode;
}) {
  const [aberto, setAberto] = useState(false);
  const [montado, setMontado] = useState(false);
  const [placarSel, setPlacarSel] = useState<string | null>(null);

  useEffect(() => setMontado(true), []);

  // Deep-link: /analise-v2#<jogo> abre direto a comparação daquele jogo.
  useEffect(() => {
    if (!domId) return;
    const check = () => {
      if (window.location.hash === `#${domId}`) setAberto(true);
    };
    check();
    window.addEventListener("hashchange", check);
    return () => window.removeEventListener("hashchange", check);
  }, [domId]);

  useEffect(() => {
    if (!aberto) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
    };
    document.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [aberto]);

  const tx = {
    fechar: locale === "en" ? "Close" : locale === "es" ? "Cerrar" : locale === "fr" ? "Fermer" : "Fechar",
    antes: locale === "en" ? "before (v1)" : locale === "es" ? "antes (v1)" : locale === "fr" ? "avant (v1)" : "antes (v1)",
    v2lbl: "v2",
    depois: locale === "en" ? "now (v2)" : locale === "es" ? "ahora (v2)" : locale === "fr" ? "maintenant (v2)" : "agora (v2)",
    agoraV3: locale === "en" ? "now (v3)" : locale === "es" ? "ahora (v3)" : locale === "fr" ? "maintenant (v3)" : "agora (v3)",
    mudaram: locale === "en" ? "AIs changed their pick" : locale === "es" ? "IAs cambiaron su pronóstico" : locale === "fr" ? "IA ont changé leur pronostic" : "IAs mudaram o palpite",
    mantiveram: locale === "en" ? "kept" : locale === "es" ? "mantuvieron" : locale === "fr" ? "ont gardé" : "mantiveram",
    porIA: locale === "en" ? "Pick by pick" : locale === "es" ? "Pronóstico por IA" : locale === "fr" ? "Pronostic par IA" : "Palpite por IA",
    novo: locale === "en" ? "new in v2" : locale === "es" ? "nuevo en v2" : locale === "fr" ? "nouveau en v2" : "novo na v2",
    placares: locale === "en" ? "Updated scores" : locale === "es" ? "Marcadores actualizados" : locale === "fr" ? "Scores mis à jour" : "Placares atualizados",
    voto: locale === "en" ? "vote" : locale === "es" ? "voto" : locale === "fr" ? "vote" : "voto",
    votos: locale === "en" ? "votes" : locale === "es" ? "votos" : locale === "fr" ? "votes" : "votos",
    cliquePlacar: locale === "en" ? "Click a score to see which AIs predicted it" : locale === "es" ? "Clic en un marcador para ver qué IAs lo pronosticaron" : locale === "fr" ? "Cliquez sur un score" : "Clique num placar pra ver quais IAs apostaram nele",
    iasQueApostaram: locale === "en" ? "AIs that picked this score" : locale === "es" ? "IAs que apostaron por este marcador" : locale === "fr" ? "IA ayant choisi ce score" : "IAs que apostaram nesse placar",
  };
  const temV3 = !!consensoV3;

  // Distribuição de palpites por placar (versão final: v3 quando existe, senão v2).
  type DistPlacar = { gols_a: number; gols_b: number; votos: number; ias: { slug: string; nome: string }[] };
  const distrib: DistPlacar[] = (() => {
    const cont: Record<string, DistPlacar> = {};
    for (const l of linhas) {
      const fin = l.v3 ?? l.v2;
      const key = `${fin.gols_a}-${fin.gols_b}`;
      if (!cont[key]) cont[key] = { gols_a: fin.gols_a, gols_b: fin.gols_b, votos: 0, ias: [] };
      cont[key].votos += 1;
      cont[key].ias.push({ slug: l.slug, nome: l.nome });
    }
    return Object.values(cont).sort(
      (a, b) => b.votos - a.votos || b.gols_a + b.gols_b - (a.gols_a + a.gols_b),
    );
  })();
  const totalDist = linhas.length;
  const selDist = placarSel ? distrib.find((c) => `${c.gols_a}-${c.gols_b}` === placarSel) : null;

  const mudaram = linhas.filter((l) => l.mudou).length;
  const total = linhas.length;
  // mudaram primeiro, depois por popularidade
  const ordenadas = [...linhas].sort((a, b) => {
    if (a.mudou !== b.mudou) return a.mudou ? -1 : 1;
    return scorePopularidade(a.slug) - scorePopularidade(b.slug);
  });

  const modal = aberto ? (
    <div className="modal-backdrop-sugestao" onClick={() => setAberto(false)}>
      <div className="modal-sugestao" onClick={(e) => e.stopPropagation()}>
        <div className="modal-sugestao-header">
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontFamily: "var(--ff-mono)",
                fontSize: 11,
                color: "var(--fg-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 4,
              }}
            >
              Jogo #{jogoNumero} · {data} · {hora}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "nowrap" }}>
              <Bandeira iso={isoA} nome={timeA} size={28} />
              <h3 style={{ fontSize: 18, margin: 0, color: "var(--fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                {timeA} × {timeB}
              </h3>
              <Bandeira iso={isoB} nome={timeB} size={28} />
            </div>
            {local && (
              <p style={{ fontSize: 12, color: "var(--fg-muted)", margin: "6px 0 0" }}>📍 {local}</p>
            )}
          </div>
          <button onClick={() => setAberto(false)} aria-label={tx.fechar} className="modal-close-btn">
            ✕
          </button>
        </div>

        <div style={{ padding: 24 }}>
          {/* Consenso v1 → v2 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              flexWrap: "wrap",
              marginBottom: 20,
            }}
          >
            <div style={{ textAlign: "center", opacity: 0.7 }}>
              <div style={{ fontSize: 11, color: "var(--fg-muted)", fontFamily: "var(--ff-mono)", textTransform: "uppercase" }}>
                {tx.antes}
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "var(--ff-display)" }}>
                {consensoV1 ? `${consensoV1.gols_a}×${consensoV1.gols_b}` : "—"}
              </div>
            </div>
            <div style={{ fontSize: 28 }}>→</div>
            {temV3 ? (
              // v3 presente: v2 vira etapa intermediária, v3 é o destaque
              <>
                <div style={{ textAlign: "center", opacity: 0.85 }}>
                  <div style={{ fontSize: 11, color: "var(--fg-muted)", fontFamily: "var(--ff-mono)", textTransform: "uppercase" }}>
                    {tx.v2lbl}
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "var(--ff-display)" }}>
                    {consensoV2 ? `${consensoV2.gols_a}×${consensoV2.gols_b}` : "—"}
                  </div>
                </div>
                <div style={{ fontSize: 28 }}>→</div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "var(--secondary)", fontFamily: "var(--ff-mono)", textTransform: "uppercase", fontWeight: 700 }}>
                    {tx.agoraV3}
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 900, fontFamily: "var(--ff-display)", color: "var(--secondary)" }}>
                    {consensoV3 ? `${consensoV3.gols_a}×${consensoV3.gols_b}` : "—"}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "var(--secondary)", fontFamily: "var(--ff-mono)", textTransform: "uppercase", fontWeight: 700 }}>
                  {tx.depois}
                </div>
                <div style={{ fontSize: 32, fontWeight: 900, fontFamily: "var(--ff-display)", color: "var(--secondary)" }}>
                  {consensoV2 ? `${consensoV2.gols_a}×${consensoV2.gols_b}` : "—"}
                </div>
              </div>
            )}
          </div>

          <p style={{ textAlign: "center", marginBottom: 20, fontSize: 14 }}>
            🔁 <strong>{mudaram}</strong> {locale === "en" ? "of" : locale === "es" ? "de" : locale === "fr" ? "sur" : "de"}{" "}
            <strong>{total}</strong> {tx.mudaram}
            <span style={{ color: "var(--fg-muted)" }}> · {total - mudaram} {tx.mantiveram}</span>
          </p>

          {/* Distribuição de palpites por placar (versão final) */}
          <h4
            style={{
              fontFamily: "var(--ff-mono)",
              fontSize: 11,
              color: "var(--fg-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 6,
            }}
          >
            {tx.placares}
          </h4>
          <p style={{ fontSize: 12, color: "var(--fg-muted)", marginBottom: 12 }}>
            {tx.cliquePlacar}
          </p>
          <div className="placares-lista">
            {distrib.map((c) => {
              const key = `${c.gols_a}-${c.gols_b}`;
              const ativo = placarSel === key;
              const pct = totalDist ? Math.round((c.votos / totalDist) * 100) : 0;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPlacarSel(ativo ? null : key)}
                  className={`placar-row ${ativo ? "ativo" : ""}`}
                >
                  <span className="placar-num">
                    {c.gols_a}×{c.gols_b}
                  </span>
                  <div className="placar-bar-wrap">
                    <div className="placar-bar">
                      <div className="placar-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <small>
                      {c.votos} {c.votos === 1 ? tx.voto : tx.votos} ({pct}%)
                    </small>
                  </div>
                  <span className="placar-toggle">{ativo ? "▾" : "▸"}</span>
                </button>
              );
            })}
          </div>

          {selDist && (
            <div className="ias-do-placar">
              <h5>
                {tx.iasQueApostaram} ({selDist.votos})
              </h5>
              <div className="ias-do-placar-grid">
                {[...selDist.ias]
                  .sort((a, b) => scorePopularidade(a.slug) - scorePopularidade(b.slug))
                  .map((ia) => (
                    <div key={ia.slug} className="ia-chip">
                      <IconeIA slug={ia.slug} size={20} title={ia.nome} />
                      <span>{ia.nome}</span>
                      <small style={{ color: MARCAS[marcaDe(ia.slug).familia].cor }}>
                        {MARCAS[marcaDe(ia.slug).familia].nome}
                      </small>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <h4
            style={{
              fontFamily: "var(--ff-mono)",
              fontSize: 11,
              color: "var(--fg-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginTop: 24,
              marginBottom: 10,
            }}
          >
            {tx.porIA}
          </h4>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {ordenadas.map((l) => (
              <div
                key={l.slug}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 12px",
                  borderRadius: "var(--r-m)",
                  background: l.mudou || !l.v1 ? "var(--bg-soft)" : "transparent",
                  border: l.mudou || !l.v1 ? "1px solid var(--line)" : "1px solid transparent",
                  opacity: l.mudou || !l.v1 ? 1 : 0.6,
                }}
              >
                <IconeIA slug={l.slug} size={22} title={l.nome} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: "var(--fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {l.nome}
                  </div>
                  <small style={{ color: MARCAS[marcaDe(l.slug).familia].cor, fontSize: 11 }}>
                    {MARCAS[marcaDe(l.slug).familia].nome}
                  </small>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--ff-display)" }}>
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
                    // v3 presente: v2 intermediário, v3 destaque
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
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <div
        id={domId}
        data-kickoff={kickoff}
        style={domId ? { scrollMarginTop: 90 } : undefined}
        role="button"
        tabIndex={0}
        onClick={() => setAberto(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setAberto(true);
          }
        }}
        className="jogo-card-btn"
        aria-label={`Comparar v1 × v2 do jogo ${timeA} x ${timeB}`}
      >
        {trigger}
      </div>
      {montado && modal ? createPortal(modal, document.body) : null}
    </>
  );
}
