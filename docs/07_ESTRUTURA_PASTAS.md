# 07 — Estrutura de pastas

```
Bolao da Copa/
├── .claude/agents/                # system prompts dos agentes (versionado)
│   ├── arquiteto.md
│   ├── pipeline-dev.md
│   ├── frontend-dev.md
│   ├── llm-prompt.md
│   ├── devops-installer.md
│   ├── qa-tester.md
│   └── docs-writer.md
├── CLAUDE.md                      # descrição do projeto pros agentes
├── README.md                      # visão pro usuário (escrito pelo docs-writer)
├── .gitignore
├── pyproject.toml                 # config do stack Python
├── .pre-commit-config.yaml
├── .python-version
│
├── docs/                          # documentação viva (Arquiteto)
│   ├── 00_OBJETIVO.md
│   ├── 01_ARQUITETURA.md
│   ├── 02_REGRAS_DE_NEGOCIO.md
│   ├── 03_SCHEMA.md
│   ├── 04_PIPELINE.md
│   ├── 05_STACK.md
│   ├── 07_ESTRUTURA_PASTAS.md
│   ├── 08_FASES.md
│   ├── 09_RISCOS.md
│   ├── 10_PRIMEIROS_PASSOS.md
│   └── DECISOES.md
│
├── specs/                         # tickets do Arquiteto pros especialistas
│   └── F4-coleta-consolidacao.md  # exemplo
│
├── reports/                       # respostas dos especialistas + relatórios
│   └── <feature>/<agente>.md
│
├── memory/                        # memória persistente (NÃO versionado)
│   └── <agente>/MEMORY.md
│
├── status/                        # NÃO versionado
│   └── <agente>.json
│
├── logs/                          # NÃO versionado
│   └── <agente>/current.log
│
├── sessions.json                  # NÃO versionado (agente → session_id)
│
├── scripts/                       # orquestração (copiado do plugin)
│   ├── spawn.sh
│   ├── drive.sh
│   ├── take_over.sh
│   ├── open_dashboard.sh
│   ├── _tail_color.sh
│   ├── _status_summary.sh
│   └── _stream_pretty.py
│
├── src/                           # código Python (pipeline-dev)
│   └── bolao/
│       ├── __init__.py
│       ├── __main__.py            # entry point: python -m bolao ...
│       ├── parser.py
│       ├── scoring.py
│       ├── ranking.py
│       ├── render.py              # Jinja2 → HTML
│       └── resumo.py
│
├── tests/                         # qa-tester
│   ├── test_parser.py
│   ├── test_scoring.py
│   ├── test_ranking.py
│   ├── test_e2e.py
│   └── fixtures/
│
├── config/                        # llm-prompt
│   └── prompts/
│       └── ia-palpiteira.md       # versão atual do prompt das IAs
│
├── data/                          # fonte de verdade (versionado)
│   ├── jogos.md                   # tabela canônica dos 104 jogos
│   ├── palpites_ias/
│   │   ├── chatgpt-5.md
│   │   ├── gemini-2-5-pro.md
│   │   ├── claude-opus-4-7.md
│   │   ├── grok-4.md
│   │   ├── deepseek-r1.md
│   │   └── historico/             # append-only
│   ├── resultados/
│   │   └── jogos.md               # placares reais
│   └── cache/                     # NÃO versionado (regenerável)
│
├── web/                           # frontend-dev (HTML estático versionado)
│   ├── index.html                 # ranking principal
│   ├── ia/<slug>.html             # página por IA
│   ├── jogo/<numero>.html         # página por jogo
│   ├── assets/style.css
│   ├── assets/script.js
│   └── data/ranking.json
│
├── docs_assets/                   # imagens, screenshots pro docs-writer
│
└── handoff-bolao-copa-2026.md     # contexto histórico (manter como referência)
└── prompt-bolao-ias.md            # prompt original Dacopa (será substituído)
└── tabela-jogos-copa-2026.md      # tabela original (será movida pra data/jogos.md)
```

## Regra de ouro

**Um agente, uma pasta principal.** Sem sobreposição. Contratos entre pastas vivem em `docs/01_ARQUITETURA.md` e em `specs/<feature>.md`.

## Mapping curto

| Pasta | Agente dono |
|---|---|
| `docs/`, `specs/`, raiz | arquiteto |
| `src/bolao/` | pipeline-dev |
| `tests/` | qa-tester |
| `web/`, `web/assets/` | frontend-dev |
| `config/prompts/`, `tests/prompts/` | llm-prompt |
| `pyproject.toml`, `.pre-commit-config.yaml`, MCPs | devops-installer |
| `README.md`, `docs_assets/` | docs-writer |
| `data/` | compartilhado (formato controlado pelo arquiteto, leitura por todos) |
