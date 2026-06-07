// Família e popularidade de cada IA. Slug → família + ordem (menor = mais popular).
// Logo SVG em /public/logos/{familia}.svg (baixadas via scripts/baixar_logos.py)

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
  | "cohere"
  | "ai21"
  | "inflection"
  | "reka"
  | "moonshot"
  | "01ai"
  | "minimax"
  | "baichuan"
  | "databricks"
  | "bytedance"
  | "baidu"
  | "tii"
  | "zhipu"
  | "tencent"
  | "ibm"
  | "liquid"
  | "nvidia"
  | "nous"
  | "sensetime"
  | "snowflake"
  | "iflytek"
  | "stability"
  | "stepfun"
  | "allenai"
  | "cristal"
  | "outra";

export type MarcaIA = {
  familia: FamiliaIA;
  nome: string;
  cor: string;
  logo: string; // path em /public/logos/
};

export const MARCAS: Record<FamiliaIA, MarcaIA> = {
  openai: { familia: "openai", nome: "OpenAI", cor: "#000000", logo: "/logos/openai.svg" },
  anthropic: { familia: "anthropic", nome: "Anthropic", cor: "#D97757", logo: "/logos/anthropic.svg" },
  google: { familia: "google", nome: "Google", cor: "#4285F4", logo: "/logos/google.svg" },
  xai: { familia: "xai", nome: "xAI", cor: "#000000", logo: "/logos/xai.svg" },
  deepseek: { familia: "deepseek", nome: "DeepSeek", cor: "#4D6BFE", logo: "/logos/deepseek.svg" },
  microsoft: { familia: "microsoft", nome: "Microsoft", cor: "#5E5E5E", logo: "/logos/microsoft.svg" },
  perplexity: { familia: "perplexity", nome: "Perplexity", cor: "#20808D", logo: "/logos/perplexity.svg" },
  meta: { familia: "meta", nome: "Meta", cor: "#0866FF", logo: "/logos/meta.svg" },
  mistral: { familia: "mistral", nome: "Mistral", cor: "#FF7000", logo: "/logos/mistral.svg" },
  alibaba: { familia: "alibaba", nome: "Alibaba", cor: "#FF6A00", logo: "/logos/alibaba.svg" },
  cohere: { familia: "cohere", nome: "Cohere", cor: "#39594D", logo: "/logos/cohere.svg" },
  ai21: { familia: "ai21", nome: "AI21 Labs", cor: "#9B6FFF", logo: "/logos/ai21.svg" },
  inflection: { familia: "inflection", nome: "Inflection AI", cor: "#FF6B35", logo: "/logos/inflection.svg" },
  reka: { familia: "reka", nome: "Reka", cor: "#F18F01", logo: "/logos/reka.svg" },
  moonshot: { familia: "moonshot", nome: "Moonshot AI", cor: "#5B8DEF", logo: "/logos/moonshot.svg" },
  "01ai": { familia: "01ai", nome: "01.AI", cor: "#00A98F", logo: "/logos/01ai.svg" },
  minimax: { familia: "minimax", nome: "MiniMax", cor: "#0066FF", logo: "/logos/minimax.svg" },
  baichuan: { familia: "baichuan", nome: "Baichuan", cor: "#1A1A1A", logo: "/logos/baichuan.svg" },
  databricks: { familia: "databricks", nome: "Databricks", cor: "#FF3621", logo: "/logos/databricks.svg" },
  bytedance: { familia: "bytedance", nome: "ByteDance", cor: "#000000", logo: "/logos/bytedance.svg" },
  baidu: { familia: "baidu", nome: "Baidu", cor: "#2932E1", logo: "/logos/baidu.svg" },
  tii: { familia: "tii", nome: "TII", cor: "#00A0DD", logo: "/logos/tii.svg" },
  zhipu: { familia: "zhipu", nome: "Zhipu AI", cor: "#1E40AF", logo: "/logos/zhipu.svg" },
  tencent: { familia: "tencent", nome: "Tencent", cor: "#00A4FF", logo: "/logos/tencent.svg" },
  ibm: { familia: "ibm", nome: "IBM", cor: "#0530AD", logo: "/logos/ibm.svg" },
  liquid: { familia: "liquid", nome: "Liquid AI", cor: "#00C9FF", logo: "/logos/liquid.svg" },
  nvidia: { familia: "nvidia", nome: "NVIDIA", cor: "#76B900", logo: "/logos/nvidia.svg" },
  nous: { familia: "nous", nome: "Nous Research", cor: "#8B5CF6", logo: "/logos/nous.svg" },
  sensetime: { familia: "sensetime", nome: "SenseTime", cor: "#FF0066", logo: "/logos/sensetime.svg" },
  snowflake: { familia: "snowflake", nome: "Snowflake", cor: "#29B5E8", logo: "/logos/snowflake.svg" },
  iflytek: { familia: "iflytek", nome: "iFlytek", cor: "#1989FA", logo: "/logos/iflytek.svg" },
  stability: { familia: "stability", nome: "Stability AI", cor: "#FF6B6B", logo: "/logos/stability.svg" },
  stepfun: { familia: "stepfun", nome: "StepFun", cor: "#0066CC", logo: "/logos/stepfun.svg" },
  allenai: { familia: "allenai", nome: "Allen AI", cor: "#F4623C", logo: "/logos/allenai.svg" },
  cristal: { familia: "cristal", nome: "Bola de Cristal", cor: "#A855F7", logo: "/logos/cristal.svg" },
  outra: { familia: "outra", nome: "IA", cor: "#888888", logo: "/logos/cristal.svg" },
};

