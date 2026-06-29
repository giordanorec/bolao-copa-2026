-- =============================================================
-- Migration: 2026-06-29_avatar_url.sql
-- Adiciona coluna avatar_url em profiles e cria bucket avatares.
--
-- RODAR MANUALMENTE:
--   Via Supabase Dashboard > SQL Editor > New Query
--   ou via psql:
--     psql "$DATABASE_URL" -f v4/sql/migrations/2026-06-29_avatar_url.sql
-- =============================================================

-- 1. Coluna avatar_url em profiles (nullable)
alter table public.profiles
    add column if not exists avatar_url text;

-- 2. Bucket público `avatares`
--    Convenção de path: avatares/<user_id>/<filename>
insert into storage.buckets (id, name, public)
values ('avatares', 'avatares', true)
on conflict do nothing;

-- 3. Policy: leitura pública (qualquer um pode ver as fotos)
drop policy if exists avatares_read_public on storage.objects;
create policy avatares_read_public on storage.objects
    for select
    using (bucket_id = 'avatares');

-- 4. Policy: insert só pelo dono (path deve começar com <user_id>/)
drop policy if exists avatares_insert_owner on storage.objects;
create policy avatares_insert_owner on storage.objects
    for insert
    with check (
        bucket_id = 'avatares'
        and auth.uid()::text = (storage.foldername(name))[1]
    );

-- 5. Policy: update só pelo dono
drop policy if exists avatares_update_owner on storage.objects;
create policy avatares_update_owner on storage.objects
    for update
    using (
        bucket_id = 'avatares'
        and auth.uid()::text = (storage.foldername(name))[1]
    );

-- 6. Policy: delete só pelo dono
drop policy if exists avatares_delete_owner on storage.objects;
create policy avatares_delete_owner on storage.objects
    for delete
    using (
        bucket_id = 'avatares'
        and auth.uid()::text = (storage.foldername(name))[1]
    );
