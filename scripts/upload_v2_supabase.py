"""Faz upsert dos palpites v2 em public.palpite_v2 no Supabase.

Lê todos os arquivos data/palpites_v2/*.md, parseia as linhas da tabela
markdown (colunas: Jogo, Fase, Data, Hora, Local, Time A, Gols A, Gols B,
Time B) e faz upsert por (slug, jogo_numero) usando a service_role key.

Idempotente: pode ser rodado várias vezes sem duplicar registros.

Variáveis de ambiente obrigatórias (mesmo nome usado em v4/.env.example):
    SUPABASE_URL           ex.: https://dkrsxsvdihrxmehilohq.supabase.co
    SUPABASE_SERVICE_ROLE_KEY  chave service_role (bypassa RLS)

Uso:
    # exporte as vars antes (ou ponha em .env e use `export $(cat .env | xargs)`)
    export SUPABASE_URL=https://...
    export SUPABASE_SERVICE_ROLE_KEY=eyJ...
    python scripts/upload_v2_supabase.py

    # ou lendo do v4/.env.local (que tem NEXT_PUBLIC_SUPABASE_URL):
    # O script aceita NEXT_PUBLIC_SUPABASE_URL como fallback de SUPABASE_URL.
"""

from __future__ import annotations

import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
ROOT = Path(__file__).resolve().parent.parent
V2_DIR = ROOT / "data" / "palpites_v2"

SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

# Jogos válidos para v2 (fase de grupos restante)
JOGOS_V2_MIN = 41
JOGOS_V2_MAX = 72

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
_TABLE_ROW_RE = re.compile(r"^\|(.+)\|$")


def _parse_gols(valor: str) -> int | None:
    v = valor.strip()
    if not v:
        return None
    try:
        n = int(v)
    except ValueError:
        return None
    if not (0 <= n <= 20):
        return None
    return n


def parse_v2_file(path: Path) -> tuple[str, str, list[dict]]:
    """Retorna (slug, modo, registros).

    Slug é inferido do nome do arquivo (sem extensão).
    Modo é lido do header HTML comentado (<!-- modo: web -->) ou 'api'.
    Registros: lista de dicts prontos pro upsert em palpite_v2.
    """
    slug = path.stem.lower()
    modo = "api"
    registros: list[dict] = []

    text = path.read_text(encoding="utf-8")

    # Extrai modo do header (<!-- modo: web --> ou <!-- modo: api -->)
    modo_match = re.search(r"<!--\s*modo:\s*(\w+)\s*-->", text)
    if modo_match:
        modo = modo_match.group(1).strip().lower()

    # Slug explícito no header tem prioridade sobre nome do arquivo
    slug_match = re.search(r"<!--\s*slug:\s*(\S+)\s*-->", text)
    if slug_match:
        slug = slug_match.group(1).strip().lower()

    for line in text.splitlines():
        m = _TABLE_ROW_RE.match(line.strip())
        if not m:
            continue
        cells = [c.strip() for c in m.group(1).split("|")]
        if len(cells) < 9:
            continue
        # Ignora header ("Jogo") e separador ("---")
        if not cells[0] or not cells[0].lstrip("-").isdigit():
            continue
        try:
            numero = int(cells[0])
        except ValueError:
            continue
        if not (JOGOS_V2_MIN <= numero <= JOGOS_V2_MAX):
            # Ignora silenciosamente jogos fora do escopo v2
            continue
        gols_a = _parse_gols(cells[6])
        gols_b = _parse_gols(cells[7])
        if gols_a is None or gols_b is None:
            continue
        registros.append(
            {
                "slug": slug,
                "jogo_numero": numero,
                "gols_a": gols_a,
                "gols_b": gols_b,
                "modo": modo,
            }
        )

    return slug, modo, registros


def supabase_upsert(records: list[dict]) -> tuple[int, object]:
    """Faz upsert em public.palpite_v2. Retorna (status_http, body)."""
    url = f"{SUPABASE_URL}/rest/v1/palpite_v2?on_conflict=slug,jogo_numero"
    body = json.dumps(records).encode("utf-8")
    headers = {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }
    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode()
            return resp.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return e.code, json.loads(raw)
        except json.JSONDecodeError:
            return e.code, {"raw": raw}


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main() -> None:
    # Validação das vars de ambiente
    if not SUPABASE_URL:
        raise SystemExit(
            "Falta SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL).\n"
            "Exporte antes de rodar:\n"
            "  export SUPABASE_URL=https://<ref>.supabase.co\n"
            "  export SUPABASE_SERVICE_ROLE_KEY=eyJ..."
        )
    if not SERVICE_ROLE_KEY:
        raise SystemExit(
            "Falta SUPABASE_SERVICE_ROLE_KEY.\n"
            "Pegue em supabase.com/dashboard/project/<id>/settings/api → service_role\n"
            "e exporte: export SUPABASE_SERVICE_ROLE_KEY=eyJ..."
        )

    # Verifica se a pasta existe e tem arquivos
    if not V2_DIR.exists():
        print(
            f"Aviso: pasta {V2_DIR} não existe ainda.\n"
            "Rode a coleta v2 primeiro (python -m bolao coletar-v2) "
            "ou crie os arquivos manualmente."
        )
        return

    arquivos = sorted(V2_DIR.glob("*.md"))
    if not arquivos:
        print(
            f"Aviso: nenhum arquivo .md encontrado em {V2_DIR}.\n"
            "Rode a coleta v2 primeiro ou adicione os palpites manualmente."
        )
        return

    total_registros = 0
    erros: list[str] = []

    for arq in arquivos:
        slug, modo, registros = parse_v2_file(arq)
        if not registros:
            print(f"  {arq.name}: 0 registros válidos (jogos 41-72 com palpite) — pulando")
            continue

        status, resp = supabase_upsert(registros)
        if status in (200, 201):
            print(
                f"  {arq.name} ({slug}, modo={modo}): {len(registros)} registro(s) enviados [HTTP {status}]"
            )
            total_registros += len(registros)
        else:
            msg = f"  {arq.name}: ERRO HTTP {status} — {resp}"
            print(msg, file=sys.stderr)
            erros.append(msg)

    print()
    if erros:
        print(
            f"Concluido com {len(erros)} erro(s). {total_registros} registro(s) enviados com sucesso."
        )
        sys.exit(1)
    else:
        print(f"Concluido. {total_registros} registro(s) enviados para palpite_v2.")


if __name__ == "__main__":
    main()
