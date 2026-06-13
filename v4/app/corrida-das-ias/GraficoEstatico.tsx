import IconeIA from "@/components/IconeIA";
import { marcaDe } from "@/lib/ias";

type IA = {
  slug: string;
  nome_display: string;
  pontos: number;
  placares_exatos: number;
  jogos_palpitados: number;
};

export default function GraficoEstatico({ ias }: { ias: IA[] }) {
  const maxPts = Math.max(1, ...ias.map((ia) => ia.pontos));

  return (
    <div
      style={{
        background: "var(--bg-2)",
        border: "1px solid var(--line)",
        borderRadius: "var(--r-l)",
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      {ias.map((ia, i) => {
        const marca = marcaDe(ia.slug);
        const widthPct = (ia.pontos / maxPts) * 100;
        const isTopTres = i < 3;
        const podioCor =
          i === 0 ? "#fbbf24" : i === 1 ? "#cbd5e1" : i === 2 ? "#ea8b3f" : "var(--fg-muted)";
        return (
          <div
            key={ia.slug}
            style={{
              display: "grid",
              gridTemplateColumns: "36px 1fr 70px",
              alignItems: "center",
              gap: 12,
              padding: "8px 4px",
              borderRadius: "var(--r-s)",
              background: isTopTres ? "var(--bg-soft)" : "transparent",
            }}
          >
            <span
              style={{
                fontFamily: "var(--ff-mono)",
                fontSize: 13,
                fontWeight: 800,
                color: podioCor,
                textAlign: "right",
              }}
            >
              {i + 1}º
            </span>
            <div
              style={{
                position: "relative",
                height: 32,
                background: "var(--bg-1)",
                border: "1px solid var(--line)",
                borderRadius: 16,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  width: `${widthPct}%`,
                  background: `linear-gradient(90deg, ${marca.cor}, color-mix(in srgb, ${marca.cor} 60%, var(--accent)))`,
                  borderRadius: 16,
                }}
              />
              <div
                style={{
                  position: "relative",
                  zIndex: 2,
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "0 12px",
                }}
              >
                <IconeIA slug={ia.slug} size={20} />
                <span
                  style={{
                    fontFamily: "var(--ff-display)",
                    fontWeight: 800,
                    fontSize: 13,
                    color: widthPct > 25 ? "#fff" : "var(--fg)",
                    textShadow:
                      widthPct > 25 ? "0 1px 2px rgba(0,0,0,0.5)" : "none",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {ia.nome_display}
                </span>
                <span
                  style={{
                    fontFamily: "var(--ff-mono)",
                    fontSize: 11,
                    color: widthPct > 25 ? "rgba(255,255,255,0.9)" : "var(--fg-muted)",
                    marginLeft: "auto",
                    textShadow:
                      widthPct > 25 ? "0 1px 2px rgba(0,0,0,0.5)" : "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  {ia.placares_exatos}✓
                </span>
              </div>
            </div>
            <span
              style={{
                fontFamily: "var(--ff-display)",
                fontSize: 22,
                fontWeight: 900,
                color: "var(--secondary)",
                textAlign: "right",
              }}
            >
              {ia.pontos}
            </span>
          </div>
        );
      })}
    </div>
  );
}
