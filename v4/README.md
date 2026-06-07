# Arena de IAs — v4 (Bolão da Copa pra humanos)

Primeiro produto da Arena de IAs: bolão pra humanos, paralelo ao bolão das IAs do v1. Pessoas criam grupos, recebem link, palpitam os 104 jogos da Copa 2026 e disputam entre si — opcionalmente contra as 121 IAs do ranking geral + Bola de Cristal.

🌐 **Em produção**: https://arena-de-ias.vercel.app

## Stack

| Camada | Escolha |
|---|---|
| Frontend | **Next.js 15.5** (App Router, TS) |
| Estilo | **CSS puro** (sem Tailwind, tema Airbnb do v1) |
| Hospedagem | **Vercel** (free tier) |
| DB + Auth | **Supabase** (free tier) |
| Tipografia | Fraunces + Inter + JetBrains Mono |
| Ícones | Emoji (sem deps externas) |

## Estrutura

```
v4/
├── app/
│   ├── layout.tsx            # raiz: header + footer + PWA
│   ├── page.tsx              # landing (hero + features + steps)
│   ├── login/                # entrar
│   ├── signup/               # cadastrar
│   ├── dashboard/            # meus bolões
│   ├── criar/                # criar bolão (protegida server-side)
│   ├── como-funciona/        # FAQ + regras + disclaimers
│   ├── ias/                  # lista 121 IAs por empresa
│   ├── ranking-geral/        # humanos + IAs + bola de cristal
│   ├── doar/                 # PIX + Stripe (placeholder)
│   └── bolao/[slug]/         # visão + share card + palpitar
├── components/LogoutButton.tsx
├── lib/
│   ├── supabase-browser.ts   # client browser
│   ├── supabase-server.ts    # client server (RSC)
│   ├── supabase-config.ts    # URL + anon key hardcoded (público)
│   ├── scoring.ts            # regras do bolão (port do score.py)
│   ├── jogos.ts              # carrega public/jogos.json
│   └── types.ts              # tipos do DB
├── sql/schema.sql            # rodado no Supabase
├── public/
│   ├── jogos.json            # 104 jogos (sync do v1)
│   ├── ranking-ias.json      # ranking das 122 IAs
│   ├── manifest.json         # PWA
│   ├── sw.js                 # service worker
│   ├── icon-192.png          # PWA icon
│   └── icon-512.png          # PWA icon
├── styles/globals.css        # tema Airbnb + microinterações
├── next.config.ts
└── tsconfig.json
```

## Features entregues

### MVP (todos prontos)
- ✅ Email+senha sem confirmação (auto-confirm via Supabase Auth)
- ✅ Criar bolão → link único `/bolao/{slug}` de 8 chars
- ✅ Entrar via link
- ✅ Palpitar 104 jogos (auto-save em 600ms)
- ✅ Ranking interno do bolão (placar exato 10, vencedor+saldo 7, vencedor 5, mata-mata 2×)
- ✅ Compartilhar (Copy link, WhatsApp, Card 1080×1080)
- ✅ Auth check server-side em `/dashboard` e `/criar`

### Páginas extras
- ✅ `/como-funciona` — pontuação + FAQ + disclaimers
- ✅ `/ias` — lista 121 IAs agrupadas por empresa
- ✅ `/ranking-geral` — combinação humanos opt-in + IAs + Bola de Cristal
- ✅ `/doar` — PIX + placeholder Stripe

### PWA
- ✅ `manifest.json` (standalone, theme-color)
- ✅ Service worker (network-first com fallback)
- ✅ Ícones 192/512 (PNG gerado via PIL)
- ✅ Open Graph + viewport metadata

### Polimento
- ✅ Microinterações (ripple buttons, hover stats, fade-up no hero)
- ✅ Mobile breakpoints (≤720px)
- ✅ iOS safe-area-inset
- ✅ `prefers-reduced-motion`
- ✅ `focus-visible` accessibility

## Setup (uma vez)

### 1. Supabase
1. Criar projeto em https://supabase.com/dashboard
2. **SQL Editor** → cola `v4/sql/schema.sql` → Run
3. **Authentication → Providers → Email** → `Confirm email` OFF (ou setar `mailer_autoconfirm: true` via Management API)
4. **Authentication → URL Configuration** → Site URL + redirect URLs apontando pro Vercel

### 2. Variáveis locais
```bash
cp v4/.env.example v4/.env.local
# editar com URL + anon key do Supabase
```

### 3. Rodar local
```bash
cd v4 && npm install && npm run dev
# http://localhost:3000
```

### 4. Deploy Vercel
- Import repo
- Root Directory: `v4`
- Framework: **Next.js** (importante: setar explicitamente — não confia em autodetect)
- Env vars: `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Sync de dados com v1

Sempre que `python -m bolao rodada` rodar no v1:
```bash
python scripts/v4_sync.py
```
Copia `web/data/jogos.json` e `ranking.json` pra `v4/public/`. Vercel rebuilda no próximo push.

## Modelos de dados

Ver `sql/schema.sql`. Resumo:
- `profiles` (id, display_name, instagram, whatsapp, **opt_in_geral**)
- `bolao` (id, slug, nome, descricao, criador_id)
- `bolao_membro` (bolao_id, user_id)
- `palpite` (user_id, jogo_numero, gols_a, gols_b)

**RLS** em todas as tabelas. Usuário só vê/edita o que é seu. Bolões públicos por link (ponto de design).

## Decisões importantes (registradas em `docs/DECISOES.md`)

- **Hardcoded SUPABASE_URL + anon key**: NEXT_PUBLIC_* são literalmente públicas (vão pro bundle JS). Coloquei em `lib/supabase-config.ts` como fallback pra contornar limitação de env vars `sensitive` no Edge Runtime do Vercel.
- **Sem middleware**: `@supabase/ssr` crasha no Edge Runtime do Next 15.5. Auth check inline nas Server Components.
- **Sem Tailwind**: tema custom + variáveis CSS faz mais sentido. Tailwind v4 + custom theme só atrapalhava.
- **Sem OAuth Google**: precisa de verificação Google (semanas). Email+senha sem confirmação resolve.
- **Vercel SSO desativado** via API (era padrão Hobby plan, bloqueava acesso público).
- **`framework: "nextjs"` setado explicitamente** na config do projeto Vercel — autodetect falhou em algum momento causando 404 generalizado.

## Próximas iterações

- [ ] Google OAuth (depois da aprovação Google)
- [ ] Stripe pagamento real
- [ ] Edição em batch (importar palpite de IA pra dentro do seu)
- [ ] Notificações pre-jogo
- [ ] Dark mode toggle
- [ ] Outros produtos da Arena: comparador, dicas pré-jogo

## Debugging

- **"Email rate limit exceeded"** → Supabase free tier limita 4 emails/hora. Desativar Confirm email.
- **MIDDLEWARE_INVOCATION_FAILED** → não use middleware no Edge com `@supabase/ssr` em Next 15.5.
- **404 generalizado pós-deploy** → conferir se `framework: "nextjs"` está setado no projeto Vercel.
- **noindex em produção** → `robots: { index: true, follow: true }` no metadata do layout.
- **"Missing env var"** → o fallback em `supabase-config.ts` deveria pegar. Confere se o arquivo está sendo importado certo.
