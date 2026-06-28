-- =============================================================
-- Migration: 2026-06-27_bolao_publico.sql
-- Adiciona coluna `publico` na tabela `bolao` e insere o bolão
-- central "Humanos × IAs — Mata-mata".
-- =============================================================

-- 1. Nova coluna: bolões públicos ficam visíveis pra todos
alter table public.bolao
    add column if not exists publico boolean not null default false;

-- =============================================================
-- 2. Seed do bolão central (idempotente)
--
-- Sobre criador_id:
--   A tabela `bolao` exige criador_id NOT NULL com FK para profiles.
--   O bolão "humanos-vs-ias" é um bolão de sistema (não pertence a
--   um usuário real), então há duas opções:
--
--   Opção A (escolhida aqui): usar o UUID do perfil admin do Giordano.
--   Deixe o placeholder :::ADMIN_PROFILE_ID::: abaixo preenchido com
--   o UUID real antes de rodar. Para descobrir:
--     select id from public.profiles where display_name = 'Giordano'
--     limit 1;
--   ou consulte auth.users pelo email do operador.
--
--   Opção B: tornar criador_id nullable para bolões de sistema.
--   Exige `alter table bolao alter column criador_id drop not null;`
--   mais RLS ajustado. Não foi escolhida para não quebrar as políticas
--   RLS existentes que checam `auth.uid() = criador_id`.
--
-- Escolha: Opção A. Preencha :::ADMIN_PROFILE_ID::: antes de aplicar.
-- =============================================================

insert into public.bolao (slug, nome, descricao, criador_id, publico)
values (
    'humanos-vs-ias',
    'Humanos × IAs — Mata-mata',
    'Compare seu palpite com o das IAs na fase de mata-mata da Copa 2026. Entre, palpite e veja quem acerta mais!',
    'ad96041e-db88-4e75-9c95-1365d4251521',   -- perfil admin (Giordano Cabral)
    true
)
on conflict (slug) do update
    set nome      = excluded.nome,
        descricao = excluded.descricao,
        publico   = excluded.publico;
-- criador_id e encerrado não são atualizados para preservar dono original
