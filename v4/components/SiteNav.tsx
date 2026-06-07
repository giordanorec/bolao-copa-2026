"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import UserWidget from "@/components/UserWidget";
import MeusBoloesLink from "@/components/MeusBoloesLink";
import { t, type Locale } from "@/lib/i18n";

export default function SiteNav({ locale = "pt" }: { locale?: Locale }) {
  const [aberto, setAberto] = useState(false);
  const [montado, setMontado] = useState(false);

  useEffect(() => setMontado(true), []);

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

  const fechar = () => setAberto(false);

  // Drawer + backdrop renderizados no body (portal) para escapar
  // do containing block criado pelo backdrop-filter do .site-header.
  const drawer = (
    <>
      <nav className={`site-nav ${aberto ? "is-open" : ""}`}>
        <MeusBoloesLink onClick={fechar} locale={locale} />
        <a
          href="https://giordanorec.github.io/bolao-copa-2026/"
          target="_blank"
          rel="noopener noreferrer"
          onClick={fechar}
        >
          {t(locale, "nav.ranking")}
        </a>
        <a
          href="https://giordanorec.github.io/bolao-copa-2026/jogos.html"
          target="_blank"
          rel="noopener noreferrer"
          onClick={fechar}
        >
          {t(locale, "nav.jogos")}
        </a>
        <a
          href="https://giordanorec.github.io/bolao-copa-2026/cristal.html"
          target="_blank"
          rel="noopener noreferrer"
          onClick={fechar}
        >
          {t(locale, "nav.cristal")}
        </a>
        <Link href="/como-funciona" onClick={fechar}>
          {t(locale, "nav.como")}
        </Link>
        <UserWidget onNavigate={fechar} />
      </nav>

      {aberto && (
        <button
          className="nav-backdrop"
          aria-label="Fechar menu"
          onClick={fechar}
        />
      )}
    </>
  );

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

      {montado ? createPortal(drawer, document.body) : null}
    </>
  );
}
