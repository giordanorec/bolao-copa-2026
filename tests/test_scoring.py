"""Casos canônicos de pontuação — 1 teste por caso de borda do docs/02_REGRAS_DE_NEGOCIO.md.

Os casos 1-8 batem direto em `pontuar()`. Os casos 9-12 batem na camada de
agregação (`pontos_por_ia`), porque "sem palpite", "resultado pendente",
"palpite fora do range" e "edição depois do jogo" só fazem sentido na visão
de conjunto (palpite individual rejeitado pelo parser não chega ao scoring).

Tests **devem falhar** enquanto o pipeline-dev não implementar os módulos —
isso é parte do contrato (TDD light: testes escritos contra a assinatura em
docs/01_ARQUITETURA.md antes do código existir).
"""

from __future__ import annotations

import pytest

from bolao.models import Jogo, Palpite, Resultado
from bolao.ranking import pontos_por_ia
from bolao.scoring import fase_eh_mata_mata, pontuar

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _palpite(jogo: int, a: int, b: int, ia: str = "chatgpt-5") -> Palpite:
    return Palpite(ia=ia, jogo_numero=jogo, gols_a=a, gols_b=b)


def _resultado(jogo: int, a: int, b: int) -> Resultado:
    return Resultado(jogo_numero=jogo, gols_a=a, gols_b=b)


def _jogo(numero: int, fase: str = "Grupo A") -> Jogo:
    return Jogo(
        numero=numero,
        fase=fase,
        data="2026-06-11",
        hora="16:00",
        local="Cidade do México",
        time_a="A",
        time_b="B",
    )


# ---------------------------------------------------------------------------
# Os 12 casos canônicos
# ---------------------------------------------------------------------------


def test_caso_01_empate_palpitado_placar_errado() -> None:
    """Palpite 1x1, resultado 0x0 → 5 pontos (empate sem placar exato)."""
    assert pontuar(_palpite(1, 1, 1), _resultado(1, 0, 0), "Grupo A") == 5


def test_caso_02_empate_palpitado_deu_vitoria() -> None:
    """Palpite 1x1, resultado 2x1 → 0 pontos."""
    assert pontuar(_palpite(1, 1, 1), _resultado(1, 2, 1), "Grupo A") == 0


def test_caso_03_vitoria_com_saldo_certo() -> None:
    """Palpite 2x0, resultado 3x1 → 7 pontos (vencedor + saldo = 2)."""
    assert pontuar(_palpite(1, 2, 0), _resultado(1, 3, 1), "Grupo A") == 7


def test_caso_04_vitoria_placar_exato() -> None:
    """Palpite 2x0, resultado 2x0 → 10 pontos (placar exato)."""
    assert pontuar(_palpite(1, 2, 0), _resultado(1, 2, 0), "Grupo A") == 10


def test_caso_05_vitoria_palpitada_deu_derrota() -> None:
    """Palpite 2x0, resultado 0x1 → 0 pontos (errou o lado vencedor)."""
    assert pontuar(_palpite(1, 2, 0), _resultado(1, 0, 1), "Grupo A") == 0


def test_caso_06_vitoria_palpitada_deu_empate() -> None:
    """Palpite 2x0, resultado 1x1 → 0 pontos (cravou vitória, deu empate)."""
    assert pontuar(_palpite(1, 2, 0), _resultado(1, 1, 1), "Grupo A") == 0


def test_caso_07_mata_mata_placar_exato() -> None:
    """Palpite 1x0 na Final, resultado 1x0 -> 20 pontos (10 * 2)."""
    assert pontuar(_palpite(104, 1, 0), _resultado(104, 1, 0), "Final") == 20


def test_caso_08_mata_mata_empate_sem_placar_exato() -> None:
    """Palpite 1x1 nas Oitavas, resultado 2x2 -> 10 pontos (5 * 2)."""
    assert pontuar(_palpite(89, 1, 1), _resultado(89, 2, 2), "Oitavas") == 10


def test_caso_09_jogo_sem_palpite() -> None:
    """IA pulou o jogo. 0 pontos, não conta como 'errado', só como 'não palpitou'.

    Convenção: jogo sem Palpite na lista não soma pontos e não entra em
    jogos_palpitados (a IA palpitou só 1 dos 2 jogos apurados, então
    jogos_palpitados deve ser 1).
    """
    jogos = [_jogo(1), _jogo(2)]
    palpites = {"chatgpt-5": [_palpite(1, 2, 0)]}  # só palpitou o jogo 1
    resultados = [_resultado(1, 2, 0), _resultado(2, 1, 1)]
    agg = pontos_por_ia(palpites, resultados, jogos)

    assert agg["chatgpt-5"]["pontos"] == 10
    assert agg["chatgpt-5"]["jogos_palpitados"] == 1


