import { promises as fs } from "fs";
import path from "path";
import { t, type Locale } from "@/lib/i18n";
import { marcaDe, scorePopularidade } from "@/lib/ias";
import IconeIA from "@/components/IconeIA";

type IA = {
  slug: string;
  nome_display: string;
  pontos: number;
  placares_exatos: number;
  jogos_palpitados: number;
  rank: number;
};

const SLUG_FABLE = "claude-fable-5";

const SLUGS_SERIE_A = [
  "chatgpt-5-thinking-web",
  "claude-opus-4-8-web",
  "gemini-2-5-pro-web",
  "grok-4-heavy-web",
  "deepseek-r1-web",
  "copilot-microsoft-web",
  "perplexity-sonar-pro-web",
  "meta-llama-4-web",
  "le-chat-mistral-web",
  "qwen-3-max-web",
  SLUG_FABLE,
];

const APELIDOS: Record<string, { nome: string; modelo: string }> = {
  "chatgpt-5-thinking-web": { nome: "ChatGPT 5 Thinking", modelo: "GPT-5 Pro (Thinking)" },
  "claude-opus-4-8-web": { nome: "Claude Opus 4.8", modelo: "Anthropic Opus 4.8" },
  "gemini-2-5-pro-web": { nome: "Gemini 2.5 Pro", modelo: "Google Gemini 2.5 Pro" },
  "grok-4-heavy-web": { nome: "Grok 4 Heavy", modelo: "xAI Grok 4 Heavy" },
  "deepseek-r1-web": { nome: "DeepSeek R1", modelo: "DeepSeek R1 Reasoning" },
  "copilot-microsoft-web": { nome: "Microsoft Copilot", modelo: "Copilot (GPT-5 base)" },
  "perplexity-sonar-pro-web": { nome: "Perplexity Sonar", modelo: "Sonar Pro w/ search" },
  "meta-llama-4-web": { nome: "Meta Llama 4", modelo: "Llama 4 Maverick" },
  "le-chat-mistral-web": { nome: "Le Chat Mistral", modelo: "Mistral Large 2" },
  "qwen-3-max-web": { nome: "Qwen 3 Max", modelo: "Alibaba Qwen 3 Max" },
  [SLUG_FABLE]: { nome: "Anthropic Fable", modelo: "Claude Fable 5 · novo" },
};

// Pra cada slug "-web" da Série A, qual o irmão sem "-web" pra fallback
// quando o web ainda não tem palpites coletados.
const FALLBACK_NAO_WEB: Record<string, string> = {
  "chatgpt-5-thinking-web": "chatgpt-5-thinking",
  "claude-opus-4-8-web": "claude-opus-4-7",
  "gemini-2-5-pro-web": "gemini-2-5-pro",
  "grok-4-heavy-web": "grok-4-heavy",
  "deepseek-r1-web": "deepseek-r1",
  "copilot-microsoft-web": "copilot-microsoft",
  "perplexity-sonar-pro-web": "perplexity-sonar-pro",
  "meta-llama-4-web": "meta-llama-4",
  "le-chat-mistral-web": "le-chat-mistral",
  "qwen-3-max-web": "qwen-3-max",
};

async function carregarSerieA(): Promise<IA[]> {
  try {
    const arquivo = path.join(process.cwd(), "public", "ranking-ias.json");
    const raw = await fs.readFile(arquivo, "utf-8");
    const dados = JSON.parse(raw) as { ias: IA[] };
    const porSlug = new Map<string, IA>();
    for (const ia of dados.ias) porSlug.set(ia.slug, ia);

    // Pra cada slug da Série A:
    // se o slug oficial não tem palpites apurados, usa do irmão sem "-web"
    const ias: IA[] = [];
    for (const slug of SLUGS_SERIE_A) {
      const oficial = porSlug.get(slug);
      const fallback = FALLBACK_NAO_WEB[slug]
        ? porSlug.get(FALLBACK_NAO_WEB[slug])
        : undefined;
      const fonte =
        oficial && oficial.jogos_palpitados > 0 ? oficial : fallback ?? oficial;
      if (!fonte) continue;
      ias.push({
        slug,
        nome_display: oficial?.nome_display ?? fonte.nome_display,
        pontos: fonte.pontos,
        placares_exatos: fonte.placares_exatos,
        jogos_palpitados: fonte.jogos_palpitados,
        rank: 0,
      });
    }

    ias.sort(
      (a, b) =>
        b.pontos - a.pontos ||
        scorePopularidade(a.slug) - scorePopularidade(b.slug),
    );

    return ias;
  } catch {
    return [];
  }
}

// Calcula rank com empate (dense ranking estilo "1, 1, 3").
function calcularRanks(ias: IA[]): number[] {
  const ranks: number[] = [];
  let rankAtual = 1;
  for (let i = 0; i < ias.length; i++) {
    if (i === 0) {
      ranks.push(1);
      continue;
    }
    if (ias[i].pontos === ias[i - 1].pontos) {
      ranks.push(rankAtual);
    } else {
      rankAtual = i + 1;
      ranks.push(rankAtual);
    }
  }
  return ranks;
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
  const ranks = calcularRanks(ias);

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
            const marca = marcaDe(ia.slug);
            const rank = ranks[i];
            const isFable = ia.slug === SLUG_FABLE;
            const dim = variante === "destaque" ? 200 : 120;

            return (
              <a
                key={ia.slug}
                href={`/ia/${encodeURIComponent(ia.slug)}`}
                className={`ia-card${isFable ? " ia-card-fable" : ""}`}
              >
                <div className="ia-rank">{rank}º</div>
                <div className="ia-mascote-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/mascots/${ia.slug}.png`}
                    alt={`Mascote ${nome}`}
                    width={dim}
                    height={dim}
                    loading="lazy"
                  />
                  <div className="ia-marca-badge" title={marca.nome}>
                    <IconeIA slug={ia.slug} size={variante === "destaque" ? 40 : 28} />
                  </div>
                </div>
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
