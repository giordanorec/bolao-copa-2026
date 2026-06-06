"""Renderização HTML estático do bolão — site brasileiro festivo.

Importado pelo CLI (`src/bolao/__main__.py`) após `score`/`ranking`. Lê:

  - web/data/ranking.json  (canônico, gerado pelo cmd `ranking`)
  - web/data/jogos.json    (gerado pelo cmd `ranking` a partir do parser)
  - web/data/palpites.json (idem)
  - web/data/resultados.json (idem, opcional)
  - web/data/pontuacoes.json (idem, opcional)
  - web/data/paises.json   (mapa nome-pt -> ISO 3166-1)
  - web/data/ias_logos.json (mapa slug -> {provider, label, family})

Renderiza:
  - index.html (hero + ranking)
  - jogos.html (grid dos 104)
  - ias.html (grid das IAs)
  - jogo/<numero>.html
  - ia/<slug>.html
"""

from __future__ import annotations

import json
import unicodedata
from collections import Counter
from datetime import datetime
from pathlib import Path
from typing import Any

from jinja2 import Environment, FileSystemLoader, StrictUndefined, select_autoescape
from markupsafe import Markup, escape

_HERE = Path(__file__).resolve().parent
_DEFAULT_TEMPLATES_DIR = _HERE.parent.parent / "web" / "templates"

FLAG_BASE = "https://hatscripts.github.io/circle-flags/flags"
LOBE_ICONS_BASE = "https://unpkg.com/@lobehub/icons-static-svg@latest/icons"


def _carregar_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def _formatar_humano(iso: str) -> str:
    try:
        dt = datetime.fromisoformat(iso)
    except ValueError:
        return iso
    return dt.strftime("%d/%m/%Y %H:%M")


def _normalize(s: str) -> str:
    nfkd = unicodedata.normalize("NFKD", s)
    return "".join(c for c in nfkd if not unicodedata.combining(c)).strip()


def _inicial(slug: str) -> str:
    s = slug.replace("-", " ").strip()
    return s[0].upper() if s else "?"


def _data_br(iso: str) -> str:
    """ISO YYYY-MM-DD -> 'Qui 11/06'."""
    dias = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]
    try:
        dt = datetime.fromisoformat(iso)
        return f"{dias[dt.weekday()]} {dt.day:02d}/{dt.month:02d}"
    except (ValueError, IndexError):
        return iso


class _Render:
    def __init__(self, web_dir: Path):
        self.web_dir = web_dir
        self.data_dir = web_dir / "data"
        self.paises = _carregar_json(self.data_dir / "paises.json")
        self.ias_logos = _carregar_json(self.data_dir / "ias_logos.json")
        self.providers_colors = self.ias_logos.get("_defaults_color", {})
        self.ias_meta = self.ias_logos.get("ias", {})

    def _iso_pais(self, nome: str) -> str | None:
        if not nome:
            return None
        # match direto
        code = self.paises.get(nome)
        if code:
            return code
        # tentativa normalizando acentos
        norm = _normalize(nome)
        for k, v in self.paises.items():
            if k.startswith("_"):
                continue
            if _normalize(k) == norm:
                return v
        return None

    def flag_img(self, nome: str, mini: bool = False) -> Markup:
        iso = self._iso_pais(nome)
        cls = "flag-mini" if mini else ""
        alt = escape(nome)
        if iso:
            url = f"{FLAG_BASE}/{iso}.svg"
            return Markup(f'<img class="{cls}" src="{url}" alt="{alt}" loading="lazy">')
        # fallback — placeholder com iniciais (1-2 letras)
        s = _normalize(nome)
        ini = "".join(w[0] for w in s.split()[:2]).upper() or "?"
        return Markup(f'<span class="flag-fallback {cls}" title="{alt}">{escape(ini)}</span>')

    def ia_logo(self, slug: str, big: bool = False) -> Markup:
        meta = self.ias_meta.get(slug, {})
        provider = meta.get("provider", "")
        icon = meta.get("icon")
        color = self.providers_colors.get(provider, "92929b")
        cls = "logo-big-inner" if big else ""
        if icon:
            url = f"{LOBE_ICONS_BASE}/{icon}.svg"
            return Markup(
                f'<img class="ia-svg {cls}" src="{url}" alt="{escape(slug)}" loading="lazy">'
            )
        ini = _inicial(slug)
        style = f"background:#{color};color:#fff;"
        return Markup(f'<span class="initial-pill {cls}" style="{style}">{escape(ini)}</span>')

    def ia_family(self, slug: str) -> str:
        meta = self.ias_meta.get(slug, {})
        return meta.get("family", "—")

    def popularidade(self, slug: str) -> int:
        meta = self.ias_meta.get(slug, {})
        return int(meta.get("popularidade", 0))


