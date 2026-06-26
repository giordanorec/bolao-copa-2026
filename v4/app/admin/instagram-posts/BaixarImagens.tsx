"use client";

import { useState } from "react";

function IconDownload() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
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
        window.open(url, "_blank", "noopener");
      }
      setProgresso(i + 1);
      if (i < images.length - 1) await new Promise((r) => setTimeout(r, 350));
    }
    setEstado("ok");
    setTimeout(() => setEstado("idle"), 2500);
  }

  const label =
    estado === "baixando"
      ? `Baixando ${progresso}/${images.length}…`
      : estado === "ok"
        ? "Baixadas!"
        : varias
          ? `Baixar todas (${images.length})`
          : "Baixar imagem";

  return (
    <button
      onClick={baixarTodas}
      disabled={estado === "baixando"}
      className={`ig-act${estado === "ok" ? " ok" : ""}`}
      title={
        varias
          ? `Baixa as ${images.length} imagens em resolução cheia`
          : "Baixa a imagem em resolução cheia"
      }
      style={{ cursor: estado === "baixando" ? "wait" : "pointer" }}
    >
      {estado === "ok" ? <IconCheck /> : <IconDownload />}
      <span>{label}</span>
    </button>
  );
}
