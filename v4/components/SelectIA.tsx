"use client";

import { useEffect, useRef, useState } from "react";
import IconeIA from "@/components/IconeIA";
import { scorePopularidade } from "@/lib/ias";

export type OpcaoIA = {
  slug: string;
  nome: string; // ex.: "ChatGPT 5 Thinking (via Web)"
  extra?: string; // ex.: "→ 2×1" ou "104 jogos"
};

function separarNome(nome: string): { produto: string; modelo: string } {
  // remove "(via Web)" / "(legacy)" etc do fim
  const sem = nome.replace(/\s*\([^)]*\)\s*$/, "").trim();
  // separa primeira palavra como produto, resto como modelo
  const partes = sem.split(/\s+/);
  if (partes.length === 1) return { produto: partes[0], modelo: "" };
  const produto = partes[0];
  const modelo = partes.slice(1).join(" ");
  return { produto, modelo };
}

export default function SelectIA({
  opcoes,
  valor,
  onChange,
  placeholder,
}: {
  opcoes: OpcaoIA[];
  valor: string;
  onChange: (slug: string) => void;
  placeholder?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickFora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAberto(false);
      }
    }
    if (aberto) document.addEventListener("mousedown", onClickFora);
    return () => document.removeEventListener("mousedown", onClickFora);
  }, [aberto]);

  const ordenadas = [...opcoes].sort(
    (a, b) => scorePopularidade(a.slug) - scorePopularidade(b.slug),
  );

  const selecionada = ordenadas.find((o) => o.slug === valor);

  return (
    <div ref={ref} className="select-ia">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="select-ia-trigger"
      >
        {selecionada ? (
          <SelectIARow opcao={selecionada} />
        ) : (
          <span className="select-ia-placeholder">
            {placeholder ?? "Escolher IA…"}
          </span>
        )}
        <span style={{ marginLeft: "auto", opacity: 0.5, fontSize: 12 }}>
          ▾
        </span>
      </button>

      {aberto && (
        <div className="select-ia-dropdown" role="listbox">
          {ordenadas.map((o) => (
            <button
              key={o.slug}
              type="button"
              onClick={() => {
                onChange(o.slug);
                setAberto(false);
              }}
              className={`select-ia-opt ${valor === o.slug ? "is-current" : ""}`}
              role="option"
              aria-selected={valor === o.slug}
            >
              <SelectIARow opcao={o} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SelectIARow({ opcao }: { opcao: OpcaoIA }) {
  const { produto, modelo } =
    opcao.slug === "bola-de-cristal"
      ? { produto: "Bola de Cristal", modelo: "" }
      : separarNome(opcao.nome);
  return (
    <div className="select-ia-row">
      {opcao.slug === "bola-de-cristal" ? (
        <span className="select-ia-emoji">🔮</span>
      ) : (
        <IconeIA slug={opcao.slug} size={24} />
      )}
      <div className="select-ia-texto">
        <span className="select-ia-produto">{produto}</span>
        {modelo && (
          <span className="select-ia-modelo"> ({modelo})</span>
        )}
      </div>
      {opcao.extra && <span className="select-ia-extra">{opcao.extra}</span>}
    </div>
  );
}
