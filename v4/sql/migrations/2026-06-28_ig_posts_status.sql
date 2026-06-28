-- Rastreio de quais posts do Instagram já foram publicados em @arena.das.ias.
-- O id casa com o `id` do post no ig-posts-manifest.json (ex.:
-- "31_carrossel_retrospectiva-grupos", "vinheta-J73-za-ca").
-- Sem RLS: só o service_role (admin) lê/escreve, igual a contribuicoes.

create table if not exists public.ig_posts_status (
  post_id       text primary key,
  publicado     boolean not null default false,
  publicado_em  timestamptz,
  atualizado_em timestamptz not null default now()
);

alter table public.ig_posts_status enable row level security;
-- (nenhuma policy => apenas service_role acessa)
