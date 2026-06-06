# IAs Participantes — Bolão da Copa 2026

Lista mestre das IAs cadastradas no bolão. Cada uma tem arquivo `.md`
correspondente em `data/palpites_ias/<slug>.md`.

**Padrão do slug**: kebab-case minúsculo. O slug é a identidade da IA no
sistema — não pode mudar depois que palpites começam a ser registrados.

**Status de cada IA**:
- ⏳ aguardando palpite — placeholder vazio em `data/palpites_ias/`.
- ✅ palpitou fase grupos — tabela preenchida.
- ✅✅ palpitou grupos + mata-mata.
- ❌ recusou / não acessível — arquivo removido ou marcado.

**Cobertura API OpenRouter** (coluna nova, decisão F4.5):
- `✅` — IA tem mapping confirmado em `config/openrouter_mapping.json`,
  coletável via `python -m bolao coletar --ia <slug>`.
- `⚠` — slug em `IAS_PARTICIPANTES.md` não bate exato com o mapping (ex:
  `gemma-3` aparece como `gemma-3-27b` / `gemma-3-12b` no JSON). Pra
  coletar, usar o slug do mapping.
- `❌` — sem cobertura via OpenRouter (provedor não distribui via OR ou
  modelo só existe como wrapper UI). Coleta só via web.

Fonte canônica do mapping é `config/openrouter_mapping.json` (mantido
pelo pipeline-dev). Esta tabela é informativa — se divergir do JSON,
o JSON ganha.

> **Nota sobre tamanho da lista**: este documento cobre as **39 IAs
> originais** em 4 tiers. Em 2026-06-05 (commit `0470aa9`), o operador
> expandiu o conjunto pra **105 IAs em 8 tiers**, mas a fonte mestre
> dessa expansão vive em `scripts/bootstrap_palpites.sh` e nos
> placeholders de `data/palpites_ias/`. A consolidação desta tabela
> com as 66 IAs novas é trabalho pendente do Arquiteto. Pra coleta
> via API, o ground truth é o `openrouter_mapping.json`.

---

## Tier 1 — Top de mercado, web search nativa (16)

Mais bem posicionadas pra desempenho competitivo. Acesso público gratuito ou
trivial via login.

| # | Slug | Nome display | Provedor | Onde palpitar | Cobertura API OpenRouter | Notas |
|---:|---|---|---|---|---|---|
| 1 | `chatgpt-5` | ChatGPT 5 | OpenAI | chat.openai.com | ✅ `openai/gpt-5` | Modo padrão com web search |
| 2 | `chatgpt-5-thinking` | ChatGPT 5 Thinking | OpenAI | chat.openai.com | ✅ `openai/gpt-5-thinking` | Modo "Think" / "Deep Think" |
| 3 | `claude-opus-4-7` | Claude Opus 4.7 | Anthropic | claude.ai | ✅ `anthropic/claude-opus-4.7` | 1M context, web search ativada |
| 4 | `claude-sonnet-4-6` | Claude Sonnet 4.6 | Anthropic | claude.ai | ✅ `anthropic/claude-sonnet-4.6` | Custo intermediário, ótimo all-rounder |
| 5 | `claude-haiku-4-5` | Claude Haiku 4.5 | Anthropic | claude.ai | ✅ `anthropic/claude-haiku-4.5` | Modelo rápido — vai surpreender? |
| 6 | `gemini-2-5-pro` | Gemini 2.5 Pro | Google | gemini.google.com | ✅ `google/gemini-2.5-pro` | Google Search nativo |
| 7 | `gemini-2-5-flash` | Gemini 2.5 Flash | Google | gemini.google.com | ✅ `google/gemini-2.5-flash` | Mais barato |
| 8 | `grok-4` | Grok 4 | xAI | grok.com / X | ✅ `x-ai/grok-4` | Live X feed pra notícias recentes |
| 9 | `grok-4-heavy` | Grok 4 Heavy | xAI | grok.com (X Premium+) | ✅ `x-ai/grok-4-heavy` | Versão de raciocínio profundo |
| 10 | `deepseek-r1` | DeepSeek R1 | DeepSeek | chat.deepseek.com | ✅ `deepseek/deepseek-r1` | Reasoner OSS |
| 11 | `deepseek-v3-1` | DeepSeek V3.1 | DeepSeek | chat.deepseek.com | ✅ `deepseek/deepseek-chat-v3.1` | Não-reasoner, mais rápido |
| 12 | `perplexity-sonar-pro` | Perplexity Sonar Pro | Perplexity | perplexity.ai | ✅ `perplexity/sonar-pro` | Especializado em busca |
| 13 | `copilot-microsoft` | Microsoft Copilot | Microsoft | copilot.microsoft.com | ❌ | Wrapper UI sobre GPT-5 + Bing — sem API direta |
| 14 | `le-chat-mistral` | Le Chat (Mistral Large) | Mistral | chat.mistral.ai | ✅ `mistralai/mistral-large-latest` | Web search nativa |
| 15 | `meta-llama-4` | Meta AI (Llama 4) | Meta | meta.ai | ✅ `meta-llama/llama-4` | Search via Bing |
| 16 | `qwen-3-max` | Qwen 3 Max | Alibaba | chat.qwen.ai | ✅ `qwen/qwen3-max` | Inglês OK, search via Quark |

