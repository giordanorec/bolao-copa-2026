"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { type Locale } from "@/lib/i18n";

export default function MeusBoloesLink({
  onClick,
  locale = "pt",
}: {
  onClick?: () => void;
  locale?: Locale;
}) {
  const pathname = usePathname();
  const [quantos, setQuantos] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!alive) return;
      if (!user) {
        setQuantos(0);
        return;
      }
      const { count } = await supabase
        .from("bolao_membro")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      if (alive) setQuantos(count ?? 0);
    })();
    return () => {
      alive = false;
    };
  }, [pathname]);

  if (!quantos) return null;

  const label =
    locale === "en"
      ? "🎯 My pools"
      : locale === "es"
        ? "🎯 Mis pollas"
        : locale === "fr"
          ? "🎯 Mes cagnottes"
          : "🎯 Meus bolões";

  return (
    <Link href="/dashboard" onClick={onClick} className="nav-meus-boloes">
      {label}
      <span className="badge">{quantos}</span>
    </Link>
  );
}
