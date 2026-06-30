/**
 * /chaveamento — Bracket de mata-mata com linhas finas e bolinhas animadas.
 * NÃO listada no nav, sem sitemap, com noindex.
 *
 * Workaround: J74 (Alemanha×Paraguai) e J75 (Países Baixos×Marrocos) terminaram
 * 1×1 em 90 min e foram decididos nos pênaltis. Como o schema não armazena
 * resultado de pênaltis, o avanço está hardcoded abaixo.
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

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Workaround pênaltis ─────────────────────────────────────────────────────
const PENALTY_WINNER: Record<number, "a" | "b"> = {
  74: "b", // Paraguai avança
  75: "b", // Marrocos avança
};

// ─── Country colors (primary color for ball animation) ───────────────────────
const COUNTRY_COLOR: Record<string, string> = {
  Brasil: "#009C3B",
  Argentina: "#74ACDF",
  França: "#0055A4",
  Alemanha: "#000000",
  Espanha: "#AA151B",
  Portugal: "#006600",
  Inglaterra: "#CF091B",
  Bélgica: "#EF3340",
  Países_Baixos: "#FF6600",
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
  Costa_do_Marfim: "#F77F00",
  "Costa do Marfim": "#F77F00",
  Croácia: "#FF0000",
  Senegal: "#00853F",
  Inglaterra_2: "#CF091B",
  "África do Sul": "#007A4D",
  Bósnia: "#002395",
  "Bósnia-Herzegovina": "#002395",
};

function teamColor(nome: string): string {
  return COUNTRY_COLOR[nome] ?? "#FFD700";
}

// ─── Data loading ─────────────────────────────────────────────────────────────

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

// ─── Bracket resolution ───────────────────────────────────────────────────────

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

function placar(c: Confronto): string {
  if (c.gols_a === null || c.gols_b === null) return "";
  if (PENALTY_WINNER[c.numero]) return `${c.gols_a}×${c.gols_b} pen.`;
  return `${c.gols_a}×${c.gols_b}`;
}

function fmtData(d: string): string {
  const [, m, dd] = d.split("-");
  return `${dd}/${m}`;
}

function shortName(nome: string, max = 11): string {
  if (nome.startsWith("Venc.") || nome.startsWith("Perd.")) return nome.replace(/^(Venc\.|Perd\.)\s*/, "?");
  if (nome.length <= max) return nome;
  // Known abbreviations
  const abbr: Record<string, string> = {
    "Países Baixos": "P. Baixos",
    "Costa do Marfim": "C. Marfim",
    "África do Sul": "África Sul",
    "Estados Unidos": "EUA",
    "Bósnia-Herzegovina": "Bósnia",
    "Nova Zelândia": "NZ",
    "Arábia Saudita": "A. Saudita",
    "Congo (RD)": "Congo RD",
    "República Tcheca": "R. Tcheca",
  };
  return abbr[nome] ?? nome.slice(0, max - 1) + "…";
}

// ─── SVG Bracket Layout ───────────────────────────────────────────────────────
// Layout horizontal clássico:
// Left side (J73-J80) → R16(J89,J90,J91,J92) → QF(J97,J99) → SF(J101) → Final(J104)
// Right side (J81-J88) → R16(J93,J94,J95,J96) → QF(J98,J100) → SF(J102) → Final
// 3rd place (J103) below final

// Column x positions
const COL_X = {
  leftR32: 10,
  leftR16: 220,
  leftQF: 400,
  leftSF: 565,
  final: 710,
  rightSF: 855,
  rightQF: 1010,
  rightR16: 1175,
  rightR32: 1370,
};

// Card dimensions
const CARD_W = 170;
const CARD_H = 52;
const CARD_PAD = 6;

// Row Y positions — 16 R32 slots total, split evenly top to bottom
// Left side top half: J73, J74 → J89; J75, J76 → J90... wait:
// J89 = W74+W77, J90 = W73+W75, J91 = W76+W78, J92 = W79+W80
// So left R32 ordered for tree: [J90-feeder: J73,J75], [J89-feeder: J74,J77], [J91-feeder: J76,J78], [J92-feeder: J79,J80]
// Visual top→bottom: J73,J74,J75,J76,J77,J78,J79,J80

// Total height: 8 cards per side. Let's space them evenly in 800px usable height.
// Each group of 2 cards → 1 R16 → group of 4 → 1 QF, etc.

// We'll compute Y positions for all cards based on their bracket position.

// viewBox: 1560 wide, 880 tall
const VB_W = 1570;
const VB_H = 900;

// Y positions for left R32 (8 games top-to-bottom, separated by 100px each, centered vertically)
const R32_Y_START = 30;
const R32_Y_STEP = 98;

// Compute center Y for each R32 slot
function r32Y(index: number): number {
  // index 0..7
  return R32_Y_START + index * R32_Y_STEP + CARD_H / 2;
}

