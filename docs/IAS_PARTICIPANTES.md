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

---

## Tier 1 — Top de mercado, web search nativa (16)

Mais bem posicionadas pra desempenho competitivo. Acesso público gratuito ou
trivial via login.

| # | Slug | Nome display | Provedor | Onde palpitar | Notas |
|---:|---|---|---|---|---|
| 1 | `chatgpt-5` | ChatGPT 5 | OpenAI | chat.openai.com | Modo padrão com web search |
| 2 | `chatgpt-5-thinking` | ChatGPT 5 Thinking | OpenAI | chat.openai.com | Modo "Think" / "Deep Think" |
| 3 | `claude-opus-4-7` | Claude Opus 4.7 | Anthropic | claude.ai | 1M context, web search ativada |
| 4 | `claude-sonnet-4-6` | Claude Sonnet 4.6 | Anthropic | claude.ai | Custo intermediário, ótimo all-rounder |
| 5 | `claude-haiku-4-5` | Claude Haiku 4.5 | Anthropic | claude.ai | Modelo rápido — vai surpreender? |
| 6 | `gemini-2-5-pro` | Gemini 2.5 Pro | Google | gemini.google.com | Google Search nativo |
| 7 | `gemini-2-5-flash` | Gemini 2.5 Flash | Google | gemini.google.com | Mais barato |
| 8 | `grok-4` | Grok 4 | xAI | grok.com / X | Live X feed pra notícias recentes |
| 9 | `grok-4-heavy` | Grok 4 Heavy | xAI | grok.com (X Premium+) | Versão de raciocínio profundo |
| 10 | `deepseek-r1` | DeepSeek R1 | DeepSeek | chat.deepseek.com | Reasoner OSS |
| 11 | `deepseek-v3-1` | DeepSeek V3.1 | DeepSeek | chat.deepseek.com | Não-reasoner, mais rápido |
| 12 | `perplexity-sonar-pro` | Perplexity Sonar Pro | Perplexity | perplexity.ai | Especializado em busca |
| 13 | `copilot-microsoft` | Microsoft Copilot | Microsoft | copilot.microsoft.com | Baseado em GPT-5 + Bing |
| 14 | `le-chat-mistral` | Le Chat (Mistral Large) | Mistral | chat.mistral.ai | Web search nativa |
| 15 | `meta-llama-4` | Meta AI (Llama 4) | Meta | meta.ai | Search via Bing |
| 16 | `qwen-3-max` | Qwen 3 Max | Alibaba | chat.qwen.ai | Inglês OK, search via Quark |

## Tier 2 — Acesso via web sem grande fricção (9)

Geralmente sem web search nativa — risco de palpites baseados em dados de
treinamento (defasados). Inclusas pra ampliar a amostra.

| # | Slug | Nome display | Provedor | Onde palpitar |
|---:|---|---|---|---|
| 17 | `cohere-command-a` | Cohere Command A | Cohere | cohere.com/playground |
| 18 | `kimi-k2` | Kimi K2 | Moonshot AI | kimi.com |
| 19 | `glm-4-5` | GLM-4.5 | Zhipu AI | chatglm.cn (em inglês) |
| 20 | `phi-4` | Phi-4 | Microsoft | huggingface.co/chat |
| 21 | `gemma-3` | Gemma 3 | Google | Google AI Studio |
| 22 | `reka-core` | Reka Core | Reka | chat.reka.ai |
| 23 | `llama-3-3-70b` | Llama 3.3 70B | Meta (via 3rd) | groq.com / openrouter |
| 24 | `llama-3-1-405b` | Llama 3.1 405B | Meta (via 3rd) | openrouter |
| 25 | `yi-large` | Yi-Large | 01.AI | yi.01.ai |

## Tier 3 — Modelos chineses (podem exigir VPN / telefone chinês) (7)

Considerar opcionais. Se você não conseguir acesso, marca como `❌` e segue.

| # | Slug | Nome display | Provedor | Onde palpitar | Acesso |
|---:|---|---|---|---|---|
| 26 | `ernie-4-5` | Ernie 4.5 | Baidu | yiyan.baidu.com | telefone chinês |
| 27 | `doubao` | Doubao | ByteDance | doubao.com | login WeChat ou telefone CN |
| 28 | `hunyuan` | Hunyuan | Tencent | hunyuan.tencent.com | telefone CN |
| 29 | `sensechat` | SenseChat | SenseTime | chat.sensetime.com | telefone CN |
| 30 | `minimax-abab` | MiniMax abab | MiniMax | chat.minimax.io | mais aberto, internacional |
| 31 | `step-2` | Step 2 | StepFun | yuewen.cn | telefone CN |
| 32 | `baichuan-4` | Baichuan 4 | Baichuan AI | chat.baichuan-ai.com | telefone CN |

## Tier 4 — Históricas / comparativas (gerações anteriores) (7)

Pra estudar "evolução das IAs". A graça é ver quem ganha: a versão atual ou
a versão de 2024-2025?

| # | Slug | Nome display | Provedor | Onde palpitar |
|---:|---|---|---|---|
| 33 | `gpt-4o` | GPT-4o (legacy) | OpenAI | playground / API |
| 34 | `gpt-4-1` | GPT-4.1 (legacy) | OpenAI | playground / API |
| 35 | `o3` | OpenAI o3 (legacy) | OpenAI | playground / API |
| 36 | `claude-sonnet-3-7` | Claude Sonnet 3.7 (legacy) | Anthropic | console.anthropic.com |
| 37 | `gemini-2-0-pro` | Gemini 2.0 Pro (legacy) | Google | aistudio.google.com |
| 38 | `deepseek-v3` | DeepSeek V3 (legacy) | DeepSeek | chat.deepseek.com (model picker) |
| 39 | `grok-3` | Grok 3 (legacy) | xAI | grok.com (model picker) |

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

1. Antes do 1º jogo (até 10/06/2026 23h BRT):
   - Para cada IA, cole o prompt de `config/prompts/ia-palpiteira.md`.
   - Salve a resposta em `data/palpites_ias/<slug>.md` substituindo o
     placeholder. Cole **só** a tabela, sem markdown extra.
2. Após classificação dos 16 melhores (≈ 27/06/2026):
   - Cole o prompt de `config/prompts/ia-palpiteira-mata-mata.md` em cada IA.
   - Salve novamente em `data/palpites_ias/<slug>.md` (pode mesclar grupos +
     mata-mata num único arquivo, parser aceita múltiplas tabelas).

## Pra adicionar uma nova IA durante a Copa

```bash
bash scripts/bootstrap_palpites.sh add <slug> "Nome Display" "url"
# ou edite docs/IAS_PARTICIPANTES.md e crie data/palpites_ias/<slug>.md manualmente
```

Atenção à regra I4: palpite de jogos que já começaram não pontua (lock por
mtime). IA que entrar tarde só pontua nos jogos futuros.
