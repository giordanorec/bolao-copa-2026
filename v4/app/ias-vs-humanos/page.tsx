import Link from "next/link";
import { promises as fs } from "fs";
import path from "path";
import IconeIA from "@/components/IconeIA";
import { resolverLocale } from "@/lib/locale-server";
import { carregarTodosHumanos, type HumanoPts } from "@/lib/humanos-pts";
import { ehSerieA, nomeSerieA, SLUGS_SERIE_A } from "@/lib/serie-a";
import { scorePopularidade } from "@/lib/ias";
import type { Locale } from "@/lib/i18n";

export const metadata = {
  title: "IAs × Humanos — quem prevê melhor? · Bolão das IAs",
  description:
    "Análise comparativa: as IAs da Série A, todas as 122 IAs e os humanos no mesmo placar. Médias, medianas, placares exatos.",
};

// ── tipos ───────────────────────────────────────────────────────────────────

type FaseStat = {
  pontos: number;
  placares_exatos: number;
  vencedores_acertados: number;
  jogos_palpitados: number;
};

type IAItem = {
  slug: string;
  nome: string;
  serieA: boolean;
  geral: FaseStat;
};

// ── helpers ─────────────────────────────────────────────────────────────────

/** Empates ocupam a MESMA colocação (1º, 1º, 3º). */
function colocacoes(pts: number[]): number[] {
  const sorted = [...pts].sort((a, b) => b - a);
  return pts.map((p) => sorted.indexOf(p) + 1);
}

