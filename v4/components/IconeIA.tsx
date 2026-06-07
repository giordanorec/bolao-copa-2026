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
      aria-label={marca.nome}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.22),
        background: "#fff",
        border: `1.5px solid ${marca.cor}1f`,
        padding: Math.round(size * 0.14),
        flexShrink: 0,
        boxSizing: "border-box",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={marca.logo}
        alt=""
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: "block",
        }}
        loading="lazy"
      />
    </span>
  );
}
