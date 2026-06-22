# Guia de Coleta Manual das IAs Web — Palpites v2

> **Para:** Operador (Giordano)
> **Objetivo:** Rodar manualmente as 12 IAs da Série A via interface web, ativar modos especiais, colar o prompt, e salvar os palpites.
> **Data:** 2026-06-22

## Passo a passo geral

1. Para cada IA abaixo, abra o link da interface em seu navegador.
2. **Ative os modos especiais** listados na coluna "Ativar" (Deep Research, Extended Thinking, etc.).
3. Copie o prompt completo de `config/prompts/ia-palpiteira-v2-web.md` (tudo após a linha tracejada).
4. Cole na caixa de entrada da IA.
5. Aguarde a resposta (algumas levam 2-5 minutos com modos avançados).
6. Copie a tabela markdown da resposta (incluindo o comentário HTML `<!-- ia: ... -->`).
7. Salve em `data/palpites_v2/<slug>.md` (use o slug da tabela abaixo).
8. Pronto — a comparação v1×v2 lerá de lá.

**Nota:** O prompt contém os resultados dos jogos 1–40 como fatos fixos. A IA usará busca web para informação nova (lesões, classificação atualizada, odds). Não preencha dados manualmente — deixe a IA fazer o trabalho.

---

## 12 IAs da Série A — Links, modos e slugs

### 1. ChatGPT 5 Thinking

| Campo | Valor |
|---|---|
| **Link** | https://chatgpt.com |
| **Seletor** | GPT-5 Thinking (ou "5 Pro Thinking") |
| **Ativar** | Deep Research + Search ativado |
| **Slug** | `chatgpt-5-thinking-web` |
| **Tempo esperado** | 3-5 min |
| **Nota** | "Deep Research" pode aparecer como botão separado; certifique-se que está ON. Se não houver Thinking, selecione "GPT-5 Pro" e ative "Deep Research". |

### 2. Claude Opus 4.8

| Campo | Valor |
|---|---|
| **Link** | https://claude.ai |
| **Seletor** | Claude 3.5 Sonnet (confirmar: Opus 4.8 pode estar em beta/limited) |
| **Ativar** | Extended Thinking + Web Search (ambos ON) |
| **Slug** | `claude-opus-4-8-web` |
| **Tempo esperado** | 2-4 min |
| **Nota** | Se Opus 4.8 não aparecer no seletor, use a versão mais recente disponível e anote a versão real no comentário HTML da resposta. |

### 3. Gemini 2.5 Pro

| Campo | Valor |
|---|---|
| **Link** | https://gemini.google.com |
| **Seletor** | Gemini 2.5 Pro |
| **Ativar** | Deep Research ativado |
| **Slug** | `gemini-2-5-pro-web` |
| **Tempo esperado** | 2-4 min |
| **Nota** | Deep Research aparece como toggle/botão na interface. Certifique-se que está ON antes de colar o prompt. |

### 4. Grok 4 Heavy

| Campo | Valor |
|---|---|
| **Link** | https://grok.com |
| **Modelo/opção** | Grok 4 Heavy (exige SuperGrok subscription, confirmar disponibilidade) |
| **Ativar** | DeepSearch + Think Mode |
| **Slug** | `grok-4-heavy-web` |
| **Tempo esperado** | 2-3 min |
| **Nota** | **(confirmar)** Grok 4 Heavy pode estar limitado a SuperGrok. Se não disponível, tentar Grok 3 ou inferior e anotar na resposta. |

### 5. DeepSeek R1

| Campo | Valor |
|---|---|
| **Link** | https://chat.deepseek.com |
| **Seletor** | DeepSeek R1 (ou "R1" na lista de modelos) |
| **Ativar** | DeepThink (R1) + Search |
| **Slug** | `deepseek-r1-web` |
| **Tempo esperado** | 3-5 min (R1 pensa extensamente) |
| **Nota** | DeepThink pode aparecer como toggle; Search como botão separado. Ative ambos. |

### 6. Copilot (Microsoft)

| Campo | Valor |
|---|---|
| **Link** | https://copilot.microsoft.com |
| **Seletor** | Padrão (Copilot usa GPT-4o ou similar) |
| **Ativar** | "Think Deeper" (ou "Thinking mode") |
| **Slug** | `copilot-microsoft-web` |
| **Tempo esperado** | 2-3 min |
| **Nota** | "Think Deeper" é toggle na interface. Busca web é automática. |

### 7. Perplexity Sonar Pro

| Campo | Valor |
|---|---|
| **Link** | https://perplexity.ai |
| **Seletor** | Pro (Sonar Pro) ou Deep Research |
| **Ativar** | Pro Search ou Deep Research (ambos oferecem pesquisa) |
| **Slug** | `perplexity-sonar-pro-web` |
| **Tempo esperado** | 2-3 min |
| **Nota** | Perplexity já inclui busca web por padrão em modo Pro. Se tiver opção de "Focus", deixe em "General". |

### 8. Meta Llama 4

