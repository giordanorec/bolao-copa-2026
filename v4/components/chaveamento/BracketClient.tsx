"use client";

/**
 * BracketClient — renders the knockout bracket SVG with animations.
 *
 * Architecture:
 * - R32 games are the ONLY source of team flags. Each flag lives exactly once.
 * - Winners animate from their R32 position to the correct R16 slot via CSS translate.
 * - Losers fade to 0.3 opacity in-place.
 * - R16/QF/SF/Final slots render as EMPTY placeholder boxes, no flags.
 *   (The animated flag that travels from R32 IS the flag that populates R16.)
 * - Future rounds (QF, SF, Final) are also empty placeholder boxes.
 *
 * Toggle modes:
 * - "spaced" (default): FLAG_R32=40, generous slot height (120px/game → 960px total).
 *   Each R16 slot has 130px height for 2 stacked flags. No overlap.
 * - "compact": FLAG_R32=52, tighter. Flags slightly bigger, slight overlap accepted.
 */

import { useState } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type SlotTime = {
  nome: string;
  iso?: string;
  eliminado?: boolean;
  vencedor?: boolean; // this team won the match
};

export type Confronto = {
  numero: number;
  timeA: SlotTime;
  timeB: SlotTime;
  gols_a: number | null;
  gols_b: number | null;
  vencedor: "a" | "b" | null;
  hasPenaltyNote: boolean;
};

type Props = {
  // R32 games on the left side (SF101 side), ordered top-to-bottom
  leftR32: Confronto[]; // indices 0-7 → game rows 0-7
  // R32 games on the right side (SF102 side), ordered top-to-bottom
  rightR32: Confronto[];
  // Which R16 slot does each R32 game feed?
  // leftR32[0], leftR32[1] → R16 slot 0 (J89)
  // leftR32[2], leftR32[3] → R16 slot 1 (J90)
  // leftR32[4], leftR32[5] → R16 slot 2 (J93)
  // leftR32[6], leftR32[7] → R16 slot 3 (J94)
  // rightR32 same mapping → slots 0-3 (J91, J92, J95, J96)
};

// ─── Layout constants (per mode) ───────────────────────────────────────────────

type Mode = "spaced" | "compact";

interface LayoutConfig {
  FLAG_R32: number;
  FLAG_R16: number;
  FLAG_QF: number;
  FLAG_SF: number;
  FLAG_F: number;
  GAME_H: number;   // height allocated for each R32 game row
  GAME_GAP: number; // vertical gap between R32 game rows
}

