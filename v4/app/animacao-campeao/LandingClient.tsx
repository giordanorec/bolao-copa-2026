"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
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

function flagUrl(iso: string): string {
  return `https://hatscripts.github.io/circle-flags/flags/${iso.toLowerCase()}.svg`;
}

function IACard({
  ia,
  revealed,
  onReveal,
  isoCode,
}: {
  ia: IALanding;
  revealed: boolean;
  onReveal: () => void;
  isoCode?: string;
}) {
  return (
    <button
      onClick={onReveal}
      disabled={revealed}
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
        cursor: revealed ? "default" : "pointer",
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
        if (!revealed) {
          e.currentTarget.style.transform = "translateY(-3px)";
          e.currentTarget.style.borderColor = "rgba(255,215,0,0.4)";
        }
      }}
      onMouseLeave={(e) => {
        if (!revealed) {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
        }
      }}
    >
      <IconeIA slug={ia.slug} size={54} />
      <strong style={{ fontSize: 14, color: "#fff", lineHeight: 1.2 }}>
        {ia.nome}
      </strong>
      {revealed ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 6,
            animation: "revealIn 0.5s ease-out",
          }}
        >
          {isoCode && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={flagUrl(isoCode)}
              alt={ia.campeao}
              width={36}
              height={36}
              style={{ borderRadius: "50%", boxShadow: "0 2px 8px rgba(0,0,0,0.4)" }}
            />
          )}
          <span style={{ fontSize: 16, fontWeight: 700, color: "#4ADE80" }}>
            {ia.campeao} 🏆
          </span>
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
          🎲 Revelar palpite
        </div>
      )}
      {!revealed && (
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
          Clique pra ver
        </div>
      )}
    </button>
  );
}

export default function LandingClient({
  ias,
  cristal,
  mapaPaises,
  distribuicao,
  labels,
}: Props) {
  const [revealedSlugs, setRevealedSlugs] = useState<Set<string>>(new Set());

  const totalIAs = ias.length;
  const revealadas = revealedSlugs.size;
  const cristalUnlocked = revealadas === totalIAs && totalIAs > 0;

  const reveal = (slug: string) => {
    setRevealedSlugs((prev) => {
      if (prev.has(slug)) return prev;
      const next = new Set(prev);
      next.add(slug);
      return next;
    });
  };

  const cristalIsoCode = cristal ? mapaPaises[cristal.campeao] : undefined;

  const bandeiraPreview = useMemo(
    () =>
      distribuicao.slice(0, 4).map(({ campeao }) => ({
        campeao,
        iso: mapaPaises[campeao],
      })),
    [distribuicao, mapaPaises],
  );

  return (
    <>
      <style jsx global>{`
        @keyframes revealIn {
          from {
            opacity: 0;
            transform: scale(0.85) translateY(-8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes cristalPulse {
          0%, 100% {
            box-shadow: 0 0 40px rgba(255, 215, 0, 0.25), inset 0 0 30px rgba(139, 92, 246, 0.15);
          }
          50% {
            box-shadow: 0 0 80px rgba(255, 215, 0, 0.55), inset 0 0 50px rgba(139, 92, 246, 0.35);
          }
        }
        @keyframes cristalUnlock {
          0% {
            transform: scale(0.95);
            filter: hue-rotate(0deg);
          }
          50% {
            transform: scale(1.06);
            filter: hue-rotate(45deg);
          }
          100% {
            transform: scale(1);
            filter: hue-rotate(0deg);
          }
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
              marginBottom: 12,
            }}
          >
            {labels.cristalLabel} · {cristal.votos_totais} votos
          </h2>

          {cristalUnlocked ? (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 16,
                  marginBottom: 22,
                }}
              >
                {cristalIsoCode && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={flagUrl(cristalIsoCode)}
                    alt={cristal.campeao}
                    width={68}
                    height={68}
                    style={{
                      borderRadius: "50%",
                      boxShadow: "0 4px 24px rgba(255,215,0,0.4)",
                      border: "3px solid rgba(255,215,0,0.6)",
                    }}
                  />
                )}
                <h1
                  style={{
                    fontSize: "clamp(38px, 6vw, 60px)",
                    fontWeight: 900,
                    color: "#fff",
                    letterSpacing: -1,
                    lineHeight: 1,
                    margin: 0,
                  }}
                >
                  {cristal.campeao}
                </h1>
              </div>
              <Link
                href="/animacao-campeao/bracket"
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
                }}
              >
                {labels.cristalUnlockedCta}
              </Link>
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
              {/* Preview de bandeiras (as opções) */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 8,
                  marginTop: 14,
                  opacity: 0.4,
                }}
              >
                {bandeiraPreview.map((b) => (
                  <div
                    key={b.campeao}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: b.iso ? `url(${flagUrl(b.iso)}) center/cover` : "rgba(255,255,255,0.1)",
                      filter: "blur(2px)",
                    }}
                    title="?"
                  />
                ))}
              </div>
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
            onReveal={() => reveal(ia.slug)}
            isoCode={mapaPaises[ia.campeao]}
          />
        ))}
      </div>

      {/* ESTATÍSTICAS (só aparecem quando pelo menos 1 revelada) */}
      {revealadas > 0 && (
        <section
          style={{
            padding: "24px 20px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 14,
            marginTop: 20,
          }}
        >
          <h4
            style={{
              fontSize: 13,
              letterSpacing: 1.5,
              color: "rgba(255,255,255,0.5)",
              fontWeight: 700,
              textTransform: "uppercase",
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            {labels.statsTitulo}
          </h4>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              justifyContent: "center",
            }}
          >
            {distribuicao.map(({ campeao, n }) => {
              const revealCount = ias
                .filter((ia) => ia.campeao === campeao && revealedSlugs.has(ia.slug))
                .length;
              const iso = mapaPaises[campeao];
              return (
                <div
                  key={campeao}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 14px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 999,
                    fontSize: 13,
                  }}
                >
                  {iso && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={flagUrl(iso)}
                      alt={campeao}
                      width={22}
                      height={22}
                      style={{ borderRadius: "50%" }}
                    />
                  )}
                  <span style={{ fontWeight: 600 }}>{campeao}</span>
                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                    {revealCount}/{n} {n === 1 ? "voto" : "votos"}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
