"""Projeção dos 16-avos (R32) via Monte Carlo.

Simula os 6 jogos restantes dos grupos J, K, L; resolve classificações,
ranking dos 8 melhores terceiros e alocação aos slots; e estima, por jogo
de R32, o confronto mais provável e sua probabilidade.

Modelo de gols: Poisson com lambda = (ataque_time + defesa_adversario)/2,
estimado a partir dos jogos de grupo já disputados nesta Copa.
"""

import json
import random
import re
from collections import Counter, defaultdict
from pathlib import Path

random.seed(42)
N = 50000
RAIZ = Path(__file__).resolve().parent.parent
RES = RAIZ / "data" / "resultados" / "jogos.md"

# --- parse resultados de grupo ---
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

# força (média por jogo) com leve regressão à média global 1.3
GMEAN = 1.3
forca = {}
for g in grupos:
    for t, s in grupos[g].items():
        atk = (s["gf"] + GMEAN) / (s["j"] + 1)
        dfs = (s["ga"] + GMEAN) / (s["j"] + 1)
        forca[t] = {"atk": atk, "dfs": dfs}

# jogos restantes (grupo -> [(timeA, timeB)])
RESTANTES = {
    "J": [("Argélia", "Áustria"), ("Jordânia", "Argentina")],
    "K": [("Colômbia", "Portugal"), ("Congo (RD)", "Uzbequistão")],
    "L": [("Panamá", "Inglaterra"), ("Croácia", "Gana")],
}

# slots R32: posição -> ("1A"/"2A"/"3{set}", idem)
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


def lam(a, b):
    return max(0.15, (forca[a]["atk"] + forca[b]["dfs"]) / 2)


def pois(lmbda):
    # Knuth
    import math

    L, k, p = math.exp(-lmbda), 0, 1.0
    while True:
        k += 1
        p *= random.random()
        if p <= L:
            return k - 1


def classifica(g, extra):
    """posições do grupo g dado dict extra {time: {pts,gf,ga}} acumulado."""
    tab = {}
    for t, s in grupos[g].items():
        tab[t] = dict(s)
    for t, add in extra.items():
        for k in ("pts", "gf", "ga"):
            tab[t][k] += add[k]
    ordem = sorted(
        tab.items(),
        key=lambda kv: (kv[1]["pts"], kv[1]["gf"] - kv[1]["ga"], kv[1]["gf"], random.random()),
        reverse=True,
    )
    return [t for t, _ in ordem], tab


def aloca_terceiros(qualif, rank_idx, cand):
    """qualif: set de grupos cujos 3ºs passaram. Retorna slot->grupo (matching)."""
    slots = [(sid, c) for sid, c in cand.items()]
    # mais restrito primeiro
    slots.sort(key=lambda sc: len([g for g in sc[1] if g in qualif]))
    assign = {}
    used = set()

    def bt(i):
        if i == len(slots):
            return True
        sid, c = slots[i]
        opts = [g for g in c if g in qualif and g not in used]
        opts.sort(key=lambda g: rank_idx[g])
        for g in opts:
            used.add(g)
            assign[sid] = g
            if bt(i + 1):
                return True
            used.remove(g)
            del assign[sid]
        return False

    return assign if bt(0) else None


TERC_CAND = {sid: pos[1][1:] for sid, pos in SLOTS.items() if pos[1].startswith("3")}
TERC_CAND.update({sid: pos[0][1:] for sid, pos in SLOTS.items() if pos[0].startswith("3")})

confrontos = defaultdict(Counter)
brackets = Counter()
pos_jkl = {g: {1: Counter(), 2: Counter(), 3: Counter()} for g in "JKL"}

