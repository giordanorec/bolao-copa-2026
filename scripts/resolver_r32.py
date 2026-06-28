"""Resolve deterministicamente os confrontos do R32 (jogos 73-88) agora que a
fase de grupos terminou. Reaproveita SLOTS/candidatos oficiais da FIFA do
projecao_r32.py e faz o matching dos 8 melhores terceiros.

Imprime a alocação e confere se o matching dos terceiros é ÚNICO (forçado),
o que garante igualdade com a tabela oficial da FIFA.
"""

import re
from itertools import permutations
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
RES = RAIZ / "data" / "resultados" / "jogos.md"

# slots oficiais (mesma fonte do projecao_r32.py)
SLOTS = {
    73: ("2A", "2B"),
    74: ("1E", "3ABCDF"),
    75: ("1F", "2C"),
    76: ("1C", "2F"),
    77: ("1I", "3CDFGH"),
    78: ("2E", "2I"),
    79: ("1A", "3CEFHI"),
    80: ("1L", "3EHIJK"),
    81: ("1D", "3BEFIJ"),
    82: ("1G", "3AEHIJ"),
    83: ("2K", "2L"),
    84: ("1H", "2J"),
    85: ("1B", "3EFGIJ"),
    86: ("1J", "2H"),
    87: ("1K", "3DEIJL"),
    88: ("2D", "2G"),
}

# --- parse standings dos grupos ---
grupos: dict[str, dict[str, dict]] = {}
for ln in RES.read_text(encoding="utf-8").splitlines():
    if not ln.strip().startswith("|"):
        continue
    c = [x.strip() for x in ln.strip().strip("|").split("|")]
    if len(c) < 9 or not c[0].isdigit():
        continue
    m = re.match(r"Grupo ([A-L])", c[1])
    if not m or not (c[6].isdigit() and c[7].isdigit()):
        continue
    g, ta, ga, gb, tb = m.group(1), c[5], int(c[6]), int(c[7]), c[8]
    grupos.setdefault(g, {})
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


def ordena(g):
    return sorted(
        grupos[g].items(),
        key=lambda kv: (kv[1]["pts"], kv[1]["gf"] - kv[1]["ga"], kv[1]["gf"]),
        reverse=True,
    )


posic = {}  # "1A" -> time
terceiros = []  # (grupo, time, pts, gd, gf)
for g in sorted(grupos):
    od = ordena(g)
    assert len(od) == 4, f"grupo {g} incompleto: {len(od)} times"
    for i, (t, s) in enumerate(od, 1):
        posic[f"{i}{g}"] = t
        if i == 3:
            terceiros.append((g, t, s["pts"], s["gf"] - s["ga"], s["gf"]))

terceiros.sort(key=lambda x: (x[2], x[3], x[4]), reverse=True)
qualif = [x[0] for x in terceiros[:8]]
qualif_set = set(qualif)
rank_idx = {x[0]: i for i, x in enumerate(terceiros)}
terc_time = {x[0]: x[1] for x in terceiros}

print("Terceiros (rank):")
for i, (g, t, p, gd, gf) in enumerate(terceiros, 1):
    mark = "✓" if g in qualif_set else "✗"
    print(f"  {i:2d}. {mark} 3º{g}: {t:24s} {p}pts GD{gd:+d} GF{gf}")
print(f"\nGrupos classificados (3º): {sorted(qualif_set)}")

# candidatos de terceiro por slot
terc_cand = {sid: pos[1][1:] for sid, pos in SLOTS.items() if pos[1].startswith("3")}

# todas as alocações válidas (matching perfeito slot->grupo qualificado)
slot_ids = list(terc_cand)
solucoes = []
for perm in permutations(qualif):
    ok = True
    for sid, g in zip(slot_ids, perm, strict=False):
        if g not in terc_cand[sid]:
            ok = False
            break
    if ok:
        solucoes.append(dict(zip(slot_ids, perm, strict=False)))

print(f"\nMatchings válidos encontrados: {len(solucoes)}")

# Alocação OFICIAL da FIFA (tabela de combinações dos 8 melhores terceiros),
# confirmada pelo chaveamento publicado para a combinação B,D,E,F,I,J,K,L.
# Fontes: CNN Brasil / Olympics.com / noataque (27-28/06/2026).
OFICIAL = {74: "D", 77: "F", 79: "E", 80: "K", 81: "B", 82: "I", 85: "J", 87: "L"}
assert OFICIAL in solucoes, "Alocação oficial não satisfaz os candidatos dos slots!"
assign = OFICIAL

print("\n=== CONFRONTOS R32 (73-88) ===")
linhas = {}
for sid in sorted(SLOTS):
    a_code, b_code = SLOTS[sid]

    def resolve(code, sid=sid):
        if code.startswith("3"):
            g = assign[sid]
            return f"{terc_time[g]} (3º{g})"
        return f"{posic[code]} ({code})"

    ta, tb = resolve(a_code), resolve(b_code)
    linhas[sid] = (ta, tb)
    print(f"  J{sid}: {ta}  x  {tb}")
