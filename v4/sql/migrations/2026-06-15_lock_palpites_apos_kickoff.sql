-- =============================================================
-- 2026-06-15 — Trava palpite depois do kickoff (server-side)
-- =============================================================
-- Bug grave: usuários conseguiam editar palpite de jogo que já
-- aconteceu (a RLS antiga só checava auth.uid()=user_id; não
-- olhava a hora do jogo). Agora cada palpite só pode ser
-- inserido/atualizado/excluído ANTES do kickoff.
--
-- A hora usada é a do servidor Postgres (now() em UTC) — não a do
-- relógio do cliente. Não dá pra burlar trocando o relógio.
--
-- COMO APLICAR: copiar este arquivo inteiro no SQL editor do
-- Supabase Dashboard e executar.
--   supabase.com/dashboard/project/<id>/sql/new
-- =============================================================

-- 1) Tabela com o kickoff de cada jogo
create table if not exists public.jogo (
    numero  int primary key check (numero between 1 and 104),
    kickoff timestamptz not null
);

alter table public.jogo enable row level security;

drop policy if exists jogo_select_all on public.jogo;
create policy jogo_select_all on public.jogo for select using (true);

-- Insert/update só via service_role (admin). Sem policy => bloqueado por padrão.

-- 2) Popular com todos os 104 jogos (idempotente).
-- Os horários são America/Sao_Paulo (-03:00). Esses são os mesmos
-- usados em data/jogos.md / public/jogos.json.
insert into public.jogo (numero, kickoff) values
    (1, '2026-06-11T16:00:00-03:00'),
    (2, '2026-06-11T23:00:00-03:00'),
    (3, '2026-06-12T16:00:00-03:00'),
    (4, '2026-06-12T22:00:00-03:00'),
    (5, '2026-06-13T22:00:00-03:00'),
    (6, '2026-06-14T01:00:00-03:00'),
    (7, '2026-06-13T19:00:00-03:00'),
    (8, '2026-06-13T16:00:00-03:00'),
    (9, '2026-06-14T20:00:00-03:00'),
    (10, '2026-06-14T14:00:00-03:00'),
    (11, '2026-06-14T17:00:00-03:00'),
    (12, '2026-06-14T23:00:00-03:00'),
    (13, '2026-06-15T19:00:00-03:00'),
    (14, '2026-06-15T13:00:00-03:00'),
    (15, '2026-06-15T22:00:00-03:00'),
    (16, '2026-06-15T16:00:00-03:00'),
    (17, '2026-06-16T16:00:00-03:00'),
    (18, '2026-06-16T19:00:00-03:00'),
    (19, '2026-06-16T22:00:00-03:00'),
    (20, '2026-06-17T01:00:00-03:00'),
    (21, '2026-06-17T20:00:00-03:00'),
    (22, '2026-06-17T17:00:00-03:00'),
    (23, '2026-06-17T14:00:00-03:00'),
    (24, '2026-06-17T23:00:00-03:00'),
    (25, '2026-06-18T13:00:00-03:00'),
    (26, '2026-06-18T16:00:00-03:00'),
    (27, '2026-06-18T19:00:00-03:00'),
    (28, '2026-06-18T22:00:00-03:00'),
    (29, '2026-06-19T21:30:00-03:00'),
    (30, '2026-06-19T19:00:00-03:00'),
    (31, '2026-06-20T00:00:00-03:00'),
    (32, '2026-06-19T16:00:00-03:00'),
    (33, '2026-06-20T17:00:00-03:00'),
    (34, '2026-06-20T21:00:00-03:00'),
    (35, '2026-06-20T14:00:00-03:00'),
    (36, '2026-06-21T01:00:00-03:00'),
    (37, '2026-06-21T19:00:00-03:00'),
    (38, '2026-06-21T13:00:00-03:00'),
    (39, '2026-06-21T16:00:00-03:00'),
    (40, '2026-06-21T22:00:00-03:00'),
    (41, '2026-06-22T21:00:00-03:00'),
    (42, '2026-06-22T18:00:00-03:00'),
    (43, '2026-06-22T14:00:00-03:00'),
    (44, '2026-06-23T00:00:00-03:00'),
    (45, '2026-06-23T17:00:00-03:00'),
    (46, '2026-06-23T20:00:00-03:00'),
    (47, '2026-06-23T14:00:00-03:00'),
    (48, '2026-06-23T23:00:00-03:00'),
    (49, '2026-06-24T19:00:00-03:00'),
    (50, '2026-06-24T19:00:00-03:00'),
    (51, '2026-06-24T16:00:00-03:00'),
    (52, '2026-06-24T16:00:00-03:00'),
    (53, '2026-06-24T22:00:00-03:00'),
    (54, '2026-06-24T22:00:00-03:00'),
    (55, '2026-06-25T17:00:00-03:00'),
    (56, '2026-06-25T17:00:00-03:00'),
    (57, '2026-06-25T20:00:00-03:00'),
    (58, '2026-06-25T20:00:00-03:00'),
    (59, '2026-06-25T23:00:00-03:00'),
    (60, '2026-06-25T23:00:00-03:00'),
    (61, '2026-06-26T16:00:00-03:00'),
    (62, '2026-06-26T16:00:00-03:00'),
    (63, '2026-06-27T00:00:00-03:00'),
    (64, '2026-06-27T00:00:00-03:00'),
    (65, '2026-06-26T21:00:00-03:00'),
    (66, '2026-06-26T21:00:00-03:00'),
    (67, '2026-06-27T18:00:00-03:00'),
    (68, '2026-06-27T18:00:00-03:00'),
    (69, '2026-06-27T23:00:00-03:00'),
    (70, '2026-06-27T23:00:00-03:00'),
    (71, '2026-06-27T20:30:00-03:00'),
    (72, '2026-06-27T20:30:00-03:00'),
    (73, '2026-06-28T16:00:00-03:00'),
    (74, '2026-06-29T17:30:00-03:00'),
    (75, '2026-06-29T22:00:00-03:00'),
    (76, '2026-06-29T14:00:00-03:00'),
    (77, '2026-06-30T18:00:00-03:00'),
    (78, '2026-06-30T14:00:00-03:00'),
    (79, '2026-06-30T22:00:00-03:00'),
    (80, '2026-07-01T13:00:00-03:00'),
    (81, '2026-07-01T21:00:00-03:00'),
    (82, '2026-07-01T17:00:00-03:00'),
    (83, '2026-07-02T20:00:00-03:00'),
    (84, '2026-07-02T16:00:00-03:00'),
    (85, '2026-07-03T00:00:00-03:00'),
    (86, '2026-07-03T19:00:00-03:00'),
    (87, '2026-07-03T22:30:00-03:00'),
    (88, '2026-07-03T15:00:00-03:00'),
    (89, '2026-07-04T18:00:00-03:00'),
    (90, '2026-07-04T14:00:00-03:00'),
    (91, '2026-07-05T17:00:00-03:00'),
    (92, '2026-07-05T21:00:00-03:00'),
    (93, '2026-07-06T16:00:00-03:00'),
    (94, '2026-07-06T21:00:00-03:00'),
    (95, '2026-07-07T13:00:00-03:00'),
    (96, '2026-07-07T17:00:00-03:00'),
    (97, '2026-07-09T17:00:00-03:00'),
    (98, '2026-07-10T16:00:00-03:00'),
    (99, '2026-07-11T18:00:00-03:00'),
    (100, '2026-07-11T22:00:00-03:00'),
    (101, '2026-07-14T16:00:00-03:00'),
    (102, '2026-07-15T16:00:00-03:00'),
    (103, '2026-07-18T18:00:00-03:00'),
    (104, '2026-07-19T16:00:00-03:00')
