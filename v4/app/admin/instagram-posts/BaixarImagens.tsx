"use client";

import { useState } from "react";

export function BaixarImagens({
  images,
  nomeBase,
}: {
  images: string[];
  nomeBase: string;
}) {
  const [estado, setEstado] = useState<"idle" | "baixando" | "ok">("idle");
  const [progresso, setProgresso] = useState(0);

  if (images.length === 0) return null;
  const varias = images.length > 1;

  async function baixarUma(url: string, nome: string) {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const blob = await resp.blob();
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objUrl;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objUrl);
  }

  async function baixarTodas() {
    setEstado("baixando");
    setProgresso(0);
    for (let i = 0; i < images.length; i++) {
      const url = images[i];
      const ext = (url.split("/").pop() ?? "img.png")
        .split("?")[0]
        .split(".")
        .pop();
      const nome = varias
        ? `${nomeBase}-${String(i + 1).padStart(2, "0")}.${ext}`
        : `${nomeBase}.${ext}`;
      try {
        await baixarUma(url, nome);
      } catch {
        // Fallback: abre numa aba se o fetch/CORS falhar.
        window.open(url, "_blank", "noopener");
      }
      setProgresso(i + 1);
      // Espaça os downloads pro navegador não bloquear o "multiple downloads".
      if (i < images.length - 1) await new Promise((r) => setTimeout(r, 350));
    }
    setEstado("ok");
    setTimeout(() => setEstado("idle"), 2500);
  }

  const label =
    estado === "baixando"
      ? `Baixando ${progresso}/${images.length}…`
      : estado === "ok"
        ? "✓ Baixadas!"
        : varias
          ? `⬇ Baixar todas (${images.length})`
          : "⬇ Baixar imagem";

  return (
    <button
      onClick={baixarTodas}
      disabled={estado === "baixando"}
      className="ig-action-btn ig-action-dl"
      title={
        varias
          ? `Baixa as ${images.length} imagens em resolução cheia`
          : "Baixa a imagem em resolução cheia"
      }
      style={{
        background:
          estado === "ok"
            ? "color-mix(in srgb, #22c55e 18%, transparent)"
            : undefined,
        borderColor:
          estado === "ok"
            ? "color-mix(in srgb, #22c55e 50%, transparent)"
            : undefined,
        color: estado === "ok" ? "#16a34a" : undefined,
        cursor: estado === "baixando" ? "wait" : "pointer",
      }}
    >
      {label}
    </button>
  );
}
