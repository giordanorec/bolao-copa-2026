"use client";

import Link from "next/link";
import Bandeira from "@/components/Bandeira";

export default function TimeLink({
  nome,
  iso,
  size = 32,
  showName = true,
}: {
  nome: string;
  iso?: string;
  size?: number;
  showName?: boolean;
}) {
  return (
    <Link
      href={`/time/${encodeURIComponent(nome)}`}
      className="time-link"
      title={`Ver todos os palpites pra ${nome}`}
      onClick={(e) => e.stopPropagation()}
    >
      <Bandeira iso={iso} nome={nome} size={size} />
      {showName && <span>{nome}</span>}
    </Link>
  );
}
