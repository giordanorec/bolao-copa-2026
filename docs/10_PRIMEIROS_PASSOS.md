# 10 — Primeiros passos (Fase 3 — Setup)

Roteiro executado pelo Arquiteto durante o init. Para máquina limpa (futuro Giordano ou colaborador).

## Passo 1. Pré-requisitos

- Python 3.11 ou 3.12 (`python --version`).
- Git.
- Bash (Git Bash no Windows).
- (Opcional) `tmux` + `tilix` no Linux/Mac para o dashboard multi-agente; no Windows usa Windows Terminal.
- (Opcional) `gh` (GitHub CLI) para criar repo remoto.

## Passo 2. Bootstrap

```bash
# 1. clonar (ou no init: já estamos no diretório)
cd "Bolao da Copa"

# 2. (recomendado) virtualenv
python -m venv .venv
source .venv/Scripts/activate   # Windows Git Bash
# ou: source .venv/bin/activate   # Linux/Mac

# 3. instalar projeto + deps de dev
pip install -e ".[dev]"

# 4. instalar pre-commit
pre-commit install
```

## Passo 3. Smoke test

```bash
python -m bolao --help          # mostra subcomandos
python -m bolao parse           # valida data/jogos.md (deve listar 104 jogos)
pytest -q                       # roda suite (deve passar com 0 falhas)
```

Se algum dos comandos acima falhar em máquina limpa, é bug de setup — abrir issue.

## Passo 4. Primeiro uso real (a partir da Fase 5)

```bash
# 1. cole o prompt em cada IA
cat config/prompts/ia-palpiteira.md

# 2. salve a resposta de cada IA em data/palpites_ias/<slug>.md

# 3. valide
python -m bolao parse

# 4. (antes do primeiro jogo) gere ranking zerado
python -m bolao rodada

# 5. abra no browser
python -m bolao serve   # http://localhost:8000
```

## Passo 5. Ciclo durante a Copa (a partir da Fase 6)

```bash
# após cada rodada de jogos:
# 1. edite data/resultados/jogos.md preenchendo Gols A/Gols B novos

# 2. recalcule tudo
python -m bolao rodada

# 3. resumo pro WhatsApp
cat resumo.txt

# 4. (opcional) versione a rodada
git add data/resultados/jogos.md reports/ web/
git commit -m "rodada: jogos N a M"
git push   # se quiser publicar no GitHub Pages
```

## Passo 6. Multi-agente (operação interna do projeto)

```bash
# spawnar especialistas
for agente in pipeline-dev frontend-dev llm-prompt devops-installer qa-tester docs-writer; do
    scripts/spawn.sh "$agente"
done

# abrir dashboard
scripts/open_dashboard.sh

# despachar um especialista
scripts/drive.sh pipeline-dev "leia specs/F4-coleta-consolidacao.md e implemente"
```

## Passo 7. Repo GitHub

```bash
# substitua <user> pelo seu username
gh repo create <user>/bolao-copa-2026 --private --source=. --push
```

**Pendente até o Giordano confirmar o username.**
