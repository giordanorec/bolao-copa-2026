import { cookies } from "next/headers";
import { TEMA_DEFAULT, temaValido, type TemaSlug } from "./temas";

export const COOKIE_TEMA = "v4-tema";

export async function resolverTema(): Promise<TemaSlug> {
  const c = await cookies();
  const v = c.get(COOKIE_TEMA)?.value;
  return temaValido(v);
}
