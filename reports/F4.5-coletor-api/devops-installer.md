# F4.5 — devops-installer

**Status**: idle.
**Data**: 2026-06-05.

## Entregáveis

| # | Item                                  | Arquivo                                    |
|---|---------------------------------------|--------------------------------------------|
| 1 | Template de env                       | `config/.env.example`                      |
| 2 | Proteção `config/.env` no `.gitignore`| `.gitignore`                               |
| 3 | Deps `httpx`, `python-dotenv`         | `pyproject.toml`                           |
| 4 | Target `coletar` no script de dev     | `scripts/dev.sh`                           |
| 5 | Warn de `OPENROUTER_API_KEY` no diag  | `scripts/check_env.sh`                     |
| 6 | Guia OpenRouter + custo estimado      | este arquivo                               |

## 1. `config/.env.example`

Template com `OPENROUTER_API_KEY`, `OPENROUTER_REFERER` (opcional), `OPENROUTER_APP_NAME` (opcional). Comentários inline explicam onde gerar a key e quais vars do coletor são parametrizáveis (`OPENROUTER_MAX_PARALELO`, `OPENROUTER_TIMEOUT` — comentadas até pipeline-dev decidir nomes).

Operador copia: `cp config/.env.example config/.env` e edita.

## 2. `.gitignore`

Antes só tinha `.env`, `.env.local`, `.env.*.local` no root. Gitignore patterns sem `/` matcham em qualquer subdir, então `config/.env` já estaria coberto — mas adicionei explicitamente os 3 caminhos `config/.env*` e a exceção `!config/.env.example` pra (a) deixar a intenção clara, (b) garantir que mudanças futuras no padrão raiz não vazem credenciais.

## 3. `pyproject.toml`

Adicionado em `[project] dependencies`:

```toml
"httpx>=0.27",
"python-dotenv>=1",
```

Justificativa:
- `httpx` é o cliente HTTP async pedido pelo pipeline-dev pra `coletar_lote`. >=0.27 cobre suporte estável a `AsyncClient`.
- `python-dotenv` lê `config/.env` no startup do coletor. Alternativa stdlib (parse manual) é factível mas dotenv é 1 dep madura e amplamente usada — vale o trade.

Versões instaladas no .venv local: `httpx 0.28.1`, `python-dotenv 1.2.2`.

## 4. `scripts/dev.sh` — target `coletar`

Novo target:

```
bash scripts/dev.sh coletar --tier 1 --dry-run
bash scripts/dev.sh coletar --ia chatgpt-5
```

Comportamento:
1. `shift` pra repassar argumentos extras pro `python -m bolao coletar`.
2. Se `OPENROUTER_API_KEY` não estiver no env e existir `config/.env`, faz `set -a; source config/.env; set +a` automaticamente.
3. Se ainda assim a key estiver vazia E não for `--dry-run`, imprime aviso com instrução clara.
4. Executa `python -m bolao coletar "$@"`.

Help do `dev.sh` atualizado pra mencionar exemplos.

## 5. `scripts/check_env.sh` — checagem de `OPENROUTER_API_KEY`

Adicionada checagem **opcional** (WARN, não FAIL — afinal a key só é necessária pra `coletar`):

- Lê `OPENROUTER_API_KEY` do env primeiro; se vazia, espia `config/.env` (sem exportar globalmente — apenas parse).
- Se presente e diferente do placeholder `sk-or-v1-REPLACE_ME` → `OK` com prefixo mascarado (mostra só primeiros 10 chars + comprimento).
- Se vazia ou placeholder → `WARN` com instrução pra copiar de `.env.example`.

Mascaramento é deliberado: nunca printar a key inteira em log.

Validação:

```
WARN  OPENROUTER_API_KEY ausente — copie config/.env.example -> config/.env e
      preencha. Necessário só pra 'bolao coletar' via API.
ambiente OK (8 checks passaram, 2 avisos)
```

## 6. Guia OpenRouter

### 6.1. Por que OpenRouter (vs API direta de cada provider)?

- **Uma key, 315+ modelos**: Anthropic, OpenAI, Google, DeepSeek, xAI, Meta, Mistral, Qwen, etc. Eliminamos sign-up em N dashboards.
- **Modelo unificado** (chat completions tipo OpenAI), uma URL: `https://openrouter.ai/api/v1/chat/completions`.
- **Sem mensalidade**: pay-per-token, créditos pré-pagos não expiram.
- **Modelos grátis** disponíveis (DeepSeek V3/R1, Llama, Qwen) — útil pra dry-run real ou Tier 4-8.

### 6.2. Criar conta e gerar API key

1. Criar conta em https://openrouter.ai/ — login OAuth (Google/GitHub) ou email.
2. Acessar https://openrouter.ai/keys → **Create Key**.
3. Dar um nome (ex: `bolao-copa-2026`), opcionalmente limitar gasto da key.
4. Copiar a key (formato `sk-or-v1-...`) — só é exibida uma vez.
5. Colar em `config/.env`:

   ```
   OPENROUTER_API_KEY=sk-or-v1-...
   ```

6. **Não commitar** — `.gitignore` já protege, mas conferir com `git status` antes do commit.

### 6.3. Adicionar crédito

