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
    # paises por IA
    paises: dict[str, dict] = {}
    for slug in ias_dict:
        paises[slug] = _mapear_pais(slug)
    return por_jogo, ias_dict, paises


def main() -> None:
    V4_PUB.mkdir(parents=True, exist_ok=True)

    # 1. jogos.json
    src_jogos = WEB_DATA / "jogos.json"
    if src_jogos.is_file():
        dst = V4_PUB / "jogos.json"
        shutil.copy(src_jogos, dst)
        n = len(json.loads(dst.read_text(encoding="utf-8")))
        print(f"jogos: {n} -> {dst.name}")

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


if __name__ == "__main__":
    main()
