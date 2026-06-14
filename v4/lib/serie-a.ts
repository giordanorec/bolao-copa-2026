// Config única da Série A das IAs (os 10 cabeças-de-chave coletados via web +
// Anthropic Fable). Os slugs "-web" são vitrines: os palpites reais foram
// salvos no irmão sem "-web" (FALLBACK_NAO_WEB). Centralizar aqui evita que
// /ranking-geral, /ranking-ias e o componente SerieA divirjam.

export const SLUG_FABLE = "claude-fable-5";

export const SLUGS_SERIE_A: string[] = [
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

export const APELIDOS_SERIE_A: Record<string, { nome: string; modelo: string }> =
  {
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

// slug "-web" -> irmão sem "-web" (onde os palpites realmente estão)
export const FALLBACK_NAO_WEB: Record<string, string> = {
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

// irmão sem "-web" -> slug "-web" (reverso)
export const SIBLING_PARA_WEB: Record<string, string> = Object.fromEntries(
  Object.entries(FALLBACK_NAO_WEB).map(([web, sib]) => [sib, web]),
);

// Conjunto dos irmãos não-web (slugs que carregam os palpites da Série A)
export const SLUGS_SIBLINGS_SERIE_A = new Set(Object.values(FALLBACK_NAO_WEB));

// Qualquer slug que pertença à Série A (vitrine -web, irmão não-web, ou Fable)
export function ehSerieA(slug: string): boolean {
  return (
    SLUGS_SERIE_A.includes(slug) || SLUGS_SIBLINGS_SERIE_A.has(slug)
  );
}

// Nome de marca da Série A pra um slug (web, irmão não-web ou Fable). null se não for.
export function nomeSerieA(slug: string): string | null {
  if (APELIDOS_SERIE_A[slug]) return APELIDOS_SERIE_A[slug].nome;
  const web = SIBLING_PARA_WEB[slug];
  if (web && APELIDOS_SERIE_A[web]) return APELIDOS_SERIE_A[web].nome;
  return null;
}

// Slug canônico (-web) pra linkar a página da IA da Série A.
export function slugWebSerieA(slug: string): string {
  if (SLUGS_SERIE_A.includes(slug)) return slug;
  return SIBLING_PARA_WEB[slug] ?? slug;
}
