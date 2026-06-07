"use client";

import { useState } from "react";

export default function CopyLinkButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  function url() {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/bolao/${slug}`;
  }

  async function copy() {
    await navigator.clipboard.writeText(url());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function whatsapp() {
    const text = encodeURIComponent(
      `Entra no meu bolão da Copa 2026! ⚽\n${url()}`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  return (
    <>
      <button onClick={copy} className="btn small">
        {copied ? "✓ Copiado" : "🔗 Copiar link"}
      </button>
      <button onClick={whatsapp} className="btn small">
        💬 WhatsApp
      </button>
    </>
  );
}