const LAYOUTS: Record<Mode, LayoutConfig> = {
  spaced: {
    FLAG_R32: 40,
    FLAG_R16: 44,
    FLAG_QF: 52,
    FLAG_SF: 62,
    FLAG_F: 80,
    GAME_H: 120,  // 2×40 + padding = 120 → comfortable
    GAME_GAP: 12,
  },
  compact: {
    FLAG_R32: 52,
    FLAG_R16: 56,
    FLAG_QF: 64,
    FLAG_SF: 74,
    FLAG_F: 92,
    GAME_H: 130,
    GAME_GAP: 8,
  },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

const COUNTRY_COLOR: Record<string, string> = {
  Brasil: "#009C3B",
  Argentina: "#74ACDF",
  França: "#0055A4",
  Alemanha: "#333333",
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
  "África do Sul": "#007A4D",
  Suécia: "#006AA7",
  Bósnia: "#002395",
  "Congo (RD)": "#007FFF",
  "Cabo Verde": "#003893",
  Gana: "#006B3F",
  Egito: "#CE1126",
  Argélia: "#006233",
  Áustria: "#ED2939",
};

function teamColor(nome: string): string {
  return COUNTRY_COLOR[nome] ?? "#C0A060";
}

function shortName(nome: string, max = 12): string {
  if (!nome || nome.startsWith("Venc.") || nome.startsWith("Perd.")) return "?";
  if (nome.length <= max) return nome;
  const abbr: Record<string, string> = {
    "Países Baixos": "P. Baixos",
    "Costa do Marfim": "C. Marfim",
    "África do Sul": "Áf. Sul",
    "Estados Unidos": "EUA",
    "Bósnia-Herzegovina": "Bósnia",
    "Nova Zelândia": "NZ",
    "Congo (RD)": "Congo RD",
  };
  return abbr[nome] ?? nome.slice(0, max - 1) + "…";
}

function isUnknownTeam(nome: string): boolean {
  return !nome || nome.startsWith("Venc.") || nome.startsWith("Perd.");
}

function flagUrl(iso: string): string {
  return `https://hatscripts.github.io/circle-flags/flags/${iso}.svg`;
}

// ─── SVG sub-components ────────────────────────────────────────────────────────

/**
 * Renders one circular flag at (cx, cy) with radius r.
 * Returns SVG elements (no animation — caller applies animation via style prop on wrapper).
 */
function FlagCircle({
  slot,
  cx,
  cy,
  r,
  faded,
  isBright,
  uid,
}: {
  slot: SlotTime;
  cx: number;
  cy: number;
  r: number;
  faded: boolean;
  isBright: boolean;
  uid: string;
}) {
  const unknown = isUnknownTeam(slot.nome);
  const color = teamColor(slot.nome);
  const clipId = `clip-${uid}`;

  return (
    <g opacity={faded ? 0.3 : 1}>
      {/* Glow ring for winners/bright teams */}
      {isBright && !unknown && (
        <circle
          cx={cx}
          cy={cy}
          r={r + 8}
          fill="none"
          stroke={color}
          strokeWidth={slot.nome === "Brasil" ? 3.5 : 2}
          opacity={slot.nome === "Brasil" ? 0.6 : 0.35}
        />
      )}
      <clipPath id={clipId}>
        <circle cx={cx} cy={cy} r={r} />
      </clipPath>
      {slot.iso && !unknown ? (
        <image
          href={flagUrl(slot.iso)}
          x={cx - r}
          y={cy - r}
          width={r * 2}
          height={r * 2}
          clipPath={`url(#${clipId})`}
          preserveAspectRatio="xMidYMid slice"
        />
      ) : (
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill={unknown ? "rgba(255,255,255,0.05)" : `${color}33`}
        />
      )}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={
          isBright && !unknown
            ? slot.nome === "Brasil"
              ? "#009C3B"
              : `${color}CC`
            : "rgba(255,255,255,0.18)"
        }
        strokeWidth={
          isBright && !unknown ? (slot.nome === "Brasil" ? 3.5 : 2) : 1
        }
      />
      {unknown && (
        <text
          x={cx}
          y={cy + r * 0.32}
          textAnchor="middle"
          fontSize={r * 0.7}
          fill="rgba(255,255,255,0.25)"
          fontFamily="system-ui"
        >
          ?
        </text>
      )}
    </g>
  );
}

/**
 * Placeholder box for a slot that hasn't been filled yet (future rounds).
 * Shows a dashed circle outline.
 */
function SlotPlaceholder({
  cx,
  cy,
  r,
}: {
  cx: number;
  cy: number;
  r: number;
}) {
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill="none"
      stroke="rgba(255,255,255,0.1)"
      strokeWidth={1}
      strokeDasharray="4 3"
    />
  );
}

// ─── Right-angle connector path ────────────────────────────────────────────────

