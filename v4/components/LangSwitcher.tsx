"use client";

import { useEffect, useRef, useState } from "react";
import { LOCALES, LOCALE_FLAGS, LOCALE_NOMES, type Locale } from "@/lib/i18n";

export default function LangSwitcher({ atual }: { atual: Locale }) {
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

  function trocar(novo: Locale) {
    setAberto(false);
    if (novo === atual) return;
    document.cookie = `v4-lang=${novo}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    window.location.reload();
  }

  return (
    <div ref={ref} className="lang-switcher">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="lang-trigger"
        aria-label={`Idioma: ${LOCALE_NOMES[atual]}. Trocar.`}
        title={LOCALE_NOMES[atual]}
        aria-haspopup="listbox"
        aria-expanded={aberto}
      >
        <span style={{ fontSize: 22, lineHeight: 1 }}>
          {LOCALE_FLAGS[atual]}
        </span>
        <span style={{ fontSize: 10, opacity: 0.6 }}>▾</span>
      </button>

      {aberto && (
        <div className="lang-dropdown" role="listbox">
          {LOCALES.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => trocar(l)}
              className={`lang-opt ${l === atual ? "is-current" : ""}`}
              role="option"
              aria-selected={l === atual}
            >
              <span style={{ fontSize: 22, lineHeight: 1 }}>
                {LOCALE_FLAGS[l]}
              </span>
              <span className="lang-opt-nome">{LOCALE_NOMES[l]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
