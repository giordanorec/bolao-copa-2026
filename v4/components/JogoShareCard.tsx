"use client";

import Link from "next/link";

type Props = {
  jogoNumero: number;
  whatsMsg: string;
  shareLabel: string;
  verMaisLabel: string;
  url: string;
};

export default function JogoShareCard({
  jogoNumero,
  whatsMsg,
  shareLabel,
  verMaisLabel,
  url,
}: Props) {
  const whatsUrl = `https://wa.me/?text=${encodeURIComponent(whatsMsg)}`;

  async function nativeShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text: whatsMsg, url });
        return;
      } catch {
        // user cancelled — fallthrough to whatsapp
      }
    }
    window.open(whatsUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="jogo-share-acoes">
      <button
        type="button"
        onClick={nativeShare}
        className="btn-zap"
        aria-label={shareLabel}
      >
        <span style={{ fontSize: 18 }}>💬</span>
        <span>{shareLabel}</span>
      </button>
      <Link href={`/jogo/${jogoNumero}`} className="btn-vermais">
        {verMaisLabel}
      </Link>
      <style>{`
        .jogo-share-acoes {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 4px;
        }
        .btn-zap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 14px;
          border-radius: var(--r-m);
          border: none;
          background: #25D366;
          color: #fff;
          font-family: var(--ff-sans);
          font-weight: 800;
          font-size: 15px;
          cursor: pointer;
          transition: transform 0.12s ease, box-shadow 0.12s ease;
          box-shadow: 0 2px 8px rgba(37,211,102,0.3);
        }
        .btn-zap:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(37,211,102,0.45);
        }
        .btn-vermais {
          text-align: center;
          font-size: 13px;
          font-weight: 700;
          color: var(--primary);
          padding: 6px 8px;
          text-decoration: none;
        }
        .btn-vermais:hover { text-decoration: underline; }
      `}</style>
    </div>
  );
}
