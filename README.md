# Bolão da Copa 2026 — versão IA

Plataforma própria, em Python, para registrar e ranquear palpites de modelos de
IA (ChatGPT, Gemini, Grok, Claude, DeepSeek, ...) na Copa do Mundo FIFA 2026.

> O bolão dos humanos roda em paralelo no [Dacopa](https://dacopa.com) —
> este repo cobre apenas o **Bolão das IAs**. Detalhes em `docs/00_OBJETIVO.md`.

## Ranking ao vivo

Print do ranking aparece aqui assim que a Copa começar (11/06/2026).

```
[ placeholder — substituir por screenshot de web/index.html após a 1ª rodada ]
```

URL pública (opcional, post-fase-de-grupos): a definir em `docs/DECISOES.md`.

## Quickstart (5 passos)

```bash
# 1. clonar e entrar no diretório
git clone https://github.com/<user>/bolao-da-copa.git
cd "bolao-da-copa"

# 2. criar e ativar a venv (Windows com Git Bash)
python -m venv .venv && source .venv/Scripts/activate

# 3. instalar deps (modo editável + extras de dev)
pip install -e ".[dev]"

# 4. checar ambiente (Python 3.11+, shims no PATH no Windows)
scripts/check_env.sh

# 5. rodar o ciclo completo em estado vazio (smoke test)
python -m bolao rodada
```

Em Mac/Linux troque `source .venv/Scripts/activate` por
`source .venv/bin/activate`.

## Como funciona

Coleta de palpites por **duas vias paralelas**:

- **Web manual** — Tier 1 (16 IAs top com web search nativa). Cola o
  prompt `config/prompts/ia-palpiteira-web.md` em cada chat e salva em
  `data/palpites_ias/<slug>-web.md`.
- **API OpenRouter** — ~80 IAs em uma chamada:

  ```bash
  python -m bolao coletar --tier all --dry-run    # lista quem entra
  python -m bolao coletar --tier all              # coleta de fato
  ```

  Requer `OPENROUTER_API_KEY` em `config/.env` (ver
  `config/.env.example`). O coletor anexa o **dossiê padronizado**
  (`data/dossie/<rodada>.md`) ao prompt e salva resposta direto em
  `data/palpites_ias/<slug>.md`.

Após cada rodada:

1. Edita `data/resultados/jogos.md` preenchendo `Gols A` e `Gols B`.
2. Roda `python -m bolao rodada` — parse + scoring + ranking + resumo
   em < 30s. Atualiza `web/index.html` e `resumo.txt`.
3. (Opcional) `git push` pra atualizar GitHub Pages.

Manual passo a passo durante a Copa: **[`docs/USO.md`](docs/USO.md)**.
Lista de IAs e cobertura por via: **[`docs/IAS_PARTICIPANTES.md`](docs/IAS_PARTICIPANTES.md)**.

## Regras de pontuação (clássicas)

| Acerto | Pontos |
|---|---|
| Placar exato | 10 |
| Vencedor + saldo de gols | 7 |
| Vencedor (sem saldo) | 5 |
| Empate sem placar exato | 5 |
| Errado | 0 |

Mata-mata vale **2×**. Vale o tempo regulamentar (90 min); prorrogação e
pênaltis são ignorados pro placar. Detalhes e casos de borda em
[`docs/02_REGRAS_DE_NEGOCIO.md`](docs/02_REGRAS_DE_NEGOCIO.md).

## Stack

- Python 3.11+ (stdlib + Jinja2)
- pytest + ruff + mypy
- HTML estático + Tailwind via CDN
- Sem servidor, sem banco, sem login

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `src/bolao/` | Pipeline Python (parser, scoring, ranking, CLI) |
| `data/` | Fonte de verdade: jogos, palpites das IAs, resultados |
| `web/` | HTML estático do ranking |
| `config/prompts/` | Prompt enviado pras IAs (versionado) |
| `docs/` | Especificação completa (objetivo, arquitetura, regras...) |
| `tests/` | Suíte pytest |
| `scripts/` | Scripts shell de orquestração e diagnóstico |
| `.claude/agents/` | Especialistas multi-agente do plugin `multiagentes-giordano` |

## FAQ

**E se uma IA recusar palpitar?**
Sem drama: a IA fica sem arquivo em `data/palpites_ias/`, não aparece no
ranking, e a gente segue. Você pode tentar reformular o prompt (sem mudar
as regras de pontuação) ou trocar pra outro modelo da mesma família.

**E se uma IA palpitar só parte dos jogos?**
Os jogos sem palpite contam 0 pontos e não entram no contador
"jogos palpitados". A IA participa normalmente — só fica em desvantagem
nos jogos que pulou.

**E se eu errei de digitar um resultado?**
Edita `data/resultados/jogos.md` corrigindo `Gols A`/`Gols B` e roda
`python -m bolao rodada` de novo. O ranking é regenerado do zero a cada
execução (sem estado incremental), então qualquer correção propaga
automaticamente.

**E se uma IA quiser trocar o palpite no dia do jogo?**
O parser bloqueia edições com `mtime > horário do jogo - 1h` (regra I4 em
`02_REGRAS_DE_NEGOCIO.md`). Mexa em `data/palpites_ias/<slug>.md` só até
1h antes do apito inicial. Histórico fica em
`data/palpites_ias/historico/`.

**Como adicionar uma nova IA durante a Copa?**
Coloca o arquivo `data/palpites_ias/<slug-nova-ia>.md` e roda
`python -m bolao rodada`. Atenção: ela só pontua nos jogos que ainda não
começaram (regra de lock). Os já jogados ficam como "sem palpite".

**Prorrogação e pênaltis contam?**
Não pro placar. O palpite é avaliado contra o tempo regulamentar
(90 min). Em mata-mata, quem se classificou via pênaltis é registrado
em comentário lateral pra apuração de "vencedor do mata-mata", mas não
muda os pontos do palpite.

**Posso rodar isso no meu computador também?**
Pode. Tudo offline, tudo em arquivo. Só clonar, instalar deps e rodar
`python -m bolao rodada`. Sem necessidade de chave de API, conta em
nuvem, ou banco.

## Multi-agente

Este projeto usa o plugin `multiagentes-giordano` (sessões persistentes,
dashboard tmux):

```bash
scripts/spawn.sh pipeline-dev
scripts/open_dashboard.sh        # tmux (Linux/macOS)
scripts/watch_logs.sh            # alternativa Windows
scripts/drive.sh pipeline-dev "<prompt>"
```

Detalhes em [`CLAUDE.md`](CLAUDE.md) e [`docs/08_FASES.md`](docs/08_FASES.md).

## Licença

Uso pessoal e educacional. Sem código de terceiros embutido. Conteúdo
gerado pelas IAs participantes pertence aos respectivos provedores
(OpenAI, Google, Anthropic, xAI, DeepSeek). Tabela de jogos é informação
pública FIFA.
