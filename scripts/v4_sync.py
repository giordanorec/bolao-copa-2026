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
from datetime import UTC
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WEB_DATA = ROOT / "web" / "data"
V4_PUB = ROOT / "v4" / "public"


def _mapear_pais(slug: str) -> dict:
    """Mapeia slug da IA pra (codigo_pais, nome_pt, emoji_bandeira)."""
    s = slug.lower()
    # USA
    if any(
        s.startswith(p) or p in s
        for p in (
            "chatgpt",
            "gpt-",
            "openai",
            "o1",
            "o3",
            "o4-",
            "claude",
            "gemini",
            "gemma",
            "palm",
            "bard",
            "grok",
            "llama",
            "meta-",
            "copilot",
            "phi-",
            "perplexity",
            "sonar",
            "wizardlm",
            "dbrx",
            "databricks",
            "liquid",
            "inflection",
        )
    ):
        return {"codigo": "us", "nome": "Estados Unidos", "bandeira": "🇺🇸"}
    # França
    if any(p in s for p in ("mistral", "codestral", "ministral", "le-chat", "mixtral")):
        return {"codigo": "fr", "nome": "França", "bandeira": "🇫🇷"}
    # China
    if any(
        p in s
        for p in (
            "deepseek",
            "qwen",
            "kimi",
            "baichuan",
            "yi-",
            "01-ai",
            "glm",
            "chatglm",
            "tongyi",
            "ernie",
            "doubao",
            "moonshot",
        )
    ):
        return {"codigo": "cn", "nome": "China", "bandeira": "🇨🇳"}
    # Israel
    if any(p in s for p in ("jamba", "ai21")):
        return {"codigo": "il", "nome": "Israel", "bandeira": "🇮🇱"}
    # Canadá
    if any(p in s for p in ("cohere", "command-", "aya-")):
        return {"codigo": "ca", "nome": "Canadá", "bandeira": "🇨🇦"}
    # UK / Inglaterra
    if any(p in s for p in ("stability", "deepmind", "reka")):
        return {"codigo": "gb", "nome": "Reino Unido", "bandeira": "🇬🇧"}
    # USA extra (modelos open source ou menos famosos)
    if any(
        p in s
        for p in (
            "lfm-",
            "falcon",
            "ibm-",
            "granite",
            "minimax",
            "molmo",
            "nemotron",
            "nous-hermes",
            "olmo-",
            "pixtral",
            "qwq",
            "snowflake",
            "stablelm",
            "step-",
            "tulu",
            "mathstral",
            "spark-",
        )
    ):
        # mathstral é Mistral (France); pixtral é Mistral
        if any(p in s for p in ("mathstral", "pixtral")):
            return {"codigo": "fr", "nome": "França", "bandeira": "🇫🇷"}
        # hunyuan/sensechat/spark sao chineses
        return {"codigo": "us", "nome": "Estados Unidos", "bandeira": "🇺🇸"}
    if any(p in s for p in ("hunyuan", "sensechat", "spark-", "step-")):
        return {"codigo": "cn", "nome": "China", "bandeira": "🇨🇳"}
    # Bola de Cristal = nao tem pais
    if s == "bola-de-cristal":
        return {"codigo": "cristal", "nome": "Consenso Global", "bandeira": "🔮"}
    return {"codigo": "xx", "nome": "Outro", "bandeira": "🏳️"}


