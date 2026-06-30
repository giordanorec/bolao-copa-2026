/**
 * /chaveamento — Bracket mata-mata Copa 2026.
 * Layout vertical mobile-first: R32 → Oitavas → Quartas → Semi → Final.
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

// ─── Types ────────────────────────────────────────────────────────────────────

type Resultado = { jogo_numero: number; gols_a: number; gols_b: number };

// ─── Pênaltis hardcoded (resultado regular: empate, avanço por pênaltis) ─────

const PENALTY_WINNER: Record<number, "a" | "b"> = {
  74: "b", // Paraguai avança sobre Alemanha
  75: "b", // Marrocos avança sobre Países Baixos (Holanda)
};

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

// ─── Bracket builder ──────────────────────────────────────────────────────────

function resolverVencedor(
  jogo: Jogo,
  resultado: Resultado | undefined,
): "a" | "b" | null {
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

// ─── Game number lists per phase ──────────────────────────────────────────────

// R32: J73-J88 in chronological order
const R32_NUMS = [73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88];

// Oitavas: J89-J96
const OITAVAS_NUMS = [89, 90, 91, 92, 93, 94, 95, 96];

// Quartas: J97-J100
const QUARTAS_NUMS = [97, 98, 99, 100];

// Semis: J101-J102
const SEMIS_NUMS = [101, 102];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ChaveamentoPage() {
  const [jogos, resultados, mapaPaises] = await Promise.all([
    carregarJogos(),
    carregarResultados(),
    carregarMapaPaises(),
  ]);

  const r32 = buildConfrontos(jogos, resultados, mapaPaises, R32_NUMS);
  const oitavas = buildConfrontos(jogos, resultados, mapaPaises, OITAVAS_NUMS);
  const quartas = buildConfrontos(jogos, resultados, mapaPaises, QUARTAS_NUMS);
  const semis = buildConfrontos(jogos, resultados, mapaPaises, SEMIS_NUMS);
  const [terceiro] = buildConfrontos(jogos, resultados, mapaPaises, [103]);
  const [final] = buildConfrontos(jogos, resultados, mapaPaises, [104]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0a0e1a",
        color: "#fff",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "28px 16px 20px",
          textAlign: "center",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          background:
            "linear-gradient(180deg, rgba(255,215,0,0.04) 0%, transparent 100%)",
        }}
      >
        <h1
          style={{
            fontSize: 22,
            fontWeight: 900,
            letterSpacing: 4,
            color: "#fff",
            margin: 0,
            lineHeight: 1.2,
            textTransform: "uppercase",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          CHAVEAMENTO
        </h1>
        <p
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.35)",
            marginTop: 6,
            letterSpacing: 0.5,
            lineHeight: 1.5,
          }}
        >
          Copa do Mundo FIFA 2026 · Mata-mata
          <br />
          <span lang="en">Knockout Stage</span>
          {" · "}
          <span lang="es">Eliminatorias</span>
          {" · "}
          <span lang="fr">Phase finale</span>
        </p>
      </div>

      {/* Bracket */}
      <section style={{ paddingTop: 24 }}>
        <BracketClient
          r32={r32}
          oitavas={oitavas}
          quartas={quartas}
          semis={semis}
          final={final}
          terceiro={terceiro}
        />
      </section>
    </main>
  );
}
