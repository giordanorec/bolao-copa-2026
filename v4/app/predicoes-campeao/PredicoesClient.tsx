"use client";

/**
 * PredicoesClient — visualização da jornada de campeão prevista por cada IA
 * (mais a Bola de Cristal = consenso majoritário).
 *
 * Layout:
 *   1) Bola de Cristal em card grande no topo, com jornada completa
 *      R32 → Oitavas → Quartas → Semi → Final animada por "bolinha" que passeia.
 *   2) Grid de IAs (uma por card) — cada uma mostra seu campeão + botão
 *      "ver jornada" que expande e reproduz a mesma animação em miniatura.
 *   3) Bolinha animada percorre as 5 bandeiras em loop de 5s, destacando cada
 *      fase por vez. Sem SVG complexo — só CSS transitions + flex.
 */

import { useState, useEffect } from "react";
import IconeIA from "@/components/IconeIA";

type Fase = "R32" | "Oitavas" | "Quartas" | "Semifinal" | "Final";
type JornadaJSON = Record<Fase, Record<string, string>>;

export type IAPredicao = {
  slug: string;
  nome: string;
  campeao: string;
  jornada: JornadaJSON;
};

export type CristalPredicao = {
  campeao: string;
  jornada: JornadaJSON;
  votos_totais: number;
};

export type R32Confronto = {
  jogo: number;
  timeA: string;
  timeB: string;
};

type Props = {
  cristal: CristalPredicao | null;
  ias: IAPredicao[];
  mapaPaises: Record<string, string>;
  r32Confrontos: R32Confronto[];
  labels: { cristal: string; ias: string };
};

// ─── Derivação da jornada do campeão ────────────────────────────────────────

// Mapa de pareamentos das fases seguintes — igual ao FASES em
// scripts/simular_campeao_web.js. Fixado aqui pra evitar dependência.
const PAIRINGS: Record<Fase, { j: number; wa: number; wb: number }[]> = {
  R32: [], // R32 não tem pairings anteriores
  Oitavas: [
    { j: 89, wa: 74, wb: 77 },
    { j: 90, wa: 73, wb: 75 },
    { j: 91, wa: 76, wb: 78 },
    { j: 92, wa: 79, wb: 80 },
    { j: 93, wa: 83, wb: 84 },
    { j: 94, wa: 81, wb: 82 },
    { j: 95, wa: 86, wb: 88 },
    { j: 96, wa: 85, wb: 87 },
  ],
  Quartas: [
    { j: 97, wa: 89, wb: 90 },
    { j: 98, wa: 93, wb: 94 },
    { j: 99, wa: 91, wb: 92 },
    { j: 100, wa: 95, wb: 96 },
  ],
  Semifinal: [
    { j: 101, wa: 97, wb: 98 },
    { j: 102, wa: 99, wb: 100 },
  ],
  Final: [{ j: 104, wa: 101, wb: 102 }],
};

/**
 * Deriva a jornada do CAMPEÃO como lista dos OPONENTES em cada fase
 * (R32 → Oitavas → Quartas → Semifinal). Se a jornada da IA estiver
 * incompleta (o parser falhou em alguma fase), usa o Cristal como
 * fallback pra traçar o caminho — no waterfall todas as IAs viram os
 * MESMOS confrontos, então usar Cristal pra localizar o campeão em
 * cada fase é sempre coerente.
 */
