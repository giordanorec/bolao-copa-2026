"""Configuração do pytest. Adiciona o diretório `tests/` no sys.path para
que `_paths` (e quaisquer helpers futuros) sejam importáveis de qualquer
módulo de teste, independente de como o pytest é invocado.
"""

from __future__ import annotations

import sys
from pathlib import Path

_TESTS_DIR = Path(__file__).parent
if str(_TESTS_DIR) not in sys.path:
    sys.path.insert(0, str(_TESTS_DIR))