function media(vals: number[]): number {
  if (!vals.length) return 0;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

function mediana(vals: number[]): number {
  if (!vals.length) return 0;
  const sorted = [...vals].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

function pctExatos(items: { geral: FaseStat }[]): string {
  const total = items.reduce((s, i) => s + i.geral.jogos_palpitados, 0);
  const exatos = items.reduce((s, i) => s + i.geral.placares_exatos, 0);
  if (total === 0) return "0%";
  return (Math.round((exatos / total) * 1000) / 10).toFixed(1) + "%";
}

// ── carregamento IAs ─────────────────────────────────────────────────────────

async function carregarIAs(): Promise<IAItem[]> {
  try {
    const filePath = path.join(process.cwd(), "public", "ranking-ias.json");
    const raw = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(raw);
    return (data.ias ?? [])
      .filter(
        (ia: { slug?: string; palpites_total?: number }) =>
          ia.slug !== "bola-de-cristal" && (ia.palpites_total ?? 0) > 0,
      )
      .map(
        (ia: {
          slug?: string;
          nome_display?: string;
          pontos?: number;
          palpites_total?: number;
          geral?: FaseStat;
          placares_exatos?: number;
          jogos_palpitados?: number;
        }) => {
          const slug = ia.slug ?? "";
          const zero: FaseStat = { pontos: 0, placares_exatos: 0, vencedores_acertados: 0, jogos_palpitados: 0 };
          return {
            slug,
            nome: nomeSerieA(slug) ?? ia.nome_display ?? slug,
            serieA: ehSerieA(slug),
            geral: ia.geral ?? {
              pontos: ia.pontos ?? 0,
              placares_exatos: ia.placares_exatos ?? 0,
              vencedores_acertados: 0,
              jogos_palpitados: ia.jogos_palpitados ?? ia.palpites_total ?? 0,
            },
          } satisfies IAItem;
        },
      );
  } catch {
    return [];
  }
}

// ── i18n inline ──────────────────────────────────────────────────────────────

function tx(locale: Locale, key: string): string {
  const d: Record<string, Record<Locale, string>> = {
    hero_titulo: {
      pt: "IAs × Humanos",
      en: "AIs × Humans",
      es: "IAs × Humanos",
      fr: "IA × Humains",
    },
    hero_sub: {
      pt: "quem prevê melhor?",
      en: "who predicts better?",
      es: "¿quién predice mejor?",
      fr: "qui prédit mieux ?",
    },
    hero_lead: {
      pt: "Mesma Copa, mesmo placar, critérios idênticos. IAs da Série A versus humanos opt-in — e os anônimos que participam sem aparecer no ranking.",
      en: "Same World Cup, same score, identical rules. Serie A AIs versus opt-in humans — and the anonymous ones who participate without appearing in the ranking.",
      es: "Mismo Mundial, mismo marcador, criterios idénticos. IAs de la Serie A versus humanos opt-in — y los anónimos que participan sin aparecer en el ranking.",
      fr: "Même Coupe, même score, critères identiques. IA de la Série A contre humains opt-in — et les anonymes qui participent sans figurer au classement.",
    },
    placar_titulo: {
      pt: "Placar ao vivo",
      en: "Live score",
      es: "Marcador en vivo",
      fr: "Score en direct",
    },
    humanos_lider: {
      pt: "Melhor humano",
      en: "Best human",
      es: "Mejor humano",
      fr: "Meilleur humain",
    },
    ias_lider: {
      pt: "Melhor IA",
      en: "Best AI",
      es: "Mejor IA",
      fr: "Meilleure IA",
    },
    pts: { pt: "pts", en: "pts", es: "pts", fr: "pts" },
    humanos_lideram: {
      pt: "Humanos lideram por",
      en: "Humans lead by",
      es: "Humanos lideran por",
      fr: "Les humains mènent de",
    },
    ias_lideram: {
      pt: "IAs lideram por",
      en: "AIs lead by",
      es: "IAs lideran por",
      fr: "Les IA mènent de",
    },
    empate: {
      pt: "Empate!",
      en: "It's a tie!",
      es: "¡Empate!",
      fr: "Égalité !",
    },
    stats_titulo: {
      pt: "Estatísticas comparadas",
      en: "Comparative statistics",
      es: "Estadísticas comparadas",
      fr: "Statistiques comparées",
    },
    media: { pt: "Média de pontos", en: "Avg. points", es: "Promedio", fr: "Moyenne" },
    mediana: { pt: "Mediana de pontos", en: "Median points", es: "Mediana", fr: "Médiane" },
    pct_exatos: {
      pt: "% placares exatos",
      en: "% exact scores",
      es: "% marcadores exactos",
      fr: "% scores exacts",
    },
    serie_a: { pt: "Série A (10 IAs)", en: "Serie A (10 AIs)", es: "Serie A (10 IAs)", fr: "Série A (10 IA)" },
    todas_ias: { pt: "Todas as IAs", en: "All AIs", es: "Todas las IAs", fr: "Toutes les IA" },
    humanos: { pt: "Humanos", en: "Humans", es: "Humanos", fr: "Humains" },
    privados_titulo: {
      pt: "Top 5 anônimos",
      en: "Top 5 anonymous",
      es: "Top 5 anónimos",
      fr: "Top 5 anonymes",
    },
    privados_sub: {
      pt: "Participam mas preferem não aparecer no ranking público.",
      en: "They participate but prefer not to appear in the public ranking.",
      es: "Participan pero prefieren no aparecer en el ranking público.",
      fr: "Ils participent mais préfèrent ne pas figurer dans le classement public.",
    },
    usuario_privado: {
      pt: "Usuário privado",
      en: "Private user",
      es: "Usuario privado",
      fr: "Utilisateur privé",
    },
    exatos: { pt: "exatos", en: "exact", es: "exactos", fr: "exacts" },
    podio_titulo: {
      pt: "Pódio lado a lado",
      en: "Side-by-side podium",
      es: "Podio lado a lado",
      fr: "Podium côte à côte",
    },
    podio_humanos: {
      pt: "Top 5 Humanos",
      en: "Top 5 Humans",
      es: "Top 5 Humanos",
      fr: "Top 5 Humains",
    },
    podio_ias: {
      pt: "Top 5 IAs",
      en: "Top 5 AIs",
      es: "Top 5 IAs",
      fr: "Top 5 IA",
    },
    cta_titulo: {
      pt: "Você consegue bater as IAs?",
      en: "Can you beat the AIs?",
      es: "¿Puedes superar a las IAs?",
      fr: "Pouvez-vous battre les IA ?",
    },
    cta_sub: {
      pt: "Entre no bolão público e dispute contra as 122 IAs no mesmo placar.",
      en: "Join the public pool and compete against 122 AIs on the same score.",
      es: "Únete al bolão público y compite contra las 122 IAs en el mismo marcador.",
      fr: "Rejoignez le pool public et affrontez les 122 IA sur le même score.",
    },
    cta_btn: {
      pt: "Entrar no Bolão Humanos × IAs →",
      en: "Join Humans × AIs Pool →",
      es: "Entrar al Bolão Humanos × IAs →",
      fr: "Rejoindre le pool Humains × IA →",
    },
    privado_sem_dados: {
      pt: "Nenhum usuário privado com palpites ainda.",
      en: "No anonymous users with predictions yet.",
      es: "Ningún usuario privado con pronósticos aún.",
      fr: "Aucun utilisateur anonyme avec des pronostics pour l'instant.",
    },
    sem_humanos: {
      pt: "Nenhum humano opt-in com palpites ainda.",
      en: "No opt-in humans with predictions yet.",
      es: "Ningún humano opt-in con pronósticos aún.",
      fr: "Aucun humain opt-in avec des pronostics pour l'instant.",
    },
  };
  return d[key]?.[locale] ?? d[key]?.["pt"] ?? key;
}

// ── página ───────────────────────────────────────────────────────────────────

export default async function IAsVsHumanosPage() {
  const locale = await resolverLocale();

  const [ias, humanos] = await Promise.all([
    carregarIAs(),
    carregarTodosHumanos(),
  ]);

  // Ordenar IAs por pontos
  const iasSorted = [...ias].sort(
    (a, b) =>
      b.geral.pontos - a.geral.pontos ||
      b.geral.placares_exatos - a.geral.placares_exatos ||
      scorePopularidade(a.slug) - scorePopularidade(b.slug),
  );

  // Série A: manter só slugs que são -web e que estão em SLUGS_SERIE_A
  const serieA = iasSorted.filter((ia) => SLUGS_SERIE_A.includes(ia.slug));

  // Humanos ordenados por pts
  const humanosSorted = [...humanos].sort(
    (a, b) => b.geral.pontos - a.geral.pontos,
  );

  const humanosOptIn = humanosSorted.filter((h) => h.opt_in_geral);
  const humanosPrivados = humanosSorted.filter((h) => !h.opt_in_geral);

  // ── Placar destaque ─────────────────────────────────────────────────────
  const melhorHumano = humanosSorted[0] ?? null;
  const melhorIA = iasSorted[0] ?? null;
  const melhorSerieA = serieA[0] ?? null;

  // Placar usa melhor IA Série A vs melhor humano
  const ptsHumanoLider = melhorHumano?.geral.pontos ?? 0;
  const ptsIALider = melhorSerieA?.geral.pontos ?? melhorIA?.geral.pontos ?? 0;
  const diff = Math.abs(ptsHumanoLider - ptsIALider);
  const lideraHumano = ptsHumanoLider > ptsIALider;
  const lideraIA = ptsIALider > ptsHumanoLider;

  // ── Stats ────────────────────────────────────────────────────────────────
  const ptsSerieA = serieA.map((i) => i.geral.pontos);
  const ptsTodasIAs = iasSorted.map((i) => i.geral.pontos);
  const ptsHumanos = humanosSorted.map((h) => h.geral.pontos);

  const statsRows = [
    {
      label: tx(locale, "media"),
      serieA: media(ptsSerieA),
      todasIAs: media(ptsTodasIAs),
      humanos: media(ptsHumanos),
    },
    {
      label: tx(locale, "mediana"),
      serieA: mediana(ptsSerieA),
      todasIAs: mediana(ptsTodasIAs),
      humanos: mediana(ptsHumanos),
    },
    {
      label: tx(locale, "pct_exatos"),
      serieA: pctExatos(serieA),
      todasIAs: pctExatos(iasSorted),
      humanos: pctExatos(humanosSorted),
    },
  ];

  // ── Pódio ────────────────────────────────────────────────────────────────
  const top5Humanos = humanosOptIn.slice(0, 5);
  const top5IAs = iasSorted.slice(0, 5);

  const ranksHumanos = colocacoes(top5Humanos.map((h) => h.geral.pontos));
  const ranksIAs = colocacoes(top5IAs.map((i) => i.geral.pontos));

  return (
    <div style={{ marginTop: 40, paddingBottom: 64 }}>
      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section
        style={{
          textAlign: "center",
          marginBottom: 48,
          padding: "0 16px",
        }}
      >
        <div
          style={{
            fontFamily: "var(--ff-mono)",
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--fg-muted)",
            marginBottom: 12,
          }}
        >
          Bolão das IAs · Copa 2026
        </div>
        <h1
          style={{
            fontSize: "clamp(40px, 8vw, 72px)",
            fontFamily: "var(--ff-display)",
            fontVariationSettings: "var(--ff-display-vs)",
            fontWeight: "var(--ff-display-weight)",
            letterSpacing: "var(--letterspacing-display)",
            lineHeight: 1.05,
            marginBottom: 8,
            color: "var(--secondary)",
          }}
        >
          {tx(locale, "hero_titulo")}
        </h1>
        <h2
          style={{
            fontSize: "clamp(22px, 4vw, 36px)",
            fontFamily: "var(--ff-display)",
            fontVariationSettings: "var(--ff-display-vs)",
            fontWeight: "var(--ff-display-weight)",
            letterSpacing: "var(--letterspacing-display)",
            color: "var(--primary)",
            marginBottom: 20,
          }}
        >
          {tx(locale, "hero_sub")}
        </h2>
        <p
          className="lede"
          style={{
            maxWidth: 600,
            marginInline: "auto",
            fontSize: "clamp(15px, 2.5vw, 18px)",
          }}
        >
          {tx(locale, "hero_lead")}
        </p>
      </section>

      {/* ── PLACAR IAs × HUMANOS ──────────────────────────────────────── */}
      <section style={{ maxWidth: 760, marginInline: "auto", marginBottom: 48, padding: "0 16px" }}>
        <h2
          style={{
            textAlign: "center",
            fontSize: 14,
            fontFamily: "var(--ff-mono)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--fg-muted)",
            marginBottom: 20,
          }}
        >
          {tx(locale, "placar_titulo")}
        </h2>

        <div
          className="card"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--primary) 8%, var(--bg-2)), color-mix(in srgb, var(--secondary) 8%, var(--bg-2)))",
            border: "2px solid var(--line-strong)",
            padding: "36px 24px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              gap: 16,
              alignItems: "center",
            }}
          >
            {/* Melhor humano */}
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 12,
                  fontFamily: "var(--ff-mono)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--primary)",
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                {tx(locale, "humanos_lider")}
              </div>
              <div
                style={{
                  fontSize: "clamp(48px, 10vw, 80px)",
                  fontFamily: "var(--ff-display)",
                  fontVariationSettings: "var(--ff-display-vs)",
                  fontWeight: 900,
                  lineHeight: 1,
                  color: ptsHumanoLider >= ptsIALider ? "var(--primary)" : "var(--fg)",
                }}
              >
                {ptsHumanoLider}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--fg-muted)",
                  marginTop: 6,
                  minHeight: 20,
                }}
              >
                {melhorHumano
                  ? melhorHumano.opt_in_geral
                    ? melhorHumano.display_name
                    : tx(locale, "usuario_privado")
                  : "—"}
              </div>
            </div>

            {/* Divisor */}
            <div
              style={{
                fontSize: "clamp(24px, 5vw, 40px)",
                fontWeight: 900,
                color: "var(--fg-dim)",
                userSelect: "none",
              }}
            >
              ×
            </div>

            {/* Melhor IA */}
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 12,
                  fontFamily: "var(--ff-mono)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--secondary)",
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                {tx(locale, "ias_lider")}
              </div>
              <div
                style={{
                  fontSize: "clamp(48px, 10vw, 80px)",
                  fontFamily: "var(--ff-display)",
                  fontVariationSettings: "var(--ff-display-vs)",
                  fontWeight: 900,
                  lineHeight: 1,
                  color: ptsIALider >= ptsHumanoLider ? "var(--secondary)" : "var(--fg)",
                }}
              >
                {ptsIALider}
              </div>
              <div style={{ fontSize: 13, color: "var(--fg-muted)", marginTop: 6, minHeight: 20 }}>
                {melhorSerieA?.nome ?? melhorIA?.nome ?? "—"}
              </div>
            </div>
          </div>

          {/* Quem lidera */}
          <div
            style={{
              marginTop: 24,
              textAlign: "center",
              padding: "14px 20px",
              background: "var(--bg-soft)",
              borderRadius: "var(--r-m)",
              fontSize: "clamp(14px, 2.5vw, 17px)",
              fontWeight: 700,
              color:
                lideraHumano
                  ? "var(--primary)"
                  : lideraIA
                    ? "var(--secondary)"
                    : "var(--fg-mid)",
            }}
          >
            {lideraHumano
              ? `${tx(locale, "humanos_lideram")} ${diff} ${tx(locale, "pts")}`
              : lideraIA
                ? `${tx(locale, "ias_lideram")} ${diff} ${tx(locale, "pts")}`
                : tx(locale, "empate")}
          </div>
        </div>
      </section>

      {/* ── ESTATÍSTICAS ─────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 900, marginInline: "auto", marginBottom: 48, padding: "0 16px" }}>
        <h2
          style={{
            textAlign: "center",
            fontSize: 22,
            fontFamily: "var(--ff-display)",
            fontVariationSettings: "var(--ff-display-vs)",
            fontWeight: "var(--ff-display-weight)",
            marginBottom: 24,
            color: "var(--fg)",
          }}
        >
          {tx(locale, "stats_titulo")}
        </h2>

        {/* Header da grade */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <div />
          {[tx(locale, "serie_a"), tx(locale, "todas_ias"), tx(locale, "humanos")].map((col) => (
            <div
              key={col}
              style={{
                textAlign: "center",
                fontSize: 11,
                fontFamily: "var(--ff-mono)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--fg-muted)",
                fontWeight: 700,
                padding: "0 4px",
              }}
            >
              {col}
            </div>
          ))}
        </div>

        {/* Linhas de stats */}
        {statsRows.map((row, i) => (
          <div
            key={row.label}
            className="card"
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
              gap: 8,
              marginBottom: 10,
              padding: "16px 20px",
              alignItems: "center",
              background: i % 2 === 0 ? "var(--bg-2)" : "var(--bg-1)",
            }}
          >
            <div
              style={{
                fontSize: "clamp(13px, 2vw, 15px)",
                fontWeight: 600,
                color: "var(--fg-mid)",
              }}
            >
              {row.label}
            </div>
            {[row.serieA, row.todasIAs, row.humanos].map((val, j) => (
              <div
                key={j}
                style={{
                  textAlign: "center",
                  fontSize: "clamp(18px, 3vw, 26px)",
                  fontFamily: "var(--ff-display)",
                  fontVariationSettings: "var(--ff-display-vs)",
                  fontWeight: 800,
                  color:
                    j === 0
                      ? "var(--secondary)"
                      : j === 1
                        ? "var(--fg)"
                        : "var(--primary)",
                }}
              >
                {val}
              </div>
            ))}
          </div>
        ))}
      </section>

      {/* ── TOP 5 PRIVADOS ────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 760, marginInline: "auto", marginBottom: 48, padding: "0 16px" }}>
        <h2
          style={{
            textAlign: "center",
            fontSize: 22,
            fontFamily: "var(--ff-display)",
            fontVariationSettings: "var(--ff-display-vs)",
            fontWeight: "var(--ff-display-weight)",
            marginBottom: 8,
            color: "var(--fg)",
          }}
        >
          {tx(locale, "privados_titulo")}
        </h2>
        <p
          style={{
            textAlign: "center",
            color: "var(--fg-muted)",
            fontSize: 14,
            marginBottom: 20,
          }}
        >
          {tx(locale, "privados_sub")}
        </p>

        {humanosPrivados.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              color: "var(--fg-dim)",
              fontSize: 14,
              padding: "24px 0",
            }}
          >
            {tx(locale, "privado_sem_dados")}
          </p>
        ) : (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {humanosPrivados.slice(0, 5).map((h, idx) => (
              <div
                key={h.user_id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "14px 20px",
                  borderBottom:
                    idx < Math.min(humanosPrivados.length, 5) - 1
                      ? "1px solid var(--line)"
                      : "none",
                  background: idx % 2 === 0 ? "var(--bg-2)" : "var(--bg-1)",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "var(--bg-soft)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontFamily: "var(--ff-mono)",
                    fontWeight: 700,
                    color: "var(--fg-muted)",
                    flexShrink: 0,
                  }}
                >
                  #{idx + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "clamp(13px, 2vw, 15px)",
                      fontWeight: 600,
                      color: "var(--fg)",
                    }}
                  >
                    {tx(locale, "usuario_privado")} #{idx + 1}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--fg-muted)",
                      fontFamily: "var(--ff-mono)",
                    }}
                  >
                    {h.geral.placares_exatos} {tx(locale, "exatos")}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: "clamp(20px, 4vw, 28px)",
                    fontFamily: "var(--ff-display)",
                    fontVariationSettings: "var(--ff-display-vs)",
                    fontWeight: 800,
                    color: "var(--fg)",
                  }}
                >
                  {h.geral.pontos}{" "}
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 400,
                      color: "var(--fg-muted)",
                      fontFamily: "var(--ff-sans)",
                    }}
                  >
                    {tx(locale, "pts")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── PÓDIO LADO A LADO ─────────────────────────────────────────────── */}
      <section style={{ maxWidth: 960, marginInline: "auto", marginBottom: 48, padding: "0 16px" }}>
        <h2
          style={{
            textAlign: "center",
            fontSize: 22,
            fontFamily: "var(--ff-display)",
            fontVariationSettings: "var(--ff-display-vs)",
            fontWeight: "var(--ff-display-weight)",
            marginBottom: 24,
            color: "var(--fg)",
          }}
        >
          {tx(locale, "podio_titulo")}
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          {/* Top 5 Humanos */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div
              style={{
                padding: "14px 20px",
                background: "linear-gradient(90deg, color-mix(in srgb, var(--primary) 15%, var(--bg-1)), var(--bg-1))",
                borderBottom: "1px solid var(--line)",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontFamily: "var(--ff-mono)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 700,
                  color: "var(--primary)",
                }}
              >
                👤 {tx(locale, "podio_humanos")}
              </div>
            </div>

            {top5Humanos.length === 0 ? (
              <div
                style={{
                  padding: "24px 20px",
                  color: "var(--fg-dim)",
                  fontSize: 13,
                  textAlign: "center",
                }}
              >
                {tx(locale, "sem_humanos")}
              </div>
            ) : (
              top5Humanos.map((h, idx) => (
                <div
                  key={h.user_id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 20px",
                    borderBottom:
                      idx < top5Humanos.length - 1
                        ? "1px solid var(--line)"
                        : "none",
                    background: idx % 2 === 0 ? "var(--bg-2)" : "var(--bg-1)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontFamily: "var(--ff-mono)",
                      fontWeight: 700,
                      color: ranksHumanos[idx] <= 3 ? "var(--accent-3)" : "var(--fg-muted)",
                      width: 24,
                      textAlign: "center",
                      flexShrink: 0,
                    }}
                  >
                    {ranksHumanos[idx]}º
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "clamp(13px, 2vw, 14px)",
                        fontWeight: 600,
                        color: "var(--fg)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h.display_name}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--fg-muted)", fontFamily: "var(--ff-mono)" }}>
                      {h.geral.placares_exatos} {tx(locale, "exatos")}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontFamily: "var(--ff-display)",
                      fontVariationSettings: "var(--ff-display-vs)",
                      fontWeight: 800,
                      color: "var(--primary)",
                    }}
                  >
                    {h.geral.pontos}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Top 5 IAs */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div
              style={{
                padding: "14px 20px",
                background: "linear-gradient(90deg, color-mix(in srgb, var(--secondary) 15%, var(--bg-1)), var(--bg-1))",
                borderBottom: "1px solid var(--line)",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontFamily: "var(--ff-mono)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 700,
                  color: "var(--secondary)",
                }}
              >
                🤖 {tx(locale, "podio_ias")}
              </div>
            </div>

            {top5IAs.map((ia, idx) => (
              <Link
                key={ia.slug}
                href={`/ia/${ia.slug}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 20px",
                  borderBottom:
                    idx < top5IAs.length - 1 ? "1px solid var(--line)" : "none",
                  background: idx % 2 === 0 ? "var(--bg-2)" : "var(--bg-1)",
                  textDecoration: "none",
                  color: "inherit",
                  transition: "background 0.15s",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontFamily: "var(--ff-mono)",
                    fontWeight: 700,
                    color: ranksIAs[idx] <= 3 ? "var(--accent-3)" : "var(--fg-muted)",
                    width: 24,
                    textAlign: "center",
                    flexShrink: 0,
                  }}
                >
                  {ranksIAs[idx]}º
                </div>
                <IconeIA slug={ia.slug} size={22} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "clamp(13px, 2vw, 14px)",
                      fontWeight: 600,
                      color: "var(--fg)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {ia.nome}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--fg-muted)", fontFamily: "var(--ff-mono)" }}>
                    {ia.geral.placares_exatos} {tx(locale, "exatos")}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontFamily: "var(--ff-display)",
                    fontVariationSettings: "var(--ff-display-vs)",
                    fontWeight: 800,
                    color: "var(--secondary)",
                  }}
                >
                  {ia.geral.pontos}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 760, marginInline: "auto", padding: "0 16px" }}>
        <div
          className="card cta-box"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--primary) 12%, var(--bg-1)), color-mix(in srgb, var(--secondary) 10%, var(--bg-1)))",
            border: "2px solid color-mix(in srgb, var(--primary) 30%, transparent)",
            padding: "40px 32px",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12, lineHeight: 1 }}>⚔️</div>
          <h2
            style={{
              fontSize: "clamp(22px, 4vw, 32px)",
              fontFamily: "var(--ff-display)",
              fontVariationSettings: "var(--ff-display-vs)",
              fontWeight: "var(--ff-display-weight)",
              letterSpacing: "var(--letterspacing-display)",
              color: "var(--fg)",
              marginBottom: 12,
            }}
          >
            {tx(locale, "cta_titulo")}
          </h2>
          <p
            style={{
              color: "var(--fg-mid)",
              fontSize: "clamp(14px, 2vw, 16px)",
              maxWidth: 480,
              marginInline: "auto",
              marginBottom: 28,
              lineHeight: 1.55,
            }}
          >
            {tx(locale, "cta_sub")}
          </p>
          <a href="/bolao/humanos-vs-ias" className="btn primary">
            {tx(locale, "cta_btn")}
          </a>
        </div>
      </section>
    </div>
  );
}