| Campo | Valor |
|---|---|
| **Link** | https://meta.ai (acesso: EUA ou VPN) |
| **Modelo** | Llama 4 ou superior |
| **Ativar** | Nenhum modo especial (confirmar se há "thinking" nativo) |
| **Slug** | `meta-llama-4-web` |
| **Tempo esperado** | 2-3 min |
| **Nota** | **(confirmar)** Meta AI pode estar limitado a EUA. Se inacessível, usar VPN. Llama 4 pode não ter modos avançados nativos. |

### 9. Le Chat (Mistral)

| Campo | Valor |
|---|---|
| **Link** | https://chat.mistral.ai |
| **Seletor** | Mistral Large ou premium |
| **Ativar** | Think (Thinking) + Web Search |
| **Slug** | `le-chat-mistral-web` |
| **Tempo esperado** | 2-3 min |
| **Nota** | Ative "Think" se disponível (pode estar em beta). Web Search é toggle separado. |

### 10. Qwen 3 Max

| Campo | Valor |
|---|---|
| **Link** | https://chat.qwen.ai |
| **Seletor** | Qwen3-Max ou Qwen 3 |
| **Ativar** | Thinking + Search (ambos ON) |
| **Slug** | `qwen-3-max-web` |
| **Tempo esperado** | 2-3 min |
| **Nota** | Qwen 3 Max é versão premium. Ative Thinking e Search via toggles na interface. |

### 11. Manus

| Campo | Valor |
|---|---|
| **Link** | https://manus.im |
| **Modelo** | Padrão (confirmar capacidade de research) |
| **Ativar** | Nenhum modo especial (confirmar interface) |
| **Slug** | `manus-web` |
| **Tempo esperado** | 2-3 min |
| **Nota** | **(confirmar)** Manus é plataforma mais nova. Verificar se permite coleta via chat padrão ou se exige "task" específica. Tentar criar uma task se necessário. |

### 12. Anthropic Fable (Claude Fable 5)

| Campo | Valor |
|---|---|
| **Link** | (confirmar: pode estar em beta, acesso limitado) |
| **Modelo/opção** | Claude Fable 5 ou versão mais recente (confirmar) |
| **Ativar** | (confirmar) Extended Thinking se disponível |
| **Slug** | `claude-fable-5` ou `anthropic-fable-web` |
| **Tempo esperado** | 2-4 min |
| **Nota** | **(confirmar)** Fable pode estar em Early Access. Se inacessível, pular ou questionar Giordano sobre alternativa. |

---

## Checklist antes de colar o prompt

- [ ] Interface da IA aberta no navegador
- [ ] Seletor de modelo/versão correto
- [ ] Modos especiais (Deep Research, Thinking, Search, etc.) ativados (ON/verde)
- [ ] Prompt copiado de `config/prompts/ia-palpiteira-v2-web.md` (completo, após a linha tracejada)

## Checklist após receber a resposta

- [ ] Resposta contém o comentário HTML `<!-- ia: ...; versao: v2; ... -->`
- [ ] Resposta contém a tabela com 32 linhas (jogos 41–72)
- [ ] Todos os campos Gols A e Gols B preenchidos com inteiros ≥ 0
- [ ] Nenhum comentário extra acima ou abaixo da tabela
- [ ] Copiar EXATAMENTE (comentário + tabela, nada mais)
- [ ] Salvar em `data/palpites_v2/<slug>.md` (ver slug na tabela acima)

## Salvando o arquivo

```bash
# Exemplo: após rodar Claude Opus 4.8, salvar em:
# data/palpites_v2/claude-opus-4-8-web.md

# O arquivo deve conter:
# 1. Comentário HTML (1 linha): <!-- ia: Claude Opus 4.8; data: 2026-06-22; versao: v2; modo: Extended Thinking + Web Search -->
# 2. Tabela markdown (32 linhas + header)
# Nada de mais.
```

## Próximos passos após coleta completa

Quando todas as 12 IAs forem coletadas:

```bash
# Sincronizar para Supabase (server-side upload):
python scripts/upload_v2_supabase.py

# Gerar análise v1 × v2 (comparação em data/analise_v2.json):
python -m bolao comparar-v2

# O commit vem depois (arquiteto cuida disso).
```

---

## Troubleshooting

| Problema | Solução |
|---|---|
| IA não responde em 10 min | Limpar cache/cookies do navegador, recarregar, tentar novamente. Se persistir, usar versão anterior ou anotar no comentário HTML. |
| Modo especial não aparece | Pode estar em beta/paywall. Usar modo padrão e anotar em modo no comentário HTML. |
| Não consegue ativar Web Search | Alguns modelos não têm busca nativa. Seguir em frente; a IA palpitará com conhecimento de treino. |
| Resposta contém texto extra | Copiar APENAS o comentário HTML + tabela. Deletar restos de conversa antes de salvar. |
| Link inacessível (Meta AI, etc.) | Usar VPN (se regional) ou questionar Giordano sobre alternativa. Anotar o problema. |

---

**Data de criação:** 2026-06-22
**Versão:** 1.0
