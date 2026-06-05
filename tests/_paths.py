"""Caminhos para as fixtures (compartilhado entre os test_*.py).

Não é um conftest porque conftest é tratado de modo especial pelo pytest e
não pode ser importado de forma confiável por outros módulos de teste.
"""

from __future__ import annotations

from pathlib import Path

TESTS_DIR = Path(__file__).parent
FIXTURES_DIR = TESTS_DIR / "fixtures"
JOGOS_MINI = FIXTURES_DIR / "jogos_mini.md"
RESULTADOS_MINI = FIXTURES_DIR / "resultados_mini.md"
PALPITES_DIR = FIXTURES_DIR / "palpites"

REPO_ROOT = TESTS_DIR.parent
DATA_DIR = REPO_ROOT / "data"
JOGOS_OFICIAL = DATA_DIR / "jogos.md"


def id_da_ia(entry: dict[str, object]) -> str:
    """Devolve o identificador da IA num dict de ranking.

    O contrato em docs/01_ARQUITETURA.md usa 'ia'; o sample em
    F4-mvp-plataforma.md (web/data/ranking.json) usa 'slug'. Aceita os dois
    até a inconsistência ser resolvida pelo arquiteto.
    """
    valor = entry.get("slug") or entry.get("ia") or ""
    return str(valor)
