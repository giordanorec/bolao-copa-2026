import type { Locale } from "@/lib/i18n";

const URL_IG = "https://instagram.com/arena.das.ias";

const TX: Record<
  Locale,
  { titulo: string; lede: string; lede_curto: string; cta: string; handle: string }
> = {
  pt: {
    titulo: "Reviva os bastidores",
    lede: "A Copa acabou, mas os bastidores do experimento continuam no Instagram — os melhores momentos, as maiores zebras e as reações das IAs, guardados por lá.",
    lede_curto: "Os bastidores do experimento ficam guardados no Instagram.",
    cta: "Seguir no Instagram",
    handle: "@arena.das.ias",
  },
  en: {
    titulo: "Relive the behind-the-scenes",
    lede: "The Cup is over, but the behind-the-scenes of the experiment stay on Instagram — the best moments, the biggest upsets, and the AIs' reactions, all archived there.",
    lede_curto: "The experiment's behind-the-scenes live on on Instagram.",
    cta: "Follow on Instagram",
    handle: "@arena.das.ias",
  },
  es: {
    titulo: "Revive los detrás de cámaras",
    lede: "El Mundial terminó, pero los detrás de cámaras del experimento siguen en Instagram — los mejores momentos, las mayores sorpresas y las reacciones de las IAs, todo archivado ahí.",
    lede_curto: "Los detrás de cámaras del experimento quedan en Instagram.",
    cta: "Seguir en Instagram",
    handle: "@arena.das.ias",
  },
  fr: {
    titulo: "Revivez les coulisses",
    lede: "La Coupe est finie, mais les coulisses de l'expérience restent sur Instagram — les meilleurs moments, les plus grosses surprises et les réactions des IA, tout y est archivé.",
    lede_curto: "Les coulisses de l'expérience restent archivées sur Instagram.",
    cta: "Suivre sur Instagram",
    handle: "@arena.das.ias",
  },
};

