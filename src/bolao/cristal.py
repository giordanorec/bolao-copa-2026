"""Bola de Cristal — consenso de palpites de todas as IAs.

Para cada jogo, determina o placar (gols_a, gols_b) mais votado entre as IAs
com palpite válido. Em caso de empate de votos, prefere o placar com maior
soma de gols (mais "épico"). Em caso de ainda empate, escolhe o menor
lexicograficamente para determinismo.
"""

from __future__ import annotations

from collections import Counter
from typing import Any

from .models import Jogo, Palpite


def calcular_bola_de_cristal(
    palpites_por_ia: dict[str, list[Palpite]],
    jogos: list[Jogo],
) -> dict[int, dict[str, Any]]:
    """Retorna mapa jogo_numero -> resultado da Bola de Cristal.

    Retorno por jogo:
        gols_a    int  — placar consenso time A
        gols_b    int  — placar consenso time B
        votos     int  — quantas IAs escolheram esse placar
        fonte_ias list — slugs das IAs que votaram nesse placar
    """
    numeros_validos = {j.numero for j in jogos}

    # Agrupa palpites por jogo
    por_jogo: dict[int, list[tuple[str, Palpite]]] = {}
    for slug, palpites in palpites_por_ia.items():
        for p in palpites:
            if p.jogo_numero not in numeros_validos:
                continue
            por_jogo.setdefault(p.jogo_numero, []).append((slug, p))

    resultado: dict[int, dict[str, Any]] = {}
    for numero in numeros_validos:
        entradas = por_jogo.get(numero, [])
        if not entradas:
            continue

        # Conta votos por placar e registra quais IAs votaram em cada um
        contagem: Counter[tuple[int, int]] = Counter()
        ias_por_placar: dict[tuple[int, int], list[str]] = {}
        for slug, p in entradas:
            chave = (p.gols_a, p.gols_b)
            contagem[chave] += 1
            ias_por_placar.setdefault(chave, []).append(slug)

        # Desempate: (votos desc, soma desc, tuple asc para determinismo)
        vencedor = max(
            contagem,
            key=lambda k: (contagem[k], k[0] + k[1], -(k[0] * 1000 + k[1])),
        )
        resultado[numero] = {
            "gols_a": vencedor[0],
            "gols_b": vencedor[1],
            "votos": contagem[vencedor],
            "fonte_ias": sorted(ias_por_placar[vencedor]),
        }

    return resultado


__all__ = ["calcular_bola_de_cristal"]
