# pipeline-dev — F4.5 Coletor OpenRouter + Dossiê

**Status**: idle, entregue.
**Data**: 2026-06-05.
**Commits**: `[F4.5-pipeline-dev]` em `main`.

## O que foi implementado

| Arquivo | Conteúdo | Commit |
|---|---|---|
| `src/bolao/coletor.py` | `coletar_via_openrouter`, `coletar_lote`, `salvar_palpite`, retry/backoff, semáforo paralelo | `48d63fc` |
| `config/openrouter_mapping.json` | 89 IAs com `{model, tier}` cobrindo T1-T8 | `97bd755` |
| `src/bolao/__main__.py` | subcomando `coletar` com `--tier/--ia/--dossie/--dry-run/--apply/--max-paralelo` | `cecfe60` |

## Dependências adicionadas

`httpx>=0.27` — já está em `pyproject.toml` (devops-installer adicionou em F4.5).
Sem dep nova minha.

`# type: ignore[import-not-found]` na linha do import por causa do mypy
isolado do pre-commit não enxergar httpx no env do hook. Solução localizada,
não polui `pyproject.toml`.

## Cobertura do mapping (89 IAs / 105)

| Tier | Cobertas | Total | Faltam (sem rota confiável no OpenRouter) |
|---|---:|---:|---|
| 1 | 15 | 16 | `copilot-microsoft` (Bing-only, não exposto) |
| 2 | 15 | 16 | `claude-opus-4-5` (não existe versão "opus 4.5" no provedor) |
| 3 | 18 | 20 | `nemotron-340b`, `snowflake-arctic` (cobertura intermitente) |
| 4 | 3 | 10 | `ernie/doubao/hunyuan/sensechat/step-2/baichuan-4/spark-4-ultra` (provedores CN) |
| 5 | 15 | 15 | — |
| 6 | 7 | 8 | `molmo-72b` (existe em outras vias, OR é instável) |
| 7 | 10 | 12 | `falcon-3-10b`, `falcon-180b` (off OpenRouter) |
| 8 | 6 | 8 | `inflection-pi`, `stablelm-2-12b` |
| **Total** | **89** | **105** | **16** |

Acima do target ≥70 e na faixa esperada de ~80.

## Decisões de design não-óbvias

1. **JSON do mapping tem `{model, tier}` em vez do `{slug: model_id}` puro
   do spec**. Motivo: `--tier 3` precisa filtrar sem ler 105 placeholders em
   `data/palpites_ias/`. Adicionar `tier` no próprio JSON é fonte única e
   2 linhas de código vs. 30 com IO de markdown.
2. **`coletar_via_openrouter` recebe `client: httpx.AsyncClient` extra**
   (não está na assinatura do spec). Sem isso, cada chamada abriria/fecharia
   um TCP — desperdício e impacto em rate limit do provedor. A função
   continua se chamando `coletar_via_openrouter` mas exige o cliente
   compartilhado, gerenciado por `coletar_lote` (que abre 1 client com
   `async with`).
3. **Retry só pra 429/5xx + erros de rede.** 4xx outras (401, 403, 404)
   falham na hora — não adianta retentar API key errada. Backoff fixo
   1s/3s/9s conforme spec.
4. **`dossie` vazio NÃO anexa `## DOSSIÊ DE REFERÊNCIA`**. Isso permite ao
   `__main__` pré-substituir `{{DOSSIE}}` no prompt (formato do llm-prompt
   em F4.5) e passar `dossie=""` sem duplicar seção. Se o prompt não tem
   placeholder, o `dossie` é anexado.
5. **`salvar_palpite` preserva `<!-- ia: -->`, `<!-- tier: -->`, `<!-- url: -->`
   do placeholder existente.** Mantém compatibilidade com o
   `_nome_display` do `__main__.py` e com o bootstrap script. Adiciona
   `<!-- modo: api -->`, `<!-- modelo: ... -->`, `<!-- coletado_em: ... -->`,
   `<!-- status: palpitou via api -->`. Sem essas, o ranking não mostraria
   nome bonito até a próxima execução do bootstrap.
