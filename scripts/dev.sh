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
  coletar)
    # Repassa argumentos extras: scripts/dev.sh coletar --tier 1 --dry-run
    shift
    # Avisa se a key não estiver presente e não for dry-run.
    if [[ ! ":$*:" == *":--dry-run:"* ]] && [[ -z "${OPENROUTER_API_KEY:-}" ]]; then
      if [[ -f config/.env ]]; then
        echo "[coletar] carregando config/.env"
        set -a; source config/.env; set +a
      fi
    fi
    if [[ -z "${OPENROUTER_API_KEY:-}" ]] && [[ ! " $* " == *" --dry-run "* ]]; then
      echo "AVISO: OPENROUTER_API_KEY ausente. Copie config/.env.example -> config/.env e preencha."
      echo "       (ou rode com --dry-run pra listar sem chamar API)"
    fi
    run python -m bolao coletar "$@"
    ;;
  check-env)
    run bash scripts/check_env.sh
    ;;
  help|-h|--help|*)
    cat <<'EOF'
Uso: scripts/dev.sh <target> [args...]

Targets:
  install     Instala deps editable + hooks pre-commit + pre-push
  test        pytest -q
  cov         pytest com cobertura (term-missing)
  lint        ruff check + ruff format --check + mypy --strict
  fmt         ruff format + ruff --fix (aplica fixes)
  serve       python -m bolao serve (http.server em web/)
  rodada      python -m bolao rodada (parse + score + ranking + resumo)
  coletar     python -m bolao coletar (carrega config/.env, valida key)
              Ex: scripts/dev.sh coletar --tier 1 --dry-run
                  scripts/dev.sh coletar --ia chatgpt-5
  check-env   diagnóstico do ambiente (Python, git, shims, OPENROUTER_API_KEY)
  help        Esta mensagem
EOF
    ;;
esac
