"use client";

import { useState, useEffect } from "react";
import IconeIA from "@/components/IconeIA";

export type IALanding = {
  slug: string;
  nome: string;
  campeao: string;
};

export type CristalLanding = {
  campeao: string;
  votos_totais: number;
};

type Props = {
  ias: IALanding[];
  cristal: CristalLanding | null;
  mapaPaises: Record<string, string>;
  distribuicao: { campeao: string; n: number }[];
  labels: {
    iasLabel: string;
    cristalLabel: string;
    cristalLocked: string;
    cristalUnlockedCta: string;
    revealAllFirst: string;
    progresso: string;
    statsTitulo: string;
  };
};

function IACard({
  ia,
  revealed,
  onClick,
}: {
  ia: IALanding;
  revealed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        padding: "20px 16px",
        background: revealed
          ? "linear-gradient(135deg, rgba(74,222,128,0.10), rgba(45,127,255,0.06))"
          : "rgba(255,255,255,0.04)",
        border: revealed
          ? "1px solid rgba(74,222,128,0.35)"
          : "1px solid rgba(255,255,255,0.12)",
        borderRadius: 16,
        cursor: "pointer",
        transition: "all 0.35s ease",
        color: "#fff",
        fontFamily: "inherit",
        textAlign: "center",
        boxShadow: revealed
          ? "0 4px 24px rgba(74,222,128,0.15)"
          : "0 2px 10px rgba(0,0,0,0.4)",
        minHeight: 200,
        justifyContent: "center",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.borderColor = "rgba(255,215,0,0.4)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = revealed
          ? "rgba(74,222,128,0.35)"
          : "rgba(255,255,255,0.12)";
      }}
    >
      <IconeIA slug={ia.slug} size={54} />
      <strong style={{ fontSize: 14, color: "#fff", lineHeight: 1.2 }}>
        {ia.nome}
      </strong>
      {revealed ? (
        <div
          style={{
            marginTop: 6,
            padding: "8px 14px",
            background: "rgba(74,222,128,0.15)",
            border: "1px solid rgba(74,222,128,0.35)",
            borderRadius: 8,
            color: "#4ADE80",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 0.5,
          }}
        >
          ✓ Ver de novo
        </div>
      ) : (
        <div
          style={{
            marginTop: 6,
            padding: "8px 14px",
            background: "rgba(255,215,0,0.15)",
            border: "1px solid rgba(255,215,0,0.35)",
            borderRadius: 8,
            color: "#FFD700",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 0.5,
          }}
        >
          🎬 Ver a simulação
        </div>
      )}
      {!revealed && (
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
          O que essa IA prevê?
        </div>
      )}
    </button>
  );
}

// Modal com iframe da animação. Recebe a URL a carregar.
function IframeModal({
  src,
  onClose,
}: {
  src: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(5,7,12,0.92)",
        backdropFilter: "blur(6px)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(1500px, 100%)",
          height: "calc(100vh - 60px)",
          background: "#05070c",
          borderRadius: 14,
          overflow: "hidden",
          position: "relative",
          boxShadow: "0 20px 80px rgba(0,0,0,0.6)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Fechar"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: 10,
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "rgba(0,0,0,0.5)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.2)",
            cursor: "pointer",
            fontSize: 20,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ✕
        </button>
        <iframe
          src={src}
          title="Simulação de campeão"
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            display: "block",
          }}
          allow="autoplay"
        />
      </div>
    </div>
  );
}

