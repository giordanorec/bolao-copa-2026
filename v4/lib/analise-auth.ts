/**
 * Gate compartilhado do conteúdo premium v2/v3.
 *
 * Extraído de /analise-v2 pra ser reusado em outras páginas (ex.: /ia/[slug],
 * que mostra a trilha v1 → v2 → v3 de uma IA). REGRA DE OURO: dado v2/v3 só
 * pode ser RENDERIZADO se `liberado` for true. O cookie é httpOnly (não forjável
 * sem ANALISE_SENHA) e a leitura de palpite_v2 é só server-side via service_role.
 */

import { createHash } from "crypto";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase-server";
import { isContribuinte } from "@/lib/admin";

export const ANALISE_COOKIE = "analise_auth";

// Token derivado da senha (não forjável). Sem ANALISE_SENHA, ninguém fabrica o
// valor do cookie. Cookie de valor fixo seria burlável via DevTools/curl.
export function tokenEsperado(): string | null {
  const senha = process.env.ANALISE_SENHA;
  if (!senha) return null;
  return createHash("sha256").update(`analise-v2:${senha}`).digest("hex");
}

export async function isAutenticadoCookie(): Promise<boolean> {
  const esperado = tokenEsperado();
  if (!esperado) return false;
  const cookieStore = await cookies();
  return cookieStore.get(ANALISE_COOKIE)?.value === esperado;
}

/**
 * Acesso liberado = cookie de senha (fallback) OU conta contribuinte/admin.
 * Retorna também o email e se é contribuinte (pra mensagens da UI).
 */
export async function analiseLiberado(): Promise<{
  liberado: boolean;
  email: string | null;
  contribuinte: boolean;
}> {
  const [autenticado, userRes] = await Promise.all([
    isAutenticadoCookie(),
    createClient().then((c) => c.auth.getUser()),
  ]);
  const email = userRes.data.user?.email ?? null;
  const contribuinte = email ? await isContribuinte(email) : false;
  return { liberado: autenticado || contribuinte, email, contribuinte };
}
