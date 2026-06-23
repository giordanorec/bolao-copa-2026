-- =============================================================
-- 2026-06-22 — Tabela contribuintes (allowlist de acesso v2)
-- =============================================================
-- Contexto: além da senha compartilhada (ANALISE_SENHA), queremos
-- liberar a Análise v2 por CONTA. Quem contribuiu via Pix manda o
-- e-mail da sua conta pelo Instagram @arena.das.ias; o admin insere
-- esse e-mail aqui. Ao logar, a conta liberada vê a opção de palpites
-- v2 — sem precisar de senha.
--
-- A senha continua como fallback temporário (cookie analise_auth)
-- enquanto a allowlist não enche.
--
-- RLS habilitado e SEM policy de SELECT para anon/authenticated:
-- a verificação roda server-side via service_role (bypassa RLS).
-- O e-mail do usuário logado é lido via auth.getUser() no servidor;
-- a checagem `email ∈ contribuintes` nunca chega ao browser.
--
-- COMO APLICAR: copiar este arquivo inteiro no SQL Editor do
-- Supabase Dashboard e executar.
--   supabase.com/dashboard/project/<id>/sql/new
-- =============================================================

create table if not exists public.contribuintes (
    email        text        primary key,
    nome         text,
    nota         text,                                -- ex.: "Pix R$10, 2026-06-22"
    liberado_em  timestamptz not null default now()
);

-- Normaliza e-mail em minúsculas na escrita (a checagem usa lower()).
create or replace function public.contribuintes_lower_email()
returns trigger language plpgsql as $$
begin
  new.email := lower(trim(new.email));
  return new;
end;
$$;

drop trigger if exists trg_contribuintes_lower on public.contribuintes;
create trigger trg_contribuintes_lower
  before insert or update on public.contribuintes
  for each row execute function public.contribuintes_lower_email();

-- RLS habilitado. SEM policy de SELECT para anon ou authenticated:
-- leitura exclusivamente via service_role (server-side).
alter table public.contribuintes enable row level security;

-- Nenhuma policy adicionada intencionalmente. INSERT/UPDATE/DELETE/SELECT
-- ficam bloqueados para todos exceto service_role (que bypassa RLS).
