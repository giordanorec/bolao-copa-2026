#!/usr/bin/env bash
# Consulta a RPC pública sugestoes_pendentes() via anon e imprime
# uma linha de status. Usado pelo agente Claude no início de cada
# turno pra avisar Giordano sobre sugestões novas.
#
# Uso:  bash scripts/checar_sugestoes.sh
#
# Saída ex:
#   [sugestoes] 3 nova(s) — última 2026-06-20T22:13:11Z
#   [sugestoes] 0 — nada novo

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/v4/.env.local"
[ -f "$ENV_FILE" ] || { echo "[sugestoes] sem .env.local — pula"; exit 0; }

URL=$(grep -m1 '^NEXT_PUBLIC_SUPABASE_URL=' "$ENV_FILE" | cut -d= -f2- | tr -d '"')
KEY=$(grep -m1 '^NEXT_PUBLIC_SUPABASE_ANON_KEY=' "$ENV_FILE" | cut -d= -f2- | tr -d '"')
[ -n "$URL" ] && [ -n "$KEY" ] || { echo "[sugestoes] env vars vazias — pula"; exit 0; }

RESP=$(curl -sS --max-time 10 -X POST \
  "$URL/rest/v1/rpc/sugestoes_pendentes" \
  -H "apikey: $KEY" \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{}' 2>&1) || { echo "[sugestoes] erro curl: $RESP"; exit 0; }

# Parse simples: extrai n_novas e ultima_em do JSON [{"n_novas":N,"ultima_em":...}]
N=$(echo "$RESP" | grep -oE '"n_novas":[0-9]+' | head -1 | cut -d: -f2)
U=$(echo "$RESP" | grep -oE '"ultima_em":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$N" ]; then
  echo "[sugestoes] resposta inesperada: ${RESP:0:200}"
  exit 0
fi

if [ "$N" -gt 0 ]; then
  echo "[sugestoes] $N nova(s) — última $U"
else
  echo "[sugestoes] 0 — nada novo"
fi
