"use client";

/**
 * BracketClient — vertical mobile-first knockout bracket.
 *
 * Layout: five sections stacked top-to-bottom.
 *   1. R32 — 16-AVOS DE FINAL (16 games, 2-col grid)
 *   2. Oitavas de Final      (8 games, 2-col grid)
 *   3. Quartas de Final      (4 games, 2-col grid)
 *   4. Semifinal             (2 games, 1-col)
 *   5. Final + Trophy        (1 game, centered)
 *
 * Each game is an HTML card (not SVG). No complex animations —
 * just static state showing the current bracket. Fast and reliable on mobile.
 */

// ─── Types ─────────────────────────────────────────────────────────────────────

export type SlotTime = {
  nome: string;
  iso?: string;
  eliminado?: boolean;
  vencedor?: boolean;
};

export type Confronto = {
  numero: number;
  timeA: SlotTime;
  timeB: SlotTime;
  gols_a: number | null;
  gols_b: number | null;
  vencedor: "a" | "b" | null;
  hasPenaltyNote: boolean;
  data: string;
  hora: string;
};

type Props = {
  r32: Confronto[];       // 16 games, J73-J88
  oitavas: Confronto[];   // 8 games, J89-J96
  quartas: Confronto[];   // 4 games, J97-J100
  semis: Confronto[];     // 2 games, J101-J102
  final: Confronto;       // 1 game, J104
  terceiro: Confronto;    // 1 game, J103
};

// ─── Country colors ─────────────────────────────────────────────────────────

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
  "Bósnia-Herzegovina": "#002395",
  "Congo (RD)": "#007FFF",
  "Cabo Verde": "#003893",
  Gana: "#006B3F",
  Egito: "#CE1126",
  Argélia: "#006233",
  Áustria: "#ED2939",
};

function teamColor(nome: string): string {
  return COUNTRY_COLOR[nome] ?? "#8B7355";
}

function isPlaceholder(nome: string): boolean {
  return !nome || nome.startsWith("Venc.") || nome.startsWith("Perd.");
}

function shortName(nome: string, max = 14): string {
  if (isPlaceholder(nome)) return "?";
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

// ─── Flag image component ────────────────────────────────────────────────────

function FlagImg({
  iso,
  nome,
  size,
}: {
  iso?: string;
  nome: string;
  size: number;
}) {
  const unknown = isPlaceholder(nome);
  const style: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    objectFit: "cover",
    flexShrink: 0,
    display: "inline-block",
    background: "rgba(255,255,255,0.06)",
    boxShadow: unknown ? "none" : "0 0 0 1.5px rgba(255,255,255,0.15)",
  };

  if (unknown || !iso) {
    return (
      <span
        style={{
          ...style,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: size * 0.45,
          color: "rgba(255,255,255,0.22)",
        }}
        aria-hidden
      >
        ?
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://hatscripts.github.io/circle-flags/flags/${iso}.svg`}
      alt={nome}
      title={nome}
      width={size}
      height={size}
      style={style}
      loading="lazy"
    />
  );
}

// ─── Team row within a card ──────────────────────────────────────────────────

function TeamRow({
  slot,
  score,
  isWinner,
  isLoser,
  showScore,
  hasPenaltyNote,
  isBig,
}: {
  slot: SlotTime;
  score: number | null;
  isWinner: boolean;
  isLoser: boolean;
  showScore: boolean;
  hasPenaltyNote?: boolean;
  isBig?: boolean;
}) {
  const unknown = isPlaceholder(slot.nome);
  const color = teamColor(slot.nome);
  const flagSize = isBig ? 42 : 36;

  const rowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: isBig ? "10px 14px" : "8px 12px",
    borderLeft: isWinner && !unknown ? `4px solid ${color}` : "4px solid transparent",
    opacity: isLoser ? 0.55 : 1,
    transition: "opacity 0.2s",
    minHeight: isBig ? 58 : 50,
  };

  const nameStyle: React.CSSProperties = {
    flex: 1,
    fontSize: isBig ? 16 : 14,
    fontWeight: isWinner ? 700 : 400,
    color: isWinner && !unknown
      ? (slot.nome === "Brasil" ? "#4ADE80" : "#ffffff")
      : "rgba(255,255,255,0.82)",
    fontFamily: "system-ui, -apple-system, sans-serif",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    lineHeight: 1.2,
  };

  const scoreStyle: React.CSSProperties = {
    fontSize: isBig ? 20 : 17,
    fontWeight: 800,
    fontFamily: "ui-monospace, monospace",
    color: isWinner ? "#FFD700" : "rgba(255,255,255,0.5)",
    minWidth: isBig ? 28 : 22,
    textAlign: "right",
    flexShrink: 0,
  };

  const scoreText = !showScore
    ? "—"
    : hasPenaltyNote
    ? `${score}*`
    : `${score}`;

  return (
    <div style={rowStyle}>
      <FlagImg iso={slot.iso} nome={slot.nome} size={flagSize} />
      <span style={nameStyle} title={slot.nome}>
        {unknown ? <span style={{ opacity: 0.35 }}>A definir</span> : shortName(slot.nome)}
      </span>
      <span style={scoreStyle}>{scoreText}</span>
    </div>
  );
}

