"use client";

import { useRef, useState, useTransition } from "react";
import Avatar from "@/components/Avatar";
import { uploadAvatar, removerAvatar } from "./avatar-actions";

export default function AvatarUpload({
  avatarUrl,
  nome,
}: {
  avatarUrl: string | null;
  nome: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl);
  const [msg, setMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function mostrarMsg(texto: string, duracao = 4000) {
    setMsg(texto);
    setTimeout(() => setMsg(null), duracao);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    // Preview imediato no client
    const localUrl = URL.createObjectURL(arquivo);
    setPreviewUrl(localUrl);

    const fd = new FormData();
    fd.append("avatar", arquivo);

    startTransition(async () => {
      const res = await uploadAvatar(fd);
      if (res.ok) {
        setPreviewUrl(res.url);
        mostrarMsg("Foto atualizada!");
      } else {
        // Volta pra foto anterior em caso de erro
        setPreviewUrl(avatarUrl);
        mostrarMsg("Erro: " + res.erro);
      }
    });

    // Limpa o input pra permitir re-selecionar o mesmo arquivo
    e.target.value = "";
  }

  function handleRemover() {
    startTransition(async () => {
      const res = await removerAvatar();
      if (res.ok) {
        setPreviewUrl(null);
        mostrarMsg("Foto removida.");
      } else {
        mostrarMsg("Erro: " + res.erro);
      }
    });
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 20,
        padding: "20px 0",
        borderTop: "1px solid var(--line)",
        borderBottom: "1px solid var(--line)",
        marginBottom: 24,
        flexWrap: "wrap",
      }}
    >
      {/* Preview */}
      <div style={{ flexShrink: 0 }}>
        <Avatar src={previewUrl} nome={nome} size={96} />
      </div>

      {/* Controles */}
      <div style={{ flex: 1, minWidth: 200 }}>
        <p
          style={{
            margin: "0 0 4px",
            fontWeight: 700,
            fontSize: 15,
            color: "var(--fg)",
          }}
        >
          Foto de perfil
        </p>
        <p
          style={{
            margin: "0 0 14px",
            fontSize: 13,
            color: "var(--fg-muted)",
            lineHeight: 1.5,
          }}
        >
          JPG, PNG ou WebP. Máximo 2 MB.
          {!previewUrl && " Aparece no ranking ao lado do seu nome."}
        </p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            disabled={isPending}
            onClick={() => inputRef.current?.click()}
            className="btn primary"
            style={{ fontSize: 14, padding: "8px 18px" }}
          >
            {isPending ? "Enviando..." : previewUrl ? "Trocar foto" : "Escolher foto"}
          </button>

          {previewUrl && (
            <button
              type="button"
              disabled={isPending}
              onClick={handleRemover}
              className="btn"
              style={{ fontSize: 14, padding: "8px 18px" }}
            >
              Remover
            </button>
          )}
        </div>

        {msg && (
          <p
            style={{
              marginTop: 10,
              fontSize: 13,
              color: msg.startsWith("Erro")
                ? "var(--err, #dc2626)"
                : "var(--ok, #16a34a)",
            }}
          >
            {msg}
          </p>
        )}
      </div>

      {/* Input oculto */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={handleFileChange}
        aria-label="Escolher foto de perfil"
      />
    </div>
  );
}
