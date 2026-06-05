#!/usr/bin/env bash
# Alternativa cross-plataforma ao dashboard tmux: imprime cabeçalho
# de cada agente e segue (-f) o log de todos em paralelo, com prefixo
# colorido por agente. Útil em Windows onde tmux não está disponível.
#
# Uso:
#   scripts/watch_logs.sh                # segue todos os agentes em sessions.json
#   scripts/watch_logs.sh agente1 agente2  # segue só os listados
#
# Ctrl+C para sair (mata todos os tails).

set -euo pipefail
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${PROJECT_DIR}"
export PATH="${PROJECT_DIR}/scripts/bin:${PATH}"

if [[ $# -gt 0 ]]; then
    AGENTES=("$@")
else
    if [[ ! -f sessions.json ]]; then
        echo "ERRO: sessions.json não existe. Rode scripts/spawn.sh <agente> primeiro." >&2
        exit 1
    fi
    mapfile -t AGENTES < <(jq -r 'keys[]' sessions.json)
fi

if [[ ${#AGENTES[@]} -eq 0 ]]; then
    echo "ERRO: nenhum agente para acompanhar." >&2
    exit 1
fi

# Códigos ANSI 256-color
COLORS=(208 45 118 213 226 75 141 198)
PIDS=()

cleanup() {
    echo ""
    echo "→ parando tails (PIDs: ${PIDS[*]:-})..."
    for p in "${PIDS[@]:-}"; do
        kill "$p" 2>/dev/null || true
    done
    exit 0
}
trap cleanup INT TERM

echo "════════════════════════════════════════════════════════════"
echo "  watch_logs — seguindo ${#AGENTES[@]} agente(s). Ctrl+C sai."
echo "════════════════════════════════════════════════════════════"

for i in "${!AGENTES[@]}"; do
    agente="${AGENTES[$i]}"
    color="${COLORS[$((i % ${#COLORS[@]}))]}"
    log="logs/${agente}/current.log"
    mkdir -p "$(dirname "$log")"
    touch "$log"
    # tail -f cada log com prefixo colorido
    (
        tail -F -n 5 "$log" 2>/dev/null | while IFS= read -r line; do
            printf "\033[38;5;%sm[%s]\033[0m %s\n" "$color" "$agente" "$line"
        done
    ) &
    PIDS+=($!)
done

wait
