"""
Analise exploratoria das IAs.

Le os JSONs do pipeline (ranking-ias, jogos, palpites_por_jogo, resultados)
e gera v4/public/analise.json com:

- Features de comportamento por IA (estilistico e de acerto)
- Matriz de similaridade entre IAs (% palpites iguais em jogos comuns)
- K-means clustering (k=4) com perfis textuais de cada cluster
- Recortes por continente (UEFA, CONMEBOL, CONCACAF, CAF, AFC, OFC)
- Recortes por favoritismo (jogos com favorito claro vs jogos equilibrados,
  onde "favorito" = >60% das IAs apostando no mesmo vencedor)

Sem dependencias externas (numpy/sklearn). K-means manual com seed fixo
pra reprodutibilidade. Roda dentro do venv do projeto.

Uso:
    .venv/Scripts/python.exe scripts/analise.py
"""

from __future__ import annotations

import json
import math
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
V4_PUBLIC = ROOT / "v4" / "public"

# Federacoes FIFA por time. 48 times da Copa 2026 mapeados a:
# CAF (Africa), CONMEBOL (Am. Sul), CONCACAF (Am. Norte/Central),
# AFC (Asia), UEFA (Europa), OFC (Oceania).
CONTINENTE: dict[str, str] = {
    # CAF
    "África do Sul": "CAF",
    "Marrocos": "CAF",
    "Costa do Marfim": "CAF",
    "Tunísia": "CAF",
    "Egito": "CAF",
    "Cabo Verde": "CAF",
    "Senegal": "CAF",
    "Argélia": "CAF",
    "Gana": "CAF",
    "Congo (RD)": "CAF",
    # CONMEBOL
    "Brasil": "CONMEBOL",
    "Paraguai": "CONMEBOL",
    "Equador": "CONMEBOL",
    "Uruguai": "CONMEBOL",
    "Colômbia": "CONMEBOL",
    "Argentina": "CONMEBOL",
    # CONCACAF
    "México": "CONCACAF",
    "Canadá": "CONCACAF",
    "Estados Unidos": "CONCACAF",
    "Haiti": "CONCACAF",
    "Curaçao": "CONCACAF",
    "Panamá": "CONCACAF",
    # AFC
    "Coreia do Sul": "AFC",
    "Qatar": "AFC",
    "Japão": "AFC",
    "Austrália": "AFC",
    "Arábia Saudita": "AFC",
    "Irã": "AFC",
    "Iraque": "AFC",
    "Jordânia": "AFC",
    "Uzbequistão": "AFC",
    # UEFA
    "República Tcheca": "UEFA",
    "Bósnia-Herzegovina": "UEFA",
    "Suíça": "UEFA",
    "Escócia": "UEFA",
    "Turquia": "UEFA",
    "Alemanha": "UEFA",
    "Países Baixos": "UEFA",
    "Suécia": "UEFA",
    "Bélgica": "UEFA",
    "Espanha": "UEFA",
    "França": "UEFA",
    "Noruega": "UEFA",
    "Áustria": "UEFA",
    "Portugal": "UEFA",
    "Inglaterra": "UEFA",
    "Croácia": "UEFA",
    # OFC
    "Nova Zelândia": "OFC",
}


def pontos(pa: int, pb: int, ra: int, rb: int, mata_mata: bool) -> int:
    """Mesma regra de scoring do pipeline."""
    base = 0
    if pa == ra and pb == rb:
        base = 10
    elif (pa > pb) == (ra > rb) and pa - pb == ra - rb and pa != pb:
        base = 7
    elif (pa > pb) == (ra > rb) and pa != pb or pa == pb and ra == rb:
        base = 5
    return base * 2 if mata_mata else base


def categoria(pa: int, pb: int, ra: int, rb: int) -> str:
    if pa == ra and pb == rb:
        return "exato"
    if pa == pb and ra == rb:
        return "empate_sem_exato"
    if (pa > pb) == (ra > rb) and pa != pb:
        return "saldo" if (pa - pb == ra - rb) else "vencedor"
    return "erro"


