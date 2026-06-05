"""Parser de jogos, palpites e resultados em Markdown.

Lê tabelas no formato canônico definido em ``docs/03_SCHEMA.md``:

    | Jogo | Fase | Data | Hora | Local | Time A | Gols A | Gols B | Time B |

Erros de parse são contabilizados (``take_errors()``) e impressos em stderr no
formato ``arquivo:linha: motivo``, sem derrubar outros arquivos.
"""

from __future__ import annotations

import os
import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

from .models import Jogo, Palpite, Resultado

BRT = timezone(timedelta(hours=-3))
ANO_COPA = 2026
_TABLE_ROW_MIN_COLS = 9

_DATE_RE = re.compile(r"^[A-Za-zçÇãáéíóú]+\s+(\d{1,2})/(\d{1,2})$")
_HORA_RE = re.compile(r"^(\d{1,2})h(\d{2})$")

_error_count = 0


def take_errors() -> int:
    """Devolve e zera o contador acumulado de erros de parse."""
    global _error_count
    n = _error_count
    _error_count = 0
    return n


def _erro(arquivo: Path | str, linha: int, motivo: str) -> None:
    global _error_count
    _error_count += 1
    print(f"{arquivo}:{linha}: {motivo}", file=sys.stderr)


def _parse_table_row(line: str) -> list[str] | None:
    """Devolve as células de uma linha de dados, ou ``None`` se não for tal."""
    s = line.strip()
    if not s.startswith("|") or not s.endswith("|"):
        return None
    cells = [c.strip() for c in s.split("|")[1:-1]]
    if len(cells) < _TABLE_ROW_MIN_COLS:
        return None
    primeira = cells[0]
    if not primeira or not primeira.lstrip("-").isdigit():
        return None  # header ("Jogo") ou separador ("---")
    return cells


def _parse_data(data_md: str) -> str | None:
    m = _DATE_RE.match(data_md.strip())
    if not m:
        return None
    dia, mes = int(m.group(1)), int(m.group(2))
    if not (1 <= mes <= 12 and 1 <= dia <= 31):
        return None
    return f"{ANO_COPA:04d}-{mes:02d}-{dia:02d}"


def _parse_hora(hora_md: str) -> str | None:
    m = _HORA_RE.match(hora_md.strip())
    if not m:
        return None
    h, mi = int(m.group(1)), int(m.group(2))
    if not (0 <= h < 24 and 0 <= mi < 60):
        return None
    return f"{h:02d}:{mi:02d}"


def _parse_gols(valor: str) -> int | None:
    """Inteiro em ``[0, 15]`` ou ``None`` se vazio/inválido (regra de range)."""
    v = valor.strip()
    if not v:
        return None
    try:
        n = int(v)
    except ValueError:
        return None
    if not (0 <= n <= 15):
        return None
    return n


def _jogo_inicio_dt(jogo: Jogo) -> datetime:
    return datetime.fromisoformat(f"{jogo.data}T{jogo.hora}:00").replace(tzinfo=BRT)


def carregar_jogos(path: Path) -> list[Jogo]:
    """Lê ``data/jogos.md`` e retorna lista ordenada por ``numero``.

    O arquivo pode ter múltiplas tabelas (grupos, R32, oitavas, ...) — todas
    com a mesma estrutura de colunas são consumidas.
    """
    if not path.exists():
        _erro(path, 0, "arquivo não encontrado")
        return []

    jogos: list[Jogo] = []
    vistos: set[int] = set()
    for i, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        cells = _parse_table_row(line)
        if cells is None:
            continue
        try:
            numero = int(cells[0])
        except ValueError:
            _erro(path, i, f"número de jogo inválido: {cells[0]!r}")
            continue
        if numero in vistos:
            _erro(path, i, f"número de jogo duplicado: {numero}")
            continue

        data = _parse_data(cells[2])
        if data is None:
            _erro(path, i, f"data inválida: {cells[2]!r}")
            continue
        hora = _parse_hora(cells[3])
        if hora is None:
            _erro(path, i, f"hora inválida: {cells[3]!r}")
            continue

        fase = cells[1]
        local = cells[4]
        time_a = cells[5]
        time_b = cells[8]
        if not fase or not local or not time_a or not time_b:
            _erro(path, i, "campos obrigatórios vazios")
            continue

        jogos.append(
            Jogo(
                numero=numero,
                fase=fase,
                data=data,
                hora=hora,
                local=local,
                time_a=time_a,
                time_b=time_b,
            )
        )
        vistos.add(numero)

    jogos.sort(key=lambda j: j.numero)
    return jogos


def carregar_palpites(
    dir_path: Path,
    jogos: list[Jogo] | None = None,
) -> dict[str, list[Palpite]]:
    """Lê ``data/palpites_ias/*.md``. Slug = nome do arquivo (sem extensão).

    Se ``jogos`` for passado, aplica I4 (lock por ``mtime`` do arquivo vs.
    ``hora_jogo - 1h``): palpites para jogos cujo cutoff já passou são
    rejeitados (case 12 de ``docs/02_REGRAS_DE_NEGOCIO.md``).
    """
    if not dir_path.exists():
        return {}

    jogos_por_numero: dict[int, Jogo] = {j.numero: j for j in jogos} if jogos else {}

    out: dict[str, list[Palpite]] = {}
    for arq in sorted(dir_path.glob("*.md")):
        slug = arq.stem.lower()
        try:
            mtime_dt = datetime.fromtimestamp(os.path.getmtime(arq), tz=BRT)
        except OSError:
            mtime_dt = None

        palpites: list[Palpite] = []
        for i, line in enumerate(arq.read_text(encoding="utf-8").splitlines(), start=1):
            cells = _parse_table_row(line)
            if cells is None:
                continue
            try:
                numero = int(cells[0])
            except ValueError:
                _erro(arq, i, f"número de jogo inválido: {cells[0]!r}")
                continue

            gols_a = _parse_gols(cells[6])
            gols_b = _parse_gols(cells[7])
            if gols_a is None or gols_b is None:
                continue  # case 9 (sem palpite) ou 11 (range inválido)

            if jogos_por_numero and mtime_dt is not None:
                jogo = jogos_por_numero.get(numero)
                if jogo is not None:
                    cutoff = _jogo_inicio_dt(jogo) - timedelta(hours=1)
                    if mtime_dt > cutoff:
                        _erro(
                            arq,
                            i,
                            f"palpite rejeitado: arquivo editado após cutoff do jogo {numero}",
                        )
                        continue

            palpites.append(Palpite(ia=slug, jogo_numero=numero, gols_a=gols_a, gols_b=gols_b))

        out[slug] = palpites

    return out


def carregar_resultados(path: Path) -> list[Resultado]:
    """Lê ``data/resultados/jogos.md`` — só linhas com Gols A/B preenchidos."""
    if not path.exists():
        return []

    resultados: list[Resultado] = []
    vistos: set[int] = set()
    for i, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        cells = _parse_table_row(line)
        if cells is None:
            continue
        try:
            numero = int(cells[0])
        except ValueError:
            _erro(path, i, f"número de jogo inválido: {cells[0]!r}")
            continue

        gols_a = _parse_gols(cells[6])
        gols_b = _parse_gols(cells[7])
        if gols_a is None or gols_b is None:
            continue  # case 10: jogo ainda pendente

        if numero in vistos:
            _erro(path, i, f"resultado duplicado para jogo {numero}")
            continue

        resultados.append(Resultado(jogo_numero=numero, gols_a=gols_a, gols_b=gols_b))
        vistos.add(numero)

    return resultados
