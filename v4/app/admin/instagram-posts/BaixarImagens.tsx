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

function IconShare() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
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

function extDe(url: string, fallback: string) {
  const base = (url.split("/").pop() ?? "").split("?")[0];
  const e = base.includes(".") ? base.split(".").pop() : "";
  return e || fallback;
}

function mimeDe(ext: string) {
  const e = ext.toLowerCase();
  if (e === "mp4") return "video/mp4";
  if (e === "webm") return "video/webm";
  if (e === "jpg" || e === "jpeg") return "image/jpeg";
  return "image/png";
}

/**
 * "Baixar tudo" — num toque salva todas as imagens (e o vídeo, se for reel)
 * direto no rolo da câmera (Fotos) do iPhone via Web Share API nível 2.
 * No desktop (sem share de arquivos) cai pra download sequencial de blobs.
 */
export function BaixarImagens({
  images,
  nomeBase,
  video,
  tipo,
}: {
  images: string[];
  nomeBase: string;
  video?: string;
  tipo?: "reel" | "carrossel" | "card";
}) {
  const [estado, setEstado] = useState<"idle" | "baixando" | "ok" | "erro">("idle");
  const [progresso, setProgresso] = useState(0);
  const [podeShare, setPodeShare] = useState<boolean | null>(null);

  // Alvos: reel → só o vídeo; carrossel/card → as imagens (+ vídeo se houver).
  const isReel = tipo === "reel";
  const alvos: { url: string; nome: string }[] = [];
  if (isReel && video) {
    alvos.push({ url: video, nome: `${nomeBase}.mp4` });
  } else {
    const varias = images.length > 1;
    images.forEach((url, i) => {
      const ext = extDe(url, "png");
      alvos.push({
        url,
        nome: varias
          ? `${nomeBase}-${String(i + 1).padStart(2, "0")}.${ext}`
          : `${nomeBase}.${ext}`,
      });
    });
    if (video) alvos.push({ url: video, nome: `${nomeBase}.mp4` });
  }

  if (alvos.length === 0) return null;

  async function baixarBlob(url: string, nome: string) {
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

  async function baixarSequencial() {
    setEstado("baixando");
    setProgresso(0);
    for (let i = 0; i < alvos.length; i++) {
      try {
        await baixarBlob(alvos[i].url, alvos[i].nome);
      } catch {
        window.open(alvos[i].url, "_blank", "noopener");
      }
      setProgresso(i + 1);
      if (i < alvos.length - 1) await new Promise((r) => setTimeout(r, 350));
    }
    setEstado("ok");
    setTimeout(() => setEstado("idle"), 2500);
  }

  async function baixarTudo() {
    // Tenta o caminho do iPhone primeiro: baixar arquivos e abrir a folha de
    // compartilhamento, onde "Salvar imagens"/"Salvar vídeo" vai pro rolo.
    const nav = navigator as Navigator & {
      canShare?: (data?: ShareData) => boolean;
    };
    if (typeof nav.share === "function" && typeof nav.canShare === "function") {
      setEstado("baixando");
      setProgresso(0);
      try {
        const files: File[] = [];
        for (let i = 0; i < alvos.length; i++) {
          const resp = await fetch(alvos[i].url);
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          const blob = await resp.blob();
          const ext = extDe(alvos[i].url, "png");
          files.push(
            new File([blob], alvos[i].nome, { type: blob.type || mimeDe(ext) }),
          );
          setProgresso(i + 1);
        }
        if (nav.canShare({ files })) {
          await nav.share({ files, title: nomeBase });
          setEstado("ok");
          setTimeout(() => setEstado("idle"), 2500);
          return;
        }
        // canShare(files) deu falso → desktop: baixa sequencial.
        await baixarSequencial();
        return;
      } catch (err) {
        // Usuário cancelou a folha de compartilhamento.
        if (err instanceof DOMException && err.name === "AbortError") {
          setEstado("idle");
          return;
        }
        // Perdeu o gesto / share falhou → tenta download direto.
        await baixarSequencial();
        return;
      }
    }
    // Sem Web Share: download sequencial.
    await baixarSequencial();
  }

  // Detecta capacidade de share de arquivos só pra ajustar o ícone/título.
  if (podeShare === null && typeof window !== "undefined") {
    const nav = navigator as Navigator & {
      canShare?: (data?: ShareData) => boolean;
    };
    setPodeShare(
      typeof nav.share === "function" && typeof nav.canShare === "function",
    );
  }

  const nItens = alvos.length;
  const baseLabel = isReel
    ? "Salvar vídeo"
    : nItens > 1
      ? `Baixar tudo (${nItens})`
      : "Baixar imagem";

  const label =
    estado === "baixando"
      ? podeShare
        ? `Preparando ${progresso}/${nItens}…`
        : `Baixando ${progresso}/${nItens}…`
      : estado === "ok"
        ? podeShare
          ? "Pronto!"
          : "Baixado!"
        : baseLabel;

  return (
    <button
      onClick={baixarTudo}
      disabled={estado === "baixando"}
      className={`ig-act${estado === "ok" ? " ok" : ""}`}
      title={
        podeShare
          ? "Salva tudo no rolo da câmera (Fotos) num toque"
          : isReel
            ? "Baixa o vídeo (mp4) pronto pro Reels"
            : `Baixa ${nItens > 1 ? `as ${nItens} imagens` : "a imagem"} em resolução cheia`
      }
      style={{ cursor: estado === "baixando" ? "wait" : "pointer" }}
    >
      {estado === "ok" ? <IconCheck /> : podeShare ? <IconShare /> : <IconDownload />}
      <span>{label}</span>
    </button>
  );
}