def _gerar_ranking_v2() -> dict | None:
    """Ranking 'IA v2' (bifurcação): palpites v1 nos jogos 1-40 + v2 nos 41-72.

    Mesma forma do ranking-ias.json, mas com a versão atualizada das IAs.
    Pontua sobre TODOS os jogos encerrados — a diferença vs. a original só
    aparece a partir do jogo 41 (onde existe palpite v2). Usado no Hall da
    Fama bifurcado (só contribuintes).
    """
    import sys
    from datetime import datetime

    sys.path.insert(0, str(ROOT / "src"))
    from bolao.models import Palpite  # type: ignore
    from bolao.parser import (  # type: ignore
        carregar_jogos,
        carregar_palpites,
        carregar_resultados,
    )
    from bolao.ranking import ranking_geral  # type: ignore

    jogos = carregar_jogos(ROOT / "data" / "jogos.md")
    resultados = carregar_resultados(ROOT / "data" / "resultados" / "jogos.md")
    v1 = carregar_palpites(ROOT / "data" / "palpites_ias")
    v2 = carregar_palpites(ROOT / "data" / "palpites_v2")

    CORTE_V2 = 41  # jogos >= 41 usam v2 quando disponível
    blended: dict[str, list[Palpite]] = {}
    tem_v2: dict[str, bool] = {}
    for slug, lista in v1.items():
        v2map = {p.jogo_numero: p for p in v2.get(slug, [])}
        nova: list[Palpite] = []
        usou_v2 = False
        for p in lista:
            if p.jogo_numero >= CORTE_V2 and p.jogo_numero in v2map:
                nova.append(v2map[p.jogo_numero])
                usou_v2 = True
            else:
                nova.append(p)
        blended[slug] = nova
        tem_v2[slug] = usou_v2

    # nomes
    ias_dict: dict[str, str] = {}
    ranking_path = WEB_DATA / "ranking.json"
    if ranking_path.is_file():
        for ia in json.loads(ranking_path.read_text(encoding="utf-8")).get("ias", []):
            if ia.get("slug"):
                ias_dict[ia["slug"]] = ia.get("nome_display") or ia["slug"]

    linhas = ranking_geral(blended, resultados, jogos)
    ias_out = []
    for i, r in enumerate(linhas, start=1):
        ias_out.append(
            {
                "slug": r["slug"],
                "nome_display": ias_dict.get(r["slug"], r["slug"]),
                "pontos": r["pontos"],
                "placares_exatos": r["placares_exatos"],
                "vencedores_acertados": r["vencedores_acertados"],
                "jogos_palpitados": r["jogos_palpitados"],
                "palpites_total": r["palpites_total"],
                "rank": i,
                "tem_v2": tem_v2.get(r["slug"], False),
            }
        )
    return {
        "atualizado_em": datetime.now(UTC).isoformat(),
        "corte_v2": CORTE_V2,
        "jogos_apurados": len(resultados),
        "ias": ias_out,
    }


