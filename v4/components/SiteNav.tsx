"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import UserWidget from "@/components/UserWidget";
import MeusBoloesLink from "@/components/MeusBoloesLink";
import LangSwitcher from "@/components/LangSwitcher";
import TemaSwitcher from "@/components/TemaSwitcher";
import { t, type Locale } from "@/lib/i18n";
import type { TemaSlug } from "@/lib/temas";

export default function SiteNav({
  locale = "pt",
  tema = "airbnb",
}: {
  locale?: Locale;
  tema?: TemaSlug;
}) {
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

  // Drawer só contém os links de navegação. UserWidget e seletores ficam no
  // header (visíveis sempre).
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
        <Link href="/criar" onClick={fechar}>
          ➕{" "}
          {locale === "en"
            ? "New pool"
            : locale === "es"
              ? "Nueva polla"
              : locale === "fr"
                ? "Nouvelle cagnotte"
                : "Criar bolão"}
        </Link>
        <Link href="/perfil" onClick={fechar}>
          👤{" "}
          {locale === "en"
            ? "Profile"
            : locale === "es"
              ? "Perfil"
              : locale === "fr"
                ? "Profil"
                : "Meu perfil"}
        </Link>
        <Link href="/colaborar" onClick={fechar}>
          💛{" "}
          {locale === "en"
            ? "Support"
            : locale === "es"
              ? "Colaborar"
              : locale === "fr"
                ? "Soutenir"
                : "Apoiar"}
        </Link>
        <Link href="/como-funciona" onClick={fechar}>
          {t(locale, "nav.como")}
        </Link>
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
      <div className="header-tools">
        <Link href="/colaborar" className="header-colaborar" aria-label="Colaborar">
          <span aria-hidden>💛</span>
          <span className="header-colaborar-lbl">
            {locale === "en"
              ? "Support"
              : locale === "es"
                ? "Colaborar"
                : locale === "fr"
                  ? "Soutenir"
                  : "Colaborar"}
          </span>
        </Link>
        <LangSwitcher atual={locale} />
        <TemaSwitcher atual={tema} />
        <UserWidget onNavigate={fechar} />
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
      </div>

      {montado ? createPortal(drawer, document.body) : null}
    </>
  );
}
