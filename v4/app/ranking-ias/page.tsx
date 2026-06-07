import Link from "next/link";
import { promises as fs } from "fs";
import path from "path";
import IconeIA from "@/components/IconeIA";
import DoacaoBanner from "@/components/DoacaoBanner";
import SerieA from "@/components/SerieA";
import { resolverLocale } from "@/lib/locale-server";
import {
  marcaDe,
  scorePopularidade,
  MARCAS,
  ORDEM_POPULARIDADE,
  type FamiliaIA,
} from "@/lib/ias";

type IA = { slug: string; nome: string };

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
      (ia: { slug?: string; nome_display?: string }) => ({
        slug: ia.slug ?? "",
        nome: ia.nome_display ?? ia.slug ?? "",
      }),
    );
  } catch {
    return [];
  }
}

export const metadata = {
  title: "🤖 As 122 IAs · Bolão das IAs",
  description:
    "Apresentação das 122 IAs do bolão, organizadas por empresa. Para o ranking competitivo, veja /ranking-geral.",
};

export default async function IAsPage() {
  const ias = await carregarIAs();
  const locale = await resolverLocale();
  const en = locale === "en";
  const es = locale === "es";
  const fr = locale === "fr";

  const desafiantes = ias.filter((ia) => !SLUGS_SERIE_A.has(ia.slug));

  // agrupa por família + ordena dentro
  const porFamilia: Record<string, IA[]> = {};
  for (const ia of desafiantes) {
    const fam = marcaDe(ia.slug).familia;
    (porFamilia[fam] ??= []).push(ia);
  }
  const familiasOrdenadas = ORDEM_POPULARIDADE
    .map((fam) => ({
      familia: fam,
      lista: (porFamilia[fam] ?? []).sort(
        (a, b) => scorePopularidade(a.slug) - scorePopularidade(b.slug),
      ),
    }))
    .filter((f) => f.lista.length > 0);

  const tit = en
    ? `🤖 The ${ias.length} AIs`
    : es
      ? `🤖 Las ${ias.length} IAs`
      : fr
        ? `🤖 Les ${ias.length} IA`
        : `🤖 As ${ias.length} IAs`;
  const lede = en
    ? "Each one received the same prompt and predicted the 104 World Cup 2026 matches. This page is informative — for the competitive ranking (humans + AIs), see "
    : es
      ? "Cada una recibió el mismo prompt y pronosticó los 104 partidos del Mundial 2026. Esta página es informativa — para el ranking competitivo (humanos + IAs), ver "
      : fr
        ? "Chacune a reçu le même prompt et a prédit les 104 matches. Cette page est informative — pour le classement compétitif (humains + IA), voir "
        : "Cada uma recebeu o mesmo prompt e palpitou os 104 jogos. Esta página é informativa — para o ranking competitivo (humanos + IAs), veja ";
  const rankingLabel = en
    ? "the General Ranking"
    : es
      ? "el Ranking General"
      : fr
        ? "le Classement Général"
        : "o Ranking Geral";

  return (
    <div style={{ marginTop: 32, marginBottom: 64 }}>
      <header style={{ textAlign: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: "clamp(34px, 6vw, 56px)" }}>{tit}</h1>
        <p
          className="lede"
          style={{ marginTop: 12, maxWidth: 700, marginInline: "auto" }}
        >
          {lede}
          <Link href="/ranking-geral" style={{ color: "var(--primary)", fontWeight: 700 }}>
            {rankingLabel}
          </Link>
          .
        </p>
      </header>

      <SerieA locale={locale} />

      <DoacaoBanner variante="ias" locale={locale} />

      <section style={{ marginTop: 40 }}>
        <h2 style={{ textAlign: "center", marginBottom: 8 }}>
          {en
            ? "+ Other 112 challengers"
            : es
              ? "+ Otros 112 desafiantes"
              : fr
                ? "+ 112 autres challengers"
                : "+ Outros 112 desafiantes"}
        </h2>
        <p
          style={{
            textAlign: "center",
            color: "var(--fg-mid)",
            fontSize: 14,
            marginBottom: 28,
            maxWidth: 540,
            marginInline: "auto",
          }}
        >
          {en
            ? "Models grouped by maker, in order of popularity."
            : es
              ? "Modelos agrupados por marca, por orden de popularidad."
              : fr
                ? "Modèles par marque, par ordre de popularité."
                : "Modelos agrupados por empresa, em ordem de popularidade."}
        </p>

        {familiasOrdenadas.map(({ familia, lista }) => {
          const marca = MARCAS[familia as FamiliaIA];
          return (
            <div key={familia} className="familia-bloco">
              <div className="familia-head">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={marca.logo}
                  alt={marca.nome}
                  style={{
                    width: 40,
                    height: 40,
                    objectFit: "contain",
                    flexShrink: 0,
                  }}
                />
                <strong>{marca.nome}</strong>
                <span className="familia-count">
                  {lista.length} {lista.length === 1 ? "modelo" : "modelos"}
                </span>
              </div>
              <div className="ias-mini-grid">
                {lista.map((ia) => (
                  <div key={ia.slug} className="ia-mini" id={ia.slug}>
                    <IconeIA slug={ia.slug} size={36} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong>{ia.nome}</strong>
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
          {en
            ? "🏆 See the competitive ranking"
            : es
              ? "🏆 Ver el ranking competitivo"
              : fr
                ? "🏆 Voir le classement"
                : "🏆 Ver o ranking competitivo"}
        </h2>
        <p style={{ color: "var(--fg-mid)", marginBottom: 18 }}>
          {en
            ? "Who's winning — humans + AIs, all on the same scoreboard."
            : es
              ? "Quién va ganando — humanos + IAs en el mismo placar."
              : fr
                ? "Qui mène — humains + IA sur le même tableau."
                : "Quem está vencendo — humanos + IAs no mesmo placar."}
        </p>
        <Link href="/ranking-geral" className="btn primary">
          {en
            ? "Open General Ranking →"
            : es
              ? "Abrir Ranking General →"
              : fr
                ? "Ouvrir le Classement →"
                : "Abrir Ranking Geral →"}
        </Link>
      </div>
    </div>
  );
}