function derivarJornadaDoCampeao(
  jornada: JornadaJSON,
  r32Confrontos: R32Confronto[],
  cristalFallback?: JornadaJSON | null,
): { fase: Fase; oponente: string }[] {
  const finalMap = jornada.Final ?? {};
  const campeao = finalMap[104];
  if (!campeao || campeao === "???") return [];

  // Helper: pega o vencedor de um jogo em uma fase, preferindo a jornada
  // da IA e caindo pro Cristal se a IA não tem dado ali.
  function pegar(fase: Fase, jogo: number): string | undefined {
    const ia = jornada[fase]?.[String(jogo)];
    if (ia && ia !== "???") return ia;
    return cristalFallback?.[fase]?.[String(jogo)];
  }

  // Trilha reversa: descobrir em qual jogo o campeão jogou em cada fase.
  const jogosDoCampeao: Partial<Record<Fase, number>> = { Final: 104 };
  const OrdemDesc: Array<[Fase, Fase]> = [
    ["Final", "Semifinal"],
    ["Semifinal", "Quartas"],
    ["Quartas", "Oitavas"],
    ["Oitavas", "R32"],
  ];
  for (const [fase, anterior] of OrdemDesc) {
    const jogo = jogosDoCampeao[fase];
    if (jogo == null) break;
    const pair = PAIRINGS[fase].find((p) => p.j === jogo);
    if (!pair) break;
    const wa = pegar(anterior, pair.wa);
    const wb = pegar(anterior, pair.wb);
    if (wa === campeao) jogosDoCampeao[anterior] = pair.wa;
    else if (wb === campeao) jogosDoCampeao[anterior] = pair.wb;
    else {
      // IA incoerente com o bracket (ex.: Manus disse J90=França mas
      // J75=Marrocos, J76=Brasil — França não estava nesse confronto).
      // Fallback puro pro Cristal: se o Cristal também levou o mesmo
      // campeão até a Final, usa a rota do Cristal daqui pra baixo.
      const waC = cristalFallback?.[anterior]?.[String(pair.wa)];
      const wbC = cristalFallback?.[anterior]?.[String(pair.wb)];
      if (waC === campeao) jogosDoCampeao[anterior] = pair.wa;
      else if (wbC === campeao) jogosDoCampeao[anterior] = pair.wb;
      else break;
    }
  }

  // Oponentes em cada fase (R32 → Semifinal)
  const r32ConfrontoMap = new Map(r32Confrontos.map((c) => [c.jogo, c]));
  const path: { fase: Fase; oponente: string }[] = [];
  const ordem: Fase[] = ["R32", "Oitavas", "Quartas", "Semifinal"];
  for (const fase of ordem) {
    const jogo = jogosDoCampeao[fase];
    if (jogo == null) break;

    let oponente = "???";
    if (fase === "R32") {
      const conf = r32ConfrontoMap.get(jogo);
      if (conf) {
        oponente = conf.timeA === campeao ? conf.timeB : conf.timeA;
      }
    } else {
      const faseAnterior: Fase =
        fase === "Oitavas"
          ? "R32"
          : fase === "Quartas"
            ? "Oitavas"
            : "Quartas";
      const pair = PAIRINGS[fase].find((p) => p.j === jogo);
      if (pair) {
        const wa = pegar(faseAnterior, pair.wa);
        const wb = pegar(faseAnterior, pair.wb);
        oponente = wa === campeao ? wb ?? "???" : wa ?? "???";
      }
    }
    path.push({ fase, oponente });
  }
  return path;
}

const FASE_LABELS: Record<Fase, string> = {
  R32: "R32",
  Oitavas: "Oitavas",
  Quartas: "Quartas",
  Semifinal: "Semifinal",
  Final: "Final",
};

// ─── Componente de bandeira redonda ─────────────────────────────────────────

function flagUrl(iso: string): string {
  return `https://hatscripts.github.io/circle-flags/flags/${iso.toLowerCase()}.svg`;
}

function BandeiraCircular({
  time,
  iso,
  size,
  destaque,
}: {
  time: string;
  iso?: string;
  size: number;
  destaque: boolean;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        position: "relative",
        border: destaque ? "3px solid #FFD700" : "2px solid rgba(255,255,255,0.2)",
        boxShadow: destaque
          ? "0 0 24px rgba(255,215,0,0.55), 0 0 8px rgba(255,215,0,0.4)"
          : "0 2px 8px rgba(0,0,0,0.35)",
        transition: "all 0.4s ease",
        background: "rgba(255,255,255,0.05)",
        flexShrink: 0,
      }}
      title={time}
    >
      {iso && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={flagUrl(iso)}
          alt={time}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      )}
      {!iso && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            fontSize: size * 0.3,
            fontWeight: 700,
            color: "rgba(255,255,255,0.5)",
          }}
        >
          ?
        </div>
      )}
    </div>
  );
}