1. Em https://openrouter.ai/credits → **Add Credits**.
2. Mínimo por transação: **$5** (limite do gateway).
3. Pagamento: cartão de crédito (5,5% fee) ou cripto (5,0% fee). Cripto via Coinbase Commerce.
4. **Saldo mínimo $0,80** por transação — abaixo disso o checkout não permite.
5. Crédito não expira; sobra fica pro próximo torneio.

### 6.4. Headers recomendados

OpenRouter usa 2 headers opcionais (não exigidos, mas melhoram analytics e priorizam suporte):

- `HTTP-Referer: <url-do-repo>` — atribui a chamada ao seu projeto no dashboard.
- `X-Title: <nome-app>` — nome legível.

Mapeados em `config/.env.example` como `OPENROUTER_REFERER` e `OPENROUTER_APP_NAME`. O pipeline-dev injeta nos requests.

### 6.5. Custo estimado pro Bolão

**Premissas**:
- 105 IAs no `openrouter_mapping.json` (esperado: ~80 cobertas; ~25 só web).
- Prompt + dossiê: ~5k tokens input.
- Resposta esperada: ~2k tokens output (tabela 72 jogos da fase de grupos).
- Ciclos: **2** (1× fase de grupos + 1× mata-mata pós-classificação, com prompt-mata-mata).

**Por IA** (assumindo mix realista — 80 cobertas):

| Tier (estimado)         | n IAs | $/M input | $/M output | Custo/IA/ciclo | Subtotal 2 ciclos |
|-------------------------|------:|----------:|-----------:|---------------:|------------------:|
| Premium (GPT-5, Opus)   |     8 |   $5,00   |   $25,00   |   $0,075       |   $1,20           |
| Mid (Sonnet, Gemini Pro)|    16 |   $3,00   |   $15,00   |   $0,045       |   $1,44           |
| Standard (Grok, etc.)   |    20 |   $1,25   |   $2,50    |   $0,0113      |   $0,45           |
| Light (DeepSeek, Qwen)  |    16 |   $0,44   |   $0,87    |   $0,0040      |   $0,13           |
| Open source / free      |    20 |   $0,00   |   $0,00    |   $0,00        |   $0,00           |
| **Total**               |  **80** |         |            |                |  **~$3,20**       |

Margem de segurança (retries por timeout, dossiês maiores que estimado, prompt-engineering iterativo durante a Copa): **3-5×**.

> **Recomendação prática: comprar $15-25 de crédito**.
>
> - **$5** dá pra rodar Tier 4-8 (light + free) e testes individuais.
> - **$15** cobre os 2 ciclos confortavelmente com margem.
> - **$25-30** cobre re-coleta inesperada se um prompt der defeito e tiver
>   que refazer tudo.

(Confere com a estimativa do spec: "105 × ~7k tokens × 2 ciclos = ~1.5M tokens → $15-30". Minha decomposição por tier chega no mesmo range pela rota oposta.)

### 6.6. Verificar uso durante a Copa

- Dashboard de gastos: https://openrouter.ai/activity
- Limite por key: configurar `Spending Limit` ao criar a key (recomendação: $30).
- Cada resposta vem com header `OpenAI-Usage` traduzido — pipeline-dev pode logar.

## Como validei

```
$ .venv/Scripts/python.exe -m pip install -e ".[dev]"
Successfully installed httpx-0.28.1 python-dotenv-1.2.2 ...

$ bash scripts/check_env.sh
  OK    pacote 'bolao' importável
  WARN  OPENROUTER_API_KEY ausente — copie config/.env.example -> config/.env...
ambiente OK (8 checks passaram, 2 avisos)

$ bash scripts/dev.sh help
... coletar     python -m bolao coletar (carrega config/.env, valida key) ...

$ pre-commit run --files pyproject.toml .pre-commit-config.yaml .gitignore \
                        config/.env.example scripts/dev.sh scripts/check_env.sh
... all hooks Passed.
```

## Comando exato pra reproduzir setup OpenRouter do zero

```bash
# 1. Conta + key + crédito (interativo no browser):
# https://openrouter.ai/  ->  https://openrouter.ai/keys  ->  https://openrouter.ai/credits

# 2. Local:
cp config/.env.example config/.env
$EDITOR config/.env                       # cole a key

# 3. Verifica:
bash scripts/check_env.sh                 # OK pra OPENROUTER_API_KEY

# 4. Dry-run (não chama API):
bash scripts/dev.sh coletar --tier 1 --dry-run

# 5. Coleta real (1 IA leve pra testar):
bash scripts/dev.sh coletar --ia gemma-3
ls -la data/palpites_ias/gemma-3.md
```

## Lições / memória

- OpenRouter cobra 5,5% de fee em cartão, 5% em cripto. Mín $5/transação, créditos não expiram.
- Pra Bolão da Copa 2026: orçamento real é **~$3-5** em uso normal; $15-25 dá margem confortável.
- `python-dotenv` é o caminho mais simples; alternativa stdlib não vale o ahorro.
- Em scripts shell que leem env files, NUNCA imprimir a key — sempre mascarar (prefixo + comprimento). Padrão adotado em `check_env.sh`.

## Dúvidas bloqueantes

Nenhuma. F4.5 do meu lado fechado.

## Fontes

- OpenRouter pricing & free tier: https://openrouter.ai/pricing
- Pricing breakdown by model: https://costgoat.com/pricing/openrouter
- Free models lista: https://openrouter.ai/openrouter/free
- API quickstart oficial: https://openrouter.ai/docs/quickstart