// ─── Divider between the two team rows ──────────────────────────────────────

function Divider() {
  return (
    <div
      style={{
        height: 1,
        background: "rgba(255,255,255,0.07)",
        margin: "0 12px",
      }}
    />
  );
}

// ─── Game card ───────────────────────────────────────────────────────────────

function GameCard({
  c,
  isBig = false,
}: {
  c: Confronto;
  isBig?: boolean;
}) {
  const decided = c.vencedor !== null;
  const showScore = c.gols_a !== null && c.gols_b !== null;

  const isWinnerA = decided && c.vencedor === "a";
  const isWinnerB = decided && c.vencedor === "b";
  const isLoserA = decided && c.vencedor === "b";
  const isLoserB = decided && c.vencedor === "a";

  const cardStyle: React.CSSProperties = {
    background: "#111827",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10,
    overflow: "hidden",
    boxShadow: isBig
      ? "0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,215,0,0.12)"
      : "0 2px 8px rgba(0,0,0,0.3)",
    ...(isBig && {
      boxShadow:
        "0 4px 24px rgba(0,0,0,0.6), 0 0 0 1.5px rgba(255,215,0,0.2)",
    }),
  };

  return (
    <div style={cardStyle} aria-label={`Jogo ${c.numero}: ${c.timeA.nome} vs ${c.timeB.nome}`}>
      <TeamRow
        slot={c.timeA}
        score={c.gols_a}
        isWinner={isWinnerA}
        isLoser={isLoserA}
        showScore={showScore}
        hasPenaltyNote={c.hasPenaltyNote && isWinnerA}
        isBig={isBig}
      />
      <Divider />
      <TeamRow
        slot={c.timeB}
        score={c.gols_b}
        isWinner={isWinnerB}
        isLoser={isLoserB}
        showScore={showScore}
        hasPenaltyNote={c.hasPenaltyNote && isWinnerB}
        isBig={isBig}
      />
      {c.hasPenaltyNote && (
        <div
          style={{
            fontSize: 10,
            color: "rgba(255,215,0,0.55)",
            textAlign: "right",
            padding: "2px 12px 4px",
            fontFamily: "ui-monospace, monospace",
          }}
        >
          * pênaltis
        </div>
      )}
    </div>
  );
}

// ─── Phase section ───────────────────────────────────────────────────────────

const PHASE_LABELS: Record<string, { pt: string; en: string; es: string; fr: string }> = {
  r32: {
    pt: "R32 · 16-AVOS DE FINAL",
    en: "R32 · ROUND OF 32",
    es: "R32 · DIECISEISAVOS",
    fr: "R32 · SEIZIÈMES DE FINALE",
  },
  oitavas: {
    pt: "OITAVAS DE FINAL",
    en: "ROUND OF 16",
    es: "OCTAVOS DE FINAL",
    fr: "HUITIÈMES DE FINALE",
  },
  quartas: {
    pt: "QUARTAS DE FINAL",
    en: "QUARTER-FINALS",
    es: "CUARTOS DE FINAL",
    fr: "QUARTS DE FINALE",
  },
  semis: {
    pt: "SEMIFINAIS",
    en: "SEMI-FINALS",
    es: "SEMIFINALES",
    fr: "DEMI-FINALES",
  },
  terceiro: {
    pt: "3º LUGAR",
    en: "3RD PLACE",
    es: "3.er LUGAR",
    fr: "3e PLACE",
  },
  final: {
    pt: "FINAL",
    en: "FINAL",
    es: "FINAL",
    fr: "FINALE",
  },
};

