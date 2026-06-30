"use client";

/**
 * BracketClient — renders the knockout bracket SVG with animations.
 *
 * Architecture:
 * - R32 games are the ONLY source of team flags. Each flag lives exactly once.
 * - Winners animate from their R32 position to the correct R16 slot via CSS
 *   offset-path (right-angle H→V→H trajectory). More reliable than SMIL animateMotion.
 * - Losers fade to 0.80 opacity in-place (CSS animation).
 * - R16/QF/SF/Final slots render as very subtle placeholder marks (opacity 0.08).
 * - Future rounds (QF, SF, Final) are also subtle placeholder marks.
 *
 * Animation chronology:
 * - Decided games are sorted by their real match date+time before assigning
 *   delay slots — so the earliest-played match animates first.
 * - Each flag follows the right-angle connector path exactly via CSS offset-path
 *   (absolute H → V → H trajectory). No diagonal movement.
 *
 * Layout:
 * - GAME_H=130, FLAG_R32=30 → 2×(2×30)+10=130 tight fit, no overlap.
 * - SVG_H ≈ 8×130 + 7×12 + top/bottom ≈ 1199 — fits better on vertical viewports.
 */


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
  /** ISO date string YYYY-MM-DD from jogos.json */
  data: string;
  /** Time string HH:MM from jogos.json */
  hora: string;
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

// ─── Layout constants ──────────────────────────────────────────────────────────

// Math check: GAME_H=130, FLAG_R32=30
// Two flags per game: diameter 60 each + 10px gap = 130 → tight, no overlap.
const FLAG_R32 = 30;
const FLAG_R16 = 36;
const FLAG_QF  = 46;
const FLAG_SF  = 58;
const FLAG_F   = 90;
const GAME_H   = 130;  // 2×(2×30)+10 = 130 — no overlap
const GAME_GAP = 12;

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

/** Convert "YYYY-MM-DD" + "HH:MM" to a sortable numeric key */
function gameDateTime(data: string, hora: string): number {
  return new Date(`${data}T${hora}`).getTime();
}

// ─── SVG sub-components ────────────────────────────────────────────────────────

