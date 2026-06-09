"use client";

import { useState } from "react";

export default function PixCard({
  payload,
  chave,
}: {
  payload: string;
  chave: string;
}) {
  const [copiado, setCopiado] = useState<"payload" | "chave" | null>(null);
  const [revelar, setRevelar] = useState(false);

  async function copiar(texto: string, tipo: "payload" | "chave") {
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = texto;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiado(tipo);
    setTimeout(() => setCopiado(null), 2000);
  }

  return (
    <div className="pix-card">
      <div className="pix-qr-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/pix-qr.svg" alt="QR Code PIX" />
      </div>
      <div className="pix-info">
        <p className="pix-instrucao">
          📱 Abra o app do seu banco, escolhe <strong>PIX → Pagar com QR Code</strong> e aponta a câmera. Você escolhe o valor.
        </p>

        <button
          type="button"
          onClick={() => copiar(payload, "payload")}
          className={`pix-btn-copiar ${copiado === "payload" ? "copiado" : ""}`}
        >
          {copiado === "payload" ? "✓ Copiado!" : "📋 Copiar código PIX (copia e cola)"}
        </button>

        <div className="pix-divider"><span>OU</span></div>

        <div className="pix-chave-bloco">
          <span className="pix-chave-label">Chave PIX (email)</span>
          <div className="pix-chave-row">
            {revelar ? (
              <code>{chave}</code>
            ) : (
              <code aria-label="Chave PIX oculta">•••••••••••••••••••••</code>
            )}
            <button
              type="button"
              onClick={() => setRevelar((v) => !v)}
              className="pix-mini-btn"
              title={revelar ? "Ocultar chave" : "Mostrar chave"}
            >
              {revelar ? "🙈" : "👁️"}
            </button>
            <button
              type="button"
              onClick={() => copiar(chave, "chave")}
              className={`pix-mini-btn ${copiado === "chave" ? "copiado" : ""}`}
              title="Copiar chave"
            >
              {copiado === "chave" ? "✓" : "📋"}
            </button>
          </div>
        </div>

        <p className="pix-comprovante">
          Depois, manda o comprovante no Instagram{" "}
          <a
            href="https://instagram.com/arena.das.ias"
            target="_blank"
            rel="noopener noreferrer"
          >
            @arena.das.ias
          </a>{" "}
          pra liberar suas recompensas 💛
        </p>
      </div>
    </div>
  );
}
