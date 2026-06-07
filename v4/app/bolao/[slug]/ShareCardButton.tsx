"use client";

import { useState } from "react";

type Linha = { nome: string; pontos: number };

export default function ShareCardButton({
  nomeBolao,
  slug,
  ranking,
}: {
  nomeBolao: string;
  slug: string;
  ranking: Linha[];
}) {
  const [busy, setBusy] = useState(false);

  async function gerar() {
    setBusy(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1080;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // fundo gradiente
      const grad = ctx.createLinearGradient(0, 0, 1080, 1080);
      grad.addColorStop(0, "#FF385C");
      grad.addColorStop(0.5, "#FF6B8E");
      grad.addColorStop(1, "#FFCE00");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1080, 1080);

      // overlay branco
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      const m = 60;
      ctx.beginPath();
      const r = 40;
      const x = m, y = m, w = 1080 - 2 * m, h = 1080 - 2 * m;
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
      ctx.fill();

      // emoji + título
      ctx.fillStyle = "#222222";
      ctx.font =
        'bold 56px "Fraunces", Georgia, serif';
      ctx.textAlign = "center";
      ctx.fillText("🇧🇷⚽🎯", 540, 220);

      ctx.font = 'bold 72px "Fraunces", Georgia, serif';
      const titulo = nomeBolao.length > 22 ? nomeBolao.slice(0, 20) + "…" : nomeBolao;
      ctx.fillText(titulo, 540, 320);

      ctx.font = '500 28px "Inter", system-ui, sans-serif';
      ctx.fillStyle = "#717171";
      ctx.fillText("Bolão da Copa 2026", 540, 370);

      // tabela ranking (top 5)
      ctx.textAlign = "left";
      let yPos = 460;
      const top = ranking.slice(0, 5);
      if (top.length === 0) {
        ctx.font = '500 32px "Inter", system-ui, sans-serif';
        ctx.fillStyle = "#717171";
        ctx.textAlign = "center";
        ctx.fillText("Aguardando palpites…", 540, 580);
      } else {
        ctx.font = 'bold 24px "JetBrains Mono", monospace';
        ctx.fillStyle = "#717171";
        ctx.fillText("RANKING", 140, yPos);
        ctx.textAlign = "right";
        ctx.fillText("PONTOS", 940, yPos);
        yPos += 40;
        // linha
        ctx.strokeStyle = "#e0e0e0";
        ctx.beginPath();
        ctx.moveTo(140, yPos);
        ctx.lineTo(940, yPos);
        ctx.stroke();
        yPos += 50;

        top.forEach((l, i) => {
          ctx.textAlign = "left";
          ctx.font =
            'bold 36px "Inter", system-ui, sans-serif';
          ctx.fillStyle = i === 0 ? "#FF385C" : "#222222";
          const medal = ["🥇", "🥈", "🥉", " ", " "][i] || " ";
          const nome =
            l.nome.length > 22 ? l.nome.slice(0, 20) + "…" : l.nome;
          ctx.fillText(`${medal} ${nome}`, 140, yPos);
          ctx.textAlign = "right";
          ctx.font =
            'bold 40px "JetBrains Mono", monospace';
          ctx.fillStyle = "#FF385C";
          ctx.fillText(`${l.pontos}`, 940, yPos);
          yPos += 70;
        });
      }

      // footer com link
      ctx.textAlign = "center";
      ctx.font = '600 26px "Inter", system-ui, sans-serif';
      ctx.fillStyle = "#FF385C";
      ctx.fillText("arena-de-ias.vercel.app", 540, 920);
      ctx.font = '500 22px "JetBrains Mono", monospace';
      ctx.fillStyle = "#717171";
      ctx.fillText(`/bolao/${slug}`, 540, 960);

      // download
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `bolao-${slug}.png`;
      a.click();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button onClick={gerar} disabled={busy} className="btn small">
      {busy ? "Gerando…" : "📸 Card"}
    </button>
  );
}
