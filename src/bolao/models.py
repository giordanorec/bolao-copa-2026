"""Dataclasses canônicos do domínio (frozen, type-hinted).

Contratos em ``docs/01_ARQUITETURA.md``. Mudar a forma desses tipos exige
update de ``specs/`` + ``docs/DECISOES.md``.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Jogo:
    numero: int
    fase: str
    data: str  # ISO YYYY-MM-DD
    hora: str  # HH:MM (BRT)
    local: str
    time_a: str
    time_b: str


@dataclass(frozen=True)
class Palpite:
    ia: str  # slug em kebab-case
    jogo_numero: int
    gols_a: int
    gols_b: int


@dataclass(frozen=True)
class Resultado:
    jogo_numero: int
    gols_a: int
    gols_b: int