// R16 is the midpoint of each pair of R32
// Left R32 pairing: (0,1)→J90, (2,3)→J89... wait, let me re-check structure:
// J89 = W74+W77 → R32 slots index 1 (J74) and 4 (J77)
// J90 = W73+W75 → R32 slots index 0 (J73) and 2 (J75)
// J91 = W76+W78 → R32 slots index 3 (J76) and 5 (J78)
// J92 = W79+W80 → R32 slots index 6 (J79) and 7 (J80)
// This is non-adjacent! For a clean bracket we need to reorder R32 so feeders are adjacent.
// Visually ordered for tree coherence:
// Top group → J90: J73 (slot 0), J75 (slot 1)
// Next group → J89: J74 (slot 2), J77 (slot 3)
// Next group → J91: J76 (slot 4), J78 (slot 5)
// Bottom group → J92: J79 (slot 6), J80 (slot 7)
// Then J97 = W89+W90 (midpoint of slots 0-3), J99 = W91+W92 (midpoint of slots 4-7)
// J101 = W97+W98 (top half midpoint)

const LEFT_R32_ORDER = [73, 75, 74, 77, 76, 78, 79, 80]; // visual order top→bottom
const LEFT_R16_ORDER = [90, 89, 91, 92]; // each feeds from pairs above
const LEFT_QF_ORDER = [97, 99]; // J97=W89+W90, J99=W91+W92
const LEFT_SF = 101;

const RIGHT_R32_ORDER = [81, 82, 83, 84, 85, 86, 87, 88]; // right side visual order
const RIGHT_R16_ORDER = [94, 93, 95, 96]; // J94=W81+W82, J93=W83+W84, J95=W86+W88, J96=W85+W87
const RIGHT_QF_ORDER = [98, 100]; // J98=W93+W94, J100=W95+W96
const RIGHT_SF = 102;

// Reorder right side for tree coherence:
// J94 = W81+W82 → slots 0,1
// J93 = W83+W84 → slots 2,3
// J95 = W86+W88 → slots 4,5... hmm spec says J95=W86+W88, J96=W85+W87
// J96 = W85+W87 → slots 6,7
// Then J98 = W93+W94, J100 = W95+W96
// Visually right R32 top→bottom: J81,J82 | J83,J84 | J86,J88 | J85,J87
const RIGHT_R32_VISUAL = [81, 82, 83, 84, 86, 88, 85, 87];

// Midpoint Y helpers
function midY(y1: number, y2: number): number {
  return (y1 + y2) / 2;
}

// Y center for each left R32 card
function leftR32CenterY(visualIndex: number): number {
  return r32Y(visualIndex);
}

// Y center for each left R16 card (midpoint of its two feeders)
function leftR16CenterY(r16Index: number): number {
  const a = leftR32CenterY(r16Index * 2);
  const b = leftR32CenterY(r16Index * 2 + 1);
  return midY(a, b);
}

// Y center for each left QF card
function leftQFCenterY(qfIndex: number): number {
  const a = leftR16CenterY(qfIndex * 2);
  const b = leftR16CenterY(qfIndex * 2 + 1);
  return midY(a, b);
}

// Y center for SF
function leftSFCenterY(): number {
  return midY(leftQFCenterY(0), leftQFCenterY(1));
}

function finalCenterY(): number {
  return midY(leftSFCenterY(), rightSFCenterY());
}

// Right side mirrors
function rightR32CenterY(visualIndex: number): number {
  return r32Y(visualIndex);
}
function rightR16CenterY(r16Index: number): number {
  return midY(rightR32CenterY(r16Index * 2), rightR32CenterY(r16Index * 2 + 1));
}
function rightQFCenterY(qfIndex: number): number {
  return midY(rightR16CenterY(qfIndex * 2), rightR16CenterY(qfIndex * 2 + 1));
}
function rightSFCenterY(): number {
  return midY(rightQFCenterY(0), rightQFCenterY(1));
}

// ─── SVG Path builders ────────────────────────────────────────────────────────

// L-shaped connector: from right edge of card at (x1,y1) to left edge of card at (x2,y2)
// Goes right → mid horizontal → up/down → right to destination
function connectorPath(x1: number, y1: number, x2: number, y2: number): string {
  const midX = (x1 + x2) / 2;
  return `M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`;
}

// ─── Live bracket SVG component ───────────────────────────────────────────────

// Build the winner path for each still-alive team: sequence of SVG path segments
// describing the motion trajectory from their R32 → current phase

type TeamPath = {
  nome: string;
  iso?: string;
  color: string;
  pathD: string;
  delay: number;
  duration: number;
};

