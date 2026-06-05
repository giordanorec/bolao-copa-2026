"""Renderização HTML estático do bolão.

Importado pelo pipeline (``src/bolao/__main__.py``) após `score` + `ranking`.
A fonte canônica é ``web/data/ranking.json`` (schema em ``specs/F4-mvp-plataforma.md``).
Dados opcionais (``jogos.json``, ``palpites.json``, ``resultados.json``,
``pontuacoes.json``) habilitam páginas por IA e por jogo. Sem eles, apenas o
``index.html`` é gerado.
"""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any

from jinja2 import Environment, FileSystemLoader, StrictUndefined, select_autoescape

_HERE = Path(__file__).resolve().parent
_DEFAULT_TEMPLATES_DIR = _HERE.parent.parent / "web" / "templates"


def _carregar_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def _formatar_humano(iso: str) -> str:
    try:
        dt = datetime.fromisoformat(iso)
    except ValueError:
        return iso
    return dt.strftime("%d/%m/%Y %H:%M")


def _ambiente(templates_dir: Path) -> Environment:
    return Environment(
        loader=FileSystemLoader(str(templates_dir)),
        autoescape=select_autoescape(enabled_extensions=("html", "j2")),
        undefined=StrictUndefined,
        trim_blocks=True,
        lstrip_blocks=True,
    )


def _ctx_base(ranking: dict[str, Any], asset_prefix: str) -> dict[str, Any]:
    atualizado = ranking.get("atualizado_em", "")
    return {
        "atualizado_em": atualizado,
        "atualizado_em_humano": _formatar_humano(atualizado) if atualizado else "—",
        "jogos_apurados": ranking.get("jogos_apurados", 0),
        "jogos_totais": ranking.get("jogos_totais", 104),
        "asset_prefix": asset_prefix,
    }


def _renderizar_index(env: Environment, web_dir: Path, ranking: dict[str, Any]) -> None:
    tmpl = env.get_template("index.html.j2")
    ctx = _ctx_base(ranking, asset_prefix="")
    ctx["ias"] = ranking.get("ias", [])
    html = tmpl.render(**ctx)
    (web_dir / "index.html").write_text(html, encoding="utf-8", newline="\n")


