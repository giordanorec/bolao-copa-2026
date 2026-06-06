# F4.5 — Report do docs-writer

**Sprint**: F4.5-coletor-api-e-dossie
**Agente**: docs-writer
**Data**: 2026-06-05
**Status**: idle

## Arquivos alterados

| Arquivo | Ação | Notas |
|---|---|---|
| `docs/USO.md` | reescrita da §1 | Quebrada em §1.1 (Via web) e §1.2 (Via API OpenRouter, 5 sub-passos: setup, dossiê, dry-run, run, validar) |
| `docs/USO.md` | comandos rápidos | 3 linhas novas pro `coletar` na seção de referência |
| `docs/IAS_PARTICIPANTES.md` | coluna nova | "Cobertura API OpenRouter" nas 4 tabelas (Tier 1-4); legenda no topo; nota sobre 39 vs 105 |
| `docs/IAS_PARTICIPANTES.md` | workflow | Reescrito pra mencionar as duas vias paralelas |
| `README.md` | seção "Como funciona" | Duas vias paralelas (web manual + API OpenRouter), link pra IAS_PARTICIPANTES.md |

## Decisões tomadas

1. **Coluna "Cobertura API OpenRouter" usa 3 estados**: `✅` (mapping
   confirmado em `config/openrouter_mapping.json`), `⚠` (slug em
   IAS_PARTICIPANTES diverge do slug no mapping — ex: `gemma-3` vs
   `gemma-3-27b`/`gemma-3-12b`), `❌` (sem cobertura — wrapper UI,
   provedor regional sem OR). Ground truth canônico fica no JSON do
   pipeline-dev. Em caso de divergência, JSON ganha. Após pipeline-dev
   publicar o mapping em paralelo durante esta sprint, atualizei toda
   coluna com ids reais — sobrou só uma entrada `⚠` (`gemma-3`).

2. **Marquei `copilot-microsoft` como `❌`**. Microsoft Copilot é wrapper
   UI sobre GPT-5 + Bing, sem endpoint API próprio. Se quiserem GPT-5
   API-side, já existe via `chatgpt-5`. Para manter participação dele,
   tem que ser via web (que é o que a coluna "Onde palpitar" já diz).

3. **Tier 3 (chinesas) majoritariamente `❌`**. Baidu/ByteDance/Tencent/
   SenseTime/StepFun/Baichuan não estão no mapping (e o `_meta.nota`
   do JSON confirma "coletar via web"). Só `minimax-abab` ganhou ✅
   (`minimax/minimax-01`). Coleta das outras continua sendo via web
   (com a fricção de telefone CN).

4. **IAS_PARTICIPANTES.md está em 39 IAs, não 105**. O commit `0470aa9`
   expandiu placeholders + bootstrap script pra 105, mas a tabela
   canônica em `IAS_PARTICIPANTES.md` não foi atualizada. Adicionei
   nota explícita no topo apontando isso como pendência do Arquiteto.
   Optei por **não tentar reconstruir** os 66 placeholders aqui — é
   trabalho de curadoria editorial que extrapola docs-writer e exigiria
   parsing dos headers `<!-- ia: -->` dos 105 .md placeholder.

5. **README mantém estado expandido pós-F4** (FAQ, quickstart 5 passos,
   licença). O system reminder na sprint anterior sinalizou
   modificação por linter, não reversão — o conteúdo expandido sobreviveu.
   Confirmado via grep.

6. **Tom**: mantido pt-BR direto, sem emoji (a coluna usa `✅`/`❌` como
   marcadores de tabela, não emoji decorativo). Linhas ≤ 100 cols.

## Amostra do conteúdo

### docs/USO.md §1.2.4 (rodar pra valer)

```markdown
Remove o `--dry-run`:

    python -m bolao coletar --tier all

O coletor:
- Lê `config/openrouter_mapping.json` pra resolver slug → modelo.
- Chama cada IA em paralelo (max 5 simultâneas).
- Salva resposta em `data/palpites_ias/<slug>.md` com header
  `<!-- modo: api -->`, `<!-- modelo: <openrouter_id> -->`,
  `<!-- coletado_em: <ISO> -->`.
- Pula IAs que falharem (timeout, 4xx, parse) e continua.
- No fim, imprime relatório: quantas OK, quantas falharam, quais e por quê.

Esforço: 1 comando, ~5-15 min de execução pras 80+ IAs.
```

