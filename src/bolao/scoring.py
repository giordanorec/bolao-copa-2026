"""Engine de pontuação clássica: 10/7/5/5/0 + 2x nas fases de mata-mata.

Função pura ``pontuar(palpite, resultado, fase)`` — mesmo input → mesmo output
(invariante I2). Implementa os 12 casos de borda de
``docs/02_REGRAS_DE_NEGOCIO.md``.
"""

from __future__ import annotations

from .models import Palpite, Resultado

_FASES_MATA_MATA = frozenset(
    {
        "R32",
        "Oitavas",
        "Quartas",
        "Semifinal",
        "Semifinais",  # aceita variante plural
        "3º lugar",
        "Final",
    }
)


def fase_eh_mata_mata(fase: str) -> bool:
    """``True`` para R32, Oitavas, Quartas, Semifinal, 3º lugar, Final."""
    return fase.strip() in _FASES_MATA_MATA


def _pontos_base(palpite: Palpite, resultado: Resultado) -> int:
    pa, pb = palpite.gols_a, palpite.gols_b
    ra, rb = resultado.gols_a, resultado.gols_b

    if pa == ra and pb == rb:
        return 10  # placar exato

    palpite_empate = pa == pb
    resultado_empate = ra == rb

    if palpite_empate and resultado_empate:
        return 5  # ambos empate, placar diferente (case 1, 8)
    if palpite_empate != resultado_empate:
        return 0  # um cravou empate, outro não (cases 2, 6)

    # ambos têm vencedor — checa lado
    palpite_a_vence = pa > pb
    resultado_a_vence = ra > rb
    if palpite_a_vence != resultado_a_vence:
        return 0  # vencedor errado (case 5)

    if (pa - pb) == (ra - rb):
        return 7  # vencedor + saldo (case 3)

    return 5  # só vencedor


def pontuar(palpite: Palpite, resultado: Resultado, fase: str) -> int:
    """Pontos do palpite. Mata-mata vale 2x."""
    pontos = _pontos_base(palpite, resultado)
    if fase_eh_mata_mata(fase):
        pontos *= 2
    return pontos
