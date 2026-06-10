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

const SLUG_MISTERIO = "misterio";

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
  SLUG_MISTERIO,
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
  [SLUG_MISTERIO]: { nome: "?", modelo: "???" },
};

async function carregarSerieA(): Promise<IA[]> {
  try {
    const arquivo = path.join(process.cwd(), "public", "ranking-ias.json");
    const raw = await fs.readFile(arquivo, "utf-8");
    const dados = JSON.parse(raw) as { ias: IA[] };
    const ias = dados.ias.filter((i) => SLUGS_SERIE_A.includes(i.slug));
    // ordena por: pontos desc, depois popularidade asc (não alfabético)
    ias.sort(
      (a, b) =>
        b.pontos - a.pontos ||
        scorePopularidade(a.slug) - scorePopularidade(b.slug),
    );
    // membro misterioso sempre por último, sem entrada real no ranking
    if (!ias.find((i) => i.slug === SLUG_MISTERIO)) {
      ias.push({
        slug: SLUG_MISTERIO,
        nome_display: "?",
        pontos: 0,
        placares_exatos: 0,
        jogos_palpitados: 0,
        rank: ias.length + 1,
      });
    }
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
            const isMisterio = ia.slug === SLUG_MISTERIO;
            const dim = variante === "destaque" ? 200 : 120;

            if (isMisterio) {
              return (
                <div
                  key={ia.slug}
                  className="ia-card"
                  style={{ cursor: "default" }}
                  aria-label="Membro misterioso da Série A — será revelado em breve"
                  title="Membro misterioso — em breve"
                >
                  <div className="ia-rank">?</div>
                  <div className="ia-mascote-wrap">
                    <div
                      style={{
                        width: dim,
                        height: dim,
                        borderRadius: "50%",
                        background:
                          "radial-gradient(circle at 30% 30%, #4c1d95 0%, #1e1b4b 70%, #0f0d2e 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: variante === "destaque" ? 120 : 72,
                        fontWeight: 900,
                        color: "#fff",
                        textShadow: "0 4px 24px rgba(168,85,247,0.6)",
                        border: "3px dashed rgba(168,85,247,0.5)",
                      }}
                    >
                      ?
                    </div>
                    <div
                      className="ia-marca-badge"
                      title="Mistério"
                      style={{
                        background: "#1e1b4b",
                        color: "#a855f7",
                        fontWeight: 900,
                        fontSize: variante === "destaque" ? 24 : 18,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: variante === "destaque" ? 40 : 28,
                        height: variante === "destaque" ? 40 : 28,
                      }}
                    >
                      ?
                    </div>
                  </div>
                  <div className="ia-card-body">
                    <h3>?</h3>
                    <p className="ia-modelo">
                      <span style={{ color: "#a855f7", fontWeight: 800 }}>?</span>
                      <span style={{ opacity: 0.5 }}> · </span>
                      {modelo}
                    </p>
                    <div className="ia-pontos">
                      <strong>?</strong>
                      <span>pts</span>
                    </div>
                    <small>? {sufixoJogos} · ? {sufixoExatos}</small>
                  </div>
                </div>
              );
            }

            return (
              <a
                key={ia.slug}
                href={`/ranking-ias#${encodeURIComponent(ia.slug)}`}
                className="ia-card"
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
