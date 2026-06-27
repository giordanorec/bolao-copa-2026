"""Faz upsert dos palpites premium (v2 e v3) em public.palpite_v2 no Supabase.

Lê data/palpites_v2/*.md (versao v2, jogos 41-72) e data/palpites_v3/*.md
(versao v3, jogos 61,62,67-72), parseia as linhas da tabela markdown e faz
upsert por (slug, jogo_numero, versao) usando a service_role key.

Suporta dois schemas de tabela:
    - 9 colunas: Jogo | Fase | Data | Hora | Local | Time A | Gols A | Gols B | Time B
    - 5 colunas: Jogo | Time A | Gols A | Gols B | Time B   (algumas interfaces web)

A versão de cada arquivo vem do header `<!-- versao: vN -->`; se ausente,
cai no default da pasta (palpites_v2 -> v2, palpites_v3 -> v3).

Idempotente: pode ser rodado várias vezes sem duplicar registros.

Pré-requisito: aplicar a migration v4/sql/migrations/2026-06-24_palpite_v3.sql
(coluna `versao` + PK ampliada) antes do primeiro upload v3.

Variáveis de ambiente obrigatórias (mesmo nome usado em v4/.env.example):
    SUPABASE_URL               ex.: https://dkrsxsvdihrxmehilohq.supabase.co
    SUPABASE_SERVICE_ROLE_KEY  chave service_role (bypassa RLS)

Uso:
    export SUPABASE_URL=https://...
    export SUPABASE_SERVICE_ROLE_KEY=eyJ...
    python scripts/upload_v2_supabase.py            # v2 + v3
    python scripts/upload_v2_supabase.py --so v3    # só v3
    python scripts/upload_v2_supabase.py --so v2    # só v2

    # SUPABASE_URL aceita NEXT_PUBLIC_SUPABASE_URL como fallback.
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
V3_DIR = ROOT / "data" / "palpites_v3"
MM_DIR = ROOT / "data" / "palpites_matamata"

SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

# Jogos válidos por versão.
JOGOS_VALIDOS = {
    "v2": set(range(41, 73)),  # fase de grupos restante (41-72)
    "v3": {61, 62, 67, 68, 69, 70, 71, 72},  # 8 finais dos Grupos I/J/K/L
    "mata-mata": set(range(73, 89)),  # 16-avos (R32)
}
DEFAULT_VERSAO_POR_DIR = {V2_DIR: "v2", V3_DIR: "v3", MM_DIR: "mata-mata"}

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


def _gols_das_celulas(cells: list[str]) -> tuple[int | None, int | None]:
    """Extrai (gols_a, gols_b) tratando os schemas conhecidos.

    9 colunas (Jogo|Fase|Data|Hora|Local|TimeA|GolsA|GolsB|TimeB) -> [6], [7].
    5 colunas: a ordem varia entre interfaces (GolsA/GolsB podem estar em
    [2],[3] ou [2],[4]). Como nomes de time nunca são inteiros puros, os dois
    placares são as duas únicas células inteiras entre os índices 1..4.
    """
    if len(cells) >= 9:
        return _parse_gols(cells[6]), _parse_gols(cells[7])
    if len(cells) == 5:
        ints = [(i, _parse_gols(c)) for i, c in enumerate(cells[1:], start=1)]
        ints = [(i, v) for i, v in ints if v is not None]
        if len(ints) == 2:
            return ints[0][1], ints[1][1]
        return _parse_gols(cells[2]), _parse_gols(cells[3])
    return None, None


def parse_palpite_file(path: Path, versao_default: str) -> tuple[str, str, str, list[dict]]:
    """Retorna (slug, modo, versao, registros).

    Slug e versao vêm do header (com fallback pro nome do arquivo / pasta).
    Registros: lista de dicts prontos pro upsert em palpite_v2.
    """
    slug = path.stem.lower()
    modo = "api"
    versao = versao_default

    text = path.read_text(encoding="utf-8")

    modo_match = re.search(r"<!--\s*modo:\s*(\w+)\s*-->", text)
    if modo_match:
        modo = modo_match.group(1).strip().lower()

    slug_match = re.search(r"<!--\s*slug:\s*(\S+)\s*-->", text)
    if slug_match:
        slug = slug_match.group(1).strip().lower()

    versao_match = re.search(r"<!--\s*versao:\s*(\S+)\s*-->", text)
    if versao_match:
        versao = versao_match.group(1).strip().lower()

    jogos_ok = JOGOS_VALIDOS.get(versao, set())
    registros: list[dict] = []
    for line in text.splitlines():
        m = _TABLE_ROW_RE.match(line.strip())
        if not m:
            continue
        cells = [c.strip() for c in m.group(1).split("|")]
        if len(cells) < 5:
            continue
        if not cells[0] or not cells[0].lstrip("-").isdigit():
            continue  # header / separador / linha não-numérica
        try:
            numero = int(cells[0])
        except ValueError:
            continue
        if numero not in jogos_ok:
            continue  # fora do escopo da versão
        gols_a, gols_b = _gols_das_celulas(cells)
        if gols_a is None or gols_b is None:
            continue
        registros.append(
            {
                "slug": slug,
                "jogo_numero": numero,
                "gols_a": gols_a,
                "gols_b": gols_b,
                "modo": modo,
                "versao": versao,
            }
        )

    # Dedup por jogo mantendo o último (alguns dumps web repetem a tabela).
    por_jogo: dict[int, dict] = {}
    for r in registros:
        por_jogo[r["jogo_numero"]] = r
    return slug, modo, versao, list(por_jogo.values())


def supabase_upsert(records: list[dict]) -> tuple[int, object]:
    """Faz upsert em public.palpite_v2. Retorna (status_http, body)."""
    url = f"{SUPABASE_URL}/rest/v1/palpite_v2?on_conflict=slug,jogo_numero,versao"
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
def _dirs_alvo(argv: list[str]) -> list[Path]:
    so = None
    for i, a in enumerate(argv):
        if a == "--so" and i + 1 < len(argv):
            so = argv[i + 1].lower()
    if so == "v2":
        return [V2_DIR]
    if so == "v3":
        return [V3_DIR]
    if so in ("mata-mata", "matamata", "mm"):
        return [MM_DIR]
    return [V2_DIR, V3_DIR, MM_DIR]


def main() -> None:
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
            "Pegue em supabase.com/dashboard/project/<id>/settings/api -> service_role\n"
            "e exporte: export SUPABASE_SERVICE_ROLE_KEY=eyJ..."
        )

    total_registros = 0
    erros: list[str] = []

    for d in _dirs_alvo(sys.argv[1:]):
        if not d.exists():
            print(f"Aviso: pasta {d} não existe — pulando.")
            continue
        arquivos = sorted(d.glob("*.md"))
        if not arquivos:
            print(f"Aviso: nenhum .md em {d} — pulando.")
            continue

        versao_default = DEFAULT_VERSAO_POR_DIR.get(d, "v2")
        print(f"\n=== {d.name} (versao default={versao_default}) ===")
        for arq in arquivos:
            slug, modo, versao, registros = parse_palpite_file(arq, versao_default)
            if not registros:
                print(f"  {arq.name}: 0 registros válidos — pulando")
                continue
            status, resp = supabase_upsert(registros)
            if status in (200, 201):
                print(
                    f"  {arq.name} ({slug}, {versao}, modo={modo}): "
                    f"{len(registros)} registro(s) [HTTP {status}]"
                )
                total_registros += len(registros)
            else:
                msg = f"  {arq.name}: ERRO HTTP {status} — {resp}"
                print(msg, file=sys.stderr)
                erros.append(msg)

    print()
    if erros:
        print(
            f"Concluido com {len(erros)} erro(s). "
            f"{total_registros} registro(s) enviados com sucesso."
        )
        sys.exit(1)
    print(f"Concluido. {total_registros} registro(s) enviados para palpite_v2.")


if __name__ == "__main__":
    main()
