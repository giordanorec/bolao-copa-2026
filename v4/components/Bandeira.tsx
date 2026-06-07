type Props = {
  iso?: string;
  nome: string;
  size?: number;
};

export default function Bandeira({ iso, nome, size = 28 }: Props) {
  if (!iso) {
    return (
      <span
        className="bandeira-placeholder"
        style={{
          width: size,
          height: size,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-soft)",
          borderRadius: "50%",
          fontSize: size * 0.5,
          flexShrink: 0,
        }}
        aria-hidden
      >
        🏳️
      </span>
    );
  }
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={`https://hatscripts.github.io/circle-flags/flags/${iso}.svg`}
      alt={nome}
      title={nome}
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        objectFit: "cover",
        flexShrink: 0,
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      }}
      loading="lazy"
    />
  );
}
