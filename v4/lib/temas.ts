// Temas visuais — nomes inventados (sem mencionar marcas) + swatch de cores
// pra preview no dropdown. CSS dos temas vive em v4/styles/v1.css

export type TemaSlug =
  | "airbnb"
  | "festivo-br"
  | "apple"
  | "nike"
  | "stripe-press"
  | "notion"
  | "spotify"
  | "geist"
  | "linear"
  | "anthropic"
  | "carnaval"
  | "tropical";

export type Tema = {
  slug: TemaSlug;
  nome: string; // nome inventado (sem marca)
  emoji: string;
  swatch: [string, string, string]; // 3 cores principais pro preview
};

export const TEMAS: Tema[] = [
  { slug: "airbnb", nome: "Acolhedor", emoji: "🏠", swatch: ["#FF5A5F", "#00A699", "#FC642D"] },
  { slug: "festivo-br", nome: "Festivo BR", emoji: "🇧🇷", swatch: ["#009C3B", "#FFCE00", "#002776"] },
  { slug: "apple", nome: "Refinado", emoji: "🪐", swatch: ["#1D1D1F", "#0071E3", "#F5F5F7"] },
  { slug: "nike", nome: "Atlético", emoji: "👟", swatch: ["#000000", "#FA5400", "#FFFFFF"] },
  { slug: "stripe-press", nome: "Editorial", emoji: "📚", swatch: ["#A1773C", "#3D1D0F", "#F2E8DA"] },
  { slug: "notion", nome: "Caderno", emoji: "📝", swatch: ["#37352F", "#FFFFFF", "#E9E5E2"] },
  { slug: "spotify", nome: "Vibrante", emoji: "🎵", swatch: ["#1ED760", "#191414", "#FFFFFF"] },
  { slug: "geist", nome: "Técnico", emoji: "▮", swatch: ["#000000", "#FFFFFF", "#666666"] },
  { slug: "linear", nome: "Mínimo", emoji: "◇", swatch: ["#5E6AD2", "#1F1F23", "#F4F5F8"] },
  { slug: "anthropic", nome: "Cálido", emoji: "📜", swatch: ["#D97757", "#1A1A1A", "#FBF8F0"] },
  { slug: "carnaval", nome: "Carnaval", emoji: "🎉", swatch: ["#FF006E", "#FFBE0B", "#8338EC"] },
  { slug: "tropical", nome: "Tropical", emoji: "🌴", swatch: ["#06AED5", "#F4B400", "#F35336"] },
];

export const TEMA_DEFAULT: TemaSlug = "airbnb";

export function temaValido(s: string | null | undefined): TemaSlug {
  if (!s) return TEMA_DEFAULT;
  return (TEMAS.find((t) => t.slug === s)?.slug as TemaSlug) ?? TEMA_DEFAULT;
}
