# 01 — Arquitetura

## Princípio central

**Filesystem-as-database**. Toda informação persistente vive em arquivos Markdown ou JSON dentro de `data/`. Nenhum servidor, nenhum banco de dados, nenhuma autenticação. O pipeline é uma sequência de funções puras Python que lê arquivos, calcula, e escreve HTML estático.

Por quê: 5-10 IAs participantes, ~104 jogos, ranking atualizado 1-2x por dia. Toda complexidade adicional (Postgres, FastAPI, login) seria overengineering. Markdown é editável por humanos com Notepad — Giordano consegue corrigir erros sem nenhuma ferramenta especial.

## Diagrama

```
                  ┌─────────────────────────────┐
                  │   data/jogos.md             │  ← tabela oficial (104 jogos)
                  │   data/palpites_ias/*.md    │  ← uploads das IAs
                  │   data/resultados/*.md      │  ← placares reais (manual)
                  └──────────────┬──────────────┘
                                 │
                                 ▼
                  ┌─────────────────────────────┐
                  │   src/parser.py             │
                  │   (md → dataclasses)        │
                  └──────────────┬──────────────┘
                                 │
                                 ▼
                  ┌─────────────────────────────┐
                  │   src/scoring.py            │
                  │   (regras clássicas)        │
                  └──────────────┬──────────────┘
                                 │
                                 ▼
                  ┌─────────────────────────────┐
                  │   src/ranking.py            │
                  │   (agrega por IA)           │
                  └──────────────┬──────────────┘
                                 │
                ┌────────────────┼────────────────┐
                ▼                ▼                ▼
        ┌───────────────┐  ┌──────────┐  ┌──────────────┐
        │ web/index.html│  │ CSV/JSON │  │ texto/WhatsApp│
        │ (Jinja2)      │  │ exports  │  │ (resumo MD)   │
        └───────────────┘  └──────────┘  └──────────────┘
```

CLI principal: `python -m bolao <comando>` — comandos: `parse`, `score`, `ranking`, `resumo`, `serve`.

## Por que essa arquitetura e não outras

**Alternativa A — Webapp com Flask/FastAPI + SQLite + login**: descartada porque demanda hosting (mesmo barato), introduz vulnerabilidades de auth/CSRF/XSS pra ganho zero (Giordano é o único operador), e duplica complexidade de teste.

**Alternativa B — Notion/Airtable database**: descartada porque escoring é matemática reproduzível que precisa estar versionada em código, não em fórmulas de planilha; debug fica impossível.

**Alternativa C (escolhida) — Filesystem + Python CLI + HTML estático**: tudo versionável em git, smoke-testável em CI, editável com qualquer editor, exportável pra GitHub Pages com 1 push, zero superfície de ataque.

## Divisão de trabalho por agente

| Agente | Pasta/arquivos de responsabilidade |
|---|---|
| `arquiteto` (este) | `docs/`, `specs/`, `CLAUDE.md`, integração |
| `pipeline-dev` | `src/` (parser, scoring, ranking, CLI) |
| `frontend-dev` | `web/` (templates Jinja2, CSS, JS leve) |
| `llm-prompt` | `config/prompts/`, `tests/prompts/` |
| `devops-installer` | `pyproject.toml`, `requirements.txt`, `.pre-commit`, scripts de bootstrap, MCPs |
| `qa-tester` | `tests/` (unit, integration, casos canônicos de scoring) |
| `docs-writer` | `README.md`, `docs_assets/`, instruções pros amigos |

Sem sobreposição: cada pasta pertence a **um** agente. Contratos entre pastas são documentados em `specs/`.

## Contratos de interface

### Parser → Scoring

```python
@dataclass(frozen=True)
class Jogo:
    numero: int
    fase: str  # "Grupo A" | "R32" | "Oitavas" | "Quartas" | "Semifinal" | "3º lugar" | "Final"
    data: str  # ISO YYYY-MM-DD
    hora: str  # HH:MM (BRT)
    local: str
    time_a: str
    time_b: str

@dataclass(frozen=True)
class Palpite:
    ia: str           # "chatgpt" | "gemini" | "claude" | ...
    jogo_numero: int
    gols_a: int
    gols_b: int

@dataclass(frozen=True)
class Resultado:
    jogo_numero: int
    gols_a: int
    gols_b: int
```

### Scoring → Ranking

```python
def pontuar(palpite: Palpite, resultado: Resultado, fase: str) -> int:
    """Retorna pontos do palpite. Aplica multiplicador 2x para mata-mata."""

def ranking_geral(palpites: list[Palpite], resultados: list[Resultado], jogos: list[Jogo]) -> list[dict]:
    """Retorna [{'ia': ..., 'pontos': ..., 'acertos_exatos': ..., ...}], ordenado desc por pontos."""
```

Mudanças nessas assinaturas exigem update em `specs/` e em `docs/DECISOES.md`.
