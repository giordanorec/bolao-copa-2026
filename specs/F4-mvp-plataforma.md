# F4 — MVP da Plataforma do Bolão das IAs

**Sprint**: 05/06/2026 → 10/06/2026 (5 dias, Copa começa 11/06)
**Branch**: `main` (commitando direto, projeto novo, sem PR no MVP)
**Arquiteto**: esta sessão (Giordano via Claude)

## Objetivo da feature

Entregar uma **plataforma local funcional** (Python CLI + HTML estático) que:
1. Recebe palpites de IAs em `.md`.
2. Calcula pontuação com regras clássicas (10/7/5/5/0 + 2× mata-mata).
3. Renderiza ranking HTML estático.
4. Gera resumo pronto pra WhatsApp.

Pra Copa abrir 11/06 com o sistema operacional.

## Contexto obrigatório (todos os agentes leem)

1. `CLAUDE.md`
2. `docs/00_OBJETIVO.md`
3. `docs/01_ARQUITETURA.md`
4. `docs/02_REGRAS_DE_NEGOCIO.md` ⚠️ as 12 regras de borda são canônicas
5. `docs/03_SCHEMA.md`
6. `docs/04_PIPELINE.md`
7. `docs/05_STACK.md`
8. `docs/DECISOES.md`
9. Seu próprio `.claude/agents/<agente>.md`
10. Sua `memory/<agente>/MEMORY.md`

## Divisão estrita por agente

### 🛠 pipeline-dev — `src/bolao/`

**Entregáveis**:
1. `src/bolao/models.py` — dataclasses `Jogo`, `Palpite`, `Resultado` (frozen, com type hints) conforme contratos em `docs/01_ARQUITETURA.md`.
2. `src/bolao/parser.py`:
   - `carregar_jogos(path: Path) -> list[Jogo]` — lê `data/jogos.md`, valida estrutura, retorna lista ordenada por `numero`.
   - `carregar_palpites(dir_path: Path) -> dict[str, list[Palpite]]` — itera `data/palpites_ias/*.md`, extrai slug do nome do arquivo.
   - `carregar_resultados(path: Path) -> list[Resultado]` — lê `data/resultados/jogos.md` (jogos com `Gols A`/`Gols B` preenchidos).
   - Erros de parse: imprime `arquivo:linha: motivo` em stderr; não derruba outros arquivos.
3. `src/bolao/scoring.py`:
   - `pontuar(palpite: Palpite, resultado: Resultado, fase: str) -> int` — implementa a tabela 10/7/5/5/0 com multiplicador 2× para mata-mata.
   - `fase_eh_mata_mata(fase: str) -> bool` — True para R32/Oitavas/Quartas/Semifinal/3º lugar/Final.
   - **DEVE passar os 12 casos de borda** de `docs/02_REGRAS_DE_NEGOCIO.md`.
4. `src/bolao/ranking.py`:
   - `pontos_por_ia(palpites, resultados, jogos) -> dict[str, dict]` — agrega total + métricas (placares_exatos, vencedores_acertados, jogos_palpitados).
   - `ranking_geral(...) -> list[dict]` — ordenado por (pontos desc, placares_exatos desc, vencedores_acertados desc, slug asc) — invariante I3.
5. `src/bolao/__main__.py` — implementar os subcomandos (já há stub):
   - `parse` — carrega tudo, reporta inconsistências, exit code != 0 se erros.
   - `score` — gera `reports/<YYYY-MM-DD>/pontuacao.json`.
   - `ranking` — atualiza `web/data/ranking.json`. (HTML é responsabilidade do frontend-dev.)
   - `resumo` — escreve `resumo.txt` com texto pronto pra WhatsApp.
   - `rodada` — sequência parse → score → ranking → resumo.
   - `serve` — `python -m http.server` em `web/`.

**Não cuide de**: HTML/CSS/JS (frontend-dev), testes (qa-tester), prompt das IAs (llm-prompt), pyproject.toml de produção (devops-installer).

**Smoke test esperado**: `python -m bolao rodada` em estado vazio gera ranking com 0 IAs sem crashar.

**Reporte em**: `reports/F4-mvp-plataforma/pipeline-dev.md`.

---

### ✍️ llm-prompt — `config/prompts/`

**Entregáveis**:
1. `config/prompts/ia-palpiteira.md` — **reescrever** substituindo o placeholder atual. Base no `config/prompts/ia-palpiteira-v0-dacopa.md` para tom e estrutura, mas:
   - Trocar a tabela de pontuação Dacopa (25/18/15/12/10/0) pela clássica (10/7/5/5/0).
   - Atualizar a estratégia ("o valor esperado de cada placar é diferente porque agora placar exato vale 10 vs 7 do vencedor+saldo — empate sem placar exato dá 5 pontos, então cravar empate por placar exato dá só +5 vs palpitar empate genérico").
   - Manter: lista dos 72 jogos da fase de grupos (mesma ordem), checklist final, autorização explícita para pesquisar na internet.
   - Adicionar: instrução para a IA assinar a resposta com seu nome e versão (ex: "GPT-5", "Claude Opus 4.7") como comentário HTML invisível no topo da tabela, ajudando o operador a confirmar identidade do arquivo.