/**
 * Renders one circular flag at (cx, cy) with radius r.
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
    // Fix 4: eliminated teams at 0.80 opacity (only 20% fade), not 0.3
    <g opacity={faded ? 0.80 : 1}>
      {/* Glow ring for winners/bright teams */}
      {isBright && !unknown && (
        <circle
          cx={cx}
          cy={cy}
          r={r + 7}
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
 * Fix 1: Placeholder circle for a slot that hasn't been filled yet.
 * Very subtle — opacity 0.08, thin dashed stroke "2 4".
 * Does NOT draw a filled shape, just a barely-visible reference mark.
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
      stroke="rgba(255,255,255,0.08)"
      strokeWidth={1}
      strokeDasharray="2 4"
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
    // padding 5 from top of row + FLAG_R32 radius
    return rowTopY(gi) + 5 + FLAG_R32;
  }
  /** Center-y of team B in game row gi */
  function teamBY(gi: number): number {
    // padding 5 from bottom of row + FLAG_R32 radius
    return rowTopY(gi) + GAME_H - 5 - FLAG_R32;
  }
  /** Mid-y of game row gi (between the two teams) */
  function gameMidY(gi: number): number {
    return (teamAY(gi) + teamBY(gi)) / 2;
  }

  /**
   * Center-y of R16 slot r16Idx (0-3 per side).
   * Each R16 slot aggregates two R32 game rows.
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

  // Total SVG height — Fix 2: with GAME_H=130 instead of 170
  const TOTAL_ROWS_H = 8 * GAME_H + 7 * GAME_GAP;
  const SVG_H = TOTAL_ROWS_H + TOP_OFFSET + 80;

  // Fix 5: Trophy at true vertical center of SVG
  const CENTER_Y = SVG_H / 2;
  const finalY = CENTER_Y;

  // ─── Animation spec computation (CSS offset-path) ─────────────────────────────

  /**
   * Fix 3: Use CSS offset-path instead of SMIL animateMotion.
   *
   * CSS offset-path with path() uses ABSOLUTE SVG coordinates.
   * The <g> element has NO transform — it starts at (0,0) in SVG space.
   * The offset-path moves the element's "anchor point" (its own 0,0) along
   * the absolute path. So the path goes from (fromCX, fromCY) to (toCX, toCY)
   * via a right-angle H→V→H route.
   *
   * offset-anchor: "50% 50%" centers the element on the path point.
   * We compensate by offsetting the FlagCircle cx/cy by 0,0 (anchor is center).
   *
   * The animation uses CSS keyframes:
   *   from { offset-distance: 0% }
   *   to   { offset-distance: 100% }
   * with animation-delay and animation-fill-mode: forwards.
   *
   * Looping: we use animation-iteration-count: infinite with a long-period
   * calculation using animation-delay negative trick for phased starts.
   */

  type AnimSpec = {
    uid: string;        // unique CSS class suffix
    fromCX: number;
    fromCY: number;
    toCX: number;
    toCY: number;
    /** Absolute right-angle path: M fromCX fromCY H midX V toCY H toCX */
    absPath: string;
    delayS: number;       // seconds from cycle start when THIS animation begins
    side: "L" | "R";
    jNum: number;
    winnerSide: "a" | "b";
    gi: number;
    dateTime: number;
  };

  // Animation timing constants
  const INIT_PAUSE = 1.2;    // seconds before first animation
  const TRAVEL_DURATION = 1.5; // seconds per flag travel
  const INTER_GAP = 0.3;     // gap between sequential animations
  const HOLD_DURATION = 10;  // seconds to hold final state before repeat

  const unsortedSpecs: AnimSpec[] = [];

  function collectSpecs(
    games: Confronto[],
    side: "L" | "R",
    flagCX: number,
    r16CX: number,
  ) {
    games.forEach((c, gi) => {
      if (c.vencedor === null) return;
      const r16Idx = Math.floor(gi / 2);
      const isA = c.vencedor === "a";
      const fromCX = flagCX;
      const fromCY = isA ? teamAY(gi) : teamBY(gi);
      const isTopOfPair = gi % 2 === 0;
      const toCX = r16CX;
      const toCY = isTopOfPair ? r16TeamAY(r16Idx) : r16TeamBY(r16Idx);

      // Midpoint X for the right-angle bend
      const midX = (fromCX + toCX) / 2;

      // Absolute path: go horizontal to midX, then vertical to toCY, then horizontal to toCX
      let absPath: string;
      if (Math.abs(fromCY - toCY) < 1) {
        absPath = `M ${Math.round(fromCX)} ${Math.round(fromCY)} H ${Math.round(toCX)}`;
      } else {
        absPath = `M ${Math.round(fromCX)} ${Math.round(fromCY)} H ${Math.round(midX)} V ${Math.round(toCY)} H ${Math.round(toCX)}`;
      }

      const uid = `adv-${side}-${c.numero}-${c.vencedor}`;

      unsortedSpecs.push({
        uid,
        fromCX,
        fromCY,
        toCX,
        toCY,
        absPath,
        delayS: 0, // assigned after sorting
        side,
        jNum: c.numero,
        winnerSide: c.vencedor,
        gi,
        dateTime: gameDateTime(c.data, c.hora),
      });
    });
  }

  collectSpecs(leftR32, "L", LR32_X, LR16_X);
  collectSpecs(rightR32, "R", RR32_X, RR16_X);

  // Sort chronologically
  unsortedSpecs.sort((a, b) => a.dateTime - b.dateTime);

  // Assign sequential delays
  const animSpecs: AnimSpec[] = unsortedSpecs.map((spec, idx) => ({
    ...spec,
    delayS: INIT_PAUSE + idx * (TRAVEL_DURATION + INTER_GAP),
  }));

  // Full cycle duration
  const lastAnimStart = animSpecs.length > 0
    ? Math.max(...animSpecs.map((s) => s.delayS))
    : INIT_PAUSE;
  const CYCLE = lastAnimStart + TRAVEL_DURATION + HOLD_DURATION;

  // Build lookup
  const animLookup = new Map<string, AnimSpec>();
  animSpecs.forEach((s) => {
    animLookup.set(`${s.side}-${s.jNum}`, s);
  });

  function getAnimSpec(side: "L" | "R", jNum: number): AnimSpec | undefined {
    return animLookup.get(`${side}-${jNum}`);
  }

  // Build CSS for all winner/loser animations.
  // Each flag gets a unique @keyframes + CSS class.
  // The animation-duration is the full CYCLE, so all flags are synchronized.
  // The keyframes hold at offset-distance 0% until the flag's travel window,
  // travel to 100% during the window, then hold at 100% for the rest of the cycle.
  // animation-iteration-count: infinite loops the whole cycle seamlessly.

  function buildCSS(): string {
    const rules: string[] = [];

    animSpecs.forEach((spec) => {
      const travelFraction = TRAVEL_DURATION / CYCLE;
      const startFraction = spec.delayS / CYCLE;
      const endFraction = startFraction + travelFraction;

      const startPct = (startFraction * 100).toFixed(2);
      const endPct = (endFraction * 100).toFixed(2);

      // Winner flag: CSS offset-path animation.
      //
      // The winner <g> has transform="translate(fromCX, fromCY)" and its children
      // (FlagCircle + label) are drawn at local (0,0). CSS offset-path uses a
      // RELATIVE path M 0 0 → (dx, dy) via right-angle bend in the group's local
      // coordinate system. offset-anchor: 0px 0px anchors the path at the group's
      // origin (= FlagCircle center). offset-rotate: 0deg prevents rotation.
      //
      // The keyframes hold at 0% until the travel window starts, then travel to
      // 100%, then hold at 100% until the cycle repeats. This creates the
      // staggered sequential animation effect across all decided games.
      const { toCX, fromCX, toCY, fromCY } = spec;
      const dx = Math.round(toCX - fromCX);
      const dy = Math.round(toCY - fromCY);
      const midDX = Math.round((toCX - fromCX) / 2);

      let relPath: string;
      if (Math.abs(dy) < 1) {
        relPath = `M 0 0 H ${dx}`;
      } else {
        relPath = `M 0 0 H ${midDX} V ${dy} H ${dx}`;
      }

      rules.push(`
@keyframes move-${spec.uid} {
  0%, ${startPct}% { offset-distance: 0%; }
  ${endPct}%, 100% { offset-distance: 100%; }
}
.flag-${spec.uid} {
  offset-path: path("${relPath}");
  offset-rotate: 0deg;
  offset-anchor: 0px 0px;
  animation: move-${spec.uid} ${CYCLE.toFixed(2)}s linear infinite;
}
`);

      // Loser flag: fade to 0.80 opacity when winner starts moving (Fix 4)
      const fadeDuration = 0.8;
      const fadeFraction = fadeDuration / CYCLE;
      const fadeEndFraction = startFraction + fadeFraction;
      const fadeEndPct = Math.min(fadeEndFraction * 100, 100).toFixed(2);

      rules.push(`
@keyframes fade-loser-${spec.uid} {
  0%, ${startPct}% { opacity: 1; }
  ${fadeEndPct}%, 100% { opacity: 0.80; }
}
.loser-${spec.uid} {
  animation: fade-loser-${spec.uid} ${CYCLE.toFixed(2)}s linear infinite;
}
`);
    });

    return rules.join("");
  }

  // ─── Rendering helpers ───────────────────────────────────────────────────────

  /**
   * Render one R32 game row.
   * Winner: CSS offset-path animation moving flag from R32 to R16.
   * Loser: CSS opacity fade animation.
   * Undecided: static, no animation.
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

    const BRACKET_X = side === "L" ? flagCX + FLAG_R32 + 3 : flagCX - FLAG_R32 - 3;
    const EXIT_X = side === "L" ? flagCX + PHASE_W / 2 : flagCX - PHASE_W / 2;

    const scoreLabelX =
      side === "L"
        ? BRACKET_X + 38
        : BRACKET_X - 38;

    const isWinnerA = winnerSide === "a";
    const isWinnerB = winnerSide === "b";

    // ── Team A ──
    const teamAEl = (() => {
      if (isWinnerA && spec) {
        // Winner A: CSS offset-path animation.
        // The <g> has transform="translate(fromCX, fromCY)" so it starts at the right
        // position. Children are drawn at local (0,0). The CSS offset-path is a
        // RELATIVE path M 0 0 → (dx,dy) in the group's local coordinate system.
        // offset-anchor: 0px 0px anchors the path at local (0,0) = FlagCircle center.
        return (
          <g
            key={`tA-${side}-${c.numero}`}
            transform={`translate(${flagCX}, ${aY})`}
            className={`flag-${spec.uid}`}
          >
            <FlagCircle
              slot={c.timeA}
              cx={0}
              cy={0}
              r={FLAG_R32}
              faded={false}
              isBright={true}
              uid={`r32${side}${c.numero}a`}
            />
            <text
              x={textRight ? FLAG_R32 + 6 : -FLAG_R32 - 6}
              y={5}
              fontSize={Math.max(10, FLAG_R32 * 0.28)}
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight={600}
              fill={c.timeA.nome === "Brasil" ? "#4ADE80" : "rgba(255,255,255,0.88)"}
              textAnchor={textRight ? "start" : "end"}
            >
              {isUnknownTeam(c.timeA.nome) ? "?" : shortName(c.timeA.nome, 11)}
            </text>
          </g>
        );
      } else if (isWinnerB && spec) {
        // Loser A: fade animation
        return (
          <g key={`tA-${side}-${c.numero}`} className={`loser-${spec.uid}`}>
            <FlagCircle
              slot={c.timeA}
              cx={flagCX}
              cy={aY}
              r={FLAG_R32}
              faded={false}
              isBright={false}
              uid={`r32${side}${c.numero}a`}
            />
            <text
              x={textRight ? flagCX + FLAG_R32 + 6 : flagCX - FLAG_R32 - 6}
              y={aY + 5}
              fontSize={Math.max(10, FLAG_R32 * 0.28)}
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight={400}
              fill="rgba(255,255,255,0.88)"
              textAnchor={textRight ? "start" : "end"}
            >
              {isUnknownTeam(c.timeA.nome) ? "?" : shortName(c.timeA.nome, 11)}
            </text>
          </g>
        );
      } else {
        // Undecided
        return (
          <g key={`tA-${side}-${c.numero}`}>
            <FlagCircle
              slot={c.timeA}
              cx={flagCX}
              cy={aY}
              r={FLAG_R32}
              faded={false}
              isBright={!decided}
              uid={`r32${side}${c.numero}a`}
            />
            <text
              x={textRight ? flagCX + FLAG_R32 + 6 : flagCX - FLAG_R32 - 6}
              y={aY + 5}
              fontSize={Math.max(10, FLAG_R32 * 0.28)}
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight={400}
              fill="rgba(255,255,255,0.88)"
              textAnchor={textRight ? "start" : "end"}
            >
              {isUnknownTeam(c.timeA.nome) ? "?" : shortName(c.timeA.nome, 11)}
            </text>
          </g>
        );
      }
    })();

    // ── Team B ──
    const teamBEl = (() => {
      if (isWinnerB && spec) {
        // Winner B: CSS offset-path animation.
        // Same structure as winner A: translate to origin, children at (0,0).
        return (
          <g
            key={`tB-${side}-${c.numero}`}
            transform={`translate(${flagCX}, ${bY})`}
            className={`flag-${spec.uid}`}
          >
            <FlagCircle
              slot={c.timeB}
              cx={0}
              cy={0}
              r={FLAG_R32}
              faded={false}
              isBright={true}
              uid={`r32${side}${c.numero}b`}
            />
            <text
              x={textRight ? FLAG_R32 + 6 : -FLAG_R32 - 6}
              y={5}
              fontSize={Math.max(10, FLAG_R32 * 0.28)}
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight={600}
              fill={c.timeB.nome === "Brasil" ? "#4ADE80" : "rgba(255,255,255,0.88)"}
              textAnchor={textRight ? "start" : "end"}
            >
              {isUnknownTeam(c.timeB.nome) ? "?" : shortName(c.timeB.nome, 11)}
            </text>
          </g>
        );
      } else if (isWinnerA && spec) {
        // Loser B: fade animation
        return (
          <g key={`tB-${side}-${c.numero}`} className={`loser-${spec.uid}`}>
            <FlagCircle
              slot={c.timeB}
              cx={flagCX}
              cy={bY}
              r={FLAG_R32}
              faded={false}
              isBright={false}
              uid={`r32${side}${c.numero}b`}
            />
            <text
              x={textRight ? flagCX + FLAG_R32 + 6 : flagCX - FLAG_R32 - 6}
              y={bY + 5}
              fontSize={Math.max(10, FLAG_R32 * 0.28)}
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight={400}
              fill="rgba(255,255,255,0.88)"
              textAnchor={textRight ? "start" : "end"}
            >
              {isUnknownTeam(c.timeB.nome) ? "?" : shortName(c.timeB.nome, 11)}
            </text>
          </g>
        );
      } else {
        // Undecided
        return (
          <g key={`tB-${side}-${c.numero}`}>
            <FlagCircle
              slot={c.timeB}
              cx={flagCX}
              cy={bY}
              r={FLAG_R32}
              faded={false}
              isBright={!decided}
              uid={`r32${side}${c.numero}b`}
            />
            <text
              x={textRight ? flagCX + FLAG_R32 + 6 : flagCX - FLAG_R32 - 6}
              y={bY + 5}
              fontSize={Math.max(10, FLAG_R32 * 0.28)}
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight={400}
              fill="rgba(255,255,255,0.88)"
              textAnchor={textRight ? "start" : "end"}
            >
              {isUnknownTeam(c.timeB.nome) ? "?" : shortName(c.timeB.nome, 11)}
            </text>
          </g>
        );
      }
    })();

    return (
      <g key={`r32-${side}-${c.numero}`}>
        {/* Vertical bracket bar connecting team A and B */}
        <line
          x1={BRACKET_X}
          y1={aY}
          x2={BRACKET_X}
          y2={bY}
          stroke="rgba(255,255,255,0.45)"
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
        {teamAEl}
        {teamBEl}
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
    r16Idx: number,
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

    return (
      <g key={`conn-r32-r16-${side}-${r16Idx}`}>
        <path
          d={rightAnglePath(EXIT_X, mid1Y, ENTRY_X, entryAY)}
          fill="none"
          stroke="rgba(255,255,255,0.42)"
          strokeWidth={2.5}
        />
        <path
          d={rightAnglePath(EXIT_X, mid2Y, ENTRY_X, entryBY)}
          fill="none"
          stroke="rgba(255,255,255,0.42)"
          strokeWidth={2.5}
        />
        {/* Vertical bar at R16 entry */}
        <line
          x1={side === "L" ? LR16_X + FLAG_R16 + 3 : RR16_X - FLAG_R16 - 3}
          y1={entryAY}
          x2={side === "L" ? LR16_X + FLAG_R16 + 3 : RR16_X - FLAG_R16 - 3}
          y2={entryBY}
          stroke="rgba(255,255,255,0.42)"
          strokeWidth={1}
        />
        {/* Fix 1: very subtle placeholder circles for R16 slots */}
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
          stroke="rgba(255,255,255,0.40)"
          strokeWidth={2.5}
        />
      </g>
    );
  }

  /**
   * Render QF slot (subtle placeholder) + connectors.
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
          stroke="rgba(255,255,255,0.40)"
          strokeWidth={2.5}
        />
        <path
          d={rightAnglePath(EXIT_X, r16MidY(qfIdx * 2 + 1), ENTRY_X, bY)}
          fill="none"
          stroke="rgba(255,255,255,0.40)"
          strokeWidth={2.5}
        />
        {/* Bracket bar */}
        <line
          x1={BRACKET_X}
          y1={aY}
          x2={BRACKET_X}
          y2={bY}
          stroke="rgba(255,255,255,0.40)"
          strokeWidth={1}
        />
        {/* Fix 1: subtle placeholder slots */}
        <SlotPlaceholder cx={flagCX} cy={aY} r={FLAG_QF} />
        <SlotPlaceholder cx={flagCX} cy={bY} r={FLAG_QF} />
        {/* Exit toward SF */}
        <line
          x1={BRACKET_X}
          y1={midY}
          x2={side === "L" ? LQF_X + PHASE_W / 2 : RQF_X - PHASE_W / 2}
          y2={midY}
          stroke="rgba(255,255,255,0.40)"
          strokeWidth={2.5}
        />
      </g>
    );
  }

  /**
   * Render SF slot (subtle placeholder) + connectors.
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
          stroke="rgba(255,255,255,0.40)"
          strokeWidth={2.5}
        />
        <path
          d={rightAnglePath(EXIT_X, qfMidY(1), ENTRY_X, bY)}
          fill="none"
          stroke="rgba(255,255,255,0.40)"
          strokeWidth={2.5}
        />
        {/* Bracket bar */}
        <line
          x1={BRACKET_X}
          y1={aY}
          x2={BRACKET_X}
          y2={bY}
          stroke="rgba(255,255,255,0.40)"
          strokeWidth={1}
        />
        {/* Fix 1: subtle placeholder slots */}
        <SlotPlaceholder cx={flagCX} cy={aY} r={FLAG_SF} />
        <SlotPlaceholder cx={flagCX} cy={bY} r={FLAG_SF} />
        {/* SF → Final */}
        <line
          x1={BRACKET_X}
          y1={midY}
          x2={FINAL_X}
          y2={midY}
          stroke="rgba(255,255,255,0.40)"
          strokeWidth={2.5}
        />
      </g>
    );
  }

  /**
   * Fix 5: Render Final + Trophy at CENTER of SVG (CENTER_X, CENTER_Y = SVG_H/2).
   * Trophy has strong golden glow. Finalist placeholders very subtle.
   */
  function renderFinal() {
    const cy = CENTER_Y; // true vertical center
    const TROPHY_SIZE = 110;

    return (
      <g key="final">
        {/* Outer glow aura rings */}
        <circle
          cx={CENTER_X}
          cy={cy}
          r={100}
          fill="none"
          stroke="#FFD700"
          strokeWidth={1}
          opacity={0.08}
        />
        <circle
          cx={CENTER_X}
          cy={cy}
          r={72}
          fill="none"
          stroke="#FFD700"
          strokeWidth={1}
          opacity={0.12}
        />
        <circle cx={CENTER_X} cy={cy} r={52} fill="rgba(255,215,0,0.04)" />
        {/* Trophy — Fix 5: centered at (CENTER_X, CENTER_Y), strong golden glow */}
        <foreignObject
          x={CENTER_X - TROPHY_SIZE / 2}
          y={cy - TROPHY_SIZE * 0.9}
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
              fontSize: TROPHY_SIZE * 0.80,
              lineHeight: 1,
              filter: "drop-shadow(0 0 20px rgba(255,215,0,0.6)) drop-shadow(0 0 40px rgba(255,215,0,0.3))",
            }}
          >
            🏆
          </div>
        </foreignObject>
        {/* Fix 1: very subtle placeholder slots for finalists */}
        <SlotPlaceholder cx={CENTER_X - 110} cy={cy} r={FLAG_F} />
        <SlotPlaceholder cx={CENTER_X + 110} cy={cy} r={FLAG_F} />
        {/* "CAMPEÃO" label below trophy */}
        <text
          x={CENTER_X}
          y={cy + 32}
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
        {/* J104 label above trophy */}
        <text
          x={CENTER_X}
          y={cy - TROPHY_SIZE * 0.78}
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
      {/* Fix 3: CSS offset-path animation styles injected via <style> in SVG */}
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        preserveAspectRatio="xMidYMid meet"
        style={{
          display: "block",
          width: "100%",
          height: "auto",
          background:
            "linear-gradient(135deg, #0a0e1a 0%, #111827 60%, #0d1520 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          maxWidth: 1400,
          margin: "0 auto",
        }}
        aria-label="Chaveamento da Copa do Mundo 2026"
      >
        <defs>
          {/* CSS keyframes and offset-path rules for winner/loser animations */}
          <style>{buildCSS()}</style>
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
          renderR32toR16Connectors("L", r16Idx),
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
          renderR32toR16Connectors("R", r16Idx),
        )}

        {/* ── RIGHT SIDE QF placeholder slots ── */}
        {[0, 1].map((qfIdx) => renderQFSlot("R", qfIdx))}

        {/* ── RIGHT SIDE SF placeholder slot ── */}
        {renderSFSlot("R")}

        {/* ── FINAL + TROPHY at center ── */}
        {renderFinal()}
      </svg>
    </div>
  );
}
