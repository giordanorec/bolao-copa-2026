"use client";

import { useState } from "react";

type Props = {
  url: string;
  texto: string;
  locale?: "pt" | "en" | "es" | "fr";
  variante?: "inline" | "stack";
};

export default function ShareButtons({
  url,
  texto,
  locale = "pt",
  variante = "inline",
}: Props) {
  const [copiado, setCopiado] = useState(false);
  const urlFull = url.startsWith("http")
    ? url
    : typeof window !== "undefined"
      ? `${window.location.origin}${url}`
      : url;

  const tx = {
    whatsapp: locale === "en" ? "WhatsApp" : "WhatsApp",
    instagram:
      locale === "en" ? "Copy for Instagram"
      : locale === "es" ? "Copiar p/ Instagram"
      : locale === "fr" ? "Copier p/ Instagram"
      : "Copiar pra Instagram",
    link:
      locale === "en" ? "Copy link"
      : locale === "es" ? "Copiar enlace"
      : locale === "fr" ? "Copier le lien"
      : "Copiar link",
    copiado:
      locale === "en" ? "Copied!"
      : locale === "es" ? "¡Copiado!"
      : locale === "fr" ? "Copié !"
      : "Copiado!",
    share:
      locale === "en" ? "Share"
      : locale === "es" ? "Compartir"
      : locale === "fr" ? "Partager"
      : "Compartilhar",
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${texto}\n\n${urlFull}`)}`;

  async function copiar(conteudo: string) {
    try {
      await navigator.clipboard.writeText(conteudo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = conteudo;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    }
  }

  async function shareNativo() {
    if (navigator.share) {
      try {
        await navigator.share({ title: texto, text: texto, url: urlFull });
      } catch {}
    } else {
      copiar(`${texto}\n${urlFull}`);
    }
  }

  return (
    <div className={`share-buttons ${variante}`}>
      <button
        type="button"
        onClick={shareNativo}
        className="btn-share btn-share-native"
        aria-label={tx.share}
      >
        <span>📤</span>
        {tx.share}
      </button>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-share btn-share-whatsapp"
      >
        <span>💬</span>
        {tx.whatsapp}
      </a>
      <button
        type="button"
        onClick={() => copiar(`${texto}\n\n${urlFull}\n\n#BolaoDasIAs #Copa2026`)}
        className="btn-share btn-share-insta"
      >
        <span>📸</span>
        {tx.instagram}
      </button>
      <button
        type="button"
        onClick={() => copiar(urlFull)}
        className={`btn-share btn-share-link ${copiado ? "copiado" : ""}`}
      >
        <span>{copiado ? "✓" : "🔗"}</span>
        {copiado ? tx.copiado : tx.link}
      </button>
    </div>
  );
}
