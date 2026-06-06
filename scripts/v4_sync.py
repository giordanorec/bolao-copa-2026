"""Sincroniza dados do v1 (pipeline Python) com o v4 (Next.js).

- Lê data/jogos.md → web/data/jogos.json (já gerado pelo pipeline atual)
- Copia web/data/jogos.json → v4/public/jogos.json
- Copia web/data/ranking.json → v4/public/ranking-ias.json

Uso:
    .venv/Scripts/python.exe scripts/v4_sync.py
"""
from __future__ import annotations

import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WEB_DATA = ROOT / "web" / "data"
V4_PUB = ROOT / "v4" / "public"


def main() -> None:
    V4_PUB.mkdir(parents=True, exist_ok=True)

    src_jogos = WEB_DATA / "jogos.json"
    if src_jogos.is_file():
        dst = V4_PUB / "jogos.json"
        shutil.copy(src_jogos, dst)
        n = len(json.loads(dst.read_text(encoding="utf-8")))
        print(f"jogos: {n} -> {dst}")
    else:
        print(f"!! falta {src_jogos}")

    src_rank = WEB_DATA / "ranking.json"
    if src_rank.is_file():
        dst = V4_PUB / "ranking-ias.json"
        shutil.copy(src_rank, dst)
        print(f"ranking IAs -> {dst}")


if __name__ == "__main__":
    main()