function buildTeamPaths(bracket: Map<number, Confronto>): TeamPath[] {
  const get = (n: number) => bracket.get(n)!;
  const paths: TeamPath[] = [];
  let delayOffset = 0;

  // For each left R32 game, check if there's a decided winner
  // and build their path forward through the bracket
  // J97 = W89+W90, J98 = W93+W94, J101 = W97+W98
  // J99 = W91+W92, J100 = W95+W96, J102 = W99+W100
  const leftTreeFixed = [
    [LEFT_R32_ORDER[0], 90, 97, 101], // J73
    [LEFT_R32_ORDER[1], 90, 97, 101], // J75
    [LEFT_R32_ORDER[2], 89, 97, 101], // J74
    [LEFT_R32_ORDER[3], 89, 97, 101], // J77
    [LEFT_R32_ORDER[4], 91, 99, 102], // J76
    [LEFT_R32_ORDER[5], 91, 99, 102], // J78
    [LEFT_R32_ORDER[6], 92, 99, 102], // J79
    [LEFT_R32_ORDER[7], 92, 99, 102], // J80
  ];

  const rightTreeFixed = [
    [RIGHT_R32_VISUAL[0], 94, 98, 101], // J81
    [RIGHT_R32_VISUAL[1], 94, 98, 101], // J82
    [RIGHT_R32_VISUAL[2], 93, 98, 101], // J83
    [RIGHT_R32_VISUAL[3], 93, 98, 101], // J84
    [RIGHT_R32_VISUAL[4], 95, 100, 102], // J86
    [RIGHT_R32_VISUAL[5], 95, 100, 102], // J88
    [RIGHT_R32_VISUAL[6], 96, 100, 102], // J85
    [RIGHT_R32_VISUAL[7], 96, 100, 102], // J87
  ];

  // Left side paths
  for (let li = 0; li < leftTreeFixed.length; li++) {
    const [r32Num, r16Num, qfNum, sfNum] = leftTreeFixed[li];
    const r32 = get(r32Num);
    if (!r32.vencedor) continue;

    const winnerSlot = r32.vencedor === "a" ? r32.timeA : r32.timeB;
    if (!winnerSlot || winnerSlot.nome.startsWith("Venc.")) continue;

    // Build path segments
    const r32ViIdx = li;
    const r32CY = leftR32CenterY(r32ViIdx);
    const r32RightX = COL_X.leftR32 + CARD_W;

    const r16ViIdx = Math.floor(li / 2);
    const r16CY = leftR16CenterY(r16ViIdx);
    const r16LeftX = COL_X.leftR16;
    const r16RightX = COL_X.leftR16 + CARD_W;

    const qfViIdx = Math.floor(li / 4);
    const qfCY = leftQFCenterY(qfViIdx);
    const qfLeftX = COL_X.leftQF;
    const qfRightX = COL_X.leftQF + CARD_W;

    const sfCY = leftSFCenterY();
    const sfLeftX = COL_X.leftSF;
    const sfRightX = COL_X.leftSF + CARD_W;

    const finalCY = finalCenterY();
    const finalLeftX = COL_X.final;

    // Check how far this team has progressed
    const r16 = get(r16Num);
    const qf = get(qfNum);
    const sf = get(sfNum);
    const finalGame = get(104);

    // Determine last reached phase
    let segments: string[] = [];
    // Segment 1: R32 card center → mid-connector → R16 card left
    const mid1X = (r32RightX + r16LeftX) / 2;
    segments.push(`M ${r32RightX} ${r32CY} H ${mid1X} V ${r16CY} H ${r16LeftX}`);

    if (r16.vencedor) {
      // Check if this team won R16
      const r16Winner = r16.vencedor === "a" ? r16.timeA : r16.timeB;
      if (r16Winner.nome !== winnerSlot.nome) continue; // eliminated in R16

      const mid2X = (r16RightX + qfLeftX) / 2;
      segments.push(`M ${r16RightX} ${r16CY} H ${mid2X} V ${qfCY} H ${qfLeftX}`);

      if (qf.vencedor) {
        const qfWinner = qf.vencedor === "a" ? qf.timeA : qf.timeB;
        if (qfWinner.nome !== winnerSlot.nome) {
          // Only show path to R16 exit
          segments = segments.slice(0, 1);
        } else {
          const mid3X = (qfRightX + sfLeftX) / 2;
          segments.push(`M ${qfRightX} ${qfCY} H ${mid3X} V ${sfCY} H ${sfLeftX}`);

          if (sf.vencedor) {
            const sfWinner = sf.vencedor === "a" ? sf.timeA : sf.timeB;
            if (sfWinner.nome !== winnerSlot.nome) {
              segments = segments.slice(0, 3);
            } else {
              const mid4X = (sfRightX + finalLeftX) / 2;
              segments.push(`M ${sfRightX} ${sfCY} H ${mid4X} V ${finalCY} H ${finalLeftX}`);

              if (finalGame.vencedor) {
                const fWinner = finalGame.vencedor === "a" ? finalGame.timeA : finalGame.timeB;
                if (fWinner.nome === winnerSlot.nome) {
                  segments.push(`M ${finalLeftX + CARD_W / 2} ${finalCY} L ${finalLeftX + CARD_W / 2} ${finalCY}`);
                }
              }
            }
          }
        }
      }
    }

    // Join all segments — animateMotion will trace through
    const fullPath = segments.join(" ");

    paths.push({
      nome: winnerSlot.nome,
      iso: winnerSlot.iso,
      color: teamColor(winnerSlot.nome),
      pathD: fullPath,
      delay: delayOffset,
      duration: 4 + segments.length * 2,
    });
    delayOffset += 0.8;
  }

  // Right side paths (mirror: cards grow from right to left visually, but path goes left)
  for (let ri = 0; ri < rightTreeFixed.length; ri++) {
    const [r32Num, r16Num, qfNum, sfNum] = rightTreeFixed[ri];
    const r32 = get(r32Num);
    if (!r32.vencedor) continue;

    const winnerSlot = r32.vencedor === "a" ? r32.timeA : r32.timeB;
    if (!winnerSlot || winnerSlot.nome.startsWith("Venc.")) continue;

    const r32ViIdx = ri;
    const r32CY = rightR32CenterY(r32ViIdx);
    const r32LeftX = COL_X.rightR32; // left edge of right R32 column (cards go right→left)

    const r16ViIdx = Math.floor(ri / 2);
    const r16CY = rightR16CenterY(r16ViIdx);
    const r16RightX = COL_X.rightR16 + CARD_W;

    const qfViIdx = Math.floor(ri / 4);
    const qfCY = rightQFCenterY(qfViIdx);
    const qfRightX = COL_X.rightQF + CARD_W;

    const sfCY = rightSFCenterY();
    const sfRightX = COL_X.rightSF + CARD_W;

    const finalCY = finalCenterY();
    const finalRightX = COL_X.final + CARD_W;

    const r16 = get(r16Num);
    const qf = get(qfNum);
    const sf = get(sfNum);
    const finalGame = get(104);

    let segments: string[] = [];
    const mid1X = (r32LeftX + r16RightX) / 2;
    segments.push(`M ${r32LeftX} ${r32CY} H ${mid1X} V ${r16CY} H ${r16RightX}`);

    if (r16.vencedor) {
      const r16Winner = r16.vencedor === "a" ? r16.timeA : r16.timeB;
      if (r16Winner.nome !== winnerSlot.nome) continue;

      const mid2X = (qfRightX + r16RightX) / 2; // right side goes right-to-left
      // Actually right side: R32 left edge → R16 right edge → QF right edge → SF right edge → final right edge
      // Wait: right side cards are right-aligned, so connector goes leftward
      // R32 (rightmost) left edge connects to R16 right edge (one step left), etc.
      const mid2Xr = (COL_X.rightR16 + COL_X.rightQF + CARD_W) / 2;
      segments.push(`M ${COL_X.rightR16} ${r16CY} H ${mid2Xr} V ${qfCY} H ${qfRightX}`);

      if (qf.vencedor) {
        const qfWinner = qf.vencedor === "a" ? qf.timeA : qf.timeB;
        if (qfWinner.nome !== winnerSlot.nome) {
          segments = segments.slice(0, 1);
        } else {
          const mid3X = (COL_X.rightQF + COL_X.rightSF + CARD_W) / 2;
          segments.push(`M ${COL_X.rightQF} ${qfCY} H ${mid3X} V ${sfCY} H ${sfRightX}`);

          if (sf.vencedor) {
            const sfWinner = sf.vencedor === "a" ? sf.timeA : sf.timeB;
            if (sfWinner.nome !== winnerSlot.nome) {
              segments = segments.slice(0, 3);
            } else {
              const mid4X = (COL_X.rightSF + finalRightX) / 2;
              segments.push(`M ${COL_X.rightSF} ${sfCY} H ${mid4X} V ${finalCY} H ${finalRightX}`);
            }
          }
        }
      }
    }

    const fullPath = segments.join(" ");

    paths.push({
      nome: winnerSlot.nome,
      iso: winnerSlot.iso,
      color: teamColor(winnerSlot.nome),
      pathD: fullPath,
      delay: delayOffset,
      duration: 4 + segments.length * 2,
    });
    delayOffset += 0.8;
  }

  return paths;
}