function rightAnglePath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): string {
  if (Math.abs(y1 - y2) < 1) return `M ${x1} ${y1} H ${x2}`;
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} H ${mx} V ${y2} H ${x2}`;
}

// ─── Main bracket component ────────────────────────────────────────────────────

export default function BracketClient({ leftR32, rightR32 }: Props) {
  const [mode, setMode] = useState<Mode>("spaced");
  const cfg = LAYOUTS[mode];

  const {
    FLAG_R32,
    FLAG_R16,
    FLAG_QF,
    FLAG_SF,
    FLAG_F,
    GAME_H,
    GAME_GAP,
  } = cfg;

  // ─── SVG geometry ────────────────────────────────────────────────────────────

  const SVG_W = 2100;
  const CENTER_X = SVG_W / 2;
  const TOP_OFFSET = 55;
  const PHASE_W = 240;

  // Phase X positions — left side (left → center)
  const LR32_X = 85;
  const LR16_X = LR32_X + PHASE_W;
  const LQF_X = LR16_X + PHASE_W;
  const LSF_X = LQF_X + PHASE_W;

  // Phase X positions — right side (right → center, mirrored)
  const RR32_X = SVG_W - 85;
  const RR16_X = RR32_X - PHASE_W;
  const RQF_X = RR16_X - PHASE_W;
  const RSF_X = RQF_X - PHASE_W;

  // ─── Y coordinate helpers ─────────────────────────────────────────────────────

  const step = GAME_H + GAME_GAP;

  /** Top-y of game row gi */
  function rowTopY(gi: number): number {
    return TOP_OFFSET + gi * step;
  }
  /** Center-y of team A in game row gi */
  function teamAY(gi: number): number {
    return rowTopY(gi) + FLAG_R32 + 4;
  }
  /** Center-y of team B in game row gi */
  function teamBY(gi: number): number {
    return rowTopY(gi) + GAME_H - FLAG_R32 - 4;
  }
  /** Mid-y of game row gi (between the two teams) */
  function gameMidY(gi: number): number {
    return (teamAY(gi) + teamBY(gi)) / 2;
  }

  /**
   * Center-y of R16 slot r16Idx (0-3 per side).
   * Each R16 slot aggregates two R32 game rows.
   * We place team A at (midpoint - FLAG_R16 - 6) and team B at (midpoint + FLAG_R16 + 6).
   */
  function r16MidY(r16Idx: number): number {
    const g1 = r16Idx * 2;
    const g2 = r16Idx * 2 + 1;
    return (gameMidY(g1) + gameMidY(g2)) / 2;
  }
  function r16TeamAY(r16Idx: number): number {
    return r16MidY(r16Idx) - FLAG_R16 - 6;
  }
  function r16TeamBY(r16Idx: number): number {
    return r16MidY(r16Idx) + FLAG_R16 + 6;
  }

  /**
   * Center-y of QF slot qfIdx (0-1 per side).
   * Each QF slot aggregates two R16 slots.
   */
  function qfMidY(qfIdx: number): number {
    return (r16MidY(qfIdx * 2) + r16MidY(qfIdx * 2 + 1)) / 2;
  }
  function qfTeamAY(qfIdx: number): number {
    return qfMidY(qfIdx) - FLAG_QF - 8;
  }
  function qfTeamBY(qfIdx: number): number {
    return qfMidY(qfIdx) + FLAG_QF + 8;
  }

  /** Center-y of SF (one per side) */
  function sfMidY(): number {
    return (qfMidY(0) + qfMidY(1)) / 2;
  }
  function sfTeamAY(): number {
    return sfMidY() - FLAG_SF - 10;
  }
  function sfTeamBY(): number {
    return sfMidY() + FLAG_SF + 10;
  }

  const finalY = sfMidY();

  // Total SVG height
  const TOTAL_ROWS_H = 8 * GAME_H + 7 * GAME_GAP;
  const SVG_H = TOTAL_ROWS_H + TOP_OFFSET + 80;

  // ─── Animation spec computation ───────────────────────────────────────────────

  /**
   * For each decided R32 game, compute:
   * - origin (cx, cy) = the winner's position in R32 layout
   * - destination (cx, cy) = the position in R16 layout
   * - animId = unique CSS animation name
   * - delay = seconds before animation starts (after 1.5s initial pause)
   *
   * The winner flag is rendered AT its R32 position.
   * CSS transform translate(dx, dy) moves it to its R16 position.
   */

  type AnimSpec = {
    animId: string;
    fromCX: number;
    fromCY: number;
    toCX: number;
    toCY: number;
    delay: number; // seconds total (includes initial pause)
    side: "L" | "R";
    jNum: number;
    winnerSide: "a" | "b";
  };

  const animSpecs: AnimSpec[] = [];

  // Initial delay before any animation starts
  const INIT_PAUSE = 1.2; // seconds
  const PER_TEAM_DELAY = 0.45; // seconds between each team animation

  let delayCounter = 0;

  // LEFT side
  leftR32.forEach((c, gi) => {
    if (c.vencedor === null) return;
    const r16Idx = Math.floor(gi / 2);
    const isA = c.vencedor === "a";
    const fromCX = LR32_X;
    const fromCY = isA ? teamAY(gi) : teamBY(gi);
    // In R16, the two teams from the two R32 games become teamA (from top game) and teamB (from bottom game)
    // gi=0,2 (top of pair) → r16TeamAY; gi=1,3 (bottom of pair) → r16TeamBY
    const isTopOfPair = gi % 2 === 0;
    const toCX = LR16_X;
    const toCY = isTopOfPair ? r16TeamAY(r16Idx) : r16TeamBY(r16Idx);

    animSpecs.push({
      animId: `adv-L-${c.numero}-${c.vencedor}`,
      fromCX,
      fromCY,
      toCX,
      toCY,
      delay: INIT_PAUSE + delayCounter * PER_TEAM_DELAY,
      side: "L",
      jNum: c.numero,
      winnerSide: c.vencedor,
    });
    delayCounter++;
  });

  // RIGHT side — continue delay counter
  rightR32.forEach((c, gi) => {
    if (c.vencedor === null) return;
    const r16Idx = Math.floor(gi / 2);
    const isA = c.vencedor === "a";
    const fromCX = RR32_X;
    const fromCY = isA ? teamAY(gi) : teamBY(gi);
    const isTopOfPair = gi % 2 === 0;
    const toCX = RR16_X;
    const toCY = isTopOfPair ? r16TeamAY(r16Idx) : r16TeamBY(r16Idx);

    animSpecs.push({
      animId: `adv-R-${c.numero}-${c.vencedor}`,
      fromCX,
      fromCY,
      toCX,
      toCY,
      delay: INIT_PAUSE + delayCounter * PER_TEAM_DELAY,
      side: "R",
      jNum: c.numero,
      winnerSide: c.vencedor,
    });
    delayCounter++;
  });

  // Total animation cycle duration (last delay + 1.5s travel + 8s hold + repeat)
  const lastDelay = animSpecs.length > 0
    ? Math.max(...animSpecs.map((s) => s.delay))
    : INIT_PAUSE;
  const TRAVEL_DURATION = 1.2; // seconds for each flag to slide
  const HOLD_DURATION = 10;    // seconds to hold at R16 before looping
  const CYCLE = lastDelay + TRAVEL_DURATION + HOLD_DURATION;

  // Build CSS keyframes
  function buildKeyframe(spec: AnimSpec): string {
    const dx = spec.toCX - spec.fromCX;
    const dy = spec.toCY - spec.fromCY;
    const pStart = ((spec.delay / CYCLE) * 100).toFixed(2);
    const pEnd = (((spec.delay + TRAVEL_DURATION) / CYCLE) * 100).toFixed(2);
    return `@keyframes ${spec.animId} {
  0%, ${pStart}% { transform: translate(0px, 0px); opacity: 1; }
  ${pEnd}%, 100% { transform: translate(${Math.round(dx)}px, ${Math.round(dy)}px); opacity: 1; }
}`;
  }

  // Loser fade keyframes — fade to 0.3 at same time as winner starts moving
  function buildLoserKeyframe(spec: AnimSpec, loserSide: "a" | "b"): string {
    const loserAnimId = `fade-${spec.animId}-${loserSide}`;
    const pStart = ((spec.delay / CYCLE) * 100).toFixed(2);
    const pEnd = (((spec.delay + 0.8) / CYCLE) * 100).toFixed(2);
    return `@keyframes ${loserAnimId} {
  0%, ${pStart}% { opacity: 1; }
  ${pEnd}%, 100% { opacity: 0.3; }
}`;
  }

  // Build all CSS
  const allKeyframes: string[] = [];
  animSpecs.forEach((spec) => {
    allKeyframes.push(buildKeyframe(spec));
    // Loser is the OTHER side
    const loserSide = spec.winnerSide === "a" ? "b" : "a";
    allKeyframes.push(buildLoserKeyframe(spec, loserSide));
  });

  const fullCSS = allKeyframes.join("\n");

  // Map for quick lookup: (side, jNum) → animSpec
  const animLookup = new Map<string, AnimSpec>();
  animSpecs.forEach((s) => {
    animLookup.set(`${s.side}-${s.jNum}`, s);
  });

  function getAnimSpec(side: "L" | "R", jNum: number): AnimSpec | undefined {
    return animLookup.get(`${side}-${jNum}`);
  }

  // ─── Rendering helpers ───────────────────────────────────────────────────────

  /**
   * Render one R32 game row.
   * - Winner: rendered normally, with advance animation applied.
   * - Loser: rendered normally, with fade animation applied.
   * - Undecided teams: rendered normally, no animation.
   */
  function renderR32Game(
    c: Confronto,
    gi: number,
    side: "L" | "R",
    flagCX: number,
    textRight: boolean,
  ) {
    const aY = teamAY(gi);
    const bY = teamBY(gi);
    const midY = gameMidY(gi);
    const decided = c.vencedor !== null;
    const spec = decided ? getAnimSpec(side, c.numero) : undefined;
    const winnerSide = c.vencedor;

    const loserAnimIdA =
      decided && winnerSide === "b"
        ? `fade-${spec!.animId}-a`
        : undefined;
    const loserAnimIdB =
      decided && winnerSide === "a"
        ? `fade-${spec!.animId}-b`
        : undefined;

    const BRACKET_X = side === "L" ? flagCX + FLAG_R32 + 3 : flagCX - FLAG_R32 - 3;
    const EXIT_X = side === "L" ? flagCX + PHASE_W / 2 : flagCX - PHASE_W / 2;

    // Score label X
    const scoreLabelX =
      side === "L"
        ? BRACKET_X + 38
        : BRACKET_X - 38;

    return (
      <g key={`r32-${side}-${c.numero}`}>
        {/* Vertical bracket bar connecting team A and B */}
        <line
          x1={BRACKET_X}
          y1={aY}
          x2={BRACKET_X}
          y2={bY}
          stroke="rgba(255,255,255,0.13)"
          strokeWidth={1}
        />
        {/* Horizontal exit line from midpoint toward R16 */}
        <line
          x1={BRACKET_X}
          y1={midY}
          x2={EXIT_X}
          y2={midY}
          stroke={
            decided
              ? teamColor(winnerSide === "a" ? c.timeA.nome : c.timeB.nome)
              : "rgba(255,255,255,0.1)"
          }
          strokeWidth={decided ? 1.8 : 1}
          strokeOpacity={decided ? 0.7 : 0.5}
        />
        {/* Team A */}
        <g
          style={
            spec && winnerSide === "a"
              ? {
                  animation: `${spec.animId} ${CYCLE}s ease-out infinite`,
                  animationDelay: "0s",
                }
              : loserAnimIdA
              ? {
                  animation: `${loserAnimIdA} ${CYCLE}s ease-out infinite`,
                }
              : undefined
          }
        >
          <FlagCircle
            slot={c.timeA}
            cx={flagCX}
            cy={aY}
            r={FLAG_R32}
            faded={false}
            isBright={!decided || winnerSide === "a"}
            uid={`r32${side}${c.numero}a`}
          />
          <text
            x={textRight ? flagCX + FLAG_R32 + 6 : flagCX - FLAG_R32 - 6}
            y={aY + 5}
            fontSize={Math.max(10, FLAG_R32 * 0.28)}
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight={!decided || winnerSide === "a" ? 600 : 400}
            fill={
              !decided || winnerSide === "a"
                ? c.timeA.nome === "Brasil"
                  ? "#4ADE80"
                  : "rgba(255,255,255,0.88)"
                : "rgba(255,255,255,0.35)"
            }
            textAnchor={textRight ? "start" : "end"}
          >
            {isUnknownTeam(c.timeA.nome) ? "?" : shortName(c.timeA.nome, 11)}
          </text>
        </g>
        {/* Team B */}
        <g
          style={
            spec && winnerSide === "b"
              ? {
                  animation: `${spec.animId} ${CYCLE}s ease-out infinite`,
                  animationDelay: "0s",
                }
              : loserAnimIdB
              ? {
                  animation: `${loserAnimIdB} ${CYCLE}s ease-out infinite`,
                }
              : undefined
          }
        >
          <FlagCircle
            slot={c.timeB}
            cx={flagCX}
            cy={bY}
            r={FLAG_R32}
            faded={false}
            isBright={!decided || winnerSide === "b"}
            uid={`r32${side}${c.numero}b`}
          />
          <text
            x={textRight ? flagCX + FLAG_R32 + 6 : flagCX - FLAG_R32 - 6}
            y={bY + 5}
            fontSize={Math.max(10, FLAG_R32 * 0.28)}
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight={!decided || winnerSide === "b" ? 600 : 400}
            fill={
              !decided || winnerSide === "b"
                ? c.timeB.nome === "Brasil"
                  ? "#4ADE80"
                  : "rgba(255,255,255,0.88)"
                : "rgba(255,255,255,0.35)"
            }
            textAnchor={textRight ? "start" : "end"}
          >
            {isUnknownTeam(c.timeB.nome) ? "?" : shortName(c.timeB.nome, 11)}
          </text>
        </g>
        {/* Score */}
        {c.gols_a !== null && c.gols_b !== null && (
          <text
            x={scoreLabelX}
            y={midY + 5}
            textAnchor="middle"
            fontSize={11}
            fill="#FFD700"
            fontFamily="monospace"
            opacity={0.85}
          >
            {c.hasPenaltyNote
              ? `${c.gols_a}×${c.gols_b} pen.`
              : `${c.gols_a}×${c.gols_b}`}
          </text>
        )}
      </g>
    );
  }

  /**
   * Render connector lines from R32 exit points to R16 slot entry points.
   */
  function renderR32toR16Connectors(
    side: "L" | "R",
    r16Idx: number, // 0-3
    r32Games: Confronto[], // full array
  ) {
    const g1 = r16Idx * 2;
    const g2 = r16Idx * 2 + 1;
    const EXIT_X =
      side === "L"
        ? LR32_X + PHASE_W / 2
        : RR32_X - PHASE_W / 2;
    const ENTRY_X =
      side === "L"
        ? LR16_X - FLAG_R16 - 6
        : RR16_X + FLAG_R16 + 6;

    const mid1Y = gameMidY(g1);
    const mid2Y = gameMidY(g2);
    const entryAY = r16TeamAY(r16Idx);
    const entryBY = r16TeamBY(r16Idx);

    // Connector from game1 midpoint to R16 slot teamA entry
    // Connector from game2 midpoint to R16 slot teamB entry
    return (
      <g key={`conn-r32-r16-${side}-${r16Idx}`}>
        <path
          d={rightAnglePath(EXIT_X, mid1Y, ENTRY_X, entryAY)}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={1.5}
        />
        <path
          d={rightAnglePath(EXIT_X, mid2Y, ENTRY_X, entryBY)}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={1.5}
        />
        {/* Vertical bar at R16 entry connecting teamA and teamB placeholders */}
        <line
          x1={side === "L" ? LR16_X + FLAG_R16 + 3 : RR16_X - FLAG_R16 - 3}
          y1={entryAY}
          x2={side === "L" ? LR16_X + FLAG_R16 + 3 : RR16_X - FLAG_R16 - 3}
          y2={entryBY}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={1}
        />
        {/* Placeholder circles for R16 slots */}
        <SlotPlaceholder
          cx={side === "L" ? LR16_X : RR16_X}
          cy={entryAY}
          r={FLAG_R16}
        />
        <SlotPlaceholder
          cx={side === "L" ? LR16_X : RR16_X}
          cy={entryBY}
          r={FLAG_R16}
        />
        {/* Exit line from R16 toward QF */}
        <line
          x1={side === "L" ? LR16_X + FLAG_R16 + 3 : RR16_X - FLAG_R16 - 3}
          y1={r16MidY(r16Idx)}
          x2={side === "L" ? LR16_X + PHASE_W / 2 : RR16_X - PHASE_W / 2}
          y2={r16MidY(r16Idx)}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={1.5}
        />
      </g>
    );
  }

  /**
   * Render QF slot (empty placeholder) + connectors.
   */
  function renderQFSlot(side: "L" | "R", qfIdx: number) {
    const flagCX = side === "L" ? LQF_X : RQF_X;
    const aY = qfTeamAY(qfIdx);
    const bY = qfTeamBY(qfIdx);
    const midY = qfMidY(qfIdx);
    const EXIT_X = side === "L" ? LR16_X + PHASE_W / 2 : RR16_X - PHASE_W / 2;
    const ENTRY_X =
      side === "L"
        ? LQF_X - FLAG_QF - 6
        : RQF_X + FLAG_QF + 6;
    const BRACKET_X = side === "L" ? flagCX + FLAG_QF + 3 : flagCX - FLAG_QF - 3;

    return (
      <g key={`qf-${side}-${qfIdx}`}>
        {/* Connectors from R16 exits to QF entries */}
        <path
          d={rightAnglePath(EXIT_X, r16MidY(qfIdx * 2), ENTRY_X, aY)}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={1.5}
        />
        <path
          d={rightAnglePath(EXIT_X, r16MidY(qfIdx * 2 + 1), ENTRY_X, bY)}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={1.5}
        />
        {/* Bracket bar */}
        <line
          x1={BRACKET_X}
          y1={aY}
          x2={BRACKET_X}
          y2={bY}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={1}
        />
        {/* Placeholder slots */}
        <SlotPlaceholder cx={flagCX} cy={aY} r={FLAG_QF} />
        <SlotPlaceholder cx={flagCX} cy={bY} r={FLAG_QF} />
        {/* Exit toward SF */}
        <line
          x1={BRACKET_X}
          y1={midY}
          x2={side === "L" ? LQF_X + PHASE_W / 2 : RQF_X - PHASE_W / 2}
          y2={midY}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={1.5}
        />
      </g>
    );
  }

  /**
   * Render SF slot (empty placeholder) + connectors.
   */
  function renderSFSlot(side: "L" | "R") {
    const flagCX = side === "L" ? LSF_X : RSF_X;
    const aY = sfTeamAY();
    const bY = sfTeamBY();
    const midY = sfMidY();
    const EXIT_X =
      side === "L"
        ? LQF_X + PHASE_W / 2
        : RQF_X - PHASE_W / 2;
    const ENTRY_X =
      side === "L"
        ? LSF_X - FLAG_SF - 8
        : RSF_X + FLAG_SF + 8;
    const BRACKET_X =
      side === "L"
        ? LSF_X + FLAG_SF + 5
        : RSF_X - FLAG_SF - 5;
    // SF → Final connector
    const FINAL_X =
      side === "L"
        ? CENTER_X - FLAG_F - 18
        : CENTER_X + FLAG_F + 18;

    return (
      <g key={`sf-${side}`}>
        {/* Connectors from QF exits to SF entries */}
        <path
          d={rightAnglePath(EXIT_X, qfMidY(0), ENTRY_X, aY)}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={1.5}
        />
        <path
          d={rightAnglePath(EXIT_X, qfMidY(1), ENTRY_X, bY)}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={1.5}
        />
        {/* Bracket bar */}
        <line
          x1={BRACKET_X}
          y1={aY}
          x2={BRACKET_X}
          y2={bY}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={1}
        />
        {/* Placeholder slots */}
        <SlotPlaceholder cx={flagCX} cy={aY} r={FLAG_SF} />
        <SlotPlaceholder cx={flagCX} cy={bY} r={FLAG_SF} />
        {/* SF → Final */}
        <line
          x1={BRACKET_X}
          y1={midY}
          x2={FINAL_X}
          y2={midY}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={1.5}
        />
      </g>
    );
  }

  /**
   * Render Final + Trophy at center.
   */
  function renderFinal() {
    const cy = finalY;
    const TROPHY_SIZE = 100;

    return (
      <g key="final">
        {/* Glow aura */}
        <circle
          cx={CENTER_X}
          cy={cy}
          r={80}
          fill="none"
          stroke="#FFD700"
          strokeWidth={1}
          opacity={0.12}
        />
        <circle cx={CENTER_X} cy={cy} r={55} fill="rgba(255,215,0,0.04)" />
        {/* Trophy */}
        <foreignObject
          x={CENTER_X - TROPHY_SIZE / 2}
          y={cy - TROPHY_SIZE * 0.88}
          width={TROPHY_SIZE}
          height={TROPHY_SIZE}
        >
          <div
            style={{
              width: TROPHY_SIZE,
              height: TROPHY_SIZE,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: TROPHY_SIZE * 0.82,
              lineHeight: 1,
              filter: "drop-shadow(0 0 20px #FFD700AA)",
            }}
          >
            🏆
          </div>
        </foreignObject>
        {/* Placeholder slots for finalists */}
        <SlotPlaceholder cx={CENTER_X - 100} cy={cy} r={FLAG_F} />
        <SlotPlaceholder cx={CENTER_X + 100} cy={cy} r={FLAG_F} />
        {/* "CAMPEÃO" label */}
        <text
          x={CENTER_X}
          y={cy + 28}
          textAnchor="middle"
          fontSize={12}
          fontWeight={800}
          letterSpacing={3}
          fill="#FFD700"
          fontFamily="system-ui"
          opacity={0.65}
        >
          CAMPEÃO
        </text>
        {/* J104 label */}
        <text
          x={CENTER_X}
          y={cy - TROPHY_SIZE * 0.72}
          textAnchor="middle"
          fontSize={10}
          fill="rgba(255,215,0,0.45)"
          fontFamily="system-ui"
          letterSpacing={1}
        >
          J104 · FINAL
        </text>
      </g>
    );
  }

  // ─── Phase labels ─────────────────────────────────────────────────────────────

  const phaseLabels: [string, number][] = [
    ["R32", LR32_X],
    ["OITAVAS", LR16_X],
    ["QUARTAS", LQF_X],
    ["SEMI", LSF_X],
    ["FINAL", CENTER_X],
    ["SEMI", RSF_X],
    ["QUARTAS", RQF_X],
    ["OITAVAS", RR16_X],
    ["R32", RR32_X],
  ];

  // ─── JSX ──────────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Toggle chips */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 10,
          padding: "12px 0 20px",
        }}
      >
        <button
          onClick={() => setMode("spaced")}
          style={{
            padding: "6px 18px",
            borderRadius: 20,
            border: "1px solid",
            borderColor: mode === "spaced" ? "#FFD700" : "rgba(255,255,255,0.2)",
            background:
              mode === "spaced" ? "rgba(255,215,0,0.1)" : "transparent",
            color: mode === "spaced" ? "#FFD700" : "rgba(255,255,255,0.5)",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 0.5,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          Sem sobreposição
        </button>
        <button
          onClick={() => setMode("compact")}
          style={{
            padding: "6px 18px",
            borderRadius: 20,
            border: "1px solid",
            borderColor:
              mode === "compact" ? "#FFD700" : "rgba(255,255,255,0.2)",
            background:
              mode === "compact" ? "rgba(255,215,0,0.1)" : "transparent",
            color:
              mode === "compact" ? "#FFD700" : "rgba(255,255,255,0.5)",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 0.5,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          Com sobreposição
        </button>
      </div>

      {/* SVG bracket — scrollable on mobile */}
      <div
        style={{
          overflowX: "auto",
          width: "100%",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          width={SVG_W}
          height={SVG_H}
          style={{
            display: "block",
            minWidth: SVG_W,
            background:
              "linear-gradient(135deg, #0a0e1a 0%, #111827 60%, #0d1520 100%)",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
          aria-label="Chaveamento da Copa do Mundo 2026"
        >
          {/* Animation CSS */}
          <defs>
            <style>{fullCSS}</style>
          </defs>

          {/* Phase labels */}
          {phaseLabels.map(([label, x]) => (
            <text
              key={`lbl-${label}-${x}`}
              x={x}
              y={28}
              textAnchor="middle"
              fontSize={label === "FINAL" ? 13 : 11}
              fontWeight={700}
              letterSpacing={1.5}
              fill={label === "FINAL" ? "#FFD700" : "rgba(255,255,255,0.3)"}
              fontFamily="system-ui"
            >
              {label}
            </text>
          ))}

          {/* ── LEFT SIDE R32 games ── */}
          {leftR32.map((c, gi) =>
            renderR32Game(c, gi, "L", LR32_X, true),
          )}

          {/* ── LEFT SIDE R16 connectors + placeholder slots ── */}
          {[0, 1, 2, 3].map((r16Idx) =>
            renderR32toR16Connectors("L", r16Idx, leftR32),
          )}

          {/* ── LEFT SIDE QF placeholder slots ── */}
          {[0, 1].map((qfIdx) => renderQFSlot("L", qfIdx))}

          {/* ── LEFT SIDE SF placeholder slot ── */}
          {renderSFSlot("L")}

          {/* ── RIGHT SIDE R32 games ── */}
          {rightR32.map((c, gi) =>
            renderR32Game(c, gi, "R", RR32_X, false),
          )}

          {/* ── RIGHT SIDE R16 connectors + placeholder slots ── */}
          {[0, 1, 2, 3].map((r16Idx) =>
            renderR32toR16Connectors("R", r16Idx, rightR32),
          )}

          {/* ── RIGHT SIDE QF placeholder slots ── */}
          {[0, 1].map((qfIdx) => renderQFSlot("R", qfIdx))}

          {/* ── RIGHT SIDE SF placeholder slot ── */}
          {renderSFSlot("R")}

          {/* ── FINAL + TROPHY ── */}
          {renderFinal()}
        </svg>
      </div>
    </div>
  );
}