export default function SeguirInstagram({
  locale = "pt",
  compact = false,
}: {
  locale?: Locale;
  compact?: boolean;
}) {
  const tx = TX[locale];

  if (compact) {
    // Variante pra encaixar dentro de um grid de cards (auto-fill 340px+).
    // Tudo apertado, sem ring de stories, fonte menor.
    return (
      <a
        className="seg-ig-mini"
        href={URL_IG}
        target="_blank"
        rel="noopener noreferrer"
      >
        <div className="seg-ig-mini-glow" aria-hidden />
        <div className="seg-ig-mini-body">
          <div className="seg-ig-mini-top">
            <svg
              width="26" height="26" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden
            >
              <rect x="3" y="3" width="18" height="18" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
            <strong className="seg-ig-mini-handle">{tx.handle}</strong>
          </div>
          <h3 className="seg-ig-mini-titulo">{tx.titulo}</h3>
          <p className="seg-ig-mini-lede">{tx.lede_curto}</p>
          <span className="seg-ig-mini-cta">{tx.cta} →</span>
        </div>

        <style>{`
          .seg-ig-mini {
            position: relative; display: block; overflow: hidden;
            background: linear-gradient(135deg, #f9ce34 0%, #ee2a7b 50%, #6228d7 100%);
            border-radius: var(--r-l);
            padding: 18px 18px 18px;
            color: #fff; text-decoration: none;
            min-height: 220px;
            box-shadow: 0 8px 24px rgba(238, 42, 123, 0.30), 0 4px 14px rgba(0,0,0,0.30);
            transition: transform 0.18s ease, box-shadow 0.18s ease;
          }
          .seg-ig-mini:hover {
            transform: translateY(-3px);
            box-shadow: 0 14px 30px rgba(238, 42, 123, 0.40), 0 6px 18px rgba(0,0,0,0.35);
          }
          .seg-ig-mini-glow {
            position: absolute; inset: 0; pointer-events: none;
            background:
              radial-gradient(circle at 85% 15%, rgba(255,255,255,0.28), transparent 50%),
              radial-gradient(circle at 5% 95%, rgba(255,255,255,0.12), transparent 40%);
          }
          .seg-ig-mini-body {
            position: relative; z-index: 1;
            display: flex; flex-direction: column;
            height: 100%; gap: 6px;
          }
          .seg-ig-mini-top {
            display: flex; align-items: center; gap: 8px;
            margin-bottom: 6px;
          }
          .seg-ig-mini-top svg { color: #fff; }
          .seg-ig-mini-handle {
            font-family: var(--ff-display);
            font-weight: 800; font-size: 14px;
            color: #fff;
            text-shadow: 0 1px 4px rgba(0,0,0,0.25);
          }
          .seg-ig-mini-titulo {
            font-family: var(--ff-display);
            font-size: 22px; font-weight: 900;
            line-height: 1.15; margin: 0;
            color: #fff;
            text-shadow: 0 2px 8px rgba(0,0,0,0.25);
          }
          .seg-ig-mini-lede {
            font-size: 13px; line-height: 1.45;
            margin: 0; color: rgba(255,255,255,0.95);
            text-shadow: 0 1px 4px rgba(0,0,0,0.18);
            flex: 1;
          }
          .seg-ig-mini-cta {
            display: inline-block;
            margin-top: 6px;
            padding: 9px 14px;
            background: #fff; color: #6228d7;
            border-radius: 999px;
            font-family: var(--ff-display);
            font-weight: 800; font-size: 13px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.22);
            align-self: flex-start;
          }
        `}</style>
      </a>
    );
  }

  // Variante grande (home).
  return (
    <section className="section seg-ig">
      <div className="container">
        <div className="seg-ig-card">
          <div className="seg-ig-glow" aria-hidden />
          <div className="seg-ig-stories" aria-hidden>
            <span /><span /><span /><span /><span />
          </div>
          <div className="seg-ig-body">
            <div className="seg-ig-emoji" aria-hidden>📸</div>
            <h2 className="seg-ig-titulo">{tx.titulo}</h2>
            <p className="seg-ig-lede">{tx.lede}</p>
            <a
              className="seg-ig-cta"
              href={URL_IG}
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                width="22" height="22" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" aria-hidden
              >
                <rect x="3" y="3" width="18" height="18" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
              <span>{tx.cta}</span>
              <strong className="seg-ig-handle">{tx.handle}</strong>
            </a>
          </div>
        </div>
      </div>

      <style>{`
        .seg-ig { padding: 16px 0 12px; }
        .seg-ig-card {
          position: relative; overflow: hidden;
          background: linear-gradient(135deg, #f9ce34 0%, #ee2a7b 50%, #6228d7 100%);
          border-radius: 24px;
          padding: 28px 26px 26px;
          color: #fff; max-width: 900px; margin: 0 auto;
          box-shadow: 0 18px 50px rgba(238, 42, 123, 0.30), 0 6px 20px rgba(0,0,0,0.35);
        }
        .seg-ig-glow {
          position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(circle at 80% 20%, rgba(255,255,255,0.30), transparent 50%),
            radial-gradient(circle at 10% 90%, rgba(255,255,255,0.15), transparent 40%);
        }
        .seg-ig-stories {
          display: flex; gap: 10px; margin-bottom: 18px;
          position: relative; z-index: 1;
        }
        .seg-ig-stories span {
          width: 36px; height: 36px; border-radius: 50%;
          background: rgba(255,255,255,0.18);
          border: 2px solid rgba(255,255,255,0.6);
          backdrop-filter: blur(4px);
        }
        .seg-ig-stories span:nth-child(2) { background: rgba(255,255,255,0.30); }
        .seg-ig-stories span:nth-child(3) { background: rgba(255,255,255,0.10); }
        .seg-ig-stories span:nth-child(4) { background: rgba(255,255,255,0.22); }
        .seg-ig-stories span:nth-child(5) { background: rgba(255,255,255,0.14); }
        .seg-ig-body {
          position: relative; z-index: 1;
          display: flex; flex-direction: column; gap: 10px;
          max-width: 640px;
        }
        .seg-ig-emoji { font-size: 36px; line-height: 1; margin-bottom: 4px; }
        .seg-ig-titulo {
          font-family: var(--ff-display);
          font-size: clamp(22px, 3.6vw, 32px);
          font-weight: 900; line-height: 1.15;
          margin: 0; color: #fff;
          letter-spacing: -0.01em;
          text-shadow: 0 2px 12px rgba(0,0,0,0.25);
        }
        .seg-ig-lede {
          font-size: 15px; line-height: 1.5;
          margin: 0 0 8px;
          color: rgba(255,255,255,0.94);
          text-shadow: 0 1px 6px rgba(0,0,0,0.18);
        }
        .seg-ig-cta {
          display: inline-flex; align-items: center; gap: 10px;
          align-self: flex-start;
          padding: 13px 22px;
          background: #fff; color: #6228d7;
          border-radius: 999px;
          font-family: var(--ff-display);
          font-weight: 800; font-size: 15px;
          text-decoration: none;
          box-shadow: 0 6px 18px rgba(0,0,0,0.25);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .seg-ig-cta:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 10px 26px rgba(0,0,0,0.32);
        }
        .seg-ig-cta svg { color: #ee2a7b; flex-shrink: 0; }
        .seg-ig-handle {
          padding: 4px 10px;
          background: linear-gradient(135deg, #f9ce34, #ee2a7b);
          color: #fff; border-radius: 999px;
          font-size: 13px; font-weight: 800;
        }
        @media (max-width: 520px) {
          .seg-ig-stories span { width: 28px; height: 28px; }
          .seg-ig-cta { font-size: 13px; padding: 11px 16px; gap: 8px; }
          .seg-ig-handle { font-size: 11px; padding: 3px 8px; }
        }
      `}</style>
    </section>
  );
}
