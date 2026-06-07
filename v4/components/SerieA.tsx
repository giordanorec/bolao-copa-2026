import { promises as fs } from "fs";
import path from "path";
import { t, type Locale } from "@/lib/i18n";

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

const APELIDOS: Record<string, string> = {
  "chatgpt-5-thinking-web": "ChatGPT 5 Thinking",
  "claude-opus-4-7-web": "Claude Opus 4.7",
  "gemini-2-5-pro-web": "Gemini 2.5 Pro",
  "grok-4-heavy-web": "Grok 4 Heavy",
  "deepseek-r1-web": "DeepSeek R1",
  "copilot-microsoft-web": "Microsoft Copilot",
  "perplexity-sonar-pro-web": "Perplexity Sonar",
  "meta-llama-4-web": "Meta Llama 4",
  "le-chat-mistral-web": "Le Chat Mistral",
  "qwen-3-max-web": "Qwen 3 Max",
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

export default async function SerieA({ locale = "pt" }: { locale?: Locale }) {
  const ias = await carregarSerieA();
  if (ias.length === 0) return null;

  const sufixoJogos =
    locale === "en" ? "matches" : locale === "es" ? "partidos" : locale === "fr" ? "matches" : "jogos";
  const sufixoExatos =
    locale === "en" ? "exact" : locale === "es" ? "exactos" : locale === "fr" ? "exacts" : "exatos";

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

        <div className="serie-a-grid">
          {ias.map((ia, i) => (
            <a
              key={ia.slug}
              href={`https://giordanorec.github.io/bolao-copa-2026/ia.html?slug=${encodeURIComponent(ia.slug)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ia-card"
            >
              <div className="ia-rank">{i + 1}º</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/mascots/${ia.slug}.png`}
                alt={`Mascote ${APELIDOS[ia.slug] ?? ia.nome_display}`}
                width={120}
                height={120}
                loading="lazy"
              />
              <h3>{APELIDOS[ia.slug] ?? ia.nome_display}</h3>
              <div className="ia-pontos">
                <strong>{ia.pontos}</strong>
                <span>pts</span>
              </div>
              <small>
                {ia.jogos_palpitados} {sufixoJogos} · {ia.placares_exatos}{" "}
                {sufixoExatos}
              </small>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
