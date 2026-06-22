# F — Palpites Atualizados (v2): bifurcação informada da fase de grupos

> **Status:** especificação aprovada (Giordano, 2026-06-22). Em implementação.
> **Fonte de verdade de produto:** `docs/11_ESPECIFICACAO_PRODUTO.md` §11 (resumo).
> Este arquivo é o contrato técnico detalhado que os agentes seguem.

## 1. Objetivo

Oferecer uma **segunda leva de palpites** ("v2"), feita **agora** (após as rodadas 1
e 2 da fase de grupos), incorporando informação nova (classificação parcial, forma,
lesões, suspensões por cartão, odds atualizadas). Serve a dois propósitos:

1. **Recompensa a quem contribuiu financeiramente** — conteúdo exclusivo, liberado
   por senha.
2. **Análise estatística** — comparar v1 (palpite pré-Copa) × v2 (palpite informado)
   nos mesmos jogos, pra responder: *a informação nova melhora os palpites?*

## 2. Decisões firmadas (não reverter sem perguntar)

1. **Bifurcação única, só nesta janela.** v2 cobre **apenas os jogos restantes da
   fase de grupos** (jogos **41–72**, 32 jogos) que **ainda não começaram** no
   momento da coleta. Acabada a fase de grupos, **não há mais bifurcação**: o
   mata-mata será palpitado por todos numa **versão única** (v1 e v2 teriam a mesma
   informação, então colapsam). v2 existe só aqui.
2. **v2 NÃO entra no bolão.** O ranking/pontuação oficiais continuam usando **só o
   v1**. v2 é artefato paralelo, isolado. **Proibido tocar** em `data/palpites_ias/`,
   no scoring/ranking oficiais ou nos JSONs públicos do bolão.
3. **Sem mata-mata no v2.** Ninguém palpita mata-mata agora (nem se sabe quem joga).
4. **Gating: senha única compartilhada.** O repo é **público** → v2 **não pode** ser
   arquivo commitado nem JSON em `v4/public/`. v2 vive no **Supabase**, servido
   **server-side** só após a senha. Cadeado público nos jogos faz o CTA, sem expor
   o palpite.
5. **Todas as IAs.** API (via OpenRouter, automático) + as 12 da Série A (web,
   manual).
6. **Página `/analise`** mostra a comparação; **link só depois** de a fase de grupos
   acabar. Até lá, a página existe mas é alcançada só por quem tem o link+senha.

## 3. Escopo dos jogos

- Fase de grupos = jogos **1–72**. Mata-mata = 73–104.
- Resultados já registrados: até o jogo **40** (`data/resultados/jogos.md`).
- **v2 = jogos 41–72** (32 jogos) **com kickoff no futuro** no instante da coleta.
  Jogos que já começaram (ex.: 41–43 podem ter iniciado em 22/06) **ficam de fora**
  do v2 — incluí-los seria comparação injusta (v2 "adivinharia" jogo em andamento).
  O conjunto real é "≤ 32, os de 41–72 ainda abertos".

## 4. Modelo de dados

### 4.1 Arquivos locais (fonte de coleta)

| Caminho | Versionado? | Conteúdo |
|---|---|---|
| `data/palpites_ias/<slug>.md` | sim (já existe) | **v1 — NÃO TOCAR** |
| `data/palpites_v2/<slug>.md` | **NÃO** (gitignore) | v2 por IA, só linhas dos jogos 41–72 |
| `data/dossie/v2-2026-06-22.md` | sim | dossiê v2 (info pública, pode commitar) |
| `config/prompts/ia-palpiteira-v2.md` | sim | prompt v2 API |
| `config/prompts/ia-palpiteira-v2-web.md` | sim | prompt v2 web (manual) |
| `data/analise_v2.json` | **NÃO** (gitignore) | comparação v1×v2 (artefato local) |

**Formato do `data/palpites_v2/<slug>.md`:** igual ao v1 (header HTML comentado +
tabela markdown de 9 colunas), **mas só com as linhas dos jogos 41–72**. Header
adiciona `<!-- versao: v2 -->` e `<!-- corte: 2026-06-22 -->`.

**Gitignore a adicionar:**
```
# Palpites v2 (premium — nunca versionar; repo é público)
data/palpites_v2/
data/analise_v2.json
```

### 4.2 Supabase

Tabela nova (migration em `v4/sql/migrations/2026-06-22_palpite_v2.sql`, refletir em
`v4/sql/schema.sql`):

```sql
create table public.palpite_v2 (
  slug         text not null,
  jogo_numero  int  not null,
  gols_a       int  not null,
  gols_b       int  not null,
  modo         text not null default 'api',   -- 'api' | 'web'
  coletado_em  timestamptz not null default now(),
  primary key (slug, jogo_numero)
);
alter table public.palpite_v2 enable row level security;
-- SEM policy de SELECT para anon/authenticated: leitura só via service_role
-- (server-side). Isso mantém o conteúdo premium fora do alcance público.
```

