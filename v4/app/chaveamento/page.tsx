/**
 * /chaveamento — Bracket mata-mata Copa 2026.
 * Flag-first: cada time é uma BANDEIRA GRANDE (70-90px), linhas são trilhos.
 * 4 variações visuais distintas na mesma página.
 *
 * NÃO listada no nav, sem sitemap, com noindex.
 *
 * Workaround: J74 (Alemanha×Paraguai) e J75 (Países Baixos×Marrocos) terminaram
 * 1×1 em 90 min e foram decididos nos pênaltis. O avanço está hardcoded abaixo.
 */

import { promises as fs } from "fs";
import path from "path";
import { carregarJogos } from "@/lib/jogos";
import { carregarMapaPaises } from "@/lib/paises";
import type { Jogo } from "@/lib/types";

export const metadata = {
  robots: { index: false, follow: false },
  title: "Chaveamento (teste) · Bolão das IAs",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type Resultado = { jogo_numero: number; gols_a: number; gols_b: number };

type SlotTime = {
  nome: string;
  iso?: string;
  eliminado?: boolean;
};

type Confronto = {
  numero: number;
  fase: string;
  data: string;
  local: string;
  timeA: SlotTime;
  timeB: SlotTime;
  gols_a: number | null;
  gols_b: number | null;
  vencedor?: "a" | "b" | null;
};

// ─── Workaround pênaltis ──────────────────────────────────────────────────────
const PENALTY_WINNER: Record<number, "a" | "b"> = {
  74: "b", // Paraguai avança
  75: "b", // Marrocos avança
};

// ─── Country colors ───────────────────────────────────────────────────────────
const COUNTRY_COLOR: Record<string, string> = {
  Brasil: "#009C3B",
  Argentina: "#74ACDF",
  França: "#0055A4",
  Alemanha: "#000000",
  Espanha: "#AA151B",
  Portugal: "#006600",
  Inglaterra: "#CF091B",
  Bélgica: "#EF3340",
  "Países Baixos": "#FF6600",
  México: "#006847",
  Canadá: "#FF0000",
  Paraguai: "#D52B1E",
  Marrocos: "#C1272D",
  Japão: "#BC002D",
  Noruega: "#EF2B2D",
  Equador: "#FFD100",
  Suíça: "#FF0000",
  Austrália: "#00843D",
  "Estados Unidos": "#002868",
  Colômbia: "#FCD116",
  "Costa do Marfim": "#F77F00",
  Croácia: "#FF0000",
  Senegal: "#00853F",
};

function teamColor(nome: string): string {
  return COUNTRY_COLOR[nome] ?? "#FFD700";
}

function isBrasil(nome: string): boolean {
  return nome === "Brasil";
}

// ─── Data loading ──────────────────────────────────────────────────────────────

async function carregarResultados(): Promise<Map<number, Resultado>> {
  const fp = path.join(process.cwd(), "public", "resultados.json");
  try {
    const raw = await fs.readFile(fp, "utf-8");
    const arr = JSON.parse(raw) as Resultado[];
    return new Map(arr.map((r) => [r.jogo_numero, r]));
  } catch {
    return new Map();
  }
}

// ─── Bracket resolution ────────────────────────────────────────────────────────

function resolverVencedor(
  jogo: Jogo,
  resultado: Resultado | undefined,
): "a" | "b" | null {
  if (PENALTY_WINNER[jogo.numero]) {
    if (resultado) return PENALTY_WINNER[jogo.numero];
  }
  if (!resultado) return null;
  const { gols_a, gols_b } = resultado;
  if (gols_a > gols_b) return "a";
  if (gols_b > gols_a) return "b";
  return null;
}

function resolverTime(nome: string, mapaPaises: Record<string, string>): SlotTime {
  if (nome.startsWith("Venc.") || nome.startsWith("Perd.")) return { nome };
  return { nome, iso: mapaPaises[nome] };
}

function buildBracket(
  jogos: Jogo[],
  resultados: Map<number, Resultado>,
  mapaPaises: Record<string, string>,
): Map<number, Confronto> {
  const map = new Map<number, Confronto>();
  const vencedorDoJogo: Map<number, SlotTime> = new Map();
  const jogoMap = new Map(jogos.map((j) => [j.numero, j]));

  for (let n = 73; n <= 104; n++) {
    const jogo = jogoMap.get(n);
    if (!jogo) continue;
    const resultado = resultados.get(n);

    let slotA: SlotTime;
    let slotB: SlotTime;

    const matchA = jogo.time_a.match(/^Venc\.\s*J(\d+)$/);
    const matchB = jogo.time_b.match(/^Venc\.\s*J(\d+)$/);
    const matchPerdA = jogo.time_a.match(/^Perd\.\s*J(\d+)$/);
    const matchPerdB = jogo.time_b.match(/^Perd\.\s*J(\d+)$/);

    if (matchA && vencedorDoJogo.has(Number(matchA[1]))) {
      slotA = { ...vencedorDoJogo.get(Number(matchA[1]))! };
    } else if (matchPerdA) {
      slotA = { nome: jogo.time_a };
    } else {
      slotA = resolverTime(jogo.time_a, mapaPaises);
    }

    if (matchB && vencedorDoJogo.has(Number(matchB[1]))) {
      slotB = { ...vencedorDoJogo.get(Number(matchB[1]))! };
    } else if (matchPerdB) {
      slotB = { nome: jogo.time_b };
    } else {
      slotB = resolverTime(jogo.time_b, mapaPaises);
    }

    const venc = resolverVencedor(jogo, resultado);

    if (venc === "a") {
      vencedorDoJogo.set(n, slotA);
      slotB = { ...slotB, eliminado: true };
    } else if (venc === "b") {
      vencedorDoJogo.set(n, slotB);
      slotA = { ...slotA, eliminado: true };
    }

    map.set(n, {
      numero: n,
      fase: jogo.fase,
      data: jogo.data,
      local: jogo.local,
      timeA: slotA,
      timeB: slotB,
      gols_a: resultado?.gols_a ?? null,
      gols_b: resultado?.gols_b ?? null,
      vencedor: venc,
    });
  }

  return map;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function placarStr(c: Confronto): string {
  if (c.gols_a === null || c.gols_b === null) return "";
  if (PENALTY_WINNER[c.numero]) return `${c.gols_a}×${c.gols_b} pen.`;
  return `${c.gols_a}×${c.gols_b}`;
}

function shortName(nome: string, max = 11): string {
  if (nome.startsWith("Venc.") || nome.startsWith("Perd.")) return "?";
  if (nome.length <= max) return nome;
  const abbr: Record<string, string> = {
    "Países Baixos": "P. Baixos",
    "Costa do Marfim": "C. Marfim",
    "África do Sul": "Áf. Sul",
    "Estados Unidos": "EUA",
    "Bósnia-Herzegovina": "Bósnia",
    "Nova Zelândia": "NZ",
    "Arábia Saudita": "Ar. Saudita",
    "Congo (RD)": "Congo RD",
    "República Tcheca": "R. Tcheca",
  };
  return abbr[nome] ?? nome.slice(0, max - 1) + "…";
}

// ─── Shared: FlagCircle SVG element ───────────────────────────────────────────
// Renders a circular flag via <image> inside SVG.
// For "unknown" slots (Venc. J##), renders a question-mark circle.

function FlagCircleSVG({
  slot,
  cx,
  cy,
  r,
  active,
}: {
  slot: SlotTime;
  cx: number;
  cy: number;
  r: number;
  active: boolean;
}) {
  const isUnknown = slot.nome.startsWith("Venc.") || slot.nome.startsWith("Perd.");
  const eliminated = !!slot.eliminado && !active;
  const opacity = isUnknown ? 0.25 : eliminated ? 0.32 : 1;
  const brasil = isBrasil(slot.nome);
  const glowColor = brasil ? "#009C3B" : teamColor(slot.nome);

  const flagUrl = slot.iso
    ? `https://hatscripts.github.io/circle-flags/flags/${slot.iso}.svg`
    : null;

  return (
    <g opacity={opacity}>
      {/* Glow for active teams */}
      {active && !isUnknown && (
        <circle
          cx={cx}
          cy={cy}
          r={r + 8}
          fill="none"
          stroke={glowColor}
          strokeWidth={brasil ? 4 : 2}
          opacity={brasil ? 0.55 : 0.35}
        >
          <animate
            attributeName="opacity"
            values={brasil ? "0.55;0.85;0.55" : "0.25;0.45;0.25"}
            dur={brasil ? "2s" : "3s"}
            repeatCount="indefinite"
          />
          <animate
            attributeName="r"
            values={`${r + 6};${r + 10};${r + 6}`}
            dur={brasil ? "2s" : "3s"}
            repeatCount="indefinite"
          />
        </circle>
      )}

      {/* Clip for circular image */}
      <clipPath id={`clip-${slot.iso ?? slot.nome.replace(/\s/g, "_")}-${cx}-${cy}`}>
        <circle cx={cx} cy={cy} r={r} />
      </clipPath>

      {/* Flag image or placeholder */}
      {flagUrl ? (
        <image
          href={flagUrl}
          x={cx - r}
          y={cy - r}
          width={r * 2}
          height={r * 2}
          clipPath={`url(#clip-${slot.iso ?? slot.nome.replace(/\s/g, "_")}-${cx}-${cy})`}
          preserveAspectRatio="xMidYMid slice"
        />
      ) : (
        <circle cx={cx} cy={cy} r={r} fill="rgba(255,255,255,0.08)" />
      )}

      {/* Border */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={active && !isUnknown ? (brasil ? "#009C3B" : "rgba(255,255,255,0.7)") : "rgba(255,255,255,0.2)"}
        strokeWidth={active && !isUnknown ? (brasil ? 3 : 2) : 1}
      />

      {/* Unknown "?" */}
      {isUnknown && (
        <text
          x={cx}
          y={cy + 6}
          textAnchor="middle"
          fontSize={r * 0.8}
          fontFamily="system-ui, sans-serif"
          fill="rgba(255,255,255,0.4)"
          fontWeight="300"
        >
          ?
        </text>
      )}
    </g>
  );
}

// ─── VARIAÇÃO 1: Metro Horizontal ─────────────────────────────────────────────
// 5 colunas (R32 → R16 → QF → SF → Final), esquerda → direita.
// Left side top, right side mirrored bottom.
// Bandeiras grandes como estações, trilhos curvos (Bezier) entre fases.

// Layout parameters
const V1_VBW = 1500;
const V1_VBH = 1000;
const V1_FLAG_R = 34; // radius of flag circle
const V1_COL_X = [50, 340, 600, 830, 1010, 1190, 1360]; // phase col centers (sym)
// Phases from left: R32_L, R16_L, QF_L, SF_L, FINAL, SF_R, QF_R, R16_R, R32_R
// Simplified: left R32→R16→QF→SF→FINAL←SF←QF←R16←R32 right
// We use a single center column for FINAL and mirror left/right

const V1_PHASE_CX = {
  leftR32: 80,
  leftR16: 310,
  leftQF: 530,
  leftSF: 720,
  final: 900,
  rightSF: 1080,
  rightQF: 1270,
  rightR16: 1460,
  rightR32: 1660,
};

// 8 slots per side, spaced evenly
const V1_TOP_MARGIN = 60;
const V1_SLOT_H = 106; // vertical spacing between slots

function v1SlotY(idx: number): number {
  return V1_TOP_MARGIN + idx * V1_SLOT_H + V1_FLAG_R;
}

// Midpoint Y between two slots
function v1MidY(a: number, b: number): number {
  return (v1SlotY(a) + v1SlotY(b)) / 2;
}

// Left bracket slot ordering (visual top→bottom):
// R32: J73,J75 → R16 J90; J74,J77 → R16 J89; J76,J78 → R16 J91; J79,J80 → R16 J92
const LEFT_R32_ORDER = [73, 75, 74, 77, 76, 78, 79, 80];
const LEFT_R16_ORDER = [90, 89, 91, 92]; // index 0=top pair, 1=next, etc.
const LEFT_QF_ORDER = [97, 99];
const LEFT_SF = 101;

// Right bracket slot ordering (visual top→bottom, mirrors left)
// J94=W81+W82, J93=W83+W84, J95=W86+W88, J96=W85+W87
const RIGHT_R32_ORDER = [81, 82, 83, 84, 86, 88, 85, 87];
const RIGHT_R16_ORDER = [94, 93, 95, 96];
const RIGHT_QF_ORDER = [98, 100];
const RIGHT_SF = 102;

function V1BezierPath({
  x1, y1, x2, y2, color, width = 1.5,
}: { x1: number; y1: number; x2: number; y2: number; color?: string; width?: number }) {
  const mx = (x1 + x2) / 2;
  const d = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
  return (
    <path
      d={d}
      fill="none"
      stroke={color ?? "rgba(255,255,255,0.18)"}
      strokeWidth={width}
      strokeLinecap="round"
    />
  );
}

function V1SlotFlag({
  c, side, slotIdx, bracket,
}: {
  c: Confronto;
  side: "a" | "b";
  slotIdx: number;
  bracket: Map<number, Confronto>;
}) {
  const slot = side === "a" ? c.timeA : c.timeB;
  const won = c.vencedor === side;
  const lost = c.vencedor !== null && c.vencedor !== side;
  const cx = V1_PHASE_CX.leftR32;
  const cy = v1SlotY(slotIdx);
  void bracket; // used by parent
  return (
    <g>
      <FlagCircleSVG slot={slot} cx={cx} cy={cy} r={V1_FLAG_R} active={!lost && !slot.eliminado} />
      {won && (
        <text x={cx + V1_FLAG_R + 6} y={cy + 4} fontSize={9} fill="#FFD700" fontFamily="JetBrains Mono, monospace">W</text>
      )}
    </g>
  );
}

function V1Metro({ bracket }: { bracket: Map<number, Confronto> }) {
  const get = (n: number) => bracket.get(n)!;
  const VBW = 1740;
  const VBH = 960;

  // Compute all slot positions
  // Left R32: each game has 2 teams → 8 total but we show the 2 per game side by side, vertically
  // Actually we show 1 flag per R32 game (the winner or a "vs" representation)
  // Better: show BOTH teams of each R32 game at R32 column, then winner moves right
  // Layout: each R32 game occupies 2 rows (timeA top, timeB bottom), with group spacing

  // Let's do: 8 R32 games × 2 teams = 16 rows, grouped by game (small gap between games)
  // Flag R = 24 for R32 to fit, larger for later rounds
  const r32R = 26;
  const r16R = 30;
  const qfR = 36;
  const sfR = 42;
  const finR = 52;

  const GAP_GAME = 8;  // gap between the 2 teams in a game
  const GAP_BTW = 28;  // gap between games

  // Compute Y centers for all 16 R32 slots (8 games × 2 teams)
  // Game i: teamA at y_base + i*(2*(r+padding) + GAP_GAME + GAP_BTW) + r
  //         teamB at teamA_y + 2*r + GAP_GAME
  const r32Padding = 4;
  function r32TeamY(gameIdx: number, teamIdx: 0 | 1): number {
    const gameTop = 40 + gameIdx * (2 * (r32R + r32Padding) * 2 + GAP_GAME + GAP_BTW);
    const teamA_y = gameTop + r32R + r32Padding;
    const teamB_y = teamA_y + 2 * r32R + GAP_GAME;
    return teamIdx === 0 ? teamA_y : teamB_y;
  }
  function r32GameMidY(gameIdx: number): number {
    return (r32TeamY(gameIdx, 0) + r32TeamY(gameIdx, 1)) / 2;
  }

  // R16: 16 teams → 8 games. Each game's Y = midpoint of its 2 feeder R32 games
  // Feeder pairs: game 0+1 → R16[0], game 2+3 → R16[1], game 4+5 → R16[2], game 6+7 → R16[3]
  function r16MidY(r16Idx: number): number {
    const feederA = r16Idx * 2;
    const feederB = r16Idx * 2 + 1;
    return (r32GameMidY(feederA) + r32GameMidY(feederB)) / 2;
  }

  // Each R16 game: show 2 flags stacked
  function r16TeamY(r16Idx: number, teamIdx: 0 | 1): number {
    const mid = r16MidY(r16Idx);
    return teamIdx === 0 ? mid - r16R - 4 : mid + r16R + 4;
  }

  // QF: 2 games per side. midY of its 2 R16 feeders
  function qfMidY(qfIdx: number): number {
    return (r16MidY(qfIdx * 2) + r16MidY(qfIdx * 2 + 1)) / 2;
  }
  function qfTeamY(qfIdx: number, teamIdx: 0 | 1): number {
    const mid = qfMidY(qfIdx);
    return teamIdx === 0 ? mid - qfR - 5 : mid + qfR + 5;
  }

  // SF: 1 per side, midpoint of 2 QF
  function sfMidY(): number {
    return (qfMidY(0) + qfMidY(1)) / 2;
  }
  function sfTeamY(teamIdx: 0 | 1): number {
    const mid = sfMidY();
    return teamIdx === 0 ? mid - sfR - 6 : mid + sfR + 6;
  }

  // Final center
  function finalMidY(): number {
    return sfMidY(); // mirrors between left and right (same Y)
  }

  // Column X positions
  const CX = {
    r32: 90,
    r16: 330,
    qf: 540,
    sf: 720,
    final: 870,
    sfR: 1020,
    qfR: 1200,
    r16R: 1410,
    r32R: 1650,
  };

  // Render a flag circle at a position
  function FlagAt({
    slot, cx, cy, r, active,
  }: {
    slot: SlotTime; cx: number; cy: number; r: number; active: boolean;
  }) {
    return <FlagCircleSVG slot={slot} cx={cx} cy={cy} r={r} active={active} />;
  }

  // Connector bezier between phases
  function Connector({
    x1, y1, x2, y2, highlight,
  }: {
    x1: number; y1: number; x2: number; y2: number; highlight?: boolean;
  }) {
    const mx = (x1 + x2) / 2;
    const d = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
    return (
      <path
        d={d}
        fill="none"
        stroke={highlight ? "rgba(0,200,100,0.5)" : "rgba(255,255,255,0.15)"}
        strokeWidth={highlight ? 2.5 : 1.5}
        strokeLinecap="round"
      />
    );
  }

  const finalY = finalMidY();

  return (
    <svg
      viewBox={`0 0 ${VBW} ${VBH}`}
      style={{ width: "100%", minWidth: 900, height: "auto" }}
      aria-label="Variação 1: Metro Horizontal"
      role="img"
    >
      <defs>
        <radialGradient id="v1bg" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#0d1526" />
          <stop offset="100%" stopColor="#060a14" />
        </radialGradient>
      </defs>
      <rect width={VBW} height={VBH} fill="url(#v1bg)" rx={16} />

      {/* Phase column headers */}
      {[
        { label: "R32", x: CX.r32 },
        { label: "Oitavas", x: CX.r16 },
        { label: "Quartas", x: CX.qf },
        { label: "Semi", x: CX.sf },
        { label: "Final", x: CX.final },
        { label: "Semi", x: CX.sfR },
        { label: "Quartas", x: CX.qfR },
        { label: "Oitavas", x: CX.r16R },
        { label: "R32", x: CX.r32R },
      ].map(({ label, x }) => (
        <text
          key={x}
          x={x}
          y={22}
          fontSize={10}
          fontFamily="JetBrains Mono, monospace"
          fill="rgba(255,255,255,0.3)"
          textAnchor="middle"
          letterSpacing="0.08em"
        >
          {label.toUpperCase()}
        </text>
      ))}

      {/* ── LEFT SIDE ── */}

      {/* R32 → R16 connectors (from game midY to r16 flag) */}
      {[0, 1, 2, 3].map((r16Idx) => {
        const feeders = [r16Idx * 2, r16Idx * 2 + 1];
        return feeders.map((feederIdx) => {
          const feedY = r32GameMidY(feederIdx);
          const r16Y = r16MidY(r16Idx);
          const highlight = isBrasil(get(LEFT_R32_ORDER[feederIdx * 0])?.timeA?.nome ?? "");
          return (
            <Connector
              key={`lr32-${r16Idx}-${feederIdx}`}
              x1={CX.r32 + r32R}
              y1={feedY}
              x2={CX.r16 - r16R}
              y2={r16Y}
              highlight={highlight}
            />
          );
        });
      })}

      {/* R16 → QF connectors */}
      {[0, 1].map((qfIdx) => {
        const feeders = [qfIdx * 2, qfIdx * 2 + 1];
        return feeders.map((r16Idx) => (
          <Connector
            key={`lr16-${qfIdx}-${r16Idx}`}
            x1={CX.r16 + r16R}
            y1={r16MidY(r16Idx)}
            x2={CX.qf - qfR}
            y2={qfMidY(qfIdx)}
          />
        ));
      })}

      {/* QF → SF */}
      {[0, 1].map((qfIdx) => (
        <Connector
          key={`lqf-${qfIdx}`}
          x1={CX.qf + qfR}
          y1={qfMidY(qfIdx)}
          x2={CX.sf - sfR}
          y2={sfMidY()}
        />
      ))}

      {/* SF → Final */}
      <Connector x1={CX.sf + sfR} y1={sfMidY()} x2={CX.final - finR} y2={finalY} />

      {/* LEFT R32 flags (8 games × 2 teams) */}
      {LEFT_R32_ORDER.map((num, gameIdx) => {
        const c = get(num);
        const wonA = c.vencedor === "a";
        const wonB = c.vencedor === "b";
        return (
          <g key={`v1-lr32-${num}`}>
            {/* VS line between the two teams */}
            <line
              x1={CX.r32 - r32R + 4}
              y1={r32TeamY(gameIdx, 0) + r32R + 2}
              x2={CX.r32 + r32R - 4}
              y2={r32TeamY(gameIdx, 0) + r32R + 2}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={1}
            />
            <FlagAt slot={c.timeA} cx={CX.r32} cy={r32TeamY(gameIdx, 0)} r={r32R} active={!c.timeA.eliminado && !(!wonA && c.vencedor !== null)} />
            <FlagAt slot={c.timeB} cx={CX.r32} cy={r32TeamY(gameIdx, 1)} r={r32R} active={!c.timeB.eliminado && !(!wonB && c.vencedor !== null)} />
            {/* Score badge */}
            {c.gols_a !== null && (
              <text
                x={CX.r32 + r32R + 8}
                y={r32GameMidY(gameIdx) + 4}
                fontSize={9}
                fontFamily="JetBrains Mono, monospace"
                fill={placarStr(c) ? "rgba(255,215,0,0.7)" : "rgba(255,255,255,0.3)"}
              >
                {placarStr(c)}
              </text>
            )}
          </g>
        );
      })}

      {/* LEFT R16 flags (4 games) */}
      {LEFT_R16_ORDER.map((num, r16Idx) => {
        const c = get(num);
        const wonA = c.vencedor === "a";
        const wonB = c.vencedor === "b";
        return (
          <g key={`v1-lr16-${num}`}>
            <FlagAt slot={c.timeA} cx={CX.r16} cy={r16TeamY(r16Idx, 0)} r={r16R} active={!c.timeA.eliminado && !(!wonA && c.vencedor !== null)} />
            <FlagAt slot={c.timeB} cx={CX.r16} cy={r16TeamY(r16Idx, 1)} r={r16R} active={!c.timeB.eliminado && !(!wonB && c.vencedor !== null)} />
            {c.gols_a !== null && (
              <text x={CX.r16 + r16R + 6} y={r16MidY(r16Idx) + 4} fontSize={9} fontFamily="JetBrains Mono, monospace" fill="rgba(255,215,0,0.7)">{placarStr(c)}</text>
            )}
          </g>
        );
      })}

      {/* LEFT QF flags */}
      {LEFT_QF_ORDER.map((num, qfIdx) => {
        const c = get(num);
        const wonA = c.vencedor === "a";
        const wonB = c.vencedor === "b";
        return (
          <g key={`v1-lqf-${num}`}>
            <FlagAt slot={c.timeA} cx={CX.qf} cy={qfTeamY(qfIdx, 0)} r={qfR} active={!c.timeA.eliminado && !(!wonA && c.vencedor !== null)} />
            <FlagAt slot={c.timeB} cx={CX.qf} cy={qfTeamY(qfIdx, 1)} r={qfR} active={!c.timeB.eliminado && !(!wonB && c.vencedor !== null)} />
          </g>
        );
      })}

      {/* LEFT SF flags */}
      {(() => {
        const c = get(LEFT_SF);
        const wonA = c.vencedor === "a";
        const wonB = c.vencedor === "b";
        return (
          <g key="v1-lsf">
            <FlagAt slot={c.timeA} cx={CX.sf} cy={sfTeamY(0)} r={sfR} active={!c.timeA.eliminado && !(!wonA && c.vencedor !== null)} />
            <FlagAt slot={c.timeB} cx={CX.sf} cy={sfTeamY(1)} r={sfR} active={!c.timeB.eliminado && !(!wonB && c.vencedor !== null)} />
          </g>
        );
      })()}

      {/* FINAL flags */}
      {(() => {
        const c = get(104);
        const wonA = c.vencedor === "a";
        const wonB = c.vencedor === "b";
        return (
          <g key="v1-final">
            {/* Trophy glow */}
            <circle cx={CX.final} cy={finalY} r={finR + 20} fill="rgba(255,215,0,0.04)" />
            <FlagAt slot={c.timeA} cx={CX.final} cy={finalY - finR - 8} r={finR} active={!c.timeA.eliminado && !(!wonA && c.vencedor !== null)} />
            <FlagAt slot={c.timeB} cx={CX.final} cy={finalY + finR + 8} r={finR} active={!c.timeB.eliminado && !(!wonB && c.vencedor !== null)} />
            {/* Trophy */}
            <text x={CX.final} y={finalY + 8} fontSize={20} textAnchor="middle">🏆</text>
            {c.vencedor && (
              <text
                x={CX.final}
                y={finalY + finR + 28}
                fontSize={11}
                fontFamily="Outfit, sans-serif"
                fontWeight="700"
                fill="#FFD700"
                textAnchor="middle"
              >
                {shortName(c.vencedor === "a" ? c.timeA.nome : c.timeB.nome)}
              </text>
            )}
          </g>
        );
      })()}

      {/* ── RIGHT SIDE (mirror) ── */}

      {/* R32 → R16 connectors right */}
      {[0, 1, 2, 3].map((r16Idx) => {
        const feeders = [r16Idx * 2, r16Idx * 2 + 1];
        return feeders.map((feederIdx) => (
          <Connector
            key={`rr32-${r16Idx}-${feederIdx}`}
            x1={CX.r32R - r32R}
            y1={r32GameMidY(feederIdx)}
            x2={CX.r16R + r16R}
            y2={r16MidY(r16Idx)}
          />
        ));
      })}

      {/* R16 → QF connectors right */}
      {[0, 1].map((qfIdx) => {
        const feeders = [qfIdx * 2, qfIdx * 2 + 1];
        return feeders.map((r16Idx) => (
          <Connector
            key={`rr16-${qfIdx}-${r16Idx}`}
            x1={CX.r16R - r16R}
            y1={r16MidY(r16Idx)}
            x2={CX.qfR + qfR}
            y2={qfMidY(qfIdx)}
          />
        ));
      })}

      {/* QF → SF right */}
      {[0, 1].map((qfIdx) => (
        <Connector
          key={`rqf-${qfIdx}`}
          x1={CX.qfR - qfR}
          y1={qfMidY(qfIdx)}
          x2={CX.sfR + sfR}
          y2={sfMidY()}
        />
      ))}

      {/* SF → Final right */}
      <Connector x1={CX.sfR - sfR} y1={sfMidY()} x2={CX.final + finR} y2={finalY} />

      {/* RIGHT R32 flags */}
      {RIGHT_R32_ORDER.map((num, gameIdx) => {
        const c = get(num);
        const wonA = c.vencedor === "a";
        const wonB = c.vencedor === "b";
        return (
          <g key={`v1-rr32-${num}`}>
            <line
              x1={CX.r32R - r32R + 4}
              y1={r32TeamY(gameIdx, 0) + r32R + 2}
              x2={CX.r32R + r32R - 4}
              y2={r32TeamY(gameIdx, 0) + r32R + 2}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={1}
            />
            <FlagAt slot={c.timeA} cx={CX.r32R} cy={r32TeamY(gameIdx, 0)} r={r32R} active={!c.timeA.eliminado && !(!wonA && c.vencedor !== null)} />
            <FlagAt slot={c.timeB} cx={CX.r32R} cy={r32TeamY(gameIdx, 1)} r={r32R} active={!c.timeB.eliminado && !(!wonB && c.vencedor !== null)} />
            {c.gols_a !== null && (
              <text x={CX.r32R - r32R - 8} y={r32GameMidY(gameIdx) + 4} fontSize={9} fontFamily="JetBrains Mono, monospace" fill="rgba(255,215,0,0.7)" textAnchor="end">{placarStr(c)}</text>
            )}
          </g>
        );
      })}

      {/* RIGHT R16 flags */}
      {RIGHT_R16_ORDER.map((num, r16Idx) => {
        const c = get(num);
        const wonA = c.vencedor === "a";
        const wonB = c.vencedor === "b";
        return (
          <g key={`v1-rr16-${num}`}>
            <FlagAt slot={c.timeA} cx={CX.r16R} cy={r16TeamY(r16Idx, 0)} r={r16R} active={!c.timeA.eliminado && !(!wonA && c.vencedor !== null)} />
            <FlagAt slot={c.timeB} cx={CX.r16R} cy={r16TeamY(r16Idx, 1)} r={r16R} active={!c.timeB.eliminado && !(!wonB && c.vencedor !== null)} />
          </g>
        );
      })}

      {/* RIGHT QF flags */}
      {RIGHT_QF_ORDER.map((num, qfIdx) => {
        const c = get(num);
        const wonA = c.vencedor === "a";
        const wonB = c.vencedor === "b";
        return (
          <g key={`v1-rqf-${num}`}>
            <FlagAt slot={c.timeA} cx={CX.qfR} cy={qfTeamY(qfIdx, 0)} r={qfR} active={!c.timeA.eliminado && !(!wonA && c.vencedor !== null)} />
            <FlagAt slot={c.timeB} cx={CX.qfR} cy={qfTeamY(qfIdx, 1)} r={qfR} active={!c.timeB.eliminado && !(!wonB && c.vencedor !== null)} />
          </g>
        );
      })}

      {/* RIGHT SF flags */}
      {(() => {
        const c = get(RIGHT_SF);
        const wonA = c.vencedor === "a";
        const wonB = c.vencedor === "b";
        return (
          <g key="v1-rsf">
            <FlagAt slot={c.timeA} cx={CX.sfR} cy={sfTeamY(0)} r={sfR} active={!c.timeA.eliminado && !(!wonA && c.vencedor !== null)} />
            <FlagAt slot={c.timeB} cx={CX.sfR} cy={sfTeamY(1)} r={sfR} active={!c.timeB.eliminado && !(!wonB && c.vencedor !== null)} />
          </g>
        );
      })()}

      {/* 3rd place */}
      {(() => {
        const c = get(103);
        const wonA = c.vencedor === "a";
        const wonB = c.vencedor === "b";
        return (
          <g key="v1-3rd">
            <text x={CX.final} y={finalY + finR * 2 + 50} fontSize={9} fontFamily="JetBrains Mono, monospace" fill="rgba(255,255,255,0.25)" textAnchor="middle" letterSpacing="0.08em">3° LUGAR · J103</text>
            <FlagAt slot={c.timeA} cx={CX.final - 50} cy={finalY + finR * 2 + 78} r={28} active={!c.timeA.eliminado && !(!wonA && c.vencedor !== null)} />
            <FlagAt slot={c.timeB} cx={CX.final + 50} cy={finalY + finR * 2 + 78} r={28} active={!c.timeB.eliminado && !(!wonB && c.vencedor !== null)} />
          </g>
        );
      })()}
    </svg>
  );
}

// ─── VARIAÇÃO 2: Bracket Clássico Flag-Only ────────────────────────────────────
// Layout clássico: esq+dir+centro. Onde havia cards de texto → BANDEIRA grande.
// Design: fundo branco/crème limpo (light mode), bandeiras com sombra.

function V2Bracket({ bracket }: { bracket: Map<number, Confronto> }) {
  const get = (n: number) => bracket.get(n)!;

  const VBW = 1600;
  const VBH = 920;
  const R = 36; // flag radius
  const SPACING_V = 100; // vertical spacing between games at R32

  // 8 games per side, 2 teams each = 16 flag slots
  // Game midY = gameIdx * SPACING_V + top_margin + SPACING_V/2
  const TOP = 60;
  function gameMidY(idx: number): number {
    return TOP + idx * SPACING_V + SPACING_V / 2;
  }

  // Phase centers X (left side grows right, right side grows left)
  const L_R32_X = 90;
  const L_R16_X = 310;
  const L_QF_X = 520;
  const L_SF_X = 710;
  const FIN_X = 880;
  const R_SF_X = 1050;
  const R_QF_X = 1240;
  const R_R16_X = 1450;
  const R_R32_X = 1670;

  // R16 Y = midpoint of 2 feeder R32 games
  function r16Y(r16Idx: number): number {
    return (gameMidY(r16Idx * 2) + gameMidY(r16Idx * 2 + 1)) / 2;
  }
  function qfY(qfIdx: number): number {
    return (r16Y(qfIdx * 2) + r16Y(qfIdx * 2 + 1)) / 2;
  }
  function sfY(): number {
    return (qfY(0) + qfY(1)) / 2;
  }

  // Bezier connector
  function Conn({ x1, y1, x2, y2, alive }: { x1: number; y1: number; x2: number; y2: number; alive?: boolean }) {
    const mx = (x1 + x2) / 2;
    const d = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
    return (
      <path
        d={d}
        fill="none"
        stroke={alive ? "rgba(34,197,94,0.55)" : "rgba(0,0,0,0.12)"}
        strokeWidth={alive ? 2.5 : 1.5}
        strokeLinecap="round"
      />
    );
  }

  // Flag node: circular flag, name below, score tiny
  function FlagNode({
    slot, cx, cy, r, score, won,
  }: {
    slot: SlotTime; cx: number; cy: number; r: number; score?: string; won?: boolean;
  }) {
    const unknown = slot.nome.startsWith("Venc.") || slot.nome.startsWith("Perd.");
    const eliminated = !!slot.eliminado;
    const opacity = unknown ? 0.3 : eliminated ? 0.28 : 1;
    const brasil = isBrasil(slot.nome);

    return (
      <g opacity={opacity}>
        {brasil && !eliminated && (
          <circle cx={cx} cy={cy} r={r + 10} fill="none" stroke="#009C3B" strokeWidth={3} opacity={0.4}>
            <animate attributeName="r" values={`${r + 7};${r + 13};${r + 7}`} dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.4;0.7;0.4" dur="2.5s" repeatCount="indefinite" />
          </circle>
        )}
        {won && !eliminated && (
          <circle cx={cx} cy={cy} r={r + 5} fill="none" stroke="#FACC15" strokeWidth={2} opacity={0.6} />
        )}
        <clipPath id={`v2clip-${slot.iso ?? "unknown"}-${Math.round(cx)}-${Math.round(cy)}`}>
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
        {slot.iso ? (
          <image
            href={`https://hatscripts.github.io/circle-flags/flags/${slot.iso}.svg`}
            x={cx - r}
            y={cy - r}
            width={r * 2}
            height={r * 2}
            clipPath={`url(#v2clip-${slot.iso}-${Math.round(cx)}-${Math.round(cy)})`}
            preserveAspectRatio="xMidYMid slice"
          />
        ) : (
          <circle cx={cx} cy={cy} r={r} fill="rgba(0,0,0,0.08)" />
        )}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={won ? "#FACC15" : brasil ? "#009C3B" : "rgba(0,0,0,0.18)"}
          strokeWidth={won || brasil ? 2.5 : 1}
        />
        {/* Name label */}
        <text
          x={cx}
          y={cy + r + 14}
          fontSize={9.5}
          fontFamily="Outfit, system-ui, sans-serif"
          fontWeight={won ? "700" : "400"}
          fill={won ? "#854D0E" : "rgba(0,0,0,0.6)"}
          textAnchor="middle"
        >
          {unknown ? "?" : shortName(slot.nome, 9)}
        </text>
        {score && (
          <text
            x={cx}
            y={cy + r + 26}
            fontSize={8}
            fontFamily="JetBrains Mono, monospace"
            fill="rgba(0,0,0,0.4)"
            textAnchor="middle"
          >
            {score}
          </text>
        )}
      </g>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${VBW} ${VBH}`}
      style={{ width: "100%", minWidth: 900, height: "auto" }}
      aria-label="Variação 2: Bracket Clássico"
      role="img"
    >
      <defs>
        <filter id="v2shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="rgba(0,0,0,0.12)" />
        </filter>
      </defs>
      {/* Light cream background */}
      <rect width={VBW} height={VBH} fill="#FAF8F4" rx={16} />
      {/* Subtle dot grid */}
      <defs>
        <pattern id="v2dots" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
          <circle cx="15" cy="15" r="1" fill="rgba(0,0,0,0.06)" />
        </pattern>
      </defs>
      <rect width={VBW} height={VBH} fill="url(#v2dots)" rx={16} />

      {/* Phase labels */}
      {[
        { label: "R32", x: L_R32_X },
        { label: "Oitavas", x: L_R16_X },
        { label: "Quartas", x: L_QF_X },
        { label: "Semi", x: L_SF_X },
        { label: "Final", x: FIN_X },
        { label: "Semi", x: R_SF_X },
        { label: "Quartas", x: R_QF_X },
        { label: "Oitavas", x: R_R16_X },
        { label: "R32", x: R_R32_X },
      ].map(({ label, x }) => (
        <text key={x} x={x} y={22} fontSize={9} fontFamily="JetBrains Mono, monospace" fill="rgba(0,0,0,0.3)" textAnchor="middle" letterSpacing="0.08em">
          {label.toUpperCase()}
        </text>
      ))}

      {/* ── LEFT R32 flags (1 flag per team, 2 per game) ── */}
      {LEFT_R32_ORDER.map((num, gameIdx) => {
        const c = get(num);
        const sc = placarStr(c);
        const wonA = c.vencedor === "a";
        const wonB = c.vencedor === "b";
        const mid = gameMidY(gameIdx);
        return (
          <g key={`v2-lr32-${num}`}>
            {/* VS separator line */}
            <line x1={L_R32_X - R - 10} y1={mid} x2={L_R32_X + R + 10} y2={mid} stroke="rgba(0,0,0,0.07)" strokeWidth={1} />
            <FlagNode slot={c.timeA} cx={L_R32_X} cy={mid - R - 6} r={R - 4} score="" won={wonA} />
            <FlagNode slot={c.timeB} cx={L_R32_X} cy={mid + R + 6} r={R - 4} score="" won={wonB} />
            {sc && (
              <text x={L_R32_X + R + 16} y={mid + 4} fontSize={8} fontFamily="JetBrains Mono, monospace" fill="rgba(0,0,0,0.4)">{sc}</text>
            )}
          </g>
        );
      })}

      {/* LEFT connectors R32→R16 */}
      {[0, 1, 2, 3].map((r16Idx) =>
        [0, 1].map((pair) => {
          const feedIdx = r16Idx * 2 + pair;
          return (
            <Conn
              key={`v2lr32-${r16Idx}-${pair}`}
              x1={L_R32_X + R - 4}
              y1={gameMidY(feedIdx)}
              x2={L_R16_X - R + 4}
              y2={r16Y(r16Idx)}
            />
          );
        })
      )}

      {/* LEFT R16 flags */}
      {LEFT_R16_ORDER.map((num, r16Idx) => {
        const c = get(num);
        const sc = placarStr(c);
        const wonA = c.vencedor === "a";
        const wonB = c.vencedor === "b";
        const ry = r16Y(r16Idx);
        return (
          <g key={`v2-lr16-${num}`}>
            <line x1={L_R16_X - R - 8} y1={ry} x2={L_R16_X + R + 8} y2={ry} stroke="rgba(0,0,0,0.07)" strokeWidth={1} />
            <FlagNode slot={c.timeA} cx={L_R16_X} cy={ry - R - 4} r={R - 2} score="" won={wonA} />
            <FlagNode slot={c.timeB} cx={L_R16_X} cy={ry + R + 4} r={R - 2} score="" won={wonB} />
            {sc && <text x={L_R16_X + R + 14} y={ry + 4} fontSize={8} fontFamily="JetBrains Mono, monospace" fill="rgba(0,0,0,0.35)">{sc}</text>}
          </g>
        );
      })}

      {/* LEFT connectors R16→QF */}
      {[0, 1].map((qfIdx) =>
        [0, 1].map((pair) => {
          const r16Idx = qfIdx * 2 + pair;
          return (
            <Conn key={`v2lqf-${qfIdx}-${pair}`} x1={L_R16_X + R - 2} y1={r16Y(r16Idx)} x2={L_QF_X - R + 2} y2={qfY(qfIdx)} />
          );
        })
      )}

      {/* LEFT QF flags */}
      {LEFT_QF_ORDER.map((num, qfIdx) => {
        const c = get(num);
        const wonA = c.vencedor === "a";
        const wonB = c.vencedor === "b";
        const qy = qfY(qfIdx);
        return (
          <g key={`v2-lqf-${num}`}>
            <FlagNode slot={c.timeA} cx={L_QF_X} cy={qy - R} r={R} score="" won={wonA} />
            <FlagNode slot={c.timeB} cx={L_QF_X} cy={qy + R + 4} r={R} score="" won={wonB} />
          </g>
        );
      })}

      {/* LEFT connectors QF→SF */}
      {[0, 1].map((qfIdx) => (
        <Conn key={`v2lsf-${qfIdx}`} x1={L_QF_X + R} y1={qfY(qfIdx)} x2={L_SF_X - R} y2={sfY()} />
      ))}

      {/* LEFT SF flags */}
      {(() => {
        const c = get(LEFT_SF);
        const wonA = c.vencedor === "a";
        const wonB = c.vencedor === "b";
        const sy = sfY();
        return (
          <g key="v2-lsf">
            <FlagNode slot={c.timeA} cx={L_SF_X} cy={sy - R - 2} r={R + 2} score="" won={wonA} />
            <FlagNode slot={c.timeB} cx={L_SF_X} cy={sy + R + 8} r={R + 2} score="" won={wonB} />
          </g>
        );
      })()}

      {/* LEFT connector SF→Final */}
      <Conn x1={L_SF_X + R + 2} y1={sfY()} x2={FIN_X - R - 4} y2={sfY()} />

      {/* ── RIGHT SIDE (mirror) ── */}

      {/* RIGHT R32 flags */}
      {RIGHT_R32_ORDER.map((num, gameIdx) => {
        const c = get(num);
        const sc = placarStr(c);
        const wonA = c.vencedor === "a";
        const wonB = c.vencedor === "b";
        const mid = gameMidY(gameIdx);
        return (
          <g key={`v2-rr32-${num}`}>
            <line x1={R_R32_X - R - 10} y1={mid} x2={R_R32_X + R + 10} y2={mid} stroke="rgba(0,0,0,0.07)" strokeWidth={1} />
            <FlagNode slot={c.timeA} cx={R_R32_X} cy={mid - R - 6} r={R - 4} score="" won={wonA} />
            <FlagNode slot={c.timeB} cx={R_R32_X} cy={mid + R + 6} r={R - 4} score="" won={wonB} />
            {sc && <text x={R_R32_X - R - 16} y={mid + 4} fontSize={8} fontFamily="JetBrains Mono, monospace" fill="rgba(0,0,0,0.4)" textAnchor="end">{sc}</text>}
          </g>
        );
      })}

      {[0, 1, 2, 3].map((r16Idx) =>
        [0, 1].map((pair) => {
          const feedIdx = r16Idx * 2 + pair;
          return (
            <Conn key={`v2rr32-${r16Idx}-${pair}`} x1={R_R32_X - R + 4} y1={gameMidY(feedIdx)} x2={R_R16_X + R - 4} y2={r16Y(r16Idx)} />
          );
        })
      )}

      {RIGHT_R16_ORDER.map((num, r16Idx) => {
        const c = get(num);
        const wonA = c.vencedor === "a";
        const wonB = c.vencedor === "b";
        const ry = r16Y(r16Idx);
        return (
          <g key={`v2-rr16-${num}`}>
            <FlagNode slot={c.timeA} cx={R_R16_X} cy={ry - R - 4} r={R - 2} score="" won={wonA} />
            <FlagNode slot={c.timeB} cx={R_R16_X} cy={ry + R + 4} r={R - 2} score="" won={wonB} />
          </g>
        );
      })}

      {[0, 1].map((qfIdx) =>
        [0, 1].map((pair) => {
          const r16Idx = qfIdx * 2 + pair;
          return (
            <Conn key={`v2rqf-${qfIdx}-${pair}`} x1={R_R16_X - R + 2} y1={r16Y(r16Idx)} x2={R_QF_X + R - 2} y2={qfY(qfIdx)} />
          );
        })
      )}

      {RIGHT_QF_ORDER.map((num, qfIdx) => {
        const c = get(num);
        const wonA = c.vencedor === "a";
        const wonB = c.vencedor === "b";
        const qy = qfY(qfIdx);
        return (
          <g key={`v2-rqf-${num}`}>
            <FlagNode slot={c.timeA} cx={R_QF_X} cy={qy - R} r={R} score="" won={wonA} />
            <FlagNode slot={c.timeB} cx={R_QF_X} cy={qy + R + 4} r={R} score="" won={wonB} />
          </g>
        );
      })}

      {[0, 1].map((qfIdx) => (
        <Conn key={`v2rsf-${qfIdx}`} x1={R_QF_X - R} y1={qfY(qfIdx)} x2={R_SF_X + R} y2={sfY()} />
      ))}

      {(() => {
        const c = get(RIGHT_SF);
        const wonA = c.vencedor === "a";
        const wonB = c.vencedor === "b";
        const sy = sfY();
        return (
          <g key="v2-rsf">
            <FlagNode slot={c.timeA} cx={R_SF_X} cy={sy - R - 2} r={R + 2} score="" won={wonA} />
            <FlagNode slot={c.timeB} cx={R_SF_X} cy={sy + R + 8} r={R + 2} score="" won={wonB} />
          </g>
        );
      })()}

      <Conn x1={R_SF_X - R - 2} y1={sfY()} x2={FIN_X + R + 4} y2={sfY()} />

      {/* ── FINAL ── */}
      {(() => {
        const c = get(104);
        const wonA = c.vencedor === "a";
        const wonB = c.vencedor === "b";
        const fy = sfY();
        const finR2 = R + 14;
        return (
          <g key="v2-final">
            <circle cx={FIN_X} cy={fy} r={finR2 + 22} fill="rgba(250,204,21,0.08)" />
            <circle cx={FIN_X} cy={fy} r={finR2 + 14} fill="none" stroke="rgba(250,204,21,0.25)" strokeWidth={1} strokeDasharray="4 4" />
            <FlagNode slot={c.timeA} cx={FIN_X} cy={fy - finR2 - 10} r={finR2} score="" won={wonA} />
            <FlagNode slot={c.timeB} cx={FIN_X} cy={fy + finR2 + 18} r={finR2} score="" won={wonB} />
            <text x={FIN_X} y={fy + 8} fontSize={22} textAnchor="middle">🏆</text>
          </g>
        );
      })()}

      {/* 3rd place */}
      {(() => {
        const c = get(103);
        const wonA = c.vencedor === "a";
        const wonB = c.vencedor === "b";
        return (
          <g key="v2-3rd">
            <text x={FIN_X} y={VBH - 70} fontSize={8} fontFamily="JetBrains Mono, monospace" fill="rgba(0,0,0,0.25)" textAnchor="middle" letterSpacing="0.08em">3° LUGAR · J103</text>
            <FlagNode slot={c.timeA} cx={FIN_X - 55} cy={VBH - 44} r={26} score="" won={wonA} />
            <FlagNode slot={c.timeB} cx={FIN_X + 55} cy={VBH - 44} r={26} score="" won={wonB} />
          </g>
        );
      })()}
    </svg>
  );
}

// ─── VARIAÇÃO 3: Radial Pétala ─────────────────────────────────────────────────
// 32 bandeiras dos R32 num anel externo. Linhas convergem em anéis menores
// (R16, QF, SF) até a Final no centro.

function V3Radial({ bracket }: { bracket: Map<number, Confronto> }) {
  const get = (n: number) => bracket.get(n)!;

  const VBW = 960;
  const VBH = 960;
  const CX_C = VBW / 2;
  const CY_C = VBH / 2;

  // Radii for each ring
  const R_R32 = 410;  // outermost ring
  const R_R16 = 310;
  const R_QF = 220;
  const R_SF = 140;
  const R_FIN = 0;    // center

  // Flag radii
  const FR_R32 = 26;
  const FR_R16 = 30;
  const FR_QF = 35;
  const FR_SF = 42;
  const FR_FIN = 52;

  // 32 R32 teams: 2 teams per game × 16 games. But we only have 16 games total.
  // Each game gets adjacent angle slots. 16 games → 22.5° each.
  // Teams within a game: first at angle - 5.625°, second at angle + 5.625°
  const ALL_R32_ORDER = [
    ...LEFT_R32_ORDER,   // 8 games left side
    ...RIGHT_R32_ORDER,  // 8 games right side
  ];
  const ALL_R16_ORDER = [LEFT_R16_ORDER, RIGHT_R16_ORDER].flat();
  const ALL_QF_ORDER = [LEFT_QF_ORDER, RIGHT_QF_ORDER].flat();
  const ALL_SF_ORDER = [LEFT_SF, RIGHT_SF];

  const N_GAMES_R32 = ALL_R32_ORDER.length; // 16 games
  const ANGLE_PER_GAME = (2 * Math.PI) / N_GAMES_R32;
  const TEAM_OFFSET_ANGLE = ANGLE_PER_GAME * 0.25;

  function polarX(angle: number, r: number): number {
    return CX_C + r * Math.cos(angle - Math.PI / 2);
  }
  function polarY(angle: number, r: number): number {
    return CY_C + r * Math.sin(angle - Math.PI / 2);
  }

  // For R32: each game is at angle = gameIdx * ANGLE_PER_GAME
  // teamA at angle - TEAM_OFFSET_ANGLE, teamB at angle + TEAM_OFFSET_ANGLE
  // For R16: 2 R32 games feed each R16 game → angle = avg of feeder angles
  // Each R16 has 2 feeder R32 games (indices r16Idx*2 and r16Idx*2+1)

  function r32GameAngle(gameIdx: number): number {
    return gameIdx * ANGLE_PER_GAME;
  }
  function r16GameAngle(r16Idx: number): number {
    return (r32GameAngle(r16Idx * 2) + r32GameAngle(r16Idx * 2 + 1)) / 2;
  }
  function qfGameAngle(qfIdx: number): number {
    return (r16GameAngle(qfIdx * 2) + r16GameAngle(qfIdx * 2 + 1)) / 2;
  }
  function sfGameAngle(sfIdx: number): number {
    return (qfGameAngle(sfIdx * 2) + qfGameAngle(sfIdx * 2 + 1)) / 2;
  }

  // Bezier arc connector: from outer ring to inner ring along the "petal"
  function PetalPath({ outerAngle, outerR, innerAngle, innerR, color, width }: {
    outerAngle: number; outerR: number; innerAngle: number; innerR: number; color?: string; width?: number;
  }) {
    const x1 = polarX(outerAngle, outerR);
    const y1 = polarY(outerAngle, outerR);
    const x2 = polarX(innerAngle, innerR);
    const y2 = polarY(innerAngle, innerR);
    // Control points: angled toward center
    const cpR1 = outerR * 0.7;
    const cpR2 = innerR * 1.4;
    const cx1 = polarX(outerAngle, cpR1);
    const cy1 = polarY(outerAngle, cpR1);
    const cx2 = polarX(innerAngle, cpR2);
    const cy2 = polarY(innerAngle, cpR2);
    const d = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
    return (
      <path
        d={d}
        fill="none"
        stroke={color ?? "rgba(255,255,255,0.14)"}
        strokeWidth={width ?? 1.5}
        strokeLinecap="round"
      />
    );
  }

  // Flag at polar position
  function FlagPolar({
    slot, angle, ringR, r, active,
  }: {
    slot: SlotTime; angle: number; ringR: number; r: number; active: boolean;
  }) {
    const cx = polarX(angle, ringR);
    const cy = polarY(angle, ringR);
    const unknown = slot.nome.startsWith("Venc.") || slot.nome.startsWith("Perd.");
    const eliminated = !!slot.eliminado && !active;
    const opacity = unknown ? 0.2 : eliminated ? 0.28 : 1;
    const brasil = isBrasil(slot.nome);

    return (
      <g opacity={opacity}>
        {active && !unknown && (
          <circle cx={cx} cy={cy} r={r + 7} fill="none" stroke={brasil ? "#009C3B" : "rgba(255,255,255,0.35)"} strokeWidth={brasil ? 3 : 1.5} opacity={0.55}>
            <animate attributeName="r" values={`${r + 5};${r + 10};${r + 5}`} dur={brasil ? "2s" : "3.5s"} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.4;0.7;0.4" dur={brasil ? "2s" : "3.5s"} repeatCount="indefinite" />
          </circle>
        )}
        <clipPath id={`v3clip-${slot.iso ?? "unk"}-${Math.round(angle * 100)}-${ringR}`}>
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
        {slot.iso ? (
          <image
            href={`https://hatscripts.github.io/circle-flags/flags/${slot.iso}.svg`}
            x={cx - r}
            y={cy - r}
            width={r * 2}
            height={r * 2}
            clipPath={`url(#v3clip-${slot.iso}-${Math.round(angle * 100)}-${ringR})`}
            preserveAspectRatio="xMidYMid slice"
          />
        ) : (
          <circle cx={cx} cy={cy} r={r} fill="rgba(255,255,255,0.07)" />
        )}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={active && !unknown ? (brasil ? "#009C3B" : "rgba(255,255,255,0.6)") : "rgba(255,255,255,0.15)"} strokeWidth={active && !unknown ? (brasil ? 3 : 1.5) : 1} />
        {unknown && (
          <text x={cx} y={cy + 5} fontSize={r * 0.7} fontFamily="system-ui" fill="rgba(255,255,255,0.3)" textAnchor="middle">?</text>
        )}
      </g>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${VBW} ${VBH}`}
      style={{ width: "100%", maxWidth: 960, height: "auto", margin: "0 auto", display: "block" }}
      aria-label="Variação 3: Radial Pétala"
      role="img"
    >
      <defs>
        <radialGradient id="v3bg" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#1a0a2e" />
          <stop offset="60%" stopColor="#0c0520" />
          <stop offset="100%" stopColor="#060010" />
        </radialGradient>
        <radialGradient id="v3glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,215,0,0.12)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      <rect width={VBW} height={VBH} fill="url(#v3bg)" rx={16} />

      {/* Ring guides (subtle) */}
      {[R_R32 + FR_R32 + 8, R_R16 + FR_R16 + 6, R_QF + FR_QF + 6, R_SF + FR_SF + 6].map((r, i) => (
        <circle key={i} cx={CX_C} cy={CY_C} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
      ))}

      {/* Center trophy glow */}
      <circle cx={CX_C} cy={CY_C} r={90} fill="url(#v3glow)" />

      {/* ── Petal connectors ── */}

      {/* R32 → R16 petals */}
      {ALL_R32_ORDER.map((num, gameIdx) => {
        const angle = r32GameAngle(gameIdx);
        const r16Idx = Math.floor(gameIdx / 2);
        const r16Angle = r16GameAngle(r16Idx);
        const c = get(num);
        const eliminated = c.timeA.eliminado && c.timeB.eliminado;
        return (
          <g key={`v3-r32petal-${num}`}>
            <PetalPath
              outerAngle={angle - TEAM_OFFSET_ANGLE}
              outerR={R_R32}
              innerAngle={r16Angle}
              innerR={R_R16}
              color={eliminated ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.12)"}
            />
            <PetalPath
              outerAngle={angle + TEAM_OFFSET_ANGLE}
              outerR={R_R32}
              innerAngle={r16Angle}
              innerR={R_R16}
              color={eliminated ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.12)"}
            />
          </g>
        );
      })}

      {/* R16 → QF petals */}
      {ALL_R16_ORDER.map((num, r16Idx) => {
        const angle = r16GameAngle(r16Idx);
        const qfIdx = Math.floor(r16Idx / 2);
        const qfAngle = qfGameAngle(qfIdx);
        const c = get(num);
        const hasWinner = c.vencedor !== null;
        return (
          <PetalPath
            key={`v3-r16petal-${num}`}
            outerAngle={angle}
            outerR={R_R16}
            innerAngle={qfAngle}
            innerR={R_QF}
            color={hasWinner ? "rgba(150,200,255,0.22)" : "rgba(255,255,255,0.1)"}
            width={hasWinner ? 2 : 1.5}
          />
        );
      })}

      {/* QF → SF petals */}
      {ALL_QF_ORDER.map((num, qfIdx) => {
        const angle = qfGameAngle(qfIdx);
        const sfIdx = Math.floor(qfIdx / 2);
        const sfAngle = sfGameAngle(sfIdx);
        const c = get(num);
        const hasWinner = c.vencedor !== null;
        return (
          <PetalPath
            key={`v3-qfpetal-${num}`}
            outerAngle={angle}
            outerR={R_QF}
            innerAngle={sfAngle}
            innerR={R_SF}
            color={hasWinner ? "rgba(200,150,255,0.3)" : "rgba(255,255,255,0.1)"}
            width={hasWinner ? 2.5 : 1.5}
          />
        );
      })}

      {/* SF → Final petals */}
      {ALL_SF_ORDER.map((num, sfIdx) => {
        const angle = sfGameAngle(sfIdx);
        const c = get(num);
        const hasWinner = c.vencedor !== null;
        return (
          <PetalPath
            key={`v3-sfpetal-${num}`}
            outerAngle={angle}
            outerR={R_SF}
            innerAngle={angle * 0.5}  // converge toward center-ish
            innerR={FR_FIN + FR_FIN + 10}
            color={hasWinner ? "rgba(255,215,0,0.5)" : "rgba(255,255,255,0.12)"}
            width={hasWinner ? 3 : 1.5}
          />
        );
      })}

      {/* ── FLAGS ── */}

      {/* R32 flags */}
      {ALL_R32_ORDER.map((num, gameIdx) => {
        const c = get(num);
        const angle = r32GameAngle(gameIdx);
        const wonA = c.vencedor === "a";
        const wonB = c.vencedor === "b";
        return (
          <g key={`v3-r32-${num}`}>
            <FlagPolar
              slot={c.timeA}
              angle={angle - TEAM_OFFSET_ANGLE}
              ringR={R_R32}
              r={FR_R32}
              active={!c.timeA.eliminado && !(!wonA && c.vencedor !== null)}
            />
            <FlagPolar
              slot={c.timeB}
              angle={angle + TEAM_OFFSET_ANGLE}
              ringR={R_R32}
              r={FR_R32}
              active={!c.timeB.eliminado && !(!wonB && c.vencedor !== null)}
            />
          </g>
        );
      })}

      {/* R16 flags */}
      {ALL_R16_ORDER.map((num, r16Idx) => {
        const c = get(num);
        const angle = r16GameAngle(r16Idx);
        const wonA = c.vencedor === "a";
        const wonB = c.vencedor === "b";
        const aOff = ANGLE_PER_GAME * 0.15;
        return (
          <g key={`v3-r16-${num}`}>
            <FlagPolar slot={c.timeA} angle={angle - aOff} ringR={R_R16} r={FR_R16} active={!c.timeA.eliminado && !(!wonA && c.vencedor !== null)} />
            <FlagPolar slot={c.timeB} angle={angle + aOff} ringR={R_R16} r={FR_R16} active={!c.timeB.eliminado && !(!wonB && c.vencedor !== null)} />
          </g>
        );
      })}

      {/* QF flags */}
      {ALL_QF_ORDER.map((num, qfIdx) => {
        const c = get(num);
        const angle = qfGameAngle(qfIdx);
        const wonA = c.vencedor === "a";
        const wonB = c.vencedor === "b";
        const aOff = ANGLE_PER_GAME * 0.12;
        return (
          <g key={`v3-qf-${num}`}>
            <FlagPolar slot={c.timeA} angle={angle - aOff} ringR={R_QF} r={FR_QF} active={!c.timeA.eliminado && !(!wonA && c.vencedor !== null)} />
            <FlagPolar slot={c.timeB} angle={angle + aOff} ringR={R_QF} r={FR_QF} active={!c.timeB.eliminado && !(!wonB && c.vencedor !== null)} />
          </g>
        );
      })}

      {/* SF flags */}
      {ALL_SF_ORDER.map((num, sfIdx) => {
        const c = get(num);
        const angle = sfGameAngle(sfIdx);
        const wonA = c.vencedor === "a";
        const wonB = c.vencedor === "b";
        const aOff = ANGLE_PER_GAME * 0.1;
        return (
          <g key={`v3-sf-${num}`}>
            <FlagPolar slot={c.timeA} angle={angle - aOff} ringR={R_SF} r={FR_SF} active={!c.timeA.eliminado && !(!wonA && c.vencedor !== null)} />
            <FlagPolar slot={c.timeB} angle={angle + aOff} ringR={R_SF} r={FR_SF} active={!c.timeB.eliminado && !(!wonB && c.vencedor !== null)} />
          </g>
        );
      })}

      {/* Final: center flag pair */}
      {(() => {
        const c = get(104);
        const wonA = c.vencedor === "a";
        const wonB = c.vencedor === "b";
        return (
          <g key="v3-final">
            <circle cx={CX_C} cy={CY_C} r={FR_FIN + 26} fill="rgba(255,215,0,0.1)">
              <animate attributeName="r" values={`${FR_FIN + 20};${FR_FIN + 32};${FR_FIN + 20}`} dur="4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;1;0.6" dur="4s" repeatCount="indefinite" />
            </circle>
            {c.timeA.nome.startsWith("Venc.") && c.timeB.nome.startsWith("Venc.") ? (
              <text x={CX_C} y={CY_C + 8} fontSize={28} textAnchor="middle">🏆</text>
            ) : (
              <>
                <FlagPolar slot={c.timeA} angle={Math.PI * 0.75} ringR={FR_FIN + 58} r={FR_FIN} active={!c.timeA.eliminado && !(!wonA && c.vencedor !== null)} />
                <FlagPolar slot={c.timeB} angle={Math.PI * 1.75} ringR={FR_FIN + 58} r={FR_FIN} active={!c.timeB.eliminado && !(!wonB && c.vencedor !== null)} />
                <text x={CX_C} y={CY_C + 10} fontSize={26} textAnchor="middle">🏆</text>
              </>
            )}
          </g>
        );
      })()}

      {/* Phase ring labels */}
      {[
        { label: "R32", r: R_R32 + FR_R32 + 22, angle: -Math.PI / 6 },
        { label: "Oitavas", r: R_R16 + FR_R16 + 20, angle: -Math.PI / 6 },
        { label: "Quartas", r: R_QF + FR_QF + 18, angle: -Math.PI / 6 },
        { label: "Semi", r: R_SF + FR_SF + 18, angle: -Math.PI / 6 },
      ].map(({ label, r, angle }) => (
        <text
          key={label}
          x={CX_C + r * Math.cos(angle - Math.PI / 2)}
          y={CY_C + r * Math.sin(angle - Math.PI / 2)}
          fontSize={9}
          fontFamily="JetBrains Mono, monospace"
          fill="rgba(255,255,255,0.25)"
          textAnchor="middle"
          letterSpacing="0.07em"
        >
          {label.toUpperCase()}
        </text>
      ))}
    </svg>
  );
}

// ─── VARIAÇÃO 4: Vertical Metro ────────────────────────────────────────────────
// 5 fileiras horizontais: R32 no topo, Final na base.
// Bandeiras nas estações, trilhos verticais descendo. Fundo light/sepia.

function V4Vertical({ bracket }: { bracket: Map<number, Confronto> }) {
  const get = (n: number) => bracket.get(n)!;

  const VBW = 1800;
  const VBH = 780;

  // 5 rows: R32, R16, QF, SF, Final (bottom)
  const ROW_Y = {
    r32: 80,
    r16: 230,
    qf: 380,
    sf: 510,
    final: 640,
  };

  // Flag radii per row
  const FR = {
    r32: 24,
    r16: 30,
    qf: 36,
    sf: 44,
    final: 54,
  };

  // 16 R32 games spread horizontally. Total width: VBW with margins.
  const MARGIN = 70;
  const USABLE_W = VBW - MARGIN * 2;
  const GAME_W = USABLE_W / 16; // width per R32 game

  function r32GameX(gameIdx: number): number {
    return MARGIN + (gameIdx + 0.5) * GAME_W;
  }

  // Each R16 game spans 2 R32 games
  function r16GameX(r16Idx: number): number {
    return (r32GameX(r16Idx * 2) + r32GameX(r16Idx * 2 + 1)) / 2;
  }

  function qfGameX(qfIdx: number): number {
    return (r16GameX(qfIdx * 2) + r16GameX(qfIdx * 2 + 1)) / 2;
  }

  function sfGameX(sfIdx: number): number {
    return (qfGameX(sfIdx * 2) + qfGameX(sfIdx * 2 + 1)) / 2;
  }

  function finalX(): number {
    return VBW / 2;
  }

  // Connector from (x1,y1) down-bezier to (x2,y2)
  function VertConn({ x1, y1, x2, y2, color, width }: { x1: number; y1: number; x2: number; y2: number; color?: string; width?: number }) {
    const midy = (y1 + y2) / 2;
    const d = `M ${x1} ${y1} C ${x1} ${midy}, ${x2} ${midy}, ${x2} ${y2}`;
    return (
      <path
        d={d}
        fill="none"
        stroke={color ?? "rgba(100,120,200,0.25)"}
        strokeWidth={width ?? 1.5}
        strokeLinecap="round"
      />
    );
  }

  const ALL_R32_ORDER = [...LEFT_R32_ORDER, ...RIGHT_R32_ORDER];
  const ALL_R16_ORDER = [...LEFT_R16_ORDER, ...RIGHT_R16_ORDER];
  const ALL_QF_ORDER = [...LEFT_QF_ORDER, ...RIGHT_QF_ORDER];
  const ALL_SF_ORDER = [LEFT_SF, RIGHT_SF];

  // Flag at position
  function FlagV({
    slot, cx, cy, r, active,
  }: {
    slot: SlotTime; cx: number; cy: number; r: number; active: boolean;
  }) {
    const unknown = slot.nome.startsWith("Venc.") || slot.nome.startsWith("Perd.");
    const eliminated = !!slot.eliminado && !active;
    const opacity = unknown ? 0.2 : eliminated ? 0.25 : 1;
    const brasil = isBrasil(slot.nome);

    return (
      <g opacity={opacity}>
        {active && !unknown && brasil && (
          <circle cx={cx} cy={cy} r={r + 9} fill="none" stroke="#009C3B" strokeWidth={3} opacity={0.5}>
            <animate attributeName="r" values={`${r + 6};${r + 12};${r + 6}`} dur="2s" repeatCount="indefinite" />
          </circle>
        )}
        {active && !unknown && !brasil && (
          <circle cx={cx} cy={cy} r={r + 5} fill="none" stroke="rgba(100,120,220,0.4)" strokeWidth={1.5} opacity={0.6} />
        )}
        <clipPath id={`v4clip-${slot.iso ?? "unk"}-${Math.round(cx)}-${Math.round(cy)}`}>
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
        {slot.iso ? (
          <image
            href={`https://hatscripts.github.io/circle-flags/flags/${slot.iso}.svg`}
            x={cx - r}
            y={cy - r}
            width={r * 2}
            height={r * 2}
            clipPath={`url(#v4clip-${slot.iso}-${Math.round(cx)}-${Math.round(cy)})`}
            preserveAspectRatio="xMidYMid slice"
          />
        ) : (
          <circle cx={cx} cy={cy} r={r} fill="rgba(100,120,200,0.1)" />
        )}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={active && !unknown ? (brasil ? "#009C3B" : "rgba(100,120,220,0.7)") : "rgba(100,120,200,0.2)"}
          strokeWidth={active && !unknown ? (brasil ? 3 : 2) : 1}
        />
        {/* Team name below (rotated 45° for space in R32) */}
        {r <= FR.r32 && !unknown && (
          <text
            x={0}
            y={0}
            fontSize={8}
            fontFamily="Outfit, system-ui, sans-serif"
            fill={active ? "rgba(30,30,60,0.8)" : "rgba(30,30,60,0.3)"}
            textAnchor="start"
            transform={`translate(${cx + r - 2}, ${cy + r + 4}) rotate(40)`}
          >
            {shortName(slot.nome, 8)}
          </text>
        )}
        {r > FR.r32 && !unknown && (
          <text
            x={cx}
            y={cy + r + 14}
            fontSize={r <= FR.r16 ? 9 : r <= FR.qf ? 10 : 11}
            fontFamily="Outfit, system-ui, sans-serif"
            fontWeight={active ? "600" : "300"}
            fill={active ? "rgba(30,30,60,0.85)" : "rgba(30,30,60,0.3)"}
            textAnchor="middle"
          >
            {shortName(slot.nome, 10)}
          </text>
        )}
        {unknown && (
          <text x={cx} y={cy + 5} fontSize={r * 0.65} fontFamily="system-ui" fill="rgba(100,120,200,0.3)" textAnchor="middle">?</text>
        )}
      </g>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${VBW} ${VBH}`}
      style={{ width: "100%", minWidth: 900, height: "auto" }}
      aria-label="Variação 4: Vertical Metro"
      role="img"
    >
      <defs>
        <linearGradient id="v4bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8EBF8" />
          <stop offset="100%" stopColor="#F5F3FF" />
        </linearGradient>
      </defs>
      <rect width={VBW} height={VBH} fill="url(#v4bg)" rx={16} />

      {/* Subtle horizontal guide lines */}
      {Object.entries(ROW_Y).map(([phase, y]) => (
        <line
          key={phase}
          x1={MARGIN - 20}
          y1={y}
          x2={VBW - MARGIN + 20}
          y2={y}
          stroke="rgba(100,120,200,0.08)"
          strokeWidth={1}
          strokeDasharray="4 8"
        />
      ))}

      {/* Phase row labels */}
      {[
        { label: "R32", y: ROW_Y.r32 },
        { label: "Oitavas", y: ROW_Y.r16 },
        { label: "Quartas", y: ROW_Y.qf },
        { label: "Semifinal", y: ROW_Y.sf },
        { label: "Final", y: ROW_Y.final },
      ].map(({ label, y }) => (
        <text
          key={label}
          x={30}
          y={y + 4}
          fontSize={9}
          fontFamily="JetBrains Mono, monospace"
          fill="rgba(100,120,200,0.5)"
          letterSpacing="0.07em"
        >
          {label.toUpperCase()}
        </text>
      ))}

      {/* ── Connectors ── */}

      {/* R32 → R16 */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((r16Idx) => (
        [0, 1].map((pair) => {
          const feedIdx = r16Idx * 2 + pair;
          return (
            <VertConn
              key={`v4-r32r16-${r16Idx}-${pair}`}
              x1={r32GameX(feedIdx)}
              y1={ROW_Y.r32 + FR.r32}
              x2={r16GameX(r16Idx)}
              y2={ROW_Y.r16 - FR.r16}
            />
          );
        })
      ))}

      {/* R16 → QF */}
      {[0, 1, 2, 3].map((qfIdx) => (
        [0, 1].map((pair) => {
          const r16Idx = qfIdx * 2 + pair;
          return (
            <VertConn
              key={`v4-r16qf-${qfIdx}-${pair}`}
              x1={r16GameX(r16Idx)}
              y1={ROW_Y.r16 + FR.r16}
              x2={qfGameX(qfIdx)}
              y2={ROW_Y.qf - FR.qf}
            />
          );
        })
      ))}

      {/* QF → SF */}
      {[0, 1].map((sfIdx) => (
        [0, 1].map((pair) => {
          const qfIdx = sfIdx * 2 + pair;
          return (
            <VertConn
              key={`v4-qfsf-${sfIdx}-${pair}`}
              x1={qfGameX(qfIdx)}
              y1={ROW_Y.qf + FR.qf}
              x2={sfGameX(sfIdx)}
              y2={ROW_Y.sf - FR.sf}
            />
          );
        })
      ))}

      {/* SF → Final */}
      {[0, 1].map((sfIdx) => (
        <VertConn
          key={`v4-sffin-${sfIdx}`}
          x1={sfGameX(sfIdx)}
          y1={ROW_Y.sf + FR.sf}
          x2={finalX()}
          y2={ROW_Y.final - FR.final}
          color="rgba(250,204,21,0.5)"
          width={2.5}
        />
      ))}

      {/* ── FLAGS ── */}

      {/* R32: one flag per team, 2 per game, stacked with each game's slot centered at r32GameX */}
      {ALL_R32_ORDER.map((num, gameIdx) => {
        const c = get(num);
        const wonA = c.vencedor === "a";
        const wonB = c.vencedor === "b";
        const gx = r32GameX(gameIdx);
        const teamSep = FR.r32 + 4;
        return (
          <g key={`v4-r32-${num}`}>
            <FlagV slot={c.timeA} cx={gx - teamSep} cy={ROW_Y.r32} r={FR.r32} active={!c.timeA.eliminado && !(!wonA && c.vencedor !== null)} />
            <FlagV slot={c.timeB} cx={gx + teamSep} cy={ROW_Y.r32} r={FR.r32} active={!c.timeB.eliminado && !(!wonB && c.vencedor !== null)} />
            {/* Score between them */}
            {c.gols_a !== null && (
              <text x={gx} y={ROW_Y.r32 + 4} fontSize={8} fontFamily="JetBrains Mono, monospace" fill={teamColor(c.vencedor === "a" ? c.timeA.nome : c.timeB.nome)} textAnchor="middle" fontWeight="700">{placarStr(c)}</text>
            )}
          </g>
        );
      })}

      {/* R16 flags: winner of each R32 pair */}
      {ALL_R16_ORDER.map((num, r16Idx) => {
        const c = get(num);
        const wonA = c.vencedor === "a";
        const wonB = c.vencedor === "b";
        const gx = r16GameX(r16Idx);
        const teamSep = FR.r16 + 5;
        return (
          <g key={`v4-r16-${num}`}>
            <FlagV slot={c.timeA} cx={gx - teamSep} cy={ROW_Y.r16} r={FR.r16} active={!c.timeA.eliminado && !(!wonA && c.vencedor !== null)} />
            <FlagV slot={c.timeB} cx={gx + teamSep} cy={ROW_Y.r16} r={FR.r16} active={!c.timeB.eliminado && !(!wonB && c.vencedor !== null)} />
            {c.gols_a !== null && (
              <text x={gx} y={ROW_Y.r16 + 5} fontSize={9} fontFamily="JetBrains Mono, monospace" fill="rgba(100,120,200,0.8)" textAnchor="middle" fontWeight="700">{placarStr(c)}</text>
            )}
          </g>
        );
      })}

      {/* QF flags */}
      {ALL_QF_ORDER.map((num, qfIdx) => {
        const c = get(num);
        const wonA = c.vencedor === "a";
        const wonB = c.vencedor === "b";
        const gx = qfGameX(qfIdx);
        const teamSep = FR.qf + 6;
        return (
          <g key={`v4-qf-${num}`}>
            <FlagV slot={c.timeA} cx={gx - teamSep} cy={ROW_Y.qf} r={FR.qf} active={!c.timeA.eliminado && !(!wonA && c.vencedor !== null)} />
            <FlagV slot={c.timeB} cx={gx + teamSep} cy={ROW_Y.qf} r={FR.qf} active={!c.timeB.eliminado && !(!wonB && c.vencedor !== null)} />
          </g>
        );
      })}

      {/* SF flags */}
      {ALL_SF_ORDER.map((num, sfIdx) => {
        const c = get(num);
        const wonA = c.vencedor === "a";
        const wonB = c.vencedor === "b";
        const gx = sfGameX(sfIdx);
        const teamSep = FR.sf + 8;
        return (
          <g key={`v4-sf-${num}`}>
            <FlagV slot={c.timeA} cx={gx - teamSep} cy={ROW_Y.sf} r={FR.sf} active={!c.timeA.eliminado && !(!wonA && c.vencedor !== null)} />
            <FlagV slot={c.timeB} cx={gx + teamSep} cy={ROW_Y.sf} r={FR.sf} active={!c.timeB.eliminado && !(!wonB && c.vencedor !== null)} />
          </g>
        );
      })}

      {/* Final flag */}
      {(() => {
        const c = get(104);
        const wonA = c.vencedor === "a";
        const wonB = c.vencedor === "b";
        const fx = finalX();
        const teamSep = FR.final + 10;
        return (
          <g key="v4-final">
            <circle cx={fx} cy={ROW_Y.final} r={FR.final + 24} fill="rgba(250,204,21,0.1)" />
            <circle cx={fx} cy={ROW_Y.final} r={FR.final + 14} fill="none" stroke="rgba(250,204,21,0.3)" strokeWidth={1.5} strokeDasharray="3 5" />
            <FlagV slot={c.timeA} cx={fx - teamSep} cy={ROW_Y.final} r={FR.final} active={!c.timeA.eliminado && !(!wonA && c.vencedor !== null)} />
            <FlagV slot={c.timeB} cx={fx + teamSep} cy={ROW_Y.final} r={FR.final} active={!c.timeB.eliminado && !(!wonB && c.vencedor !== null)} />
            <text x={fx} y={ROW_Y.final + 10} fontSize={22} textAnchor="middle">🏆</text>
          </g>
        );
      })()}
    </svg>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function ChaveamentoPage() {
  const [jogos, resultados, mapaPaises] = await Promise.all([
    carregarJogos(),
    carregarResultados(),
    carregarMapaPaises(),
  ]);

  const bracket = buildBracket(jogos, resultados, mapaPaises);

  const sectionStyle: React.CSSProperties = {
    marginBottom: 72,
  };

  const h2Style: React.CSSProperties = {
    fontSize: "clamp(18px, 2.5vw, 26px)",
    fontFamily: "var(--ff-display)",
    fontWeight: 700,
    letterSpacing: "var(--letterspacing-display)",
    color: "var(--fg)",
    marginBottom: 4,
  };

  const descStyle: React.CSSProperties = {
    fontSize: 13,
    color: "var(--fg-muted)",
    marginBottom: 16,
    lineHeight: 1.55,
  };

  const svgWrapStyle: React.CSSProperties = {
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
    borderRadius: 12,
  };

  return (
    <div style={{ marginTop: 24, marginBottom: 80 }}>
      {/* Header */}
      <header style={{ textAlign: "center", marginBottom: 48 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 20,
            padding: "4px 14px",
            marginBottom: 14,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontFamily: "var(--ff-mono)",
              color: "var(--fg-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
            }}
          >
            Página Interna · Internal · Interno · Interne
          </span>
        </div>
        <h1
          style={{
            fontSize: "clamp(24px, 4vw, 40px)",
            fontFamily: "var(--ff-display)",
            fontWeight: 800,
            letterSpacing: "var(--letterspacing-display)",
            lineHeight: 1.1,
            color: "var(--fg)",
            margin: "0 0 10px",
          }}
        >
          Chaveamento · Bracket · Cuadro · Tableau
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "var(--fg-muted)",
            maxWidth: 640,
            margin: "0 auto 12px",
            lineHeight: 1.6,
          }}
        >
          PT: Cada seleção é uma bandeira. As linhas são trilhos — seguem a jornada de cada time até onde chegou.{" "}
          EN: Each team is a flag. Lines are rails — they trace each team&apos;s journey as far as they advanced.
        </p>
        <div
          style={{
            marginTop: 10,
            padding: "6px 14px",
            background: "color-mix(in srgb, var(--accent) 10%, transparent)",
            border: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)",
            borderRadius: 8,
            display: "inline-block",
            fontSize: 11,
            fontFamily: "var(--ff-mono)",
            color: "var(--fg-mid)",
          }}
        >
          J74 (Alemanha×Paraguai) e J75 (Países Baixos×Marrocos): 1×1 → pênaltis (hardcoded)
        </div>
        <p style={{ marginTop: 16, fontSize: 12, color: "var(--fg-dim)", fontFamily: "var(--ff-mono)" }}>
          4 variações visuais abaixo · role para comparar · 4 visual variations below
        </p>
      </header>

      {/* ─── VARIAÇÃO 1 ─── */}
      <section style={sectionStyle} aria-labelledby="v1-title">
        <h2 id="v1-title" style={h2Style}>
          Variação 1 — Metro Horizontal
        </h2>
        <p style={descStyle}>
          PT: 5 colunas esquerda→direita (R32 → Final). Bandeiras grandes como estações de metrô, trilhos Bezier curvos entre fases. Fundo dark cosmic.
          {" "}EN: 5 columns left→right (R32→Final). Large flags as metro stations, smooth Bezier rails between phases. Dark cosmic background.
          {" "}ES: 5 columnas izquierda→derecha. Banderas grandes como estaciones, rieles curvos.
          {" "}FR: 5 colonnes gauche→droite. Grands drapeaux comme stations de métro, rails courbés.
        </p>
        <div style={svgWrapStyle}>
          <V1Metro bracket={bracket} />
        </div>
      </section>

      {/* ─── VARIAÇÃO 2 ─── */}
      <section style={sectionStyle} aria-labelledby="v2-title">
        <h2 id="v2-title" style={h2Style}>
          Variação 2 — Bracket Clássico (Flag-Only)
        </h2>
        <p style={descStyle}>
          PT: Layout Wikipedia esq+dir+centro, mas onde havia cards de texto só há bandeiras circulares grandes. Fundo light/crème limpo com malha de pontos.
          {" "}EN: Classic bracket layout, but text cards replaced by large circular flags only. Clean light cream background with dot grid.
          {" "}ES: Cuadro clásico solo con banderas circulares grandes. Fondo crema limpio.
          {" "}FR: Tableau classique uniquement avec grands drapeaux circulaires. Fond crème clair.
        </p>
        <div style={svgWrapStyle}>
          <V2Bracket bracket={bracket} />
        </div>
      </section>

      {/* ─── VARIAÇÃO 3 ─── */}
      <section style={sectionStyle} aria-labelledby="v3-title">
        <h2 id="v3-title" style={h2Style}>
          Variação 3 — Radial Pétala
        </h2>
        <p style={descStyle}>
          PT: 32 bandeiras no anel externo, linhas convergem em anéis menores (R16, QF, SF) até a Final no centro. Como uma flor com pétalas de futebol. Fundo dark roxo-púrpura.
          {" "}EN: 32 flags on the outer ring, lines converge inward through rings (R16, QF, SF) to the Final at the center. Like a flower with football petals. Dark purple background.
          {" "}ES: 32 banderas en el anillo exterior, convergiendo hacia el centro. Fondo oscuro púrpura.
          {" "}FR: 32 drapeaux sur l&apos;anneau extérieur, convergeant vers la Finale au centre.
        </p>
        <div style={{ ...svgWrapStyle, display: "flex", justifyContent: "center" }}>
          <V3Radial bracket={bracket} />
        </div>
      </section>

      {/* ─── VARIAÇÃO 4 ─── */}
      <section style={sectionStyle} aria-labelledby="v4-title">
        <h2 id="v4-title" style={h2Style}>
          Variação 4 — Vertical Metro (Topo → Base)
        </h2>
        <p style={descStyle}>
          PT: 5 fileiras horizontais (R32 no topo, Final na base). Bandeiras grandes em cada fase, trilhos Bezier verticais descendo. Fundo lavanda suave.
          {" "}EN: 5 horizontal rows (R32 at top, Final at bottom). Large flags at each phase, vertical Bezier rails going down. Soft lavender background.
          {" "}ES: 5 filas horizontales de R32 arriba a Final abajo. Banderas grandes, rieles verticales curvos. Fondo lavanda suave.
          {" "}FR: 5 lignes horizontales de R32 en haut à la Finale en bas. Rails verticaux courbés. Fond lavande.
        </p>
        <div style={svgWrapStyle}>
          <V4Vertical bracket={bracket} />
        </div>
      </section>

      {/* Legend */}
      <div
        style={{
          marginTop: 8,
          display: "flex",
          gap: 24,
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          padding: "16px 0",
        }}
      >
        {[
          { label: "PT: Classificado — EN: Advanced — ES: Clasificado — FR: Qualifié", dot: "rgba(255,255,255,0.7)", ring: "rgba(255,255,255,0.7)" },
          { label: "PT: Eliminado — EN: Eliminated — ES: Eliminado — FR: Éliminé", dot: "rgba(255,255,255,0.25)", ring: "rgba(255,255,255,0.2)" },
          { label: "Brasil (glow especial)", dot: "#009C3B", ring: "#009C3B" },
        ].map(({ label, dot, ring }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width={24} height={24} viewBox="0 0 24 24">
              <circle cx={12} cy={12} r={8} fill={dot} opacity={0.3} />
              <circle cx={12} cy={12} r={8} fill="none" stroke={ring} strokeWidth={2} opacity={0.8} />
            </svg>
            <span style={{ fontSize: 11, fontFamily: "var(--ff-mono)", color: "var(--fg-muted)", maxWidth: 260 }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer
        style={{
          textAlign: "center",
          marginTop: 40,
          padding: "16px 24px",
          background: "var(--bg-soft)",
          borderRadius: 10,
          border: "1px solid var(--line)",
        }}
      >
        <p
          style={{
            fontSize: 10,
            fontFamily: "var(--ff-mono)",
            color: "var(--fg-dim)",
            margin: 0,
            letterSpacing: "0.06em",
          }}
        >
          Página interna · noindex · não listada · not listed · no indexada · non répertoriée
        </p>
      </footer>
    </div>
  );
}
