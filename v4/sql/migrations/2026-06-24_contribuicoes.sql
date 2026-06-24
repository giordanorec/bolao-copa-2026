-- =============================================================
-- 2026-06-24 -- Tabela contribuicoes (log de doacoes via Pix)
-- =============================================================
-- Uma linha por PAGAMENTO (quem pagou mais de uma vez tem >1 linha).
-- `email` casa com public.contribuintes quando identificado; NULL quando
-- o pagador ainda nao foi associado a uma conta. RLS igual contribuintes:
-- leitura so via service_role (server-side).
--
-- COMO APLICAR: copiar este arquivo no SQL Editor do Supabase e executar.
--   supabase.com/dashboard/project/<id>/sql/new
-- =============================================================

create table if not exists public.contribuicoes (
    id          bigint generated always as identity primary key,
    nome        text        not null,
    email       text,                       -- conta associada (lower); NULL se nao identificado
    valor       numeric(8,2) not null,
    data        date,
    hora        time,
    criado_em   timestamptz not null default now()
);

create index if not exists idx_contribuicoes_email on public.contribuicoes (email);

alter table public.contribuicoes enable row level security;
-- Sem policies: acesso so via service_role (bypassa RLS).

-- Seed: contribuicoes recebidas ate 2026-06-24 (extrato Pix).
insert into public.contribuicoes (nome, email, valor, data, hora) values
  ('Rodrigo Albuquerque Dantas', 'rdantass@gmail.com', 10.00, '2026-06-24', '08:07'),
  ('Rodrigo Alvim Gusman Pereira', NULL, 10.00, '2026-06-24', '07:46'),
  ('Ailton Luiz Ferreira Neto', 'alfnto@icloud.com', 25.00, '2026-06-24', '01:32'),
  ('Antonio Ilmar Carneiro Junior', 'ilmar.junior.bc@gmail.com', 10.00, '2026-06-24', '00:48'),
  ('Vitor Ferreira Soares', 'vitorsoares.fr@gmail.com', 10.00, '2026-06-23', '23:44'),
  ('Lauro Junior Lopes da Silva', 'laurojr.silva@yahoo.com.br', 25.00, '2026-06-23', '22:41'),
  ('Taimara Marinho de Souza', 'taimarasouzam@gmail.com', 10.00, '2026-06-23', '22:03'),
  ('Breno Gustavo Soares da Costa', 'brenogscosta@gmail.com', 25.00, '2026-06-23', '21:32'),
  ('Murilo Araujo de Brito', 'murilo11demaio@gmail.com', 10.00, '2026-06-23', '19:29'),
  ('Renan Vieira Hott', NULL, 10.00, '2026-06-23', '17:09'),
  ('Joseph de Almeida Monteiro Carvalho Queiroz', 'eujoequeiroz@gmail.com', 10.00, '2026-06-23', '16:25'),
  ('Victor Germano da Silva Junior', 'victorgermano23@yahoo.com.br', 10.00, '2026-06-23', '16:24'),
  ('Andreson Mota de Melo', 'andersonmotapk@gmail.com', 10.00, '2026-06-23', '15:04'),
  ('Elder Eduardo Martins Cichello', 'eldermartins7@gmail.com', 10.00, '2026-06-23', '14:03'),
  ('Lucas Spancini Bobbio', 'lucas.bobbio@hotmail.com', 10.00, '2026-06-23', '13:28'),
  ('Lucas Mauri Nascimento', 'lucasmaurinascimento@hotmail.com', 10.00, '2026-06-23', '13:11'),
  ('Victor Hugo Goncalves da Silva', 'goncalves.victorhugo@outlook.com', 10.00, '2026-06-23', '13:10'),
  ('Gabriel Vicente Druzian', 'gabrielvdruzian@gmail.com', 10.00, '2026-06-23', '13:06'),
  ('David de Aquino Goncalo', 'david.aquino03@gmail.com', 10.00, '2026-06-23', '12:17'),
  ('Daniel de Almeida Lubianco', 'daniel_lubianco@hotmail.com', 10.00, '2026-06-23', '12:04'),
  ('Dalisson Pereira de Melo', 'dalissonmelo@gmail.com', 10.00, '2026-06-23', '11:26'),
  ('Yury Moza da Costa', 'yurymoza@gmail.com', 10.00, '2026-06-23', '11:01'),
  ('Wellington Monteiro Carvalho', 'carvalho.wellington@outlook.com', 10.00, '2026-06-23', '10:49'),
  ('Gabriel Luiz Novaski', 'novaski93@gmail.com', 10.00, '2026-06-23', '10:16'),
  ('Sandrelly Luiz Coutinho', 'slc@cin.ufpe.br', 25.00, '2026-06-23', '09:56'),
  ('Denilson Goncalves da Silva', 'denilson-dgs@hotmail.com', 10.00, '2026-06-23', '09:38'),
  ('Rodolfo Pereira de Andrade', 'rodolfop.andrade@gmail.com', 10.00, '2026-06-23', '09:26'),
  ('Renato Silveira dos Santos', 'renato.santos@gmail.com', 25.00, '2026-06-23', '09:16'),
  ('Robson Alessio', 'robson.alessio@hotmail.com', 25.00, '2026-06-23', '09:11'),
  ('Roberto Goncalves Moura da Silva', 'roberto.moura@outlook.com', 10.00, '2026-06-23', '09:08'),
  ('Gabriel Vassallo Mansur', 'gvmansur@hotmail.com', 25.00, '2026-06-23', '08:34'),
  ('Vinicius Santos Tiberio', 'tiberiovinicius@hotmail.com', 25.00, '2026-06-23', '08:23'),
  ('Eliel Barbosa Gomes', 'eliel-barbosa@hotmail.com', 10.00, '2026-06-23', '08:13'),
  ('Gabriel Antonio Machado da Silva', 'gabriel.machado.a@gmail.com', 10.00, '2026-06-23', '08:11'),
  ('Lenon Henrique Goncalves Felicio', 'lenonfelicio@gmail.com', 25.00, '2026-06-23', '07:52'),
  ('Almir Moreira Saude', 'almirms@gmail.com', 25.00, '2026-06-23', '07:49'),
  ('Leandro Yoshimi Kashiwagui', 'leyoshimi@gmail.com', 10.00, '2026-06-23', '07:41'),
  ('Diego Casais Moreira', 'diego_casais@hotmail.com', 10.00, '2026-06-23', '06:24'),
  ('Thiago Simoes de Moraes', 'thiagosimoesdemoraes@gmail.com', 10.00, '2026-06-23', '05:42'),
  ('Rodrigo Prado Garcia', 'rpradogarcia@gmail.com', 10.00, '2026-06-23', '01:54'),
  ('Victor Hugo de Carvalho Caldas', 'v.hugocaldas@gmail.com', 25.00, '2026-06-22', '23:18'),
  ('Sandoval Augusto Dias Aragao', 'hakjisan@gmail.com', 10.00, '2026-06-22', '23:15'),
  ('Thiago Lima Ferreira', 'thiagulf1@gmail.com', 25.00, '2026-06-22', '23:13'),
  ('Bruno Dias Silva', 'bruno_diassilva@yahoo.com.br', 10.00, '2026-06-22', '23:03'),
  ('Bruno Olyntho de Almeida', 'bruno_olyntho@hotmail.com', 10.00, '2026-06-22', '23:00'),
  ('Welson Silva Vitor', 'welsonvitorzn@gmail.com', 10.00, '2026-06-22', '22:35'),
  ('Victor Hugo de Carvalho Caldas', 'v.hugocaldas@gmail.com', 10.00, '2026-06-21', '11:45'),
  ('Francisco Arthur Costa dos Santos', 'frscoarthur@gmail.com', 25.00, '2026-06-20', '19:35'),
  ('Fabio Bronzatti Silveira', 'fbs813@gmail.com', 50.00, '2026-06-20', '00:23'),
  ('Michel Veronezi Aldrighi', 'michelvrt3197@gmail.com', 10.00, '2026-06-16', '16:06'),
  ('Alfeu Cavararo Martins', 'alfe.nit@hotmail.com', 10.00, '2026-06-12', '18:09'),
  ('Clarisse Monteiro Castelo Branco', 'clarissecastelobranco@gmail.com', 10.00, '2026-06-11', '14:16');
