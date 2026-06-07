import { cookies, headers } from "next/headers";
import {
  LOCALES,
  LOCALE_DEFAULT,
  localeDoAcceptLanguage,
  localeDoPais,
  type Locale,
} from "./i18n";

export const COOKIE_LANG = "v4-lang";

export async function resolverLocale(): Promise<Locale> {
  const c = await cookies();
  const fromCookie = c.get(COOKIE_LANG)?.value as Locale | undefined;
  if (fromCookie && (LOCALES as string[]).includes(fromCookie)) {
    return fromCookie;
  }
  const h = await headers();
  const pais = h.get("x-vercel-ip-country");
  if (pais) {
    return localeDoPais(pais);
  }
  const accept = h.get("accept-language");
  return localeDoAcceptLanguage(accept ?? null) ?? LOCALE_DEFAULT;
}

export async function paisDetectado(): Promise<string | null> {
  const h = await headers();
  return h.get("x-vercel-ip-country");
}
