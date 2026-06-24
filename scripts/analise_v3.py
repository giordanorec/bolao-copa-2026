#!/usr/bin/env python3
"""Analise v2 x v3: quem mudou de palpite nos 8 jogos da 3a rodada (I/J/K/L).

Le data/palpites_v2/ e data/palpites_v3/, compara os 8 jogos (61, 62, 67, 68,
69, 70, 71, 72) por IA. Classifica cada mudanca e agrega consenso por jogo.
Imprime um relatorio em Markdown no stdout (e grava data/analise_v3.md).

Nao toca em nada do fluxo publico.
"""

from __future__ import annotations

import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

V3_JOGOS = [61, 62, 67, 68, 69, 70, 71, 72]
JOGOS_PATH = ROOT / "data" / "jogos.md"
V2_DIR = ROOT / "data" / "palpites_v2"
V3_DIR = ROOT / "data" / "palpites_v3"
SAIDA = ROOT / "data" / "analise_v3.md"


def _sinal(ga: int, gb: int) -> str:
    if ga > gb:
        return "A"
    if gb > ga:
        return "B"
    return "E"


def _classificar(v2, v3) -> str:
    """v2/v3 = (ga, gb) ou None."""
    if v2 is None and v3 is None:
        return "sem dado"
    if v2 is None:
        return "novo (sem v2)"
    if v3 is None:
        return "sumiu (sem v3)"
    if v2 == v3:
        return "manteve"
    s2, s3 = _sinal(*v2), _sinal(*v3)
    if s2 != s3:
        return "virou resultado"
    return "mesmo resultado, placar diferente"


def main() -> int:
    from bolao.parser import carregar_jogos, carregar_palpites, take_errors

    jogos = carregar_jogos(JOGOS_PATH)
    take_errors()
    jpn = {j.numero: j for j in jogos}

    v2 = carregar_palpites(V2_DIR)
    take_errors()
    v3 = carregar_palpites(V3_DIR)
    take_errors()

    slugs = sorted(set(v2) | set(v3))

    def pal(d, slug, n):
        for p in d.get(slug, []):
            if p.jogo_numero == n:
                return (p.gols_a, p.gols_b)
        return None

    linhas: list[str] = []
    linhas.append("# Análise v2 × v3 — 3ª rodada dos Grupos I, J, K, L")
    linhas.append("")
    linhas.append(f"IAs com palpite v3: **{len(v3)}** · com palpite v2: **{len(v2)}**")
    linhas.append("")

    # --- Por IA: quantos jogos mudou ---
    mudou_alguma = 0
    total_mudancas = 0
    detalhe_por_ia: list[tuple[str, int, list[str]]] = []
    for slug in slugs:
        if slug not in v3:
            continue
        mudancas_ia: list[str] = []
        for n in V3_JOGOS:
            p2 = pal(v2, slug, n)
            p3 = pal(v3, slug, n)
            cls = _classificar(p2, p3)
            if cls in ("virou resultado", "mesmo resultado, placar diferente"):
                j = jpn.get(n)
                ta = j.time_a if j else "?"
                tb = j.time_b if j else "?"
                a2 = f"{p2[0]}×{p2[1]}" if p2 else "—"
                a3 = f"{p3[0]}×{p3[1]}" if p3 else "—"
                tag = "↺" if cls == "virou resultado" else "·"
                mudancas_ia.append(f"{tag} J{n} {ta}×{tb}: {a2} → {a3}")
        if mudancas_ia:
            mudou_alguma += 1
            total_mudancas += len(mudancas_ia)
        detalhe_por_ia.append((slug, len(mudancas_ia), mudancas_ia))

    linhas.append("## Resumo")
    linhas.append("")
    linhas.append(f"- IAs que mudaram ≥1 palpite: **{mudou_alguma}** de {len(v3)}")
    linhas.append(
        f"- Total de palpites alterados: **{total_mudancas}** (de {len(v3) * 8} possíveis)"
    )
    linhas.append("")

    # --- Por jogo: consenso v2 vs v3 ---
    linhas.append("## Consenso por jogo (modal v2 → modal v3)")
    linhas.append("")
    linhas.append(
        "| Jogo | Confronto | Modal v2 | Modal v3 | Vencedor modal v2 | Vencedor modal v3 |"
    )
    linhas.append("|---|---|---|---|---|---|")
    for n in V3_JOGOS:
        j = jpn.get(n)
        ta = j.time_a if j else "?"
        tb = j.time_b if j else "?"
        c2 = Counter()
        c3 = Counter()
        s2c = Counter()
        s3c = Counter()
        for slug in slugs:
            p2 = pal(v2, slug, n)
            p3 = pal(v3, slug, n)
            if p2:
                c2[p2] += 1
                s2c[_sinal(*p2)] += 1
            if p3 and slug in v3:
                c3[p3] += 1
                s3c[_sinal(*p3)] += 1
        m2 = c2.most_common(1)[0] if c2 else (("—",), 0)
        m3 = c3.most_common(1)[0] if c3 else (("—",), 0)
        m2s = f"{m2[0][0]}×{m2[0][1]} ({m2[1]})" if c2 else "—"
        m3s = f"{m3[0][0]}×{m3[0][1]} ({m3[1]})" if c3 else "—"
        sv2 = s2c.most_common(1)[0][0] if s2c else "—"
        sv3 = s3c.most_common(1)[0][0] if s3c else "—"
        nome = {"A": ta, "B": tb, "E": "Empate"}
        linhas.append(
            f"| {n} | {ta} × {tb} | {m2s} | {m3s} | {nome.get(sv2, sv2)} | {nome.get(sv3, sv3)} |"
        )
    linhas.append("")

    # --- Detalhe por IA (só quem mudou) ---
    linhas.append("## Mudanças por IA")
    linhas.append("")
    linhas.append(
        "Legenda: ↺ = inverteu resultado (vencedor/empate) · · = mesmo resultado, placar diferente"
    )
    linhas.append("")
    for slug, qtd, mudancas in sorted(detalhe_por_ia, key=lambda t: -t[1]):
        if qtd == 0:
            continue
        linhas.append(f"### {slug} — {qtd} mudança(s)")
        for m in mudancas:
            linhas.append(f"- {m}")
        linhas.append("")

    # --- IAs que mantiveram tudo ---
    mantiveram = [s for s, q, _ in detalhe_por_ia if q == 0]
    linhas.append(f"## IAs que mantiveram os 8 palpites ({len(mantiveram)})")
    linhas.append("")
    linhas.append(", ".join(mantiveram) if mantiveram else "(nenhuma)")
    linhas.append("")

    texto = "\n".join(linhas)
    SAIDA.write_text(texto, encoding="utf-8")
    print(texto)
    print(f"\n(relatório salvo em {SAIDA})", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
