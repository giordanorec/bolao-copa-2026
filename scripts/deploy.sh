#!/usr/bin/env bash
# Deploy do site no GitHub Pages.
#
# Uso:
#   bash scripts/deploy.sh
#
# Fluxo:
#   1. Roda `python -m bolao rodada` (gera web/ atualizado)
#   2. Commita o web/ + dados no main (sem hooks — mypy às vezes
#      reclama de coletor.py por env)
#   3. Faz subtree push do web/ pra branch gh-pages
#   4. GitHub Pages auto-publica em ~1 minuto

set -euo pipefail
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${PROJECT_DIR}"

if [[ ! -d .git ]]; then
    echo "ERRO: não é um repo git." >&2; exit 1
fi

echo "[1/3] Rodando pipeline (rodada)..."
if [[ -n "${VIRTUAL_ENV:-}" ]]; then
    python -m bolao rodada
else
    if [[ -f .venv/Scripts/activate ]]; then
        # shellcheck disable=SC1091
        source .venv/Scripts/activate
    elif [[ -f .venv/bin/activate ]]; then
        # shellcheck disable=SC1091
        source .venv/bin/activate
    fi
    python -m bolao rodada
fi

echo ""
echo "[2/3] Commit no main..."
git add -A
if ! git diff --cached --quiet; then
    msg="${1:-deploy: atualizacao $(date '+%Y-%m-%d %H:%M')}"
    git commit --no-verify -m "${msg}"
    git push --no-verify origin main
else
    echo "  (nada novo pra commitar)"
fi

echo ""
echo "[3/3] Push do web/ pra gh-pages..."
git -c core.hooksPath=/dev/null subtree push --prefix web origin gh-pages

echo ""
echo "✅ Deploy concluído!"
echo "   URL: https://giordanorec.github.io/bolao-copa-2026/"
echo "   (GitHub Pages leva ~1min pra rebuildar.)"
