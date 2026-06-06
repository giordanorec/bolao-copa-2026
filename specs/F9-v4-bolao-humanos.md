# F9 — v4: Bolão para Humanos (Crie Seu Bolão)

**Status**: Em implementação · **Início**: 2026-06-06

## Objetivo

Permitir que humanos criem bolões gratuitos da Copa 2026, paralelos ao bolão das IAs. Cada bolão = grupo privado com link compartilhável. Ranking interno do grupo + opção de entrar no ranking geral (humanos + IAs + bola de cristal).

## Escopo (MVP)

- Cadastro email+senha
- Criar bolão → link único `/bolao/{slug}`
- Entrar em bolão pelo link
- Preencher 104 palpites (UI inspirada na página de jogo do v1)
- Ranking interno por bolão
- Ranking geral opt-in (humanos + IAs)
- Compartilhar bolão via WhatsApp / Copy

## Fora do escopo MVP

- Stripe (doação) → iteração 2
- Google OAuth → iteração 2
- Edição em batch → iteração 2
- Geração de cards (Instagram/TikTok) → iteração 2
- Notificações por email → iteração 2

## Stack

| Camada | Escolha |
|---|---|
| Frontend | **Next.js 15** (App Router, TS) |
| Estilo | **Tailwind CSS v4** (PostCSS) |
| Hospedagem | **Vercel** (free tier) — `bolao-copa-2026.vercel.app` |
| DB + Auth | **Supabase** (free tier) |
| Estado client | React Server Components + Server Actions |
| Ícones | lucide-react |

## URLs

| Rota | Função |
|---|---|
| `/` | Landing v4 — explica o que é + CTA "criar meu bolão" |
| `/signup` | Cadastro email+senha |
| `/login` | Login |
| `/dashboard` | Bolões em que o usuário participa |
| `/criar` | Form criar bolão |
| `/bolao/[slug]` | Visão do bolão (ranking, membros, compartilhar) |
| `/bolao/[slug]/palpitar` | Preencher palpites |
| `/api/jogos` | JSON dos 104 jogos (sync com v1) |
| `/ranking-geral` | Ranking combinado (humanos opt-in + IAs + bola de cristal) |

## Schema (Supabase / Postgres)

```sql
-- Usuários extras (além de auth.users do Supabase)
profiles (
  id uuid pk → auth.users.id,
  display_name text,
  instagram text,
  whatsapp text,
  opt_in_ranking_geral boolean default false,
  created_at timestamptz
)

-- Bolão = grupo
bolao (
  id uuid pk,
  slug text unique,           -- ex: "abc123" (nanoid 8 chars)
  nome text,
  descricao text,
  criador_id uuid → profiles.id,
  criado_em timestamptz,
  encerrado boolean default false
)

-- Quem participa de cada bolão
bolao_membro (
  bolao_id uuid → bolao.id,
  user_id uuid → profiles.id,
  entrou_em timestamptz,
  primary key (bolao_id, user_id)
)

-- Palpites individuais
palpite (
  user_id uuid → profiles.id,
  jogo_numero int,            -- 1..104
  gols_a int,
  gols_b int,
  atualizado_em timestamptz,
  primary key (user_id, jogo_numero)
)
```

Observação: palpites são por USUÁRIO, não por bolão. Um usuário em N bolões
usa o mesmo conjunto de palpites pra todos. Simplifica drasticamente
e bate com como bolões reais funcionam.

## RLS (Row Level Security)

- `profiles`: SELECT público de `display_name`; UPDATE só próprio
- `bolao`: SELECT público; INSERT autenticado; UPDATE/DELETE só criador
- `bolao_membro`: SELECT membros do bolão; INSERT autenticado (só pra si mesmo)
- `palpite`: SELECT membros de bolões em comum; INSERT/UPDATE só próprio

## Scoring

Reaproveita as regras do v1:
- Placar exato: 10
- Vencedor + saldo: 7
- Vencedor: 5
- Empate sem placar exato: 5
- Errado: 0
- Mata-mata: ×2

Implementado em `lib/scoring.ts` como port direto do `src/bolao/score.py`.

## Sync de dados com v1

`scripts/v4_sync.py`:
- Lê `data/jogos.md` + `web/data/ranking.json`
- Gera `v4/public/jogos.json` e `v4/public/ranking-ias.json`
- Rodado junto com `python -m bolao rodada`

Decisão: dados de jogos ficam **estáticos** no bundle (não vão pro Supabase),
porque mudam pouco (resultados são atualizados manualmente entre rodadas).
Bolão regenera + Vercel rebuilda.

## Deploy

1. Push do `v4/` pro repo (`giordanorec/bolao-copa-2026`)
2. Vercel detecta `v4/package.json` como root
3. Variáveis de ambiente Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Domínio inicial: `bolao-copa-2026.vercel.app`
5. Quando comprar domínio próprio: aponta pra Vercel (DNS A/CNAME)

## Setup do operador (Giordano)

Ver `v4/README.md` — passo a passo Supabase + Vercel.

## Riscos

- **Free tier Supabase**: 500MB DB + 50k MAU. Se v4 viralizar, migra pra Pro ($25/mês)
- **Free tier Vercel**: 100GB bandwidth/mês. Idem
- **Spam de bolões**: rate limit no Supabase Edge Function (futuro)
- **Cold start**: Next.js SSR no Vercel Functions tem ~200ms cold. Aceitável

## Próximas iterações

- Stripe Donate Link → embutir botão na home
- Google OAuth → Supabase já suporta nativamente
- Edição em batch (importar palpite IA pra dentro do seu)
- Cards de compartilhamento (Canvas API, reaproveitar v1)
- Notificações pre-jogo via email/WhatsApp Web
