-- =============================================================
-- 2026-06-24 — Verificar se um email tem conta (auth.users)
-- =============================================================
-- Usada pelo admin ao identificar um pagamento pendente: antes de
-- liberar um email na allowlist, confirma que ele de fato corresponde
-- a uma conta cadastrada — evita habilitar um email digitado errado
-- ou que nunca criou conta.
--
-- security definer pra enxergar o schema `auth` (o service_role chama,
-- mas a função encapsula o acesso). Não expõe dados: retorna só boolean.

create or replace function public.email_tem_conta(p_email text)
returns boolean
language sql stable security definer set search_path = public, auth
as $$
    select exists (
        select 1 from auth.users
        where lower(email) = lower(trim(p_email))
    );
$$;

revoke all on function public.email_tem_conta(text) from public, anon, authenticated;
grant execute on function public.email_tem_conta(text) to service_role;