6. **`--apply` é no-op explícito.** Spec critério usa `--apply`; spec texto
   diz "default já chama". Aceito ambos: sem `--dry-run` a API é chamada.
   `--apply` documenta intenção (útil em scripts) mas não muda comportamento.
7. **`--max-paralelo` adicionado** (default 5 como spec). Útil pra
   debugar com `--max-paralelo 1` ou pra aumentar quando coletando todos
   os 89 de uma vez.
8. **Mapping ignora chaves que começam com `_`** (ex.: `_meta`). Permite
   metadados auto-documentados no arquivo sem virar IA fantasma.

## Smoke test feito

```bash
$ PYTHONPATH=src python -m bolao coletar --tier 1 --dry-run
coletar: 15 IA(s) alvo · dossiê=2026-06-grupos.md · max_paralelo=5
  - chatgpt-5                        → openai/gpt-5  (tier 1)
  - chatgpt-5-thinking               → openai/gpt-5-thinking  (tier 1)
  ...(15 linhas)...
(dry-run; nenhuma chamada feita)

$ PYTHONPATH=src python -m bolao coletar --ia chatgpt-5 --dry-run
coletar: 1 IA(s) alvo · dossiê=2026-06-grupos.md · max_paralelo=5
  - chatgpt-5                        → openai/gpt-5  (tier 1)
(dry-run; nenhuma chamada feita)

$ PYTHONPATH=src python -m bolao coletar --ia bogus-ia --dry-run
WARN: slug 'bogus-ia' fora do mapping openrouter; pulando
erro: nenhuma IA selecionada pelos filtros
[exit 1]

$ PYTHONPATH=src python -m bolao coletar --tier all --dry-run
coletar: 89 IA(s) alvo · ...
```

Critérios de fechamento atendidos pelo lado pipeline-dev:
- [x] `coletar --tier 1 --dry-run` → 15 IAs (16 menos copilot-microsoft).
- [x] `coletar --ia chatgpt-5 --dry-run` → 1 IA.
- [x] Mapping ≥70 IAs (entreguei 89).
- [x] **Não testado contra API real** — exige `OPENROUTER_API_KEY` no env
      + crédito; o operador faz isso no smoke real (vide spec, critério
      `coletar --ia gemma-3 --apply`). O caminho de código está pronto e
      o erro "key ausente" tem mensagem clara.

`pytest -q`: 54 testes passam (nenhum quebrou). Cobertura do coletor é 0%
(qa-tester não escreveu testes ainda — fora do escopo F4.5).

## Pendências / dúvidas pro Arquiteto

1. **`coletar_via_openrouter` exige `client` extra na assinatura.**
   Spec define `(slug, modelo, prompt, dossie) -> str`. Tive que adicionar
   `client: httpx.AsyncClient` no começo pra reusar conexão. Se o
   Arquiteto preferir 1:1 com spec, posso quebrar reuso com um helper
   wrapper que abre/fecha por chamada (custo: ~50ms extra por IA × 89 IAs
   = ~4s — aceitável). Decisão sua.
2. **Mapping JSON tem `_meta`** com nota de cobertura. Se algum consumidor
   espera "todas as chaves são slugs", precisa filtrar `_*`. Já documentei
   o filtro em `_carregar_mapping_openrouter()`.
3. **Sem rate limit handler refinado.** Só faz backoff fixo. Se OpenRouter
   responder com `Retry-After`, ignoramos. Pra F4.5 OK; pra produção
   séria, parsear o header.
4. **`coletar_via_openrouter` não loga prompt completo.** Se vier resposta
   estranha, debugar exige adicionar print do payload manualmente. Posso
   adicionar `--verbose` na próxima iteração.
5. **Não há retry pra `salvar_palpite`.** Se o disco encher mid-coleta,
   perde o palpite (mas a resposta da API já foi paga). Aceitável pra
   MVP — operador roda em laptop com 500GB livres.
