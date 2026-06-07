"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import UserWidget from "@/components/UserWidget";
import { t, type Locale } from "@/lib/i18n";

export default function SiteNav({ locale = "pt" }: { locale?: Locale }) {
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setAberto(false);
    }
    document.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [aberto]);

  return (
    <>
      <button
        className="nav-hamburger"
        aria-label={aberto ? "Fechar menu" : "Abrir menu"}
        aria-expanded={aberto}
        onClick={() => setAberto((v) => !v)}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <nav className={`site-nav ${aberto ? "is-open" : ""}`}>
        <a
          href="https://giordanorec.github.io/bolao-copa-2026/"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setAberto(false)}
        >
          {t(locale, "nav.ranking")}
        </a>
        <a
          href="https://giordanorec.github.io/bolao-copa-2026/jogos.html"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setAberto(false)}
        >
          {t(locale, "nav.jogos")}
        </a>
        <a
          href="https://giordanorec.github.io/bolao-copa-2026/cristal.html"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setAberto(false)}
        >
          {t(locale, "nav.cristal")}
        </a>
        <Link href="/como-funciona" onClick={() => setAberto(false)}>
          {t(locale, "nav.como")}
        </Link>
        <UserWidget onNavigate={() => setAberto(false)} />
      </nav>

      {aberto && (
        <button
          className="nav-backdrop"
          aria-label="Fechar menu"
          onClick={() => setAberto(false)}
        />
      )}
    </>
  );
}