// ─── Card SVG nodes ───────────────────────────────────────────────────────────

function CardSVG({
  c,
  x,
  y,
  isBrasil = false,
}: {
  c: Confronto;
  x: number;
  y: number; // center Y
  isBrasil?: boolean;
}) {
  const cardY = y - CARD_H / 2;
  const pl = placar(c);
  const isPlayed = pl !== "";
  const borderColor = isPlayed
    ? isBrasil
      ? "#009C3B"
      : "rgba(255,255,255,0.35)"
    : "rgba(255,255,255,0.12)";
  const bgColor = isPlayed
    ? isBrasil
      ? "rgba(0,156,59,0.12)"
      : "rgba(255,255,255,0.06)"
    : "rgba(255,255,255,0.03)";

  return (
    <g>
      {/* Card background */}
      <rect
        x={x}
        y={cardY}
        width={CARD_W}
        height={CARD_H}
        rx={6}
        fill={bgColor}
        stroke={borderColor}
        strokeWidth={isBrasil ? 1.5 : 1}
      />
      {isBrasil && isPlayed && (
        <rect
          x={x}
          y={cardY}
          width={3}
          height={CARD_H}
          rx={3}
          fill="#009C3B"
        />
      )}
      {/* Game number + date */}
      <text
        x={x + CARD_PAD}
        y={cardY + 12}
        fontSize={8}
        fontFamily="JetBrains Mono, monospace"
        fill="rgba(255,255,255,0.35)"
        letterSpacing="0.06em"
      >
        J{c.numero} · {fmtData(c.data)}
      </text>
      {/* Time A row */}
      <text
        x={x + CARD_PAD}
        y={cardY + 26}
        fontSize={11}
        fontFamily="Outfit, system-ui, sans-serif"
        fill={
          c.vencedor === "a"
            ? "#FFD700"
            : c.vencedor === "b"
            ? "rgba(255,255,255,0.35)"
            : "rgba(255,255,255,0.85)"
        }
        fontWeight={c.vencedor === "a" ? "700" : "400"}
        opacity={c.timeA.eliminado ? 0.35 : 1}
      >
        {shortName(c.timeA.nome)}
      </text>
      {c.gols_a !== null && (
        <text
          x={x + CARD_W - CARD_PAD}
          y={cardY + 26}
          fontSize={12}
          fontFamily="Fraunces, Georgia, serif"
          fill={c.vencedor === "a" ? "#FFD700" : "rgba(255,255,255,0.4)"}
          fontWeight="800"
          textAnchor="end"
        >
          {c.gols_a}
        </text>
      )}
      {/* Time B row */}
      <text
        x={x + CARD_PAD}
        y={cardY + 42}
        fontSize={11}
        fontFamily="Outfit, system-ui, sans-serif"
        fill={
          c.vencedor === "b"
            ? "#FFD700"
            : c.vencedor === "a"
            ? "rgba(255,255,255,0.35)"
            : "rgba(255,255,255,0.85)"
        }
        fontWeight={c.vencedor === "b" ? "700" : "400"}
        opacity={c.timeB.eliminado ? 0.35 : 1}
      >
        {shortName(c.timeB.nome)}
      </text>
      {c.gols_b !== null && (
        <text
          x={x + CARD_W - CARD_PAD}
          y={cardY + 42}
          fontSize={12}
          fontFamily="Fraunces, Georgia, serif"
          fill={c.vencedor === "b" ? "#FFD700" : "rgba(255,255,255,0.4)"}
          fontWeight="800"
          textAnchor="end"
        >
          {c.gols_b}
        </text>
      )}
      {/* Divider */}
      <line
        x1={x + CARD_PAD}
        y1={cardY + CARD_H / 2}
        x2={x + CARD_W - CARD_PAD}
        y2={cardY + CARD_H / 2}
        stroke="rgba(255,255,255,0.07)"
        strokeWidth={1}
      />
    </g>
  );
}