## Tier 2 — Acesso via web sem grande fricção (9)

Geralmente sem web search nativa — risco de palpites baseados em dados de
treinamento (defasados). Inclusas pra ampliar a amostra.

| # | Slug | Nome display | Provedor | Onde palpitar | Cobertura API OpenRouter |
|---:|---|---|---|---|---|
| 17 | `cohere-command-a` | Cohere Command A | Cohere | cohere.com/playground | ✅ `cohere/command-a` |
| 18 | `kimi-k2` | Kimi K2 | Moonshot AI | kimi.com | ✅ `moonshotai/kimi-k2` |
| 19 | `glm-4-5` | GLM-4.5 | Zhipu AI | chatglm.cn (em inglês) | ✅ `z-ai/glm-4.5` |
| 20 | `phi-4` | Phi-4 | Microsoft | huggingface.co/chat | ✅ `microsoft/phi-4` |
| 21 | `gemma-3` | Gemma 3 | Google | Google AI Studio | ⚠ slug `gemma-3-27b` / `gemma-3-12b` no mapping |
| 22 | `reka-core` | Reka Core | Reka | chat.reka.ai | ✅ `rekaai/reka-core` |
| 23 | `llama-3-3-70b` | Llama 3.3 70B | Meta (via 3rd) | groq.com / openrouter | ✅ `meta-llama/llama-3.3-70b-instruct` |
| 24 | `llama-3-1-405b` | Llama 3.1 405B | Meta (via 3rd) | openrouter | ✅ `meta-llama/llama-3.1-405b-instruct` |
| 25 | `yi-large` | Yi-Large | 01.AI | yi.01.ai | ✅ `01-ai/yi-large` |

## Tier 3 — Modelos chineses (podem exigir VPN / telefone chinês) (7)

Considerar opcionais. Se você não conseguir acesso, marca como `❌` e segue.

| # | Slug | Nome display | Provedor | Onde palpitar | Acesso | Cobertura API OpenRouter |
|---:|---|---|---|---|---|---|
| 26 | `ernie-4-5` | Ernie 4.5 | Baidu | yiyan.baidu.com | telefone chinês | ❌ |
| 27 | `doubao` | Doubao | ByteDance | doubao.com | login WeChat ou telefone CN | ❌ |
| 28 | `hunyuan` | Hunyuan | Tencent | hunyuan.tencent.com | telefone CN | ❌ |
| 29 | `sensechat` | SenseChat | SenseTime | chat.sensetime.com | telefone CN | ❌ |
| 30 | `minimax-abab` | MiniMax abab | MiniMax | chat.minimax.io | mais aberto, internacional | ✅ `minimax/minimax-01` |
| 31 | `step-2` | Step 2 | StepFun | yuewen.cn | telefone CN | ❌ |
| 32 | `baichuan-4` | Baichuan 4 | Baichuan AI | chat.baichuan-ai.com | telefone CN | ❌ |