### docs/IAS_PARTICIPANTES.md Tier 1 (excerpt)

```markdown
| 1 | `chatgpt-5` | ChatGPT 5 | OpenAI | chat.openai.com | ✅ `openai/gpt-5` | ... |
| 9 | `grok-4-heavy` | Grok 4 Heavy | xAI | grok.com (X Premium+) | a confirmar | ... |
| 13 | `copilot-microsoft` | Microsoft Copilot | Microsoft | copilot.microsoft.com | ❌ | Wrapper UI sobre GPT-5 + Bing — sem API direta |
```

### README.md (excerpt)

```markdown
Coleta de palpites por **duas vias paralelas**:

- **Web manual** — Tier 1 (16 IAs top com web search nativa). Cola o
  prompt `config/prompts/ia-palpiteira-web.md` em cada chat...
- **API OpenRouter** — ~80 IAs em uma chamada:

      python -m bolao coletar --tier all --dry-run    # lista quem entra
      python -m bolao coletar --tier all              # coleta de fato

  Requer `OPENROUTER_API_KEY` em `config/.env`...
```

## Dependências externas não-bloqueantes

Os docs assumem entregas que ainda não existem (esperado — F4.5 está em
sprint paralelo):

| Doc menciona | Entregador | Status |
|---|---|---|
| `config/prompts/ia-palpiteira-web.md` | llm-prompt | a entregar |
| `config/prompts/ia-palpiteira.md` (com `{{DOSSIE}}`) | llm-prompt | a entregar |
| `config/.env.example` | devops-installer | a entregar |
| `config/openrouter_mapping.json` | pipeline-dev | ✅ entregue (consultado) |
| `src/bolao/coletor.py` | pipeline-dev | ✅ entregue (não inspecionei a fundo) |
| `python -m bolao coletar` subcomando | pipeline-dev | a confirmar wiring no `__main__.py` |
| `data/dossie/2026-06-grupos.md` | arquiteto (paralelo) | dir criado, conteúdo a entregar |

Se algum desses divergir do que documentei (nomes de arg, opções,
caminhos), reabrir docs/USO.md.

## Pendências

1. **`IAS_PARTICIPANTES.md` em 39 vs 105 IAs**. A tabela canônica não
   reflete a expansão de `0470aa9`. Sugestão pro Arquiteto: gerar tabela
   automaticamente parseando os 105 placeholders em `data/palpites_ias/`
   (header `<!-- ia: ... -->`, `<!-- tier: ... -->`, `<!-- url: ... -->`).
   Fora do escopo desta sprint.

2. **Coluna resolvida contra o mapping real**. Sobrou só `gemma-3`
   como `⚠` (slug do doc não bate exato com `gemma-3-27b` /
   `gemma-3-12b` no mapping). Decisão: ou renomear o slug aqui pra
   `gemma-3-27b` (alinha com mapping mas perde o "genérico"), ou
   pipeline-dev adicionar alias `gemma-3 → google/gemma-3-27b-it` no
   JSON. Não tomei a decisão; deixei marcado pra Arquiteto.

3. **Custo estimado** mencionei em USO.md como "~US$ 15-30 cobre 2
   ciclos das 105 IAs". Esse número veio do spec (devops-installer
   está validando). Quando o devops-installer publicar números reais,
   alinhar.

4. **`coletar --prompt mata-mata`** em IAS_PARTICIPANTES.md está
   marcado como "comportamento exato a confirmar com pipeline-dev".
   Spec não detalha como o coletor escolhe entre prompt grupos e
   mata-mata. Confirmar e ajustar quando pipeline-dev fechar o CLI.

5. **Diretório `data/dossie/`** mencionado mas não existe ainda no
   repo. Arquiteto está curando em paralelo. Se cair em path
   diferente, atualizar USO.md §1.2.2.

## Próximos passos sugeridos

- Após mapping real do pipeline-dev: passar `IAS_PARTICIPANTES.md` num
  ciclo de "validar coluna" e converter "a confirmar" pra ✅/❌.
- Após 1ª coleta API real: print do output de `coletar --tier all` no
  README ou em USO.md, pra alinhar expectativa de duração e formato de
  relatório.
- Consolidar tabela canônica de 105 IAs no `IAS_PARTICIPANTES.md`
  (escopo do Arquiteto, possivelmente delegado em sprint F5 ou F6).