def _index_por_slug(ias: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    out: dict[str, dict[str, Any]] = {}
    for pos, ia in enumerate(ias, start=1):
        slug = ia.get("slug")
        if not slug:
            continue
        registro = dict(ia)
        registro["posicao"] = pos
        out[slug] = registro
    return out


def _renderizar_paginas_ias(
    env: Environment,
    web_dir: Path,
    ranking: dict[str, Any],
    jogos: list[dict[str, Any]],
    palpites_por_ia: dict[str, list[dict[str, Any]]],
    resultados_por_jogo: dict[int, dict[str, Any]],
    pontos_por_par: dict[tuple[str, int], int],
) -> None:
    tmpl = env.get_template("ia.html.j2")
    ias_dir = web_dir / "ia"
    ias_dir.mkdir(parents=True, exist_ok=True)
    ias_indexed = _index_por_slug(ranking.get("ias", []))

    for slug, ia_info in ias_indexed.items():
        palpites_ia = {p["jogo_numero"]: p for p in palpites_por_ia.get(slug, [])}
        jogos_detalhe = []
        for jogo in jogos:
            numero = jogo["numero"]
            palpite = palpites_ia.get(numero)
            resultado = resultados_por_jogo.get(numero)
            pontos = pontos_por_par.get((slug, numero))
            jogos_detalhe.append(
                {
                    "numero": numero,
                    "fase": jogo.get("fase", ""),
                    "time_a": jogo.get("time_a", ""),
                    "time_b": jogo.get("time_b", ""),
                    "palpite": palpite,
                    "resultado": resultado,
                    "pontos": pontos,
                }
            )

        ctx = _ctx_base(ranking, asset_prefix="../")
        ctx["ia"] = ia_info
        ctx["jogos_detalhe"] = jogos_detalhe
        html = tmpl.render(**ctx)
        (ias_dir / f"{slug}.html").write_text(html, encoding="utf-8", newline="\n")


def _renderizar_paginas_jogos(
    env: Environment,
    web_dir: Path,
    ranking: dict[str, Any],
    jogos: list[dict[str, Any]],
    palpites_por_ia: dict[str, list[dict[str, Any]]],
    resultados_por_jogo: dict[int, dict[str, Any]],
    pontos_por_par: dict[tuple[str, int], int],
) -> None:
    tmpl = env.get_template("jogo.html.j2")
    jogos_dir = web_dir / "jogo"
    jogos_dir.mkdir(parents=True, exist_ok=True)
    ias_indexed = _index_por_slug(ranking.get("ias", []))

    palpites_lookup: dict[int, dict[str, dict[str, Any]]] = {}
    for slug, palpites in palpites_por_ia.items():
        for p in palpites:
            palpites_lookup.setdefault(p["jogo_numero"], {})[slug] = p

    for jogo in jogos:
        numero = jogo["numero"]
        palpites_neste_jogo = palpites_lookup.get(numero, {})
        linhas = []
        for slug, ia_info in ias_indexed.items():
            palpite = palpites_neste_jogo.get(slug)
            pontos = pontos_por_par.get((slug, numero))
            linhas.append(
                {
                    "slug": slug,
                    "nome_display": ia_info.get("nome_display", slug),
                    "palpite": palpite,
                    "pontos": pontos,
                }
            )
        linhas.sort(key=lambda r: (-(r["pontos"] or 0), r["nome_display"].lower()))

        ctx = _ctx_base(ranking, asset_prefix="../")
        ctx["jogo"] = jogo
        ctx["resultado"] = resultados_por_jogo.get(numero)
        ctx["palpites_ias"] = linhas
        html = tmpl.render(**ctx)
        (jogos_dir / f"{numero}.html").write_text(html, encoding="utf-8", newline="\n")


def renderizar_html(
    ranking_json: Path,
    web_dir: Path,
    *,
    templates_dir: Path | None = None,
) -> None:
    """Renderiza ``index.html`` e (se dados auxiliares existirem) páginas por IA e por jogo.

    Aux opcionais (procurados em ``web_dir / 'data' /``):
      - ``jogos.json`` → list[dict] com {numero, fase, data, hora, local, time_a, time_b}
      - ``palpites.json`` → {slug_ia: [{jogo_numero, gols_a, gols_b}, ...]}
      - ``resultados.json`` → [{jogo_numero, gols_a, gols_b}, ...]
      - ``pontuacoes.json`` → [{slug, jogo_numero, pontos}, ...]
    """
    ranking_json = Path(ranking_json)
    web_dir = Path(web_dir)
    if not ranking_json.is_file():
        raise FileNotFoundError(f"ranking JSON não encontrado: {ranking_json}")

    web_dir.mkdir(parents=True, exist_ok=True)

    tdir = Path(templates_dir) if templates_dir else _DEFAULT_TEMPLATES_DIR
    if not tdir.is_dir():
        raise FileNotFoundError(f"templates dir não encontrado: {tdir}")

    env = _ambiente(tdir)
    ranking = _carregar_json(ranking_json)

    _renderizar_index(env, web_dir, ranking)

    data_dir = web_dir / "data"
    jogos_path = data_dir / "jogos.json"
    palpites_path = data_dir / "palpites.json"
    resultados_path = data_dir / "resultados.json"
    pontuacoes_path = data_dir / "pontuacoes.json"

    if not (jogos_path.is_file() and palpites_path.is_file()):
        return

    jogos: list[dict[str, Any]] = _carregar_json(jogos_path)
    palpites_por_ia: dict[str, list[dict[str, Any]]] = _carregar_json(palpites_path)
    resultados_lista: list[dict[str, Any]] = (
        _carregar_json(resultados_path) if resultados_path.is_file() else []
    )
    resultados_por_jogo = {r["jogo_numero"]: r for r in resultados_lista}

    pontos_por_par: dict[tuple[str, int], int] = {}
    if pontuacoes_path.is_file():
        for item in _carregar_json(pontuacoes_path):
            pontos_por_par[(item["slug"], item["jogo_numero"])] = item["pontos"]

    _renderizar_paginas_ias(
        env, web_dir, ranking, jogos, palpites_por_ia, resultados_por_jogo, pontos_por_par
    )
    _renderizar_paginas_jogos(
        env, web_dir, ranking, jogos, palpites_por_ia, resultados_por_jogo, pontos_por_par
    )


__all__ = ["renderizar_html"]
