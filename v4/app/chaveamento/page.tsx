/**
 * /chaveamento — Página de teste interna com 4-5 variações de bracket do mata-mata.
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
import Bandeira from "@/components/Bandeira";
import type { Jogo } from "@/lib/types";

export const metadata = {
  robots: { index: false, follow: false },
  title: "Chaveamento (teste) · Bolão das IAs",
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
// J74 Alemanha×Paraguai: 1×1 em 90 min → Paraguai avança nos pênaltis
// J75 Países Baixos×Marrocos: 1×1 em 90 min → Marrocos avança nos pênaltis
const PENALTY_WINNER: Record<number, "a" | "b"> = {
  74: "b", // Paraguai (time_b) avança
  75: "b", // Marrocos (time_b) avança
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

// ─── Bracket resolution ───────────────────────────────────────────────────────

function resolverVencedor(
  jogo: Jogo,
  resultado: Resultado | undefined,
): "a" | "b" | null {
  // Pênaltis hardcoded
  if (PENALTY_WINNER[jogo.numero]) {
    if (resultado) return PENALTY_WINNER[jogo.numero];
  }
  if (!resultado) return null;
  const { gols_a, gols_b } = resultado;
  if (gols_a > gols_b) return "a";
  if (gols_b > gols_a) return "b";
  return null; // empate sem pênaltis definidos
}

function resolverTime(
  nome: string,
  mapaPaises: Record<string, string>,
): SlotTime {
  // Se é placeholder (ex. "Venc. J74", "Perd. J101"), retorna sem ISO
  if (nome.startsWith("Venc.") || nome.startsWith("Perd.")) {
    return { nome };
  }
  return { nome, iso: mapaPaises[nome] };
}

// Monta os confrontos resolvidos do R32 ao Final
function buildBracket(
  jogos: Jogo[],
  resultados: Map<number, Resultado>,
  mapaPaises: Record<string, string>,
): Map<number, Confronto> {
  const map = new Map<number, Confronto>();

  // Mapeia times vencedores por número de jogo
  const vencedorDoJogo: Map<number, SlotTime> = new Map();

  const jogoMap = new Map(jogos.map((j) => [j.numero, j]));

  // Processa em ordem numérica (73 → 104)
  for (let n = 73; n <= 104; n++) {
    const jogo = jogoMap.get(n);
    if (!jogo) continue;

    const resultado = resultados.get(n);

    // Resolve time_a e time_b
    let timeANome = jogo.time_a;
    let timeBNome = jogo.time_b;

    // Substitui placeholders pelo vencedor real se disponível
    const matchA = timeANome.match(/^Venc\.\s*J(\d+)$/);
    const matchB = timeBNome.match(/^Venc\.\s*J(\d+)$/);
    const matchPerdA = timeANome.match(/^Perd\.\s*J(\d+)$/);
    const matchPerdB = timeBNome.match(/^Perd\.\s*J(\d+)$/);

    let slotA: SlotTime;
    let slotB: SlotTime;

    if (matchA && vencedorDoJogo.has(Number(matchA[1]))) {
      slotA = { ...vencedorDoJogo.get(Number(matchA[1]))! };
    } else if (matchPerdA) {
      // para 3º lugar — não vamos rastrear perdedores em detalhe, mostra placeholder
      slotA = { nome: timeANome };
    } else {
      slotA = resolverTime(timeANome, mapaPaises);
    }

    if (matchB && vencedorDoJogo.has(Number(matchB[1]))) {
      slotB = { ...vencedorDoJogo.get(Number(matchB[1]))! };
    } else if (matchPerdB) {
      slotB = { nome: timeBNome };
    } else {
      slotB = resolverTime(timeBNome, mapaPaises);
    }

    const venc = resolverVencedor(jogo, resultado);

    // Registra vencedor pra rounds futuros
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

// ─── Estrutura do bracket por rounds ─────────────────────────────────────────
// Metade superior: J89, J90 → J97 → J101 → J104
// Metade inferior: J91, J92 → J99 → J102 → J104
// Outro lado:       J93, J94 → J98 → J101
//                  J95, J96 → J100 → J102
// 3º lugar: J103

const R32_NUMS = [73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88];
const R16_NUMS = [89, 90, 91, 92, 93, 94, 95, 96];
const QF_NUMS  = [97, 98, 99, 100];
const SF_NUMS  = [101, 102];
const F_NUM    = 104;
const THIRD_NUM = 103;

// Mapeamento par do R16 → QF → SF → F
// Cada R16 par: (89,90)→97, (93,94)→98, (91,92)→99, (95,96)→100
// QF par: (97,98)→101, (99,100)→102
// SF: 101,102→104

// Metade "esquerda" do bracket: R32 J73-J80 → R16 J89-J92 → QF J97,J99 → SF J101 → F J104
// Metade "direita":             R32 J81-J88 → R16 J93-J96 → QF J98,J100 → SF J102 → F J104

// Para o bracket clássico horizontal-split, vamos organizar assim:
// Coluna R32 (16 jogos) | R16 (8) | QF (4) | SF (2) | F (1) | SF | QF | R16 | R32

// ─── Helpers de UI ────────────────────────────────────────────────────────────

function placar(c: Confronto): string {
  if (c.gols_a === null || c.gols_b === null) return "";
  // Check pênaltis
  if (PENALTY_WINNER[c.numero]) {
    return `${c.gols_a}×${c.gols_b} (pen.)`;
  }
  return `${c.gols_a}×${c.gols_b}`;
}

function fmtData(d: string): string {
  const [, m, dd] = d.split("-");
  return `${dd}/${m}`;
}

// ─── Componentes de card ───────────────────────────────────────────────────────

function TimeCard({
  slot,
  isWinner,
  size = 24,
  showName = true,
}: {
  slot: SlotTime;
  isWinner: boolean;
  size?: number;
  showName?: boolean;
}) {
  const isPlaceholder = slot.nome.startsWith("Venc.") || slot.nome.startsWith("Perd.");
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        opacity: slot.eliminado ? 0.4 : 1,
        fontWeight: isWinner ? 700 : 400,
      }}
    >
      {slot.iso ? (
        <Bandeira iso={slot.iso} nome={slot.nome} size={size} />
      ) : (
        <span
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            background: "var(--bg-soft)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: size * 0.45,
            flexShrink: 0,
            color: "var(--fg-muted)",
          }}
        >
          {isPlaceholder ? "?" : "?"}
        </span>
      )}
      {showName && (
        <span
          style={{
            fontSize: 13,
            fontFamily: "var(--ff-sans)",
            color: isPlaceholder ? "var(--fg-dim)" : slot.eliminado ? "var(--fg-muted)" : "var(--fg)",
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: 110,
          }}
        >
          {isPlaceholder ? slot.nome : slot.nome}
        </span>
      )}
    </div>
  );
}

// ─── Variação 1: Clássico Horizontal Split ─────────────────────────────────────

function BracketCardClassico({
  c,
  compact = false,
}: {
  c: Confronto;
  compact?: boolean;
}) {
  const pl = placar(c);
  return (
    <div
      style={{
        background: "var(--bg-2)",
        border: "1px solid var(--line-strong)",
        borderRadius: 8,
        padding: compact ? "5px 8px" : "7px 10px",
        minWidth: compact ? 140 : 160,
        maxWidth: compact ? 170 : 190,
        boxShadow: "var(--shadow-soft)",
        position: "relative",
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontFamily: "var(--ff-mono)",
          color: "var(--fg-muted)",
          letterSpacing: "0.06em",
          marginBottom: 4,
          textTransform: "uppercase",
        }}
      >
        J{c.numero} · {fmtData(c.data)}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
        <TimeCard slot={c.timeA} isWinner={c.vencedor === "a"} size={18} />
        {pl && (
          <span
            style={{
              fontSize: 12,
              fontFamily: "var(--ff-display)",
              fontWeight: 700,
              color: "var(--fg)",
              marginLeft: 4,
              flexShrink: 0,
            }}
          >
            {c.gols_a}
          </span>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <TimeCard slot={c.timeB} isWinner={c.vencedor === "b"} size={18} />
        {pl && (
          <span
            style={{
              fontSize: 12,
              fontFamily: "var(--ff-display)",
              fontWeight: 700,
              color: "var(--fg)",
              marginLeft: 4,
              flexShrink: 0,
            }}
          >
            {c.gols_b}
          </span>
        )}
      </div>
      {pl && (
        <div
          style={{
            position: "absolute",
            top: 5,
            right: 8,
            fontSize: 9,
            fontFamily: "var(--ff-mono)",
            color: "var(--fg-dim)",
            letterSpacing: "0.04em",
          }}
        >
          {PENALTY_WINNER[c.numero] ? "pen." : ""}
        </div>
      )}
    </div>
  );
}


function VariacaoClassico({
  bracket,
}: {
  bracket: Map<number, Confronto>;
}) {
  const get = (n: number) => bracket.get(n)!;

  // Metade esquerda: R32 J73-J76,J89-J92 → R16 J89,J90,J91,J92 → QF J97,J99 → SF J101
  // Metade direita:  R32 J81-J88 → R16 J93-J96 → QF J98,J100 → SF J102
  // Final ao centro

  // Left half tree (top-to-bottom):
  // R32: J73,J74,J75,J76,J77,J78,J79,J80
  // R16: J90(W73vsW75), J89(W74vsW77), J91(W76vsW78), J92(W79vsW80)
  // Actually per spec: J89=W74vsW77, J90=W73vsW75, J91=W76vsW78, J92=W79vsW80
  // QF97 = W89+W90, QF99 = W91+W92
  // SF101 = W97+W98... wait spec says SF101 = W97+W98 (metade superior)
  // But QF98=W93+W94 is on right side
  // Let me reorganize per the actual tree:

  // LEFT HALF:
  //   R32: J73, J74 → R16: J90 (J73 winner vs J75 winner... wait)
  // Per spec:
  //   J89: W74 vs W77
  //   J90: W73 vs W75
  //   J91: W76 vs W78
  //   J92: W79 vs W80
  //   J97: W89+W90
  //   J99: W91+W92
  //   J101: W97+W98 (SF)
  //   J102: W99+W100 (SF)
  //   J104: W101+W102 (Final)

  // So left side feeds J101 and right side feeds J102
  // LEFT: J73,J74,J75,J76,J77,J78,J79,J80 → J89,J90,J91,J92 → J97,J99 → J101
  // RIGHT: J81,J82,J83,J84,J85,J86,J87,J88 → J93,J94,J95,J96 → J98,J100 → J102

  const leftR32 = [73, 74, 75, 76, 77, 78, 79, 80].map(get);
  const leftR16 = [90, 89, 91, 92].map(get); // pairing: 90 is W73vsW75, 89 is W74vsW77 etc
  const leftQF = [97, 99].map(get);
  const leftSF = get(101);

  const rightR32 = [81, 82, 83, 84, 85, 86, 87, 88].map(get);
  const rightR16 = [94, 93, 96, 95].map(get);
  const rightQF = [98, 100].map(get);
  const rightSF = get(102);

  const final = get(F_NUM);
  const third = get(THIRD_NUM);

  const colGap = 36;
  const cardH = 64; // approx height of each card
  const rowGap = 8;

  // We'll render as a flex row layout
  const columnStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: rowGap,
    justifyContent: "space-around",
    alignItems: "center",
  };

  function Column({
    label,
    items,
    spacingMultiplier = 1,
  }: {
    label: string;
    items: Confronto[];
    spacingMultiplier?: number;
  }) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
        <div
          style={{
            fontSize: 10,
            fontFamily: "var(--ff-mono)",
            color: "var(--fg-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: 10,
            textAlign: "center",
          }}
        >
          {label}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: rowGap + (spacingMultiplier - 1) * (cardH + rowGap),
            alignItems: "center",
          }}
        >
          {items.map((c) => (
            <BracketCardClassico key={c.numero} c={c} compact />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        overflowX: "auto",
        paddingBottom: 16,
        WebkitOverflowScrolling: "touch",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: colGap,
          minWidth: 1100,
          padding: "0 16px",
        }}
      >
        {/* LEFT HALF */}
        <Column label="R32" items={leftR32} />
        <Column label="Oitavas" items={leftR16} spacingMultiplier={2} />
        <Column label="Quartas" items={leftQF} spacingMultiplier={4} />
        <Column label="Semi" items={[leftSF]} spacingMultiplier={8} />

        {/* FINAL ao centro */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div
            style={{
              fontSize: 10,
              fontFamily: "var(--ff-mono)",
              color: "var(--primary)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 10,
              textAlign: "center",
              fontWeight: 700,
            }}
          >
            Final
          </div>
          <div
            style={{
              background: "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)",
              borderRadius: 12,
              padding: "12px 14px",
              minWidth: 180,
              boxShadow: "var(--shadow-pop)",
              border: "2px solid var(--accent)",
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontFamily: "var(--ff-mono)",
                color: "rgba(255,255,255,0.7)",
                letterSpacing: "0.06em",
                marginBottom: 6,
                textTransform: "uppercase",
              }}
            >
              J{final.numero} · {fmtData(final.data)}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              {final.timeA.iso ? (
                <Bandeira iso={final.timeA.iso} nome={final.timeA.nome} size={28} />
              ) : (
                <span style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>?</span>
              )}
              <span style={{ fontSize: 14, fontFamily: "var(--ff-sans)", fontWeight: 600, color: "#fff", flex: 1 }}>
                {final.timeA.nome.startsWith("Venc.") ? "?" : final.timeA.nome}
              </span>
              {final.gols_a !== null && (
                <span style={{ fontSize: 18, fontFamily: "var(--ff-display)", fontWeight: 800, color: "var(--accent)" }}>
                  {final.gols_a}
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {final.timeB.iso ? (
                <Bandeira iso={final.timeB.iso} nome={final.timeB.nome} size={28} />
              ) : (
                <span style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>?</span>
              )}
              <span style={{ fontSize: 14, fontFamily: "var(--ff-sans)", fontWeight: 600, color: "#fff", flex: 1 }}>
                {final.timeB.nome.startsWith("Venc.") ? "?" : final.timeB.nome}
              </span>
              {final.gols_b !== null && (
                <span style={{ fontSize: 18, fontFamily: "var(--ff-display)", fontWeight: 800, color: "var(--accent)" }}>
                  {final.gols_b}
                </span>
              )}
            </div>
          </div>
          {/* 3rd place */}
          <div style={{ marginTop: 16 }}>
            <div
              style={{
                fontSize: 9,
                fontFamily: "var(--ff-mono)",
                color: "var(--fg-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 6,
                textAlign: "center",
              }}
            >
              3º Lugar
            </div>
            <BracketCardClassico c={third} compact />
          </div>
        </div>

        {/* RIGHT HALF */}
        <Column label="Semi" items={[rightSF]} spacingMultiplier={8} />
        <Column label="Quartas" items={rightQF} spacingMultiplier={4} />
        <Column label="Oitavas" items={rightR16} spacingMultiplier={2} />
        <Column label="R32" items={rightR32} />
      </div>
    </div>
  );
}

// ─── Variação 2: Vertical Compacto Moderno ────────────────────────────────────

function CardModerno({
  c,
  mini = false,
}: {
  c: Confronto;
  mini?: boolean;
}) {
  const pl = placar(c);
  return (
    <div
      style={{
        background: "var(--bg-2)",
        borderRadius: mini ? 8 : 10,
        border: "1px solid var(--line)",
        padding: mini ? "6px 8px" : "8px 12px",
        width: "100%",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Accent bar for played games */}
      {pl && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            background: "var(--primary)",
            borderRadius: "8px 0 0 8px",
          }}
        />
      )}
      <div
        style={{
          paddingLeft: pl ? 6 : 0,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <div
          style={{
            fontSize: 9,
            fontFamily: "var(--ff-mono)",
            color: "var(--fg-dim)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          J{c.numero} · {fmtData(c.data)}
        </div>
        {[
          { slot: c.timeA, gols: c.gols_a, isWin: c.vencedor === "a" },
          { slot: c.timeB, gols: c.gols_b, isWin: c.vencedor === "b" },
        ].map(({ slot, gols, isWin }, i) => {
          const isPlaceholder = slot.nome.startsWith("Venc.") || slot.nome.startsWith("Perd.");
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                opacity: slot.eliminado ? 0.45 : 1,
              }}
            >
              {slot.iso ? (
                <Bandeira iso={slot.iso} nome={slot.nome} size={mini ? 16 : 20} />
              ) : (
                <span
                  style={{
                    width: mini ? 16 : 20,
                    height: mini ? 16 : 20,
                    borderRadius: "50%",
                    background: "var(--bg-soft)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 8,
                    flexShrink: 0,
                    color: "var(--fg-dim)",
                  }}
                >
                  ?
                </span>
              )}
              <span
                style={{
                  fontSize: mini ? 11 : 12,
                  fontFamily: "var(--ff-sans)",
                  fontWeight: isWin ? 700 : 400,
                  color: isPlaceholder ? "var(--fg-dim)" : "var(--fg)",
                  flex: 1,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {slot.nome}
              </span>
              {gols !== null && (
                <span
                  style={{
                    fontSize: mini ? 12 : 14,
                    fontFamily: "var(--ff-display)",
                    fontWeight: 800,
                    color: isWin ? "var(--primary)" : "var(--fg-muted)",
                    minWidth: 14,
                    textAlign: "right",
                  }}
                >
                  {gols}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VariacaoVerticalModerno({
  bracket,
}: {
  bracket: Map<number, Confronto>;
}) {
  const get = (n: number) => bracket.get(n)!;

  const rounds: { label: string; nums: number[] }[] = [
    { label: "R32 — Rodada de 32", nums: R32_NUMS },
    { label: "Oitavas de Final", nums: R16_NUMS },
    { label: "Quartas de Final", nums: QF_NUMS },
    { label: "Semifinal", nums: SF_NUMS },
    { label: "3º Lugar", nums: [THIRD_NUM] },
    { label: "Final", nums: [F_NUM] },
  ];

  return (
    <div>
      {rounds.map(({ label, nums }) => (
        <div key={label} style={{ marginBottom: 28 }}>
          <h3
            style={{
              fontSize: 11,
              fontFamily: "var(--ff-mono)",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "var(--primary)",
              marginBottom: 10,
              paddingBottom: 6,
              borderBottom: "1px solid var(--line)",
            }}
          >
            {label}
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 8,
            }}
          >
            {nums.map((n) => (
              <CardModerno key={n} c={get(n)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Variação 3: Radial ─────────────────────────────────────────────────────

function VariacaoRadial({
  bracket,
}: {
  bracket: Map<number, Confronto>;
}) {
  const get = (n: number) => bracket.get(n)!;

  // SVG radial layout
  // Rings: R32 (outermost) → R16 → QF → SF → Final (center)
  // 16 R32 games → 8 arcs each
  // Each arc = 360/16 = 22.5 degrees

  const CX = 360;
  const CY = 360;
  const R_FINAL = 58;
  const R_SF = 108;
  const R_QF = 168;
  const R_R16 = 232;
  const R_R32 = 300;

  // Map each R32 to an angle (0..15 → 0..360)
  // Order matters for visual coherence: left half top→bottom, right half bottom→top
  const R32_ORDER = [73, 74, 77, 78, 75, 76, 79, 80, 81, 82, 85, 86, 83, 84, 87, 88];
  const R16_ORDER = [90, 89, 91, 92, 94, 93, 95, 96]; // paired with R32 order above (pairs of 2)
  const QF_ORDER  = [97, 99, 98, 100];
  const SF_ORDER  = [101, 102];

  function angleForIndex(total: number, i: number): number {
    return (i / total) * 360 - 90; // start from top
  }

  function polarToXY(angle: number, r: number): { x: number; y: number } {
    const rad = (angle * Math.PI) / 180;
    return {
      x: CX + r * Math.cos(rad),
      y: CY + r * Math.sin(rad),
    };
  }

  function arcPath(startAngle: number, endAngle: number, r: number): string {
    const s = polarToXY(startAngle, r);
    const e = polarToXY(endAngle, r);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  }

  const segmentDeg = 360 / 16; // 22.5 per R32 slot

  return (
    <div style={{ overflowX: "auto", display: "flex", justifyContent: "center" }}>
      <div style={{ position: "relative", width: CX * 2, height: CY * 2 }}>
        <svg
          width={CX * 2}
          height={CY * 2}
          style={{ position: "absolute", top: 0, left: 0 }}
          aria-hidden
        >
          {/* Background rings */}
          {[R_R32 + 36, R_R16 + 28, R_QF + 24, R_SF + 16, R_FINAL + 12].map((r, i) => (
            <circle
              key={i}
              cx={CX}
              cy={CY}
              r={r}
              fill="none"
              stroke="var(--line)"
              strokeWidth={1}
              strokeDasharray="4 6"
            />
          ))}

          {/* R32 arcs colored by result */}
          {R32_ORDER.map((num, i) => {
            const c = get(num);
            const startA = angleForIndex(16, i) + 1;
            const endA = angleForIndex(16, i + 1) - 1;
            const color = c.vencedor ? "var(--primary)" : "var(--line-strong)";
            return (
              <g key={num}>
                <path
                  d={arcPath(startA, endA, R_R32)}
                  fill="none"
                  stroke={color}
                  strokeWidth={16}
                  strokeLinecap="round"
                  opacity={0.85}
                />
                {/* Team names rendered via HTML overlay below, skip SVG foreignObject */}
              </g>
            );
          })}

          {/* R16 arcs */}
          {R16_ORDER.map((num, i) => {
            const c = get(num);
            const startA = angleForIndex(8, i) + 1.5;
            const endA = angleForIndex(8, i + 1) - 1.5;
            const color = c.vencedor ? "var(--primary)" : "var(--line-strong)";
            return (
              <path
                key={num}
                d={arcPath(startA, endA, R_R16)}
                fill="none"
                stroke={color}
                strokeWidth={18}
                strokeLinecap="round"
                opacity={0.85}
              />
            );
          })}

          {/* QF arcs */}
          {QF_ORDER.map((num, i) => {
            const c = get(num);
            const startA = angleForIndex(4, i) + 3;
            const endA = angleForIndex(4, i + 1) - 3;
            const color = c.vencedor ? "var(--primary)" : "var(--line-strong)";
            return (
              <path
                key={num}
                d={arcPath(startA, endA, R_QF)}
                fill="none"
                stroke={color}
                strokeWidth={22}
                strokeLinecap="round"
                opacity={0.85}
              />
            );
          })}

          {/* SF arcs */}
          {SF_ORDER.map((num, i) => {
            const c = get(num);
            const startA = angleForIndex(2, i) + 6;
            const endA = angleForIndex(2, i + 1) - 6;
            const color = c.vencedor ? "var(--accent)" : "var(--line-strong)";
            return (
              <path
                key={num}
                d={arcPath(startA, endA, R_SF)}
                fill="none"
                stroke={color}
                strokeWidth={24}
                strokeLinecap="round"
                opacity={0.9}
              />
            );
          })}

          {/* Final circle */}
          <circle
            cx={CX}
            cy={CY}
            r={R_FINAL}
            fill={get(F_NUM).vencedor ? "var(--primary)" : "var(--bg-soft)"}
            stroke="var(--accent)"
            strokeWidth={3}
          />
        </svg>

        {/* Ring labels positioned around */}
        {[
          { r: R_R32, label: "R32", angle: -90 },
          { r: R_R16, label: "Oitavas", angle: -90 },
          { r: R_QF, label: "Quartas", angle: -90 },
          { r: R_SF, label: "Semi", angle: -90 },
        ].map(({ r, label, angle }) => {
          const pos = polarToXY(angle - 4, r - 8);
          return (
            <div
              key={label}
              style={{
                position: "absolute",
                left: pos.x,
                top: pos.y,
                transform: "translate(-50%, -50%)",
                fontSize: 9,
                fontFamily: "var(--ff-mono)",
                color: "var(--fg-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                background: "var(--bg-1)",
                padding: "1px 4px",
                borderRadius: 4,
                pointerEvents: "none",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </div>
          );
        })}

        {/* R32 team names around the outer ring */}
        {R32_ORDER.map((num, i) => {
          const c = get(num);
          const midA = angleForIndex(16, i) + segmentDeg / 2;
          const posA = polarToXY(midA, R_R32 - 28);
          const posB = polarToXY(midA, R_R32 + 28);
          const rotA = midA + (midA > 90 && midA < 270 ? 180 : 0);
          const rotB = midA + (midA > 90 && midA < 270 ? 180 : 0);

          return (
            <div key={`r32-teams-${num}`}>
              {/* Inner label (time_a — closer to center) */}
              <div
                style={{
                  position: "absolute",
                  left: posA.x,
                  top: posA.y,
                  transform: `translate(-50%,-50%) rotate(${rotA}deg)`,
                  fontSize: 8,
                  fontFamily: "var(--ff-mono)",
                  color: c.vencedor === "a" ? "var(--fg)" : c.vencedor === "b" ? "rgba(0,0,0,0.3)" : "var(--fg-muted)",
                  whiteSpace: "nowrap",
                  fontWeight: c.vencedor === "a" ? 700 : 400,
                  letterSpacing: "0.04em",
                  maxWidth: 50,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {c.timeA.nome.length > 8 ? c.timeA.nome.slice(0, 7) + "…" : c.timeA.nome}
              </div>
              {/* Outer label (time_b) */}
              <div
                style={{
                  position: "absolute",
                  left: posB.x,
                  top: posB.y,
                  transform: `translate(-50%,-50%) rotate(${rotB}deg)`,
                  fontSize: 8,
                  fontFamily: "var(--ff-mono)",
                  color: c.vencedor === "b" ? "var(--fg)" : c.vencedor === "a" ? "rgba(0,0,0,0.3)" : "var(--fg-muted)",
                  whiteSpace: "nowrap",
                  fontWeight: c.vencedor === "b" ? 700 : 400,
                  letterSpacing: "0.04em",
                  maxWidth: 50,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {c.timeB.nome.length > 8 ? c.timeB.nome.slice(0, 7) + "…" : c.timeB.nome}
              </div>
            </div>
          );
        })}

        {/* Center final label */}
        <div
          style={{
            position: "absolute",
            left: CX,
            top: CY,
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          {(() => {
            const f = get(F_NUM);
            const vTeam =
              f.vencedor === "a" ? f.timeA :
              f.vencedor === "b" ? f.timeB : null;
            return vTeam ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                {vTeam.iso && <Bandeira iso={vTeam.iso} nome={vTeam.nome} size={32} />}
                <span style={{ fontSize: 10, fontFamily: "var(--ff-mono)", color: "#fff", fontWeight: 700, letterSpacing: "0.04em" }}>
                  {vTeam.nome.length > 8 ? vTeam.nome.slice(0, 7) + "…" : vTeam.nome}
                </span>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 20 }}>🏆</div>
                <div style={{ fontSize: 9, fontFamily: "var(--ff-mono)", color: "var(--fg-muted)", letterSpacing: "0.08em" }}>FINAL</div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

// ─── Variação 4: Cinemático Escuro ────────────────────────────────────────────

function CardCinematico({
  c,
  size = "md",
}: {
  c: Confronto;
  size?: "sm" | "md" | "lg";
}) {
  const pl = placar(c);
  const isPlayed = c.gols_a !== null;
  const px = size === "lg" ? 16 : size === "md" ? 12 : 8;
  const py = size === "lg" ? 14 : size === "md" ? 10 : 6;
  const flagSize = size === "lg" ? 28 : size === "md" ? 22 : 16;
  const nameFSize = size === "lg" ? 13 : size === "md" ? 12 : 10;

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${isPlayed ? "rgba(255,215,0,0.3)" : "rgba(255,255,255,0.08)"}`,
        borderRadius: 10,
        padding: `${py}px ${px}px`,
        backdropFilter: "blur(8px)",
        boxShadow: isPlayed
          ? "0 0 20px rgba(255,215,0,0.12), 0 4px 16px rgba(0,0,0,0.4)"
          : "0 4px 16px rgba(0,0,0,0.3)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {isPlayed && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, rgba(255,215,0,0.04) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />
      )}
      <div
        style={{
          fontSize: 9,
          fontFamily: "var(--ff-mono)",
          color: "rgba(255,255,255,0.35)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginBottom: size === "sm" ? 4 : 6,
        }}
      >
        J{c.numero} · {fmtData(c.data)}
      </div>
      {[
        { slot: c.timeA, gols: c.gols_a, isWin: c.vencedor === "a" },
        { slot: c.timeB, gols: c.gols_b, isWin: c.vencedor === "b" },
      ].map(({ slot, gols, isWin }, i) => {
        const isPlaceholder = slot.nome.startsWith("Venc.") || slot.nome.startsWith("Perd.");
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              marginBottom: i === 0 ? 5 : 0,
              opacity: slot.eliminado ? 0.3 : 1,
              transition: "opacity 0.3s",
            }}
          >
            {slot.iso ? (
              <div
                style={{
                  boxShadow: isWin ? `0 0 12px rgba(255,215,0,0.5)` : "none",
                  borderRadius: "50%",
                  transition: "box-shadow 0.3s",
                }}
              >
                <Bandeira iso={slot.iso} nome={slot.nome} size={flagSize} />
              </div>
            ) : (
              <span
                style={{
                  width: flagSize,
                  height: flagSize,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.08)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: flagSize * 0.4,
                  flexShrink: 0,
                  color: "rgba(255,255,255,0.3)",
                }}
              >
                ?
              </span>
            )}
            <span
              style={{
                fontSize: nameFSize,
                fontFamily: "var(--ff-sans)",
                color: isPlaceholder
                  ? "rgba(255,255,255,0.25)"
                  : isWin
                  ? "#FFD700"
                  : "rgba(255,255,255,0.75)",
                fontWeight: isWin ? 700 : 400,
                flex: 1,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                letterSpacing: "-0.01em",
              }}
            >
              {slot.nome}
            </span>
            {gols !== null && (
              <span
                style={{
                  fontSize: size === "lg" ? 20 : 15,
                  fontFamily: "var(--ff-display)",
                  fontWeight: 800,
                  color: isWin ? "#FFD700" : "rgba(255,255,255,0.4)",
                  minWidth: 16,
                  textAlign: "right",
                }}
              >
                {gols}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function VariacaoCinematica({
  bracket,
}: {
  bracket: Map<number, Confronto>;
}) {
  const get = (n: number) => bracket.get(n)!;

  const rounds: { label: string; sub: string; nums: number[]; size?: "sm" | "md" | "lg" }[] = [
    { label: "R32 — Rodada de 32", sub: "16 confrontos", nums: R32_NUMS, size: "sm" },
    { label: "Oitavas de Final", sub: "8 confrontos", nums: R16_NUMS, size: "sm" },
    { label: "Quartas de Final", sub: "4 confrontos", nums: QF_NUMS, size: "md" },
    { label: "Semifinal", sub: "2 confrontos", nums: SF_NUMS, size: "md" },
    { label: "Disputa do 3º Lugar", sub: "1 confronto", nums: [THIRD_NUM], size: "md" },
    { label: "FINAL", sub: "O duelo definitivo", nums: [F_NUM], size: "lg" },
  ];

  return (
    <div
      style={{
        background: "linear-gradient(160deg, #0A0A1A 0%, #0D1A2E 40%, #0A0A1A 100%)",
        borderRadius: 16,
        padding: "32px 20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Cosmic background dots */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            radial-gradient(1px 1px at 15% 20%, rgba(255,255,255,0.3) 0%, transparent 100%),
            radial-gradient(1px 1px at 35% 60%, rgba(255,255,255,0.25) 0%, transparent 100%),
            radial-gradient(1px 1px at 70% 15%, rgba(255,255,255,0.3) 0%, transparent 100%),
            radial-gradient(1px 1px at 85% 75%, rgba(255,255,255,0.2) 0%, transparent 100%),
            radial-gradient(2px 2px at 50% 90%, rgba(255,215,0,0.2) 0%, transparent 100%),
            radial-gradient(circle at 20% 80%, rgba(0,100,200,0.08) 0%, transparent 40%),
            radial-gradient(circle at 80% 20%, rgba(100,0,200,0.06) 0%, transparent 40%)
          `,
          pointerEvents: "none",
        }}
      />

      {rounds.map(({ label, sub, nums, size }) => {
        const isFinal = nums[0] === F_NUM;
        return (
          <div key={label} style={{ marginBottom: 32, position: "relative" }}>
            <div style={{ marginBottom: 12 }}>
              <h3
                style={{
                  fontSize: isFinal ? 20 : 13,
                  fontFamily: "var(--ff-display)",
                  fontWeight: isFinal ? 800 : 600,
                  color: isFinal ? "#FFD700" : "rgba(255,255,255,0.85)",
                  letterSpacing: isFinal ? "-0.02em" : "0.04em",
                  textTransform: isFinal ? "uppercase" : "none",
                  margin: 0,
                }}
              >
                {label}
              </h3>
              <p
                style={{
                  fontSize: 10,
                  fontFamily: "var(--ff-mono)",
                  color: "rgba(255,255,255,0.3)",
                  letterSpacing: "0.1em",
                  margin: "3px 0 0",
                }}
              >
                {sub}
              </p>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isFinal
                  ? "1fr"
                  : nums.length <= 2
                  ? "repeat(auto-fill, minmax(220px, 1fr))"
                  : nums.length <= 4
                  ? "repeat(auto-fill, minmax(200px, 1fr))"
                  : "repeat(auto-fill, minmax(180px, 1fr))",
                gap: isFinal ? 0 : 8,
                maxWidth: isFinal ? 340 : "100%",
              }}
            >
              {nums.map((n) => (
                <CardCinematico key={n} c={get(n)} size={size} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Variação 5: Timeline / Trail Flow ────────────────────────────────────────
// Inspiração: Sankey-ish flow diagram mostrando a jornada dos times

function VariacaoTimeline({
  bracket,
}: {
  bracket: Map<number, Confronto>;
}) {
  const get = (n: number) => bracket.get(n)!;

  // Extraímos os times que já jogaram R32 com resultado
  const r32Played = R32_NUMS.map(get).filter((c) => c.gols_a !== null);
  const r32Winners = r32Played.filter((c) => c.vencedor).map((c) =>
    c.vencedor === "a" ? c.timeA : c.timeB
  );

  // For now render a timeline of R32 results flowing into R16
  const rounds = [
    { label: "R32", nums: R32_NUMS },
    { label: "Oitavas", nums: R16_NUMS },
    { label: "Quartas", nums: QF_NUMS },
    { label: "Semifinal", nums: SF_NUMS },
    { label: "3º Lugar", nums: [THIRD_NUM] },
    { label: "Final", nums: [F_NUM] },
  ];

  const phaseColors: Record<string, string> = {
    "R32": "var(--secondary)",
    "Oitavas": "var(--primary)",
    "Quartas": "var(--primary-2)",
    "Semifinal": "var(--accent-3)",
    "3º Lugar": "var(--fg-muted)",
    "Final": "var(--accent)",
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 0,
          minWidth: 900,
          padding: "0 8px",
        }}
      >
        {rounds.map(({ label, nums }, roundIndex) => {
          const color = phaseColors[label] ?? "var(--primary)";
          const isLast = roundIndex === rounds.length - 1;
          const colWidth = label === "Final" ? 220 : label === "Semifinal" ? 180 : label === "Quartas" ? 160 : label === "3º Lugar" ? 160 : 140;

          return (
            <div
              key={label}
              style={{
                display: "flex",
                flexDirection: "column",
                width: colWidth,
                flexShrink: 0,
              }}
            >
              {/* Phase header */}
              <div
                style={{
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: color,
                  borderRadius: roundIndex === 0 ? "8px 0 0 0" : isLast ? "0 8px 0 0" : 0,
                  borderRight: isLast ? "none" : "1px solid rgba(255,255,255,0.2)",
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontFamily: "var(--ff-mono)",
                    color: "#fff",
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  {label}
                </span>
              </div>

              {/* Cards column */}
              <div
                style={{
                  background: "var(--bg-1)",
                  borderLeft: roundIndex === 0 ? "1px solid var(--line)" : "none",
                  borderRight: "1px solid var(--line)",
                  borderBottom: "1px solid var(--line)",
                  borderRadius: roundIndex === 0 ? "0 0 0 8px" : isLast ? "0 0 8px 0" : 0,
                  padding: 8,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  minHeight: 400,
                  justifyContent: nums.length <= 2 ? "center" : "flex-start",
                }}
              >
                {nums.map((n) => {
                  const c = get(n);
                  const pl = placar(c);
                  return (
                    <div
                      key={n}
                      style={{
                        background: "var(--bg-2)",
                        borderRadius: 7,
                        padding: "6px 8px",
                        border: `1px solid ${c.vencedor ? color : "var(--line)"}`,
                        borderLeft: `3px solid ${color}`,
                        boxShadow: c.vencedor ? "var(--shadow-soft)" : "none",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 9,
                          fontFamily: "var(--ff-mono)",
                          color: "var(--fg-dim)",
                          letterSpacing: "0.06em",
                          marginBottom: 3,
                        }}
                      >
                        J{c.numero}
                      </div>
                      {[
                        { slot: c.timeA, gols: c.gols_a, win: c.vencedor === "a" },
                        { slot: c.timeB, gols: c.gols_b, win: c.vencedor === "b" },
                      ].map(({ slot, gols, win }, i) => {
                        const isPH = slot.nome.startsWith("Venc.") || slot.nome.startsWith("Perd.");
                        return (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              marginBottom: i === 0 ? 3 : 0,
                              opacity: slot.eliminado ? 0.4 : 1,
                            }}
                          >
                            {slot.iso ? (
                              <Bandeira iso={slot.iso} nome={slot.nome} size={14} />
                            ) : (
                              <span
                                style={{
                                  width: 14,
                                  height: 14,
                                  borderRadius: "50%",
                                  background: "var(--bg-soft)",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 7,
                                  color: "var(--fg-dim)",
                                  flexShrink: 0,
                                }}
                              >
                                ?
                              </span>
                            )}
                            <span
                              style={{
                                fontSize: 10,
                                fontFamily: "var(--ff-sans)",
                                color: isPH ? "var(--fg-dim)" : "var(--fg)",
                                fontWeight: win ? 700 : 400,
                                flex: 1,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {slot.nome.length > 10 ? slot.nome.slice(0, 9) + "…" : slot.nome}
                            </span>
                            {gols !== null && (
                              <span
                                style={{
                                  fontSize: 11,
                                  fontFamily: "var(--ff-display)",
                                  fontWeight: 700,
                                  color: win ? color : "var(--fg-muted)",
                                }}
                              >
                                {gols}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
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

  const variacoes: {
    id: string;
    title: { pt: string; en: string; es: string; fr: string };
    desc: { pt: string; en: string; es: string; fr: string };
    label: string;
  }[] = [
    {
      id: "classico",
      label: "01",
      title: {
        pt: "Clássico Horizontal Split",
        en: "Classic Horizontal Split",
        es: "Clásico Horizontal Split",
        fr: "Classique Horizontal Split",
      },
      desc: {
        pt: "Estilo Wikipedia/FIFA — metade superior à esquerda, metade inferior à direita, Final ao centro.",
        en: "Wikipedia/FIFA style — top half on the left, bottom half on the right, Final at center.",
        es: "Estilo Wikipedia/FIFA — mitad superior a la izquierda, mitad inferior a la derecha, Final al centro.",
        fr: "Style Wikipedia/FIFA — moitié supérieure à gauche, moitié inférieure à droite, Finale au centre.",
      },
    },
    {
      id: "moderno",
      label: "02",
      title: {
        pt: "Vertical Compacto Moderno",
        en: "Modern Compact Vertical",
        es: "Vertical Compacto Moderno",
        fr: "Vertical Compact Moderne",
      },
      desc: {
        pt: "Estilo ESPN/Apple Sports — colunas por fase, cards minimalistas com bandeiras e placares.",
        en: "ESPN/Apple Sports style — columns by phase, minimalist cards with flags and scores.",
        es: "Estilo ESPN/Apple Sports — columnas por fase, tarjetas minimalistas con banderas y marcadores.",
        fr: "Style ESPN/Apple Sports — colonnes par phase, cartes minimalistes avec drapeaux et scores.",
      },
    },
    {
      id: "radial",
      label: "03",
      title: {
        pt: "Radial Concêntrico",
        en: "Concentric Radial",
        es: "Radial Concéntrico",
        fr: "Radial Concentrique",
      },
      desc: {
        pt: "Arcos concêntricos: R32 na borda, Final no centro. Statement visual único.",
        en: "Concentric arcs: R32 on the outer ring, Final at the center. A unique visual statement.",
        es: "Arcos concéntricos: R32 en el borde, Final en el centro. Declaración visual única.",
        fr: "Arcs concentriques: R32 en bordure, Finale au centre. Déclaration visuelle unique.",
      },
    },
    {
      id: "cinematico",
      label: "04",
      title: {
        pt: "Cinemático Escuro",
        en: "Cinematic Dark",
        es: "Cinemático Oscuro",
        fr: "Cinématique Sombre",
      },
      desc: {
        pt: "Paleta dark cosmic, bandeiras com glow nos vencedores, eliminados em opacidade baixa.",
        en: "Dark cosmic palette, flags with glow on winners, eliminated teams at low opacity.",
        es: "Paleta dark cósmica, banderas con glow en ganadores, eliminados con baja opacidad.",
        fr: "Palette sombre cosmique, drapeaux brillants pour les vainqueurs, éliminés en faible opacité.",
      },
    },
    {
      id: "timeline",
      label: "05",
      title: {
        pt: "Timeline de Fases",
        en: "Phase Timeline",
        es: "Línea de Tiempo de Fases",
        fr: "Chronologie des Phases",
      },
      desc: {
        pt: "Colunas adjacentes por fase, cada coluna com cor própria — leitura linear da esquerda pra direita.",
        en: "Adjacent columns by phase, each with its own color — linear left-to-right reading flow.",
        es: "Columnas adyacentes por fase con color propio — lectura lineal de izquierda a derecha.",
        fr: "Colonnes adjacentes par phase avec couleur propre — lecture linéaire de gauche à droite.",
      },
    },
  ];

  return (
    <div style={{ marginTop: 32, marginBottom: 80 }}>
      {/* Header */}
      <header style={{ textAlign: "center", marginBottom: 40 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "var(--bg-soft)",
            border: "1px solid var(--line)",
            borderRadius: 20,
            padding: "4px 14px",
            marginBottom: 16,
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
            Página de Teste Interna · Internal Test Page · Página de Prueba · Page de Test
          </span>
        </div>
        <h1
          style={{
            fontSize: "clamp(28px, 5vw, 48px)",
            fontFamily: "var(--ff-display)",
            fontWeight: 800,
            letterSpacing: "var(--letterspacing-display)",
            lineHeight: 1.1,
            color: "var(--fg)",
            margin: "0 0 12px",
          }}
        >
          Chaveamento · Bracket · Cuadro · Tableau
        </h1>
        <p
          style={{
            fontSize: 15,
            color: "var(--fg-mid)",
            maxWidth: 540,
            margin: "0 auto",
            lineHeight: 1.5,
          }}
        >
          5 variações visuais do bracket do mata-mata da Copa 2026.
          Dados reais — atualizados conforme os jogos são disputados.
        </p>
        <div
          style={{
            marginTop: 16,
            padding: "8px 14px",
            background: "color-mix(in srgb, var(--accent) 12%, transparent)",
            border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
            borderRadius: 8,
            display: "inline-block",
            fontSize: 11,
            fontFamily: "var(--ff-mono)",
            color: "var(--fg-mid)",
          }}
        >
          ⚠️ J74 (Alemanha×Paraguai) e J75 (Países Baixos×Marrocos) decididos nos
          pênaltis — resultado registrado em código pois o schema não armazena pen.
        </div>
      </header>

      {/* Quick nav */}
      <nav
        aria-label="Variações"
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          justifyContent: "center",
          marginBottom: 48,
        }}
      >
        {variacoes.map((v) => (
          <a
            key={v.id}
            href={`#variacao-${v.id}`}
            style={{
              fontSize: 12,
              fontFamily: "var(--ff-mono)",
              color: "var(--primary)",
              textDecoration: "none",
              padding: "6px 12px",
              border: "1px solid var(--primary)",
              borderRadius: 20,
              letterSpacing: "0.04em",
            }}
          >
            {v.label} {v.title.pt}
          </a>
        ))}
      </nav>

      {/* Variação 1: Clássico */}
      <section
        id="variacao-classico"
        style={{
          marginBottom: 72,
          paddingTop: 24,
          borderTop: "2px solid var(--line)",
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 11,
              fontFamily: "var(--ff-mono)",
              color: "var(--fg-muted)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Variação 01 · Variation 01
          </div>
          <h2
            style={{
              fontSize: "clamp(20px, 3vw, 30px)",
              fontFamily: "var(--ff-display)",
              fontWeight: 800,
              margin: "0 0 8px",
              color: "var(--fg)",
              letterSpacing: "var(--letterspacing-display)",
            }}
          >
            Clássico Horizontal Split · Classic Horizontal Split
          </h2>
          <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>
            PT: {variacoes[0].desc.pt}
            {" · "}
            EN: {variacoes[0].desc.en}
          </p>
        </div>
        <VariacaoClassico bracket={bracket} />
      </section>

      {/* Variação 2: Vertical Moderno */}
      <section
        id="variacao-moderno"
        style={{
          marginBottom: 72,
          paddingTop: 24,
          borderTop: "2px solid var(--line)",
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 11,
              fontFamily: "var(--ff-mono)",
              color: "var(--fg-muted)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Variação 02 · Variation 02
          </div>
          <h2
            style={{
              fontSize: "clamp(20px, 3vw, 30px)",
              fontFamily: "var(--ff-display)",
              fontWeight: 800,
              margin: "0 0 8px",
              color: "var(--fg)",
              letterSpacing: "var(--letterspacing-display)",
            }}
          >
            Vertical Compacto Moderno · Modern Compact Vertical
          </h2>
          <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>
            PT: {variacoes[1].desc.pt}
            {" · "}
            EN: {variacoes[1].desc.en}
          </p>
        </div>
        <VariacaoVerticalModerno bracket={bracket} />
      </section>

      {/* Variação 3: Radial */}
      <section
        id="variacao-radial"
        style={{
          marginBottom: 72,
          paddingTop: 24,
          borderTop: "2px solid var(--line)",
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 11,
              fontFamily: "var(--ff-mono)",
              color: "var(--fg-muted)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Variação 03 · Variation 03
          </div>
          <h2
            style={{
              fontSize: "clamp(20px, 3vw, 30px)",
              fontFamily: "var(--ff-display)",
              fontWeight: 800,
              margin: "0 0 8px",
              color: "var(--fg)",
              letterSpacing: "var(--letterspacing-display)",
            }}
          >
            Radial Concêntrico · Concentric Radial
          </h2>
          <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>
            PT: {variacoes[2].desc.pt}
            {" · "}
            EN: {variacoes[2].desc.en}
          </p>
        </div>
        <VariacaoRadial bracket={bracket} />
      </section>

      {/* Variação 4: Cinemático */}
      <section
        id="variacao-cinematico"
        style={{
          marginBottom: 72,
          paddingTop: 24,
          borderTop: "2px solid var(--line)",
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 11,
              fontFamily: "var(--ff-mono)",
              color: "var(--fg-muted)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Variação 04 · Variation 04
          </div>
          <h2
            style={{
              fontSize: "clamp(20px, 3vw, 30px)",
              fontFamily: "var(--ff-display)",
              fontWeight: 800,
              margin: "0 0 8px",
              color: "var(--fg)",
              letterSpacing: "var(--letterspacing-display)",
            }}
          >
            Cinemático Escuro · Cinematic Dark
          </h2>
          <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>
            PT: {variacoes[3].desc.pt}
            {" · "}
            EN: {variacoes[3].desc.en}
          </p>
        </div>
        <VariacaoCinematica bracket={bracket} />
      </section>

      {/* Variação 5: Timeline */}
      <section
        id="variacao-timeline"
        style={{
          marginBottom: 72,
          paddingTop: 24,
          borderTop: "2px solid var(--line)",
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 11,
              fontFamily: "var(--ff-mono)",
              color: "var(--fg-muted)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Variação 05 · Variation 05
          </div>
          <h2
            style={{
              fontSize: "clamp(20px, 3vw, 30px)",
              fontFamily: "var(--ff-display)",
              fontWeight: 800,
              margin: "0 0 8px",
              color: "var(--fg)",
              letterSpacing: "var(--letterspacing-display)",
            }}
          >
            Timeline de Fases · Phase Timeline
          </h2>
          <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>
            PT: {variacoes[4].desc.pt}
            {" · "}
            EN: {variacoes[4].desc.en}
          </p>
        </div>
        <VariacaoTimeline bracket={bracket} />
      </section>

      {/* Footer note */}
      <footer
        style={{
          textAlign: "center",
          padding: "24px",
          background: "var(--bg-soft)",
          borderRadius: 12,
          border: "1px solid var(--line)",
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontFamily: "var(--ff-mono)",
            color: "var(--fg-muted)",
            margin: 0,
            letterSpacing: "0.06em",
          }}
        >
          Página interna de teste · Internal test page · Página interna de prueba · Page de test interne
          <br />
          noindex · não listada · not listed · no indexada · non répertoriée
        </p>
      </footer>
    </div>
  );
}