2. `config/prompts/ia-palpiteira-mata-mata.md` — esboço (mesmo template, só 32 jogos do mata-mata, com placeholders "Venc. J73" etc — vai ser preenchido em Fase 7 quando os classificados forem conhecidos).
3. `tests/prompts/casos.jsonl` — pelo menos 5 mini-casos (jogo + resultado fictício + pontuação esperada) para validação cruzada futura quando integrarmos um LLM "júri".

**Não cuide de**: parser de palpites (pipeline-dev), engine de scoring (pipeline-dev), templates HTML (frontend-dev).

**Reporte em**: `reports/F4-mvp-plataforma/llm-prompt.md` com:
- Diff conceitual: o que mudou vs v0 Dacopa.
- Argumentação estratégica (regras novas mudam o "ótimo" da palpiteira como?).
- Modelo recomendado pra cada IA (qual versão de cada modelo usar — ChatGPT 5 vs 5-mini etc.).

---

### 🎨 frontend-dev — `web/`

**Entregáveis** (todos em `web/`, HTML estático, **zero build step**):
1. `web/index.html` — ranking principal. Tabela: posição, IA, pontos, placares exatos, vencedores acertados, jogos palpitados.
2. `web/ia/<slug>.html` — gerado via template Jinja2 (`web/templates/ia.html.j2`), uma página por IA com:
   - Resumo de pontuação
   - Lista dos 104 jogos com palpite vs resultado e pontos ganhos
3. `web/jogo/<numero>.html` — gerado via template `web/templates/jogo.html.j2`, mostrando palpites de todas as IAs lado a lado.
4. `web/assets/style.css` — visual responsivo, mobile-first, escuro elegante.
   - Tailwind via CDN é permitido se preferir (decisão sua).
5. `web/assets/script.js` — minimal (sort de coluna por click; sem framework).
6. `web/templates/` — templates Jinja2 base.

**Contrato com pipeline-dev**: `web/data/ranking.json` é a fonte de dados. Schema:
```json
{
  "atualizado_em": "2026-06-13T22:30:00-03:00",
  "ias": [
    {"slug": "chatgpt-5", "nome_display": "ChatGPT 5", "pontos": 45, "placares_exatos": 2, "vencedores_acertados": 5, "jogos_palpitados": 8}
  ],
  "jogos_apurados": 8,
  "jogos_totais": 104
}
```
Se mudar esse schema, atualizar `docs/01_ARQUITETURA.md`.

**Renderização das páginas**: o `pipeline-dev` chama você através de `src/bolao/render.py` (eu ainda não defini quem cria essa função — você combina com pipeline-dev no report). Sugestão: você escreve `src/bolao/render.py` com a função `renderizar_html(ranking_json: Path, web_dir: Path) -> None`, ele só importa.

**Não cuide de**: cálculo de pontos (pipeline-dev), prompt (llm-prompt).

**Reporte em**: `reports/F4-mvp-plataforma/frontend-dev.md`.

---

### 🔧 devops-installer — `pyproject.toml`, `.pre-commit-config.yaml`, MCPs

**Entregáveis**:
1. Revisar `pyproject.toml`. Confirma deps mínimas (jinja2 + dev: pytest, pytest-cov, ruff, mypy, pre-commit). Adicione `python-dateutil` se o pipeline-dev pedir; documente no report.
2. `.pre-commit-config.yaml` — hooks: ruff lint, ruff format, mypy em `src/`, pytest -x (rápido). Comando para instalar: `pre-commit install`.
3. `Makefile` (ou `scripts/dev.sh` se preferir não usar make em Windows) com targets: `install`, `test`, `lint`, `serve`, `rodada`.
4. Investigar e propor MCP de resultados de futebol para uso futuro (não integrar agora). Avalie: `livescore-mcp`, `soccer-mcp-server`, `sportscore-mcp` (todos no GitHub). Critério: cobre Copa 2026, manutenção ativa, autenticação simples. Reporte sua recomendação.
5. `scripts/check_env.sh` — diagnóstico que confirma: Python 3.11+, pip, git, e (no Windows) os shims em `scripts/bin/`. Imprime "ambiente OK" ou lista o que falta.

**Não cuide de**: lógica do pipeline (pipeline-dev), prompts (llm-prompt), HTML (frontend-dev).

**Reporte em**: `reports/F4-mvp-plataforma/devops-installer.md`.

---

### 🧪 qa-tester — `tests/`

