"use client";

import Link from "next/link";
import { t, type Locale } from "@/lib/i18n";

/**
 * Barra horizontal de navegação principal — sempre visível abaixo do topo,
 * scrolável em mobile, inline em desktop. Pra os links principais não ficarem
 * escondidos no drawer.
 */
export default function HeaderNavBar({ locale }: { locale: Locale }) {
  const items: { href: string; emoji: string; label: string; destaque?: boolean }[] = [
    {
      href: "/retrospectiva",
      emoji: "✨",
      label: t(locale, "nav.retrospectiva"),
      destaque: true,
    },
    {
      href: "/jogos",
      emoji: "⚽",
      label: t(locale, "nav.jogos").replace(" ↗", ""),
    },
    {
      href: "/cristal",
      emoji: "🔮",
      label: t(locale, "nav.cristal").replace(" ↗", ""),
    },
    {
      href: "/predicoes-campeao",
      emoji: "👑",
      label:
        locale === "en"
          ? "Champion"
          : locale === "es"
            ? "Campeón"
            : locale === "fr"
              ? "Champion"
              : "Campeão",
    },
    {
      href: "/animacao-campeao",
      emoji: "🎬",
      label:
        locale === "en"
          ? "Animation"
          : locale === "es"
            ? "Animación"
            : locale === "fr"
              ? "Animation"
              : "Animação",
    },
    {
      href: "/ranking-ias",
      emoji: "🏆",
      label:
        locale === "en"
          ? "AI Ranking"
          : locale === "es"
            ? "Ranking IAs"
            : locale === "fr"
              ? "Classement"
              : "Ranking de IAs",
    },
    {
      href: "/ias-vs-humanos",
      emoji: "⚔️",
      label:
        locale === "en"
          ? "AIs × Humans"
          : locale === "es"
            ? "IAs × Humanos"
            : locale === "fr"
              ? "IA × Humains"
              : "IAs × Humanos",
    },
    {
      href: "/como-funciona",
      emoji: "📘",
      label: t(locale, "nav.como"),
    },
  ];

  return (
    <nav className="header-navbar" aria-label="Navegação principal">
      <div className="header-navbar-inner">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={`header-navbar-link${it.destaque ? " destaque" : ""}`}
            title={it.label}
          >
            <span className="header-navbar-emoji">{it.emoji}</span>
            <span>{it.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
