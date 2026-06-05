# 05 — Stack

## Linguagem principal

**Python 3.11+** — escolhida por:
- Stdlib robusta pra parsing/CSV/JSON.
- Maturidade dos MCPs de futebol (livescore-mcp, soccer-mcp-server, sportscore-mcp são todos Python).
- Familiaridade do operador.
- Jinja2 é a ferramenta default pra HTML estático em Python.

## Runtime

- Python 3.11+ (testado em 3.11 e 3.12).
- Bash (Git Bash no Windows, zsh/bash no Mac).
- Navegador moderno pra abrir `web/index.html` ou GitHub Pages.

## Framework / libs principais

- **stdlib** (`dataclasses`, `pathlib`, `json`, `re`, `argparse`): core do pipeline. Preferida sempre que possível.
- **jinja2**: templating HTML estático.
- **pytest**: testes.
- **pytest-cov** (opcional): cobertura.

Libs que entrarão **só se justificadas**:
- `pandas` — apenas se for natural pra agregação. Stdlib + dict comprehensions cobre a maioria.
- `rich` — apenas se output CLI exigir tabelas coloridas.
- `markdown-it-py` — apenas se o parser markdown stdlib não der conta. Por enquanto: regex sobre as linhas de tabela.

## Testes

**pytest**. Estrutura:

```
tests/
├── test_parser.py          # cada formato de tabela
├── test_scoring.py         # 12 casos de borda do 02_REGRAS_DE_NEGOCIO.md
├── test_ranking.py         # desempates, estabilidade
├── test_e2e.py             # rodada completa com fixtures
├── fixtures/
│   ├── jogos_mini.md       # 4 jogos pra testes rápidos
│   ├── palpites/chatgpt.md
│   └── resultados.md
└── prompts/                # propriedade do llm-prompt
```

Política: cada caso de borda em `02_REGRAS_DE_NEGOCIO.md` vira **um** teste nomeado `test_caso_<N>_<descricao>`.

## Qualidade

- **Lint**: `ruff` (lint + format combinados).
- **Format**: `ruff format` (substitui black, isort).
- **Type check**: `mypy --strict` apenas em `src/`. Testes ficam fora.
- **Pre-commit**: `pre-commit` rodando ruff + mypy + pytest -x antes de cada commit.

## Ordem de preferência ao adicionar deps novas

1. Já instalado? Use.
2. Stdlib resolve? Use.
3. Biblioteca madura (>5k stars, mantida, com types)? OK, mas passa pelo `devops-installer` que documenta em `reports/<feature>/deps.md`.
4. Biblioteca obscura? Discuta com Arquiteto antes.

## O que NÃO entra (veto)

- **Frameworks web (Flask, FastAPI, Django)**: sem servidor, sem banco. HTML estático é suficiente.
- **ORM (SQLAlchemy, Tortoise)**: não temos banco.
- **Frontend frameworks (React, Vue, Svelte)**: ranking é HTML + CSS + 50 linhas de JS no máximo (sort de tabela). Tailwind via CDN é o teto.
- **Selenium/Playwright pro Dacopa**: ToS proíbe múltiplas contas; o uso pelo Claude in Chrome (manual, pelo Giordano-humano) é fora deste repo.
- **Docker**: rodando local. Adicionar só se Giordano pedir explicitamente.
- **Cloud SDKs (AWS/GCP/Azure)**: nada hospedado em cloud paga. GitHub Pages é o limite.

## Arquivos de configuração

- `pyproject.toml` — deps, ruff, pytest config.
- `.pre-commit-config.yaml` — hooks.
- `.gitignore` — já em vigor (copiado do template).
- `.python-version` — `3.11` (pra pyenv).
