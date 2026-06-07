"use client";

import { useEffect, useRef, useState } from "react";
import { TEMAS, TEMA_DEFAULT, type TemaSlug } from "@/lib/temas";

export default function TemaSwitcher({ atual }: { atual: TemaSlug }) {
  const [aberto, setAberto] = useState(false);
  const [sel, setSel] = useState<TemaSlug>(atual ?? TEMA_DEFAULT);
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

  function escolher(slug: TemaSlug) {
    setSel(slug);
    // cookie 1 ano
    document.cookie = `v4-tema=${slug}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    // aplica imediato sem reload
    document.body.dataset.theme = slug;
    setAberto(false);
  }

  const temaAtual = TEMAS.find((t) => t.slug === sel) ?? TEMAS[0];

  return (
    <div ref={ref} className="tema-switcher">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="tema-trigger"
        aria-label={`Tema: ${temaAtual.nome}. Trocar.`}
        title={`Tema: ${temaAtual.nome}`}
      >
        <span className="tema-swatch" aria-hidden>
          <span style={{ background: temaAtual.swatch[0] }} />
          <span style={{ background: temaAtual.swatch[1] }} />
          <span style={{ background: temaAtual.swatch[2] }} />
        </span>
        <span style={{ fontSize: 11, opacity: 0.6, marginLeft: 2 }}>▾</span>
      </button>

      {aberto && (
        <div className="tema-dropdown" role="listbox">
          <div className="tema-dropdown-titulo">Tema visual</div>
          <div className="tema-dropdown-grid">
            {TEMAS.map((t) => (
              <button
                key={t.slug}
                onClick={() => escolher(t.slug)}
                className={`tema-opt ${sel === t.slug ? "is-current" : ""}`}
                role="option"
                aria-selected={sel === t.slug}
                title={t.nome}
              >
                <span className="tema-swatch tema-swatch-lg" aria-hidden>
                  <span style={{ background: t.swatch[0] }} />
                  <span style={{ background: t.swatch[1] }} />
                  <span style={{ background: t.swatch[2] }} />
                </span>
                <span className="tema-opt-label">
                  <span className="tema-opt-emoji">{t.emoji}</span>
                  <span className="tema-opt-nome">{t.nome}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
