"""Testes de ranking: agregação por IA + estabilidade de ordenação.

Cobre invariante I3: empate de pontos é desempatado por
(a) placares_exatos desc, (b) vencedores_acertados desc, (c) slug asc.

Assinatura real (pipeline-dev):
    pontos_por_ia(palpites: dict[str, list[Palpite]], resultados, jogos) -> dict
    ranking_geral(palpites: dict[str, list[Palpite]], resultados, jogos) -> list
"""

from __future__ import annotations

from _paths import id_da_ia
from bolao.models import Jogo, Palpite, Resultado
from bolao.ranking import pontos_por_ia, ranking_geral


def _jogo(numero: int, fase: str = "Grupo A") -> Jogo:
    return Jogo(
        numero=numero,
        fase=fase,
        data="2026-06-11",
        hora="16:00",
        local="X",
        time_a="A",
        time_b="B",
    )


def _p(ia: str, jogo: int, a: int, b: int) -> Palpite:
    return Palpite(ia=ia, jogo_numero=jogo, gols_a=a, gols_b=b)


def _r(jogo: int, a: int, b: int) -> Resultado:
    return Resultado(jogo_numero=jogo, gols_a=a, gols_b=b)


# ---------------------------------------------------------------------------
# pontos_por_ia
# ---------------------------------------------------------------------------


def test_pontos_por_ia_agrega_por_slug() -> None:
    jogos = [_jogo(1), _jogo(2)]
    palpites = {
        "chatgpt-5": [
            _p("chatgpt-5", 1, 2, 0),  # exato → 10
            _p("chatgpt-5", 2, 1, 1),  # exato → 10
        ],
        "gemini-2-5-pro": [
            _p("gemini-2-5-pro", 1, 1, 0),  # vencedor sem saldo → 5
            _p("gemini-2-5-pro", 2, 0, 0),  # empate sem placar exato → 5
        ],
    }
    resultados = [_r(1, 2, 0), _r(2, 1, 1)]
    agg = pontos_por_ia(palpites, resultados, jogos)

    assert agg["chatgpt-5"]["pontos"] == 20
    assert agg["chatgpt-5"]["placares_exatos"] == 2
    assert agg["gemini-2-5-pro"]["pontos"] == 10
    assert agg["gemini-2-5-pro"]["placares_exatos"] == 0


def test_pontos_por_ia_vazio_retorna_dict_vazio_ou_zerado() -> None:
    """Sem palpites: dict vazio ou IAs zeradas. Ambos válidos."""
    jogos = [_jogo(1)]
    agg = pontos_por_ia({}, [], jogos)
    assert agg == {} or all(v.get("pontos", 0) == 0 for v in agg.values())


def test_pontos_por_ia_aplica_multiplicador_mata_mata() -> None:
    """Placar exato na Final vale 20, não 10."""
    jogos = [_jogo(104, fase="Final")]
    palpites = {"chatgpt-5": [_p("chatgpt-5", 104, 1, 0)]}
    resultados = [_r(104, 1, 0)]
    agg = pontos_por_ia(palpites, resultados, jogos)
    assert agg["chatgpt-5"]["pontos"] == 20


def test_jogos_palpitados_so_conta_jogos_apurados() -> None:
    """Convenção: jogos_palpitados ignora palpites sem resultado correspondente."""
    jogos = [_jogo(1), _jogo(2), _jogo(3)]
    palpites = {
        "chatgpt-5": [
            _p("chatgpt-5", 1, 2, 0),
            _p("chatgpt-5", 2, 1, 1),
            _p("chatgpt-5", 3, 0, 0),  # jogo 3 sem resultado
        ]
    }
    resultados = [_r(1, 2, 0), _r(2, 1, 1)]
    agg = pontos_por_ia(palpites, resultados, jogos)
    assert agg["chatgpt-5"]["jogos_palpitados"] == 2


# ---------------------------------------------------------------------------
# ranking_geral — invariante I3
# ---------------------------------------------------------------------------


