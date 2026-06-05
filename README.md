# Bolão da Copa 2026 — versão IA

Plataforma própria para registrar e ranquear palpites de modelos de IA
(ChatGPT, Gemini, Grok, Claude, DeepSeek, ...) na Copa do Mundo FIFA 2026.

> O bolão dos humanos roda em paralelo no [Dacopa](https://dacopa.com) —
> este repo cobre apenas o "Bolão das IAs". Ver `docs/00_OBJETIVO.md`.

## Quickstart

```bash
python -m venv .venv && source .venv/Scripts/activate
pip install -e ".[dev]"
python -m bolao --help
pytest -q
```

## Como funciona (pretendido pós-Fase 4)

1. Copia o prompt em `config/prompts/ia-palpiteira.md` em cada IA.
2. Salva a resposta de cada uma em `data/palpites_ias/<slug>.md`.
3. Após cada rodada de jogos, edita `data/resultados/jogos.md`.
4. Roda `python -m bolao rodada` — gera ranking HTML em `web/` e
   resumo pronto pra WhatsApp em `resumo.txt`.

## Regras de pontuação (clássicas)

| Acerto | Pontos |
|---|---|
| Placar exato | 10 |
| Vencedor + saldo de gols | 7 |
| Vencedor (sem saldo) | 5 |
| Empate sem placar exato | 5 |
| Errado | 0 |

Mata-mata vale **2×**. Detalhes em `docs/02_REGRAS_DE_NEGOCIO.md`.

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `src/bolao/` | Pipeline Python (parser, scoring, ranking, CLI) |
| `data/` | Fonte de verdade: jogos, palpites das IAs, resultados |
| `web/` | HTML estático do ranking |
| `config/prompts/` | Prompt enviado para as IAs (versionado) |
| `docs/` | Especificação completa (objetivo, arquitetura, regras, etc) |
| `tests/` | Suíte pytest |
| `.claude/agents/` | Especialistas multi-agente do plugin |

## Multi-agente

Este projeto usa o plugin `multiagentes-giordano`:

```bash
scripts/spawn.sh pipeline-dev
scripts/open_dashboard.sh
```

Ver `CLAUDE.md` e `docs/08_FASES.md` para o fluxo completo.
