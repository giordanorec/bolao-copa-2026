"use client";

import { useState } from "react";

function IconCopy() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function CopiarTexto({
  texto,
  label,
  compacto = false,
}: {
  texto: string;
  label: string;
  compacto?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = texto;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (compacto) {
    return (
      <button
        onClick={handleClick}
        className={`ig-icon-btn${copied ? " ok" : ""}`}
        title={label}
        aria-label={label}
      >
        {copied ? <IconCheck /> : <IconCopy />}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`ig-act${copied ? " ok" : ""}`}
      title={label}
    >
      {copied ? <IconCheck /> : <IconCopy />}
      <span>{copied ? "Copiado!" : label}</span>
    </button>
  );
}
