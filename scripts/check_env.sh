#!/usr/bin/env bash
# scripts/check_env.sh — diagnóstico do ambiente local.
# Exit 0 se OK, 1 se algo essencial falta.

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

ok=0
fail=0
warn=0
msgs=()

bullet_ok()   { msgs+=("  OK    $1");   ok=$((ok+1)); }
bullet_fail() { msgs+=("  FAIL  $1"); fail=$((fail+1)); }
bullet_warn() { msgs+=("  WARN  $1"); warn=$((warn+1)); }
bullet_info() { msgs+=("  INFO  $1"); }

# --- Python 3.11+
if command -v python >/dev/null 2>&1; then
  pyver=$(python -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}')" 2>/dev/null || echo "0.0")
  pymajor=$(python -c "import sys; print(sys.version_info.major)" 2>/dev/null || echo 0)
  pyminor=$(python -c "import sys; print(sys.version_info.minor)" 2>/dev/null || echo 0)
  if [[ "$pymajor" -ge 3 && "$pyminor" -ge 11 ]]; then
    bullet_ok "python $pyver (>=3.11) em $(command -v python)"
  else
    bullet_fail "python $pyver é menor que 3.11 — instale Python 3.11+"
  fi
else
  bullet_fail "python ausente do PATH — instale Python 3.11+"
fi

# --- pip
if command -v pip >/dev/null 2>&1; then
  bullet_ok "pip $(pip --version | awk '{print $2}')"
else
  bullet_fail "pip ausente — rode: python -m ensurepip --upgrade"
fi

# --- git
if command -v git >/dev/null 2>&1; then
  bullet_ok "git $(git --version | awk '{print $3}')"
else
  bullet_fail "git ausente — instale Git"
fi

# --- Plataforma + shims Windows
uname_s="$(uname -s 2>/dev/null || echo unknown)"
case "$uname_s" in
  MINGW*|MSYS*|CYGWIN*)
    bullet_info "plataforma: Windows ($uname_s) — checando shims em scripts/bin/"
    for shim in jq uuidgen; do
      if [[ -x "$ROOT/scripts/bin/$shim" ]]; then
        bullet_ok "shim scripts/bin/$shim presente e executável"
      else
        bullet_fail "shim scripts/bin/$shim ausente ou não executável"
      fi
    done
    if [[ ":$PATH:" == *":$ROOT/scripts/bin:"* ]]; then
      bullet_ok "scripts/bin/ está no PATH"
    else
      bullet_warn "scripts/bin/ NÃO está no PATH — rode antes dos scripts do plugin multi-agente: export PATH=\"\$(pwd)/scripts/bin:\$PATH\""
    fi
    ;;
  Linux|Darwin)
    bullet_info "plataforma: $uname_s — shims Windows não necessários"
    for tool in jq uuidgen; do
      if command -v "$tool" >/dev/null 2>&1; then
        bullet_ok "$tool nativo disponível"
      else
        bullet_warn "$tool ausente — instale via gerenciador do SO se for usar plugin multi-agente"
      fi
    done
    ;;
  *)
    bullet_warn "plataforma desconhecida: $uname_s"
    ;;
esac

# --- venv
if [[ -n "${VIRTUAL_ENV:-}" ]]; then
  bullet_ok "venv ativo: $VIRTUAL_ENV"
elif [[ -d "$ROOT/.venv" ]]; then
  bullet_warn ".venv existe mas não está ativado — rode: source .venv/Scripts/activate (Windows) ou source .venv/bin/activate (Unix)"
else
  bullet_warn "nenhum venv detectado — recomendado: python -m venv .venv && source .venv/Scripts/activate"
fi

# --- Pacote bolao instalado?
if python -c "import bolao" >/dev/null 2>&1; then
  bullet_ok "pacote 'bolao' importável"
else
  bullet_warn "pacote 'bolao' não importável — rode: pip install -e \".[dev]\""
fi

# --- pre-commit instalado no repo?
if [[ -f "$ROOT/.git/hooks/pre-commit" ]] && grep -q "pre-commit" "$ROOT/.git/hooks/pre-commit" 2>/dev/null; then
  bullet_ok "hook pre-commit instalado no .git/hooks/"
else
  bullet_warn "hook pre-commit não instalado — rode: pre-commit install"
fi

# ---
printf '\n%s\n' "Diagnóstico do ambiente — Bolão da Copa 2026"
printf '%s\n' "============================================"
printf '%s\n' "${msgs[@]}"
printf '\n'

if [[ "$fail" -eq 0 ]]; then
  echo "ambiente OK ($ok checks passaram, $warn avisos)"
  exit 0
else
  echo "ambiente com $fail problema(s) essencial(is) — corrija acima"
  echo "($ok checks OK, $warn avisos)"
  exit 1
fi
