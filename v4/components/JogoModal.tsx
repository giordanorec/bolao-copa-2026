"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Bandeira from "@/components/Bandeira";
import IconeIA from "@/components/IconeIA";
import ShareButtons from "@/components/ShareButtons";
import { scorePopularidade, marcaDe, MARCAS } from "@/lib/ias";
import type { DadosPorJogo } from "@/lib/palpites-ias";
import type { Locale } from "@/lib/i18n";

type ConsensoLocal = {
  gols_a: number;
  gols_b: number;
  votos: number;
  ias: string[];
};

export default function JogoModal({
  jogoNumero,
  timeA,
  timeB,
  isoA,
  isoB,
  data,
  hora,
  local,
  dados,
  iasDict,
  locale,
  bolaoSlug,
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
  dados: DadosPorJogo | null;
  iasDict: Record<string, string>;
  locale: Locale;
  bolaoSlug?: string; // se passado, mostra botão "Usar esse" pra integrar com palpitar
  domId?: string; // âncora pra deep-link e auto-scroll
  kickoff?: string; // ISO do início do jogo (BRT) pra achar o "próximo jogo"
  trigger: React.ReactNode;
}) {
  const [aberto, setAberto] = useState(false);
  const [placarSelecionado, setPlacarSelecionado] = useState<string | null>(null);
  const [montado, setMontado] = useState(false);

  useEffect(() => setMontado(true), []);

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

  // Calcula consenso por placar
  const consensoArr: ConsensoLocal[] = (() => {
    if (!dados) return [];
    const slugs = Object.keys(dados.palpites);
    const contagem: Record<string, ConsensoLocal> = {};
    slugs.forEach((slug) => {
      const p = dados.palpites[slug];
      const key = `${p.gols_a}-${p.gols_b}`;
      if (!contagem[key]) {
        contagem[key] = { gols_a: p.gols_a, gols_b: p.gols_b, votos: 0, ias: [] };
      }
      contagem[key].votos += 1;
      contagem[key].ias.push(slug);
    });
    return Object.values(contagem).sort(
      (a, b) =>
        b.votos - a.votos ||
        b.gols_a + b.gols_b - (a.gols_a + a.gols_b),
    );
  })();

  const totalVotos = dados ? Object.keys(dados.palpites).length : 0;
  const top = consensoArr[0];
  const confiancaPct = top && totalVotos ? Math.round((top.votos / totalVotos) * 100) : 0;
  const selecionado = placarSelecionado
    ? consensoArr.find(
        (c) => `${c.gols_a}-${c.gols_b}` === placarSelecionado,
      )
    : null;

  const tx = {
    consenso: locale === "en" ? "consensus" : locale === "es" ? "consenso" : locale === "fr" ? "consensus" : "consenso",
    placares: locale === "en" ? "Scores predicted" : locale === "es" ? "Marcadores pronosticados" : locale === "fr" ? "Scores prédits" : "Placares sugeridos",
    voto: locale === "en" ? "vote" : locale === "es" ? "voto" : locale === "fr" ? "vote" : "voto",
    votos: locale === "en" ? "votes" : locale === "es" ? "votos" : locale === "fr" ? "votes" : "votos",
    cliquePlacar: locale === "en" ? "Click a score to see which AIs predicted it" : locale === "es" ? "Clic en un marcador para ver qué IAs lo pronosticaron" : locale === "fr" ? "Cliquez sur un score" : "Clique num placar pra ver quais IAs apostaram nele",
    iasQueApostaram: locale === "en" ? "AIs that picked this score" : locale === "es" ? "IAs que apostaron por este marcador" : locale === "fr" ? "IA ayant choisi ce score" : "IAs que apostaram nesse placar",
    grauConfianca: locale === "en" ? "Confidence" : locale === "es" ? "Confianza" : locale === "fr" ? "Confiance" : "Grau de confiança",
    semDados: locale === "en" ? "No predictions for this match yet." : locale === "es" ? "Sin pronósticos aún." : locale === "fr" ? "Pas encore de pronostics." : "Sem palpites das IAs ainda.",
    usarNoPalpitar: locale === "en" ? "Use this score in my pool" : locale === "es" ? "Usar este marcador" : locale === "fr" ? "Utiliser ce score" : "Usar esse no meu palpite",
    fechar: locale === "en" ? "Close" : locale === "es" ? "Cerrar" : locale === "fr" ? "Fermer" : "Fechar",
  };

  const modal = aberto ? (
    <div className="modal-backdrop-sugestao" onClick={() => setAberto(false)}>
      <div className="modal-sugestao" onClick={(e) => e.stopPropagation()}>
        <div className="modal-sugestao-header">
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontFamily: "var(--ff-mono)",
              fontSize: 11,
              color: "var(--fg-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 4,
            }}>
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
              <p style={{ fontSize: 12, color: "var(--fg-muted)", margin: "6px 0 0" }}>
                📍 {local}
              </p>
            )}
          </div>
          <button
            onClick={() => setAberto(false)}
            aria-label={tx.fechar}
            className="modal-close-btn"
          >
            ✕
          </button>
        </div>

        <div style={{ padding: 24 }}>
          {!dados || consensoArr.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--fg-muted)", padding: 32 }}>
              {tx.semDados}
            </p>
          ) : (
            <>
              {/* Consenso destacado */}
              {top && (
                <div className="jogo-modal-consenso">
                  <div style={{ fontSize: 40 }}>🔮</div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: 16, color: "var(--fg)" }}>
                      {tx.consenso} · {top.gols_a}×{top.gols_b}
                    </strong>
                    <div className="confianca-wrap">
                      <div className="confianca-track">
                        <div
                          className="confianca-fill"
                          style={{ width: `${confiancaPct}%` }}
                        />
                      </div>
                      <span className="confianca-pct">{confiancaPct}%</span>
                    </div>
                    <small style={{ color: "var(--fg-muted)", fontSize: 12 }}>
                      {top.votos}/{totalVotos} IAs · {tx.grauConfianca}
                    </small>
                  </div>
                </div>
              )}

              {/* Lista de placares */}
              <h4 style={{
                fontFamily: "var(--ff-mono)",
                fontSize: 11,
                color: "var(--fg-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginTop: 24,
                marginBottom: 10,
              }}>
                {tx.placares}
              </h4>
              <p style={{ fontSize: 12, color: "var(--fg-muted)", marginBottom: 12 }}>
                {tx.cliquePlacar}
              </p>
              <div className="placares-lista">
                {consensoArr.map((c) => {
                  const key = `${c.gols_a}-${c.gols_b}`;
                  const ativo = placarSelecionado === key;
                  const pct = Math.round((c.votos / totalVotos) * 100);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPlacarSelecionado(ativo ? null : key)}
                      className={`placar-row ${ativo ? "ativo" : ""}`}
                    >
                      <span className="placar-num">
                        {c.gols_a}×{c.gols_b}
                      </span>
                      <div className="placar-bar-wrap">
                        <div className="placar-bar">
                          <div
                            className="placar-bar-fill"
                            style={{ width: `${pct}%` }}
                          />
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

              {/* IAs do placar selecionado */}
              {selecionado && (
                <div className="ias-do-placar">
                  <h5>
                    {tx.iasQueApostaram} ({selecionado.votos})
                  </h5>
                  <div className="ias-do-placar-grid">
                    {selecionado.ias
                      .sort((a, b) => scorePopularidade(a) - scorePopularidade(b))
                      .map((slug) => (
                        <div key={slug} className="ia-chip">
                          <IconeIA slug={slug} size={20} title={iasDict[slug] ?? slug} />
                          <span>{iasDict[slug] ?? slug}</span>
                          <small style={{ color: MARCAS[marcaDe(slug).familia].cor }}>
                            {MARCAS[marcaDe(slug).familia].nome}
                          </small>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Share */}
              {top && (
                <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--line)" }}>
                  <p style={{
                    fontSize: 12,
                    fontFamily: "var(--ff-mono)",
                    color: "var(--fg-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 10,
                  }}>
                    {locale === "en" ? "Share this prediction"
                      : locale === "es" ? "Compartir este pronóstico"
                      : locale === "fr" ? "Partager ce pronostic"
                      : "Compartilhar este palpite"}
                  </p>
                  <ShareButtons
                    url={`/jogos#${jogoNumero}`}
                    texto={`🔮 As IAs preveem: ${timeA} ${top.gols_a}×${top.gols_b} ${timeB} (${confiancaPct}% de confiança · ${top.votos}/${totalVotos} IAs)`}
                    locale={locale}
                  />
                </div>
              )}

              {/* CTA palpitar */}
              {bolaoSlug ? (
                <Link
                  href={`/bolao/${bolaoSlug}/palpitar#jogo-${jogoNumero}`}
                  className="btn primary block"
                  style={{ marginTop: 20 }}
                >
                  {tx.usarNoPalpitar} →
                </Link>
              ) : (
                <div style={{
                  marginTop: 24,
                  padding: 16,
                  background: "var(--bg-soft)",
                  borderRadius: "var(--r-m)",
                  textAlign: "center",
                }}>
                  <Link href="/signup" className="btn primary">
                    {locale === "en" ? "Create my pool to bet"
                      : locale === "es" ? "Crear mi polla"
                      : locale === "fr" ? "Créer ma cagnotte"
                      : "Cria conta pra apostar"} →
                  </Link>
                </div>
              )}
            </>
          )}
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
        aria-label={`Ver detalhes do jogo ${timeA} x ${timeB}`}
      >
        {trigger}
      </div>
      {montado && modal ? createPortal(modal, document.body) : null}
    </>
  );
}