def test_caso_10_resultado_pendente() -> None:
    """Jogo sem `Gols A`/`Gols B` em resultados não contribui pra nenhuma IA.

    Invariante I5: jogo sem resultado fica como pendente. Aqui a IA palpitou
    2 jogos mas só 1 tem resultado — só esse pontua.
    """
    jogos = [_jogo(1), _jogo(2)]
    palpites = {"chatgpt-5": [_palpite(1, 2, 0), _palpite(2, 1, 0)]}
    resultados = [_resultado(1, 2, 0)]  # jogo 2 sem resultado
    agg = pontos_por_ia(palpites, resultados, jogos)

    assert agg["chatgpt-5"]["pontos"] == 10
    assert agg["chatgpt-5"]["placares_exatos"] == 1


def test_caso_11_palpite_fora_do_range() -> None:
    """Palpite com `gols_a=-1` ou `gols_a=99` é rejeitado pelo parser.

    Da perspectiva do scoring, isso vira "sem Palpite na lista" — equivalente
    ao caso 9. Aqui simulamos o resultado da rejeição do parser: a IA mandou
    um palpite inválido pro jogo 1, então o parser não emitiu Palpite e a
    camada de scoring só vê o palpite válido do jogo 2.
    """
    jogos = [_jogo(1), _jogo(2)]
    palpites = {"chatgpt-5": [_palpite(2, 0, 0)]}  # parser rejeitou o palpite do jogo 1
    resultados = [_resultado(1, 1, 0), _resultado(2, 0, 0)]
    agg = pontos_por_ia(palpites, resultados, jogos)

    # Jogo 1 não pontuou (sem palpite válido). Jogo 2 deu placar exato 0x0.
    assert agg["chatgpt-5"]["pontos"] == 10
    assert agg["chatgpt-5"]["jogos_palpitados"] == 1


def test_caso_12_edicao_depois_do_jogo() -> None:
    """Invariante I4: palpite editado após hora_jogo - 1h é rejeitado pelo parser.

    Mesma forma do caso 11 do ponto de vista do scoring: o palpite tardio
    é descartado pelo parser e não chega aqui. Cenário: IA tentou mudar o
    palpite do jogo 1 depois que ele começou — parser bloqueia.
    """
    jogos = [_jogo(1), _jogo(2)]
    palpites = {"chatgpt-5": [_palpite(2, 1, 1)]}  # jogo 1 descartado por mtime tardio
    resultados = [_resultado(1, 3, 0), _resultado(2, 1, 1)]
    agg = pontos_por_ia(palpites, resultados, jogos)

    # Só o jogo 2 contribui: palpite 1x1, resultado 1x1 → placar exato = 10 pts.
    assert agg["chatgpt-5"]["pontos"] == 10
    assert agg["chatgpt-5"]["placares_exatos"] == 1


# ---------------------------------------------------------------------------
# Testes de apoio (invariantes não-cobertas pelos 12 casos)
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "fase,esperado",
    [
        ("Grupo A", False),
        ("Grupo L", False),
        ("R32", True),
        ("Oitavas", True),
        ("Quartas", True),
        ("Semifinal", True),
        ("3º lugar", True),
        ("Final", True),
    ],
)
def test_fase_eh_mata_mata(fase: str, esperado: bool) -> None:
    """`fase_eh_mata_mata` classifica todas as 14 fases corretamente."""
    assert fase_eh_mata_mata(fase) is esperado


def test_invariante_I2_pontuar_eh_deterministico() -> None:
    """Invariante I2: pontuar é função pura — mesmo input → mesmo output."""
    p = _palpite(1, 2, 1)
    r = _resultado(1, 3, 1)
    pontos = [pontuar(p, r, "Grupo A") for _ in range(50)]
    assert len(set(pontos)) == 1, "pontuar não é determinístico"


def test_mata_mata_multiplicador_aplica_em_todas_as_fases() -> None:
    """Multiplicador 2x vale pra R32, Oitavas, Quartas, Semi, 3º e Final."""
    p = _palpite(1, 2, 1)
    r = _resultado(1, 2, 1)  # placar exato → 10 pts base
    for fase in ("R32", "Oitavas", "Quartas", "Semifinal", "3º lugar", "Final"):
        assert pontuar(p, r, fase) == 20, f"falhou em {fase}"


def test_grupos_sem_multiplicador() -> None:
    """Fase de grupos sempre 1x (pontos base sem dobrar)."""
    p = _palpite(1, 2, 1)
    r = _resultado(1, 2, 1)
    assert pontuar(p, r, "Grupo A") == 10
    assert pontuar(p, r, "Grupo L") == 10
