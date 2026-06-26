"use client";

import { useState } from "react";

export function CopiarLegenda({ caption }: { caption: string }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select a temp textarea
      const ta = document.createElement("textarea");
      ta.value = caption;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      onClick={handleClick}
      className="ig-action-btn"
      title="Copiar legenda para a área de transferência"
      style={{
        background: copied
          ? "color-mix(in srgb, #22c55e 18%, transparent)"
          : "var(--bg-soft)",
        borderColor: copied
          ? "color-mix(in srgb, #22c55e 50%, transparent)"
          : "var(--line)",
        color: copied ? "#16a34a" : "var(--fg-mid)",
        transition: "all .15s",
      }}
    >
      {copied ? "✓ Copiado!" : "Copiar legenda"}
    </button>
  );
}
