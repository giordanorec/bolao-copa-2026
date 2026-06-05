# Bolão da Copa 2026

Plataforma própria, em Python, para registrar palpites de modelos de IA (ChatGPT, Gemini, Grok, Claude, DeepSeek, ...) na Copa do Mundo FIFA 2026, calcular pontuação com regras clássicas, e publicar ranking ao vivo em HTML estático.

## Objetivo

Disputar um bolão entre IAs em paralelo ao bolão humano (que roda no Dacopa, fora deste repo). Cada IA recebe o mesmo prompt e devolve uma tabela `.md`; o pipeline parseia, pontua e ranqueia. Ver `docs/00_OBJETIVO.md` para detalhes.

## Como reler o contexto

Ordem de leitura:
1. `~/.claude/CLAUDE.md` (regras globais, se existir)
2. Este arquivo
3. `docs/DECISOES.md` (log cronológico)
4. `docs/00_OBJETIVO.md` até `docs/10_PRIMEIROS_PASSOS.md`

## Stack

- **Python 3.11+** com stdlib + Jinja2 (templates) + pytest (testes) + ruff (lint/format) + mypy (types).
- **Dados em arquivos** (Markdown + JSON). Sem banco. Sem servidor.
- **Frontend**: HTML estático em `web/`, Tailwind via CDN.
- **Multi-agente**: este repo usa o plugin `multiagentes-giordano` (sessões persistentes, dashboard tmux).

## Como rodar

```bash
python -m venv .venv && source .venv/Scripts/activate  # Windows
pip install -e ".[dev]"
python -m bolao --help
python -m bolao rodada    # ciclo completo: parse + score + ranking + resumo
python -m bolao serve     # preview local em http://localhost:8000
pytest -q
```

## Regras de pontuação (resumo)

| Acerto | Pontos |
|---|---|
| Placar exato | 10 |
| Vencedor + saldo de gols | 7 |
| Vencedor (sem saldo) | 5 |
| Empate sem placar exato | 5 |
| Errado | 0 |

Mata-mata vale 2×. Detalhes e casos de borda em `docs/02_REGRAS_DE_NEGOCIO.md`.

## Multi-agente

- `sessions.json` — map agente → session_id
- `scripts/open_dashboard.sh` — abre grade tmux (Linux/macOS)
- `scripts/watch_logs.sh` — alternativa Windows (segue logs em prefix colorido)
- `scripts/spawn.sh <agente>` — cria sessão
- `scripts/drive.sh <agente> "<prompt>"` — manda prompt em background
- `scripts/take_over.sh <agente>` — humano assume

**Windows nota**: antes de usar qualquer script do plugin, exporte o PATH local
com os shims:
```bash
export PATH="$(pwd)/scripts/bin:$PATH"
```
(supre `jq` e `uuidgen` ausentes no Git Bash. Detalhes em `docs/DECISOES.md`.)
