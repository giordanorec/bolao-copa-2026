# v4 — Crie seu Bolão (humanos)

Sistema de bolão pra humanos, paralelo ao bolão das IAs (v1). Pessoas criam grupos, recebem link, palpitam os 104 jogos e disputam entre si — opcionalmente contra as IAs do ranking geral.

## Stack

- **Next.js 15** (App Router, TS) + **Tailwind v4**
- **Supabase** (DB + Auth) — free tier
- **Vercel** (deploy) — free tier
- **lucide-react** (ícones), **nanoid** (slugs)

## Estrutura

```
v4/
├── app/
│   ├── layout.tsx          # raiz: header + footer
│   ├── page.tsx            # landing
│   ├── login/              # entrar
│   ├── signup/             # cadastrar
│   ├── dashboard/          # meus bolões
│   ├── criar/              # criar bolão
│   └── bolao/[slug]/       # ver bolão + palpitar
├── components/             # Client Components compartilhados
├── lib/
│   ├── supabase-browser.ts # Supabase client (browser)
│   ├── supabase-server.ts  # Supabase client (RSC/Server Actions)
│   ├── scoring.ts          # regras do bolão (port do Python)
│   ├── jogos.ts            # carrega public/jogos.json
│   └── types.ts            # tipos do DB
├── sql/
│   └── schema.sql          # rodar no SQL Editor do Supabase
├── public/
│   ├── jogos.json          # gerado por scripts/v4_sync.py
│   └── ranking-ias.json    # idem
├── styles/globals.css      # Tailwind + design tokens
├── middleware.ts           # protege /dashboard, /criar
├── next.config.ts
├── tsconfig.json
└── .env.example
```

## Setup (uma vez)

### 1. Criar projeto Supabase

1. Acesse https://supabase.com/dashboard (free)
2. **New project** → nome `bolao-copa-2026`, região São Paulo, senha de DB forte
3. Aguarde ~2 min provisionar
4. **SQL Editor** → cole `v4/sql/schema.sql` → Run
5. **Settings → API** → copie `Project URL` e `anon public key`

### 2. Variáveis locais

```bash
cp v4/.env.example v4/.env.local
# Cole os valores do passo 1.5
```

### 3. Instalar e rodar local

```bash
cd v4
npm install
npm run dev
# http://localhost:3000
```

### 4. Deploy na Vercel

1. https://vercel.com/new
2. **Import Git Repository** → `giordanorec/bolao-copa-2026`
3. **Root Directory**: `v4`
4. **Framework**: Next.js (autodetectado)
5. **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. **Deploy**
7. URL padrão: `bolao-copa-2026.vercel.app`

### 5. Configurar URL de redirect no Supabase

Em **Authentication → URL Configuration**:
- **Site URL**: `https://bolao-copa-2026.vercel.app`
- **Redirect URLs**: adicione `http://localhost:3000/**` pra dev local

## Sync de dados com v1

Sempre que `python -m bolao rodada` rodar no v1, rode também:

```bash
python scripts/v4_sync.py
```

Isso copia `web/data/jogos.json` e `ranking.json` pra `v4/public/`. O Vercel rebuilda no próximo push.

(Pode automatizar no `scripts/deploy.sh` quando quiser.)

## Modelos de dados (Supabase)

Ver `sql/schema.sql`. Resumo:

- `profiles` (id, display_name, instagram, whatsapp, opt_in_geral)
- `bolao` (id, slug, nome, descricao, criador_id)
- `bolao_membro` (bolao_id, user_id)
- `palpite` (user_id, jogo_numero, gols_a, gols_b)

**RLS ativo** em todas. Usuário só vê/edita o que é seu. Bolões são públicos por link
(qualquer um com slug consegue ver — é o ponto, é pra compartilhar).

## Próximas iterações

- [ ] Stripe Donate Link (botão na home)
- [ ] Google OAuth (Supabase Auth)
- [ ] Importar palpite de IA (batch)
- [ ] Cards de share (Canvas API)
- [ ] Notificações pre-jogo
- [ ] `/ranking-geral` combinando humanos opt-in + IAs + bola de cristal

## Debugging

- **"NEXT_PUBLIC_SUPABASE_URL is not defined"**: faltou `.env.local`
- **Login funciona mas redirect quebra**: confere `Site URL` no Supabase
- **RLS bloqueando query**: verifica policies no SQL editor, ou usa o "API Logs" no dashboard
