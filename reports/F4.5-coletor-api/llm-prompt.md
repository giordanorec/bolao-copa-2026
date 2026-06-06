# Report — F4.5 / llm-prompt

**Agente**: llm-prompt
**Sprint**: F4.5 Coletor API + Dossiê (05–08/06/2026)
**Status**: idle (entregáveis prontos)

## Entregáveis

1. `config/prompts/ia-palpiteira.md` — **atualizado** para versão API. Mudanças:
   - Header novo identifica como "versão API (OpenRouter), com dossiê".
   - Seção "O que você pode e deve fazer" reescrita: substitui autorização de "pesquisar na internet" por "use o dossiê como fonte primária de fatos + raciocínio próprio para estimar placares".
   - **Nova seção `## DOSSIÊ DE REFERÊNCIA`** no final (após o checklist) com placeholder `{{DOSSIE}}` que o coletor substitui em runtime.
   - Mantido idêntico: regras de pontuação (10/7/5/5/0 + 2× mata-mata), seção de estratégia, tabela dos 72 jogos, formato de resposta, assinatura HTML invisível.

2. `config/prompts/ia-palpiteira-web.md` — **novo arquivo**, versão para coleta manual via interface web. Cópia do prompt anterior à F4.5, com:
   - Header novo identifica como "versão WEB (search nativo)".
   - Mantém a seção "O que você pode e deve fazer" com autorização explícita de pesquisar na internet.
   - **Sem** seção de dossiê — IAs Tier 1 (ChatGPT 5, Claude Opus 4.7, Gemini 2.5 Pro, Grok 4, etc.) têm search nativo na interface web.
   - Regras, estratégia, tabela e formato de resposta idênticos à versão API.

## Diferença operacional entre as duas versões

| Aspecto | `ia-palpiteira.md` (API) | `ia-palpiteira-web.md` (manual) |
|---|---|---|
| Canal | API OpenRouter (script `coletar`) | Interface web da IA (chatgpt.com, claude.ai, etc.) |
| Fonte de fatos | Dossiê injetado em runtime (`{{DOSSIE}}`) | Web search nativo da IA |
| Slug do arquivo de saída | `<slug>.md` (ex.: `chatgpt-5.md`) | `<slug>-web.md` (ex.: `chatgpt-5-web.md`) |
| IAs alvo | Todas as 105 com mapping no `config/openrouter_mapping.json` | Apenas Tier 1 (16 top) |
| Risco de "memória de treino errada" | Mitigado pelo dossiê | Mitigado pela web search recente |
| Custo por palpite | ~ $0,02–$0,40 (depende do modelo) | $0 (manual; só tempo do operador) |

## Decisão sobre posição do `{{DOSSIE}}`

Coloquei a seção `## DOSSIÊ DE REFERÊNCIA` **depois do checklist**, no fim do arquivo. Razões:
- Recência atencional: a IA tem o dossiê fresco quando começa a produzir a tabela (efeito "needle at the end" — informação no fim do prompt longa tem peso maior na resposta).
- Substituição limpa pelo coletor: `prompt_template.replace("{{DOSSIE}}", dossie_md)` funciona, ou simples concatenação `prompt + dossie` também (basta apagar o placeholder do template e o coletor concatena).
- Não interrompe o fluxo lógico do prompt (regras → estratégia → como usar → formato → tabela → checklist → dossiê pra consultar).

## Decisão sobre conteúdo da seção "O que você pode e deve fazer"

Versão API teve essa seção **completamente reescrita** porque manter "você está autorizado a pesquisar na internet" seria mentir pra IA — chamadas via OpenRouter por padrão não têm tool de web search (alguns modelos específicos como `perplexity/sonar` têm; o mapping vai precisar tratar esses como exceção). A reescrita:

- Avisa explicitamente que NÃO tem internet.
- Aponta pro dossiê como fonte primária.
- Autoriza uso de "memória de treino" para **estratégia** (Poisson, Elo, value betting) — modelos teóricos não envelhecem.
- Proíbe uso de "memória de treino" para **fatos** (convocações, lesões) — esses envelhecem e variam por modelo, criando comparação injusta.

Essa separação **fato vs estratégia** é a chave da F4.5 — garante que a comparação entre as 105 IAs meça **qualidade de raciocínio**, não **freshness do treino**.

## Inconsistência detectada entre specs (não-bloqueante)

O spec do pipeline-dev diz que o coletor monta:
```python
messages = [{"role": "user", "content": f"{prompt}\n\n## DOSSIÊ DE REFERÊNCIA\n\n{dossie}"}]
```
Isso é **concatenação** — assume que o prompt NÃO tem a seção de dossiê.

O spec do llm-prompt (este) diz que o prompt tem seção `## DOSSIÊ DE REFERÊNCIA` com placeholder `{{DOSSIE}}`. Isso é **substituição** — assume que o coletor faz `.replace()`.

Se o pipeline-dev usar o código do spec dele tal-e-qual, o resultado seria:
```
... [prompt com placeholder {{DOSSIE}} literal] ...

## DOSSIÊ DE REFERÊNCIA

[dossiê real]
```
A seção `## DOSSIÊ DE REFERÊNCIA` apareceria **duas vezes** e o `{{DOSSIE}}` ficaria literal no prompt — bagunçaria a IA.

**Recomendação para o pipeline-dev**: usar `prompt.replace("{{DOSSIE}}", dossie)` em vez de concatenação. Assim respeita o template e fica idempotente. Vou flagar isso no thread de integração quando o pipeline-dev terminar.

Alternativa, se preferirem concatenação: removo a seção `## DOSSIÊ DE REFERÊNCIA` e o placeholder do template, e o coletor concatena. Decidir com Arquiteto + pipeline-dev.

## Sobre `tests/prompts/casos.jsonl`

Não alterei. O schema dos casos (jogo + palpite + resultado + pontos_esperados) é independente da existência/forma do dossiê — esses casos testam o **scoring**, não a coleta. Continua válido pra LLM-júri futuro.

## Pendências e dúvidas

1. **Coletor: substituição ou concatenação?** Ver inconsistência acima. Bloqueia integração quando pipeline-dev fechar o coletor.
2. **Tamanho do dossiê**: precisa ficar abaixo do context window dos modelos Tier 8 (os mais light, alguns com 8k-32k tokens). Sugestão pro Arquiteto curar o dossiê em ≤ 6k tokens (≈ 24kB) — deixa folga pro prompt (~ 4k tokens) + resposta (~ 2k tokens). Total ≈ 12k tokens, cabe em qualquer modelo via OpenRouter.
3. **Modelos com web search nativo via API** (ex.: `perplexity/sonar-pro`, `perplexity/sonar`): para esses, faz sentido enviar a **versão web** (sem dossiê) via API. Pipeline-dev pode adicionar campo `usa_dossie: bool` no mapping. Decisão fora do meu escopo, mas registrado.

## Próximos passos (fora da F4.5)

- Após primeira coleta real (10/06/2026), revisar amostra de 5 respostas de cada via (web vs API) e medir: (a) aderência ao formato, (b) taxa de invenção factual (referência a jogadores convocados fora do dossiê), (c) variância de palpites entre web e API da mesma IA Tier 1 — comparação intra-modelo testa se o dossiê neutralizou o sinal de search.
