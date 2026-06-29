import Link from "next/link";
import { promises as fs } from "fs";
import path from "path";
import IconeIA from "@/components/IconeIA";
import Avatar from "@/components/Avatar";
import { resolverLocale } from "@/lib/locale-server";
import { carregarTodosHumanos, type HumanoPts } from "@/lib/humanos-pts";
import { ehSerieA, nomeSerieA, SLUGS_SERIE_A, FALLBACK_NAO_WEB } from "@/lib/serie-a";
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
  grupos: FaseStat;
  matamata: FaseStat;
  geral: FaseStat;
};

type Fase = "grupos" | "matamata" | "geral";

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

function pctExatosIA(items: IAItem[], fase: Fase): string {
  const total = items.reduce((s, i) => s + i[fase].jogos_palpitados, 0);
  const exatos = items.reduce((s, i) => s + i[fase].placares_exatos, 0);
  if (total === 0) return "0%";
  return (Math.round((exatos / total) * 1000) / 10).toFixed(1) + "%";
}

function pctExatosH(items: HumanoPts[], fase: Fase): string {
  const total = items.reduce((s, h) => s + h[fase].jogos_palpitados, 0);
  const exatos = items.reduce((s, h) => s + h[fase].placares_exatos, 0);
  if (total === 0) return "0%";
  return (Math.round((exatos / total) * 1000) / 10).toFixed(1) + "%";
}

