"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { t, type Locale } from "@/lib/i18n";

export default function HeroCTAs({ locale = "pt" }: { locale?: Locale }) {
  const [logadoComBolao, setLogadoComBolao] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!alive) return;
      if (!user) {
        setLogadoComBolao(false);
        return;
      }
      const { count } = await supabase
        .from("bolao_membro")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      if (alive) setLogadoComBolao((count ?? 0) > 0);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const ctaMeus =
    locale === "en"
      ? "🎯 My pools"
      : locale === "es"
        ? "🎯 Mis pollas"
        : locale === "fr"
          ? "🎯 Mes cagnottes"
          : "🎯 Meus bolões";

  return (
    <div className="hero-cta">
      <Link href="/serie-a" className="btn primary">
        {t(locale, "home.hero.cta.serie_a")}
      </Link>
      <Link href="/jogos" className="btn yellow">
        {t(locale, "home.hero.cta.jogos")}
      </Link>
      {logadoComBolao ? (
        <Link href="/dashboard" className="btn">
          {ctaMeus}
        </Link>
      ) : (
        <Link href="/signup" className="btn">
          {t(locale, "home.hero.cta.criar")}
        </Link>
      )}
    </div>
  );
}