on conflict (numero) do update set kickoff = excluded.kickoff;

-- 3) Função que diz se o palpite ainda pode ser editado.
-- Stable + leitura via policy pública = sem security definer.
-- Se o jogo não existir na tabela jogo, retorna false (fail-closed:
-- na dúvida, bloqueia em vez de permitir).
create or replace function public.palpite_aberto(p_numero int)
returns boolean
language sql
stable
as $$
    select coalesce(
        (select now() < kickoff from public.jogo where numero = p_numero),
        false
    );
$$;

-- 4) Refazer as policies de palpite incluindo o gate de tempo.
-- SELECT continua igual (ver palpite passado é OK).
drop policy if exists palpite_insert_self on public.palpite;
create policy palpite_insert_self on public.palpite
    for insert
    with check (
        auth.uid() = user_id
        and public.palpite_aberto(jogo_numero)
    );

drop policy if exists palpite_update_self on public.palpite;
create policy palpite_update_self on public.palpite
    for update
    using (
        auth.uid() = user_id
        and public.palpite_aberto(jogo_numero)
    )
    with check (
        auth.uid() = user_id
        and public.palpite_aberto(jogo_numero)
    );

drop policy if exists palpite_delete_self on public.palpite;
create policy palpite_delete_self on public.palpite
    for delete
    using (
        auth.uid() = user_id
        and public.palpite_aberto(jogo_numero)
    );

-- Pronto. A partir daqui qualquer tentativa de INSERT/UPDATE/DELETE
-- num palpite de jogo que já começou retorna 0 linhas afetadas (RLS
-- silencia, mas o palpite NÃO é alterado). O service_role (admin)
-- continua passando por cima de RLS.
