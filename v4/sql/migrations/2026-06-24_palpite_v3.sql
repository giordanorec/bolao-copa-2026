-- =============================================================
-- 2026-06-24 — Suporte a v3 na tabela palpite_v2 (coluna `versao`)
-- =============================================================
-- Contexto: a 2ª rodada da fase de grupos terminou e refizemos os
-- palpites dos 8 jogos finais dos Grupos I/J/K/L (61, 62, 67-72) com
-- a classificação parcial na mesa. Esse é o "v3" — premium, igual ao
-- v2: revelado só a quem está na allowlist de contribuintes.
--
-- Em vez de uma tabela nova, adicionamos a coluna `versao` em
-- palpite_v2 (default 'v2') e ampliamos a PK para incluí-la. Assim o
-- mesmo (slug, jogo_numero) coexiste em v2 e v3, e a /analise-v2
-- mostra a trilha v1 → v2 → v3 nesses 8 jogos.
--
-- RLS continua igual: sem policy de SELECT, só o service_role lê
-- (gate real num repo público).
--
-- COMO APLICAR: copiar este arquivo inteiro no SQL Editor do
-- Supabase Dashboard e executar.
--   supabase.com/dashboard/project/<id>/sql/new
-- Idempotente: pode rodar mais de uma vez sem erro.
-- =============================================================

-- 1. Coluna versao (registros antigos viram 'v2')
alter table public.palpite_v2
    add column if not exists versao text not null default 'v2';

-- 2. Ampliar a PK para (slug, jogo_numero, versao).
--    Drop da PK antiga + recriação. Os nomes default de constraint no
--    Postgres são <tabela>_pkey.
do $$
begin
    if exists (
        select 1 from pg_constraint
        where conname = 'palpite_v2_pkey'
          and conrelid = 'public.palpite_v2'::regclass
    ) then
        -- só recria se a PK ainda não inclui `versao`
        if not exists (
            select 1
            from pg_constraint c
            join pg_attribute a
              on a.attrelid = c.conrelid and a.attnum = any(c.conkey)
            where c.conname = 'palpite_v2_pkey'
              and a.attname = 'versao'
        ) then
            alter table public.palpite_v2 drop constraint palpite_v2_pkey;
            alter table public.palpite_v2
                add constraint palpite_v2_pkey
                primary key (slug, jogo_numero, versao);
        end if;
    end if;
end $$;
