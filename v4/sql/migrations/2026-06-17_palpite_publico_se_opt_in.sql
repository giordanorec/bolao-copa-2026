-- =============================================================
-- 2026-06-17 — Palpite público quando user fez opt_in_geral=true
-- =============================================================
-- Bug: /ranking-geral (Hall da Fama) renderiza humanos com 0 pts pra
-- qualquer visitante anônimo. Motivo: a única policy de SELECT em
-- `palpite` (palpite_select_meu_ou_companheiro) exige auth.uid() ser o
-- dono OU companheiro de bolão. Anônimo não passa, e o servidor antes
-- usava createAdminClient() (service_role) pra burlar — mas a chave
-- service_role não está configurada em produção.
--
-- Solução: nova policy ADICIONAL (RLS faz OR entre policies do mesmo
-- comando) que permite SELECT em qualquer palpite cujo dono tenha
-- opt_in_geral=true. Semântica exata do "Hall da Fama público".
--
-- COMO APLICAR: copiar este arquivo no SQL Editor do Supabase Dashboard
-- e executar.  supabase.com/dashboard/project/<id>/sql/new
-- =============================================================

drop policy if exists palpite_select_opt_in_publico on public.palpite;
create policy palpite_select_opt_in_publico on public.palpite
    for select
    using (
        exists (
            select 1 from public.profiles p
            where p.id = palpite.user_id and p.opt_in_geral = true
        )
    );

-- Pronto. Como a anterior `palpite_select_meu_ou_companheiro` continua
-- valendo, a soma é: qualquer pessoa lê palpites de quem fez opt-in,
-- E donos/companheiros de bolão continuam vendo o que sempre viram.
--
-- Profiles já tinha `profiles_select_public` aberta, então a sub-query
-- acima funciona com qualquer cliente (anon inclusive). Sem isso, o
-- exists não conseguiria avaliar e a policy falharia silenciosamente.
