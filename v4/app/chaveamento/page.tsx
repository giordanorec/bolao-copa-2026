/**
 * /chaveamento — Bracket mata-mata Copa 2026.
 * Variação A: horizontal clássico FIFA, esquerda → centro ← direita.
 * Linhas em ângulo reto (90°), taça central, vencedores avançam animados.
 *
 * Estado inicial: só R32. Vencedores reais animam para R16.
 * Toggle client-side: "Sem sobreposição" (default) / "Com sobreposição".
 *
 * NÃO listada no nav, sem sitemap, com noindex.
 */

import { promises as fs } from "fs";
import path from "path";
import { carregarJogos } from "@/lib/jogos";
import { carregarMapaPaises } from "@/lib/paises";
import type { Jogo } from "@/lib/types";
import BracketClient, {
  type Confronto,
  type SlotTime,
} from "@/components/chaveamento/BracketClient";

export const metadata = {
  robots: { index: false, follow: false },
  title: "Chaveamento · Bolão das IAs",
};

// ─── Types ─────────────────────────────────────────────────────────────────────

type Resultado = { jogo_numero: number; gols_a: number; gols_b: number };

// ─── Pênaltis hardcoded (resultado regular: empate, avanço por pênaltis) ───────

const PENALTY_WINNER: Record<number, "a" | "b"> = {
  74: "b", // Paraguai avança sobre Alemanha
  75: "b", // Marrocos avança sobre Países Baixos (Holanda)
};

// ─── Data loading ───────────────────────────────────────────────────────────────

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

// ─── Bracket builder ────────────────────────────────────────────────────────────

function resolverVencedor(
  jogo: Jogo,
  resultado: Resultado | undefined,
): "a" | "b" | null {
  // Pênaltis override: se resultado existe (mesmo empatado), aplica o PENALTY_WINNER
  if (PENALTY_WINNER[jogo.numero] !== undefined) {
    if (resultado !== undefined) return PENALTY_WINNER[jogo.numero];
    return null;
  }
  if (!resultado) return null;
  const { gols_a, gols_b } = resultado;
  if (gols_a > gols_b) return "a";
  if (gols_b > gols_a) return "b";
  return null;
}

function resolverSlot(nome: string, mapaPaises: Record<string, string>): SlotTime {
  if (!nome || nome.startsWith("Venc.") || nome.startsWith("Perd.")) {
    return { nome };
  }
  return { nome, iso: mapaPaises[nome] };
}

function buildConfrontos(
  jogos: Jogo[],
  resultados: Map<number, Resultado>,
  mapaPaises: Record<string, string>,
  jogoNums: number[],
): Confronto[] {
  return jogoNums.map((n) => {
    const jogo = jogos.find((j) => j.numero === n);
    if (!jogo) {
      return {
        numero: n,
        timeA: { nome: "?" },
        timeB: { nome: "?" },
        gols_a: null,
        gols_b: null,
        vencedor: null,
        hasPenaltyNote: false,
        data: "9999-12-31",
        hora: "00:00",
      };
    }
    const resultado = resultados.get(n);
    const vencedor = resolverVencedor(jogo, resultado);
    const slotA = resolverSlot(jogo.time_a, mapaPaises);
    const slotB = resolverSlot(jogo.time_b, mapaPaises);

    return {
      numero: n,
      timeA: vencedor === "b" ? { ...slotA, eliminado: true } : slotA,
      timeB: vencedor === "a" ? { ...slotB, eliminado: true } : slotB,
      gols_a: resultado?.gols_a ?? null,
      gols_b: resultado?.gols_b ?? null,
      vencedor,
      hasPenaltyNote: PENALTY_WINNER[n] !== undefined && resultado !== undefined,
      data: jogo.data,
      hora: jogo.hora,
    };
  });
}

// ─── Bracket ordering ────────────────────────────────────────────────────────────
//
// LEFT side (feeds SF101 via J97+J98):
//   Top quarter (feeds J97 via J89+J90):
//     Pair 0 → R16 J89: J74 (top), J77 (bottom)
//     Pair 1 → R16 J90: J73 (top), J75 (bottom)
//   Bottom quarter (feeds J98 via J93+J94):
//     Pair 2 → R16 J93: J83 (top), J84 (bottom)
//     Pair 3 → R16 J94: J81 (top), J82 (bottom)
//
// RIGHT side (feeds SF102 via J99+J100):
//   Top quarter (feeds J99 via J91+J92):
//     Pair 0 → R16 J91: J76 (top), J78 (bottom)
//     Pair 1 → R16 J92: J79 (top), J80 (bottom)
//   Bottom quarter (feeds J100 via J95+J96):
//     Pair 2 → R16 J95: J86 (top), J88 (bottom)
//     Pair 3 → R16 J96: J85 (top), J87 (bottom)
//
// Ordering: gi=0→J74, gi=1→J77, gi=2→J73, gi=3→J75, gi=4→J83, gi=5→J84, gi=6→J81, gi=7→J82
// gi%2===0 = top of pair → feeds R16 teamA slot
// gi%2===1 = bottom of pair → feeds R16 teamB slot

const LEFT_R32_NUMS = [74, 77, 73, 75, 83, 84, 81, 82];
const RIGHT_R32_NUMS = [76, 78, 79, 80, 86, 88, 85, 87];

// ─── Page ────────────────────────────────────────────────────────────────────────

export default async function ChaveamentoPage() {
  const [jogos, resultados, mapaPaises] = await Promise.all([
    carregarJogos(),
    carregarResultados(),
    carregarMapaPaises(),
  ]);

  const leftR32 = buildConfrontos(jogos, resultados, mapaPaises, LEFT_R32_NUMS);
  const rightR32 = buildConfrontos(jogos, resultados, mapaPaises, RIGHT_R32_NUMS);

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
          padding: "28px 24px 16px",
          textAlign: "center",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <h1
          style={{
            fontSize: 24,
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
            fontSize: 12,
            color: "rgba(255,255,255,0.38)",
            marginTop: 6,
            letterSpacing: 0.8,
          }}
        >
          Copa do Mundo FIFA 2026 · Mata-mata ·{" "}
          <span lang="en">Knockout Stage</span> ·{" "}
          <span lang="es">Eliminatorias</span> ·{" "}
          <span lang="fr">Phase finale</span>
        </p>
      </div>

      {/* Bracket — client component handles toggle + animation */}
      <section style={{ padding: "8px 0 48px" }}>
        <BracketClient leftR32={leftR32} rightR32={rightR32} />
      </section>
    </main>
  );
}
