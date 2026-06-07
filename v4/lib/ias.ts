// Família e popularidade de cada IA. Slug → família + ordem (menor = mais popular).

export type FamiliaIA =
  | "openai"
  | "anthropic"
  | "google"
  | "xai"
  | "deepseek"
  | "microsoft"
  | "perplexity"
  | "meta"
  | "mistral"
  | "alibaba"
  | "cristal"
  | "outra";

export type MarcaIA = {
  familia: FamiliaIA;
  nome: string;
  emoji: string;
  cor: string;
  bg: string;
};

export const MARCAS: Record<FamiliaIA, MarcaIA> = {
  openai: { familia: "openai", nome: "OpenAI", emoji: "◯", cor: "#10A37F", bg: "#0F1A19" },
  anthropic: { familia: "anthropic", nome: "Anthropic", emoji: "✦", cor: "#D97757", bg: "#2A1B14" },
  google: { familia: "google", nome: "Google", emoji: "✦", cor: "#4285F4", bg: "#0F1A2A" },
  xai: { familia: "xai", nome: "xAI", emoji: "𝕏", cor: "#FFFFFF", bg: "#000000" },
  deepseek: { familia: "deepseek", nome: "DeepSeek", emoji: "🐋", cor: "#4D6BFE", bg: "#0F162E" },
  microsoft: { familia: "microsoft", nome: "Microsoft", emoji: "⊞", cor: "#00A4EF", bg: "#0E1A22" },
  perplexity: { familia: "perplexity", nome: "Perplexity", emoji: "≋", cor: "#20808D", bg: "#0F1F22" },
  meta: { familia: "meta", nome: "Meta", emoji: "∞", cor: "#0866FF", bg: "#0E1726" },
  mistral: { familia: "mistral", nome: "Mistral", emoji: "✺", cor: "#FF7000", bg: "#2A1A0E" },
  alibaba: { familia: "alibaba", nome: "Alibaba", emoji: "通", cor: "#FF6A00", bg: "#2A1607" },
  cristal: { familia: "cristal", nome: "Bola de Cristal", emoji: "🔮", cor: "#A855F7", bg: "#1F1330" },
  outra: { familia: "outra", nome: "IA", emoji: "🤖", cor: "#888888", bg: "#1A1A1A" },
};

// Ordem de popularidade (mídia + uso global 2026)
export const ORDEM_POPULARIDADE: FamiliaIA[] = [
  "openai",
  "anthropic",
  "google",
  "xai",
  "deepseek",
  "microsoft",
  "meta",
  "perplexity",
  "mistral",
  "alibaba",
  "cristal",
  "outra",
];

export function familiaDe(slug: string): FamiliaIA {
  const s = slug.toLowerCase();
  if (s === "bola-de-cristal" || s === "cristal") return "cristal";
  if (s.startsWith("chatgpt") || s.startsWith("gpt-") || s.startsWith("o3") || s.startsWith("o4")) return "openai";
  if (s.startsWith("claude")) return "anthropic";
  if (s.startsWith("gemini")) return "google";
  if (s.startsWith("grok")) return "xai";
  if (s.startsWith("deepseek")) return "deepseek";
  if (s.startsWith("copilot")) return "microsoft";
  if (s.startsWith("perplexity") || s.startsWith("sonar")) return "perplexity";
  if (s.startsWith("meta-") || s.includes("llama")) return "meta";
  if (s.startsWith("le-chat") || s.startsWith("mistral")) return "mistral";
  if (s.startsWith("qwen")) return "alibaba";
  return "outra";
}

export function marcaDe(slug: string): MarcaIA {
  return MARCAS[familiaDe(slug)];
}

// Boost por versão dentro da família (versões "principais" sobem).
function pesoVersao(slug: string): number {
  const s = slug.toLowerCase();
  // Via Web e flagship sobem
  if (s.includes("thinking-web")) return 0;
  if (s.includes("opus") && s.includes("web")) return 0;
  if (s.includes("pro") && s.includes("web")) return 0;
  if (s.includes("heavy") && s.includes("web")) return 0;
  if (s.includes("max") && s.includes("web")) return 0;
  if (s.includes("web")) return 1;
  if (s.includes("opus")) return 2;
  if (s.includes("pro")) return 2;
  if (s.includes("heavy")) return 2;
  if (s.includes("thinking")) return 2;
  if (s.includes("sonnet")) return 3;
  if (s.includes("flash")) return 4;
  if (s.includes("mini")) return 5;
  if (s.includes("nano")) return 6;
  if (s.includes("haiku")) return 5;
  if (s.includes("lite")) return 6;
  if (s.includes("legacy")) return 9;
  return 4;
}

export function scorePopularidade(slug: string): number {
  const familia = familiaDe(slug);
  const ordemFam = ORDEM_POPULARIDADE.indexOf(familia);
  return ordemFam * 100 + pesoVersao(slug);
}

export function ordenarPorPopularidade<T extends { slug?: string; ias?: string[] }>(
  items: T[],
  getSlug: (item: T) => string,
): T[] {
  return [...items].sort(
    (a, b) =>
      scorePopularidade(getSlug(a)) - scorePopularidade(getSlug(b)),
  );
}
