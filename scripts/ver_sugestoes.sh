#!/usr/bin/env bash
# Mostra o CONTEÚDO das sugestões não lidas (gated por token admin) e,
# opcionalmente, marca todas como lidas. Usado pelo agente Claude pra
# exibir as sugestões pro Giordano sem ele precisar entrar no banco.
#
# Uso:
#   bash scripts/ver_sugestoes.sh          # só mostra
#   bash scripts/ver_sugestoes.sh --marcar # mostra e marca como lidas

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/v4/.env.local"
[ -f "$ENV_FILE" ] || { echo "[sugestoes] sem .env.local — pula"; exit 0; }

URL=$(grep -m1 '^NEXT_PUBLIC_SUPABASE_URL=' "$ENV_FILE" | cut -d= -f2- | tr -d '"')
KEY=$(grep -m1 '^NEXT_PUBLIC_SUPABASE_ANON_KEY=' "$ENV_FILE" | cut -d= -f2- | tr -d '"')
TOKEN=$(grep -m1 '^SUGESTOES_ADMIN_TOKEN=' "$ENV_FILE" | cut -d= -f2- | tr -d '"')
[ -n "$URL" ] && [ -n "$KEY" ] && [ -n "$TOKEN" ] || { echo "[sugestoes] env vars vazias — pula"; exit 0; }

RESP=$(curl -sS --max-time 10 -X POST \
  "$URL/rest/v1/rpc/sugestoes_listar" \
  -H "apikey: $KEY" -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d "{\"p_token\":\"$TOKEN\"}" 2>&1) || { echo "[sugestoes] erro curl: $RESP"; exit 0; }

echo "$RESP" | python -c '
import sys, json
try:
    rows = json.load(sys.stdin)
except Exception as e:
    print("[sugestoes] resposta inesperada:", sys.stdin.read()[:200]); sys.exit(0)
if not isinstance(rows, list):
    print("[sugestoes] resposta inesperada:", str(rows)[:200]); sys.exit(0)
if not rows:
    print("[sugestoes] 0 nao lidas"); sys.exit(0)
print(f"[sugestoes] {len(rows)} nao lida(s):\n")
for i, r in enumerate(rows, 1):
    print(f"--- #{i}  ({r.get(\"criada_em\",\"\")}) ---")
    print(r.get("conteudo","").strip())
    c = (r.get("contato") or "").strip()
    if c:
        print(f"contato: {c}")
    print()
'

if [ "${1:-}" = "--marcar" ]; then
  MR=$(curl -sS --max-time 10 -X POST \
    "$URL/rest/v1/rpc/sugestoes_marcar_lidas" \
    -H "apikey: $KEY" -H "Authorization: Bearer $KEY" \
    -H "Content-Type: application/json" \
    -d "{\"p_token\":\"$TOKEN\"}" 2>&1) || { echo "[sugestoes] erro ao marcar: $MR"; exit 0; }
  echo "[sugestoes] marcadas como lidas: $MR"
fi