**Entregáveis**:
1. `tests/test_scoring.py` — **1 teste por caso de borda** de `docs/02_REGRAS_DE_NEGOCIO.md` (são 12). Nomes: `test_caso_01_empate_placar_errado`, etc. Cada teste deve falhar antes do pipeline-dev implementar e passar depois. **Você pode escrever esses testes ANTES do pipeline-dev terminar** — contrato está em `docs/01_ARQUITETURA.md`.
2. `tests/test_parser.py` — fixtures em `tests/fixtures/`:
   - `jogos_mini.md` (5 jogos de exemplo)
   - `palpites/chatgpt-mini.md` (palpites pros 5 jogos)
   - `resultados_mini.md` (3 dos 5 jogos)
   - Testa: parse completo, rejeição de palpite inválido (`gols_a="um"`), regra de lock por mtime (use `monkeypatch.setattr(os.path, "getmtime", ...)`).
3. `tests/test_ranking.py` — testa estabilidade de ordenação (invariante I3), empate de pontos resolvido na ordem correta.
4. `tests/test_e2e.py` — pipeline completo com fixtures: parse → score → ranking. Confere que JSON gerado tem schema certo.
5. Cobertura: target 80%+ em `src/bolao/scoring.py` e `src/bolao/ranking.py`. Comando: `pytest --cov=bolao --cov-report=term-missing`.

**Não cuide de**: implementação (pipeline-dev), HTML (frontend-dev), prompts (llm-prompt).

**Reporte em**: `reports/F4-mvp-plataforma/qa-tester.md`.

---

### 📝 docs-writer — `README.md` e instruções

**Entregáveis**:
1. Revisar e expandir `README.md` com:
   - Print do ranking final (placeholder por enquanto, gerar quando tiver dados).
   - Quickstart 5 passos para alguém que clonar.
   - FAQ ("e se uma IA recusar palpitar?", "e se eu errei de digitar um resultado?").
2. `docs/USO.md` — manual de operação durante a Copa. Tom direto, passo a passo. Cobertura:
   - Como coletar palpites de cada IA (qual modelo escolher, qual chat usar).
   - Como rodar `python -m bolao rodada` após cada rodada.
   - Como postar o resumo no WhatsApp (formato esperado).
   - Como corrigir resultado se errar.
3. `docs/CONTRIBUTING.md` — só se relevante (provavelmente não no MVP, decida).
4. Mensagem de divulgação pros amigos no grupo WhatsApp "Claude - Geral", com prefixo `[bolao-copa]`, anunciando que o bolão das IAs vai rolar em paralelo ao do Dacopa, e que o ranking estará disponível em (URL ou "compartilho aqui").

**Não cuide de**: código (pipeline-dev), prompts (llm-prompt), HTML (frontend-dev), CI/CD (devops-installer).

**Reporte em**: `reports/F4-mvp-plataforma/docs-writer.md`.

---

## Regras transversais

- **Encoding**: tudo UTF-8.
- **Idioma do código**: identificadores em inglês onde fizer sentido (`pontuar`, `jogo` em pt-BR pra coerência com domínio é OK), mensagens ao usuário em pt-BR.
- **Commits**: cada agente faz seus commits direto em `main` com prefixo `[F4-<agente>]`. Atômicos por entregável.
- **Quando travar**: pare e escreva no seu report a dúvida bloqueante. Não invente API que outro agente vai precisar — escreva como dúvida pra eu (arquiteto) decidir.
- **Quando terminar**: marca o status idle e o report em `reports/F4-mvp-plataforma/<agente>.md`. Vou consolidar e fechar a F4 com release tag `v0.1.0-mvp`.

## Critério de fechamento da F4

Tudo verde:
- [ ] `python -m bolao rodada` em estado vazio: OK em < 1s.
- [ ] `pytest -q --cov=bolao` ≥ 80% em scoring/ranking.
- [ ] `ruff check src/ tests/` sem warnings.
- [ ] `mypy --strict src/` limpo.
- [ ] Prompt revisado pelo llm-prompt está em `config/prompts/ia-palpiteira.md`.
- [ ] `web/index.html` renderiza no browser, ranking aparece (mesmo zerado).
- [ ] README atualizado com quickstart.
- [ ] Cada agente entregou seu report.

**Prazo interno**: até 09/06/2026 23:59 BRT.

---

## Para o agente: como começar

1. Leia o contexto obrigatório (ver topo deste arquivo).
2. Leia a sua seção neste arquivo (a com seu emoji).
3. Confirma no log "começando F4 — <agente>".
4. Implementa.
5. Smoke test local.
6. Commit `[F4-<agente>] ...` (cada entregável seu).
7. Escreve report em `reports/F4-mvp-plataforma/<agente>.md`.
8. Atualiza `memory/<agente>/MEMORY.md` com 1-3 bullets de lições.