> **Gate real:** sem policy de leitura pública, a anon key **não** lê `palpite_v2`.
> Só o servidor (service_role) lê, e só depois de validar a senha. É isto que faz
> "senha" significar algo num repo/JSON público.

### 4.3 Comparação (análise)

`data/analise_v2.json` (e tabela/whatever no Supabase se útil) por IA:
```json
{
  "gerado_em": "...",
  "jogos_considerados": [49, 50, ...],   // de 41-72 que já encerraram
  "por_ia": {
    "claude-opus-4-7": { "pts_v1": 34, "pts_v2": 41, "delta": 7,
                          "exatos_v1": 2, "exatos_v2": 3 },
    ...
  },
  "agregado": { "delta_medio": 2.3, "ias_que_melhoraram": 18, "ias_que_pioraram": 9 }
}
```
Reusar `src/bolao/scoring.py` (`pontuar`). Considera só jogos 41–72 **encerrados**.

## 5. Pipeline (src/bolao)

- **Coleta v2** (reusar `coletor.py`): comando CLI dedicado, ex.
  `python -m bolao coletar-v2 [--tier N]`. Lê `openrouter_mapping.json`, prompt
  `ia-palpiteira-v2.md`, dossiê `data/dossie/v2-*.md`, **filtra jogos 41–72 abertos**,
  grava `data/palpites_v2/<slug>.md`. Respeita a trava de kickoff (não coletar jogo
  já iniciado).
- **Comparação:** `python -m bolao comparar-v2` → lê v1 (`data/palpites_ias/`), v2
  (`data/palpites_v2/`), resultados, calcula e grava `data/analise_v2.json`.
- **Isolamento absoluto:** nenhum comando v2 pode alterar `web/data/*.json`,
  `v4/public/*.json`, ranking, cristal ou qualquer saída do bolão. Sem efeitos
  colaterais no fluxo `rodada`.

## 6. Supabase upload

`scripts/upload_v2_supabase.py`: lê `data/palpites_v2/*.md` → `upsert` em
`palpite_v2` (chave `slug, jogo_numero`). Usa `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
de env. Idempotente.

## 7. Frontend (v4)

- **Cadeado público** nos cards dos jogos **41–72** (não nos já encerrados nem no
  mata-mata): selo "🔒 Palpite atualizado disponível" + CTA (contribuir via Pix com
  e-mail no comentário; seguir @arena.das.ias pra receber a senha). Não expõe palpite.
- **Página `/analise`**: server-side. Form de senha → valida contra `ANALISE_SENHA`
  (env var na Vercel) → seta cookie httpOnly → só então busca `palpite_v2` via
  service_role e renderiza (comparação v1×v2 + os palpites v2 por jogo). **O JSON v2
  nunca chega ao browser sem a senha** (nada de fetch client-side a dado v2).
- **Não quebrar** nada existente. Cadeado é aditivo. `/analise` é rota nova.
- Link pra `/analise` no menu **só** depois da fase de grupos (decisão 6) — por ora,
  acesso direto pela URL.

## 8. Coleta manual das IAs web (Série A)

Operador (Giordano) roda manualmente as 12 da Série A via interface, usando
`ia-palpiteira-v2-web.md`, e cola o resultado em `data/palpites_v2/<slug>-web.md`
(ou `<slug>.md`, `modo: web`). Guia de acesso (links + opções a ativar por IA) em
`docs/` (docs-writer). Modelos web têm busca nativa → o prompt web pode pedir que
ela mesma levante a info recente, mas deve **fixar os resultados dos jogos 1–40**
fornecidos no prompt pra não alucinar placares passados.

## 9. Divisão de agentes

| Agente | Entrega | Não faz |
|---|---|---|
| general-purpose | dossiê v2 (`data/dossie/v2-2026-06-22.md`) | código |
| llm-prompt | `ia-palpiteira-v2.md` + `-v2-web.md` | pipeline |
| pipeline-dev | `coletar-v2`, `comparar-v2`, gitignore | UI, infra |
| dba | migration `palpite_v2` + `upload_v2_supabase.py` | UI |
| frontend-dev | cadeado + `/analise` gated | scoring |
| qa-tester | testes comparação + isolamento + gate | — |
| docs-writer | guia IAs web + texto contribuinte | — |

**Regra para todos os agentes:** **NÃO commitar** (o arquiteto integra e commita).
**NÃO tocar** em v1, scoring/ranking oficiais ou JSONs públicos do bolão. Reportar
arquivos criados/alterados.

## 10. Aberto / fase 2

- Métrica e visual final da comparação na `/analise` — refinar quando jogos 41–72
  começarem a encerrar.
- Rotação de senha / múltiplas senhas por lote de contribuintes (por ora, uma só).