// Ordem de popularidade (mídia + uso global 2026)
export const ORDEM_POPULARIDADE: FamiliaIA[] = [
  "openai", "anthropic", "google", "xai", "deepseek",
  "microsoft", "meta", "perplexity", "mistral", "alibaba",
  "cohere", "nvidia", "ibm", "databricks", "snowflake",
  "ai21", "inflection", "reka", "moonshot", "01ai", "minimax",
  "baichuan", "bytedance", "baidu", "tii", "zhipu", "tencent",
  "liquid", "nous", "sensetime", "iflytek", "stability", "stepfun", "allenai",
  "cristal", "outra",
];

export function familiaDe(slug: string): FamiliaIA {
  const s = slug.toLowerCase();
  if (s === "bola-de-cristal" || s === "cristal") return "cristal";
  // OpenAI
  if (s.startsWith("chatgpt") || s.startsWith("gpt-") ||
      s.startsWith("o1") || s.startsWith("o3") || s.startsWith("o4")) return "openai";
  // Anthropic
  if (s.startsWith("claude")) return "anthropic";
  // Google: Gemini, Gemma, PaLM
  if (s.startsWith("gemini") || s.startsWith("gemma") || s.startsWith("palm")) return "google";
  // xAI
  if (s.startsWith("grok")) return "xai";
  // DeepSeek
  if (s.startsWith("deepseek")) return "deepseek";
  // Microsoft: Copilot, Phi, WizardLM
  if (s.startsWith("copilot") || s.startsWith("phi-") || s.startsWith("wizardlm")) return "microsoft";
  // Perplexity
  if (s.startsWith("perplexity") || s.startsWith("sonar")) return "perplexity";
  // Meta: Llama
  if (s.startsWith("meta-") || s.includes("llama")) return "meta";
  // Mistral: Le Chat, Mistral, Mixtral, Codestral, Ministral, Mathstral, Pixtral
  if (s.startsWith("le-chat") || s.startsWith("mistral") || s.startsWith("mixtral") ||
      s.startsWith("codestral") || s.startsWith("ministral") || s.startsWith("mathstral") ||
      s.startsWith("pixtral")) return "mistral";
  // Alibaba: Qwen, QwQ
  if (s.startsWith("qwen") || s.startsWith("qwq")) return "alibaba";
  // Outras famílias
  if (s.startsWith("command-") || s.includes("cohere")) return "cohere";
  if (s.startsWith("jamba") || s.includes("ai21")) return "ai21";
  if (s.startsWith("inflection") || s === "pi") return "inflection";
  if (s.startsWith("reka")) return "reka";
  if (s.startsWith("kimi") || s.includes("moonshot")) return "moonshot";
  if (s.startsWith("yi-")) return "01ai";
  if (s.startsWith("minimax")) return "minimax";
  if (s.startsWith("baichuan")) return "baichuan";
  if (s.startsWith("dbrx") || s.includes("databricks")) return "databricks";
  if (s.startsWith("doubao") || s.includes("bytedance")) return "bytedance";
  if (s.startsWith("ernie") || s.includes("baidu")) return "baidu";
  if (s.startsWith("falcon") || s.includes("tii")) return "tii";
  if (s.startsWith("glm") || s.includes("zhipu")) return "zhipu";
  if (s.startsWith("hunyuan") || s.includes("tencent")) return "tencent";
  if (s.startsWith("ibm-") || s.includes("granite")) return "ibm";
  if (s.startsWith("lfm") || s.includes("liquid")) return "liquid";
  if (s.startsWith("nemotron") || s.includes("nvidia")) return "nvidia";
  if (s.startsWith("nous-") || s.includes("hermes")) return "nous";
  if (s.startsWith("sensechat") || s.includes("sense")) return "sensetime";
  if (s.startsWith("snowflake") || s.startsWith("arctic")) return "snowflake";
  if (s.startsWith("spark-") || s.includes("iflytek")) return "iflytek";
  if (s.startsWith("stablelm") || s.includes("stability")) return "stability";
  if (s.startsWith("step-") || s.includes("stepfun")) return "stepfun";
  if (s.startsWith("molmo") || s.startsWith("olmo") || s.startsWith("tulu") ||
      s.includes("allenai") || s.includes("allen-")) return "allenai";
  return "outra";
}

export function marcaDe(slug: string): MarcaIA {
  return MARCAS[familiaDe(slug)];
}

// Boost por versão dentro da família (versões "principais" sobem).
function pesoVersao(slug: string): number {
  const s = slug.toLowerCase();
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