// ─── Connector lines SVG ──────────────────────────────────────────────────────

function ConnectorLine({
  x1, y1, x2, y2,
  highlight = false,
}: {
  x1: number; y1: number; x2: number; y2: number;
  highlight?: boolean;
}) {
  const midX = (x1 + x2) / 2;
  const d = `M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`;
  return (
    <path
      d={d}
      fill="none"
      stroke={highlight ? "rgba(0,156,59,0.55)" : "rgba(255,255,255,0.15)"}
      strokeWidth={highlight ? 2 : 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

// ─── Animated ball ────────────────────────────────────────────────────────────

function AnimatedBall({
  pathId,
  color,
  delay,
  duration,
}: {
  pathId: string;
  color: string;
  delay: number;
  duration: number;
}) {
  return (
    <g>
      {/* Glow */}
      <circle r={7} fill={color} opacity={0.25}>
        <animateMotion
          dur={`${duration}s`}
          repeatCount="indefinite"
          begin={`${delay}s`}
          rotate="auto"
        >
          <mpath xlinkHref={`#${pathId}`} />
        </animateMotion>
      </circle>
      {/* Ball body */}
      <circle r={4.5} fill={color} stroke="rgba(255,255,255,0.6)" strokeWidth={1}>
        <animateMotion
          dur={`${duration}s`}
          repeatCount="indefinite"
          begin={`${delay}s`}
          rotate="auto"
        >
          <mpath xlinkHref={`#${pathId}`} />
        </animateMotion>
      </circle>
    </g>
  );
}

// ─── Main bracket SVG ─────────────────────────────────────────────────────────

function BracketSVG({ bracket }: { bracket: Map<number, Confronto> }) {
  const get = (n: number) => bracket.get(n)!;
  const teamPaths = buildTeamPaths(bracket);

  // Check if Brasil is in any game
  const brasilJogos = [73, 74, 75, 76, 77, 78, 79, 80].map(get);
  const brasilR32 = brasilJogos.find(
    (c) => c.timeA.nome === "Brasil" || c.timeB.nome === "Brasil"
  );

  // Final Y
  const finY = finalCenterY();
  const sfLY = leftSFCenterY();
  const sfRY = rightSFCenterY();

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      style={{ width: "100%", minWidth: 1100, height: "auto" }}
      aria-label="Chaveamento mata-mata Copa 2026"
      role="img"
    >
      <defs>
        {/* Define paths for ball animation */}
        {teamPaths.map((tp, i) => (
          <path key={i} id={`ballpath-${i}`} d={tp.pathD} fill="none" stroke="none" />
        ))}
        {/* Glow filter */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glowStrong" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Dark background */}
      <rect width={VB_W} height={VB_H} fill="#080C18" rx={12} />

      {/* Subtle grid */}
      <defs>
        <pattern id="grid" width={40} height={40} patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth={1} />
        </pattern>
      </defs>
      <rect width={VB_W} height={VB_H} fill="url(#grid)" rx={12} />

      {/* Phase column labels */}
      {[
        { label: "R32", x: COL_X.leftR32 + CARD_W / 2 },
        { label: "Oitavas", x: COL_X.leftR16 + CARD_W / 2 },
        { label: "Quartas", x: COL_X.leftQF + CARD_W / 2 },
        { label: "Semi", x: COL_X.leftSF + CARD_W / 2 },
        { label: "Final", x: COL_X.final + CARD_W / 2 },
        { label: "Semi", x: COL_X.rightSF + CARD_W / 2 },
        { label: "Quartas", x: COL_X.rightQF + CARD_W / 2 },
        { label: "Oitavas", x: COL_X.rightR16 + CARD_W / 2 },
        { label: "R32", x: COL_X.rightR32 + CARD_W / 2 },
      ].map(({ label, x }) => (
        <text
          key={x}
          x={x}
          y={14}
          fontSize={9}
          fontFamily="JetBrains Mono, monospace"
          fill="rgba(255,255,255,0.25)"
          textAnchor="middle"
          letterSpacing="0.1em"
        >
          {label.toUpperCase()}
        </text>
      ))}

      {/* ── LEFT CONNECTOR LINES ── */}
      {/* R32 → R16 */}
      {[0, 1, 2, 3].map((r16Idx) => {
        const r16Num = LEFT_R16_ORDER[r16Idx];
        const r16CY = leftR16CenterY(r16Idx);
        const r16LX = COL_X.leftR16;
        return [0, 1].map((pairIdx) => {
          const r32Idx = r16Idx * 2 + pairIdx;
          const r32CY = leftR32CenterY(r32Idx);
          const r32RX = COL_X.leftR32 + CARD_W;
          const isBrasil =
            get(LEFT_R32_ORDER[r32Idx]).timeA.nome === "Brasil" ||
            get(LEFT_R32_ORDER[r32Idx]).timeB.nome === "Brasil";
          return (
            <ConnectorLine
              key={`lr32-${r16Idx}-${pairIdx}`}
              x1={r32RX}
              y1={r32CY}
              x2={r16LX}
              y2={r16CY}
              highlight={isBrasil}
            />
          );
        });
      })}
      {/* R16 → QF */}
      {[0, 1].map((qfIdx) => {
        const qfCY = leftQFCenterY(qfIdx);
        const qfLX = COL_X.leftQF;
        return [0, 1].map((pairIdx) => {
          const r16Idx = qfIdx * 2 + pairIdx;
          const r16CY = leftR16CenterY(r16Idx);
          const r16RX = COL_X.leftR16 + CARD_W;
          return (
            <ConnectorLine
              key={`lr16-${qfIdx}-${pairIdx}`}
              x1={r16RX}
              y1={r16CY}
              x2={qfLX}
              y2={qfCY}
            />
          );
        });
      })}
      {/* QF → SF */}
      {[0, 1].map((qfIdx) => {
        const qfCY = leftQFCenterY(qfIdx);
        const qfRX = COL_X.leftQF + CARD_W;
        const sfLX = COL_X.leftSF;
        return (
          <ConnectorLine
            key={`lqf-${qfIdx}`}
            x1={qfRX}
            y1={qfCY}
            x2={sfLX}
            y2={sfLY}
          />
        );
      })}
      {/* SF → Final */}
      <ConnectorLine
        x1={COL_X.leftSF + CARD_W}
        y1={sfLY}
        x2={COL_X.final}
        y2={finY}
      />

      {/* ── RIGHT CONNECTOR LINES ── */}
      {/* R32 → R16 */}
      {[0, 1, 2, 3].map((r16Idx) => {
        const r16CY = rightR16CenterY(r16Idx);
        const r16RX = COL_X.rightR16 + CARD_W;
        return [0, 1].map((pairIdx) => {
          const r32Idx = r16Idx * 2 + pairIdx;
          const r32CY = rightR32CenterY(r32Idx);
          const r32LX = COL_X.rightR32;
          return (
            <ConnectorLine
              key={`rr32-${r16Idx}-${pairIdx}`}
              x1={r32LX}
              y1={r32CY}
              x2={r16RX}
              y2={r16CY}
            />
          );
        });
      })}
      {/* R16 → QF */}
      {[0, 1].map((qfIdx) => {
        const qfCY = rightQFCenterY(qfIdx);
        const qfRX = COL_X.rightQF + CARD_W;
        return [0, 1].map((pairIdx) => {
          const r16Idx = qfIdx * 2 + pairIdx;
          const r16CY = rightR16CenterY(r16Idx);
          const r16LX = COL_X.rightR16;
          return (
            <ConnectorLine
              key={`rr16-${qfIdx}-${pairIdx}`}
              x1={r16LX}
              y1={r16CY}
              x2={qfRX}
              y2={qfCY}
            />
          );
        });
      })}
      {/* QF → SF */}
      {[0, 1].map((qfIdx) => {
        const qfCY = rightQFCenterY(qfIdx);
        const qfLX = COL_X.rightQF;
        return (
          <ConnectorLine
            key={`rqf-${qfIdx}`}
            x1={qfLX}
            y1={qfCY}
            x2={COL_X.rightSF + CARD_W}
            y2={sfRY}
          />
        );
      })}
      {/* SF → Final */}
      <ConnectorLine
        x1={COL_X.rightSF}
        y1={sfRY}
        x2={COL_X.final + CARD_W}
        y2={finY}
      />

      {/* ── LEFT R32 CARDS ── */}
      {LEFT_R32_ORDER.map((num, i) => {
        const c = get(num);
        const isBrasil = c.timeA.nome === "Brasil" || c.timeB.nome === "Brasil";
        return (
          <CardSVG
            key={num}
            c={c}
            x={COL_X.leftR32}
            y={leftR32CenterY(i)}
            isBrasil={isBrasil}
          />
        );
      })}

      {/* ── LEFT R16 CARDS ── */}
      {LEFT_R16_ORDER.map((num, i) => (
        <CardSVG
          key={num}
          c={get(num)}
          x={COL_X.leftR16}
          y={leftR16CenterY(i)}
        />
      ))}

      {/* ── LEFT QF CARDS ── */}
      {LEFT_QF_ORDER.map((num, i) => (
        <CardSVG
          key={num}
          c={get(num)}
          x={COL_X.leftQF}
          y={leftQFCenterY(i)}
        />
      ))}

      {/* ── LEFT SF CARD ── */}
      <CardSVG c={get(LEFT_SF)} x={COL_X.leftSF} y={sfLY} />

      {/* ── FINAL CARD (center) ── */}
      <g>
        {/* Trophy glow */}
        <circle
          cx={COL_X.final + CARD_W / 2}
          cy={finY}
          r={CARD_H * 0.9}
          fill="rgba(255,215,0,0.04)"
          filter="url(#glowStrong)"
        />
        <rect
          x={COL_X.final}
          y={finY - CARD_H / 2 - 6}
          width={CARD_W}
          height={CARD_H + 12}
          rx={8}
          fill="rgba(255,215,0,0.08)"
          stroke="rgba(255,215,0,0.5)"
          strokeWidth={1.5}
        />
        <text
          x={COL_X.final + CARD_W / 2}
          y={finY - CARD_H / 2 + 2}
          fontSize={9}
          fontFamily="JetBrains Mono, monospace"
          fill="rgba(255,215,0,0.6)"
          textAnchor="middle"
          letterSpacing="0.12em"
        >
          FINAL · J104 · 19/07
        </text>
        {/* Teams in final */}
        {[
          { slot: get(104).timeA, gols: get(104).gols_a, win: get(104).vencedor === "a" },
          { slot: get(104).timeB, gols: get(104).gols_b, win: get(104).vencedor === "b" },
        ].map(({ slot, gols, win }, i) => (
          <g key={i}>
            <text
              x={COL_X.final + CARD_PAD + 2}
              y={finY - 8 + i * 24}
              fontSize={12}
              fontFamily="Outfit, system-ui, sans-serif"
              fill={win ? "#FFD700" : "rgba(255,255,255,0.75)"}
              fontWeight={win ? "700" : "400"}
              opacity={slot.eliminado ? 0.35 : 1}
            >
              {slot.nome.startsWith("Venc.") ? "—" : shortName(slot.nome)}
            </text>
            {gols !== null && (
              <text
                x={COL_X.final + CARD_W - CARD_PAD}
                y={finY - 8 + i * 24}
                fontSize={14}
                fontFamily="Fraunces, Georgia, serif"
                fill={win ? "#FFD700" : "rgba(255,255,255,0.4)"}
                fontWeight="800"
                textAnchor="end"
              >
                {gols}
              </text>
            )}
          </g>
        ))}
        {/* Trophy icon */}
        <text
          x={COL_X.final + CARD_W / 2}
          y={finY + CARD_H / 2 + 14}
          fontSize={20}
          textAnchor="middle"
        >
          🏆
        </text>
      </g>

      {/* ── 3RD PLACE CARD ── */}
      <g>
        <text
          x={COL_X.final + CARD_W / 2}
          y={finY + CARD_H / 2 + 52}
          fontSize={8}
          fontFamily="JetBrains Mono, monospace"
          fill="rgba(255,255,255,0.2)"
          textAnchor="middle"
          letterSpacing="0.1em"
        >
          3° LUGAR · J103 · 18/07
        </text>
        <CardSVG
          c={get(103)}
          x={COL_X.final}
          y={finY + CARD_H / 2 + 78}
        />
      </g>

      {/* ── RIGHT SF CARD ── */}
      <CardSVG c={get(RIGHT_SF)} x={COL_X.rightSF} y={sfRY} />

      {/* ── RIGHT QF CARDS ── */}
      {RIGHT_QF_ORDER.map((num, i) => (
        <CardSVG
          key={num}
          c={get(num)}
          x={COL_X.rightQF}
          y={rightQFCenterY(i)}
        />
      ))}

      {/* ── RIGHT R16 CARDS ── */}
      {RIGHT_R16_ORDER.map((num, i) => (
        <CardSVG
          key={num}
          c={get(num)}
          x={COL_X.rightR16}
          y={rightR16CenterY(i)}
        />
      ))}

      {/* ── RIGHT R32 CARDS ── */}
      {RIGHT_R32_VISUAL.map((num, i) => (
        <CardSVG
          key={num}
          c={get(num)}
          x={COL_X.rightR32}
          y={rightR32CenterY(i)}
        />
      ))}

      {/* ── ANIMATED BALLS ── */}
      {teamPaths.map((tp, i) => (
        <AnimatedBall
          key={i}
          pathId={`ballpath-${i}`}
          color={tp.color}
          delay={tp.delay}
          duration={tp.duration}
        />
      ))}
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

  return (
    <div style={{ marginTop: 24, marginBottom: 80 }}>
      {/* Header */}
      <header style={{ textAlign: "center", marginBottom: 28 }}>
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
            maxWidth: 600,
            margin: "0 auto 8px",
            lineHeight: 1.5,
          }}
        >
          PT: As bolinhas seguem a jornada de cada seleção até onde chegaram.{" "}
          EN: The balls trace each team&apos;s journey as far as they advanced.{" "}
          ES: Las bolitas siguen el camino de cada selección hasta donde llegaron.{" "}
          FR: Les balles suivent le parcours de chaque équipe jusqu&apos;où elle est allée.
        </p>
        <div
          style={{
            marginTop: 8,
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
      </header>

      {/* SVG Bracket */}
      <div
        style={{
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          borderRadius: 12,
        }}
      >
        <BracketSVG bracket={bracket} />
      </div>

      {/* Legend */}
      <div
        style={{
          marginTop: 20,
          display: "flex",
          gap: 20,
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <svg width={16} height={16} viewBox="0 0 16 16">
            <circle cx={8} cy={8} r={5} fill="#009C3B" stroke="rgba(255,255,255,0.5)" strokeWidth={1} />
          </svg>
          <span style={{ fontSize: 11, fontFamily: "var(--ff-mono)", color: "var(--fg-muted)" }}>
            Brasil (destaque verde)
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <svg width={24} height={4} viewBox="0 0 24 4">
            <line x1={0} y1={2} x2={24} y2={2} stroke="rgba(255,255,255,0.15)" strokeWidth={1.5} />
          </svg>
          <span style={{ fontSize: 11, fontFamily: "var(--ff-mono)", color: "var(--fg-muted)" }}>
            Linhas de chaveamento
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <svg width={16} height={16} viewBox="0 0 16 16">
            <circle cx={8} cy={8} r={4} fill="#FFD700" opacity={0.25} />
            <circle cx={8} cy={8} r={4} fill="#FFD700" stroke="rgba(255,255,255,0.6)" strokeWidth={1} />
          </svg>
          <span style={{ fontSize: 11, fontFamily: "var(--ff-mono)", color: "var(--fg-muted)" }}>
            Bolinha = seleção viva, cor da bandeira
          </span>
        </div>
      </div>

      {/* Footer */}
      <footer
        style={{
          textAlign: "center",
          marginTop: 32,
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