def pearson(xs: list[float], ys: list[float]) -> float:
    n = len(xs)
    if n < 3:
        return 0.0
    mx = sum(xs) / n
    my = sum(ys) / n
    num = sum((x - mx) * (y - my) for x, y in zip(xs, ys, strict=False))
    dx = math.sqrt(sum((x - mx) ** 2 for x in xs))
    dy = math.sqrt(sum((y - my) ** 2 for y in ys))
    return num / (dx * dy) if dx * dy > 0 else 0.0


def kmeans(
    vetores: list[list[float]],
    k: int,
    max_iter: int = 200,
    seed: int = 42,
) -> tuple[list[int], list[list[float]]]:
    """K-means manual. Retorna (assignments, centroids)."""
    rng = random.Random(seed)
    n = len(vetores)
    if n == 0 or k <= 0:
        return [], []
    dim = len(vetores[0])
    # Init kmeans++
    centroids = [list(vetores[rng.randrange(n)])]
    for _ in range(k - 1):
        dists = [
            min(sum((v[d] - c[d]) ** 2 for d in range(dim)) for c in centroids) for v in vetores
        ]
        total = sum(dists)
        if total == 0:
            centroids.append(list(vetores[rng.randrange(n)]))
            continue
        r = rng.random() * total
        acum = 0.0
        for i, d in enumerate(dists):
            acum += d
            if acum >= r:
                centroids.append(list(vetores[i]))
                break
    assignments = [0] * n
    for _ in range(max_iter):
        novo = []
        for v in vetores:
            best, bd = 0, float("inf")
            for ci, c in enumerate(centroids):
                d = sum((v[i] - c[i]) ** 2 for i in range(dim))
                if d < bd:
                    bd, best = d, ci
            novo.append(best)
        if novo == assignments:
            break
        assignments = novo
        # update centroids
        novos_centroides = [[0.0] * dim for _ in range(k)]
        contagens = [0] * k
        for v, a in zip(vetores, assignments, strict=False):
            for d in range(dim):
                novos_centroides[a][d] += v[d]
            contagens[a] += 1
        for ci in range(k):
            if contagens[ci] > 0:
                centroids[ci] = [novos_centroides[ci][d] / contagens[ci] for d in range(dim)]
    return assignments, centroids


def normalizar(vetores: list[list[float]]) -> list[list[float]]:
    """Min-max normalization por dimensao."""
    if not vetores:
        return []
    dim = len(vetores[0])
    out = [list(v) for v in vetores]
    for d in range(dim):
        col = [v[d] for v in vetores]
        lo, hi = min(col), max(col)
        rng = hi - lo
        if rng == 0:
            for v in out:
                v[d] = 0.5
        else:
            for v in out:
                v[d] = (v[d] - lo) / rng
    return out


# ---------------- pipeline ----------------

SERIE_A = {
    "claude-opus-4-7",
    "chatgpt-5-thinking",
    "gemini-2-5-pro",
    "grok-4-heavy",
    "deepseek-r1",
    "copilot-microsoft",
    "perplexity-sonar-pro",
    "meta-llama-4",
    "le-chat-mistral",
    "qwen-3-max",
    "manus",
    "claude-fable-5",
}

# Slugs canonicos da Serie A: aplicar mapeamento `-web` → irmao não-web,
# ja que os palpites reais ficam no irmao.
FALLBACK_SERIE_A_WEB = {
    "chatgpt-5-thinking-web": "chatgpt-5-thinking",
    "claude-opus-4-8-web": "claude-opus-4-7",
    "gemini-2-5-pro-web": "gemini-2-5-pro",
    "grok-4-heavy-web": "grok-4-heavy",
    "deepseek-r1-web": "deepseek-r1",
    "copilot-microsoft-web": "copilot-microsoft",
    "perplexity-sonar-pro-web": "perplexity-sonar-pro",
    "meta-llama-4-web": "meta-llama-4",
    "le-chat-mistral-web": "le-chat-mistral",
    "qwen-3-max-web": "qwen-3-max",
    "manus-web": "manus",
}


