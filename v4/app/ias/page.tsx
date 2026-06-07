import Link from "next/link";
import { promises as fs } from "fs";
import path from "path";
import IconeIA from "@/components/IconeIA";
import DoacaoBanner from "@/components/DoacaoBanner";
import SerieA from "@/components/SerieA";
import { resolverLocale } from "@/lib/locale-server";
import { marcaDe, scorePopularidade, MARCAS } from "@/lib/ias";

type IA = {
  slug: string;
  nome: string;
  pontos: number;
  rank: number;
};

const SLUGS_SERIE_A = new Set([
  "chatgpt-5-thinking-web",
  "claude-opus-4-7-web",
  "gemini-2-5-pro-web",
  "grok-4-heavy-web",
  "deepseek-r1-web",
  "copilot-microsoft-web",
  "perplexity-sonar-pro-web",
  "meta-llama-4-web",
  "le-chat-mistral-web",
  "qwen-3-max-web",
]);

async function carregarIAs(): Promise<IA[]> {
  const filePath = path.join(process.cwd(), "public", "ranking-ias.json");
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(raw);
    return (data.ias ?? []).map(
      (
        ia: { slug?: string; nome_display?: string; pontos?: number; rank?: number },
        i: number,
      ) => ({
        slug: ia.slug ?? "",
        nome: ia.nome_display ?? ia.slug ?? "",
        pontos: ia.pontos ?? 0,
        rank: ia.rank ?? i + 1,
      }),
    );
  } catch {
    return [];
  }
}

export const metadata = {
  title: "🤖 As 122 IAs · Bolão das IAs",
  description:
    "Todas as 122 IAs — Top 10 Série A com mascotes + 112 desafiantes agrupadas por marca.",
};

export default async function IAsPage() {
  const ias = await carregarIAs();
  const locale = await resolverLocale();

  const desafiantes = ias.filter((ia) => !SLUGS_SERIE_A.has(ia.slug));

  const porFamilia: Record<string, IA[]> = {};
  for (const ia of desafiantes) {
    const fam = marcaDe(ia.slug).familia;
    (porFamilia[fam] ??= []).push(ia);
  }
  const familiasOrdenadas = Object.entries(porFamilia)
    .map(([fam, lista]) => ({
      familia: fam,
      lista: lista.sort(
        (a, b) => scorePopularidade(a.slug) - scorePopularidade(b.slug),
      ),
    }))
    .sort((a, b) => {
      const ai = Object.keys(MARCAS).indexOf(a.familia);
      const bi = Object.keys(MARCAS).indexOf(b.familia);
      return ai - bi;
    });

  const tit =
    locale === "en"
      ? `🤖 The ${ias.length} AIs`
      : locale === "es"
        ? `🤖 Las ${ias.length} IAs`
        : locale === "fr"
          ? `🤖 Les ${ias.length} IA`
          : `🤖 As ${ias.length} IAs`;
  const lede =
    locale === "en"
      ? "Each one received the same prompt and predicted the 104 World Cup 2026 matches."
      : locale === "es"
        ? "Cada una recibió el mismo prompt y pronosticó los 104 partidos del Mundial 2026."
        : locale === "fr"
          ? "Chacune a reçu le même prompt et a prédit les 104 matches de la Coupe 2026."
          : "Cada uma recebeu o mesmo prompt e palpitou os 104 jogos da Copa 2026.";

  return (
    <div style={{ marginTop: 32, marginBottom: 64 }}>
      <header style={{ textAlign: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: "clamp(34px, 6vw, 56px)" }}>{tit}</h1>
        <p
          className="lede"
          style={{ marginTop: 12, maxWidth: 640, marginInline: "auto" }}
        >
          {lede}
        </p>
      </header>

      <SerieA locale={locale} />

      <DoacaoBanner variante="ias" locale={locale} />

      <section style={{ marginTop: 40 }}>
        <h2 style={{ textAlign: "center", marginBottom: 8 }}>
          {locale === "en"
            ? "+ Challengers"
            : locale === "es"
              ? "+ Desafiantes"
              : locale === "fr"
                ? "+ Challengers"
                : "+ Desafiantes"}
        </h2>
        <p
          style={{
            textAlign: "center",
            color: "var(--fg-mid)",
            fontSize: 14,
            marginBottom: 28,
          }}
        >
          {desafiantes.length}{" "}
          {locale === "en"
            ? "smaller / specialized models, grouped by maker."
            : locale === "es"
              ? "modelos pequeños / especializados, agrupados por marca."
              : locale === "fr"
                ? "modèles plus petits / spécialisés, par marque."
                : "modelos menores / especializados, agrupados por marca."}
        </p>

        {familiasOrdenadas.map(({ familia, lista }) => {
          const marca = MARCAS[familia as keyof typeof MARCAS];
          return (
            <div key={familia} className="familia-bloco">
              <div className="familia-head">
                <IconeIA slug={lista[0].slug} size={32} />
                <strong>{marca.nome}</strong>
                <span className="familia-count">
                  {lista.length} {lista.length === 1 ? "IA" : "IAs"}
                </span>
              </div>
              <div className="ias-mini-grid">
                {lista.map((ia) => (
                  <div key={ia.slug} className="ia-mini" id={ia.slug}>
                    <IconeIA slug={ia.slug} size={24} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong>{ia.nome}</strong>
                      <small>
                        #{ia.rank} · {ia.pontos} pts
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <div
        className="card cta-box"
        style={{ marginTop: 40, textAlign: "center" }}
      >
        <h2 style={{ fontSize: 22, marginBottom: 8 }}>
          {locale === "en"
            ? "🔮 Want to bet against them?"
            : locale === "es"
              ? "🔮 ¿Apostar contra ellas?"
              : locale === "fr"
                ? "🔮 Parier contre elles ?"
                : "🔮 Quer disputar contra elas?"}
        </h2>
        <p style={{ color: "var(--fg-mid)", marginBottom: 18 }}>
          {locale === "en"
            ? "Create your account and bet on the 104 matches."
            : locale === "es"
              ? "Crea tu cuenta y pronostica los 104 partidos."
              : locale === "fr"
                ? "Créez votre compte et pronostiquez les 104 matches."
                : "Cria conta, palpita os 104 jogos, dispute o ranking."}
        </p>
        <Link href="/signup" className="btn primary">
          {locale === "en"
            ? "Create my account →"
            : locale === "es"
              ? "Crear cuenta →"
              : locale === "fr"
                ? "Créer mon compte →"
                : "Criar minha conta →"}
        </Link>
      </div>
    </div>
  );
}
