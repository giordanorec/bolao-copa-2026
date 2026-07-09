// Config única da Série A das IAs (os 11 cabeças-de-chave coletados via web +
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
  "manus-web",
  SLUG_FABLE,
];

export const APELIDOS_SERIE_A: Record<string, { nome: string; modelo: string }> =
  {
    "chatgpt-5-thinking-web": { nome: "ChatGPT 5 Thinking", modelo: "GPT-5 Pro (Thinking)" },
    "claude-opus-4-8-web": { nome: "Claude Opus 4.8", modelo: "Anthropic Opus 4.8" },
    "gemini-2-5-pro-web": { nome: "Gemini 2.5 Pro", modelo: "Google Gemini 2.5 Pro" },
    "grok-4-heavy-web": { nome: "Grok 4 Heavy", modelo: "xAI Grok 4 Heavy" },
    "deepseek-r1-web": { nome: "DeepSeek R1", modelo: "DeepSeek R1 Reasoning" },
    "copilot-microsoft-web": { nome: "Microsoft Copilot", modelo: "Copilot (GPT-4o base)" },
    "perplexity-sonar-pro-web": { nome: "Perplexity Sonar", modelo: "Sonar Pro w/ search" },
    "meta-llama-4-web": { nome: "Meta Llama 4", modelo: "Llama 4 Maverick" },
    "le-chat-mistral-web": { nome: "Le Chat Mistral", modelo: "Mistral Medium 3.1" },
    "qwen-3-max-web": { nome: "Qwen 3 Max", modelo: "Alibaba Qwen 3 Max" },
    "manus-web": { nome: "Manus", modelo: "Manus Agent" },
    [SLUG_FABLE]: { nome: "Claude Code + Fable", modelo: "Claude Code (Opus) + Fable 5" },
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
  // Manus-web usa dados de Kimi K2 (moonshotai/kimi-k2) porque a coleta web
  // do Manus quebrou pra sempre. Kimi K2 tem 100 jogos completos (grupos +
  // R32 + Oitavas + Quartas), enquanto o slug "manus" só tem 76.
  "manus-web": "kimi-k2",
};

// irmão sem "-web" -> slug "-web" (reverso)
export const SIBLING_PARA_WEB: Record<string, string> = Object.fromEntries(
  Object.entries(FALLBACK_NAO_WEB).map(([web, sib]) => [sib, web]),
);

// Conjunto dos irmãos não-web (slugs que carregam os palpites da Série A)
export const SLUGS_SIBLINGS_SERIE_A = new Set(Object.values(FALLBACK_NAO_WEB));

// Slugs da Série A pra usar em contextos onde precisamos dos DADOS COMPLETOS
// (fase de grupos + mata-mata). As vitrines "-web" só têm palpites do mata-
// -mata (16 jogos), então na corrida/ranking as marcas devem ser representadas
// pelos irmãos sem-web (88 palpites) + Fable. Mesmo pool, dados de verdade.
export const SLUGS_SERIE_A_DADOS: string[] = [
  ...Object.values(FALLBACK_NAO_WEB), // 11 irmãos sem-web
  SLUG_FABLE, // Fable já tem 88 palpites
];

// Qualquer slug que pertença à Série A (vitrine -web, irmão não-web, ou Fable)
export function ehSerieA(slug: string): boolean {
  return (
    SLUGS_SERIE_A.includes(slug) || SLUGS_SIBLINGS_SERIE_A.has(slug)
  );
}

// Nome de marca da Série A. Retorna null se o slug NÃO é vitrine -web ou Fable.
// IMPORTANTE: irmãos sem-web (ex.: `claude-opus-4-7`, `qwen-3-max`) devolvem
// null — eles mantêm o `nome_display` original do ranking. Antes o nome da
// vitrine sobrescrevia o irmão e ficava confuso (Opus 4.7 aparecia como 4.8).
export function nomeSerieA(slug: string): string | null {
  if (APELIDOS_SERIE_A[slug]) return APELIDOS_SERIE_A[slug].nome;
  return null;
}

// Slug canônico (-web) pra linkar a página da IA da Série A.
export function slugWebSerieA(slug: string): string {
  if (SLUGS_SERIE_A.includes(slug)) return slug;
  return SIBLING_PARA_WEB[slug] ?? slug;
}
