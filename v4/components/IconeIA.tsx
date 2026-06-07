import { marcaDe } from "@/lib/ias";

export default function IconeIA({
  slug,
  size = 24,
  title,
}: {
  slug: string;
  size?: number;
  title?: string;
}) {
  const marca = marcaDe(slug);
  return (
    <span
      title={title ?? marca.nome}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: "50%",
        background: marca.bg,
        color: marca.cor,
        fontSize: Math.round(size * 0.55),
        fontWeight: 700,
        fontFamily: "var(--ff-mono, monospace)",
        lineHeight: 1,
        flexShrink: 0,
      }}
      aria-label={marca.nome}
    >
      {marca.emoji}
    </span>
  );
}