def test_ranking_ordenado_por_pontos_desc() -> None:
    jogos = [_jogo(1)]
    palpites = {
        "a-ia": [_p("a-ia", 1, 2, 0)],  # exato → 10
        "b-ia": [_p("b-ia", 1, 1, 0)],  # vencedor sem saldo → 5
        "c-ia": [_p("c-ia", 1, 0, 2)],  # errado → 0
    }
    resultados = [_r(1, 2, 0)]
    ranking = ranking_geral(palpites, resultados, jogos)

    pontos = [e["pontos"] for e in ranking]
    assert pontos == sorted(pontos, reverse=True), "ranking não está em ordem desc"
    assert id_da_ia(ranking[0]) == "a-ia"
    assert id_da_ia(ranking[-1]) == "c-ia"


def test_ranking_desempata_por_placares_exatos() -> None:
    """Empate em pontos? IA com mais placares exatos fica acima."""
    jogos = [_jogo(1), _jogo(2)]
    # Ambas terminam com 10 pontos, mas "a-ia" tem 1 exato e "b-ia" tem 0.
    palpites = {
        "a-ia": [
            _p("a-ia", 1, 2, 0),  # exato → 10
            _p("a-ia", 2, 5, 5),  # errado → 0
        ],
        "b-ia": [
            _p("b-ia", 1, 1, 0),  # vencedor sem saldo → 5
            _p("b-ia", 2, 1, 0),  # vencedor sem saldo → 5
        ],
    }
    resultados = [_r(1, 2, 0), _r(2, 3, 0)]
    ranking = ranking_geral(palpites, resultados, jogos)

    assert [e["pontos"] for e in ranking] == [10, 10]
    assert id_da_ia(ranking[0]) == "a-ia", "quem tem mais placares exatos vai 1º"


def test_ranking_desempata_por_vencedores_acertados() -> None:
    """Empate em pontos e placares exatos? Quem acertou mais vencedores fica acima."""
    jogos = [_jogo(1), _jogo(2)]
    # Ambas: 0 placares exatos. "a-ia" acerta 1 vencedor (5pts); "b-ia" 0.
    palpites = {
        "a-ia": [
            _p("a-ia", 1, 3, 0),  # vencedor sem saldo (resultado 1x0) → 5
            _p("a-ia", 2, 5, 5),  # palpite empate, resultado 2x0 → 0
        ],
        "b-ia": [
            _p("b-ia", 1, 0, 1),  # errou o vencedor → 0
            _p("b-ia", 2, 1, 1),  # palpite empate, resultado 2x0 → 0
        ],
    }
    resultados = [_r(1, 1, 0), _r(2, 2, 0)]
    ranking = ranking_geral(palpites, resultados, jogos)

    a_entry = next(e for e in ranking if id_da_ia(e) == "a-ia")
    b_entry = next(e for e in ranking if id_da_ia(e) == "b-ia")
    assert a_entry["placares_exatos"] == b_entry["placares_exatos"] == 0
    assert a_entry["vencedores_acertados"] > b_entry["vencedores_acertados"]
    assert ranking.index(a_entry) < ranking.index(b_entry)


def test_ranking_desempate_final_por_slug_alfabetico() -> None:
    """Empate total (pontos, exatos, vencedores)? Ordem alfabética do slug."""
    jogos = [_jogo(1)]
    palpites = {
        "zeta-ia": [_p("zeta-ia", 1, 2, 0)],
        "alfa-ia": [_p("alfa-ia", 1, 2, 0)],
        "delta-ia": [_p("delta-ia", 1, 2, 0)],
    }
    resultados = [_r(1, 2, 0)]
    ranking = ranking_geral(palpites, resultados, jogos)

    slugs = [id_da_ia(e) for e in ranking]
    assert slugs == ["alfa-ia", "delta-ia", "zeta-ia"]


def test_ranking_estavel_em_chamadas_repetidas() -> None:
    """Mesmo input → mesmo output (invariante I2 + I3 juntas)."""
    jogos = [_jogo(1), _jogo(2)]
    palpites = {
        "ia-a": [_p("ia-a", 1, 2, 0), _p("ia-a", 2, 1, 1)],
        "ia-b": [_p("ia-b", 1, 2, 0)],
        "ia-c": [_p("ia-c", 1, 1, 0)],
    }
    resultados = [_r(1, 2, 0), _r(2, 1, 1)]

    r1 = ranking_geral(palpites, resultados, jogos)
    r2 = ranking_geral(palpites, resultados, jogos)
    assert [id_da_ia(e) for e in r1] == [id_da_ia(e) for e in r2]
    assert [e["pontos"] for e in r1] == [e["pontos"] for e in r2]