// ─── Trilha animada — bolinha que passeia pelas fases ───────────────────────

function TrilhaJornada({
  jornada,
  campeao,
  mapaPaises,
  r32Confrontos,
  cristalFallback,
  compact = false,
}: {
  jornada: JornadaJSON;
  campeao: string;
  mapaPaises: Record<string, string>;
  r32Confrontos: R32Confronto[];
  cristalFallback?: JornadaJSON | null;
  compact?: boolean;
}) {
  const oponentes = derivarJornadaDoCampeao(jornada, r32Confrontos, cristalFallback);

  // Cada "passo" na animação = 1 oponente derrotado + o passo final (taça)
  const totalPassos = oponentes.length + 1;
  const [foco, setFoco] = useState(0);

  useEffect(() => {
    if (totalPassos <= 1) return;
    const t = setInterval(() => {
      setFoco((f) => (f + 1) % totalPassos);
    }, 1300);
    return () => clearInterval(t);
  }, [totalPassos]);

  if (oponentes.length === 0) {
    return (
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textAlign: "center" }}>
        (previsão incompleta)
      </p>
    );
  }

  const flagSize = compact ? 44 : 66;
  const finalSize = compact ? 56 : 84;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: compact ? 6 : 10,
        flexWrap: "nowrap",
        overflowX: "auto",
        padding: "8px 4px",
      }}
    >
      {oponentes.map((o, i) => {
        const iso = mapaPaises[o.oponente];
        return (
          <div
            key={`${o.fase}-${i}`}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              minWidth: flagSize + 10,
            }}
          >
            <span
              style={{
                fontSize: compact ? 9 : 10,
                fontFamily: "monospace",
                letterSpacing: 0.5,
                color: i === foco ? "#FFD700" : "rgba(255,255,255,0.35)",
                textTransform: "uppercase",
                transition: "color 0.3s",
              }}
            >
              {FASE_LABELS[o.fase]}
            </span>
            <BandeiraCircular
              time={o.oponente}
              iso={iso}
              size={flagSize}
              destaque={i === foco}
            />
            <span
              style={{
                fontSize: compact ? 10 : 12,
                fontWeight: 500,
                color: i === foco ? "#fff" : "rgba(255,255,255,0.6)",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                overflow: "hidden",
                maxWidth: flagSize + 24,
                textAlign: "center",
                transition: "color 0.3s",
              }}
              title={o.oponente}
            >
              {o.oponente === "???" ? "?" : o.oponente}
            </span>
          </div>
        );
      })}

      {/* Seta separadora antes do campeão */}
      <span
        style={{
          fontSize: compact ? 18 : 24,
          color: "rgba(255,215,0,0.5)",
          alignSelf: "center",
          marginTop: compact ? 8 : 12,
        }}
      >
        →
      </span>

      {/* Campeão + taça */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          minWidth: finalSize + 16,
        }}
      >
        <span
          style={{
            fontSize: compact ? 9 : 10,
            fontFamily: "monospace",
            letterSpacing: 0.5,
            color: foco === oponentes.length ? "#FFD700" : "rgba(255,255,255,0.35)",
            textTransform: "uppercase",
            transition: "color 0.3s",
          }}
        >
          Campeão
        </span>
        <BandeiraCircular
          time={campeao}
          iso={mapaPaises[campeao]}
          size={finalSize}
          destaque={foco === oponentes.length}
        />
        <span
          style={{
            fontSize: compact ? 12 : 14,
            fontWeight: 700,
            color: "#4ADE80",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            overflow: "hidden",
            maxWidth: finalSize + 24,
            textAlign: "center",
          }}
        >
          {campeao}
        </span>
        <span style={{ fontSize: compact ? 18 : 24, lineHeight: 1 }}>🏆</span>
      </div>
    </div>
  );
}

// ─── Componente principal ───────────────────────────────────────────────────

