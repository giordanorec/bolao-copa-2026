-- =============================================================
-- 2026-06-20 — Caixa de sugestões (feedback público dos visitantes)
-- =============================================================
-- Tabela onde qualquer visitante (logado ou anônimo) pode mandar uma
-- sugestão. Conteúdo é PRIVADO (só dono vê a sua, e service_role do
-- Giordano vê tudo). RPC pública `sugestoes_pendentes()` expõe APENAS
-- a contagem de não lidas e a data da mais recente — sem vazar texto.
-- Isso permite que o agente (Claude) consulte sem precisar de
-- service_role e alerte o Giordano sobre novidades.
--
-- COMO APLICAR: copiar este arquivo inteiro no SQL Editor do Supabase
-- Dashboard e executar.
-- =============================================================

create table if not exists public.sugestao (
    id          uuid primary key default gen_random_uuid(),
    conteudo    text not null check (char_length(conteudo) between 3 and 2000),
    contato     text,  -- email, IG, WhatsApp, qualquer texto curto opcional
    user_id     uuid references public.profiles(id) on delete set null,
    criada_em   timestamptz not null default now(),
    lida        boolean not null default false,
    resposta    text   -- nota privada do admin
);

create index if not exists sugestao_criada_em_idx
    on public.sugestao (criada_em desc);

create index if not exists sugestao_lida_idx
    on public.sugestao (lida) where lida = false;

alter table public.sugestao enable row level security;

-- INSERT: qualquer pessoa pode enviar (anon inclusive).
drop policy if exists sugestao_insert_publico on public.sugestao;
create policy sugestao_insert_publico on public.sugestao
    for insert with check (true);

-- SELECT: só o dono vê a própria (UX de "minhas sugestões enviadas"
-- pode aparecer mais tarde). O admin (service_role) vê tudo via bypass.
drop policy if exists sugestao_select_dono on public.sugestao;
create policy sugestao_select_dono on public.sugestao
    for select using (user_id is not null and user_id = auth.uid());

-- RPC pública: SÓ retorna count + data da mais recente. Sem texto.
-- security definer porque a função precisa ler a tabela sem disparar
-- RLS (que bloquearia anon). O retorno é agregado/anônimo.
create or replace function public.sugestoes_pendentes()
returns table (n_novas integer, ultima_em timestamptz)
language sql
stable
security definer
set search_path = public
as $$
    select
        count(*)::int as n_novas,
        max(criada_em) as ultima_em
    from public.sugestao
    where lida = false;
$$;

revoke all on function public.sugestoes_pendentes() from public;
grant execute on function public.sugestoes_pendentes() to anon, authenticated;

-- Pronto. Visitantes mandam INSERT direto via PostgREST.
-- Agente checa via RPC pra saber quando avisar Giordano.
-- Giordano lê o conteúdo via SQL editor (link pré-carregado) ou
-- /admin futuro.