def _ambiente(templates_dir: Path) -> Environment:
    return Environment(
        loader=FileSystemLoader(str(templates_dir)),
        autoescape=select_autoescape(enabled_extensions=("html", "j2")),
        undefined=StrictUndefined,
        trim_blocks=True,
        lstrip_blocks=True,
    )


def _enriquecer_jogos(jogos: list[dict[str, Any]]) -> None:
    for j in jogos:
        if "data" in j and "data_br" not in j:
            j["data_br"] = _data_br(j["data"])


def _calc_consenso(palpites_no_jogo: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if not palpites_no_jogo:
        return []
    contador: Counter[tuple[int, int]] = Counter()
    for p in palpites_no_jogo:
        ga, gb = p.get("gols_a"), p.get("gols_b")
        if ga is None or gb is None:
            continue
        contador[(ga, gb)] += 1
    total = sum(contador.values())
    if total == 0:
        return []
    saida = []
    for (ga, gb), n in contador.most_common():
        saida.append({"placar_a": ga, "placar_b": gb, "n": n, "pct": (n / total) * 100})
    return saida


def _ctx_base(ranking: dict[str, Any], asset_prefix: str, total_palpites: int) -> dict[str, Any]:
    atualizado = ranking.get("atualizado_em", "")
    ias = ranking.get("ias", [])
    return {
        "atualizado_em": atualizado,
        "atualizado_em_humano": _formatar_humano(atualizado) if atualizado else "—",
        "jogos_apurados": ranking.get("jogos_apurados", 0),
        "jogos_totais": ranking.get("jogos_totais", 104),
        "asset_prefix": asset_prefix,
        "total_ias": len(ias),
        "total_palpites": total_palpites,
    }


def renderizar_html(
    ranking_json: Path,
    web_dir: Path,
    *,
    templates_dir: Path | None = None,
) -> None:
    """Renderiza todo o site estático."""
    ranking_json = Path(ranking_json)
    web_dir = Path(web_dir)
    if not ranking_json.is_file():
        raise FileNotFoundError(f"ranking JSON não encontrado: {ranking_json}")

    web_dir.mkdir(parents=True, exist_ok=True)
    data_dir = web_dir / "data"

    tdir = Path(templates_dir) if templates_dir else _DEFAULT_TEMPLATES_DIR
    if not tdir.is_dir():
        raise FileNotFoundError(f"templates dir não encontrado: {tdir}")

    helper = _Render(web_dir)
    env = _ambiente(tdir)
    env.globals["flag_img"] = helper.flag_img
    env.globals["ia_logo"] = helper.ia_logo
    env.globals["ia_family"] = helper.ia_family
    env.globals["popularidade"] = helper.popularidade

    ranking = _carregar_json(ranking_json)
    jogos: list[dict[str, Any]] = (
        _carregar_json(data_dir / "jogos.json") if (data_dir / "jogos.json").is_file() else []
    )
    _enriquecer_jogos(jogos)
    palpites_por_ia: dict[str, list[dict[str, Any]]] = (
        _carregar_json(data_dir / "palpites.json") if (data_dir / "palpites.json").is_file() else {}
    )
    resultados_lista: list[dict[str, Any]] = (
        _carregar_json(data_dir / "resultados.json")
        if (data_dir / "resultados.json").is_file()
        else []
    )
    resultados_por_jogo = {r["jogo_numero"]: r for r in resultados_lista}
    pontos_por_par: dict[tuple[str, int], int] = {}
    if (data_dir / "pontuacoes.json").is_file():
        for item in _carregar_json(data_dir / "pontuacoes.json"):
            pontos_por_par[(item["slug"], item["jogo_numero"])] = item["pontos"]

    total_palpites = sum(len(v) for v in palpites_por_ia.values())

    # ------- index.html -------
    ctx = _ctx_base(ranking, asset_prefix="", total_palpites=total_palpites)
    ctx["ias"] = ranking.get("ias", [])
    (web_dir / "index.html").write_text(
        env.get_template("index.html.j2").render(**ctx),
        encoding="utf-8",
        newline="\n",
    )

    # ------- ias.html: ordenado por popularidade -------
    ctx_ias = dict(ctx)
    ctx_ias["ias_ordenadas"] = sorted(
        ranking.get("ias", []),
        key=lambda r: (-helper.popularidade(r["slug"]), r["nome_display"].lower()),
    )
    (web_dir / "ias.html").write_text(
        env.get_template("ias.html.j2").render(**ctx_ias),
        encoding="utf-8",
        newline="\n",
    )

    if not jogos:
        return

    # Bola de Cristal por jogo: placar mais votado pelas IAs
    palpites_lookup_tmp: dict[int, list[dict[str, Any]]] = {}
    for slug, palpites in palpites_por_ia.items():
        for p in palpites:
            palpites_lookup_tmp.setdefault(p["jogo_numero"], []).append(p)
    bola_cristal: dict[int, dict[str, int]] = {}
    for numero, lista in palpites_lookup_tmp.items():
        consenso_jogo = _calc_consenso(lista)
        if consenso_jogo:
            top = consenso_jogo[0]
            bola_cristal[numero] = {"gols_a": top["placar_a"], "gols_b": top["placar_b"]}

    # ------- jogos.html -------
    fases_unicas = []
    vistos: set[str] = set()
    for j in jogos:
        f = j.get("fase", "")
        if f and f not in vistos:
            vistos.add(f)
            fases_unicas.append(f)
    # anexar resultado + bola de cristal em cada jogo
    for j in jogos:
        j["resultado"] = resultados_por_jogo.get(j["numero"])
        j["bola_cristal"] = bola_cristal.get(j["numero"])
    ctx_jogos = dict(ctx)
    ctx_jogos["jogos"] = jogos
    ctx_jogos["fases_unicas"] = fases_unicas
    (web_dir / "jogos.html").write_text(
        env.get_template("jogos.html.j2").render(**ctx_jogos),
        encoding="utf-8",
        newline="\n",
    )

    # ------- páginas por jogo -------
    palpites_lookup: dict[int, dict[str, dict[str, Any]]] = {}
    for slug, palpites in palpites_por_ia.items():
        for p in palpites:
            palpites_lookup.setdefault(p["jogo_numero"], {})[slug] = p

    ias_indexed: dict[str, dict[str, Any]] = {}
    for pos, ia in enumerate(ranking.get("ias", []), start=1):
        slug = ia.get("slug")
        if slug:
            registro = dict(ia)
            registro["posicao"] = pos
            ias_indexed[slug] = registro

    jogos_dir = web_dir / "jogo"
    jogos_dir.mkdir(parents=True, exist_ok=True)
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

        def _sort_key(r: dict[str, Any]) -> tuple[int, int, str]:
            pts = -(r["pontos"] or 0)
            tem_palpite = 0 if r["palpite"] else 1
            return (tem_palpite, pts, r["nome_display"].lower())

        linhas.sort(key=_sort_key)
        consenso = _calc_consenso(list(palpites_neste_jogo.values()))

        ctx_jogo = _ctx_base(ranking, asset_prefix="../", total_palpites=total_palpites)
        ctx_jogo["jogo"] = jogo
        ctx_jogo["resultado"] = resultados_por_jogo.get(numero)
        ctx_jogo["palpites_ias"] = linhas
        ctx_jogo["consenso"] = consenso
        (jogos_dir / f"{numero}.html").write_text(
            env.get_template("jogo.html.j2").render(**ctx_jogo),
            encoding="utf-8",
            newline="\n",
        )

    # ------- páginas por IA -------
    ias_dir = web_dir / "ia"
    ias_dir.mkdir(parents=True, exist_ok=True)
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

        ctx_ia = _ctx_base(ranking, asset_prefix="../", total_palpites=total_palpites)
        ctx_ia["ia"] = ia_info
        ctx_ia["jogos_detalhe"] = jogos_detalhe
        (ias_dir / f"{slug}.html").write_text(
            env.get_template("ia.html.j2").render(**ctx_ia),
            encoding="utf-8",
            newline="\n",
        )


__all__ = ["renderizar_html"]
