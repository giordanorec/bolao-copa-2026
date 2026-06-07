"use client";

import { useState, useMemo } from "react";
import type { DadosPorJogo } from "@/lib/palpites-ias";

export default function SugestaoIA({
  jogoNumero,
  timeA,
  timeB,
  dados,
  iasDict,
  onPick,
}: {
  jogoNumero: number;
  timeA: string;
  timeB: string;
  dados: DadosPorJogo | null;
  iasDict: Record<string, string>;
  onPick: (gols_a: number, gols_b: number) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [iaEscolhida, setIaEscolhida] = useState<string>("");

  const totalVotos = useMemo(
    () =>
      dados?.consenso.reduce((acc, c) => acc + c.votos, 0) ?? 0,
    [dados],
  );

  if (!dados || !dados.palpites || Object.keys(dados.palpites).length === 0) {
    return null;
  }

  const palpiteIA = iaEscolhida ? dados.palpites[iaEscolhida] : null;
  const iasOrdenadas = Object.keys(dados.palpites).sort((a, b) => {
    const na = iasDict[a] ?? a;
    const nb = iasDict[b] ?? b;
    return na.localeCompare(nb);
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        title={`Ver palpites das IAs pra ${timeA} × ${timeB}`}
        style={{
          background: "transparent",
          border: "1px solid var(--line-strong)",
          borderRadius: "var(--r-s)",
          padding: "6px 8px",
          fontSize: 16,
          cursor: "pointer",
          color: "var(--accent)",
          lineHeight: 1,
        }}
      >
        💡
      </button>

      {aberto && (
        <div
          onClick={() => setAberto(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(6px)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              borderRadius: "var(--r-l)",
              width: "100%",
              maxWidth: 520,
              maxHeight: "85vh",
              overflowY: "auto",
              boxShadow: "var(--shadow-pop)",
            }}
          >
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid var(--line)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <p
                  style={{
                    fontFamily: "var(--ff-mono)",
                    fontSize: 11,
                    color: "var(--fg-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 2,
                  }}
                >
                  Jogo #{jogoNumero}
                </p>
                <h3 style={{ fontSize: 20, margin: 0 }}>
                  {timeA} × {timeB}
                </h3>
              </div>
              <button
                onClick={() => setAberto(false)}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: 24,
                  cursor: "pointer",
                  color: "var(--fg-muted)",
                  padding: 4,
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: 24 }}>
              {/* Bola de Cristal destaque */}
              {dados.bola_de_cristal && (
                <div
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255,206,0,0.12), rgba(0,166,153,0.12))",
                    border: "2px solid var(--accent)",
                    borderRadius: "var(--r-m)",
                    padding: 16,
                    marginBottom: 20,
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <span style={{ fontSize: 36 }}>🔮</span>
                  <div style={{ flex: 1 }}>
                    <strong>Bola de Cristal</strong>
                    <p
                      style={{
                        fontSize: 12,
                        color: "var(--fg-muted)",
                        margin: "2px 0 0",
                      }}
                    >
                      {dados.bola_de_cristal.votos} de{" "}
                      {Object.keys(dados.palpites).length} IAs concordam
                    </p>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontFamily: "var(--ff-mono)",
                        fontWeight: 800,
                        fontSize: 24,
                        color: "var(--accent-3)",
                      }}
                    >
                      {dados.bola_de_cristal.gols_a}×
                      {dados.bola_de_cristal.gols_b}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onPick(
                        dados.bola_de_cristal!.gols_a,
                        dados.bola_de_cristal!.gols_b,
                      );
                      setAberto(false);
                    }}
                    className="btn primary small"
                  >
                    Usar
                  </button>
                </div>
              )}

              {/* Consenso (placares mais votados) */}
              <h4
                style={{
                  fontFamily: "var(--ff-mono)",
                  fontSize: 11,
                  color: "var(--fg-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 12,
                }}
              >
                Placares mais votados
              </h4>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  marginBottom: 24,
                }}
              >
                {dados.consenso.slice(0, 6).map((c, i) => (
                  <div
                    key={`${c.gols_a}-${c.gols_b}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: 10,
                      background:
                        i === 0 ? "var(--bg-soft)" : "transparent",
                      borderRadius: "var(--r-s)",
                      border: "1px solid var(--line)",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--ff-mono)",
                        fontWeight: 800,
                        fontSize: 18,
                        color: "var(--fg)",
                        minWidth: 50,
                      }}
                    >
                      {c.gols_a}×{c.gols_b}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          height: 6,
                          background: "var(--bg-soft)",
                          borderRadius: 3,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${(c.votos / totalVotos) * 100}%`,
                            background:
                              i === 0
                                ? "var(--primary)"
                                : "var(--fg-mid)",
                          }}
                        />
                      </div>
                      <p
                        style={{
                          fontSize: 11,
                          color: "var(--fg-muted)",
                          marginTop: 4,
                          fontFamily: "var(--ff-mono)",
                        }}
                        title={c.ias
                          .map((s) => iasDict[s] ?? s)
                          .join(", ")}
                      >
                        {c.votos} {c.votos === 1 ? "voto" : "votos"}
                        {c.ias.length <= 3 &&
                          " · " +
                            c.ias.map((s) => iasDict[s] ?? s).join(", ")}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        onPick(c.gols_a, c.gols_b);
                        setAberto(false);
                      }}
                      className="btn small"
                    >
                      Usar
                    </button>
                  </div>
                ))}
              </div>

              {/* IA específica */}
              <h4
                style={{
                  fontFamily: "var(--ff-mono)",
                  fontSize: 11,
                  color: "var(--fg-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 12,
                }}
              >
                Ou ver palpite de IA específica
              </h4>
              <select
                value={iaEscolhida}
                onChange={(e) => setIaEscolhida(e.target.value)}
                className="input"
                style={{ marginBottom: 12, cursor: "pointer" }}
              >
                <option value="">— Escolher IA —</option>
                {iasOrdenadas.map((slug) => {
                  const p = dados.palpites[slug];
                  return (
                    <option key={slug} value={slug}>
                      {iasDict[slug] ?? slug} → {p.gols_a}×{p.gols_b}
                    </option>
                  );
                })}
              </select>

              {palpiteIA && (
                <div
                  style={{
                    background: "var(--bg-1)",
                    padding: 12,
                    borderRadius: "var(--r-m)",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <span style={{ fontSize: 24 }}>🤖</span>
                  <div style={{ flex: 1 }}>
                    <strong>{iasDict[iaEscolhida] ?? iaEscolhida}</strong>
                    <p
                      style={{
                        fontSize: 11,
                        color: "var(--fg-muted)",
                        fontFamily: "var(--ff-mono)",
                      }}
                    >
                      {iaEscolhida}
                    </p>
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--ff-mono)",
                      fontWeight: 800,
                      fontSize: 22,
                      color: "var(--primary)",
                    }}
                  >
                    {palpiteIA.gols_a}×{palpiteIA.gols_b}
                  </span>
                  <button
                    onClick={() => {
                      onPick(palpiteIA.gols_a, palpiteIA.gols_b);
                      setAberto(false);
                    }}
                    className="btn primary small"
                  >
                    Usar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
