"""Testes do parser de jogos, palpites e resultados.

Cobre: parse completo das fixtures, rejeição de palpite inválido (`gols_a="um"`),
range fora do permitido, e regra de lock por mtime (invariante I4).
"""

from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest
from _paths import (
    JOGOS_MINI,
    JOGOS_OFICIAL,
    PALPITES_DIR,
    RESULTADOS_MINI,
)
from bolao.parser import carregar_jogos, carregar_palpites, carregar_resultados

# ---------------------------------------------------------------------------
# carregar_jogos
# ---------------------------------------------------------------------------


def test_carregar_jogos_mini_lista_5_jogos_ordenados() -> None:
    jogos = carregar_jogos(JOGOS_MINI)
    assert len(jogos) == 5
    numeros = [j.numero for j in jogos]
    assert numeros == sorted(numeros), "jogos não estão ordenados por numero"
    assert numeros == [1, 2, 3, 89, 104]


def test_carregar_jogos_mini_fases_corretas() -> None:
    jogos = {j.numero: j for j in carregar_jogos(JOGOS_MINI)}
    assert jogos[1].fase == "Grupo A"
    assert jogos[3].fase == "Grupo B"
    assert jogos[89].fase == "Oitavas"
    assert jogos[104].fase == "Final"


def test_carregar_jogos_mini_times_preservados() -> None:
    jogos = {j.numero: j for j in carregar_jogos(JOGOS_MINI)}
    assert jogos[1].time_a == "México"
    assert jogos[1].time_b == "África do Sul"
    assert jogos[104].time_a == "Venc. J101"


@pytest.mark.skipif(not JOGOS_OFICIAL.exists(), reason="data/jogos.md ainda não existe")
def test_invariante_I1_data_oficial_tem_104_jogos_unicos() -> None:
    """Invariante I1: numeração FIFA cobre 1-104, sem repetidos."""
    jogos = carregar_jogos(JOGOS_OFICIAL)
    numeros = [j.numero for j in jogos]
    assert len(numeros) == 104, f"esperado 104 jogos, encontrei {len(numeros)}"
    assert sorted(numeros) == list(range(1, 105)), "numeração não cobre 1..104"


# ---------------------------------------------------------------------------
# carregar_palpites
# ---------------------------------------------------------------------------


def test_carregar_palpites_mini_dois_slugs_extraidos() -> None:
    palpites = carregar_palpites(PALPITES_DIR)
    assert set(palpites.keys()) == {"chatgpt-mini", "gemini-mini"}


def test_carregar_palpites_chatgpt_mini_tem_5_palpites_validos() -> None:
    palpites = carregar_palpites(PALPITES_DIR)
    chatgpt = palpites["chatgpt-mini"]
    assert len(chatgpt) == 5
    p1 = next(p for p in chatgpt if p.jogo_numero == 1)
    assert p1.gols_a == 2 and p1.gols_b == 0
    assert p1.ia == "chatgpt-mini"


def test_carregar_palpites_gemini_mini_pula_jogos_sem_palpite() -> None:
    """Gemini-mini deixou jogos 89 e 104 em branco — não devem virar Palpite."""
    palpites = carregar_palpites(PALPITES_DIR)
    gemini = palpites["gemini-mini"]
    numeros_palpitados = {p.jogo_numero for p in gemini}
    assert numeros_palpitados == {
        1,
        2,
        3,
    }, f"esperado palpites só de 1,2,3; veio {numeros_palpitados}"


def test_palpite_invalido_gols_a_texto_rejeitado(tmp_path: Path) -> None:
    """gols_a='um' (não-inteiro) → palpite descartado, parser não derruba."""
    arquivo = tmp_path / "broken-ia.md"
    arquivo.write_text(
        "# Palpites broken\n\n"
        "| Jogo | Fase | Data | Hora | Local | Time A | Gols A | Gols B | Time B |\n"
        "|---|---|---|---|---|---|---|---|---|\n"
        "| 1 | Grupo A | Qui 11/06 | 16h00 | Local | A | um | 0 | B |\n"
        "| 2 | Grupo A | Qui 11/06 | 23h00 | Local | A | 1 | 1 | B |\n",
        encoding="utf-8",
    )
    palpites = carregar_palpites(tmp_path)
    broken = palpites.get("broken-ia", [])
    numeros = {p.jogo_numero for p in broken}
    # Jogo 1 (inválido) descartado; jogo 2 (válido) sobrevive
    assert 1 not in numeros
    assert 2 in numeros