## Tier 4 — Históricas / comparativas (gerações anteriores) (7)

Pra estudar "evolução das IAs". A graça é ver quem ganha: a versão atual ou
a versão de 2024-2025?

| # | Slug | Nome display | Provedor | Onde palpitar | Cobertura API OpenRouter |
|---:|---|---|---|---|---|
| 33 | `gpt-4o` | GPT-4o (legacy) | OpenAI | playground / API | ✅ `openai/gpt-4o` |
| 34 | `gpt-4-1` | GPT-4.1 (legacy) | OpenAI | playground / API | ✅ `openai/gpt-4.1` |
| 35 | `o3` | OpenAI o3 (legacy) | OpenAI | playground / API | ✅ `openai/o3` |
| 36 | `claude-sonnet-3-7` | Claude Sonnet 3.7 (legacy) | Anthropic | console.anthropic.com | ✅ `anthropic/claude-3.7-sonnet` |
| 37 | `gemini-2-0-pro` | Gemini 2.0 Pro (legacy) | Google | aistudio.google.com | ✅ `google/gemini-2.0-pro` |
| 38 | `deepseek-v3` | DeepSeek V3 (legacy) | DeepSeek | chat.deepseek.com (model picker) | ✅ `deepseek/deepseek-chat` |
| 39 | `grok-3` | Grok 3 (legacy) | xAI | grok.com (model picker) | ✅ `x-ai/grok-3` |

---

## Resumo

**Total**: 39 IAs em 4 tiers.

| Tier | Qtd | Esforço por ciclo |
|---|---:|---|
| 1 (top) | 16 | ~10min cada → ~3h |
| 2 (extensão) | 9 | ~7min cada → ~1h |
| 3 (chinesas) | 7 | ~15min cada (auth complicado) → ~2h |
| 4 (legacy) | 7 | ~5min cada (API) → ~35min |
| **Total** | **39** | **~7h por ciclo** |

2 ciclos previstos (fase de grupos + mata-mata) → ~14h de coleta total.

## Workflow operacional

Duas vias paralelas (detalhes em `docs/USO.md` §1):

1. **Via web (manual)** — Tier 1 com sufixo `-web`:
   - Para cada IA do Tier 1, cole `config/prompts/ia-palpiteira-web.md`.
   - Salve a resposta em `data/palpites_ias/<slug>-web.md`.
2. **Via API OpenRouter** — todas com cobertura ✅ ou a confirmar:
   - Rode `python -m bolao coletar --tier all --dry-run` pra ver
     quem entra.
   - Sem `--dry-run`, o coletor salva direto em
     `data/palpites_ias/<slug>.md` com headers de auditoria
     (`<!-- modo: api -->`, `<!-- modelo: ... -->`, `<!-- coletado_em: ... -->`).

Mata-mata (≈ 27/06/2026):
   - Cole `config/prompts/ia-palpiteira-mata-mata.md` (variante web) ou
     rode `python -m bolao coletar --tier all --prompt mata-mata`
     (variante API, comportamento exato a confirmar com pipeline-dev).
   - Parser aceita múltiplas tabelas no mesmo arquivo.

## Pra adicionar uma nova IA durante a Copa

```bash
bash scripts/bootstrap_palpites.sh add <slug> "Nome Display" "url"
# ou edite docs/IAS_PARTICIPANTES.md e crie data/palpites_ias/<slug>.md manualmente
```

Atenção à regra I4: palpite de jogos que já começaram não pontua (lock por
mtime). IA que entrar tarde só pontua nos jogos futuros.
