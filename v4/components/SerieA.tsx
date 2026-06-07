import { promises as fs } from "fs";
import path from "path";
import { t, type Locale } from "@/lib/i18n";
import { marcaDe, MARCAS } from "@/lib/ias";

type IA = {
  slug: string;
  nome_display: string;
  pontos: number;
  placares_exatos: number;
  jogos_palpitados: number;
  rank: number;
};

const SLUGS_SERIE_A = [
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
];

const APELIDOS: Record<string, { nome: string; modelo: string }> = {
  "chatgpt-5-thinking-web": { nome: "ChatGPT 5 Thinking", modelo: "GPT-5 Pro (Thinking)" },
  "claude-opus-4-7-web": { nome: "Claude Opus 4.7", modelo: "Anthropic Opus 4.7" },
  "gemini-2-5-pro-web": { nome: "Gemini 2.5 Pro", modelo: "Google Gemini 2.5 Pro" },
  "grok-4-heavy-web": { nome: "Grok 4 Heavy", modelo: "xAI Grok 4 Heavy" },
  "deepseek-r1-web": { nome: "DeepSeek R1", modelo: "DeepSeek R1 Reasoning" },
  "copilot-microsoft-web": { nome: "Microsoft Copilot", modelo: "Copilot (GPT-5 base)" },
  "perplexity-sonar-pro-web": { nome: "Perplexity Sonar", modelo: "Sonar Pro w/ search" },
  "meta-llama-4-web": { nome: "Meta Llama 4", modelo: "Llama 4 Maverick" },
  "le-chat-mistral-web": { nome: "Le Chat Mistral", modelo: "Mistral Large 2" },
  "qwen-3-max-web": { nome: "Qwen 3 Max", modelo: "Alibaba Qwen 3 Max" },
};

async function carregarSerieA(): Promise<IA[]> {
  try {
    const arquivo = path.join(process.cwd(), "public", "ranking-ias.json");
    const raw = await fs.readFile(arquivo, "utf-8");
    const dados = JSON.parse(raw) as { ias: IA[] };
    const ias = dados.ias.filter((i) => SLUGS_SERIE_A.includes(i.slug));
    return ias.sort((a, b) => b.pontos - a.pontos || a.slug.localeCompare(b.slug));
  } catch {
    return [];
  }
}

export default async function SerieA({
  locale = "pt",
  variante = "compact",
}: {
  locale?: Locale;
  variante?: "compact" | "destaque";
}) {
  const ias = await carregarSerieA();
  if (ias.length === 0) return null;

  const sufixoJogos =
    locale === "en" ? "matches" : locale === "es" ? "partidos" : locale === "fr" ? "matches" : "jogos";
  const sufixoExatos =
    locale === "en" ? "exact" : locale === "es" ? "exactos" : locale === "fr" ? "exacts" : "exatos";

  const wrapCls =
    variante === "destaque" ? "serie-a-grid destaque" : "serie-a-grid";

  return (
    <section className="section serie-a-vitrine">
      <div className="container">
        <h2 style={{ textAlign: "center", marginBottom: 8 }}>
          {t(locale, "home.serie_a.titulo")}
        </h2>
        <p
          style={{
            textAlign: "center",
            color: "var(--fg-mid)",
            fontSize: 16,
            marginBottom: 36,
          }}
        >
          {t(locale, "home.serie_a.sub")}
        </p>

        <div className={wrapCls}>
          {ias.map((ia, i) => {
            const ap = APELIDOS[ia.slug];
            const nome = ap?.nome ?? ia.nome_display;
            const modelo = ap?.modelo ?? "";
            const marca = MARCAS[marcaDe(ia.slug)];
            return (
              <a
                key={ia.slug}
                href={`/ias#${encodeURIComponent(ia.slug)}`}
                className="ia-card"
              >
                <div className="ia-rank">{i + 1}º</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/mascots/${ia.slug}.png`}
                  alt={`Mascote ${nome}`}
                  width={variante === "destaque" ? 200 : 120}
                  height={variante === "destaque" ? 200 : 120}
                  loading="lazy"
                />
                <div className="ia-card-body">
                  <h3>{nome}</h3>
                  {modelo && (
                    <p className="ia-modelo">
                      <span
                        style={{
                          color: marca.cor,
                          fontWeight: 800,
                        }}
                      >
                        {marca.nome}
                      </span>
                      <span style={{ opacity: 0.5 }}> · </span>
                      {modelo.replace(`${marca.nome} `, "").replace(`${marca.nome}, `, "")}
                    </p>
                  )}
                  <div className="ia-pontos">
                    <strong>{ia.pontos}</strong>
                    <span>pts</span>
                  </div>
                  <small>
                    {ia.jogos_palpitados} {sufixoJogos} ·{" "}
                    {ia.placares_exatos} {sufixoExatos}
                  </small>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
