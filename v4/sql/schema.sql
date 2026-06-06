-- =============================================================
-- Bolão da Copa 2026 — v4 (humanos)
-- Schema Supabase / Postgres
-- =============================================================
-- Rodar no SQL Editor do Supabase Dashboard:
-- https://supabase.com/dashboard/project/<id>/sql/new
-- =============================================================

-- Extensões
create extension if not exists pgcrypto;

-- =============================================================
-- profiles — dados extras do usuário (auth.users é gerenciado pelo Supabase)
-- =============================================================
create table if not exists public.profiles (
    id              uuid primary key references auth.users(id) on delete cascade,
    display_name    text not null check (char_length(display_name) between 2 and 60),
    instagram       text,
    whatsapp        text,
    opt_in_geral    boolean not null default false,
    criado_em       timestamptz not null default now()
);

-- Cria profile automaticamente ao cadastrar usuário
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
    insert into public.profiles (id, display_name)
    values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- =============================================================
-- bolao — grupo
-- =============================================================
create table if not exists public.bolao (
    id              uuid primary key default gen_random_uuid(),
    slug            text unique not null check (slug ~ '^[a-zA-Z0-9_-]{6,16}$'),
    nome            text not null check (char_length(nome) between 2 and 80),
    descricao       text,
    criador_id      uuid not null references public.profiles(id) on delete cascade,
    encerrado       boolean not null default false,
    criado_em       timestamptz not null default now()
);

create index if not exists bolao_criador_idx on public.bolao(criador_id);

-- =============================================================
-- bolao_membro — N:N usuário ↔ bolão
-- =============================================================
create table if not exists public.bolao_membro (
    bolao_id        uuid not null references public.bolao(id) on delete cascade,
    user_id         uuid not null references public.profiles(id) on delete cascade,
    entrou_em       timestamptz not null default now(),
    primary key (bolao_id, user_id)
);

create index if not exists membro_user_idx on public.bolao_membro(user_id);

-- =============================================================
-- palpite — 1 conjunto de palpites por usuário (reutilizado em N bolões)
-- =============================================================
create table if not exists public.palpite (
    user_id         uuid not null references public.profiles(id) on delete cascade,
    jogo_numero     int not null check (jogo_numero between 1 and 104),
    gols_a          int not null check (gols_a between 0 and 20),
    gols_b          int not null check (gols_b between 0 and 20),
    atualizado_em   timestamptz not null default now(),
    primary key (user_id, jogo_numero)
);

-- =============================================================
-- RLS — Row Level Security
-- =============================================================

alter table public.profiles      enable row level security;
alter table public.bolao         enable row level security;
alter table public.bolao_membro  enable row level security;
alter table public.palpite       enable row level security;

-- profiles: leitura pública de display_name; update só próprio
drop policy if exists profiles_select_public on public.profiles;
create policy profiles_select_public on public.profiles
    for select using (true);

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
    for update using (auth.uid() = id) with check (auth.uid() = id);

-- bolao: select público (qualquer um com link vê); insert autenticado; update/delete só criador
drop policy if exists bolao_select_all on public.bolao;
create policy bolao_select_all on public.bolao
    for select using (true);

drop policy if exists bolao_insert_auth on public.bolao;
create policy bolao_insert_auth on public.bolao
    for insert with check (auth.uid() = criador_id);

drop policy if exists bolao_update_owner on public.bolao;
create policy bolao_update_owner on public.bolao
    for update using (auth.uid() = criador_id) with check (auth.uid() = criador_id);

drop policy if exists bolao_delete_owner on public.bolao;
create policy bolao_delete_owner on public.bolao
    for delete using (auth.uid() = criador_id);

-- bolao_membro: select público (pra exibir membros no card); insert só pra si mesmo; delete próprio
drop policy if exists membro_select_all on public.bolao_membro;
create policy membro_select_all on public.bolao_membro
    for select using (true);

drop policy if exists membro_insert_self on public.bolao_membro;
create policy membro_insert_self on public.bolao_membro
    for insert with check (auth.uid() = user_id);

drop policy if exists membro_delete_self on public.bolao_membro;
create policy membro_delete_self on public.bolao_membro
    for delete using (auth.uid() = user_id);

-- palpite: select próprio + de quem partilha bolão; insert/update só próprio
drop policy if exists palpite_select_meu_ou_companheiro on public.palpite;
create policy palpite_select_meu_ou_companheiro on public.palpite
    for select using (
        auth.uid() = user_id
        or exists (
            select 1 from public.bolao_membro m1
            join public.bolao_membro m2 on m1.bolao_id = m2.bolao_id
            where m1.user_id = auth.uid() and m2.user_id = palpite.user_id
        )
    );

drop policy if exists palpite_insert_self on public.palpite;
create policy palpite_insert_self on public.palpite
    for insert with check (auth.uid() = user_id);

drop policy if exists palpite_update_self on public.palpite;
create policy palpite_update_self on public.palpite
    for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists palpite_delete_self on public.palpite;
create policy palpite_delete_self on public.palpite
    for delete using (auth.uid() = user_id);

-- =============================================================
-- View: ranking por bolão (computa pontos na hora)
-- =============================================================
-- (resultados ficam fora do Supabase — vêm do JSON gerado pelo v1)
-- Esta view só agrega os palpites; o scoring é feito no Next.js
-- combinando palpites + resultados.json
