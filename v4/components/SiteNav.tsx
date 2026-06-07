"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import UserWidget from "@/components/UserWidget";
import MeusBoloesLink from "@/components/MeusBoloesLink";
import LangSwitcher from "@/components/LangSwitcher";
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
        <button
          className="site-nav-close"
          aria-label="Fechar menu"
          onClick={fechar}
        >
          ✕
        </button>
        <MeusBoloesLink onClick={fechar} locale={locale} />
        <Link href="/serie-a" onClick={fechar}>
          🏆 {locale === "en" ? "Premier League"
            : locale === "es" ? "Liga A"
            : locale === "fr" ? "Ligue A"
            : "Série A"}
        </Link>
        <Link href="/jogos" onClick={fechar}>
          {t(locale, "nav.jogos").replace(" ↗", "")}
        </Link>
        <Link href="/cristal" onClick={fechar}>
          {t(locale, "nav.cristal").replace(" ↗", "")}
        </Link>
        <Link href="/ias" onClick={fechar}>
          🤖 {locale === "en" ? "All 122"
            : locale === "es" ? "Las 122"
            : locale === "fr" ? "Les 122"
            : "As 122"}
        </Link>
        <Link href="/como-funciona" onClick={fechar}>
          {t(locale, "nav.como")}
        </Link>
        <UserWidget onNavigate={fechar} />
        <div className="site-nav-lang">
          <LangSwitcher atual={locale} />
        </div>
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
      <div className="header-lang-mobile">
        <LangSwitcher atual={locale} />
      </div>
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
