"""Calcula classificações de grupo e ranking de terceiros a partir dos
resultados registrados. Suporte à projeção dos 16-avos (R32)."""

import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
RES = RAIZ / "data" / "resultados" / "jogos.md"

linhas = RES.read_text(encoding="utf-8").splitlines()
grupos: dict[str, dict[str, dict]] = {}
jogos_por_grupo: dict[str, int] = {}

for ln in linhas:
    if not ln.strip().startswith("|"):
        continue
    cols = [c.strip() for c in ln.strip().strip("|").split("|")]
    if len(cols) < 9 or cols[0] in ("Jogo", "---") or not cols[0].isdigit():
        continue
    fase = cols[1]
    m = re.match(r"Grupo ([A-L])", fase)
    if not m:
        continue
    g = m.group(1)
    ta, ga, gb, tb = cols[5], cols[6], cols[7], cols[8]
    if not (ga.isdigit() and gb.isdigit()):
        continue
    ga, gb = int(ga), int(gb)
    grupos.setdefault(g, {})
    jogos_por_grupo[g] = jogos_por_grupo.get(g, 0) + 1
    for t in (ta, tb):
        grupos[g].setdefault(t, {"pts": 0, "gf": 0, "ga": 0, "j": 0})
    A, B = grupos[g][ta], grupos[g][tb]
    A["gf"] += ga
    A["ga"] += gb
    A["j"] += 1
    B["gf"] += gb
    B["ga"] += ga
    B["j"] += 1
    if ga > gb:
        A["pts"] += 3
    elif gb > ga:
        B["pts"] += 3
    else:
        A["pts"] += 1
        B["pts"] += 1


def ordena(times):
    return sorted(
        times.items(),
        key=lambda kv: (kv[1]["pts"], kv[1]["gf"] - kv[1]["ga"], kv[1]["gf"]),
        reverse=True,
    )


terceiros = []
print("=== CLASSIFICAÇÕES ===")
for g in sorted(grupos):
    completo = jogos_por_grupo.get(g, 0) >= 6
    tag = "COMPLETO" if completo else f"INCOMPLETO ({jogos_por_grupo[g]}/6)"
    print(f"\nGrupo {g} [{tag}]")
    tab = ordena(grupos[g])
    for i, (t, s) in enumerate(tab, 1):
        gd = s["gf"] - s["ga"]
        print(f"  {i}. {t:22} {s['pts']}pts  {s['gf']}:{s['ga']} (GD {gd:+d})  j={s['j']}")
    if completo and len(tab) >= 3:
        t, s = tab[2]
        terceiros.append((g, t, s["pts"], s["gf"] - s["ga"], s["gf"]))

print("\n=== 3ºS COLOCADOS (grupos completos) ===")
terceiros.sort(key=lambda x: (x[2], x[3], x[4]), reverse=True)
for i, (g, t, pts, gd, gf) in enumerate(terceiros, 1):
    print(f"  {i}. 3º{g}: {t:22} {pts}pts (GD {gd:+d}, GF {gf})")
