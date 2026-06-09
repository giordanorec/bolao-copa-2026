/**
 * Acesso administrativo.
 *
 * Admin = email cadastrado abaixo. Verificação só server-side
 * (server components / API routes). Nunca expor isso pro client.
 *
 * Pra que o admin veja TODOS os bolões e palpites (RLS bypass),
 * usamos o `service_role` key do Supabase. Setar como env var
 * `SUPABASE_SERVICE_ROLE_KEY` (sem prefixo NEXT_PUBLIC_).
 *
 * Pegar a chave em:
 *   supabase.com/dashboard/project/<id>/settings/api → "service_role"
 *
 * NUNCA comitar essa chave. NUNCA expor no client.
 */

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./supabase-config";

export const ADMIN_EMAILS: ReadonlySet<string> = new Set([
  "grec@cin.ufpe.br",
]);

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.has(email.toLowerCase().trim());
}

/**
 * Cliente Supabase com privilégio de service_role. Bypassa RLS.
 * Retorna null se a env var não estiver setada — chamador deve tratar.
 *
 * NUNCA chame isso de client component. Só server components / API routes.
 */
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;
  return createSupabaseClient(SUPABASE_URL, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