function PhaseHeader({ phaseKey }: { phaseKey: keyof typeof PHASE_LABELS }) {
  const labels = PHASE_LABELS[phaseKey];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 12,
      }}
    >
      <div
        style={{
          height: 2,
          flex: 1,
          background: "rgba(255,215,0,0.2)",
          borderRadius: 1,
        }}
      />
      <div style={{ flexShrink: 0, textAlign: "center" }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 2,
            color: "#FFD700",
            fontFamily: "ui-monospace, monospace",
            textTransform: "uppercase",
          }}
          lang="pt"
        >
          {labels.pt}
        </span>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 2 }}>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: "ui-monospace, monospace" }} lang="en">{labels.en}</span>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>·</span>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: "ui-monospace, monospace" }} lang="es">{labels.es}</span>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>·</span>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: "ui-monospace, monospace" }} lang="fr">{labels.fr}</span>
        </div>
      </div>
      <div
        style={{
          height: 2,
          flex: 1,
          background: "rgba(255,215,0,0.2)",
          borderRadius: 1,
        }}
      />
    </div>
  );
}

// ─── Grid layouts ─────────────────────────────────────────────────────────────

function TwoColGrid({ games }: { games: Confronto[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: 8,
      }}
    >
      {games.map((c) => (
        <GameCard key={c.numero} c={c} />
      ))}
    </div>
  );
}

function OneColGrid({ games, isBig = false }: { games: Confronto[]; isBig?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {games.map((c) => (
        <GameCard key={c.numero} c={c} isBig={isBig} />
      ))}
    </div>
  );
}

// ─── Trophy decoration ────────────────────────────────────────────────────────

function Trophy() {
  return (
    <div
      style={{
        textAlign: "center",
        marginBottom: 16,
      }}
    >
      <div
        style={{
          fontSize: 90,
          lineHeight: 1,
          filter:
            "drop-shadow(0 0 20px rgba(255,215,0,0.7)) drop-shadow(0 0 50px rgba(255,215,0,0.4))",
          display: "inline-block",
        }}
        role="img"
        aria-label="Troféu"
      >
        🏆
      </div>
      <div
        style={{
          marginTop: 8,
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 4,
          color: "#FFD700",
          fontFamily: "ui-monospace, monospace",
          textTransform: "uppercase",
          opacity: 0.75,
        }}
      >
        CAMPEÃO MUNDIAL
      </div>
    </div>
  );
}

// ─── Arrow connector between phases ──────────────────────────────────────────

function PhaseConnector() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: 28,
        color: "rgba(255,215,0,0.3)",
        fontSize: 18,
      }}
      aria-hidden
    >
      ↓
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export default function BracketClient({
  r32,
  oitavas,
  quartas,
  semis,
  final,
  terceiro,
}: Props) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 700,
        margin: "0 auto",
        padding: "0 12px 64px",
        boxSizing: "border-box",
      }}
    >
      {/* ── R32 (16 games, 2 cols) ── */}
      <section style={{ marginBottom: 8 }}>
        <PhaseHeader phaseKey="r32" />
        <TwoColGrid games={r32} />
      </section>

      <PhaseConnector />

      {/* ── Oitavas (8 games, 2 cols) ── */}
      <section style={{ marginBottom: 8 }}>
        <PhaseHeader phaseKey="oitavas" />
        <TwoColGrid games={oitavas} />
      </section>

      <PhaseConnector />

      {/* ── Quartas (4 games, 2 cols) ── */}
      <section style={{ marginBottom: 8 }}>
        <PhaseHeader phaseKey="quartas" />
        <TwoColGrid games={quartas} />
      </section>

      <PhaseConnector />

      {/* ── Semis (2 games, 1 col) ── */}
      <section style={{ marginBottom: 8 }}>
        <PhaseHeader phaseKey="semis" />
        <OneColGrid games={semis} />
      </section>

      <PhaseConnector />

      {/* ── 3rd place ── */}
      <section style={{ marginBottom: 8 }}>
        <PhaseHeader phaseKey="terceiro" />
        <OneColGrid games={[terceiro]} />
      </section>

      <PhaseConnector />

      {/* ── Final + Trophy ── */}
      <section>
        <PhaseHeader phaseKey="final" />
        <Trophy />
        <div style={{ maxWidth: 420, margin: "0 auto" }}>
          <GameCard c={final} isBig={true} />
        </div>
      </section>
    </div>
  );
}
