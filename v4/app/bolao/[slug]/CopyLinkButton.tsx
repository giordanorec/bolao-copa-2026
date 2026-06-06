"use client";

import { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";

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
    <div className="flex gap-2">
      <button onClick={copy} className="btn btn-ghost text-sm py-2 px-4">
        {copied ? <Check size={16} /> : <Copy size={16} />}
        {copied ? "Copiado" : "Copiar link"}
      </button>
      <button
        onClick={whatsapp}
        className="btn btn-ghost text-sm py-2 px-4 hover:bg-green-50 hover:border-green-500 hover:text-green-700"
      >
        <Share2 size={16} /> WhatsApp
      </button>
    </div>
  );
}