@pytest.mark.parametrize("valor_invalido", ["-1", "99", "-5", "16"])
def test_palpite_fora_do_range_0_a_15_rejeitado(tmp_path: Path, valor_invalido: str) -> None:
    """Inteiros fora de [0, 15] devem ser tratados como sem palpite."""
    arquivo = tmp_path / "outlier-ia.md"
    arquivo.write_text(
        "# Palpites outlier\n\n"
        "| Jogo | Fase | Data | Hora | Local | Time A | Gols A | Gols B | Time B |\n"
        "|---|---|---|---|---|---|---|---|---|\n"
        f"| 1 | Grupo A | Qui 11/06 | 16h00 | Local | A | {valor_invalido} | 0 | B |\n"
        "| 2 | Grupo A | Qui 11/06 | 23h00 | Local | A | 1 | 1 | B |\n",
        encoding="utf-8",
    )
    palpites = carregar_palpites(tmp_path)
    outlier = palpites.get("outlier-ia", [])
    numeros = {p.jogo_numero for p in outlier}
    assert 1 not in numeros, f"palpite com gols_a={valor_invalido!r} deveria ser rejeitado"
    assert 2 in numeros


def test_palpite_negativo_em_gols_b_rejeitado(tmp_path: Path) -> None:
    """Simétrico: negativo no time B também é rejeitado."""
    arquivo = tmp_path / "neg-ia.md"
    arquivo.write_text(
        "# Palpites neg\n\n"
        "| Jogo | Fase | Data | Hora | Local | Time A | Gols A | Gols B | Time B |\n"
        "|---|---|---|---|---|---|---|---|---|\n"
        "| 1 | Grupo A | Qui 11/06 | 16h00 | Local | A | 2 | -1 | B |\n",
        encoding="utf-8",
    )
    palpites = carregar_palpites(tmp_path)
    assert palpites.get("neg-ia", []) == []


def test_lock_por_mtime_rejeita_palpite_editado_apos_inicio(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Invariante I4: palpite com mtime > hora_jogo - 1h é descartado.

    Configuração: o jogo 1 começa em 11/06/2026 16:00 BRT. Forçamos o mtime
    do arquivo de palpite para 11/06/2026 16:30 BRT (depois do início), e
    esperamos que o palpite do jogo 1 seja descartado.

    Se a assinatura atual de `carregar_palpites` não recebe `jogos` para
    cruzar a hora, esse teste vai falhar — sinalizando pro pipeline-dev que
    a função precisa de uma extensão (ou um helper separado). Anotado no
    report do qa-tester.
    """
    arquivo = tmp_path / "tarde-ia.md"
    arquivo.write_text(
        "# Palpites atrasados\n\n"
        "| Jogo | Fase | Data | Hora | Local | Time A | Gols A | Gols B | Time B |\n"
        "|---|---|---|---|---|---|---|---|---|\n"
        "| 1 | Grupo A | Qui 11/06 | 16h00 | Local | A | 2 | 0 | B |\n",
        encoding="utf-8",
    )

    brt = timezone(timedelta(hours=-3))
    mtime_tardio = datetime(2026, 6, 11, 16, 30, tzinfo=brt).timestamp()
    monkeypatch.setattr(os.path, "getmtime", lambda _p: mtime_tardio)

    jogos = carregar_jogos(JOGOS_MINI)
    try:
        palpites = carregar_palpites(tmp_path, jogos=jogos)
    except TypeError:
        # Fallback: API ainda não recebe `jogos`. Esse teste vira blocker
        # documentado no report até pipeline-dev estender a assinatura.
        pytest.fail(
            "carregar_palpites(dir, jogos=...) ainda não suporta o lock por mtime — "
            "precisa estender a assinatura conforme docs/02_REGRAS, invariante I4."
        )

    tardes = palpites.get("tarde-ia", [])
    numeros = {p.jogo_numero for p in tardes}
    assert 1 not in numeros, "palpite editado após o jogo começar deveria ser rejeitado"


# ---------------------------------------------------------------------------
# carregar_resultados
# ---------------------------------------------------------------------------


def test_carregar_resultados_mini_apenas_apurados() -> None:
    """3 dos 5 jogos têm Gols A/B preenchidos — só esses devem virar Resultado."""
    resultados = carregar_resultados(RESULTADOS_MINI)
    numeros = {r.jogo_numero for r in resultados}
    assert numeros == {1, 2, 3}, f"esperado {{1,2,3}}, veio {numeros}"


def test_carregar_resultados_valores_corretos() -> None:
    resultados = {r.jogo_numero: r for r in carregar_resultados(RESULTADOS_MINI)}
    assert resultados[1].gols_a == 2 and resultados[1].gols_b == 0
    assert resultados[2].gols_a == 0 and resultados[2].gols_b == 0
    assert resultados[3].gols_a == 3 and resultados[3].gols_b == 1
