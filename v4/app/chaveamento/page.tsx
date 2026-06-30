/**
 * /chaveamento — Bracket mata-mata Copa 2026.
 * Linhas em ângulo reto (90°), taça central, vencedores avançam pra dentro.
 * 3 variações: A=horizontal clássico FIFA, B=vertical, C=compacto dark.
 *
 * NÃO listada no nav, sem sitemap, com noindex.
 */

import { promises as fs } from "fs";
import path from "path";
import { carregarJogos } from "@/lib/jogos";
import { carregarMapaPaises } from "@/lib/paises";
import type { Jogo } from "@/lib/types";

export const metadata = {
  robots: { index: false, follow: false },
  title: "Chaveamento · Bolão das IAs",
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

// ─── Country accent colors ────────────────────────────────────────────────────
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
  Equatória: "#3E9A00",
  "Congo (RD)": "#007FFF",
  "Cabo Verde": "#003893",
  Colômb: "#FFD100",
  Gana: "#006B3F",
  Egito: "#CE1126",
  Argélia: "#006233",
  Áustria: "#ED2939",
};

function teamColor(nome: string): string {
  return COUNTRY_COLOR[nome] ?? "#C0A060";
}

function isBrasil(nome: string): boolean {
  return nome === "Brasil";
}

function shortName(nome: string, max = 12): string {
  if (!nome || nome.startsWith("Venc.") || nome.startsWith("Perd.")) return "?";
  if (nome.length <= max) return nome;
  const abbr: Record<string, string> = {
    "Países Baixos": "P. Baixos",
    "Costa do Marfim": "C. Marfim",
    "África do Sul": "Áf. do Sul",
    "Estados Unidos": "EUA",
    "Bósnia-Herzegovina": "Bósnia",
    "Nova Zelândia": "NZ",
    "Congo (RD)": "Congo RD",
    "Bósnia-Herzeg.": "Bósnia",
  };
  return abbr[nome] ?? nome.slice(0, max - 1) + "…";
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
      vencedorDoJogo.set(n, { ...slotA });
      slotB = { ...slotB, eliminado: true };
    } else if (venc === "b") {
      vencedorDoJogo.set(n, { ...slotB });
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

function placarStr(c: Confronto): string {
  if (c.gols_a === null || c.gols_b === null) return "";
  if (PENALTY_WINNER[c.numero]) return `${c.gols_a}×${c.gols_b} (pen.)`;
  return `${c.gols_a}×${c.gols_b}`;
}

// ─── Shared flag component (HTML, not SVG) ────────────────────────────────────

function FlagImg({
  slot,
  size,
  style,
}: {
  slot: SlotTime;
  size: number;
  style?: React.CSSProperties;
}) {
  const isUnknown = !slot.nome || slot.nome.startsWith("Venc.") || slot.nome.startsWith("Perd.");
  const eliminated = !!slot.eliminado;
  const brasil = isBrasil(slot.nome);
  const color = teamColor(slot.nome);

  const baseStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    objectFit: "cover",
    flexShrink: 0,
    opacity: isUnknown ? 0.2 : eliminated ? 0.32 : 1,
    border: eliminated
      ? "none"
      : isUnknown
      ? "none"
      : brasil
      ? `3px solid #009C3B`
      : `2px solid ${color}55`,
    boxShadow: eliminated || isUnknown
      ? "none"
      : brasil
      ? `0 0 12px #009C3B99`
      : `0 0 8px ${color}55`,
    ...style,
  };

  if (isUnknown) {
    return (
      <span
        style={{
          ...baseStyle,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(255,255,255,0.06)",
          fontSize: size * 0.45,
          color: "rgba(255,255,255,0.25)",
          fontWeight: 300,
        }}
        aria-label="aguardando"
      >
        ?
      </span>
    );
  }

  if (!slot.iso) {
    return (
      <span
        style={{
          ...baseStyle,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: `${color}22`,
          fontSize: size * 0.5,
          fontWeight: 700,
          color,
        }}
        aria-label={slot.nome}
        title={slot.nome}
      >
        {slot.nome.slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={`https://hatscripts.github.io/circle-flags/flags/${slot.iso}.svg`}
      alt={slot.nome}
      title={slot.nome}
      width={size}
      height={size}
      style={baseStyle}
      loading="lazy"
    />
  );
}

// ─── TROPHY SVG ───────────────────────────────────────────────────────────────

function TrophySVG({ size = 80 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-label="Troféu"
      style={{ filter: "drop-shadow(0 0 20px #FFD70099)" }}
    >
      {/* Cup body */}
      <path
        d="M30 10 H70 V45 Q70 70 50 72 Q30 70 30 45 Z"
        fill="#FFD700"
        stroke="#B8860B"
        strokeWidth="2"
      />
      {/* Left handle */}
      <path
        d="M30 20 H18 V38 H30"
        fill="none"
        stroke="#FFD700"
        strokeWidth="5"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      {/* Right handle */}
      <path
        d="M70 20 H82 V38 H70"
        fill="none"
        stroke="#FFD700"
        strokeWidth="5"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      {/* Stem */}
      <rect x="44" y="72" width="12" height="14" fill="#FFD700" stroke="#B8860B" strokeWidth="1" />
      {/* Base */}
      <rect x="32" y="86" width="36" height="6" rx="2" fill="#FFD700" stroke="#B8860B" strokeWidth="1.5" />
      {/* Shine */}
      <path d="M40 18 V50" stroke="rgba(255,255,255,0.35)" strokeWidth="4" strokeLinecap="round" />
      <path d="M48 15 V35" stroke="rgba(255,255,255,0.2)" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// ─── VARIAÇÃO A: Bracket Horizontal Clássico FIFA ────────────────────────────
// Esquerda → Centro ← Direita
// 4 fases por lado: R32 → R16 → QF → SF → FINAL (centro)

function VariacaoA({ bracket }: { bracket: Map<number, Confronto> }) {
  const get = (n: number): Confronto => bracket.get(n)!;

  // Layout config
  const PHASE_W = 160;   // width per phase column
  const FLAG_R32 = 22;   // flag radius (px) for R32
  const FLAG_R16 = 26;
  const FLAG_QF = 30;
  const FLAG_SF = 36;
  const FLAG_F = 48;

  // R32 game pairs → R16 assignments (left side)
  // J89 = W74 + W77, J90 = W73 + W75
  // J91 = W76 + W78, J92 = W79 + W80
  // J93 = W83 + W84, J94 = W81 + W82
  // J95 = W86 + W88, J96 = W85 + W87
  // QF J97 = W89 + W90, J98 = W93 + W94
  // QF J99 = W91 + W92, J100 = W95 + W96
  // SF J101 = W97 + W98 (left), J102 = W99 + W100 (right)
  // Final J104 = W101 + W102

  // LEFT SIDE bracket (reads left → center):
  // R32 games: J73,J74,J75,J77 (top) + J76,J78,J79,J80 (bottom) → top 4 R16
  // Actually layout: J74,J77 → J89 (top); J73,J75 → J90; J76,J78 → J91; J79,J80 → J92
  // QF: J97=W89+W90 (top), J98=W93+W94
  // SF: J101=W97+W98

  // RIGHT SIDE bracket (reads right → center, mirrored):
  // R32: J81,J82 → J94; J83,J84 → J93; J85,J87 → J96; J86,J88 → J95
  // QF: J99=W91+W92; J100=W95+W96
  // SF: J102=W99+W100

  // Each R32 "game" occupies 2 flag rows + gap
  const GAME_H = 80;  // height of one game (2 teams)
  const PHASE_GAP = 32; // vertical gap between groups as bracket collapses

  // Compute Y positions for R32 games (left side, 8 games top-to-bottom)
  // top 4 feed left bracket, bottom 4 feed... actually all 8 left R32 are on left
  // Let's distribute 8 R32 games evenly

  const TOTAL_H = 8 * GAME_H + 7 * 8; // 8 games with 8px gaps
  const SVG_H = TOTAL_H + 80; // padding
  const SVG_W = 1700;
  const CENTER_X = SVG_W / 2;
  const TOP_OFFSET = 40;

  // Game Y: returns top edge of game at index i (0-7)
  function gameTopY(i: number): number {
    return TOP_OFFSET + i * (GAME_H + 8);
  }
  // Team A Y center (upper team in game)
  function teamAY(gameIdx: number): number {
    return gameTopY(gameIdx) + FLAG_R32 + 2;
  }
  // Team B Y center (lower team in game)
  function teamBY(gameIdx: number): number {
    return gameTopY(gameIdx) + GAME_H - FLAG_R32 - 2;
  }
  // Mid Y of a game
  function gameMidY(gameIdx: number): number {
    return (teamAY(gameIdx) + teamBY(gameIdx)) / 2;
  }

  // Left side: R32 game order (visual top→bottom)
  // According to bracket structure:
  // Top 4: J74,J77 → J89 at positions 0,1; J73,J75 → J90 at positions 2,3
  // Bottom 4: J76,J78 → J91 at positions 4,5; J79,J80 → J92 at positions 6,7
  const LEFT_R32 = [74, 77, 73, 75, 76, 78, 79, 80];

  // Right side: R32 game order (visual top→bottom, mirrored)
  // Top 4: J81,J82 → J94 at positions 0,1; J83,J84 → J93 at positions 2,3
  // Bottom 4: J86,J88 → J95 at positions 4,5; J85,J87 → J96 at positions 6,7
  const RIGHT_R32 = [81, 82, 83, 84, 86, 88, 85, 87];

  // Left R16 order (4 games): J89 (from 0,1), J90 (from 2,3), J91 (from 4,5), J92 (from 6,7)
  const LEFT_R16 = [89, 90, 91, 92];
  // Right R16 order: J94 (from 0,1), J93 (from 2,3), J95 (from 4,5), J96 (from 6,7)
  const RIGHT_R16 = [94, 93, 95, 96];

  // Left QF: J97 (from J89+J90), J98 (from J91+J92) - wait, per spec:
  // J97=W89+W90, J98=W93+W94 - but J93 is RIGHT side...
  // Re-reading: J97=W89+W90 (left top), J99=W91+W92 (left bottom)
  // J98=W93+W94 (right top), J100=W95+W96 (right bottom)
  // SF: J101=W97+W98 (left SF)... but J97 is left and J98 is RIGHT QF
  // Actually per spec: ESQUERDA has SF101 with J97+J98
  // J97=W89+W90 ✓ (J89,J90 are left R16)
  // J98=W93+W94: J93=W83+W84, J94=W81+W82 — these are RIGHT R32 teams
  // So left SF feeds from J97 (pure left) and J98 (pure right)
  // This means the bracket crosses! That's normal in a 32-team bracket.
  // For simplicity of layout: left side shows J97, right side shows J99
  // And SF101 gets winners of J97+J98, SF102 gets winners J99+J100

  // REVISED layout based on spec:
  // LEFT of trophy: J73,J74,J75,J77 (top R32) + J81,J82,J83,J84 (bottom R32)
  //                 → J89,J90 (top R16) + J93,J94 (bottom R16)
  //                 → J97 (top QF) + J98 (bottom QF)
  //                 → SF101
  // RIGHT of trophy: J76,J78,J79,J80 (top R32) + J85,J86,J87,J88 (bottom R32)
  //                  → J91,J92 (top R16) + J95,J96 (bottom R16)
  //                  → J99 (top QF) + J100 (bottom QF)
  //                  → SF102

  const LEFT_R32_FINAL = [74, 77, 73, 75, 81, 82, 83, 84];
  const LEFT_R16_FINAL = [89, 90, 93, 94];
  const LEFT_QF_FINAL = [97, 98];

  const RIGHT_R32_FINAL = [76, 78, 79, 80, 86, 88, 85, 87];
  const RIGHT_R16_FINAL = [91, 92, 95, 96];
  const RIGHT_QF_FINAL = [99, 100];

  // X positions for each phase (left side: increasing toward center)
  const LR32_X = 75;
  const LR16_X = LR32_X + PHASE_W;
  const LQF_X = LR16_X + PHASE_W;
  const LSF_X = LQF_X + PHASE_W;
  const FINAL_X = CENTER_X;

  // Right side (mirror): decreasing from right edge toward center
  const RR32_X = SVG_W - 75;
  const RR16_X = RR32_X - PHASE_W;
  const RQF_X = RR16_X - PHASE_W;
  const RSF_X = RQF_X - PHASE_W;

  // R16 game Y: midpoint of its 2 feeder R32 games
  function r16Y(r16Idx: number): number {
    const g1 = r16Idx * 2;
    const g2 = r16Idx * 2 + 1;
    return (gameMidY(g1) + gameMidY(g2)) / 2;
  }
  // QF game Y: midpoint of its 2 feeder R16 games
  function qfY(qfIdx: number): number {
    const r1 = qfIdx * 2;
    const r2 = qfIdx * 2 + 1;
    return (r16Y(r1) + r16Y(r2)) / 2;
  }
  // SF Y: midpoint of its 2 feeder QF games
  function sfY(): number {
    return (qfY(0) + qfY(1)) / 2;
  }

  const finalY = sfY();

  // ─── Right-angle connector path ──────────────────────────────────────────────
  // From (x1,y1) going RIGHT to (x2,y2): go horizontal to midpoint, then vertical, then horizontal
  function connR(x1: number, y1: number, x2: number, y2: number): string {
    if (Math.abs(y1 - y2) < 1) return `M ${x1} ${y1} H ${x2}`;
    const mx = (x1 + x2) / 2;
    return `M ${x1} ${y1} H ${mx} V ${y2} H ${x2}`;
  }
  // From (x1,y1) going LEFT to (x2,y2)
  function connL(x1: number, y1: number, x2: number, y2: number): string {
    if (Math.abs(y1 - y2) < 1) return `M ${x1} ${y1} H ${x2}`;
    const mx = (x1 + x2) / 2;
    return `M ${x1} ${y1} H ${mx} V ${y2} H ${x2}`;
  }

  // Vertical bracket line connecting 2 games at same phase column
  function bracketV(x: number, y1: number, y2: number): string {
    return `M ${x} ${y1} V ${y2}`;
  }

  // ─── Render a team row in R32 (left side) ────────────────────────────────────
  function renderTeamRow(
    slot: SlotTime,
    cx: number,
    cy: number,
    flagR: number,
    isActive: boolean,
    textRight: boolean = true,
  ) {
    const eliminated = !!slot.eliminado;
    const isUnknown = !slot.nome || slot.nome.startsWith("Venc.") || slot.nome.startsWith("Perd.");
    const opacity = isUnknown ? 0.22 : eliminated ? 0.32 : 1;
    const brasil = isBrasil(slot.nome);
    const color = teamColor(slot.nome);
    const flagUrl = slot.iso
      ? `https://hatscripts.github.io/circle-flags/flags/${slot.iso}.svg`
      : null;
    const glowR = flagR + 7;

    return (
      <g opacity={opacity} key={`${slot.nome}-${cx}-${cy}`}>
        {/* Glow ring for active teams */}
        {isActive && !isUnknown && (
          <circle
            cx={cx}
            cy={cy}
            r={glowR}
            fill="none"
            stroke={brasil ? "#009C3B" : color}
            strokeWidth={brasil ? 3 : 2}
            opacity={brasil ? 0.6 : 0.35}
          />
        )}
        {/* Clip circle */}
        <clipPath id={`ca-${slot.iso ?? slot.nome.replace(/\W/g, "_")}-${Math.round(cx)}-${Math.round(cy)}`}>
          <circle cx={cx} cy={cy} r={flagR} />
        </clipPath>
        {/* Flag image */}
        {flagUrl ? (
          <image
            href={flagUrl}
            x={cx - flagR}
            y={cy - flagR}
            width={flagR * 2}
            height={flagR * 2}
            clipPath={`url(#ca-${slot.iso ?? slot.nome.replace(/\W/g, "_")}-${Math.round(cx)}-${Math.round(cy)})`}
            preserveAspectRatio="xMidYMid slice"
          />
        ) : (
          <circle cx={cx} cy={cy} r={flagR} fill={isUnknown ? "rgba(255,255,255,0.06)" : `${color}33`} />
        )}
        {/* Border */}
        <circle
          cx={cx}
          cy={cy}
          r={flagR}
          fill="none"
          stroke={
            isActive && !isUnknown
              ? brasil
                ? "#009C3B"
                : `${color}CC`
              : "rgba(255,255,255,0.15)"
          }
          strokeWidth={isActive && !isUnknown ? (brasil ? 3 : 2) : 1}
        />
        {/* Unknown ? */}
        {isUnknown && (
          <text x={cx} y={cy + 5} textAnchor="middle" fontSize={flagR * 0.75} fill="rgba(255,255,255,0.3)" fontFamily="system-ui">?</text>
        )}
        {/* Team name */}
        <text
          x={textRight ? cx + flagR + 6 : cx - flagR - 6}
          y={cy + 4}
          fontSize={10}
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight={isActive && !isUnknown ? 600 : 400}
          fill={
            isActive && !isUnknown
              ? brasil
                ? "#4ADE80"
                : "rgba(255,255,255,0.9)"
              : "rgba(255,255,255,0.35)"
          }
          textAnchor={textRight ? "start" : "end"}
        >
          {isUnknown ? "?" : shortName(slot.nome, 10)}
        </text>
      </g>
    );
  }

  const trackColor = (slot: SlotTime) => {
    if (!slot || slot.eliminado) return "rgba(255,255,255,0.12)";
    if (isBrasil(slot.nome)) return "#009C3B";
    return teamColor(slot.nome);
  };

  return (
    <div style={{ overflowX: "auto", width: "100%" }}>
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H + 40}`}
        width={SVG_W}
        height={SVG_H + 40}
        style={{
          display: "block",
          background: "linear-gradient(135deg, #0a0e1a 0%, #111827 60%, #0d1520 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
        aria-label="Chaveamento da Copa 2026"
      >
        {/* Phase labels */}
        {[
          ["R32", LR32_X],
          ["Oitavas", LR16_X],
          ["Quartas", LQF_X],
          ["Semi", LSF_X],
        ].map(([label, x]) => (
          <text
            key={String(label)}
            x={Number(x)}
            y={22}
            textAnchor="middle"
            fontSize={11}
            fontWeight={700}
            letterSpacing={1.5}
            fill="rgba(255,255,255,0.35)"
            fontFamily="system-ui"
          >
            {String(label).toUpperCase()}
          </text>
        ))}
        <text x={FINAL_X} y={22} textAnchor="middle" fontSize={13} fontWeight={700} letterSpacing={2} fill="#FFD700" fontFamily="system-ui">FINAL</text>
        {[
          ["Semi", RSF_X],
          ["Quartas", RQF_X],
          ["Oitavas", RR16_X],
          ["R32", RR32_X],
        ].map(([label, x]) => (
          <text
            key={String(label) + "R"}
            x={Number(x)}
            y={22}
            textAnchor="middle"
            fontSize={11}
            fontWeight={700}
            letterSpacing={1.5}
            fill="rgba(255,255,255,0.35)"
            fontFamily="system-ui"
          >
            {String(label).toUpperCase()}
          </text>
        ))}

        {/* ─── LEFT SIDE: R32 teams ─────────────────────────────────────── */}
        {LEFT_R32_FINAL.map((jNum, gi) => {
          const c = get(jNum);
          const ayc = teamAY(gi);
          const byc = teamBY(gi);
          const wonA = c.vencedor === "a";
          const wonB = c.vencedor === "b";
          const decided = c.vencedor !== null;
          // Track line: from game midpoint going right
          const midY = gameMidY(gi);
          const trackSlot = wonA ? c.timeA : wonB ? c.timeB : null;
          const tColor = trackSlot ? trackColor(trackSlot) : "rgba(255,255,255,0.12)";

          return (
            <g key={`lr32-${jNum}`}>
              {/* Vertical bracket bar connecting the two teams */}
              <line
                x1={LR32_X + FLAG_R32 + 2}
                y1={ayc}
                x2={LR32_X + FLAG_R32 + 2}
                y2={byc}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth={1}
              />
              {/* Horizontal exit line to midpoint */}
              <line
                x1={LR32_X + FLAG_R32 + 2}
                y1={midY}
                x2={LR32_X + PHASE_W / 2}
                y2={midY}
                stroke={decided ? tColor : "rgba(255,255,255,0.12)"}
                strokeWidth={decided && trackSlot && isBrasil(trackSlot.nome) ? 2.5 : 1.5}
                strokeOpacity={decided ? 0.8 : 0.5}
              />
              {/* TeamA */}
              {renderTeamRow(c.timeA, LR32_X, ayc, FLAG_R32, !wonB && !c.timeA.eliminado, true)}
              {/* TeamB */}
              {renderTeamRow(c.timeB, LR32_X, byc, FLAG_R32, !wonA && !c.timeB.eliminado, true)}
              {/* Score badge */}
              {placarStr(c) && (
                <text
                  x={LR32_X + FLAG_R32 + 36}
                  y={midY + 3}
                  textAnchor="middle"
                  fontSize={9}
                  fill="#FFD700"
                  fontFamily="monospace"
                  opacity={0.85}
                >
                  {placarStr(c)}
                </text>
              )}
            </g>
          );
        })}

        {/* ─── LEFT SIDE: R16 ──────────────────────────────────────────────── */}
        {LEFT_R16_FINAL.map((jNum, ri) => {
          const c = get(jNum);
          const cy = r16Y(ri);
          const wonA = c.vencedor === "a";
          const wonB = c.vencedor === "b";
          const decided = c.vencedor !== null;
          const teamA_cy = cy - FLAG_R16 - 4;
          const teamB_cy = cy + FLAG_R16 + 4;
          const g1 = ri * 2;
          const g2 = ri * 2 + 1;

          // Connectors from R32 mid to R16 entry
          const r32MidY1 = gameMidY(g1);
          const r32MidY2 = gameMidY(g2);
          const r32ExitX = LR32_X + PHASE_W / 2;
          const r16EntryX = LR16_X;

          const winnerSlot = wonA ? c.timeA : wonB ? c.timeB : null;
          const tColor = winnerSlot ? trackColor(winnerSlot) : "rgba(255,255,255,0.12)";
          const trackW = winnerSlot && isBrasil(winnerSlot.nome) ? 2.5 : 1.5;

          return (
            <g key={`lr16-${jNum}`}>
              {/* R32→R16 connectors (right-angle: H then V then H) */}
              <path
                d={connR(r32ExitX, r32MidY1, r16EntryX - FLAG_R16 - 6, teamA_cy)}
                fill="none"
                stroke={decided && wonA || decided && !wonB && ri === 0 ? tColor : "rgba(255,255,255,0.14)"}
                strokeWidth={1.5}
              />
              <path
                d={connR(r32ExitX, r32MidY2, r16EntryX - FLAG_R16 - 6, teamB_cy)}
                fill="none"
                stroke="rgba(255,255,255,0.14)"
                strokeWidth={1.5}
              />
              {/* Exit connector toward QF */}
              <line
                x1={r16EntryX + FLAG_R16 + 6}
                y1={cy}
                x2={LR16_X + PHASE_W / 2}
                y2={cy}
                stroke={decided ? tColor : "rgba(255,255,255,0.12)"}
                strokeWidth={decided ? trackW : 1.5}
                strokeOpacity={0.75}
              />
              {/* Vertical bracket bar */}
              <line
                x1={r16EntryX + FLAG_R16 + 4}
                y1={teamA_cy}
                x2={r16EntryX + FLAG_R16 + 4}
                y2={teamB_cy}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth={1}
              />
              {/* Flags */}
              {renderTeamRow(c.timeA, LR16_X, teamA_cy, FLAG_R16, !wonB && !c.timeA.eliminado, true)}
              {renderTeamRow(c.timeB, LR16_X, teamB_cy, FLAG_R16, !wonA && !c.timeB.eliminado, true)}
              {placarStr(c) && (
                <text x={LR16_X + FLAG_R16 + 40} y={cy + 3} textAnchor="middle" fontSize={9} fill="#FFD700" fontFamily="monospace" opacity={0.85}>
                  {placarStr(c)}
                </text>
              )}
            </g>
          );
        })}

        {/* ─── LEFT SIDE: QF ───────────────────────────────────────────────── */}
        {LEFT_QF_FINAL.map((jNum, qi) => {
          const c = get(jNum);
          const cy = qfY(qi);
          const wonA = c.vencedor === "a";
          const wonB = c.vencedor === "b";
          const decided = c.vencedor !== null;
          const teamA_cy = cy - FLAG_QF - 5;
          const teamB_cy = cy + FLAG_QF + 5;
          const r1 = qi * 2;
          const r2 = qi * 2 + 1;
          const r16ExitX = LR16_X + PHASE_W / 2;

          const winnerSlot = wonA ? c.timeA : wonB ? c.timeB : null;
          const tColor = winnerSlot ? trackColor(winnerSlot) : "rgba(255,255,255,0.12)";
          const trackW = winnerSlot && isBrasil(winnerSlot.nome) ? 3 : 2;

          return (
            <g key={`lqf-${jNum}`}>
              <path
                d={connR(r16ExitX, r16Y(r1), LQF_X - FLAG_QF - 6, teamA_cy)}
                fill="none"
                stroke="rgba(255,255,255,0.16)"
                strokeWidth={1.5}
              />
              <path
                d={connR(r16ExitX, r16Y(r2), LQF_X - FLAG_QF - 6, teamB_cy)}
                fill="none"
                stroke="rgba(255,255,255,0.16)"
                strokeWidth={1.5}
              />
              <line
                x1={LQF_X + FLAG_QF + 6}
                y1={cy}
                x2={LQF_X + PHASE_W / 2}
                y2={cy}
                stroke={decided ? tColor : "rgba(255,255,255,0.12)"}
                strokeWidth={decided ? trackW : 1.5}
                strokeOpacity={0.75}
              />
              <line
                x1={LQF_X + FLAG_QF + 4}
                y1={teamA_cy}
                x2={LQF_X + FLAG_QF + 4}
                y2={teamB_cy}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth={1}
              />
              {renderTeamRow(c.timeA, LQF_X, teamA_cy, FLAG_QF, !wonB && !c.timeA.eliminado, true)}
              {renderTeamRow(c.timeB, LQF_X, teamB_cy, FLAG_QF, !wonA && !c.timeB.eliminado, true)}
              {placarStr(c) && (
                <text x={LQF_X + FLAG_QF + 48} y={cy + 3} textAnchor="middle" fontSize={9} fill="#FFD700" fontFamily="monospace" opacity={0.85}>
                  {placarStr(c)}
                </text>
              )}
            </g>
          );
        })}

        {/* ─── LEFT SF (J101) ──────────────────────────────────────────────── */}
        {(() => {
          const c = get(101);
          const cy = sfY();
          const wonA = c.vencedor === "a";
          const wonB = c.vencedor === "b";
          const decided = c.vencedor !== null;
          const teamA_cy = cy - FLAG_SF - 6;
          const teamB_cy = cy + FLAG_SF + 6;
          const qfExitX = LQF_X + PHASE_W / 2;

          const winnerSlot = wonA ? c.timeA : wonB ? c.timeB : null;
          const tColor = winnerSlot ? trackColor(winnerSlot) : "rgba(255,255,255,0.12)";
          const trackW = winnerSlot && isBrasil(winnerSlot.nome) ? 3.5 : 2;

          return (
            <g key="lsf">
              <path
                d={connR(qfExitX, qfY(0), LSF_X - FLAG_SF - 6, teamA_cy)}
                fill="none"
                stroke="rgba(255,255,255,0.18)"
                strokeWidth={1.5}
              />
              <path
                d={connR(qfExitX, qfY(1), LSF_X - FLAG_SF - 6, teamB_cy)}
                fill="none"
                stroke="rgba(255,255,255,0.18)"
                strokeWidth={1.5}
              />
              {/* SF → Final connector */}
              <line
                x1={LSF_X + FLAG_SF + 6}
                y1={cy}
                x2={FINAL_X - FLAG_F - 14}
                y2={cy}
                stroke={decided ? tColor : "rgba(255,255,255,0.12)"}
                strokeWidth={decided ? trackW : 1.5}
                strokeOpacity={0.75}
              />
              <line
                x1={LSF_X + FLAG_SF + 4}
                y1={teamA_cy}
                x2={LSF_X + FLAG_SF + 4}
                y2={teamB_cy}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth={1}
              />
              {renderTeamRow(c.timeA, LSF_X, teamA_cy, FLAG_SF, !wonB && !c.timeA.eliminado, true)}
              {renderTeamRow(c.timeB, LSF_X, teamB_cy, FLAG_SF, !wonA && !c.timeB.eliminado, true)}
              {placarStr(c) && (
                <text x={LSF_X + FLAG_SF + 55} y={cy + 3} textAnchor="middle" fontSize={10} fill="#FFD700" fontFamily="monospace" opacity={0.9}>
                  {placarStr(c)}
                </text>
              )}
            </g>
          );
        })()}

        {/* ─── RIGHT SIDE: R32 teams ────────────────────────────────────── */}
        {RIGHT_R32_FINAL.map((jNum, gi) => {
          const c = get(jNum);
          const ayc = teamAY(gi);
          const byc = teamBY(gi);
          const wonA = c.vencedor === "a";
          const wonB = c.vencedor === "b";
          const decided = c.vencedor !== null;
          const midY = gameMidY(gi);
          const trackSlot = wonA ? c.timeA : wonB ? c.timeB : null;
          const tColor = trackSlot ? trackColor(trackSlot) : "rgba(255,255,255,0.12)";

          return (
            <g key={`rr32-${jNum}`}>
              <line
                x1={RR32_X - FLAG_R32 - 2}
                y1={ayc}
                x2={RR32_X - FLAG_R32 - 2}
                y2={byc}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth={1}
              />
              <line
                x1={RR32_X - FLAG_R32 - 2}
                y1={midY}
                x2={RR32_X - PHASE_W / 2}
                y2={midY}
                stroke={decided ? tColor : "rgba(255,255,255,0.12)"}
                strokeWidth={decided && trackSlot && isBrasil(trackSlot.nome) ? 2.5 : 1.5}
                strokeOpacity={decided ? 0.8 : 0.5}
              />
              {renderTeamRow(c.timeA, RR32_X, ayc, FLAG_R32, !wonB && !c.timeA.eliminado, false)}
              {renderTeamRow(c.timeB, RR32_X, byc, FLAG_R32, !wonA && !c.timeB.eliminado, false)}
              {placarStr(c) && (
                <text
                  x={RR32_X - FLAG_R32 - 36}
                  y={midY + 3}
                  textAnchor="middle"
                  fontSize={9}
                  fill="#FFD700"
                  fontFamily="monospace"
                  opacity={0.85}
                >
                  {placarStr(c)}
                </text>
              )}
            </g>
          );
        })}

        {/* ─── RIGHT SIDE: R16 ─────────────────────────────────────────────── */}
        {RIGHT_R16_FINAL.map((jNum, ri) => {
          const c = get(jNum);
          const cy = r16Y(ri);
          const wonA = c.vencedor === "a";
          const wonB = c.vencedor === "b";
          const decided = c.vencedor !== null;
          const teamA_cy = cy - FLAG_R16 - 4;
          const teamB_cy = cy + FLAG_R16 + 4;
          const g1 = ri * 2;
          const g2 = ri * 2 + 1;
          const r32ExitX = RR32_X - PHASE_W / 2;
          const r32MidY1 = gameMidY(g1);
          const r32MidY2 = gameMidY(g2);
          const winnerSlot = wonA ? c.timeA : wonB ? c.timeB : null;
          const tColor = winnerSlot ? trackColor(winnerSlot) : "rgba(255,255,255,0.12)";
          const trackW = winnerSlot && isBrasil(winnerSlot.nome) ? 2.5 : 1.5;

          return (
            <g key={`rr16-${jNum}`}>
              <path
                d={connL(r32ExitX, r32MidY1, RR16_X + FLAG_R16 + 6, teamA_cy)}
                fill="none"
                stroke="rgba(255,255,255,0.14)"
                strokeWidth={1.5}
              />
              <path
                d={connL(r32ExitX, r32MidY2, RR16_X + FLAG_R16 + 6, teamB_cy)}
                fill="none"
                stroke="rgba(255,255,255,0.14)"
                strokeWidth={1.5}
              />
              <line
                x1={RR16_X - FLAG_R16 - 6}
                y1={cy}
                x2={RR16_X - PHASE_W / 2}
                y2={cy}
                stroke={decided ? tColor : "rgba(255,255,255,0.12)"}
                strokeWidth={decided ? trackW : 1.5}
                strokeOpacity={0.75}
              />
              <line
                x1={RR16_X - FLAG_R16 - 4}
                y1={teamA_cy}
                x2={RR16_X - FLAG_R16 - 4}
                y2={teamB_cy}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth={1}
              />
              {renderTeamRow(c.timeA, RR16_X, teamA_cy, FLAG_R16, !wonB && !c.timeA.eliminado, false)}
              {renderTeamRow(c.timeB, RR16_X, teamB_cy, FLAG_R16, !wonA && !c.timeB.eliminado, false)}
              {placarStr(c) && (
                <text x={RR16_X - FLAG_R16 - 40} y={cy + 3} textAnchor="middle" fontSize={9} fill="#FFD700" fontFamily="monospace" opacity={0.85}>
                  {placarStr(c)}
                </text>
              )}
            </g>
          );
        })}

        {/* ─── RIGHT SIDE: QF ──────────────────────────────────────────────── */}
        {RIGHT_QF_FINAL.map((jNum, qi) => {
          const c = get(jNum);
          const cy = qfY(qi);
          const wonA = c.vencedor === "a";
          const wonB = c.vencedor === "b";
          const decided = c.vencedor !== null;
          const teamA_cy = cy - FLAG_QF - 5;
          const teamB_cy = cy + FLAG_QF + 5;
          const r1 = qi * 2;
          const r2 = qi * 2 + 1;
          const r16ExitX = RR16_X - PHASE_W / 2;

          const winnerSlot = wonA ? c.timeA : wonB ? c.timeB : null;
          const tColor = winnerSlot ? trackColor(winnerSlot) : "rgba(255,255,255,0.12)";
          const trackW = winnerSlot && isBrasil(winnerSlot.nome) ? 3 : 2;

          return (
            <g key={`rqf-${jNum}`}>
              <path
                d={connL(r16ExitX, r16Y(r1), RQF_X + FLAG_QF + 6, teamA_cy)}
                fill="none"
                stroke="rgba(255,255,255,0.16)"
                strokeWidth={1.5}
              />
              <path
                d={connL(r16ExitX, r16Y(r2), RQF_X + FLAG_QF + 6, teamB_cy)}
                fill="none"
                stroke="rgba(255,255,255,0.16)"
                strokeWidth={1.5}
              />
              <line
                x1={RQF_X - FLAG_QF - 6}
                y1={cy}
                x2={RQF_X - PHASE_W / 2}
                y2={cy}
                stroke={decided ? tColor : "rgba(255,255,255,0.12)"}
                strokeWidth={decided ? trackW : 1.5}
                strokeOpacity={0.75}
              />
              <line
                x1={RQF_X - FLAG_QF - 4}
                y1={teamA_cy}
                x2={RQF_X - FLAG_QF - 4}
                y2={teamB_cy}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth={1}
              />
              {renderTeamRow(c.timeA, RQF_X, teamA_cy, FLAG_QF, !wonB && !c.timeA.eliminado, false)}
              {renderTeamRow(c.timeB, RQF_X, teamB_cy, FLAG_QF, !wonA && !c.timeB.eliminado, false)}
              {placarStr(c) && (
                <text x={RQF_X - FLAG_QF - 48} y={cy + 3} textAnchor="middle" fontSize={9} fill="#FFD700" fontFamily="monospace" opacity={0.85}>
                  {placarStr(c)}
                </text>
              )}
            </g>
          );
        })}

        {/* ─── RIGHT SF (J102) ─────────────────────────────────────────────── */}
        {(() => {
          const c = get(102);
          const cy = sfY();
          const wonA = c.vencedor === "a";
          const wonB = c.vencedor === "b";
          const decided = c.vencedor !== null;
          const teamA_cy = cy - FLAG_SF - 6;
          const teamB_cy = cy + FLAG_SF + 6;
          const qfExitX = RQF_X - PHASE_W / 2;

          const winnerSlot = wonA ? c.timeA : wonB ? c.timeB : null;
          const tColor = winnerSlot ? trackColor(winnerSlot) : "rgba(255,255,255,0.12)";
          const trackW = winnerSlot && isBrasil(winnerSlot.nome) ? 3.5 : 2;

          return (
            <g key="rsf">
              <path
                d={connL(qfExitX, qfY(0), RSF_X + FLAG_SF + 6, teamA_cy)}
                fill="none"
                stroke="rgba(255,255,255,0.18)"
                strokeWidth={1.5}
              />
              <path
                d={connL(qfExitX, qfY(1), RSF_X + FLAG_SF + 6, teamB_cy)}
                fill="none"
                stroke="rgba(255,255,255,0.18)"
                strokeWidth={1.5}
              />
              <line
                x1={RSF_X - FLAG_SF - 6}
                y1={cy}
                x2={FINAL_X + FLAG_F + 14}
                y2={cy}
                stroke={decided ? tColor : "rgba(255,255,255,0.12)"}
                strokeWidth={decided ? trackW : 1.5}
                strokeOpacity={0.75}
              />
              <line
                x1={RSF_X - FLAG_SF - 4}
                y1={teamA_cy}
                x2={RSF_X - FLAG_SF - 4}
                y2={teamB_cy}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth={1}
              />
              {renderTeamRow(c.timeA, RSF_X, teamA_cy, FLAG_SF, !wonB && !c.timeA.eliminado, false)}
              {renderTeamRow(c.timeB, RSF_X, teamB_cy, FLAG_SF, !wonA && !c.timeB.eliminado, false)}
              {placarStr(c) && (
                <text x={RSF_X - FLAG_SF - 55} y={cy + 3} textAnchor="middle" fontSize={10} fill="#FFD700" fontFamily="monospace" opacity={0.9}>
                  {placarStr(c)}
                </text>
              )}
            </g>
          );
        })()}

        {/* ─── FINAL (J104) — CENTER TROPHY ────────────────────────────────── */}
        {(() => {
          const c = get(104);
          const cy = finalY;
          const wonA = c.vencedor === "a";
          const wonB = c.vencedor === "b";

          const TROPHY_SIZE = 90;
          const TROPHY_TOP = cy - TROPHY_SIZE * 0.6;

          const leftSlot = c.timeA;
          const rightSlot = c.timeB;

          return (
            <g key="final">
              {/* Glow aura around trophy */}
              <circle
                cx={FINAL_X}
                cy={cy}
                r={70}
                fill="none"
                stroke="#FFD700"
                strokeWidth={1}
                opacity={0.15}
              />
              <circle
                cx={FINAL_X}
                cy={cy}
                r={50}
                fill="rgba(255,215,0,0.04)"
              />
              {/* Trophy SVG rendered as foreignObject */}
              <foreignObject
                x={FINAL_X - TROPHY_SIZE / 2}
                y={TROPHY_TOP - TROPHY_SIZE * 0.3}
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
                    fontSize: TROPHY_SIZE * 0.85,
                    lineHeight: 1,
                    filter: "drop-shadow(0 0 20px #FFD700AA)",
                  }}
                >
                  🏆
                </div>
              </foreignObject>
              {/* "CAMPEÃO" text below trophy */}
              <text
                x={FINAL_X}
                y={cy + 28}
                textAnchor="middle"
                fontSize={11}
                fontWeight={800}
                letterSpacing={3}
                fill="#FFD700"
                fontFamily="system-ui"
                opacity={0.7}
              >
                CAMPEÃO
              </text>
              {/* Left finalist flag (if decided) */}
              {wonA && (() => {
                const clipId = `final-left-${leftSlot.iso ?? "unk"}`;
                return (
                  <g>
                    <clipPath id={clipId}><circle cx={FINAL_X - 80} cy={cy} r={FLAG_F} /></clipPath>
                    {leftSlot.iso && <image href={`https://hatscripts.github.io/circle-flags/flags/${leftSlot.iso}.svg`} x={FINAL_X - 80 - FLAG_F} y={cy - FLAG_F} width={FLAG_F * 2} height={FLAG_F * 2} clipPath={`url(#${clipId})`} preserveAspectRatio="xMidYMid slice" />}
                    <circle cx={FINAL_X - 80} cy={cy} r={FLAG_F} fill="none" stroke="#FFD700" strokeWidth={3} />
                    <text x={FINAL_X - 80} y={cy + FLAG_F + 14} textAnchor="middle" fontSize={11} fill="rgba(255,255,255,0.8)" fontFamily="system-ui" fontWeight={600}>{shortName(leftSlot.nome, 12)}</text>
                  </g>
                );
              })()}
              {/* Right finalist flag (if decided) */}
              {wonB && (() => {
                const clipId = `final-right-${rightSlot.iso ?? "unk"}`;
                return (
                  <g>
                    <clipPath id={clipId}><circle cx={FINAL_X + 80} cy={cy} r={FLAG_F} /></clipPath>
                    {rightSlot.iso && <image href={`https://hatscripts.github.io/circle-flags/flags/${rightSlot.iso}.svg`} x={FINAL_X + 80 - FLAG_F} y={cy - FLAG_F} width={FLAG_F * 2} height={FLAG_F * 2} clipPath={`url(#${clipId})`} preserveAspectRatio="xMidYMid slice" />}
                    <circle cx={FINAL_X + 80} cy={cy} r={FLAG_F} fill="none" stroke="#FFD700" strokeWidth={3} />
                    <text x={FINAL_X + 80} y={cy + FLAG_F + 14} textAnchor="middle" fontSize={11} fill="rgba(255,255,255,0.8)" fontFamily="system-ui" fontWeight={600}>{shortName(rightSlot.nome, 12)}</text>
                  </g>
                );
              })()}
              {/* "FINAL J104" label */}
              <text
                x={FINAL_X}
                y={cy - TROPHY_SIZE * 0.7}
                textAnchor="middle"
                fontSize={10}
                fill="rgba(255,215,0,0.5)"
                fontFamily="system-ui"
                letterSpacing={1}
              >
                J104 · FINAL
              </text>
            </g>
          );
        })()}

        {/* ─── 3RD PLACE (J103) ────────────────────────────────────────────── */}
        {(() => {
          const c = get(103);
          const cy = finalY + 110;
          return (
            <g key="third">
              <text
                x={FINAL_X}
                y={cy - 22}
                textAnchor="middle"
                fontSize={9}
                fill="rgba(255,255,255,0.25)"
                letterSpacing={1.5}
              >
                3º LUGAR · J103
              </text>
              {renderTeamRow(c.timeA, FINAL_X - 60, cy, FLAG_R32, false, true)}
              <text x={FINAL_X} y={cy + 4} textAnchor="middle" fontSize={11} fill="rgba(255,255,255,0.3)" fontFamily="monospace">
                {placarStr(c) || "vs"}
              </text>
              {renderTeamRow(c.timeB, FINAL_X + 60, cy, FLAG_R32, false, false)}
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

// ─── VARIAÇÃO B: Bracket Vertical ────────────────────────────────────────────
// R32 no topo (16 jogos em linha), convergindo para baixo até o troféu.
// Mobile-friendly, leitura de cima para baixo.

function VariacaoB({ bracket }: { bracket: Map<number, Confronto> }) {
  const get = (n: number): Confronto => bracket.get(n)!;

  // Vertical layout: phases as rows
  // R32: 16 games across the top
  // R16: 8 games
  // QF: 4 games
  // SF: 2 games
  // Final: 1 game + trophy at center bottom

  const COL_W = 96;   // column width per R32 game
  const PHASE_H = 140; // vertical height per phase
  const FLAG_R32 = 20;
  const FLAG_R16 = 24;
  const FLAG_QF = 28;
  const FLAG_SF = 34;
  const FLAG_F = 44;

  const TOTAL_W = 16 * COL_W + 40; // 16 R32 slots + padding
  const SVG_H = 5 * PHASE_H + 120;

  // X center of R32 game slot i (0-15)
  function r32X(i: number): number {
    return 20 + i * COL_W + COL_W / 2;
  }

  // R32 game order (left→right across page):
  // Left bracket (feeds left SF): J74,J77,J73,J75, J81,J82,J83,J84
  // Right bracket (feeds right SF): J76,J78,J79,J80, J86,J88,J85,J87
  const R32_ORDER = [74, 77, 73, 75, 81, 82, 83, 84, 76, 78, 79, 80, 86, 88, 85, 87];
  const R16_ORDER = [89, 90, 93, 94, 91, 92, 95, 96];
  const QF_ORDER = [97, 98, 99, 100];
  const SF_ORDER = [101, 102];

  // Y positions for each phase row
  const R32_Y = 60;
  const R16_Y = R32_Y + PHASE_H;
  const QF_Y = R16_Y + PHASE_H;
  const SF_Y = QF_Y + PHASE_H;
  const FINAL_Y = SF_Y + PHASE_H;

  // R16 game i spans columns (i*2) and (i*2+1) of R32
  function r16X(i: number): number {
    const c1 = r32X(i * 2);
    const c2 = r32X(i * 2 + 1);
    return (c1 + c2) / 2;
  }
  function qfX(i: number): number {
    const r1 = r16X(i * 2);
    const r2 = r16X(i * 2 + 1);
    return (r1 + r2) / 2;
  }
  function sfX(i: number): number {
    const q1 = qfX(i * 2);
    const q2 = qfX(i * 2 + 1);
    return (q1 + q2) / 2;
  }
  const finalX = (sfX(0) + sfX(1)) / 2;

  // Right-angle connector: from (x1,y1) going DOWN to (x2,y2)
  function connDown(x1: number, y1: number, x2: number, y2: number): string {
    if (Math.abs(x1 - x2) < 1) return `M ${x1} ${y1} V ${y2}`;
    const my = (y1 + y2) / 2;
    return `M ${x1} ${y1} V ${my} H ${x2} V ${y2}`;
  }

  // Render flag column at (cx, cy) — vertical layout (flag above, name below)
  function renderFlagCol(slot: SlotTime, cx: number, cy: number, r: number, isActive: boolean) {
    const isUnknown = !slot.nome || slot.nome.startsWith("Venc.") || slot.nome.startsWith("Perd.");
    const eliminated = !!slot.eliminado;
    const opacity = isUnknown ? 0.2 : eliminated ? 0.32 : 1;
    const brasil = isBrasil(slot.nome);
    const color = teamColor(slot.nome);
    const flagUrl = slot.iso
      ? `https://hatscripts.github.io/circle-flags/flags/${slot.iso}.svg`
      : null;

    return (
      <g opacity={opacity} key={`${slot.nome}-${cx}-${cy}`}>
        {isActive && !isUnknown && (
          <circle cx={cx} cy={cy} r={r + 6} fill="none"
            stroke={brasil ? "#009C3B" : color}
            strokeWidth={brasil ? 3 : 1.5}
            opacity={brasil ? 0.65 : 0.4}
          />
        )}
        <clipPath id={`cb-${slot.iso ?? slot.nome.replace(/\W/g, "_")}-${Math.round(cx)}-${Math.round(cy)}`}>
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
        {flagUrl ? (
          <image
            href={flagUrl}
            x={cx - r}
            y={cy - r}
            width={r * 2}
            height={r * 2}
            clipPath={`url(#cb-${slot.iso ?? slot.nome.replace(/\W/g, "_")}-${Math.round(cx)}-${Math.round(cy)})`}
            preserveAspectRatio="xMidYMid slice"
          />
        ) : (
          <circle cx={cx} cy={cy} r={r} fill={isUnknown ? "rgba(255,255,255,0.06)" : `${color}33`} />
        )}
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={isActive && !isUnknown ? (brasil ? "#009C3B" : `${color}BB`) : "rgba(255,255,255,0.15)"}
          strokeWidth={isActive && !isUnknown ? (brasil ? 2.5 : 1.5) : 1}
        />
        {isUnknown && (
          <text x={cx} y={cy + 5} textAnchor="middle" fontSize={r * 0.7} fill="rgba(255,255,255,0.3)" fontFamily="system-ui">?</text>
        )}
        <text
          x={cx}
          y={cy + r + 12}
          textAnchor="middle"
          fontSize={9}
          fontFamily="system-ui, sans-serif"
          fontWeight={isActive && !isUnknown ? 600 : 400}
          fill={isActive && !isUnknown
            ? brasil ? "#4ADE80" : "rgba(255,255,255,0.85)"
            : "rgba(255,255,255,0.3)"}
        >
          {isUnknown ? "?" : shortName(slot.nome, 8)}
        </text>
      </g>
    );
  }

  return (
    <div style={{ overflowX: "auto", width: "100%" }}>
      <svg
        viewBox={`0 0 ${TOTAL_W} ${SVG_H + 60}`}
        width={TOTAL_W}
        height={SVG_H + 60}
        style={{
          display: "block",
          background: "linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
        aria-label="Chaveamento vertical Copa 2026"
      >
        {/* Phase row labels (left side) */}
        {[
          ["R32", R32_Y],
          ["Oitavas", R16_Y],
          ["Quartas", QF_Y],
          ["Semis", SF_Y],
          ["Final", FINAL_Y],
        ].map(([label, y]) => (
          <text
            key={String(label)}
            x={12}
            y={Number(y) + 4}
            fontSize={9}
            fontWeight={700}
            letterSpacing={1}
            fill={String(label) === "Final" ? "#FFD700" : "rgba(255,255,255,0.3)"}
            fontFamily="system-ui"
            style={{ writingMode: "horizontal-tb" }}
          >
            {String(label).toUpperCase()}
          </text>
        ))}

        {/* ─── R32 games ─────────────────────────────────────────────────── */}
        {R32_ORDER.map((jNum, gi) => {
          const c = get(jNum);
          const cx = r32X(gi);
          const wonA = c.vencedor === "a";
          const wonB = c.vencedor === "b";
          const decided = c.vencedor !== null;
          const winnerSlot = wonA ? c.timeA : wonB ? c.timeB : null;

          // Show the winner flag prominently, loser dimmed
          const displaySlot = winnerSlot ?? c.timeA;
          const altSlot = c.timeB;
          const tColor = winnerSlot ? (isBrasil(winnerSlot.nome) ? "#009C3B" : teamColor(winnerSlot.nome)) : "rgba(255,255,255,0.15)";

          // Connector down to R16
          const r16CX = r16X(Math.floor(gi / 2));
          const connColor = decided ? tColor : "rgba(255,255,255,0.12)";

          return (
            <g key={`br32-${jNum}`}>
              {/* Game box background */}
              <rect
                x={cx - COL_W / 2 + 3}
                y={R32_Y - FLAG_R32 - 18}
                width={COL_W - 6}
                height={FLAG_R32 * 2 + 36}
                rx={4}
                fill="rgba(255,255,255,0.03)"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={1}
              />
              {/* Two flags (winner on top if decided) */}
              {decided ? (
                <>
                  {renderFlagCol(
                    winnerSlot!,
                    cx,
                    R32_Y - FLAG_R32 / 2 - 4,
                    FLAG_R32,
                    true,
                  )}
                  {/* Loser small */}
                  {renderFlagCol(
                    wonA ? c.timeB : c.timeA,
                    cx,
                    R32_Y + FLAG_R32 / 2 + 4,
                    FLAG_R32 * 0.6,
                    false,
                  )}
                </>
              ) : (
                <>
                  {renderFlagCol(c.timeA, cx, R32_Y - FLAG_R32 / 2 - 2, FLAG_R32, true)}
                  {renderFlagCol(c.timeB, cx, R32_Y + FLAG_R32 / 2 + 2, FLAG_R32, true)}
                </>
              )}
              {/* Score */}
              {placarStr(c) && (
                <text x={cx} y={R32_Y + FLAG_R32 + 30} textAnchor="middle" fontSize={8} fill="#FFD700" fontFamily="monospace">{placarStr(c)}</text>
              )}
              {/* Connector down */}
              <path
                d={connDown(cx, R32_Y + FLAG_R32 + (placarStr(c) ? 36 : 20), r16CX, R16_Y - FLAG_R16 - 22)}
                fill="none"
                stroke={connColor}
                strokeWidth={isBrasil(winnerSlot?.nome ?? "") ? 2.5 : 1.5}
                opacity={0.7}
              />
            </g>
          );
        })}

        {/* ─── R16 games ─────────────────────────────────────────────────── */}
        {R16_ORDER.map((jNum, ri) => {
          const c = get(jNum);
          const cx = r16X(ri);
          const wonA = c.vencedor === "a";
          const wonB = c.vencedor === "b";
          const decided = c.vencedor !== null;
          const winnerSlot = wonA ? c.timeA : wonB ? c.timeB : null;
          const tColor = winnerSlot ? (isBrasil(winnerSlot.nome) ? "#009C3B" : teamColor(winnerSlot.nome)) : "rgba(255,255,255,0.15)";
          const qfCX = qfX(Math.floor(ri / 2));

          return (
            <g key={`br16-${jNum}`}>
              <rect
                x={cx - COL_W + 2}
                y={R16_Y - FLAG_R16 - 18}
                width={COL_W * 2 - 4}
                height={FLAG_R16 * 2 + 36}
                rx={4}
                fill="rgba(255,255,255,0.035)"
                stroke="rgba(255,255,255,0.09)"
                strokeWidth={1}
              />
              {decided ? (
                <>
                  {renderFlagCol(winnerSlot!, cx, R16_Y - FLAG_R16 / 2 - 4, FLAG_R16, true)}
                  {renderFlagCol(wonA ? c.timeB : c.timeA, cx, R16_Y + FLAG_R16 / 2 + 4, FLAG_R16 * 0.65, false)}
                </>
              ) : (
                <>
                  {renderFlagCol(c.timeA, cx, R16_Y - FLAG_R16 / 2 - 2, FLAG_R16, true)}
                  {renderFlagCol(c.timeB, cx, R16_Y + FLAG_R16 / 2 + 2, FLAG_R16, true)}
                </>
              )}
              {placarStr(c) && (
                <text x={cx} y={R16_Y + FLAG_R16 + 30} textAnchor="middle" fontSize={8} fill="#FFD700" fontFamily="monospace">{placarStr(c)}</text>
              )}
              <path
                d={connDown(cx, R16_Y + FLAG_R16 + (placarStr(c) ? 36 : 22), qfCX, QF_Y - FLAG_QF - 22)}
                fill="none"
                stroke={decided ? tColor : "rgba(255,255,255,0.12)"}
                strokeWidth={isBrasil(winnerSlot?.nome ?? "") ? 2.5 : 1.5}
                opacity={0.7}
              />
            </g>
          );
        })}

        {/* ─── QF games ──────────────────────────────────────────────────── */}
        {QF_ORDER.map((jNum, qi) => {
          const c = get(jNum);
          const cx = qfX(qi);
          const wonA = c.vencedor === "a";
          const wonB = c.vencedor === "b";
          const decided = c.vencedor !== null;
          const winnerSlot = wonA ? c.timeA : wonB ? c.timeB : null;
          const tColor = winnerSlot ? (isBrasil(winnerSlot.nome) ? "#009C3B" : teamColor(winnerSlot.nome)) : "rgba(255,255,255,0.15)";
          const sfCX = sfX(Math.floor(qi / 2));

          return (
            <g key={`bqf-${jNum}`}>
              <rect
                x={cx - COL_W * 2 + 3}
                y={QF_Y - FLAG_QF - 20}
                width={COL_W * 4 - 6}
                height={FLAG_QF * 2 + 40}
                rx={5}
                fill="rgba(255,255,255,0.04)"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={1}
              />
              {decided ? (
                <>
                  {renderFlagCol(winnerSlot!, cx, QF_Y - FLAG_QF / 2 - 4, FLAG_QF, true)}
                  {renderFlagCol(wonA ? c.timeB : c.timeA, cx, QF_Y + FLAG_QF / 2 + 4, FLAG_QF * 0.65, false)}
                </>
              ) : (
                <>
                  {renderFlagCol(c.timeA, cx, QF_Y - FLAG_QF / 2 - 3, FLAG_QF, true)}
                  {renderFlagCol(c.timeB, cx, QF_Y + FLAG_QF / 2 + 3, FLAG_QF, true)}
                </>
              )}
              {placarStr(c) && (
                <text x={cx} y={QF_Y + FLAG_QF + 32} textAnchor="middle" fontSize={9} fill="#FFD700" fontFamily="monospace">{placarStr(c)}</text>
              )}
              <path
                d={connDown(cx, QF_Y + FLAG_QF + (placarStr(c) ? 38 : 24), sfCX, SF_Y - FLAG_SF - 24)}
                fill="none"
                stroke={decided ? tColor : "rgba(255,255,255,0.12)"}
                strokeWidth={isBrasil(winnerSlot?.nome ?? "") ? 3 : 2}
                opacity={0.7}
              />
            </g>
          );
        })}

        {/* ─── SF games ──────────────────────────────────────────────────── */}
        {SF_ORDER.map((jNum, si) => {
          const c = get(jNum);
          const cx = sfX(si);
          const wonA = c.vencedor === "a";
          const wonB = c.vencedor === "b";
          const decided = c.vencedor !== null;
          const winnerSlot = wonA ? c.timeA : wonB ? c.timeB : null;
          const tColor = winnerSlot ? (isBrasil(winnerSlot.nome) ? "#009C3B" : teamColor(winnerSlot.nome)) : "rgba(255,255,255,0.15)";

          return (
            <g key={`bsf-${jNum}`}>
              <rect
                x={cx - COL_W * 4 + 4}
                y={SF_Y - FLAG_SF - 22}
                width={COL_W * 8 - 8}
                height={FLAG_SF * 2 + 44}
                rx={6}
                fill="rgba(255,255,255,0.05)"
                stroke="rgba(255,215,0,0.15)"
                strokeWidth={1}
              />
              {decided ? (
                <>
                  {renderFlagCol(winnerSlot!, cx, SF_Y - FLAG_SF / 2 - 5, FLAG_SF, true)}
                  {renderFlagCol(wonA ? c.timeB : c.timeA, cx, SF_Y + FLAG_SF / 2 + 5, FLAG_SF * 0.6, false)}
                </>
              ) : (
                <>
                  {renderFlagCol(c.timeA, cx, SF_Y - FLAG_SF / 2 - 4, FLAG_SF, true)}
                  {renderFlagCol(c.timeB, cx, SF_Y + FLAG_SF / 2 + 4, FLAG_SF, true)}
                </>
              )}
              {placarStr(c) && (
                <text x={cx} y={SF_Y + FLAG_SF + 36} textAnchor="middle" fontSize={9} fill="#FFD700" fontFamily="monospace">{placarStr(c)}</text>
              )}
              <path
                d={connDown(cx, SF_Y + FLAG_SF + (placarStr(c) ? 42 : 28), finalX, FINAL_Y - FLAG_F - 30)}
                fill="none"
                stroke={decided ? tColor : "rgba(255,215,0,0.2)"}
                strokeWidth={isBrasil(winnerSlot?.nome ?? "") ? 3.5 : 2.5}
                opacity={0.75}
              />
            </g>
          );
        })}

        {/* ─── FINAL + TROPHY ────────────────────────────────────────────── */}
        {(() => {
          const c = get(104);
          const wonA = c.vencedor === "a";
          const wonB = c.vencedor === "b";
          const winner = wonA ? c.timeA : wonB ? c.timeB : null;
          const TROPHY_SIZE = 80;

          return (
            <g key="bfinal">
              {/* Glow aura */}
              <circle cx={finalX} cy={FINAL_Y} r={60} fill="none" stroke="#FFD700" strokeWidth={1} opacity={0.12} />
              {/* Trophy */}
              <foreignObject
                x={finalX - TROPHY_SIZE / 2}
                y={FINAL_Y - TROPHY_SIZE * 0.85}
                width={TROPHY_SIZE}
                height={TROPHY_SIZE}
              >
                <div style={{
                  width: TROPHY_SIZE,
                  height: TROPHY_SIZE,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: TROPHY_SIZE * 0.8,
                  lineHeight: 1,
                  filter: "drop-shadow(0 0 18px #FFD700AA)",
                }}>
                  🏆
                </div>
              </foreignObject>
              {/* Winner flag */}
              {winner && (() => {
                const clipId = `bfinal-w-${winner.iso ?? "unk"}`;
                return (
                  <g>
                    <clipPath id={clipId}><circle cx={finalX} cy={FINAL_Y + 10} r={FLAG_F} /></clipPath>
                    {winner.iso && (
                      <image
                        href={`https://hatscripts.github.io/circle-flags/flags/${winner.iso}.svg`}
                        x={finalX - FLAG_F}
                        y={FINAL_Y + 10 - FLAG_F}
                        width={FLAG_F * 2}
                        height={FLAG_F * 2}
                        clipPath={`url(#${clipId})`}
                        preserveAspectRatio="xMidYMid slice"
                      />
                    )}
                    <circle cx={finalX} cy={FINAL_Y + 10} r={FLAG_F} fill="none" stroke="#FFD700" strokeWidth={3} />
                    <text x={finalX} y={FINAL_Y + 10 + FLAG_F + 14} textAnchor="middle" fontSize={12} fill="#FFD700" fontFamily="system-ui" fontWeight={700}>
                      {shortName(winner.nome, 14)}
                    </text>
                  </g>
                );
              })()}
              {!winner && (
                <text x={finalX} y={FINAL_Y + 18} textAnchor="middle" fontSize={11} fill="rgba(255,215,0,0.5)" fontFamily="system-ui" letterSpacing={2}>
                  CAMPEÃO
                </text>
              )}
              {/* Final label */}
              <text x={finalX} y={FINAL_Y - TROPHY_SIZE * 0.95} textAnchor="middle" fontSize={9} fill="rgba(255,215,0,0.5)" letterSpacing={1}>J104 · FINAL</text>
            </g>
          );
        })()}

        {/* ─── 3rd Place ─────────────────────────────────────────────────── */}
        {(() => {
          const c = get(103);
          const thirdY = FINAL_Y + 80;
          const thirdX = TOTAL_W * 0.5;
          return (
            <g key="b3rd">
              <text x={thirdX} y={thirdY - 12} textAnchor="middle" fontSize={8} fill="rgba(255,255,255,0.2)" letterSpacing={1.5}>3º LUGAR</text>
              {renderFlagCol(c.timeA, thirdX - 40, thirdY, FLAG_R32, false)}
              <text x={thirdX} y={thirdY + 4} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.2)" fontFamily="monospace">vs</text>
              {renderFlagCol(c.timeB, thirdX + 40, thirdY, FLAG_R32, false)}
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

// ─── VARIAÇÃO C: Compact Dark com Cards ──────────────────────────────────────
// Bracket compacto light-colored com cards HTML (não SVG).
// Bom para mobile, mais fácil de ler num formato de tabela.
// Linhas feitas com bordas CSS (border-right + border-top/bottom) — ângulo reto garantido.

function GameCard({
  c,
  flagSize = 36,
  showScore = true,
}: {
  c: Confronto;
  flagSize?: number;
  showScore?: boolean;
}) {
  const wonA = c.vencedor === "a";
  const wonB = c.vencedor === "b";
  const scoreStr = placarStr(c);
  const brasil_a = isBrasil(c.timeA.nome);
  const brasil_b = isBrasil(c.timeB.nome);

  function teamRow(slot: SlotTime, won: boolean, lost: boolean, isB = false) {
    const isUnknown = !slot.nome || slot.nome.startsWith("Venc.") || slot.nome.startsWith("Perd.");
    const brasil = isBrasil(slot.nome);
    const color = teamColor(slot.nome);

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "5px 10px",
          opacity: lost ? 0.32 : 1,
          background: won
            ? brasil
              ? "rgba(0,156,59,0.12)"
              : `${color}12`
            : "transparent",
          borderRadius: 4,
        }}
      >
        <FlagImg slot={slot} size={flagSize} />
        <span
          style={{
            fontSize: 11,
            fontWeight: won ? 700 : 400,
            color: won
              ? brasil
                ? "#4ADE80"
                : "rgba(255,255,255,0.95)"
              : isUnknown
              ? "rgba(255,255,255,0.2)"
              : "rgba(255,255,255,0.65)",
            letterSpacing: 0.2,
          }}
        >
          {isUnknown ? "?" : shortName(slot.nome, 12)}
        </span>
        {won && (
          <span style={{ marginLeft: "auto", fontSize: 10, color: "#FFD700", fontFamily: "monospace" }}>
            {showScore && scoreStr ? scoreStr : "✓"}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 8,
        overflow: "hidden",
        minWidth: 140,
        maxWidth: 180,
      }}
    >
      {teamRow(c.timeA, wonA, wonB)}
      <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "0 8px" }} />
      {teamRow(c.timeB, wonB, wonA, true)}
    </div>
  );
}

// Connector bracket line (CSS-based, right angles)
function BracketConnector({
  height,
  side = "right",
}: {
  height: number;
  side?: "left" | "right";
}) {
  return (
    <div
      style={{
        width: 16,
        height,
        position: "relative",
        flexShrink: 0,
      }}
    >
      {/* Vertical line in center */}
      <div
        style={{
          position: "absolute",
          [side === "right" ? "left" : "right"]: 0,
          top: "25%",
          bottom: "25%",
          width: 1,
          background: "rgba(255,255,255,0.2)",
        }}
      />
      {/* Top horizontal line */}
      <div
        style={{
          position: "absolute",
          [side === "right" ? "left" : "right"]: 0,
          top: "25%",
          width: "100%",
          height: 1,
          background: "rgba(255,255,255,0.2)",
        }}
      />
      {/* Bottom horizontal line */}
      <div
        style={{
          position: "absolute",
          [side === "right" ? "left" : "right"]: 0,
          bottom: "25%",
          width: "100%",
          height: 1,
          background: "rgba(255,255,255,0.2)",
        }}
      />
    </div>
  );
}

function PhaseColumn({
  title,
  games,
  bracket,
  flagSize,
}: {
  title: string;
  games: number[];
  bracket: Map<number, Confronto>;
  flagSize: number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: 2,
          color: title === "FINAL" ? "#FFD700" : "rgba(255,255,255,0.35)",
          textAlign: "center",
          paddingBottom: 6,
        }}
      >
        {title}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-around",
          flex: 1,
          gap: 8,
        }}
      >
        {games.map((n) => (
          <GameCard key={n} c={bracket.get(n)!} flagSize={flagSize} />
        ))}
      </div>
    </div>
  );
}

function VariacaoC({ bracket }: { bracket: Map<number, Confronto> }) {
  return (
    <div
      style={{
        overflowX: "auto",
        width: "100%",
        background: "linear-gradient(135deg, #0c1120 0%, #161e30 100%)",
        padding: "24px 16px",
        borderRadius: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          gap: 0,
          minWidth: 900,
        }}
      >
        {/* LEFT SIDE: R32 → R16 → QF → SF */}
        <PhaseColumn
          title="R32"
          games={[74, 77, 73, 75, 81, 82, 83, 84]}
          bracket={bracket}
          flagSize={28}
        />
        <div style={{ display: "flex", alignItems: "center" }}>
          <BracketConnector height={520} side="right" />
        </div>
        <PhaseColumn
          title="OITAVAS"
          games={[89, 90, 93, 94]}
          bracket={bracket}
          flagSize={32}
        />
        <div style={{ display: "flex", alignItems: "center" }}>
          <BracketConnector height={340} side="right" />
        </div>
        <PhaseColumn
          title="QUARTAS"
          games={[97, 98]}
          bracket={bracket}
          flagSize={36}
        />
        <div style={{ display: "flex", alignItems: "center" }}>
          <BracketConnector height={180} side="right" />
        </div>
        <PhaseColumn
          title="SEMI"
          games={[101]}
          bracket={bracket}
          flagSize={40}
        />
        <div style={{ display: "flex", alignItems: "center" }}>
          <BracketConnector height={120} side="right" />
        </div>

        {/* CENTER: Trophy + Final */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            padding: "0 16px",
            minWidth: 140,
          }}
        >
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: "#FFD700" }}>FINAL</div>
          <div style={{ fontSize: 64, filter: "drop-shadow(0 0 20px #FFD700AA)", lineHeight: 1 }}>🏆</div>
          <GameCard c={bracket.get(104)!} flagSize={44} />
          <div style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", letterSpacing: 1, marginTop: 8 }}>
            3º LUGAR
          </div>
          <GameCard c={bracket.get(103)!} flagSize={28} showScore={false} />
        </div>

        {/* RIGHT SIDE: SF → QF → R16 → R32 */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <BracketConnector height={120} side="left" />
        </div>
        <PhaseColumn
          title="SEMI"
          games={[102]}
          bracket={bracket}
          flagSize={40}
        />
        <div style={{ display: "flex", alignItems: "center" }}>
          <BracketConnector height={180} side="left" />
        </div>
        <PhaseColumn
          title="QUARTAS"
          games={[99, 100]}
          bracket={bracket}
          flagSize={36}
        />
        <div style={{ display: "flex", alignItems: "center" }}>
          <BracketConnector height={340} side="left" />
        </div>
        <PhaseColumn
          title="OITAVAS"
          games={[91, 92, 95, 96]}
          bracket={bracket}
          flagSize={32}
        />
        <div style={{ display: "flex", alignItems: "center" }}>
          <BracketConnector height={520} side="left" />
        </div>
        <PhaseColumn
          title="R32"
          games={[76, 78, 79, 80, 86, 88, 85, 87]}
          bracket={bracket}
          flagSize={28}
        />
      </div>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default async function ChaveamentoPage() {
  const [jogos, resultados, mapaPaises] = await Promise.all([
    carregarJogos(),
    carregarResultados(),
    carregarMapaPaises(),
  ]);

  const bracket = buildBracket(jogos, resultados, mapaPaises);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#080d18",
        color: "#fff",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "36px 24px 24px",
          textAlign: "center",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: 3,
            color: "#fff",
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          CHAVEAMENTO
        </h1>
        <p
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.4)",
            marginTop: 8,
            letterSpacing: 1,
          }}
        >
          Copa do Mundo FIFA 2026 · Mata-mata
        </p>
      </div>

      {/* ─── VARIAÇÃO A ─────────────────────────────────────────────────────── */}
      <section style={{ padding: "48px 0 32px" }}>
        <div style={{ padding: "0 24px 20px", textAlign: "center" }}>
          <h2
            style={{
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: 2,
              color: "rgba(255,255,255,0.8)",
              margin: 0,
            }}
          >
            VARIAÇÃO A — Bracket Horizontal Clássico FIFA
          </h2>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 6 }}>
            Esquerda → Centro ← Direita. Linhas em ângulo reto. Taça no centro absoluto.
          </p>
        </div>
        <VariacaoA bracket={bracket} />
      </section>

      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "0 24px" }} />

      {/* ─── VARIAÇÃO B ─────────────────────────────────────────────────────── */}
      <section style={{ padding: "48px 0 32px" }}>
        <div style={{ padding: "0 24px 20px", textAlign: "center" }}>
          <h2
            style={{
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: 2,
              color: "rgba(255,255,255,0.8)",
              margin: 0,
            }}
          >
            VARIAÇÃO B — Bracket Vertical
          </h2>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 6 }}>
            R32 no topo, convergindo para baixo até a taça. Mobile-friendly.
          </p>
        </div>
        <VariacaoB bracket={bracket} />
      </section>

      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "0 24px" }} />

      {/* ─── VARIAÇÃO C ─────────────────────────────────────────────────────── */}
      <section style={{ padding: "48px 24px 64px" }}>
        <div style={{ padding: "0 0 20px", textAlign: "center" }}>
          <h2
            style={{
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: 2,
              color: "rgba(255,255,255,0.8)",
              margin: 0,
            }}
          >
            VARIAÇÃO C — Cards Compactos Espelhados
          </h2>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 6 }}>
            Cards HTML com bordas CSS (ângulo reto garantido). Taça central. Leitura fácil.
          </p>
        </div>
        <VariacaoC bracket={bracket} />
      </section>
    </main>
  );
}
