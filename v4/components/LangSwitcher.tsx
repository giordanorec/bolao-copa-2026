"use client";

import { LOCALES, LOCALE_FLAGS, LOCALE_NOMES, type Locale } from "@/lib/i18n";

export default function LangSwitcher({ atual }: { atual: Locale }) {
  function trocar(novo: Locale) {
    if (novo === atual) return;
    document.cookie = `v4-lang=${novo}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    window.location.reload();
  }
  return (
    <div className="lang-switcher-footer" aria-label="Idioma">
      {LOCALES.map((l) => (
        <button
          key={l}
          onClick={() => trocar(l)}
          className={l === atual ? "is-current" : ""}
          title={LOCALE_NOMES[l]}
          aria-label={LOCALE_NOMES[l]}
        >
          <span style={{ fontSize: 16 }}>{LOCALE_FLAGS[l]}</span>
          <span style={{ fontSize: 12, fontWeight: 600 }}>
            {l.toUpperCase()}
          </span>
        </button>
      ))}
    </div>
  );
}
