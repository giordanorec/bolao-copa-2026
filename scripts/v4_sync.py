"""Sincroniza dados do v1 (pipeline Python) com o v4 (Next.js).

Gera em v4/public/:
- jogos.json         (104 jogos)
- ranking-ias.json   (ranking + display names)
- bola_de_cristal.json
- palpites_por_jogo.json  ← NOVO: pra UI de "pré-preencher palpites"
- ias_dict.json      ← NOVO: slug → nome_display

Uso:
    .venv/Scripts/python.exe scripts/v4_sync.py
"""

from __future__ import annotations

import json
import shutil
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WEB_DATA = ROOT / "web" / "data"
V4_PUB = ROOT / "v4" / "public"


def _gerar_palpites_por_jogo() -> tuple[dict, dict]:
    """Roda parser do v1 e agrega palpites por jogo + dict de IAs."""
    import sys

    sys.path.insert(0, str(ROOT / "src"))
    from bolao.parser import carregar_jogos, carregar_palpites  # type: ignore

    jogos_path = ROOT / "data" / "jogos.md"
    palpites_dir = ROOT / "data" / "palpites_ias"
    jogos = carregar_jogos(jogos_path)
    palpites_dict = carregar_palpites(palpites_dir, jogos=jogos)

    # carrega ranking pra ter nomes
    ranking_path = WEB_DATA / "ranking.json"
    ias_dict: dict[str, str] = {}
    if ranking_path.is_file():
        rank = json.loads(ranking_path.read_text(encoding="utf-8"))
        for ia in rank.get("ias", []):
            slug = ia.get("slug", "")
            nome = ia.get("nome_display") or ia.get("produto") or slug
            if slug:
                ias_dict[slug] = nome

    # bola de cristal
    cristal_path = WEB_DATA / "bola_de_cristal.json"
    cristal = {}
    if cristal_path.is_file():
        cristal = json.loads(cristal_path.read_text(encoding="utf-8"))

    # agrega
    por_jogo: dict[str, dict] = {}
    for jogo in jogos:
        num = jogo.numero
        entries: dict[str, dict[str, int]] = {}
        for ia_slug, lista in palpites_dict.items():
            for p in lista:
                if p.jogo_numero == num:
                    entries[ia_slug] = {"gols_a": p.gols_a, "gols_b": p.gols_b}
                    break
        # consenso (top placares por votos)
        contador: Counter[tuple[int, int]] = Counter()
        placares_to_ias: dict[tuple[int, int], list[str]] = {}
        for slug, palp in entries.items():
            key = (palp["gols_a"], palp["gols_b"])
            contador[key] += 1
            placares_to_ias.setdefault(key, []).append(slug)
        consenso = [
            {
                "gols_a": k[0],
                "gols_b": k[1],
                "votos": v,
                "ias": placares_to_ias[k],
            }
            for k, v in sorted(
                contador.items(),
                key=lambda x: (-x[1], -(x[0][0] + x[0][1])),
            )
        ]
        por_jogo[str(num)] = {
            "palpites": entries,
            "consenso": consenso[:10],  # top 10
            "bola_de_cristal": cristal.get(str(num)),
        }
    return por_jogo, ias_dict


def main() -> None:
    V4_PUB.mkdir(parents=True, exist_ok=True)

    # 1. jogos.json
    src_jogos = WEB_DATA / "jogos.json"
    if src_jogos.is_file():
        dst = V4_PUB / "jogos.json"
        shutil.copy(src_jogos, dst)
        n = len(json.loads(dst.read_text(encoding="utf-8")))
        print(f"jogos: {n} -> {dst.name}")

    # 2. ranking-ias.json
    src_rank = WEB_DATA / "ranking.json"
    if src_rank.is_file():
        dst = V4_PUB / "ranking-ias.json"
        shutil.copy(src_rank, dst)
        print(f"ranking IAs -> {dst.name}")

    # 3. bola_de_cristal.json
    src_cristal = WEB_DATA / "bola_de_cristal.json"
    if src_cristal.is_file():
        dst = V4_PUB / "bola_de_cristal.json"
        shutil.copy(src_cristal, dst)
        n = len(json.loads(dst.read_text(encoding="utf-8")))
        print(f"bola de cristal: {n} jogos -> {dst.name}")

    # 4. palpites_por_jogo.json (NOVO)
    por_jogo, ias_dict = _gerar_palpites_por_jogo()
    out = V4_PUB / "palpites_por_jogo.json"
    out.write_text(
        json.dumps(por_jogo, ensure_ascii=False, indent=None, separators=(",", ":")),
        encoding="utf-8",
    )
    com_palpites = sum(1 for v in por_jogo.values() if v.get("palpites"))
    print(f"palpites por jogo: {com_palpites} jogos com IAs -> {out.name}")

    # 5. ias_dict.json (NOVO)
    out_ias = V4_PUB / "ias_dict.json"
    out_ias.write_text(
        json.dumps(ias_dict, ensure_ascii=False, indent=None, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"dict IAs: {len(ias_dict)} -> {out_ias.name}")


if __name__ == "__main__":
    main()
