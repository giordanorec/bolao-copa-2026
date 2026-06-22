-- =============================================================
-- 2026-06-22 — Tabela palpite_v2 (palpites premium, segunda leva)
-- =============================================================
-- Contexto: o repo é PÚBLICO e o site serve JSON estático.
-- Os palpites v2 (segunda leva, pós-rodadas 1-2 da fase de grupos)
-- são conteúdo premium — revelados só a quem contribuiu via Pix.
-- Guardá-los em arquivo git ou em v4/public/*.json os exporia a
-- qualquer pessoa. A solução é mantê-los aqui, com RLS habilitado
-- e SEM nenhuma policy de SELECT para anon/authenticated.
--
-- Gate real: sem policy de leitura, a anon key NÃO lê esta tabela.
-- Apenas o service_role (server-side, após validar a senha) consegue
-- ler. É isso que faz a "senha" significar algo num repo público.
--
-- v2 cobre jogos 41-72 (fase de grupos restante). NÃO entra no
-- bolão oficial — é artefato de análise paralelo. Ver spec:
-- specs/F-palpites-v2-atualizados.md §4.2
--
-- COMO APLICAR: copiar este arquivo inteiro no SQL Editor do
-- Supabase Dashboard e executar.
--   supabase.com/dashboard/project/<id>/sql/new
-- =============================================================

create table if not exists public.palpite_v2 (
    slug         text        not null,
    jogo_numero  int         not null,
    gols_a       int         not null,
    gols_b       int         not null,
    modo         text        not null default 'api',  -- 'api' | 'web'
    coletado_em  timestamptz not null default now(),
    primary key (slug, jogo_numero)
);

-- RLS habilitado. SEM policy de SELECT para anon ou authenticated:
-- leitura exclusivamente via service_role (server-side).
-- Conteúdo premium — repo público.
alter table public.palpite_v2 enable row level security;

-- Nenhuma policy de SELECT adicionada intencionalmente.
-- INSERT/UPDATE/DELETE também ficam bloqueados para todos exceto
-- service_role (que bypassa RLS por definição do Supabase).