function validarFase(raw: string | undefined): Fase {
  if (raw === "grupos" || raw === "matamata" || raw === "geral") return raw;
  return "geral";
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
          grupos?: FaseStat;
          matamata?: FaseStat;
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
            grupos: ia.grupos ?? zero,
            matamata: ia.matamata ?? zero,
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
    fase_grupos: {
      pt: "Grupos",
      en: "Groups",
      es: "Grupos",
      fr: "Groupes",
    },
    fase_matamata: {
      pt: "Mata-mata",
      en: "Knockout",
      es: "Eliminatorias",
      fr: "Élimination",
    },
    fase_geral: {
      pt: "Geral",
      en: "Overall",
      es: "General",
      fr: "Global",
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
    top_humanos_titulo: {
      pt: "Top Humanos",
      en: "Top Humans",
      es: "Top Humanos",
      fr: "Top Humains",
    },
    anonimo: {
      pt: "Anônimo",
      en: "Anonymous",
      es: "Anónimo",
      fr: "Anonyme",
    },
    usuario_privado: {
      pt: "Usuário privado",
      en: "Private user",
      es: "Usuario privado",
      fr: "Utilisateur privé",
    },
    exatos: { pt: "exatos", en: "exact", es: "exactos", fr: "exacts" },
    podio_ias: {
      pt: "Top 5 IAs",
      en: "Top 5 AIs",
      es: "Top 5 IAs",
      fr: "Top 5 IA",
    },
    sem_humanos: {
      pt: "Nenhum humano com palpites ainda.",
      en: "No humans with predictions yet.",
      es: "Ningún humano con pronósticos aún.",
      fr: "Aucun humain avec des pronostics pour l'instant.",
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
  };
  return d[key]?.[locale] ?? d[key]?.["pt"] ?? key;
}

// ── página ───────────────────────────────────────────────────────────────────

export default async function IAsVsHumanosPage({
  searchParams,
}: {
  searchParams: Promise<{ fase?: string }>;
}) {
  const locale = await resolverLocale();
  const sp = await searchParams;
  const fase: Fase = validarFase(sp.fase);

  const [ias, humanos] = await Promise.all([
    carregarIAs(),
    carregarTodosHumanos(),
  ]);

  // Ordenar IAs por pontos da fase escolhida
  const iasSorted = [...ias].sort(
    (a, b) =>
      b[fase].pontos - a[fase].pontos ||
      b[fase].placares_exatos - a[fase].placares_exatos ||
      scorePopularidade(a.slug) - scorePopularidade(b.slug),
  );

  // Série A: merge POR FASE — pra cada slug da vitrine, escolhe o melhor
  // dado disponível PER FASE entre o "-web" oficial e o irmão sem "-web".
  // Critério por fase: maior jogos_palpitados (empate → fica com o oficial,
  // ou seja, a versão Web pra mata-mata). O `geral` é a SOMA das fontes
  // escolhidas pra grupos + matamata — não vem de um único slug.
  const iasPorSlug = new Map(ias.map((i) => [i.slug, i]));
  const ZERO: FaseStat = { pontos: 0, placares_exatos: 0, vencedores_acertados: 0, jogos_palpitados: 0 };
  const pickFase = (o: FaseStat | undefined, ir: FaseStat | undefined): FaseStat => {
    const a = o ?? ZERO;
    const b = ir ?? ZERO;
    return b.jogos_palpitados > a.jogos_palpitados ? b : a;
  };
  const serieA: IAItem[] = [];
  for (const slug of SLUGS_SERIE_A) {
    const oficial = iasPorSlug.get(slug);
    const irmaoSlug = FALLBACK_NAO_WEB[slug];
    const irmao = irmaoSlug ? iasPorSlug.get(irmaoSlug) : undefined;
    if (!oficial && !irmao) continue;
    const gruposM = pickFase(oficial?.grupos, irmao?.grupos);
    const matamataM = pickFase(oficial?.matamata, irmao?.matamata);
    const geralM: FaseStat = {
      pontos: gruposM.pontos + matamataM.pontos,
      placares_exatos: gruposM.placares_exatos + matamataM.placares_exatos,
      vencedores_acertados: gruposM.vencedores_acertados + matamataM.vencedores_acertados,
      jogos_palpitados: gruposM.jogos_palpitados + matamataM.jogos_palpitados,
    };
    serieA.push({
      slug,
      nome: nomeSerieA(slug) ?? oficial?.nome ?? irmao?.nome ?? slug,
      serieA: true,
      grupos: gruposM,
      matamata: matamataM,
      geral: geralM,
    });
  }
  serieA.sort(
    (a, b) =>
      b[fase].pontos - a[fase].pontos ||
      b[fase].placares_exatos - a[fase].placares_exatos ||
      scorePopularidade(a.slug) - scorePopularidade(b.slug),
  );

  // Humanos: ordenados por pts da fase escolhida
  const humanosSorted = [...humanos].sort(
    (a, b) => b[fase].pontos - a[fase].pontos,
  );

  // ── Placar destaque ─────────────────────────────────────────────────────
  const melhorHumano = humanosSorted[0] ?? null;
  const melhorIA = iasSorted[0] ?? null;

  const ptsHumanoLider = melhorHumano?.[fase].pontos ?? 0;
  const ptsIALider = melhorIA?.[fase].pontos ?? 0;
  const diff = Math.abs(ptsHumanoLider - ptsIALider);
  const lideraHumano = ptsHumanoLider > ptsIALider;
  const lideraIA = ptsIALider > ptsHumanoLider;

  // ── Stats ────────────────────────────────────────────────────────────────
  const ptsSerieA = serieA.map((i) => i[fase].pontos);
  const ptsTodasIAs = iasSorted.map((i) => i[fase].pontos);
  const ptsHumanos = humanosSorted.map((h) => h[fase].pontos);

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
      serieA: pctExatosIA(serieA, fase),
      todasIAs: pctExatosIA(iasSorted, fase),
      humanos: pctExatosH(humanosSorted, fase),
    },
  ];

  // ── Top Humanos (mistura opt-in + privados, ordem por pts) ──────────────
  const topHumanos = humanosSorted.slice(0, 10);
  const ranksHumanos = colocacoes(topHumanos.map((h) => h[fase].pontos));

  // ── Top 5 IAs ────────────────────────────────────────────────────────────
  const top5IAs = iasSorted.slice(0, 5);
  const ranksIAs = colocacoes(top5IAs.map((i) => i[fase].pontos));

  // ── Labels de fase para o seletor ────────────────────────────────────────
  const fasesNav: { key: Fase; label: string }[] = [
    { key: "grupos", label: tx(locale, "fase_grupos") },
    { key: "matamata", label: tx(locale, "fase_matamata") },
    { key: "geral", label: tx(locale, "fase_geral") },
  ];

  return (
    <div style={{ marginTop: 40, paddingBottom: 64 }}>
      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section
        style={{
          textAlign: "center",
          marginBottom: 32,
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

      {/* ── SELETOR DE FASE ───────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          gap: 8,
          justifyContent: "center",
          marginBottom: 40,
          flexWrap: "wrap",
          padding: "0 16px",
        }}
      >
        {fasesNav.map(({ key, label }) => {
          const ativo = fase === key;
          return (
            <Link
              key={key}
              href={`?fase=${key}`}
              style={{
                padding: "8px 22px",
                borderRadius: 999,
                border: `2px solid ${ativo ? "var(--primary)" : "var(--line-strong)"}`,
                background: ativo
                  ? "color-mix(in srgb, var(--primary) 12%, transparent)"
                  : "var(--bg-2)",
                color: ativo ? "var(--primary)" : "var(--fg)",
                fontWeight: ativo ? 700 : 500,
                fontSize: 14,
                textDecoration: "none",
                transition: "all 0.15s ease",
                display: "inline-block",
              }}
            >
              {label}
            </Link>
          );
        })}
      </div>

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
                {melhorIA?.nome ?? "—"}
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

      {/* ── TOP HUMANOS (unificado opt-in + privados) ─────────────────────── */}
      <section style={{ maxWidth: 760, marginInline: "auto", marginBottom: 48, padding: "0 16px" }}>
        <h2
          style={{
            textAlign: "center",
            fontSize: 22,
            fontFamily: "var(--ff-display)",
            fontVariationSettings: "var(--ff-display-vs)",
            fontWeight: "var(--ff-display-weight)",
            marginBottom: 20,
            color: "var(--fg)",
          }}
        >
          {tx(locale, "top_humanos_titulo")}
        </h2>

        {topHumanos.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              color: "var(--fg-dim)",
              fontSize: 14,
              padding: "24px 0",
            }}
          >
            {tx(locale, "sem_humanos")}
          </p>
        ) : (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {topHumanos.map((h, idx) => {
              const rank = ranksHumanos[idx];
              const isOptIn = h.opt_in_geral;
              return (
                <div
                  key={h.user_id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "14px 20px",
                    borderBottom:
                      idx < topHumanos.length - 1
                        ? "1px solid var(--line)"
                        : "none",
                    background: idx % 2 === 0 ? "var(--bg-2)" : "var(--bg-1)",
                  }}
                >
                  {/* Colocação */}
                  <div
                    style={{
                      fontSize: 13,
                      fontFamily: "var(--ff-mono)",
                      fontWeight: 700,
                      color: rank <= 3 ? "var(--accent-3)" : "var(--fg-muted)",
                      width: 28,
                      textAlign: "center",
                      flexShrink: 0,
                    }}
                  >
                    {rank}º
                  </div>

                  {/* Avatar ou placeholder anônimo */}
                  {isOptIn ? (
                    <Avatar src={h.avatar_url} nome={h.display_name} size={36} />
                  ) : (
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        minWidth: 36,
                        borderRadius: "50%",
                        background: "var(--bg-soft)",
                        border: "1.5px solid var(--line-strong)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 16,
                        color: "var(--fg-muted)",
                        flexShrink: 0,
                      }}
                    >
                      ?
                    </div>
                  )}

                  {/* Nome */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "clamp(13px, 2vw, 15px)",
                        fontWeight: 600,
                        color: isOptIn ? "var(--fg)" : "var(--fg-muted)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {isOptIn ? h.display_name : tx(locale, "anonimo")}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--fg-muted)",
                        fontFamily: "var(--ff-mono)",
                      }}
                    >
                      {h[fase].placares_exatos} {tx(locale, "exatos")}
                    </div>
                  </div>

                  {/* Pontos */}
                  <div
                    style={{
                      fontSize: "clamp(20px, 4vw, 26px)",
                      fontFamily: "var(--ff-display)",
                      fontVariationSettings: "var(--ff-display-vs)",
                      fontWeight: 800,
                      color: isOptIn ? "var(--primary)" : "var(--fg)",
                    }}
                  >
                    {h[fase].pontos}{" "}
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
              );
            })}
          </div>
        )}
      </section>

      {/* ── TOP 5 IAs ─────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 760, marginInline: "auto", marginBottom: 48, padding: "0 16px" }}>
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
              {tx(locale, "podio_ias")}
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
                  {ia[fase].placares_exatos} {tx(locale, "exatos")}
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
                {ia[fase].pontos}
              </div>
            </Link>
          ))}
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
