# 08 — Fases

Projeto avança em fases com critério de saída explícito. Cada fase fecha com commit, update em `DECISOES.md` e checkpoint com o usuário (quando aplicável).

## Fase 0 — Discovery [✓ 2026-06-05]

- [x] Objetivo, público, escopo, stack decididos.
- [x] Time de agentes escolhido (7: arquiteto + 6 especialistas).
- [x] Hospedagem confirmada (local + GitHub Pages opcional).
- [x] Compliance: LGPD não aplicável.

## Fase 1 — Especificação [✓ 2026-06-05]

- [x] `docs/00_OBJETIVO.md` a `docs/10_PRIMEIROS_PASSOS.md` preenchidos.
- [x] `docs/06_LGPD.md` deletado (não aplicável).
- [x] `docs/DECISOES.md` com decisão inicial.
- [x] `CLAUDE.md` atualizado.

## Fase 2 — Definição do time [✓ 2026-06-05]

- [x] `.claude/agents/` com 7 system prompts (arquiteto + pipeline-dev + frontend-dev + llm-prompt + devops-installer + qa-tester + docs-writer).

## Fase 3 — Setup [✓ 2026-06-05]

- [x] Estrutura de pastas.
- [x] Scripts de orquestração copiados do plugin.
- [x] `pyproject.toml` mínimo com deps (jinja2, pytest, ruff, mypy).
- [x] `data/jogos.md` derivado de `tabela-jogos-copa-2026.md`.
- [x] Smoke test mínimo (`python -m bolao --help` responde, `pytest -q` passa).
- [x] Git init + commit inicial.
- [ ] `gh repo create` — **pendente** username do Giordano.

**Critério de saída**: projeto roda 1-comando em máquina limpa (`pip install -e . && python -m bolao --help`).

## Fase 4 — MVP Coleta + Scoring + Ranking [Sprint até 10/06/2026]

Spec inicial: `specs/F4-coleta-consolidacao.md`.

Entregáveis:
- `src/bolao/parser.py` — lê jogos.md, palpites/*.md, resultados.md.
- `src/bolao/scoring.py` — implementa as 12 regras de `02_REGRAS_DE_NEGOCIO.md`.
- `src/bolao/ranking.py` — agrega + ordena com desempates.
- `src/bolao/render.py` — HTML estático básico via Jinja2.
- `src/bolao/__main__.py` — CLI com subcomandos: `parse`, `score`, `ranking`, `resumo`, `rodada`.
- `config/prompts/ia-palpiteira.md` — **prompt reescrito com regras clássicas** (substituindo o Dacopa).
- `tests/` cobrindo os 12 casos de borda.

**Critério de saída**: rodada simulada com fixtures fecha em < 5s, ranking renderizado, todos os testes passam, prompt revisado pelo `llm-prompt`.

## Fase 5 — Coleta real dos palpites das IAs [10/06 → 11/06]

- Giordano cola o prompt novo em ChatGPT, Gemini, Grok, Claude, DeepSeek.
- Salva cada resposta em `data/palpites_ias/<slug>.md`.
- `python -m bolao parse` valida tudo, reporta inconsistências.
- Ranking inicial (todos zerados) renderizado.

## Fase 6 — Operação durante a Copa [11/06 → 19/07]

- Após cada rodada (1-2x ao dia), Giordano:
  1. Atualiza `data/resultados/jogos.md`.
  2. `python -m bolao rodada` (parse + score + ranking + resumo).
  3. Copia `resumo.txt` para WhatsApp.
  4. (Opcional) `git push` pra atualizar GitHub Pages.

## Fase 7 — Palpites do mata-mata [27/06 → 28/06]

- Com classificados conhecidos, novo prompt pro mata-mata (R32 em diante).
- IAs reentregam palpites só pro mata-mata.
- Pipeline já preparado pro multiplicador 2×.

## Fase 8 — Encerramento [pós-19/07/2026]

- Ranking final.
- Texto de "premiação" das IAs.
- Postmortem em `docs/DECISOES.md`: o que funcionou, o que falhou, qual IA acertou mais.
- Arquivamento do repo.