def main() -> None:
    print(">>> analise.py: lendo dados...")
    ranking = json.loads((V4_PUBLIC / "ranking-ias.json").read_text(encoding="utf-8"))
    jogos = json.loads((V4_PUBLIC / "jogos.json").read_text(encoding="utf-8"))
    pj = json.loads((V4_PUBLIC / "palpites_por_jogo.json").read_text(encoding="utf-8"))
    cristal_raw = json.loads((V4_PUBLIC / "bola_de_cristal.json").read_text(encoding="utf-8"))

    # Cristal pode vir como {"jogos": [...]} ou {"<num>": {...}}.
    cristal_por_jogo: dict[int, tuple[int, int]] = {}
    if isinstance(cristal_raw, dict) and "jogos" in cristal_raw:
        for j in cristal_raw.get("jogos", []):
            cristal_por_jogo[int(j["jogo_numero"])] = (j["gols_a"], j["gols_b"])
    elif isinstance(cristal_raw, dict):
        for k, v in cristal_raw.items():
            if isinstance(v, dict) and "gols_a" in v:
                cristal_por_jogo[int(k)] = (v["gols_a"], v["gols_b"])

    jogos_por_num = {j["numero"]: j for j in jogos}
    encerrados = {n: j for n, j in jogos_por_num.items() if j.get("gols_a") is not None}

    # IAs que palpitaram (palpites_total > 0), exceto cristal.
    ias = [
        ia
        for ia in ranking["ias"]
        if ia["slug"] != "bola-de-cristal" and (ia.get("palpites_total") or 0) > 0
    ]
    slug_para_nome = {ia["slug"]: ia["nome_display"] for ia in ias}

    # Computa features
    print(f">>> {len(ias)} IAs com palpites. Computando features...")
    perfis = []
    palpite_de_ia: dict[str, dict[int, tuple[int, int]]] = {}

    for ia in ias:
        slug = ia["slug"]
        # palpites_por_jogo é indexado por slug não-web. Algumas Series A
        # estão no slug -web no ranking-ias mas os palpites ficam no irmão.
        slug_pal = slug
        # se for um slug -web da Série A com fallback, palpitos estão no irmão
        if slug in FALLBACK_SERIE_A_WEB:
            slug_pal = FALLBACK_SERIE_A_WEB[slug]
        palp: dict[int, tuple[int, int]] = {}
        for str_num, dados in pj.items():
            ps = dados.get("palpites", {})
            if slug_pal in ps:
                palp[int(str_num)] = (
                    ps[slug_pal]["gols_a"],
                    ps[slug_pal]["gols_b"],
                )
        palpite_de_ia[slug] = palp

        n = len(palp)
        if n == 0:
            continue

        # Estilo: palpites
        empates_palp = sum(1 for ga, gb in palp.values() if ga == gb)
        gols_totais = [ga + gb for ga, gb in palp.values()]
        saldos_abs = [abs(ga - gb) for ga, gb in palp.values()]
        avg_gols = sum(gols_totais) / n
        avg_saldo = sum(saldos_abs) / n
        pct_empates = empates_palp / n

        # Estilo: tendencia por continente (em jogos cross-continente)
        # mede % de palpites favorecendo cada continente quando aparece no jogo
        favoritismo_cont: dict[str, dict[str, int]] = {}
        for jogo_num, (ga, gb) in palp.items():
            j = jogos_por_num.get(jogo_num)
            if not j:
                continue
            cont_a = CONTINENTE.get(j["time_a"])
            cont_b = CONTINENTE.get(j["time_b"])
            if not cont_a or not cont_b or cont_a == cont_b:
                continue
            # qual continente foi favorecido nesse palpite?
            fav = cont_a if ga > gb else (cont_b if gb > ga else None)
            for c in (cont_a, cont_b):
                favoritismo_cont.setdefault(c, {"jogos": 0, "favoreceu": 0})
                favoritismo_cont[c]["jogos"] += 1
            if fav:
                favoritismo_cont[fav]["favoreceu"] += 1
        tendencia_cont = {
            c: round(d["favoreceu"] / d["jogos"], 3) if d["jogos"] else 0.0
            for c, d in favoritismo_cont.items()
        }

        # Acerto: em jogos encerrados
        n_enc = 0
        exatos = saldo_ok = venc_ok = emp_ok = err_ok = 0
        pts_total = 0
        for jogo_num, (pa, pb) in palp.items():
            j = encerrados.get(jogo_num)
            if not j:
                continue
            ra, rb = j["gols_a"], j["gols_b"]
            mm = not j["fase"].lower().startswith("grupo")
            cat = categoria(pa, pb, ra, rb)
            n_enc += 1
            pts_total += pontos(pa, pb, ra, rb, mm)
            if cat == "exato":
                exatos += 1
            elif cat == "saldo":
                saldo_ok += 1
            elif cat == "vencedor":
                venc_ok += 1
            elif cat == "empate_sem_exato":
                emp_ok += 1
            else:
                err_ok += 1
        acerto_total = exatos + saldo_ok + venc_ok + emp_ok
        taxa_acerto = acerto_total / n_enc if n_enc else 0.0
        taxa_exato = exatos / n_enc if n_enc else 0.0

        # Comportamento: concordancia com cristal
        n_comp = 0
        n_concorda = 0
        for jogo_num, (pa, pb) in palp.items():
            if jogo_num in cristal_por_jogo:
                cga, cgb = cristal_por_jogo[jogo_num]
                n_comp += 1
                if pa == cga and pb == cgb:
                    n_concorda += 1
        concordancia_cristal = n_concorda / n_comp if n_comp else 0.0

        # Acerto por continente (em jogos cross-continente)
        acerto_por_cont: dict[str, dict[str, int]] = {}
        for jogo_num, (pa, pb) in palp.items():
            j = encerrados.get(jogo_num)
            if not j:
                continue
            cont_a = CONTINENTE.get(j["time_a"])
            cont_b = CONTINENTE.get(j["time_b"])
            if not cont_a or not cont_b:
                continue
            ra, rb = j["gols_a"], j["gols_b"]
            mm = not j["fase"].lower().startswith("grupo")
            ganho = pontos(pa, pb, ra, rb, mm)
            for c in {cont_a, cont_b}:
                acerto_por_cont.setdefault(c, {"jogos": 0, "pts": 0, "acertos": 0})
                acerto_por_cont[c]["jogos"] += 1
                acerto_por_cont[c]["pts"] += ganho
                if ganho > 0:
                    acerto_por_cont[c]["acertos"] += 1
        acerto_continente = {
            c: {
                "jogos": d["jogos"],
                "pts": d["pts"],
                "media_pts": round(d["pts"] / d["jogos"], 2) if d["jogos"] else 0.0,
                "taxa_acerto": round(d["acertos"] / d["jogos"], 3) if d["jogos"] else 0.0,
            }
            for c, d in acerto_por_cont.items()
        }

        perfis.append(
            {
                "slug": slug,
                "nome_display": slug_para_nome[slug],
                "serie_a": slug in SERIE_A,
                "n_palpites": n,
                "n_encerrados_palpitou": n_enc,
                # estilo
                "pct_empates_palpitados": round(pct_empates, 3),
                "avg_gols_total": round(avg_gols, 2),
                "avg_saldo_abs": round(avg_saldo, 2),
                "tendencia_continente": tendencia_cont,
                # acerto
                "pontos": pts_total,
                "exatos": exatos,
                "saldo_acertados": saldo_ok,
                "venc_acertados": venc_ok,
                "emp_acertados": emp_ok,
                "erros": err_ok,
                "taxa_acerto": round(taxa_acerto, 3),
                "taxa_exato": round(taxa_exato, 3),
                "acerto_por_continente": acerto_continente,
                # comportamento
                "concordancia_cristal": round(concordancia_cristal, 3),
            }
        )

    # Identifica favorito / underdog por jogo: a IA esta com a manada (>60%
    # apostou no mesmo vencedor) -> favorito; contrario -> underdog.
    fav_por_jogo: dict[int, str] = {}  # "A" | "B" | "EMP" | None
    for jogo_num, dados in pj.items():
        ps = dados.get("palpites", {})
        if not ps:
            continue
        cont_a = cont_b = cont_e = 0
        for p in ps.values():
            if p["gols_a"] > p["gols_b"]:
                cont_a += 1
            elif p["gols_b"] > p["gols_a"]:
                cont_b += 1
            else:
                cont_e += 1
        tot = cont_a + cont_b + cont_e
        if tot == 0:
            continue
        if cont_a / tot > 0.6:
            fav_por_jogo[int(jogo_num)] = "A"
        elif cont_b / tot > 0.6:
            fav_por_jogo[int(jogo_num)] = "B"
        elif cont_e / tot > 0.5:
            fav_por_jogo[int(jogo_num)] = "EMP"
        # senao deixa sem favorito (jogo equilibrado)

    # Acerto em jogos com vs sem favorito definido, por IA
    for p in perfis:
        palp = palpite_de_ia[p["slug"]]
        pts_fav = jog_fav = pts_eq = jog_eq = 0
        for jogo_num, (pa, pb) in palp.items():
            j = encerrados.get(jogo_num)
            if not j:
                continue
            ra, rb = j["gols_a"], j["gols_b"]
            mm = not j["fase"].lower().startswith("grupo")
            ganho = pontos(pa, pb, ra, rb, mm)
            if jogo_num in fav_por_jogo:
                jog_fav += 1
                pts_fav += ganho
            else:
                jog_eq += 1
                pts_eq += ganho
        p["jogos_com_favorito"] = jog_fav
        p["pts_em_jogos_com_favorito"] = pts_fav
        p["media_pts_jogos_com_favorito"] = round(pts_fav / jog_fav, 2) if jog_fav else 0.0
        p["jogos_equilibrados"] = jog_eq
        p["pts_em_jogos_equilibrados"] = pts_eq
        p["media_pts_jogos_equilibrados"] = round(pts_eq / jog_eq, 2) if jog_eq else 0.0

    # Matriz de similaridade — % de palpites iguais entre cada par
    print(">>> computando matriz de similaridade...")
    slugs = [p["slug"] for p in perfis]
    similaridade: dict[str, dict[str, float]] = {}
    for i, sa in enumerate(slugs):
        similaridade[sa] = {}
        pa = palpite_de_ia[sa]
        for j, sb in enumerate(slugs):
            if i == j:
                similaridade[sa][sb] = 1.0
                continue
            if j < i:
                # ja calculado simetricamente
                similaridade[sa][sb] = similaridade[sb][sa]
                continue
            pb = palpite_de_ia[sb]
            comuns = set(pa.keys()) & set(pb.keys())
            if not comuns:
                similaridade[sa][sb] = 0.0
                continue
            iguais = sum(1 for n in comuns if pa[n] == pb[n])
            similaridade[sa][sb] = round(iguais / len(comuns), 3)

    # K-means: vetor de features estilisticas + comportamentais
    print(">>> kmeans (k=4)...")
    vetores_brutos = [
        [
            p["pct_empates_palpitados"],
            p["avg_gols_total"] / 10.0,  # rescale
            p["avg_saldo_abs"] / 5.0,  # rescale
            p["concordancia_cristal"],
            p["taxa_exato"] * 3,  # peso mais alto
            p["media_pts_jogos_equilibrados"] / 10.0,
        ]
        for p in perfis
    ]
    vetores = normalizar(vetores_brutos)
    cluster_id, centroids = kmeans(vetores, k=4, seed=42)
    for p, c in zip(perfis, cluster_id, strict=False):
        p["cluster"] = int(c)

    # Centroides desnormalizados (média real por cluster) pra labelar
    cluster_perfil: dict[int, dict[str, float]] = {}
    for c in range(4):
        membros = [p for p, ci in zip(perfis, cluster_id, strict=False) if ci == c]
        if not membros:
            continue
        cluster_perfil[c] = {
            "n_ias": len(membros),
            "pct_empates_palpitados": round(
                sum(m["pct_empates_palpitados"] for m in membros) / len(membros), 3
            ),
            "avg_gols_total": round(sum(m["avg_gols_total"] for m in membros) / len(membros), 2),
            "avg_saldo_abs": round(sum(m["avg_saldo_abs"] for m in membros) / len(membros), 2),
            "concordancia_cristal": round(
                sum(m["concordancia_cristal"] for m in membros) / len(membros), 3
            ),
            "taxa_exato": round(sum(m["taxa_exato"] for m in membros) / len(membros), 3),
            "taxa_acerto": round(sum(m["taxa_acerto"] for m in membros) / len(membros), 3),
            "media_pontos": round(sum(m["pontos"] for m in membros) / len(membros), 1),
            "ias_exemplo": [
                m["nome_display"] for m in sorted(membros, key=lambda x: -x["pontos"])[:5]
            ],
        }

    # Rótulo automático pra cada cluster (descritivo)
    def rotular(c: dict[str, float]) -> tuple[str, str]:
        traits = []
        if c["pct_empates_palpitados"] > 0.30:
            traits.append("apostam muito em empates")
        elif c["pct_empates_palpitados"] < 0.15:
            traits.append("quase nunca apostam em empate")
        if c["avg_gols_total"] >= 3.0:
            traits.append("preveem jogos com muitos gols")
        elif c["avg_gols_total"] <= 2.2:
            traits.append("preveem placares enxutos")
        if c["concordancia_cristal"] >= 0.45:
            traits.append("alinhadas com a maioria")
        elif c["concordancia_cristal"] <= 0.25:
            traits.append("contrarian — fogem da manada")
        if c["taxa_exato"] >= 0.18:
            traits.append("alta taxa de placares exatos")
        elif c["taxa_exato"] < 0.08:
            traits.append("raramente cravam o placar")
        if not traits:
            traits.append("comportamento medio")
        descr = " · ".join(traits)
        # nickname curto
        if c["pct_empates_palpitados"] > 0.30:
            nick = "Empatistas"
        elif c["avg_gols_total"] >= 3.0:
            nick = "Goleadeiras"
        elif c["concordancia_cristal"] <= 0.25:
            nick = "Contrarian"
        elif c["taxa_exato"] >= 0.18:
            nick = "Precisas"
        else:
            nick = "Médias"
        return nick, descr

    clusters_out = []
    for c, perf in sorted(cluster_perfil.items()):
        nick, descr = rotular(perf)
        clusters_out.append(
            {
                "id": c,
                "nome": nick,
                "descricao": descr,
                **perf,
            }
        )

    # Rankings
    def top_por(key: str, n: int = 5, asc: bool = False) -> list[dict]:
        s = sorted(perfis, key=lambda p: p[key], reverse=not asc)[:n]
        return [{"slug": x["slug"], "nome": x["nome_display"], "valor": x[key]} for x in s]

    rankings = {
        "mais_empates_palpitados": top_por("pct_empates_palpitados"),
        "menos_empates_palpitados": top_por("pct_empates_palpitados", asc=True),
        "mais_goleadeiras": top_por("avg_gols_total"),
        "mais_conservadoras": top_por("avg_gols_total", asc=True),
        "mais_alinhadas_cristal": top_por("concordancia_cristal"),
        "mais_contrarian": top_por("concordancia_cristal", asc=True),
        "maior_taxa_exato": top_por("taxa_exato"),
        "melhor_em_jogos_equilibrados": top_por("media_pts_jogos_equilibrados"),
    }

    out = {
        "gerado_em": __import__("datetime").datetime.utcnow().isoformat() + "Z",
        "n_ias": len(perfis),
        "n_jogos_encerrados": len(encerrados),
        "perfis": perfis,
        "similaridade": similaridade,
        "clusters": clusters_out,
        "rankings": rankings,
    }

    dest = V4_PUBLIC / "analise.json"
    dest.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    size_kb = dest.stat().st_size / 1024
    print(f">>> analise.json salvo: {len(perfis)} IAs, {len(encerrados)} jogos, {size_kb:.1f} KB")


if __name__ == "__main__":
    main()
