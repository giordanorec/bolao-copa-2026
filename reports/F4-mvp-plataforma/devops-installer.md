# F4 — devops-installer

**Status**: idle (entregáveis fechados).
**Data**: 2026-06-05.

## Entregáveis

| # | Item                              | Arquivo(s)                                                       |
|---|-----------------------------------|------------------------------------------------------------------|
| 1 | Revisão do `pyproject.toml`       | `pyproject.toml`                                                 |
| 2 | Pre-commit                        | `.pre-commit-config.yaml`, `.gitattributes`, `.python-version`   |
| 3 | Targets de dev em script          | `scripts/dev.sh`                                                 |
| 4 | Diagnóstico de ambiente           | `scripts/check_env.sh`                                           |
| 5 | Investigação de MCP de futebol    | esta seção (não integra)                                         |

## 1. `pyproject.toml`

Mantido o que já existia (jinja2 + dev: pytest, pytest-cov, ruff, mypy, pre-commit). Acréscimos:

- `[tool.ruff.lint.per-file-ignores]` afrouxando `B011` e `SIM117` em `tests/**` — assertivas e `with` aninhados são padrão em pytest.
- `[[tool.mypy.overrides]] module = "tests.*" ignore_errors = true` — confirma que o `--strict` só vale em `src/` (o `files = ["src"]` já filtrava, mas deixar explícito evita surpresa se alguém mudar a config).
- `[tool.coverage.run]` + `[tool.coverage.report]` — branch coverage ligado, `show_missing` true, exclusão de `TYPE_CHECKING` e `if __name__ == "__main__"`. Suporta o target `cov` do `scripts/dev.sh`.

**Deps adicionadas**: nenhuma. `python-dateutil` **não** foi adicionado — pipeline-dev não pediu até o momento; quando precisar, abre issue e a gente inclui em um commit `chore(deps)` separado. Justificativa: stdlib `datetime` cobre o que o pipeline precisa hoje (parsing de ISO 8601 em strings de resultados).

## 2. `.pre-commit-config.yaml`

Hooks ativos:

- `pre-commit/pre-commit-hooks@v5.0.0`: trailing-whitespace, end-of-file-fixer, check-yaml, check-toml, check-merge-conflict, check-added-large-files (500 KB).
- `astral-sh/ruff-pre-commit@v0.5.0`: ruff (com `--fix`) + ruff-format.
- `pre-commit/mirrors-mypy@v1.10.0`: mypy `--strict` em `^src/`, com `jinja2>=3.1` como dep adicional.
- Local: `pytest -x -q` rodando em **pre-push** (não pre-commit) — evita commits lentos quando a suíte crescer. `pre-commit install --hook-type pre-push` já é feito pelo `dev.sh install`.

**Hook removido**: `mixed-line-ending --fix=lf`. Em Windows com `core.autocrlf=true` (default global, presente nesta máquina) ele entra em loop com a conversão automática do git: cada `pre-commit run` "fixa" e o próximo checkout reverte. Substituí por:

## 2b. `.gitattributes`

Normalização canônica: `* text=auto eol=lf` + listas explícitas para `.sh`, `.py`, `.toml`, `.yaml`, `.json`, `.md`, etc. Garante que tudo é LF dentro do repo, mesmo com autocrlf no working tree. Shell scripts especialmente: Git Bash recusa `\r` em shebangs em alguns casos.

## 3. `scripts/dev.sh`

Optei por **`dev.sh` em vez de `Makefile`** porque o ambiente é Windows + Git Bash. Make não está garantido. O script:

- Exporta `scripts/bin/` no PATH automaticamente em Windows (shims `jq`/`uuidgen`).
- Targets: `install`, `test`, `cov`, `lint`, `fmt`, `serve`, `rodada`, `check-env`, `help`.
- `install` instala editable + `pre-commit install` + `pre-commit install --hook-type pre-push`.

Uso:

```bash
bash scripts/dev.sh install
bash scripts/dev.sh lint
bash scripts/dev.sh rodada
```

## 4. `scripts/check_env.sh`

Imprime tabela legível com prefixos `OK`/`WARN`/`FAIL`. Verifica:

- Python ≥ 3.11
- pip, git
- Plataforma e shims `scripts/bin/jq` + `scripts/bin/uuidgen` (Windows)
- `scripts/bin/` no PATH
- venv ativo
- Pacote `bolao` importável
- Hook pre-commit instalado em `.git/hooks/`

Exit code 0 se nenhum `FAIL`; 1 caso contrário.

Saída de teste local (Git Bash neste laptop, fora da venv):

```
  OK    python 3.13.7 (>=3.11) em /c/Users/grec/.../Python313/python
  OK    pip 25.2
  OK    git 2.51.2.windows.1
  INFO  plataforma: Windows (MINGW64_NT-10.0-26200)
  OK    shim scripts/bin/jq presente e executável
  OK    shim scripts/bin/uuidgen presente e executável
  OK    scripts/bin/ está no PATH
  WARN  .venv existe mas não está ativado
  WARN  pacote 'bolao' não importável
  WARN  hook pre-commit não instalado
ambiente OK (6 checks passaram, 3 avisos)
```

