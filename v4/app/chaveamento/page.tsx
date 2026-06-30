/**
 * /chaveamento — Bracket mata-mata Copa 2026.
 * Variação A única: horizontal clássico FIFA, esquerda → centro ← direita.
 * Linhas em ângulo reto (90°), taça central, vencedores avançam pra dentro.
 * Bandeiras grandes (raio 40px R32 → 88px Final), legíveis em mobile com scroll horizontal.
 * Animação CSS: vencedores R32 decididos deslizam pra posição R16.
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

// ─── VARIAÇÃO A: Bracket Horizontal Clássico FIFA ────────────────────────────
// Esquerda → Centro ← Direita
// 4 fases por lado: R32 → R16 → QF → SF → FINAL (centro)
// Bandeiras grandes, legíveis em mobile com scroll horizontal.
// Animação CSS: vencedores R32 deslizam para posição R16.

function VariacaoA({ bracket }: { bracket: Map<number, Confronto> }) {
  const get = (n: number): Confronto => bracket.get(n)!;

  // ─── Layout constants ─────────────────────────────────────────────────────
  // Large flags, legible on mobile (SVG 2000px wide, scroll horizontally)
  const PHASE_W = 230;    // width per phase column
  const FLAG_R32 = 40;    // radius in SVG units ≈ 80px diameter on mobile scroll
  const FLAG_R16 = 48;
  const FLAG_QF = 58;
  const FLAG_SF = 70;
  const FLAG_F = 88;

  const GAME_H = 110;     // height of one game (accommodates 2 × 40px-radius flags)
  const GAME_GAP = 16;    // vertical gap between games
  const TOP_OFFSET = 50;

  const SVG_W = 2000;
  const CENTER_X = SVG_W / 2;  // 1000

  // Phase X positions (left side: left → center)
  const LR32_X = 80;
  const LR16_X = LR32_X + PHASE_W;      // 310
  const LQF_X  = LR16_X + PHASE_W;      // 540
  const LSF_X  = LQF_X  + PHASE_W;      // 770

  // Phase X positions (right side: right → center, mirrored)
  const RR32_X = SVG_W - 80;            // 1920
  const RR16_X = RR32_X - PHASE_W;      // 1690
  const RQF_X  = RR16_X - PHASE_W;      // 1460
  const RSF_X  = RQF_X  - PHASE_W;      // 1230

  // ─── Y helpers ────────────────────────────────────────────────────────────
  const step = GAME_H + GAME_GAP;       // 126

  function gameTopY(i: number): number {
    return TOP_OFFSET + i * step;
  }
  function teamAY(gi: number): number {
    return gameTopY(gi) + FLAG_R32 + 2;                 // upper team centre
  }
  function teamBY(gi: number): number {
    return gameTopY(gi) + GAME_H - FLAG_R32 - 2;        // lower team centre
  }
  function gameMidY(gi: number): number {
    return (teamAY(gi) + teamBY(gi)) / 2;
  }

  // R16 game Y = midpoint of its two R32 feeders
  function r16Y(r16Idx: number): number {
    const g1 = r16Idx * 2;
    const g2 = r16Idx * 2 + 1;
    return (gameMidY(g1) + gameMidY(g2)) / 2;
  }
  // QF game Y = midpoint of its two R16 games
  function qfY(qfIdx: number): number {
    return (r16Y(qfIdx * 2) + r16Y(qfIdx * 2 + 1)) / 2;
  }
  // SF Y = midpoint of two QFs
  function sfY(): number {
    return (qfY(0) + qfY(1)) / 2;
  }

  const finalY = sfY();

  // Total SVG height
  const TOTAL_H = 8 * GAME_H + 7 * GAME_GAP;   // 880 + 112 = 992
  const SVG_H = TOTAL_H + 80;

  // ─── Bracket order ────────────────────────────────────────────────────────
  // LEFT side feeds SF101 via J97 (top) + J98 (bottom)
  // RIGHT side feeds SF102 via J99 (top) + J100 (bottom)
  const LEFT_R32  = [74, 77, 73, 75, 81, 82, 83, 84];
  const LEFT_R16  = [89, 90, 93, 94];
  const LEFT_QF   = [97, 98];

  const RIGHT_R32 = [76, 78, 79, 80, 86, 88, 85, 87];
  const RIGHT_R16 = [91, 92, 95, 96];
  const RIGHT_QF  = [99, 100];

  // ─── Right-angle connector paths ──────────────────────────────────────────
  function connR(x1: number, y1: number, x2: number, y2: number): string {
    if (Math.abs(y1 - y2) < 1) return `M ${x1} ${y1} H ${x2}`;
    const mx = (x1 + x2) / 2;
    return `M ${x1} ${y1} H ${mx} V ${y2} H ${x2}`;
  }
  function connL(x1: number, y1: number, x2: number, y2: number): string {
    if (Math.abs(y1 - y2) < 1) return `M ${x1} ${y1} H ${x2}`;
    const mx = (x1 + x2) / 2;
    return `M ${x1} ${y1} H ${mx} V ${y2} H ${x2}`;
  }

  // ─── Team row renderer (SVG, horizontal layout) ───────────────────────────
  function renderTeamRow(
    slot: SlotTime,
    cx: number,
    cy: number,
    flagR: number,
    isActive: boolean,
    textRight: boolean = true,
    animId?: string,
  ) {
    const eliminated = !!slot.eliminado;
    const isUnknown = !slot.nome || slot.nome.startsWith("Venc.") || slot.nome.startsWith("Perd.");
    const opacity = isUnknown ? 0.22 : eliminated ? 0.32 : 1;
    const brasil = isBrasil(slot.nome);
    const color = teamColor(slot.nome);
    const flagUrl = slot.iso
      ? `https://hatscripts.github.io/circle-flags/flags/${slot.iso}.svg`
      : null;
    const glowR = flagR + 10;
    const clipId = `ca-${slot.iso ?? slot.nome.replace(/\W/g, "_")}-${Math.round(cx)}-${Math.round(cy)}`;

    const fontSize = Math.max(10, flagR * 0.28);

    return (
      <g
        opacity={opacity}
        key={`${slot.nome}-${cx}-${cy}`}
        style={animId ? { animation: `${animId} 18s ease-in-out infinite` } : undefined}
      >
        {/* Glow ring */}
        {isActive && !isUnknown && (
          <circle
            cx={cx}
            cy={cy}
            r={glowR}
            fill="none"
            stroke={brasil ? "#009C3B" : color}
            strokeWidth={brasil ? 3.5 : 2.5}
            opacity={brasil ? 0.65 : 0.38}
          />
        )}
        {/* Clip circle */}
        <clipPath id={clipId}>
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
            clipPath={`url(#${clipId})`}
            preserveAspectRatio="xMidYMid slice"
          />
        ) : (
          <circle
            cx={cx}
            cy={cy}
            r={flagR}
            fill={isUnknown ? "rgba(255,255,255,0.06)" : `${color}33`}
          />
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
          strokeWidth={isActive && !isUnknown ? (brasil ? 3.5 : 2.5) : 1}
        />
        {/* Unknown ? */}
        {isUnknown && (
          <text
            x={cx}
            y={cy + flagR * 0.3}
            textAnchor="middle"
            fontSize={flagR * 0.75}
            fill="rgba(255,255,255,0.3)"
            fontFamily="system-ui"
          >
            ?
          </text>
        )}
        {/* Team name */}
        <text
          x={textRight ? cx + flagR + 8 : cx - flagR - 8}
          y={cy + 5}
          fontSize={fontSize}
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
          {isUnknown ? "?" : shortName(slot.nome, 11)}
        </text>
      </g>
    );
  }

  const trackColor = (slot: SlotTime) => {
    if (!slot || slot.eliminado) return "rgba(255,255,255,0.12)";
    if (isBrasil(slot.nome)) return "#009C3B";
    return teamColor(slot.nome);
  };

  // ─── Animation: compute translate deltas for R32 winners → R16 positions ──
  // Decided results (read from bracket):
  //   J74 (LEFT idx 0): Paraguai (b) → J89 (r16Idx=0) teamB
  //   J73 (LEFT idx 2): Canadá   (a) → J90 (r16Idx=1) teamA
  //   J75 (LEFT idx 3): Marrocos (b) → J90 (r16Idx=1) teamB
  //   J76 (RIGHT idx 0): Brasil  (a) → J91 (r16Idx=0) teamA
  //   J78 (RIGHT idx 1): Noruega (b) → J91 (r16Idx=0) teamB

  // Helper: translate string for CSS animation keyframe
  function tx(dx: number, dy: number): string {
    return `translate(${Math.round(dx)}px, ${Math.round(dy)}px)`;
  }

  // Build animation CSS for each decided R32 winner
  type AnimSpec = {
    animId: string;
    fromX: number; fromY: number;
    toX: number; toY: number;
    delay: number; // seconds
    loserAnimId?: string;
    loserFromX?: number; loserFromY?: number;
  };

  const animSpecs: AnimSpec[] = [];

  // Scan LEFT R32 for decided games
  LEFT_R32.forEach((jNum, gi) => {
    const c = get(jNum);
    if (c.vencedor === null) return;

    const r16Idx = Math.floor(gi / 2);
    const isTeamA = c.vencedor === "a";

    const fromX = LR32_X;
    const fromY = isTeamA ? teamAY(gi) : teamBY(gi);
    const toX = LR16_X;
    const toY = isTeamA
      ? r16Y(r16Idx) - FLAG_R16 - 4
      : r16Y(r16Idx) + FLAG_R16 + 4;

    animSpecs.push({
      animId: `adv-L-${jNum}-${c.vencedor}`,
      fromX,
      fromY,
      toX,
      toY,
      delay: gi * 1.4,
    });
  });

  // Scan RIGHT R32 for decided games
  RIGHT_R32.forEach((jNum, gi) => {
    const c = get(jNum);
    if (c.vencedor === null) return;

    const r16Idx = Math.floor(gi / 2);
    const isTeamA = c.vencedor === "a";

    const fromX = RR32_X;
    const fromY = isTeamA ? teamAY(gi) : teamBY(gi);
    const toX = RR16_X;
    const toY = isTeamA
      ? r16Y(r16Idx) - FLAG_R16 - 4
      : r16Y(r16Idx) + FLAG_R16 + 4;

    // offset delay so right side runs after left side
    const decided = LEFT_R32.filter((jn) => get(jn).vencedor !== null).length;
    animSpecs.push({
      animId: `adv-R-${jNum}-${c.vencedor}`,
      fromX,
      fromY,
      toX,
      toY,
      delay: decided * 1.4 + gi * 1.4,
    });
  });

  // Total animation cycle = all advances + pause
  const maxDelay = animSpecs.reduce((m, s) => Math.max(m, s.delay), 0);
  const cycleDuration = maxDelay + 1.5 + 9; // last advance + 1.5s settle + 9s pause

  // Build @keyframes CSS for each animation
  // Timeline within one cycle (in seconds):
  //   0 → delay: flag at R32 position (no move)
  //   delay → delay+1.5s: flag slides to R16 position
  //   delay+1.5 → cycleDuration: flag stays at R16 position
  function buildKeyframe(spec: AnimSpec, total: number): string {
    const dx = spec.toX - spec.fromX;
    const dy = spec.toY - spec.fromY;
    const pStart = ((spec.delay) / total * 100).toFixed(1);
    const pEnd   = ((spec.delay + 1.5) / total * 100).toFixed(1);
    return `
@keyframes ${spec.animId} {
  0%, ${pStart}% { transform: translate(0px, 0px); }
  ${pEnd}%, 100% { transform: ${tx(dx, dy)}; }
}`;
  }

  const animCSS = animSpecs
    .map((s) => buildKeyframe(s, cycleDuration))
    .join("\n");

  // Map jNum+side+vencedor → animId for lookup when rendering
  const animMap = new Map<string, string>();
  animSpecs.forEach((s) => {
    animMap.set(s.animId, s.animId);
  });

  function getAnimId(side: "L" | "R", jNum: number, venc: "a" | "b"): string | undefined {
    const key = `adv-${side}-${jNum}-${venc}`;
    return animSpecs.find((s) => s.animId === key)?.animId;
  }

  // ─── Loser fade animation ─────────────────────────────────────────────────
  // When winner advances, loser fades to 0.3 opacity at same time
  const loserCSS = animSpecs.map((spec) => {
    const pStart = ((spec.delay) / cycleDuration * 100).toFixed(1);
    const pEnd   = ((spec.delay + 1.2) / cycleDuration * 100).toFixed(1);
    return `
@keyframes fade-${spec.animId} {
  0%, ${pStart}% { opacity: 1; }
  ${pEnd}%, 100% { opacity: 0.32; }
}`;
  }).join("\n");

  function getLoserAnimStyle(
    side: "L" | "R",
    jNum: number,
    venc: "a" | "b",
    isLoser: boolean,
  ): React.CSSProperties | undefined {
    if (!isLoser) return undefined;
    const key = `adv-${side}-${jNum}-${venc}`;
    const spec = animSpecs.find((s) => s.animId === key);
    if (!spec) return undefined;
    return { animation: `fade-${spec.animId} ${cycleDuration}s ease-in-out infinite` };
  }

  const fullCSS = animCSS + loserCSS;

  // ─── SVG render ───────────────────────────────────────────────────────────
  return (
    <div style={{ overflowX: "auto", width: "100%", WebkitOverflowScrolling: "touch" }}>
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H + 40}`}
        width={SVG_W}
        height={SVG_H + 40}
        preserveAspectRatio="xMidYMid meet"
        style={{
          display: "block",
          minWidth: SVG_W,
          background: "linear-gradient(135deg, #0a0e1a 0%, #111827 60%, #0d1520 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
        aria-label="Chaveamento da Copa do Mundo 2026"
      >
        {/* Embedded animation CSS */}
        <defs>
          <style>{fullCSS}</style>
        </defs>

        {/* ─── Phase labels ──────────────────────────────────────────────── */}
        {(
          [
            ["R32", LR32_X],
            ["Oitavas", LR16_X],
            ["Quartas", LQF_X],
            ["Semi", LSF_X],
          ] as [string, number][]
        ).map(([label, x]) => (
          <text
            key={label}
            x={x}
            y={22}
            textAnchor="middle"
            fontSize={12}
            fontWeight={700}
            letterSpacing={1.5}
            fill="rgba(255,255,255,0.35)"
            fontFamily="system-ui"
          >
            {label.toUpperCase()}
          </text>
        ))}
        <text
          x={CENTER_X}
          y={22}
          textAnchor="middle"
          fontSize={14}
          fontWeight={700}
          letterSpacing={2}
          fill="#FFD700"
          fontFamily="system-ui"
        >
          FINAL
        </text>
        {(
          [
            ["Semi", RSF_X],
            ["Quartas", RQF_X],
            ["Oitavas", RR16_X],
            ["R32", RR32_X],
          ] as [string, number][]
        ).map(([label, x]) => (
          <text
            key={label + "R"}
            x={x}
            y={22}
            textAnchor="middle"
            fontSize={12}
            fontWeight={700}
            letterSpacing={1.5}
            fill="rgba(255,255,255,0.35)"
            fontFamily="system-ui"
          >
            {label.toUpperCase()}
          </text>
        ))}

        {/* ─── LEFT SIDE: R32 ─────────────────────────────────────────────── */}
        {LEFT_R32.map((jNum, gi) => {
          const c = get(jNum);
          const ayc = teamAY(gi);
          const byc = teamBY(gi);
          const wonA = c.vencedor === "a";
          const wonB = c.vencedor === "b";
          const decided = c.vencedor !== null;
          const midY = gameMidY(gi);
          const trackSlot = wonA ? c.timeA : wonB ? c.timeB : null;
          const tColor = trackSlot ? trackColor(trackSlot) : "rgba(255,255,255,0.12)";

          const winnerAnimId = decided
            ? getAnimId("L", jNum, c.vencedor!)
            : undefined;

          return (
            <g key={`lr32-${jNum}`}>
              {/* Vertical bracket bar */}
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
                strokeWidth={
                  decided && trackSlot && isBrasil(trackSlot.nome) ? 3 : 1.5
                }
                strokeOpacity={decided ? 0.8 : 0.5}
              />
              {/* Team A — winner gets advance animation */}
              {renderTeamRow(
                c.timeA,
                LR32_X,
                ayc,
                FLAG_R32,
                !wonB && !c.timeA.eliminado,
                true,
                wonA ? winnerAnimId : undefined,
              )}
              {/* Team B — winner gets advance animation */}
              {renderTeamRow(
                c.timeB,
                LR32_X,
                byc,
                FLAG_R32,
                !wonA && !c.timeB.eliminado,
                true,
                wonB ? winnerAnimId : undefined,
              )}
              {/* Score badge */}
              {placarStr(c) && (
                <text
                  x={LR32_X + FLAG_R32 + 50}
                  y={midY + 5}
                  textAnchor="middle"
                  fontSize={11}
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

        {/* ─── LEFT SIDE: R16 ─────────────────────────────────────────────── */}
        {LEFT_R16.map((jNum, ri) => {
          const c = get(jNum);
          const cy = r16Y(ri);
          const wonA = c.vencedor === "a";
          const wonB = c.vencedor === "b";
          const decided = c.vencedor !== null;
          const teamA_cy = cy - FLAG_R16 - 4;
          const teamB_cy = cy + FLAG_R16 + 4;
          const g1 = ri * 2;
          const g2 = ri * 2 + 1;
          const r32ExitX = LR32_X + PHASE_W / 2;
          const r32MidY1 = gameMidY(g1);
          const r32MidY2 = gameMidY(g2);

          const winnerSlot = wonA ? c.timeA : wonB ? c.timeB : null;
          const tColor = winnerSlot ? trackColor(winnerSlot) : "rgba(255,255,255,0.12)";
          const trackW = winnerSlot && isBrasil(winnerSlot.nome) ? 3 : 1.5;

          return (
            <g key={`lr16-${jNum}`}>
              {/* R32→R16 connectors */}
              <path
                d={connR(r32ExitX, r32MidY1, LR16_X - FLAG_R16 - 8, teamA_cy)}
                fill="none"
                stroke="rgba(255,255,255,0.14)"
                strokeWidth={1.5}
              />
              <path
                d={connR(r32ExitX, r32MidY2, LR16_X - FLAG_R16 - 8, teamB_cy)}
                fill="none"
                stroke="rgba(255,255,255,0.14)"
                strokeWidth={1.5}
              />
              {/* Exit toward QF */}
              <line
                x1={LR16_X + FLAG_R16 + 8}
                y1={cy}
                x2={LR16_X + PHASE_W / 2}
                y2={cy}
                stroke={decided ? tColor : "rgba(255,255,255,0.12)"}
                strokeWidth={decided ? trackW : 1.5}
                strokeOpacity={0.75}
              />
              {/* Vertical bracket bar */}
              <line
                x1={LR16_X + FLAG_R16 + 5}
                y1={teamA_cy}
                x2={LR16_X + FLAG_R16 + 5}
                y2={teamB_cy}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth={1}
              />
              {renderTeamRow(c.timeA, LR16_X, teamA_cy, FLAG_R16, !wonB && !c.timeA.eliminado, true)}
              {renderTeamRow(c.timeB, LR16_X, teamB_cy, FLAG_R16, !wonA && !c.timeB.eliminado, true)}
              {placarStr(c) && (
                <text
                  x={LR16_X + FLAG_R16 + 60}
                  y={cy + 5}
                  textAnchor="middle"
                  fontSize={11}
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

        {/* ─── LEFT SIDE: QF ──────────────────────────────────────────────── */}
        {LEFT_QF.map((jNum, qi) => {
          const c = get(jNum);
          const cy = qfY(qi);
          const wonA = c.vencedor === "a";
          const wonB = c.vencedor === "b";
          const decided = c.vencedor !== null;
          const teamA_cy = cy - FLAG_QF - 5;
          const teamB_cy = cy + FLAG_QF + 5;
          const r16ExitX = LR16_X + PHASE_W / 2;

          const winnerSlot = wonA ? c.timeA : wonB ? c.timeB : null;
          const tColor = winnerSlot ? trackColor(winnerSlot) : "rgba(255,255,255,0.12)";
          const trackW = winnerSlot && isBrasil(winnerSlot.nome) ? 3.5 : 2;

          return (
            <g key={`lqf-${jNum}`}>
              <path
                d={connR(r16ExitX, r16Y(qi * 2), LQF_X - FLAG_QF - 8, teamA_cy)}
                fill="none"
                stroke="rgba(255,255,255,0.16)"
                strokeWidth={1.5}
              />
              <path
                d={connR(r16ExitX, r16Y(qi * 2 + 1), LQF_X - FLAG_QF - 8, teamB_cy)}
                fill="none"
                stroke="rgba(255,255,255,0.16)"
                strokeWidth={1.5}
              />
              <line
                x1={LQF_X + FLAG_QF + 8}
                y1={cy}
                x2={LQF_X + PHASE_W / 2}
                y2={cy}
                stroke={decided ? tColor : "rgba(255,255,255,0.12)"}
                strokeWidth={decided ? trackW : 1.5}
                strokeOpacity={0.75}
              />
              <line
                x1={LQF_X + FLAG_QF + 5}
                y1={teamA_cy}
                x2={LQF_X + FLAG_QF + 5}
                y2={teamB_cy}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth={1}
              />
              {renderTeamRow(c.timeA, LQF_X, teamA_cy, FLAG_QF, !wonB && !c.timeA.eliminado, true)}
              {renderTeamRow(c.timeB, LQF_X, teamB_cy, FLAG_QF, !wonA && !c.timeB.eliminado, true)}
              {placarStr(c) && (
                <text
                  x={LQF_X + FLAG_QF + 70}
                  y={cy + 5}
                  textAnchor="middle"
                  fontSize={11}
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

        {/* ─── LEFT SF (J101) ─────────────────────────────────────────────── */}
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
          const trackW = winnerSlot && isBrasil(winnerSlot.nome) ? 4 : 2;

          return (
            <g key="lsf">
              <path
                d={connR(qfExitX, qfY(0), LSF_X - FLAG_SF - 8, teamA_cy)}
                fill="none"
                stroke="rgba(255,255,255,0.18)"
                strokeWidth={1.5}
              />
              <path
                d={connR(qfExitX, qfY(1), LSF_X - FLAG_SF - 8, teamB_cy)}
                fill="none"
                stroke="rgba(255,255,255,0.18)"
                strokeWidth={1.5}
              />
              {/* SF → Final connector */}
              <line
                x1={LSF_X + FLAG_SF + 8}
                y1={cy}
                x2={CENTER_X - FLAG_F - 16}
                y2={cy}
                stroke={decided ? tColor : "rgba(255,255,255,0.12)"}
                strokeWidth={decided ? trackW : 1.5}
                strokeOpacity={0.75}
              />
              <line
                x1={LSF_X + FLAG_SF + 5}
                y1={teamA_cy}
                x2={LSF_X + FLAG_SF + 5}
                y2={teamB_cy}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth={1}
              />
              {renderTeamRow(c.timeA, LSF_X, teamA_cy, FLAG_SF, !wonB && !c.timeA.eliminado, true)}
              {renderTeamRow(c.timeB, LSF_X, teamB_cy, FLAG_SF, !wonA && !c.timeB.eliminado, true)}
              {placarStr(c) && (
                <text
                  x={LSF_X + FLAG_SF + 80}
                  y={cy + 5}
                  textAnchor="middle"
                  fontSize={12}
                  fill="#FFD700"
                  fontFamily="monospace"
                  opacity={0.9}
                >
                  {placarStr(c)}
                </text>
              )}
            </g>
          );
        })()}

        {/* ─── RIGHT SIDE: R32 ────────────────────────────────────────────── */}
        {RIGHT_R32.map((jNum, gi) => {
          const c = get(jNum);
          const ayc = teamAY(gi);
          const byc = teamBY(gi);
          const wonA = c.vencedor === "a";
          const wonB = c.vencedor === "b";
          const decided = c.vencedor !== null;
          const midY = gameMidY(gi);
          const trackSlot = wonA ? c.timeA : wonB ? c.timeB : null;
          const tColor = trackSlot ? trackColor(trackSlot) : "rgba(255,255,255,0.12)";

          const winnerAnimId = decided
            ? getAnimId("R", jNum, c.vencedor!)
            : undefined;

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
                strokeWidth={
                  decided && trackSlot && isBrasil(trackSlot.nome) ? 3 : 1.5
                }
                strokeOpacity={decided ? 0.8 : 0.5}
              />
              {renderTeamRow(
                c.timeA,
                RR32_X,
                ayc,
                FLAG_R32,
                !wonB && !c.timeA.eliminado,
                false,
                wonA ? winnerAnimId : undefined,
              )}
              {renderTeamRow(
                c.timeB,
                RR32_X,
                byc,
                FLAG_R32,
                !wonA && !c.timeB.eliminado,
                false,
                wonB ? winnerAnimId : undefined,
              )}
              {placarStr(c) && (
                <text
                  x={RR32_X - FLAG_R32 - 50}
                  y={midY + 5}
                  textAnchor="middle"
                  fontSize={11}
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

        {/* ─── RIGHT SIDE: R16 ────────────────────────────────────────────── */}
        {RIGHT_R16.map((jNum, ri) => {
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
          const trackW = winnerSlot && isBrasil(winnerSlot.nome) ? 3 : 1.5;

          return (
            <g key={`rr16-${jNum}`}>
              <path
                d={connL(r32ExitX, r32MidY1, RR16_X + FLAG_R16 + 8, teamA_cy)}
                fill="none"
                stroke="rgba(255,255,255,0.14)"
                strokeWidth={1.5}
              />
              <path
                d={connL(r32ExitX, r32MidY2, RR16_X + FLAG_R16 + 8, teamB_cy)}
                fill="none"
                stroke="rgba(255,255,255,0.14)"
                strokeWidth={1.5}
              />
              <line
                x1={RR16_X - FLAG_R16 - 8}
                y1={cy}
                x2={RR16_X - PHASE_W / 2}
                y2={cy}
                stroke={decided ? tColor : "rgba(255,255,255,0.12)"}
                strokeWidth={decided ? trackW : 1.5}
                strokeOpacity={0.75}
              />
              <line
                x1={RR16_X - FLAG_R16 - 5}
                y1={teamA_cy}
                x2={RR16_X - FLAG_R16 - 5}
                y2={teamB_cy}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth={1}
              />
              {renderTeamRow(c.timeA, RR16_X, teamA_cy, FLAG_R16, !wonB && !c.timeA.eliminado, false)}
              {renderTeamRow(c.timeB, RR16_X, teamB_cy, FLAG_R16, !wonA && !c.timeB.eliminado, false)}
              {placarStr(c) && (
                <text
                  x={RR16_X - FLAG_R16 - 60}
                  y={cy + 5}
                  textAnchor="middle"
                  fontSize={11}
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

        {/* ─── RIGHT SIDE: QF ─────────────────────────────────────────────── */}
        {RIGHT_QF.map((jNum, qi) => {
          const c = get(jNum);
          const cy = qfY(qi);
          const wonA = c.vencedor === "a";
          const wonB = c.vencedor === "b";
          const decided = c.vencedor !== null;
          const teamA_cy = cy - FLAG_QF - 5;
          const teamB_cy = cy + FLAG_QF + 5;
          const r16ExitX = RR16_X - PHASE_W / 2;
          const winnerSlot = wonA ? c.timeA : wonB ? c.timeB : null;
          const tColor = winnerSlot ? trackColor(winnerSlot) : "rgba(255,255,255,0.12)";
          const trackW = winnerSlot && isBrasil(winnerSlot.nome) ? 3.5 : 2;

          return (
            <g key={`rqf-${jNum}`}>
              <path
                d={connL(r16ExitX, r16Y(qi * 2), RQF_X + FLAG_QF + 8, teamA_cy)}
                fill="none"
                stroke="rgba(255,255,255,0.16)"
                strokeWidth={1.5}
              />
              <path
                d={connL(r16ExitX, r16Y(qi * 2 + 1), RQF_X + FLAG_QF + 8, teamB_cy)}
                fill="none"
                stroke="rgba(255,255,255,0.16)"
                strokeWidth={1.5}
              />
              <line
                x1={RQF_X - FLAG_QF - 8}
                y1={cy}
                x2={RQF_X - PHASE_W / 2}
                y2={cy}
                stroke={decided ? tColor : "rgba(255,255,255,0.12)"}
                strokeWidth={decided ? trackW : 1.5}
                strokeOpacity={0.75}
              />
              <line
                x1={RQF_X - FLAG_QF - 5}
                y1={teamA_cy}
                x2={RQF_X - FLAG_QF - 5}
                y2={teamB_cy}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth={1}
              />
              {renderTeamRow(c.timeA, RQF_X, teamA_cy, FLAG_QF, !wonB && !c.timeA.eliminado, false)}
              {renderTeamRow(c.timeB, RQF_X, teamB_cy, FLAG_QF, !wonA && !c.timeB.eliminado, false)}
              {placarStr(c) && (
                <text
                  x={RQF_X - FLAG_QF - 70}
                  y={cy + 5}
                  textAnchor="middle"
                  fontSize={11}
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

        {/* ─── RIGHT SF (J102) ────────────────────────────────────────────── */}
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
          const trackW = winnerSlot && isBrasil(winnerSlot.nome) ? 4 : 2;

          return (
            <g key="rsf">
              <path
                d={connL(qfExitX, qfY(0), RSF_X + FLAG_SF + 8, teamA_cy)}
                fill="none"
                stroke="rgba(255,255,255,0.18)"
                strokeWidth={1.5}
              />
              <path
                d={connL(qfExitX, qfY(1), RSF_X + FLAG_SF + 8, teamB_cy)}
                fill="none"
                stroke="rgba(255,255,255,0.18)"
                strokeWidth={1.5}
              />
              <line
                x1={RSF_X - FLAG_SF - 8}
                y1={cy}
                x2={CENTER_X + FLAG_F + 16}
                y2={cy}
                stroke={decided ? tColor : "rgba(255,255,255,0.12)"}
                strokeWidth={decided ? trackW : 1.5}
                strokeOpacity={0.75}
              />
              <line
                x1={RSF_X - FLAG_SF - 5}
                y1={teamA_cy}
                x2={RSF_X - FLAG_SF - 5}
                y2={teamB_cy}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth={1}
              />
              {renderTeamRow(c.timeA, RSF_X, teamA_cy, FLAG_SF, !wonB && !c.timeA.eliminado, false)}
              {renderTeamRow(c.timeB, RSF_X, teamB_cy, FLAG_SF, !wonA && !c.timeB.eliminado, false)}
              {placarStr(c) && (
                <text
                  x={RSF_X - FLAG_SF - 80}
                  y={cy + 5}
                  textAnchor="middle"
                  fontSize={12}
                  fill="#FFD700"
                  fontFamily="monospace"
                  opacity={0.9}
                >
                  {placarStr(c)}
                </text>
              )}
            </g>
          );
        })()}

        {/* ─── FINAL (J104) — CENTER TROPHY ───────────────────────────────── */}
        {(() => {
          const c = get(104);
          const cy = finalY;
          const wonA = c.vencedor === "a";
          const wonB = c.vencedor === "b";

          const TROPHY_SIZE = 110;
          const TROPHY_TOP = cy - TROPHY_SIZE * 0.6;

          const leftSlot = c.timeA;
          const rightSlot = c.timeB;

          return (
            <g key="final">
              {/* Glow aura */}
              <circle cx={CENTER_X} cy={cy} r={85} fill="none" stroke="#FFD700" strokeWidth={1} opacity={0.14} />
              <circle cx={CENTER_X} cy={cy} r={60} fill="rgba(255,215,0,0.04)" />
              {/* Trophy emoji */}
              <foreignObject
                x={CENTER_X - TROPHY_SIZE / 2}
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
                    filter: "drop-shadow(0 0 24px #FFD700AA)",
                  }}
                >
                  🏆
                </div>
              </foreignObject>
              {/* CAMPEÃO label */}
              <text
                x={CENTER_X}
                y={cy + 32}
                textAnchor="middle"
                fontSize={13}
                fontWeight={800}
                letterSpacing={3}
                fill="#FFD700"
                fontFamily="system-ui"
                opacity={0.7}
              >
                CAMPEÃO
              </text>
              {/* Left finalist flag */}
              {wonA &&
                (() => {
                  const clipId = `final-left-${leftSlot.iso ?? "unk"}`;
                  return (
                    <g>
                      <clipPath id={clipId}>
                        <circle cx={CENTER_X - 100} cy={cy} r={FLAG_F} />
                      </clipPath>
                      {leftSlot.iso && (
                        <image
                          href={`https://hatscripts.github.io/circle-flags/flags/${leftSlot.iso}.svg`}
                          x={CENTER_X - 100 - FLAG_F}
                          y={cy - FLAG_F}
                          width={FLAG_F * 2}
                          height={FLAG_F * 2}
                          clipPath={`url(#${clipId})`}
                          preserveAspectRatio="xMidYMid slice"
                        />
                      )}
                      <circle
                        cx={CENTER_X - 100}
                        cy={cy}
                        r={FLAG_F}
                        fill="none"
                        stroke="#FFD700"
                        strokeWidth={3.5}
                      />
                      <text
                        x={CENTER_X - 100}
                        y={cy + FLAG_F + 18}
                        textAnchor="middle"
                        fontSize={13}
                        fill="rgba(255,255,255,0.9)"
                        fontFamily="system-ui"
                        fontWeight={600}
                      >
                        {shortName(leftSlot.nome, 12)}
                      </text>
                    </g>
                  );
                })()}
              {/* Right finalist flag */}
              {wonB &&
                (() => {
                  const clipId = `final-right-${rightSlot.iso ?? "unk"}`;
                  return (
                    <g>
                      <clipPath id={clipId}>
                        <circle cx={CENTER_X + 100} cy={cy} r={FLAG_F} />
                      </clipPath>
                      {rightSlot.iso && (
                        <image
                          href={`https://hatscripts.github.io/circle-flags/flags/${rightSlot.iso}.svg`}
                          x={CENTER_X + 100 - FLAG_F}
                          y={cy - FLAG_F}
                          width={FLAG_F * 2}
                          height={FLAG_F * 2}
                          clipPath={`url(#${clipId})`}
                          preserveAspectRatio="xMidYMid slice"
                        />
                      )}
                      <circle
                        cx={CENTER_X + 100}
                        cy={cy}
                        r={FLAG_F}
                        fill="none"
                        stroke="#FFD700"
                        strokeWidth={3.5}
                      />
                      <text
                        x={CENTER_X + 100}
                        y={cy + FLAG_F + 18}
                        textAnchor="middle"
                        fontSize={13}
                        fill="rgba(255,255,255,0.9)"
                        fontFamily="system-ui"
                        fontWeight={600}
                      >
                        {shortName(rightSlot.nome, 12)}
                      </text>
                    </g>
                  );
                })()}
              {/* J104 label */}
              <text
                x={CENTER_X}
                y={cy - TROPHY_SIZE * 0.75}
                textAnchor="middle"
                fontSize={11}
                fill="rgba(255,215,0,0.5)"
                fontFamily="system-ui"
                letterSpacing={1}
              >
                J104 · FINAL
              </text>
            </g>
          );
        })()}

        {/* ─── 3RD PLACE (J103) ───────────────────────────────────────────── */}
        {(() => {
          const c = get(103);
          const cy = finalY + 140;
          return (
            <g key="third">
              <text
                x={CENTER_X}
                y={cy - 26}
                textAnchor="middle"
                fontSize={10}
                fill="rgba(255,255,255,0.25)"
                letterSpacing={1.5}
              >
                3º LUGAR · J103
              </text>
              {renderTeamRow(c.timeA, CENTER_X - 80, cy, FLAG_R32, false, true)}
              <text
                x={CENTER_X}
                y={cy + 5}
                textAnchor="middle"
                fontSize={13}
                fill="rgba(255,255,255,0.3)"
                fontFamily="monospace"
              >
                {placarStr(c) || "vs"}
              </text>
              {renderTeamRow(c.timeB, CENTER_X + 80, cy, FLAG_R32, false, false)}
            </g>
          );
        })()}
      </svg>
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
      {/* Compact header */}
      <div
        style={{
          padding: "28px 24px 20px",
          textAlign: "center",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <h1
          style={{
            fontSize: 26,
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
            marginTop: 6,
            letterSpacing: 1,
          }}
        >
          Copa do Mundo FIFA 2026 · Mata-mata ·{" "}
          <span lang="en">Knockout Stage</span> ·{" "}
          <span lang="es">Eliminatorias</span> ·{" "}
          <span lang="fr">Phase finale</span>
        </p>
      </div>

      {/* Full-width bracket */}
      <section style={{ padding: "32px 0 48px" }}>
        <VariacaoA bracket={bracket} />
      </section>
    </main>
  );
}