export default function LandingClient({
  ias,
  cristal,
  mapaPaises,
  labels,
}: Props) {
  const [revealedSlugs, setRevealedSlugs] = useState<Set<string>>(new Set());
  const [modalSrc, setModalSrc] = useState<string | null>(null);
  void mapaPaises; // reservado pra usar em futuras variações

  const totalIAs = ias.length;
  const revealadas = revealedSlugs.size;
  const cristalUnlocked = revealadas >= totalIAs && totalIAs > 0;

  const openIA = (slug: string) => {
    setRevealedSlugs((prev) => {
      const next = new Set(prev);
      next.add(slug);
      return next;
    });
    setModalSrc(`/design/chaveamento/index.html?ia=${encodeURIComponent(slug)}`);
  };

  const openCristal = () => {
    setModalSrc(`/design/chaveamento/index.html`);
  };

  return (
    <>
      <style jsx global>{`
        @keyframes cristalPulse {
          0%, 100% {
            box-shadow: 0 0 40px rgba(255, 215, 0, 0.25), inset 0 0 30px rgba(139, 92, 246, 0.15);
          }
          50% {
            box-shadow: 0 0 80px rgba(255, 215, 0, 0.55), inset 0 0 50px rgba(139, 92, 246, 0.35);
          }
        }
        @keyframes cristalUnlock {
          0% { transform: scale(0.95); filter: hue-rotate(0deg); }
          50% { transform: scale(1.06); filter: hue-rotate(45deg); }
          100% { transform: scale(1); filter: hue-rotate(0deg); }
        }
      `}</style>

      {/* CRISTAL HERO */}
      {cristal && (
        <section
          style={{
            padding: "36px 28px 40px",
            background: cristalUnlocked
              ? "linear-gradient(135deg, rgba(255,215,0,0.14), rgba(139,92,246,0.10))"
              : "linear-gradient(135deg, rgba(139,92,246,0.06), rgba(255,215,0,0.03))",
            border: cristalUnlocked
              ? "1px solid rgba(255,215,0,0.45)"
              : "1px solid rgba(139,92,246,0.30)",
            borderRadius: 24,
            marginBottom: 40,
            textAlign: "center",
            animation: cristalUnlocked
              ? "cristalUnlock 0.9s ease-out, cristalPulse 3s ease-in-out 0.9s infinite"
              : "none",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 12,
              right: 16,
              fontSize: 11,
              color: cristalUnlocked ? "#FFD700" : "rgba(255,255,255,0.35)",
              fontWeight: 700,
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}
          >
            {revealadas}/{totalIAs} · {labels.progresso}
          </div>

          <div
            style={{
              fontSize: cristalUnlocked ? 72 : 56,
              lineHeight: 1,
              marginBottom: 14,
              filter: cristalUnlocked ? "none" : "grayscale(0.6) opacity(0.5)",
              transition: "all 0.6s ease",
            }}
          >
            🔮
          </div>

          <h2
            style={{
              fontSize: 12,
              letterSpacing: 2.5,
              color: cristalUnlocked ? "#FFD700" : "rgba(255,255,255,0.4)",
              fontWeight: 800,
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            {labels.cristalLabel} · {cristal.votos_totais} votos
          </h2>

          {cristalUnlocked ? (
            <>
              <p
                style={{
                  fontSize: 15,
                  color: "rgba(255,255,255,0.75)",
                  maxWidth: 520,
                  margin: "0 auto 22px",
                  lineHeight: 1.55,
                }}
              >
                Você viu todas as IAs. Agora vem o momento da verdade — o
                consenso das 9. Sem spoiler antes.
              </p>
              <button
                onClick={openCristal}
                style={{
                  display: "inline-block",
                  padding: "14px 34px",
                  background: "linear-gradient(180deg, #FFD700, #F0B400)",
                  color: "#0a0e1a",
                  borderRadius: 999,
                  fontWeight: 900,
                  fontSize: 16,
                  textDecoration: "none",
                  boxShadow: "0 6px 24px rgba(255,215,0,0.35)",
                  letterSpacing: 0.3,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {labels.cristalUnlockedCta}
              </button>
            </>
          ) : (
            <>
              <div
                style={{
                  fontSize: 42,
                  fontWeight: 900,
                  color: "rgba(255,255,255,0.20)",
                  letterSpacing: 8,
                  filter: "blur(6px)",
                  marginBottom: 20,
                  userSelect: "none",
                }}
              >
                ??????
              </div>
              <p
                style={{
                  fontSize: 15,
                  color: "rgba(255,255,255,0.65)",
                  maxWidth: 500,
                  margin: "0 auto 8px",
                  lineHeight: 1.5,
                }}
              >
                {revealadas === totalIAs - 1
                  ? labels.revealAllFirst
                  : labels.cristalLocked}
              </p>
            </>
          )}
        </section>
      )}

      {/* GRID DE IAs */}
      <h3
        style={{
          fontSize: 15,
          letterSpacing: 1.5,
          color: "rgba(255,255,255,0.5)",
          fontWeight: 700,
          textTransform: "uppercase",
          marginBottom: 20,
          textAlign: "center",
        }}
      >
        {labels.iasLabel}
      </h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
          marginBottom: 44,
        }}
      >
        {ias.map((ia) => (
          <IACard
            key={ia.slug}
            ia={ia}
            revealed={revealedSlugs.has(ia.slug)}
            onClick={() => openIA(ia.slug)}
          />
        ))}
      </div>

      {/* MODAL COM IFRAME DA ANIMAÇÃO */}
      {modalSrc && (
        <IframeModal src={modalSrc} onClose={() => setModalSrc(null)} />
      )}
    </>
  );
}
