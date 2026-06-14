# Bolão da Copa 2026

Plataforma própria para registrar palpites de modelos de IA (ChatGPT, Gemini, Grok, Claude, DeepSeek, ...) na Copa do Mundo FIFA 2026, calcular pontuação com regras clássicas, e publicar ranking ao vivo.

Duas frentes no mesmo repo:
- **Pipeline Python (v1)** — parseia palpites `.md`, pontua, ranqueia, renderiza
  HTML estático em `web/` (GitHub Pages legado).
- **App v4** — Next.js 15 + Supabase, deploy na Vercel em
  **bolao.arenadasias.com.br**. É o produto público atual (Arena de IAs). O
  pipeline alimenta o v4 via `scripts/v4_sync.py` → `v4/public/*.json`.

## ⚠️ Antes de mexer: decisões firmadas

**`docs/11_ESPECIFICACAO_PRODUTO.md` é a fonte de verdade de produto/UX.**
Muitas escolhas (ranking, páginas, Série A, mascotes, mobile, marketing) já foram
decididas pelo usuário e **não podem ser revertidas sem perguntar**. Antes de
mexer em ordenação, ranks, scoring, páginas, animações, mascotes ou tipografia,
**leia a especificação**. Atalhos do que mais foi esquecido:

- **Empates ocupam a mesma colocação** (1º, 1º, 3º — nunca 1º, 2º, 3º).
- **Mascotes só concorrem na Série A** — cards/prompts de imagem usam só o
  ranking da Série A, nunca o completo.
- **Estética dos mascotes = pelúcia realista, nada de cartoon.**
- **Mudança global vale em todas as páginas e nos 4 idiomas** (pt/en/es/fr).
- **Claude via web = "Opus 4.8"** (não 4.7).
- Resultado de jogo → seguir o **Runbook (§8 da especificação)** pra atualizar tudo.

## Objetivo

Disputar um bolão entre IAs em paralelo ao bolão humano (que roda no Dacopa, fora deste repo). Cada IA recebe o mesmo prompt e devolve uma tabela `.md`; o pipeline parseia, pontua e ranqueia. Ver `docs/00_OBJETIVO.md` para detalhes.

## Como reler o contexto

Ordem de leitura:
1. `~/.claude/CLAUDE.md` (regras globais, se existir)
2. Este arquivo
3. `docs/11_ESPECIFICACAO_PRODUTO.md` (decisões de produto firmadas — não reverter)
4. `docs/DECISOES.md` (log cronológico com o "por quê")
5. `docs/00_OBJETIVO.md` até `docs/10_PRIMEIROS_PASSOS.md`

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

## Registrar resultado de um jogo

Usuário informa em linguagem natural (ex.: "Alemanha 7 x 1 Curaçao"). Atualizar
TUDO seguindo o **Runbook §8 da especificação**. Resumo:

```bash
# 1. editar data/resultados/jogos.md (conferir ordem Time A × Time B!)
.venv/Scripts/python.exe -m bolao rodada      # 2. score + ranking + cristal + render
.venv/Scripts/python.exe scripts/v4_sync.py   # 3. sincroniza JSON pro v4/public
# 4. commit + push (Vercel + GH Pages publicam)
```

`/ranking-ias`, `/ranking-geral` (Hall da Fama) e as animações leem o mesmo
`ranking-ias.json` — atualizam juntos. **Pré-commit mexe nos HTML no meio do
commit**: o 1º commit não entra; **re-stage e faça um NOVO commit** (nunca
`--amend`).

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
