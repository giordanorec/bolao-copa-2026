"use client";

import ShareButtons from "@/components/ShareButtons";

export default function CopyLinkButton({
  slug,
  nome,
}: {
  slug: string;
  nome?: string;
}) {
  const url = `/bolao/${slug}`;
  const texto = nome
    ? `Entra no bolão "${nome}" da Copa 2026! ⚽`
    : "Entra no meu bolão da Copa 2026! ⚽";
  return <ShareButtons url={url} texto={texto} variante="inline" />;
}
