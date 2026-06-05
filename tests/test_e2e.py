"""Pipeline completo contra fixtures: parse → score → ranking → JSON.

Cobre o smoke do `python -m bolao rodada` em estado vazio (sem crash) e o
fluxo com dados — confere que a pontuação esperada bate.

Pontuação esperada nas fixtures (jogos_mini + chatgpt-mini + gemini-mini +
resultados_mini):

  jogo 1: resultado 2x0
    chatgpt-mini palpitou 2x0 → placar exato → 10 pts
    gemini-mini  palpitou 1x1 → empate palpitado, deu vitória → 0 pts
  jogo 2: resultado 0x0
    chatgpt-mini palpitou 1x1 → empate sem placar exato → 5 pts
    gemini-mini  palpitou 0x0 → placar exato → 10 pts
  jogo 3: resultado 3x1
    chatgpt-mini palpitou 3x1 → placar exato → 10 pts
    gemini-mini  palpitou 2x0 → vencedor + saldo (2) → 7 pts
  jogo 89: pendente — não contribui
  jogo 104: pendente — não contribui

Totais: chatgpt-mini = 25 (2 exatos), gemini-mini = 17 (1 exato).
"""

from __future__ import annotations

import json
from pathlib import Path

from _paths import JOGOS_MINI, PALPITES_DIR, RESULTADOS_MINI, id_da_ia

from bolao.parser import carregar_jogos, carregar_palpites, carregar_resultados
from bolao.ranking import pontos_por_ia, ranking_geral


def test_pipeline_completo_pontuacao_correta() -> None:
    jogos = carregar_jogos(JOGOS_MINI)
    palpites = carregar_palpites(PALPITES_DIR)
    resultados = carregar_resultados(RESULTADOS_MINI)

    agg = pontos_por_ia(palpites, resultados, jogos)

    assert agg["chatgpt-mini"]["pontos"] == 25
    assert agg["chatgpt-mini"]["placares_exatos"] == 2
    assert agg["gemini-mini"]["pontos"] == 17
    assert agg["gemini-mini"]["placares_exatos"] == 1


def test_pipeline_completo_ranking_ordenado() -> None:
    jogos = carregar_jogos(JOGOS_MINI)
    palpites = carregar_palpites(PALPITES_DIR)
    resultados = carregar_resultados(RESULTADOS_MINI)

    ranking = ranking_geral(palpites, resultados, jogos)
    slugs = [id_da_ia(e) for e in ranking]
    assert slugs == ["chatgpt-mini", "gemini-mini"]
    assert ranking[0]["pontos"] == 25
    assert ranking[1]["pontos"] == 17


def test_pipeline_completo_estado_vazio_nao_crasha(tmp_path: Path) -> None:
    """Smoke test: sem palpites e sem resultados, ranking sai vazio."""
    palpites_dir = tmp_path / "palpites"
    palpites_dir.mkdir()
    resultados_file = tmp_path / "resultados.md"
    resultados_file.write_text(
        "# Resultados vazio\n\n"
        "| Jogo | Fase | Data | Hora | Local | Time A | Gols A | Gols B | Time B |\n"
        "|---|---|---|---|---|---|---|---|---|\n",
        encoding="utf-8",
    )

    jogos = carregar_jogos(JOGOS_MINI)
    palpites = carregar_palpites(palpites_dir)
    resultados = carregar_resultados(resultados_file)

    ranking = ranking_geral(palpites, resultados, jogos)
    assert isinstance(ranking, list)
    assert ranking == []


def test_ranking_json_schema_compativel_com_frontend() -> None:
    """Cada entrada do ranking deve ter as chaves de métricas e ser JSON-serializável.

    Schema esperado em web/data/ranking.json (F4-mvp-plataforma.md):
        {"slug": ..., "pontos": N, "placares_exatos": N,
         "vencedores_acertados": N, "jogos_palpitados": N}

    O wrapper completo (atualizado_em, jogos_apurados, jogos_totais) é
    responsabilidade do pipeline-dev no comando `ranking`.
    """
    jogos = carregar_jogos(JOGOS_MINI)
    palpites = carregar_palpites(PALPITES_DIR)
    resultados = carregar_resultados(RESULTADOS_MINI)

    ranking = ranking_geral(palpites, resultados, jogos)

    # Round-trip JSON: garante ausência de tipos não-serializáveis.
    dump = json.dumps(ranking)
    redump = json.loads(dump)
    assert redump == ranking

    chaves_obrigatorias = {
        "pontos",
        "placares_exatos",
        "vencedores_acertados",
        "jogos_palpitados",
    }
    for entry in ranking:
        faltam = chaves_obrigatorias - set(entry.keys())
        assert not faltam, f"faltam chaves {faltam} em {entry}"
        assert id_da_ia(entry), "entrada de ranking sem slug/ia identificador"
