-- =============================================================
-- 2026-06-20 — Leitura admin das sugestões (gated por token)
-- =============================================================
-- A tabela `sugestao` tem RLS que só deixa o DONO ler o conteúdo.
-- Sugestões anônimas (user_id = null) ficam ilegíveis por todos.
-- Estas RPCs (security definer) deixam o agente Claude ler/baixar o
-- conteúdo via anon, MAS só quando apresenta o token secreto correto
-- (guardado fora do repo, em v4/.env.local). Sem o token, retorna vazio
-- — então ninguém consegue raspar e-mails/contatos pela API pública.

-- Lista as sugestões não lidas (conteúdo + contato) se o token bater.
create or replace function public.sugestoes_listar(p_token text)
returns table (id uuid, conteudo text, contato text, criada_em timestamptz)
language sql stable security definer set search_path = public
as $$
    select s.id, s.conteudo, s.contato, s.criada_em
    from public.sugestao s
    where s.lida = false
      and p_token = 'REPLACE_WITH_SUGESTOES_ADMIN_TOKEN'
    order by s.criada_em desc;
$$;

-- Marca como lidas (todas as não lidas) se o token bater. Retorna quantas.
create or replace function public.sugestoes_marcar_lidas(p_token text)
returns integer
language plpgsql volatile security definer set search_path = public
as $$
declare
    n integer;
begin
    if p_token <> 'REPLACE_WITH_SUGESTOES_ADMIN_TOKEN' then
        return 0;
    end if;
    update public.sugestao set lida = true where lida = false;
    get diagnostics n = row_count;
    return n;
end;
$$;

revoke all on function public.sugestoes_listar(text) from public;
revoke all on function public.sugestoes_marcar_lidas(text) from public;
grant execute on function public.sugestoes_listar(text) to anon, authenticated;
grant execute on function public.sugestoes_marcar_lidas(text) to anon, authenticated;
