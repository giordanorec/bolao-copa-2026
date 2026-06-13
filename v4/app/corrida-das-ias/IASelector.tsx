"use client";

import { useMemo, useState } from "react";
import { marcaDe } from "@/lib/ias";

export type IAOption = {
  slug: string;
  nome_display: string;
  pontos: number;
};

export default function IASelector({
  ias,
  selecionadas,
  onToggle,
  onAll,
  onClear,
  onTopN,
  modo,
}: {
  ias: IAOption[];
  selecionadas: Set<string>;
  onToggle: (slug: string) => void;
  onAll: () => void;
  onClear: () => void;
  onTopN: (n: number) => void;
  modo: "C" | "D";
}) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");

  // Agrupa por marca
  const porMarca = useMemo(() => {
    const grupos: Record<string, { cor: string; ias: IAOption[] }> = {};
    for (const ia of ias) {
      const marca = marcaDe(ia.slug);
      if (!grupos[marca.nome]) grupos[marca.nome] = { cor: marca.cor, ias: [] };
      grupos[marca.nome].ias.push(ia);
    }
    // Ordena cada grupo por pts desc
    for (const k of Object.keys(grupos)) {
      grupos[k].ias.sort((a, b) => b.pontos - a.pontos);
    }
    // Ordena os grupos por melhor IA do grupo
    return Object.entries(grupos).sort(
      (a, b) => (b[1].ias[0]?.pontos ?? 0) - (a[1].ias[0]?.pontos ?? 0),
    );
  }, [ias]);

  const filtradas = busca.trim()
    ? ias.filter((ia) =>
        ia.nome_display.toLowerCase().includes(busca.toLowerCase()),
      )
    : null;

  return (
    <div className="ias-selector">
      <div className="ias-selector-header">
        <button
          type="button"
          className="ias-selector-btn"
          onClick={() => setAberto((a) => !a)}
        >
          {aberto ? "🔽" : "🔼"} {selecionadas.size} de {ias.length} selecionadas
        </button>
        <div className="ias-selector-presets">
          <button onClick={onAll} className="ias-preset">Todas</button>
          <button onClick={() => onTopN(10)} className="ias-preset">Top 10</button>
          <button onClick={() => onTopN(25)} className="ias-preset">Top 25</button>
          <button onClick={onClear} className="ias-preset ias-preset-danger">Limpar</button>
        </div>
      </div>

      {aberto && (
        <div className="ias-selector-painel">
          <input
            type="text"
            placeholder="🔍 Buscar IA..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="ias-busca"
          />

          {filtradas ? (
            <div className="ias-grid">
              {filtradas.map((ia) => (
                <Checkbox
                  key={ia.slug}
                  ia={ia}
                  checked={selecionadas.has(ia.slug)}
                  onToggle={() => onToggle(ia.slug)}
                />
              ))}
            </div>
          ) : (
            porMarca.map(([nome, { cor, ias: grupo }]) => (
              <div key={nome} className="ias-grupo">
                <div className="ias-grupo-head" style={{ color: cor }}>
                  <strong>{nome}</strong>
                  <span className="ias-grupo-count">
                    {grupo.filter((i) => selecionadas.has(i.slug)).length}/{grupo.length}
                  </span>
                </div>
                <div className="ias-grid">
                  {grupo.map((ia) => (
                    <Checkbox
                      key={ia.slug}
                      ia={ia}
                      checked={selecionadas.has(ia.slug)}
                      onToggle={() => onToggle(ia.slug)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <style>{`
        .ias-selector {
          background: var(--bg-1);
          border: 1px solid var(--line);
          border-radius: var(--r-m);
          padding: 12px;
          margin-bottom: 14px;
        }
        .ias-selector-header {
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; flex-wrap: wrap;
        }
        .ias-selector-btn {
          background: var(--bg-2);
          border: 1px solid var(--line);
          padding: 8px 14px;
          font-weight: 700;
          font-size: 13px;
          color: var(--fg);
          border-radius: var(--r-s);
          cursor: pointer;
        }
        .ias-selector-presets {
          display: flex; gap: 6px;
        }
        .ias-preset {
          background: var(--bg-2);
          border: 1px solid var(--line);
          padding: 6px 12px;
          font-size: 11px; font-weight: 700;
          color: var(--fg-mid);
          border-radius: var(--r-s);
          cursor: pointer;
          font-family: var(--ff-mono);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .ias-preset:hover {
          background: var(--bg-soft);
          color: var(--fg);
        }
        .ias-preset-danger { color: var(--extra); }
        .ias-selector-painel {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid var(--line);
          max-height: 420px;
          overflow-y: auto;
        }
        .ias-busca {
          width: 100%;
          padding: 8px 12px;
          background: var(--bg-2);
          border: 1px solid var(--line);
          border-radius: var(--r-s);
          font-size: 13px;
          margin-bottom: 12px;
          color: var(--fg);
        }
        .ias-grupo {
          margin-bottom: 14px;
        }
        .ias-grupo-head {
          display: flex; justify-content: space-between; align-items: baseline;
          margin-bottom: 6px;
          font-family: var(--ff-mono);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .ias-grupo-count { color: var(--fg-muted); }
        .ias-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 4px;
        }
      `}</style>
    </div>
  );
}

function Checkbox({
  ia,
  checked,
  onToggle,
}: {
  ia: IAOption;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 8px",
        background: checked ? "var(--bg-soft)" : "transparent",
        borderRadius: 6,
        fontSize: 12,
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        style={{ accentColor: marcaDe(ia.slug).cor }}
      />
      <span
        style={{
          flex: 1,
          minWidth: 0,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          color: checked ? "var(--fg)" : "var(--fg-muted)",
        }}
        title={ia.nome_display}
      >
        {ia.nome_display}
      </span>
      <span
        style={{
          fontFamily: "var(--ff-mono)",
          fontSize: 10,
          color: "var(--fg-muted)",
          flexShrink: 0,
        }}
      >
        {ia.pontos}
      </span>
    </label>
  );
}