(WARNs esperados quando o usuário roda antes de `dev.sh install`.)

## 5. MCP de resultados de futebol — recomendação

Avaliei os 3 candidatos pedidos. Resumo:

| MCP                              | Auth         | Cobertura Copa 2026 | Tools úteis pra nós                                   | Manutenção                  | License |
|----------------------------------|--------------|---------------------|-------------------------------------------------------|-----------------------------|---------|
| `Backspace-me/sportscore-mcp`    | **nenhuma**  | Sim (futebol global)| `get_matches`, `get_match_detail`, `get_bracket`, `get_standings`, `get_tracker` | v0.1.0 abr/2026, ativo, 4★  | MIT     |
| `holoduke/livescore-mcp`         | nenhuma (SSE)| Sim ("World Cup")   | `get_live_scores`, `get_fixtures`, `get_match`, `get_team`, `search`             | 18 commits, ativo, 0★       | MIT     |
| `obinopaul/soccer-mcp-server`    | **API key**  | Implícito (API-Football, paga via RapidAPI) | 20+ tools live + histórico                  | 4 commits, 5★               | MIT     |

**Recomendação primária**: **`sportscore-mcp`** (Backspace-me).

- **Por quê**: sem API key (fricção zero), CORS-open, 1000 req/24h por IP — folgadíssimo pra 104 jogos consultados 1×/rodada. Tem `get_bracket` que cobre exatamente o nosso caso de uso pós-fase de grupos (mata-mata da Copa). `get_tracker` permite ao vivo se quisermos no futuro. Instalação via `npx -y sportscore-mcp` no Claude Desktop (não exige nada no nosso runtime Python — o operador só consulta pelo Claude e cola o `.md` em `data/resultados/`).
- **Pegadinha**: a free-tier exige manter atribuição "Powered by SportScore" no output que vai para o usuário final. Como nosso ranking é interno (operador + grupo WhatsApp), trivial — basta o `docs-writer` mencionar no rodapé do HTML quando integrarmos.

**Fallback**: **`livescore-mcp`** (holoduke). Free, sem chave, multi-liga. Útil se SportScore cair ou tiver gap específico. Conectar via `claude mcp add livescore https://livescoremcp.com/sse`.

**Descartado**: **`soccer-mcp-server`** (obinopaul). Bom em features (20+ tools), mas exige API key paga da RapidAPI API-Football. Custo + complexidade extras para zero benefício marginal pro nosso caso.

**Próximos passos quando for integrar (F5+)**:
1. `claude mcp add sportscore npx -y sportscore-mcp` no Claude Desktop do Giordano.
2. Convencionar prompt do operador: "puxe o placar do jogo Brasil×Sérvia da Copa 2026 no SportScore e me cole em formato `Gols A: X / Gols B: Y`".
3. Pipeline-dev não precisa mudar — `data/resultados/jogos.md` continua editado manualmente, MCP só preenche o intermediário.

**Não integrar agora** — escopo de F4 é o pipeline rodar com entrada manual. MCP é F5+.

## Como validei

- `bash scripts/check_env.sh` → exit 0 com avisos esperados (saída acima).
- `.venv/Scripts/python.exe -m ruff check src tests` → `All checks passed!`
- `.venv/Scripts/python.exe -m ruff format --check src tests` → `3 files already formatted`
- `.venv/Scripts/python.exe -m mypy --strict src` → `Success: no issues found in 2 source files`
- `pre-commit install` + `pre-commit install --hook-type pre-push` → ambos instalados.
- `pre-commit run --files <meus 6 arquivos>` → tudo verde, sem fix loop.

## Comando exato pra reproduzir setup do zero

```bash
git clone <repo> && cd "Bolao da Copa"
python -m venv .venv
source .venv/Scripts/activate           # Windows; Linux/Mac: .venv/bin/activate
bash scripts/dev.sh install             # editable + hooks
bash scripts/dev.sh check-env           # confirma ambiente
bash scripts/dev.sh lint                # smoke do toolchain
```

## Lições / pontos pra memória

- Em Windows o trio `core.autocrlf=true` + `mixed-line-ending` + `Edit` do Claude entra em loop. Solução canônica é `.gitattributes` + remover o hook. Documentado pra não cair na armadilha de novo.
- `make` não tá disponível no Git Bash por default — `scripts/dev.sh` é o substituto natural neste projeto.
- Shims `jq`/`uuidgen` em `scripts/bin/` (criados em commit anterior) precisam estar no PATH em **todo** script que pode disparar plugin multi-agente; `dev.sh` faz isso, mas o operador precisa lembrar de exportar manualmente em sessões soltas.

## Dúvidas bloqueantes

Nenhuma. F4 do meu lado está fechado.
