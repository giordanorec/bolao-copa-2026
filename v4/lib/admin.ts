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
  "pontes05@gmail.com",
  "abotelho0921@gmail.com",
  "ca.lularibeiro@gmail.com",
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

/**
 * Allowlist por conta: e-mail liberado para a Análise v2 (tabela
 * `contribuintes`). Checagem só server-side via service_role (RLS bypass).
 * Admins entram automaticamente. Retorna false se a env var de service_role
 * não estiver setada (fail-closed).
 */
export async function isContribuinte(
  email: string | null | undefined,
): Promise<boolean> {
  if (!email) return false;
  const alvo = email.toLowerCase().trim();
  if (isAdminEmail(alvo)) return true;
  const admin = createAdminClient();
  if (!admin) return false;
  const { data, error } = await admin
    .from("contribuintes")
    .select("email")
    .eq("email", alvo)
    .maybeSingle();
  if (error) {
    console.error("[contribuintes] erro ao checar allowlist:", error.message);
    return false;
  }
  return !!data;
}

/**
 * Mensagem personalizada (coluna `nota`) de um contribuinte, se houver.
 * Usada pra exibir um recado específico no banner de agradecimento.
 */
export async function notaContribuinte(
  email: string | null | undefined,
): Promise<string | null> {
  if (!email) return null;
  const admin = createAdminClient();
  if (!admin) return null;
  const { data, error } = await admin
    .from("contribuintes")
    .select("nota")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();
  if (error) return null;
  const nota = (data?.nota as string | null | undefined)?.trim();
  return nota ? nota : null;
}

/**
 * Nível de reconhecimento de um contribuinte (só prestígio — não muda função).
 *
 * Soma TODAS as contribuições da pessoa. Como uma pessoa pode ter mais de um
 * email liberado (ex.: Rodrigo Garcia, Anderson Mota), agrupamos pelo nome
 * normalizado na allowlist e somamos `contribuicoes.valor` de todos os emails.
 *
 * Faixas: R$50+ padrinho · R$25+ mantenedor · R$10+ apoiador · R$0 cortesia.
 */
export type NivelContribuinte = "padrinho" | "mantenedor" | "apoiador" | "cortesia";

export async function nivelContribuinte(
  email: string | null | undefined,
): Promise<{ nivel: NivelContribuinte; total: number } | null> {
  if (!email) return null;
  const alvo = email.toLowerCase().trim();
  const admin = createAdminClient();
  if (!admin) return null;

  // Linha desta conta na allowlist (pra achar o nome da pessoa).
  const { data: eu } = await admin
    .from("contribuintes")
    .select("nome")
    .eq("email", alvo)
    .maybeSingle();

  // Coleta todos os emails da MESMA pessoa (mesmo nome normalizado).
  const emails = new Set<string>([alvo]);
  const nomeNorm = ((eu?.nome as string | null | undefined) ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
  if (nomeNorm) {
    const { data: irmaos } = await admin
      .from("contribuintes")
      .select("email, nome");
    for (const r of irmaos ?? []) {
      const rn = ((r.nome as string | null) ?? "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");
      if (rn && rn === nomeNorm && r.email) emails.add((r.email as string).toLowerCase().trim());
    }
  }

  // Soma as contribuições de todos esses emails.
  const { data: contribs } = await admin
    .from("contribuicoes")
    .select("valor, email")
    .in("email", Array.from(emails));
  const total = (contribs ?? []).reduce(
    (s, c) => s + (Number(c.valor) || 0),
    0,
  );

  let nivel: NivelContribuinte = "cortesia";
  if (total >= 50) nivel = "padrinho";
  else if (total >= 25) nivel = "mantenedor";
  else if (total >= 10) nivel = "apoiador";

  return { nivel, total };
}