def _gerar_analise_v2_publico() -> dict | None:
    """Retrospectiva v1 x v2 PÚBLICA — só jogos JÁ ENCERRADOS (>= 41).

    Comparação maçã-com-maçã: para cada IA com palpite v1 e v2 nos mesmos
    jogos encerrados, pontua os dois e mede se a revisão melhorou. Como só
    entra jogo que já aconteceu, nada de sensível vaza (o palpite v2 de
    jogo futuro continua atrás do paywall em /analise-v2). À medida que os
    jogos passam, eles entram aqui automaticamente.
    """
    import sys
    from datetime import datetime

    sys.path.insert(0, str(ROOT / "src"))
    from bolao.parser import (  # type: ignore
        carregar_jogos,
        carregar_palpites,
        carregar_resultados,
    )
    from bolao.scoring import pontuar  # type: ignore

    jogos = carregar_jogos(ROOT / "data" / "jogos.md")
    res_list = carregar_resultados(ROOT / "data" / "resultados" / "jogos.md")
    res = {r.jogo_numero: r for r in res_list}
    v1 = carregar_palpites(ROOT / "data" / "palpites_ias")
    v2 = carregar_palpites(ROOT / "data" / "palpites_v2")

    CORTE_V2 = 41
    fase = {j.numero: j.fase for j in jogos}
    meta = {j.numero: j for j in jogos}
    fin = sorted(n for n in res if n >= CORTE_V2)
    if not fin:
        return None

    ALIAS = {"claude-opus-4-8-web": "claude-opus-4-7"}

    def _idx(pals: dict) -> dict:
        return {slug: {p.jogo_numero: p for p in lista} for slug, lista in pals.items()}

    v1i, v2i = _idx(v1), _idx(v2)

    def _v1_para(slug: str, num: int):
        cand = (v1i.get(slug) or {}).get(num)
        if cand is None and slug.endswith("-web"):
            cand = (v1i.get(slug[:-4]) or {}).get(num)
        if cand is None and slug in ALIAS:
            cand = (v1i.get(ALIAS[slug]) or {}).get(num)
        return cand

    nomes: dict[str, str] = {}
    ranking_path = WEB_DATA / "ranking.json"
    if ranking_path.is_file():
        for ia in json.loads(ranking_path.read_text(encoding="utf-8")).get("ias", []):
            if ia.get("slug"):
                nomes[ia["slug"]] = ia.get("nome_display") or ia["slug"]

    # acumuladores
    pts_v1 = pts_v2 = 0
    melhoraram = pioraram = iguais = 0
    mudaram = comparacoes = exatos_v1 = exatos_v2 = 0
    n_ias = 0
    destaques: list[dict] = []
    # consenso por jogo: contagem de placares v1 e v2
    cont_v1: dict[int, Counter[str]] = {n: Counter() for n in fin}
    cont_v2: dict[int, Counter[str]] = {n: Counter() for n in fin}
    pts_jogo_v1: dict[int, int] = dict.fromkeys(fin, 0)
    pts_jogo_v2: dict[int, int] = dict.fromkeys(fin, 0)
    mudaram_jogo: dict[int, int] = dict.fromkeys(fin, 0)
    total_jogo: dict[int, int] = dict.fromkeys(fin, 0)

    for slug, jmap2 in v2i.items():
        if not all(n in jmap2 for n in fin):
            continue
        got1 = {}
        ok = True
        for n in fin:
            c = _v1_para(slug, n)
            if c is None:
                ok = False
                break
            got1[n] = c
        if not ok:
            continue
        n_ias += 1
        p1 = p2 = 0
        for n in fin:
            r = res[n]
            f = fase[n]
            a1 = pontuar(got1[n], r, f)
            a2 = pontuar(jmap2[n], r, f)
            p1 += a1
            p2 += a2
            pts_jogo_v1[n] += a1
            pts_jogo_v2[n] += a2
            cont_v1[n][f"{got1[n].gols_a}-{got1[n].gols_b}"] += 1
            cont_v2[n][f"{jmap2[n].gols_a}-{jmap2[n].gols_b}"] += 1
            if (got1[n].gols_a, got1[n].gols_b) == (r.gols_a, r.gols_b):
                exatos_v1 += 1
            if (jmap2[n].gols_a, jmap2[n].gols_b) == (r.gols_a, r.gols_b):
                exatos_v2 += 1
            comparacoes += 1
            total_jogo[n] += 1
            if (got1[n].gols_a, got1[n].gols_b) != (jmap2[n].gols_a, jmap2[n].gols_b):
                mudaram += 1
                mudaram_jogo[n] += 1
        pts_v1 += p1
        pts_v2 += p2
        if p2 > p1:
            melhoraram += 1
        elif p2 < p1:
            pioraram += 1
        else:
            iguais += 1
        destaques.append(
            {"slug": slug, "nome": nomes.get(slug, slug), "v1": p1, "v2": p2, "delta": p2 - p1}
        )

    if n_ias == 0:
        return None

    def _consenso(cont: Counter[str]):
        if not cont:
            return None
        k, _ = cont.most_common(1)[0]
        a, b = k.split("-")
        return {"a": int(a), "b": int(b)}

    por_jogo = []
    for n in fin:
        j = meta[n]
        r = res[n]
        por_jogo.append(
            {
                "numero": n,
                "time_a": j.time_a,
                "time_b": j.time_b,
                "gols_a": r.gols_a,
                "gols_b": r.gols_b,
                "consenso_v1": _consenso(cont_v1[n]),
                "consenso_v2": _consenso(cont_v2[n]),
                "mudaram": mudaram_jogo[n],
                "total": total_jogo[n],
                "pts_v1": pts_jogo_v1[n],
                "pts_v2": pts_jogo_v2[n],
            }
        )

    destaques.sort(key=lambda d: d["delta"], reverse=True)

    return {
        "gerado_em": datetime.now(UTC).isoformat(),
        "corte_v2": CORTE_V2,
        "jogos": fin,
        "n_ias": n_ias,
        "agg": {
            "comparacoes": comparacoes,
            "mudaram": mudaram,
            "pct_mudaram": round(100 * mudaram / comparacoes) if comparacoes else 0,
            "pts_v1": pts_v1,
            "pts_v2": pts_v2,
            "delta": pts_v2 - pts_v1,
            "delta_pct": round(100 * (pts_v2 - pts_v1) / pts_v1) if pts_v1 else 0,
            "media_v1": round(pts_v1 / n_ias, 2),
            "media_v2": round(pts_v2 / n_ias, 2),
            "media_delta": round((pts_v2 - pts_v1) / n_ias, 2),
            "melhoraram": melhoraram,
            "pioraram": pioraram,
            "iguais": iguais,
            "exatos_v1": exatos_v1,
            "exatos_v2": exatos_v2,
            "total": comparacoes,
            "pct_exato_v1": round(100 * exatos_v1 / comparacoes) if comparacoes else 0,
            "pct_exato_v2": round(100 * exatos_v2 / comparacoes) if comparacoes else 0,
        },
        "por_jogo": por_jogo,
        "destaques": destaques[:8],
    }


