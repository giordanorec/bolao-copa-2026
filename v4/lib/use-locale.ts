"use client";

import { useEffect, useState } from "react";
import { LOCALES, LOCALE_DEFAULT, type Locale } from "./i18n";

export function useLocale(): Locale {
  const [loc, setLoc] = useState<Locale>(LOCALE_DEFAULT);
  useEffect(() => {
    try {
      const m = document.cookie.match(/(?:^|; )v4-lang=([^;]+)/);
      const v = m?.[1];
      if (v && (LOCALES as string[]).includes(v)) setLoc(v as Locale);
      else {
        const nav = navigator.language.slice(0, 2).toLowerCase();
        if ((LOCALES as string[]).includes(nav)) setLoc(nav as Locale);
      }
    } catch {}
  }, []);
  return loc;
}