export default function PredicoesClient({
  cristal,
  ias,
  mapaPaises,
  r32Confrontos,
  labels,
}: Props) {
  const [modalSrc, setModalSrc] = useState<string | null>(null);
  return (
    <>
      {/* ── CRISTAL ── */}
      {cristal && (
        <section
          style={{
            padding: "32px 24px",
            background:
              "linear-gradient(135deg, rgba(255,215,0,0.08), rgba(139,92,246,0.06))",
            border: "1px solid rgba(255,215,0,0.25)",
            borderRadius: 20,
            marginBottom: 40,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: 2,
              color: "#FFD700",
              fontWeight: 700,
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            {labels.cristal} · {cristal.votos_totais} votos
          </div>
          <h2
            style={{
              fontSize: "clamp(24px, 3.5vw, 36px)",
              fontWeight: 900,
              margin: "0 0 22px",
              color: "#fff",
              letterSpacing: -0.5,
            }}
          >
            🔮 {cristal.campeao}
          </h2>
          <TrilhaJornada
            jornada={cristal.jornada}
            campeao={cristal.campeao}
            mapaPaises={mapaPaises}
            r32Confrontos={r32Confrontos}
          />
          <button
            type="button"
            onClick={() => setModalSrc("/design/chaveamento/index.html?ia=_bola-de-cristal")}
            style={{
              marginTop: 20,
              padding: "12px 26px",
              background: "linear-gradient(180deg, #FFD700, #F0B400)",
              color: "#0a0e1a",
              border: 0,
              borderRadius: 999,
              fontWeight: 800,
              fontSize: 14,
              cursor: "pointer",
              letterSpacing: 0.2,
              boxShadow: "0 8px 24px rgba(255,215,0,0.25)",
            }}
          >
            🎬 Ver simulação do consenso →
          </button>
        </section>
      )}

      {/* ── IAs ── */}
      {ias.length > 0 && (
        <>
          <h3
            style={{
              fontSize: 15,
              letterSpacing: 1.5,
              color: "rgba(255,255,255,0.5)",
              fontWeight: 700,
              textTransform: "uppercase",
              marginBottom: 20,
              textAlign: "center",
            }}
          >
            {labels.ias}
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 16,
            }}
          >
            {ias.map((ia) => (
              <div
                key={ia.slug}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 14,
                  padding: "20px 16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 12,
                  }}
                >
                  <IconeIA slug={ia.slug} size={28} />
                  <strong
                    style={{
                      fontSize: 14,
                      color: "#fff",
                    }}
                  >
                    {ia.nome}
                  </strong>
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#4ADE80",
                    }}
                  >
                    🏆 {ia.campeao}
                  </span>
                </div>
                <TrilhaJornada
                  jornada={ia.jornada}
                  campeao={ia.campeao}
                  mapaPaises={mapaPaises}
                  r32Confrontos={r32Confrontos}
                  cristalFallback={cristal?.jornada ?? null}
                  compact
                />
                <button
                  type="button"
                  onClick={() => setModalSrc(`/design/chaveamento/index.html?ia=${encodeURIComponent(ia.slug)}`)}
                  style={{
                    marginTop: 14,
                    width: "100%",
                    padding: "10px 14px",
                    background: "linear-gradient(180deg, #FFD700, #F0B400)",
                    color: "#0a0e1a",
                    border: 0,
                    borderRadius: 999,
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: "pointer",
                    letterSpacing: 0.2,
                  }}
                >
                  🎬 Ver simulação →
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {modalSrc && (
        <div
          onClick={() => setModalSrc(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              width: "min(1400px, 96vw)",
              height: "min(85vh, 900px)",
              background: "#0a0e16",
              borderRadius: 14,
              overflow: "hidden",
              boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
            }}
          >
            <button
              type="button"
              onClick={() => setModalSrc(null)}
              aria-label="Fechar"
              style={{
                position: "absolute",
                top: 10,
                right: 12,
                zIndex: 2,
                background: "rgba(0,0,0,0.6)",
                color: "#fff",
                border: 0,
                borderRadius: 999,
                width: 36,
                height: 36,
                fontSize: 20,
                cursor: "pointer",
              }}
            >
              ×
            </button>
            <iframe
              src={modalSrc}
              title="Simulação"
              style={{ width: "100%", height: "100%", border: 0 }}
            />
          </div>
        </div>
      )}
    </>
  );
}