def _supabase_creds() -> tuple[str, str] | None:
    """URL + service_role key, do ambiente ou de v4/.env.local."""
    import os

    url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not (url and key):
        envf = ROOT / "v4" / ".env.local"
        if envf.is_file():
            vals: dict[str, str] = {}
            for line in envf.read_text(encoding="utf-8").splitlines():
                if "=" in line and not line.lstrip().startswith("#"):
                    k, _, v = line.partition("=")
                    vals[k.strip()] = v.strip().strip('"').strip("'")
            url = url or vals.get("NEXT_PUBLIC_SUPABASE_URL")
            key = key or vals.get("SUPABASE_SERVICE_ROLE_KEY")
    if url and key:
        return url, key
    return None


def _fetch_matamata() -> dict[int, dict[str, dict[str, int]]]:
    """Palpites do mata-mata (versao='mata-mata') do Supabase, por jogo.

    Só slugs não-web entram (igual aos grupos): os '-web' são vitrines que
    reaproveitam o irmão, e contá-los duplicaria votos no consenso.
    """
    import urllib.request

    creds = _supabase_creds()
    if not creds:
        print("matamata: sem credenciais Supabase — pulando (json fica só grupos)")
        return {}
    url, key = creds
    out: dict[int, dict[str, dict[str, int]]] = {}
    headers = {"apikey": key, "Authorization": f"Bearer {key}"}
    off = 0
    while True:
        q = (
            f"{url}/rest/v1/palpite_v2?select=slug,jogo_numero,gols_a,gols_b"
            f"&versao=eq.mata-mata&order=jogo_numero"
        )
        req = urllib.request.Request(q, headers={**headers, "Range": f"{off}-{off + 999}"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            lote = json.loads(resp.read().decode("utf-8"))
        for r in lote:
            slug = r["slug"]
            if slug.endswith("-web"):
                continue
            out.setdefault(int(r["jogo_numero"]), {})[slug] = {
                "gols_a": int(r["gols_a"]),
                "gols_b": int(r["gols_b"]),
            }
        if len(lote) < 1000:
            break
        off += 1000
    total = sum(len(v) for v in out.values())
    print(f"matamata: {total} palpites em {len(out)} jogos do Supabase")
    return out


def _gerar_palpites_por_jogo() -> tuple[dict, dict, dict]:
    """Roda parser do v1 e agrega palpites por jogo + dict de IAs + paises."""
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

    # palpites de mata-mata (vivem só no Supabase) — tudo público agora
    matamata = _fetch_matamata()

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
        # mata-mata: injeta palpites do Supabase (v1 não cobre esses jogos)
        for ia_slug, palp in matamata.get(num, {}).items():
            entries.setdefault(ia_slug, palp)
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
    # paises por IA
    paises: dict[str, dict] = {}
    for slug in ias_dict:
        paises[slug] = _mapear_pais(slug)
    return por_jogo, ias_dict, paises


def main() -> None:
    V4_PUB.mkdir(parents=True, exist_ok=True)

    # 1. jogos.json — merge resultados (gols_a/gols_b) por jogo encerrado
    src_jogos = WEB_DATA / "jogos.json"
    if src_jogos.is_file():
        dst = V4_PUB / "jogos.json"
        jogos = json.loads(src_jogos.read_text(encoding="utf-8"))
        src_resultados = WEB_DATA / "resultados.json"
        res_por_num: dict[int, dict] = {}
        if src_resultados.is_file():
            for r in json.loads(src_resultados.read_text(encoding="utf-8")):
                res_por_num[int(r["jogo_numero"])] = r
        encerrados = 0
        for j in jogos:
            r = res_por_num.get(int(j.get("numero", 0)))
            j["gols_a"] = r["gols_a"] if r else None
            j["gols_b"] = r["gols_b"] if r else None
            if r:
                encerrados += 1
        dst.write_text(
            json.dumps(jogos, ensure_ascii=False, indent=None, separators=(",", ":")),
            encoding="utf-8",
        )
        print(f"jogos: {len(jogos)} ({encerrados} encerrados) -> {dst.name}")

    # 1b. paises.json (mapeamento nome -> ISO)
    src_paises = WEB_DATA / "paises.json"
    if src_paises.is_file():
        dst = V4_PUB / "paises_iso.json"
        shutil.copy(src_paises, dst)
        n = sum(1 for k in json.loads(dst.read_text(encoding="utf-8")) if not k.startswith("_"))
        print(f"paises ISO: {n} -> {dst.name}")

    # 2. ranking-ias.json
    src_rank = WEB_DATA / "ranking.json"
    if src_rank.is_file():
        dst = V4_PUB / "ranking-ias.json"
        shutil.copy(src_rank, dst)
        print(f"ranking IAs -> {dst.name}")

    # 2b. ranking-ias-v2.json (bifurcação: v1 nos jogos 1-40 + v2 nos 41-72)
    try:
        rank_v2 = _gerar_ranking_v2()
        if rank_v2:
            dst_v2 = V4_PUB / "ranking-ias-v2.json"
            dst_v2.write_text(
                json.dumps(rank_v2, ensure_ascii=False, separators=(",", ":")),
                encoding="utf-8",
            )
            print(f"ranking IAs v2 (bifurcado): {len(rank_v2['ias'])} -> {dst_v2.name}")
    except Exception as e:
        print(f"ranking v2: pulou ({e})")

    # 2c. analise-v2-publico.json — retrospectiva v1 x v2 só de jogos encerrados
    #     (pública: alimenta a /analise e os números da home)
    try:
        av2 = _gerar_analise_v2_publico()
        if av2:
            dst_av2 = V4_PUB / "analise-v2-publico.json"
            dst_av2.write_text(
                json.dumps(av2, ensure_ascii=False, separators=(",", ":")),
                encoding="utf-8",
            )
            print(
                f"analise v2 publica: {av2['n_ias']} IAs, "
                f"{len(av2['jogos'])} jogos, +{av2['agg']['delta']} pts -> {dst_av2.name}"
            )
    except Exception as e:
        print(f"analise v2 publica: pulou ({e})")

    # 3. bola_de_cristal.json
    src_cristal = WEB_DATA / "bola_de_cristal.json"
    if src_cristal.is_file():
        dst = V4_PUB / "bola_de_cristal.json"
        shutil.copy(src_cristal, dst)
        n = len(json.loads(dst.read_text(encoding="utf-8")))
        print(f"bola de cristal: {n} jogos -> {dst.name}")

    # 3b. resultados.json (jogos ja encerrados com placar oficial)
    src_resultados = WEB_DATA / "resultados.json"
    if src_resultados.is_file():
        dst = V4_PUB / "resultados.json"
        shutil.copy(src_resultados, dst)
        n = len(json.loads(dst.read_text(encoding="utf-8")))
        print(f"resultados: {n} jogos -> {dst.name}")

    # 4. palpites_por_jogo.json
    por_jogo, ias_dict, paises = _gerar_palpites_por_jogo()
    out = V4_PUB / "palpites_por_jogo.json"
    out.write_text(
        json.dumps(por_jogo, ensure_ascii=False, indent=None, separators=(",", ":")),
        encoding="utf-8",
    )
    com_palpites = sum(1 for v in por_jogo.values() if v.get("palpites"))
    print(f"palpites por jogo: {com_palpites} jogos com IAs -> {out.name}")

    # 5. ias_dict.json
    out_ias = V4_PUB / "ias_dict.json"
    out_ias.write_text(
        json.dumps(ias_dict, ensure_ascii=False, indent=None, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"dict IAs: {len(ias_dict)} -> {out_ias.name}")

    # 6. ias_paises.json (NOVO)
    out_paises = V4_PUB / "ias_paises.json"
    out_paises.write_text(
        json.dumps(paises, ensure_ascii=False, indent=None, separators=(",", ":")),
        encoding="utf-8",
    )
    contagem_pais: Counter[str] = Counter(p["codigo"] for p in paises.values())
    resumo = ", ".join(f"{c}={n}" for c, n in contagem_pais.most_common())
    print(f"paises: {resumo} -> {out_paises.name}")

    # 7. analise.json — features + clusters + similaridade (página /analise)
    try:
        import subprocess
        import sys

        analise_script = ROOT / "scripts" / "analise.py"
        if analise_script.exists():
            r = subprocess.run(
                [sys.executable, str(analise_script)],
                capture_output=True,
                text=True,
                cwd=str(ROOT),
            )
            if r.returncode == 0:
                lines = r.stdout.strip().splitlines()
                last = lines[-1] if lines else "ok"
                print(f"analise: {last}")
            else:
                print(f"analise: ERRO ({r.returncode}) {r.stderr.strip()[:200]}")
    except Exception as e:
        print(f"analise: pulou ({e})")


if __name__ == "__main__":
    main()
