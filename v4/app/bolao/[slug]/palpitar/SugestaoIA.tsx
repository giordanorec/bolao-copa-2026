"use client";

import { useState, useMemo } from "react";
import type { DadosPorJogo, PaisIA } from "@/lib/palpites-ias";
import Bandeira from "@/components/Bandeira";
import IconeIA from "@/components/IconeIA";
import {
  familiaDe,
  MARCAS,
  ORDEM_POPULARIDADE,
  scorePopularidade,
  type FamiliaIA,
} from "@/lib/ias";

type ConsensoLocal = {
  gols_a: number;
  gols_b: number;
  votos: number;
  ias: string[];
};

export default function SugestaoIA({
  jogoNumero,
  timeA,
  timeB,
  isoA,
  isoB,
  dados,
  iasDict,
  onPick,
}: {
  jogoNumero: number;
  timeA: string;
  timeB: string;
  isoA?: string;
  isoB?: string;
  dados: DadosPorJogo | null;
  iasDict: Record<string, string>;
  paises?: Record<string, PaisIA>;
  onPick: (gols_a: number, gols_b: number) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [familiaFiltro, setFamiliaFiltro] = useState<FamiliaIA | "all">("all");
  const [iaEscolhida, setIaEscolhida] = useState<string>("");

  const { consensoFiltrado, totalFiltrado, familiasChips, bolaFiltrada } =
    useMemo(() => {
      if (!dados) {
        return {
          consensoFiltrado: [] as ConsensoLocal[],
          totalFiltrado: 0,
          familiasChips: [] as { familia: FamiliaIA; count: number }[],
          bolaFiltrada: null as ConsensoLocal | null,
        };
      }
      const slugs = Object.keys(dados.palpites);
      const contFam: Record<string, number> = {};
      slugs.forEach((slug) => {
        const f = familiaDe(slug);
        contFam[f] = (contFam[f] ?? 0) + 1;
      });

      const slugsFiltrados =
        familiaFiltro === "all"
          ? slugs
          : slugs.filter((s) => familiaDe(s) === familiaFiltro);

      const contagem: Record<string, ConsensoLocal> = {};
      slugsFiltrados.forEach((slug) => {
        const p = dados.palpites[slug];
        const key = `${p.gols_a}-${p.gols_b}`;
        if (!contagem[key]) {
          contagem[key] = {
            gols_a: p.gols_a,
            gols_b: p.gols_b,
            votos: 0,
            ias: [],
          };
        }
        contagem[key].votos += 1;
        contagem[key].ias.push(slug);
      });
      const consenso = Object.values(contagem).sort((a, b) => {
        if (b.votos !== a.votos) return b.votos - a.votos;
        return b.gols_a + b.gols_b - (a.gols_a + a.gols_b);
      });

      const familias = ORDEM_POPULARIDADE.filter((f) => contFam[f])
        .map((f) => ({ familia: f, count: contFam[f] }));

      return {
        consensoFiltrado: consenso,
        totalFiltrado: slugsFiltrados.length,
        familiasChips: familias,
        bolaFiltrada: consenso[0] ?? null,
      };
    }, [dados, familiaFiltro]);

  if (!dados || !dados.palpites || Object.keys(dados.palpites).length === 0) {
    return null;
  }

  const palpiteIA = iaEscolhida ? dados.palpites[iaEscolhida] : null;
  const iasOrdenadas = Object.keys(dados.palpites)
    .filter((s) =>
      familiaFiltro === "all" ? true : familiaDe(s) === familiaFiltro,
    )
    .sort((a, b) => scorePopularidade(a) - scorePopularidade(b));

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        title={`Usar palpite de IA pra ${timeA} × ${timeB}`}
        className="btn-sugestao"
        aria-label="Sugestões das IAs"
      >
        <span style={{ fontSize: 16 }}>✨</span>
        <span className="btn-sugestao-lbl">Sugerir</span>
      </button>

      {aberto && (
        <div
          className="modal-backdrop-sugestao"
          onClick={() => setAberto(false)}
        >
          <div
            className="modal-sugestao"
            onClick={(e) => e.stopPropagation()}
          >
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
                  Jogo #{jogoNumero}
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "nowrap",
                    overflow: "hidden",
                  }}
                >
                  <Bandeira iso={isoA} nome={timeA} size={24} />
                  <h3
                    style={{
                      fontSize: 18,
                      margin: 0,
                      color: "var(--fg)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      flexShrink: 1,
                    }}
                  >
                    {timeA} × {timeB}
                  </h3>
                  <Bandeira iso={isoB} nome={timeB} size={24} />
                </div>
              </div>
              <button
                onClick={() => setAberto(false)}
                aria-label="Fechar"
                className="modal-close-btn"
              >
                ✕
              </button>
            </div>

            <div style={{ padding: 24 }}>
              <h4
                style={{
                  fontFamily: "var(--ff-mono)",
                  fontSize: 11,
                  color: "var(--fg-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 10,
                }}
              >
                Filtrar por família de IA
              </h4>
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  marginBottom: 22,
                  flexWrap: "wrap",
                }}
              >
                <ChipFamilia
                  ativo={familiaFiltro === "all"}
                  onClick={() => setFamiliaFiltro("all")}
                  emoji="🌐"
                  label="Todas"
                  count={Object.keys(dados.palpites).length}
                />
                {familiasChips.map((f) => (
                  <ChipFamilia
                    key={f.familia}
                    ativo={familiaFiltro === f.familia}
                    onClick={() => setFamiliaFiltro(f.familia)}
                    emoji={MARCAS[f.familia].emoji}
                    label={MARCAS[f.familia].nome}
                    count={f.count}
                    cor={MARCAS[f.familia].cor}
                  />
                ))}
              </div>

              {bolaFiltrada && (
                <div
                  style={{
                    background:
                      familiaFiltro === "all"
                        ? "linear-gradient(135deg, color-mix(in srgb, var(--accent) 12%, transparent), color-mix(in srgb, var(--primary) 8%, transparent))"
                        : "linear-gradient(135deg, color-mix(in srgb, var(--primary) 10%, transparent), color-mix(in srgb, var(--secondary) 6%, transparent))",
                    border: `2px solid ${familiaFiltro === "all" ? "var(--accent)" : "var(--primary)"}`,
                    borderRadius: "var(--r-m)",
                    padding: 18,
                    marginBottom: 20,
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <span style={{ fontSize: 40 }}>
                    {familiaFiltro === "all"
                      ? "🔮"
                      : MARCAS[familiaFiltro].emoji}
                  </span>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: 16, color: "var(--fg)" }}>
                      {familiaFiltro === "all"
                        ? "Consenso geral"
                        : `Mais votado por ${MARCAS[familiaFiltro].nome}`}
                    </strong>
                    <p
                      style={{
                        fontSize: 12,
                        color: "var(--fg-muted)",
                        margin: "2px 0 0",
                      }}
                    >
                      {bolaFiltrada.votos} de {totalFiltrado} IAs concordam
                    </p>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontFamily: "var(--ff-mono)",
                        fontWeight: 800,
                        fontSize: 26,
                        color: "var(--primary)",
                      }}
                    >
                      {bolaFiltrada.gols_a}×{bolaFiltrada.gols_b}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onPick(bolaFiltrada.gols_a, bolaFiltrada.gols_b);
                      setAberto(false);
                    }}
                    className="btn primary small"
                  >
                    Usar
                  </button>
                </div>
              )}

              {consensoFiltrado.length > 1 && (
                <>
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
                    Outros placares votados
                  </h4>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      marginBottom: 24,
                    }}
                  >
                    {consensoFiltrado.slice(1, 6).map((c) => (
                      <div
                        key={`${c.gols_a}-${c.gols_b}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: 10,
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
                            minWidth: 56,
                          }}
                        >
                          {c.gols_a}×{c.gols_b}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
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
                                width: `${(c.votos / totalFiltrado) * 100}%`,
                                background: "var(--fg-mid)",
                              }}
                            />
                          </div>
                          <div
                            style={{
                              display: "flex",
                              gap: 4,
                              alignItems: "center",
                              marginTop: 6,
                              flexWrap: "wrap",
                            }}
                          >
                            <span
                              style={{
                                fontSize: 11,
                                color: "var(--fg-muted)",
                                fontFamily: "var(--ff-mono)",
                              }}
                            >
                              {c.votos} {c.votos === 1 ? "voto" : "votos"}
                            </span>
                            {c.ias.slice(0, 6).map((s) => (
                              <IconeIA
                                key={s}
                                slug={s}
                                size={18}
                                title={iasDict[s] ?? s}
                              />
                            ))}
                            {c.ias.length > 6 && (
                              <span
                                style={{
                                  fontSize: 10,
                                  color: "var(--fg-muted)",
                                  fontFamily: "var(--ff-mono)",
                                }}
                              >
                                +{c.ias.length - 6}
                              </span>
                            )}
                          </div>
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
                </>
              )}

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
                Ou pega de uma IA específica
              </h4>
              <select
                value={iaEscolhida}
                onChange={(e) => setIaEscolhida(e.target.value)}
                className="input"
                style={{ marginBottom: 12, cursor: "pointer" }}
              >
                <option value="">— Escolher IA (popular primeiro) —</option>
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
                    padding: 14,
                    borderRadius: "var(--r-m)",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    border: "1px solid var(--line)",
                  }}
                >
                  <IconeIA slug={iaEscolhida} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong
                      style={{
                        fontSize: 15,
                        color: "var(--fg)",
                        display: "block",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {iasDict[iaEscolhida] ?? iaEscolhida}
                    </strong>
                    <p
                      style={{
                        fontSize: 11,
                        color: "var(--fg-muted)",
                        fontFamily: "var(--ff-mono)",
                        margin: 0,
                      }}
                    >
                      {MARCAS[familiaDe(iaEscolhida)].nome}
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

function ChipFamilia({
  ativo,
  onClick,
  emoji,
  label,
  count,
  cor,
}: {
  ativo: boolean;
  onClick: () => void;
  emoji: string;
  label: string;
  count: number;
  cor?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 12px",
        borderRadius: 999,
        border: `1.5px solid ${ativo ? cor ?? "var(--primary)" : "var(--line-strong)"}`,
        background: ativo
          ? `color-mix(in srgb, ${cor ?? "var(--primary)"} 12%, transparent)`
          : "var(--bg-2)",
        color: ativo ? cor ?? "var(--primary)" : "var(--fg)",
        fontFamily: "var(--ff-sans)",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.15s ease",
        whiteSpace: "nowrap",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span style={{ fontSize: 14 }}>{emoji}</span>
      {label}{" "}
      <span
        style={{
          opacity: 0.6,
          fontFamily: "var(--ff-mono)",
          fontSize: 11,
        }}
      >
        {count}
      </span>
    </button>
  );
}
