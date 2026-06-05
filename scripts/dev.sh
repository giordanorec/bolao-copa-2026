#!/usr/bin/env bash
# scripts/dev.sh — entrypoint dev. Substitui Makefile pra evitar dependência de make em Windows.
# Uso: scripts/dev.sh <target>

set -euo pipefail

target="${1:-help}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Windows: garante shims no PATH (jq, uuidgen)
case "$(uname -s 2>/dev/null || echo unknown)" in
  MINGW*|MSYS*|CYGWIN*)
    export PATH="$ROOT/scripts/bin:$PATH"
    ;;
esac

run() { echo "+ $*"; "$@"; }

case "$target" in
  install)
    run python -m pip install -e ".[dev]"
    run pre-commit install
    run pre-commit install --hook-type pre-push
    ;;
  test)
    run pytest -q
    ;;
  cov)
    run pytest -q --cov=bolao --cov-report=term-missing
    ;;
  lint)
    run ruff check src tests
    run ruff format --check src tests
    run mypy --strict src
    ;;
  fmt)
    run ruff format src tests
    run ruff check --fix src tests
    ;;
  serve)
    run python -m bolao serve
    ;;
  rodada)
    run python -m bolao rodada
    ;;
  check-env)
    run bash scripts/check_env.sh
    ;;
  help|-h|--help|*)
    cat <<'EOF'
Uso: scripts/dev.sh <target>

Targets:
  install     Instala deps editable + hooks pre-commit + pre-push
  test        pytest -q
  cov         pytest com cobertura (term-missing)
  lint        ruff check + ruff format --check + mypy --strict
  fmt         ruff format + ruff --fix (aplica fixes)
  serve       python -m bolao serve (http.server em web/)
  rodada      python -m bolao rodada (parse + score + ranking + resumo)
  check-env   diagnóstico do ambiente (Python, git, shims Windows)
  help        Esta mensagem
EOF
    ;;
esac
