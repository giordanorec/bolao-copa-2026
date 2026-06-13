"""Agregação de pontuação por IA e ranking ordenado (I3).

Só jogos com resultado registrado contam para qualquer métrica — case 10 de
``docs/02_REGRAS_DE_NEGOCIO.md``. Empates resolvidos por
(pontos desc, placares_exatos desc, vencedores_acertados desc, slug asc).
"""

from __future__ import annotations

from collections.abc import Iterable, Mapping
from typing import TypedDict

from .models import Jogo, Palpite, Resultado
from .scoring import pontuar

PalpitesInput = Mapping[str, Iterable[Palpite]] | Iterable[Palpite]


def _normalizar(palpites: PalpitesInput) -> dict[str, list[Palpite]]:
    """Aceita dict[slug, list] ou lista achatada e devolve dict[slug, list].

    O contrato de `01_ARQUITETURA.md` define list[Palpite] (cada Palpite carrega
    seu próprio `ia`); o pipeline real agrupa por slug pra performance. Aceitar
    ambos elimina fricção entre os dois usos.
    """
    if isinstance(palpites, Mapping):
        return {ia: list(lista) for ia, lista in palpites.items()}
    agrupado: dict[str, list[Palpite]] = {}
    for p in palpites:
        agrupado.setdefault(p.ia, []).append(p)
    return agrupado


class IAStats(TypedDict):
    pontos: int
    placares_exatos: int
    vencedores_acertados: int
    jogos_palpitados: int
    palpites_total: int


class RankingRow(TypedDict):
    slug: str
    pontos: int
    placares_exatos: int
    vencedores_acertados: int
    jogos_palpitados: int
    palpites_total: int


def _vencedor_acertou(palpite: Palpite, resultado: Resultado) -> bool:
    p_emp = palpite.gols_a == palpite.gols_b
    r_emp = resultado.gols_a == resultado.gols_b
    if p_emp and r_emp:
        return True
    if p_emp or r_emp:
        return False
    return (palpite.gols_a > palpite.gols_b) == (resultado.gols_a > resultado.gols_b)


def pontos_por_ia(
    palpites: PalpitesInput,
    resultados: list[Resultado],
    jogos: list[Jogo],
) -> dict[str, IAStats]:
    """Agrega total + métricas para cada IA.

    ``jogos_palpitados`` conta apenas palpites com resultado disponível
    (jogo apurado), não o total de linhas que a IA preencheu.
    """
    fase_por_numero = {j.numero: j.fase for j in jogos}
    res_por_numero = {r.jogo_numero: r for r in resultados}

    out: dict[str, IAStats] = {}
    for ia, lista in _normalizar(palpites).items():
        total = 0
        placares_exatos = 0
        vencedores_acertados = 0
        jogos_palpitados = 0
        palpites_total = len(lista)

        for p in lista:
            resultado = res_por_numero.get(p.jogo_numero)
            if resultado is None:
                continue  # case 10: jogo pendente

            fase = fase_por_numero.get(p.jogo_numero, "")
            total += pontuar(p, resultado, fase)
            jogos_palpitados += 1

            if p.gols_a == resultado.gols_a and p.gols_b == resultado.gols_b:
                placares_exatos += 1
            if _vencedor_acertou(p, resultado):
                vencedores_acertados += 1

        out[ia] = IAStats(
            pontos=total,
            placares_exatos=placares_exatos,
            vencedores_acertados=vencedores_acertados,
            jogos_palpitados=jogos_palpitados,
            palpites_total=palpites_total,
        )

    return out


def ranking_geral(
    palpites: PalpitesInput,
    resultados: list[Resultado],
    jogos: list[Jogo],
) -> list[RankingRow]:
    """Lista ordenada (I3): pontos↓, placares_exatos↓, vencedores↓, slug↑."""
    agregado = pontos_por_ia(palpites, resultados, jogos)
    linhas: list[RankingRow] = [
        RankingRow(
            slug=ia,
            pontos=m["pontos"],
            placares_exatos=m["placares_exatos"],
            vencedores_acertados=m["vencedores_acertados"],
            jogos_palpitados=m["jogos_palpitados"],
            palpites_total=m["palpites_total"],
        )
        for ia, m in agregado.items()
    ]
    linhas.sort(
        key=lambda r: (
            -r["pontos"],
            -r["placares_exatos"],
            -r["vencedores_acertados"],
            r["slug"],
        )
    )
    return linhas