for _ in range(N):
    posic = {}  # "1A" -> time
    # grupos completos A-I
    for g in "ABCDEFGHI":
        ordem, _ = classifica(g, {})
        for i, t in enumerate(ordem, 1):
            posic[f"{i}{g}"] = t
    # grupos J/K/L simulados
    terc_g = {}
    for g in "JKL":
        extra = defaultdict(lambda: {"pts": 0, "gf": 0, "ga": 0})
        for a, b in RESTANTES[g]:
            ga, gb = pois(lam(a, b)), pois(lam(b, a))
            extra[a]["gf"] += ga
            extra[a]["ga"] += gb
            extra[b]["gf"] += gb
            extra[b]["ga"] += ga
            if ga > gb:
                extra[a]["pts"] += 3
            elif gb > ga:
                extra[b]["pts"] += 3
            else:
                extra[a]["pts"] += 1
                extra[b]["pts"] += 1
        ordem, tab = classifica(g, extra)
        for i, t in enumerate(ordem, 1):
            posic[f"{i}{g}"] = t
            if i <= 3:
                pos_jkl[g][i][t] += 1
        terc_g[g] = (ordem[2], tab[ordem[2]])
    # ranking de terceiros (todos os 12 grupos)
    todos3 = []
    for g in "ABCDEFGHI":
        ordem, tab = classifica(g, {})
        t = ordem[2]
        s = tab[t]
        todos3.append((g, t, s["pts"], s["gf"] - s["ga"], s["gf"]))
    for g in "JKL":
        t, s = terc_g[g]
        todos3.append((g, t, s["pts"], s["gf"] - s["ga"], s["gf"]))
    todos3.sort(key=lambda x: (x[2], x[3], x[4], random.random()), reverse=True)
    qualif = set(x[0] for x in todos3[:8])
    rank_idx = {x[0]: i for i, x in enumerate(todos3)}
    terc_time = {x[0]: x[1] for x in todos3}
    assign = aloca_terceiros(qualif, rank_idx, TERC_CAND)
    if assign is None:
        continue
    brk = {}
    for sid, (pa, pb) in SLOTS.items():
        ta = terc_time[assign[sid]] if pa.startswith("3") else posic[pa]
        tb = terc_time[assign[sid]] if pb.startswith("3") else posic[pb]
        confrontos[sid][(ta, tb)] += 1
        brk[sid] = (ta, tb)
    brackets[tuple(brk[sid] for sid in sorted(SLOTS))] += 1

print(f"=== POSIÇÕES PROVÁVEIS — Grupos J/K/L (N={N}) ===")
for g in "JKL":
    print(f"\nGrupo {g}:")
    for pos in (1, 2, 3):
        top = pos_jkl[g][pos].most_common(3)
        s = "  ".join(f"{t} {100 * c / N:.0f}%" for t, c in top)
        print(f"  {pos}º: {s}")

print("\n=== BRACKET CONJUNTO MAIS PROVÁVEL + confiança marginal por jogo ===")
melhor, freq = brackets.most_common(1)[0]
print(f"(cenário conjunto = {100 * freq / N:.1f}% de todas as simulações)\n")
for i, sid in enumerate(sorted(SLOTS)):
    ta, tb = melhor[i]
    cA = sum(v for (x, _y), v in confrontos[sid].items() if x == ta)
    cB = sum(v for (_x, y), v in confrontos[sid].items() if y == tb)
    tot = sum(confrontos[sid].values())
    print(f"  J{sid}: {ta} x {tb}   (lado A {100 * cA / tot:.0f}% | lado B {100 * cB / tot:.0f}%)")

# --- JSON público: confronto provável + probabilidade por lado, por jogo ---
jogos_json = []
for i, sid in enumerate(sorted(SLOTS)):
    tot = sum(confrontos[sid].values()) or 1
    # Usa os times do bracket conjunto (internamente consistente — mesmos
    # confrontos enviados às IAs no prompt), com a probabilidade marginal
    # daquele time específico naquele lado.
    ta, tb = melhor[i]
    ca = sum(v for (x, _y), v in confrontos[sid].items() if x == ta)
    cb = sum(v for (_x, y), v in confrontos[sid].items() if y == tb)
    pa = round(100 * ca / tot)
    pb = round(100 * cb / tot)
    jogos_json.append(
        {
            "numero": sid,
            "time_a": ta,
            "prob_a": pa,
            "definido_a": pa >= 100,
            "time_b": tb,
            "prob_b": pb,
            "definido_b": pb >= 100,
            "definido": pa >= 100 and pb >= 100,
        }
    )

out = {
    "gerado_em": __import__("datetime").datetime.now().isoformat(timespec="seconds"),
    "fase": "R32",
    "n_simulacoes": N,
    "cenario_conjunto_pct": round(100 * freq / N, 1),
    "jogos": jogos_json,
}
dest = RAIZ / "v4" / "public" / "r32-projecao.json"
dest.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"\nJSON salvo em {dest}")
