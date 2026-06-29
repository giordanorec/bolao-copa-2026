/**
 * Avatar — foto de perfil em círculo (estilo WhatsApp).
 *
 * Se `src` for null ou falhar ao carregar, exibe a inicial do nome
 * num círculo colorido (cor determinada por hash do nome, estável).
 *
 * Props:
 *   src    — URL pública do avatar (storage avatares) ou null
 *   nome   — nome de exibição do usuário (usado no fallback + alt)
 *   size   — diâmetro em px (default 36)
 */
"use client";

import { useState } from "react";

function hashNome(nome: string): number {
  let h = 0;
  for (let i = 0; i < nome.length; i++) {
    h = ((h << 5) - h + nome.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// Paleta de 8 cores vibrantes — mesma usada nas bolhas de membros
const CORES_FALLBACK = [
  "linear-gradient(135deg,#009C3B,#00B040)", // verde Brasil
  "linear-gradient(135deg,#002776,#0E3FB0)", // azul Brasil
  "linear-gradient(135deg,#FF385C,#E61E4D)", // vermelho Airbnb
  "linear-gradient(135deg,#007AFF,#0040DD)", // azul Apple
  "linear-gradient(135deg,#8134AF,#DD2A7B)", // roxo Instagram
  "linear-gradient(135deg,#FF9500,#C46900)", // laranja
  "linear-gradient(135deg,#34C759,#248A3D)", // verde iOS
  "linear-gradient(135deg,#5856D6,#3634A3)", // índigo
];

function corFallback(nome: string): string {
  return CORES_FALLBACK[hashNome(nome) % CORES_FALLBACK.length];
}

export default function Avatar({
  src,
  nome,
  size = 36,
}: {
  src: string | null;
  nome: string;
  size?: number;
}) {
  const [erro, setErro] = useState(false);
  const inicial = (nome || "?").trim().charAt(0).toUpperCase();
  const mostraFoto = src && !erro;

  const base: React.CSSProperties = {
    width: size,
    height: size,
    minWidth: size,
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
    userSelect: "none",
  };

  if (mostraFoto) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={src}
        alt={nome}
        width={size}
        height={size}
        onError={() => setErro(true)}
        style={{
          ...base,
          objectFit: "cover",
          display: "block",
        }}
      />
    );
  }

  return (
    <span
      aria-label={nome}
      title={nome}
      style={{
        ...base,
        background: corFallback(nome),
        color: "#fff",
        fontSize: Math.max(13, Math.round(size * 0.42)),
        fontWeight: 700,
        fontFamily: "var(--ff-sans, system-ui, sans-serif)",
        letterSpacing: "-0.01em",
      }}
    >
      {inicial}
    </span>
  );
}
