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
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={marca.logo}
      alt={marca.nome}
      title={title ?? marca.nome}
      width={size}
      height={size}
      loading="lazy"
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        display: "inline-block",
        flexShrink: 0,
      }}
    />
  );
}
