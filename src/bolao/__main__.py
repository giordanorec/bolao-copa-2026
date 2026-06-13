"""CLI entry point: ``python -m bolao <subcomando>``.

Subcomandos:
    parse    valida e parseia jogos/palpites/resultados
    score    grava reports/<YYYY-MM-DD>/pontuacao.json
    ranking  grava web/data/ranking.json (HTML fica com frontend-dev)
    resumo   gera resumo.txt pronto pra WhatsApp
    rodada   parse + score + ranking + resumo
    serve    python -m http.server em web/ na porta 8000
    coletar  chama OpenRouter pra preencher data/palpites_ias/<slug>.md
"""

from __future__ import annotations

import argparse
import contextlib
import http.server
import json
import os
import re
import socketserver
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

from . import __version__
from .cristal import calcular_bola_de_cristal
from .parser import carregar_jogos, carregar_palpites, carregar_resultados, take_errors
from .ranking import pontos_por_ia, ranking_geral

BRT = timezone(timedelta(hours=-3))

ROOT = Path.cwd()
JOGOS_PATH = ROOT / "data" / "jogos.md"
PALPITES_DIR = ROOT / "data" / "palpites_ias"
RESULTADOS_PATH = ROOT / "data" / "resultados" / "jogos.md"
WEB_DIR = ROOT / "web"
WEB_DATA_DIR = WEB_DIR / "data"
REPORTS_DIR = ROOT / "reports"
RESUMO_PATH = ROOT / "resumo.txt"
OPENROUTER_MAPPING_PATH = ROOT / "config" / "openrouter_mapping.json"
PROMPT_API_PATH = ROOT / "config" / "prompts" / "ia-palpiteira.md"
DOSSIE_DIR = ROOT / "data" / "dossie"

_NOME_RE = re.compile(r"^<!--\s*ia:\s*(.+?)\s*-->\s*$", re.MULTILINE)
_NOME_CACHE: dict[str, str] = {}


def _nome_display(slug: str) -> str:
    """Resolve nome bonito da IA. Ordem de fonte:

    1. Slug especial ``bola-de-cristal`` retorna nome fixo.
    2. Header ``<!-- ia: Nome Bonito -->`` no arquivo ``data/palpites_ias/<slug>.md``.
       É o lugar canônico — escrito pelo ``scripts/bootstrap_palpites.sh``.
    3. Fallback ``slug.title()`` com hífens substituídos.

    Cacheado em memória dentro de uma execução do CLI pra não reler arquivos.
    """
    if slug in _NOME_CACHE:
        return _NOME_CACHE[slug]
    # Slug especial — não tem arquivo de palpite
    if slug == "bola-de-cristal":
        _NOME_CACHE[slug] = "Bola de Cristal"
        return _NOME_CACHE[slug]
    arq = PALPITES_DIR / f"{slug}.md"
    if arq.is_file():
        try:
            m = _NOME_RE.search(arq.read_text(encoding="utf-8"))
            if m:
                _NOME_CACHE[slug] = m.group(1)
                return _NOME_CACHE[slug]
        except OSError:
            pass
    _NOME_CACHE[slug] = slug.replace("-", " ").title()
    return _NOME_CACHE[slug]


def _carregar_tudo() -> tuple[list, dict, list]:  # type: ignore[type-arg]
    jogos = carregar_jogos(JOGOS_PATH)
    palpites = carregar_palpites(PALPITES_DIR, jogos=jogos)
    resultados = carregar_resultados(RESULTADOS_PATH)
    return jogos, palpites, resultados


def _cmd_parse(_args: argparse.Namespace) -> int:
    jogos, palpites, resultados = _carregar_tudo()
    erros = take_errors()
    total_palpites = sum(len(v) for v in palpites.values())
    print(
        f"parse: {len(jogos)} jogos, {len(palpites)} IAs, "
        f"{total_palpites} palpites válidos, {len(resultados)} resultados, "
        f"{erros} erro(s)"
    )
    if erros > 0 or not jogos:
        return 1
    return 0


def _cmd_score(_args: argparse.Namespace) -> int:
    jogos, palpites, resultados = _carregar_tudo()
    take_errors()  # absorve para não vazar pra próximo comando
    agregado = pontos_por_ia(palpites, resultados, jogos)

    hoje = datetime.now(BRT).strftime("%Y-%m-%d")
    out_dir = REPORTS_DIR / hoje
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "pontuacao.json"
    out_path.write_text(
        json.dumps(agregado, ensure_ascii=False, indent=2, sort_keys=True),
        encoding="utf-8",
    )
    print(f"score: {out_path} ({len(agregado)} IAs apuradas)")
    return 0


def _carregar_popularidade() -> dict[str, int]:
    """Lê popularidade de cada slug do web/data/ias_logos.json (0 se ausente)."""
    path = ROOT / "web" / "data" / "ias_logos.json"
    if not path.is_file():
        return {}
    raw = json.loads(path.read_text(encoding="utf-8"))
    ias = raw.get("ias", {})
    return {s: int(m.get("popularidade", 0)) for s, m in ias.items() if not s.startswith("_")}


_SLUG_CRISTAL = "bola-de-cristal"
_NOME_CRISTAL = "Bola de Cristal"


def _cmd_ranking(_args: argparse.Namespace) -> int:
    from .models import Palpite as _Palpite

    jogos, palpites, resultados = _carregar_tudo()
    take_errors()

    # Calcular e persistir Bola de Cristal antes de incluir no ranking
    cristal_resultado = calcular_bola_de_cristal(palpites, jogos)
    WEB_DATA_DIR.mkdir(parents=True, exist_ok=True)
    (WEB_DATA_DIR / "bola_de_cristal.json").write_text(
        json.dumps(
            {str(k): v for k, v in cristal_resultado.items()},
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"cristal: {WEB_DATA_DIR / 'bola_de_cristal.json'} ({len(cristal_resultado)} jogos)")

    # Injetar Bola de Cristal no mapa de palpites como IA especial
    palpites_com_cristal = dict(palpites)
    palpites_com_cristal[_SLUG_CRISTAL] = [
        _Palpite(
            ia=_SLUG_CRISTAL,
            jogo_numero=numero,
            gols_a=v["gols_a"],
            gols_b=v["gols_b"],
        )
        for numero, v in cristal_resultado.items()
    ]

    ranking = ranking_geral(palpites_com_cristal, resultados, jogos)

    # Desempate por popularidade dentro de grupos com mesmos (pontos, exatos, vencedores)
    popmap = _carregar_popularidade()
    ranking_sorted = sorted(
        ranking,
        key=lambda r: (
            -r["pontos"],
            -r["placares_exatos"],
            -r["vencedores_acertados"],
            -popmap.get(r["slug"], 0),
            r["slug"],
        ),
    )

    # Competition rank: IAs com (pontos, exatos, vencedores) iguais
    # compartilham a mesma posição. Próxima posição salta pelos empatados.
    # Ex: [10, 8, 8, 6] -> ranks [1, 2, 2, 4]
    ias_json: list[dict[str, object]] = []
    for idx, r in enumerate(ranking_sorted):
        if idx == 0:
            rank = 1
        else:
            prev = ranking_sorted[idx - 1]
            mesmo_grupo = (
                r["pontos"] == prev["pontos"]
                and r["placares_exatos"] == prev["placares_exatos"]
                and r["vencedores_acertados"] == prev["vencedores_acertados"]
            )
            rank = ias_json[idx - 1]["rank"] if mesmo_grupo else idx + 1  # type: ignore[assignment]
        ias_json.append(
            {
                "slug": r["slug"],
                "nome_display": _nome_display(r["slug"]),
                "pontos": r["pontos"],
                "placares_exatos": r["placares_exatos"],
                "vencedores_acertados": r["vencedores_acertados"],
                "jogos_palpitados": r["jogos_palpitados"],
                "palpites_total": r["palpites_total"],
                "rank": rank,
            }
        )

    payload = {
        "atualizado_em": datetime.now(BRT).isoformat(timespec="seconds"),
        "ias": ias_json,
        "jogos_apurados": len(resultados),
        "jogos_totais": len(jogos),
    }

    WEB_DATA_DIR.mkdir(parents=True, exist_ok=True)
    out_path = WEB_DATA_DIR / "ranking.json"
    out_path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"ranking: {out_path} ({len(ias_json)} IAs)")

    # Gerar dados auxiliares (jogos.json, palpites.json, resultados.json) para o site
    jogos_serial = [
        {
            "numero": j.numero,
            "fase": j.fase,
            "data": j.data,
            "hora": j.hora,
            "local": j.local,
            "time_a": j.time_a,
            "time_b": j.time_b,
        }
        for j in jogos
    ]
    (WEB_DATA_DIR / "jogos.json").write_text(
        json.dumps(jogos_serial, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    palpites_serial: dict[str, list[dict[str, object]]] = {}
    for slug, lista in palpites.items():
        palpites_serial[slug] = [
            {"jogo_numero": p.jogo_numero, "gols_a": p.gols_a, "gols_b": p.gols_b} for p in lista
        ]
    (WEB_DATA_DIR / "palpites.json").write_text(
        json.dumps(palpites_serial, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    resultados_serial = [
        {"jogo_numero": r.jogo_numero, "gols_a": r.gols_a, "gols_b": r.gols_b} for r in resultados
    ]
    (WEB_DATA_DIR / "resultados.json").write_text(
        json.dumps(resultados_serial, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    # Renderizar o site estático
    try:
        from .render import renderizar_html

        renderizar_html(out_path, WEB_DIR)
        print(f"site: {WEB_DIR}/index.html + jogos/ + ia/ renderizados")
    except Exception as exc:
        print(f"site: ERRO ao renderizar HTML — {exc}", file=sys.stderr)
        return 1

    return 0


def _cmd_resumo(_args: argparse.Namespace) -> int:
    jogos, palpites, resultados = _carregar_tudo()
    take_errors()
    ranking = ranking_geral(palpites, resultados, jogos)

    linhas: list[str] = [
        "[bolao-copa] Atualização do bolão das IAs",
        "",
        f"Jogos apurados: {len(resultados)}/{len(jogos)}",
    ]
    if not ranking:
        linhas += ["", "(nenhum palpite carregado ainda)"]
    else:
        linhas += ["", "Ranking parcial:"]
        for pos, r in enumerate(ranking, start=1):
            linhas.append(
                f"  {pos}. {_nome_display(r['slug'])} — "
                f"{r['pontos']} pts "
                f"({r['placares_exatos']} exatos, "
                f"{r['vencedores_acertados']} venc., "
                f"{r['jogos_palpitados']} palpitados)"
            )

    texto = "\n".join(linhas) + "\n"
    RESUMO_PATH.write_text(texto, encoding="utf-8")
    print(f"resumo: {RESUMO_PATH}")
    return 0


def _cmd_rodada(args: argparse.Namespace) -> int:
    for cmd in (_cmd_parse, _cmd_score, _cmd_ranking, _cmd_resumo):
        rc = cmd(args)
        if rc != 0:
            return rc
    return 0


def _carregar_mapping_openrouter() -> dict[str, dict[str, object]]:
    if not OPENROUTER_MAPPING_PATH.is_file():
        raise FileNotFoundError(
            f"mapping não encontrado: {OPENROUTER_MAPPING_PATH}. "
            "Veja specs/F4.5-coletor-api-e-dossie.md."
        )
    raw = json.loads(OPENROUTER_MAPPING_PATH.read_text(encoding="utf-8"))
    return {k: v for k, v in raw.items() if not k.startswith("_")}


def _filtrar_ias_coletar(
    mapping: dict[str, dict[str, object]],
    tier_arg: str | None,
    ia_arg: str | None,
) -> list[dict[str, object]]:
    if ia_arg:
        slugs = [s.strip() for s in ia_arg.split(",") if s.strip()]
        out: list[dict[str, object]] = []
        for slug in slugs:
            entry = mapping.get(slug)
            if entry is None:
                print(
                    f"WARN: slug '{slug}' fora do mapping openrouter; pulando",
                    file=sys.stderr,
                )
                continue
            out.append({"slug": slug, **entry})
        return out
    if tier_arg and tier_arg != "all":
        try:
            tier_n = int(tier_arg)
        except ValueError:
            print(f"erro: --tier deve ser inteiro ou 'all' (recebi {tier_arg!r})", file=sys.stderr)
            return []
        return [{"slug": s, **entry} for s, entry in mapping.items() if entry.get("tier") == tier_n]
    return [{"slug": s, **entry} for s, entry in mapping.items()]


def _achar_dossie_default() -> Path | None:
    if not DOSSIE_DIR.is_dir():
        return None
    candidatos = sorted(DOSSIE_DIR.glob("*.md"))
    return candidatos[-1] if candidatos else None


def _cmd_coletar(args: argparse.Namespace) -> int:
    try:
        mapping = _carregar_mapping_openrouter()
    except FileNotFoundError as e:
        print(f"erro: {e}", file=sys.stderr)
        return 1

    ias = _filtrar_ias_coletar(mapping, args.tier, args.ia)
    if not ias:
        print("erro: nenhuma IA selecionada pelos filtros", file=sys.stderr)
        return 1

    dossie_path = Path(args.dossie) if args.dossie else _achar_dossie_default()
    if not args.dry_run:
        if dossie_path is None:
            print(
                f"erro: nenhum dossiê em {DOSSIE_DIR}. Passe --dossie <path> "
                "ou rode com --dry-run.",
                file=sys.stderr,
            )
            return 1
        if not dossie_path.is_file():
            print(f"erro: dossiê {dossie_path} não existe", file=sys.stderr)
            return 1
        if not PROMPT_API_PATH.is_file():
            print(f"erro: prompt não encontrado em {PROMPT_API_PATH}", file=sys.stderr)
            return 1

    dossie_label = dossie_path.name if dossie_path else "(nenhum)"
    print(
        f"coletar: {len(ias)} IA(s) alvo · dossiê={dossie_label} · max_paralelo={args.max_paralelo}"
    )
    for item in ias:
        print(f"  - {item['slug']:32s} -> {item['model']}  (tier {item['tier']})")

    if args.dry_run:
        print("(dry-run; nenhuma chamada feita)")
        return 0

    try:
        from .coletor import coletar_lote
    except ImportError as e:
        print(f"erro: falta httpx ({e}). 'pip install -e .'", file=sys.stderr)
        return 1

    assert dossie_path is not None
    prompt_texto = PROMPT_API_PATH.read_text(encoding="utf-8")
    dossie_texto = dossie_path.read_text(encoding="utf-8")
    if "{{DOSSIE}}" in prompt_texto:
        prompt_texto = prompt_texto.replace("{{DOSSIE}}", dossie_texto)
        dossie_param = ""
    else:
        dossie_param = dossie_texto

    import asyncio

    resultados = asyncio.run(
        coletar_lote(
            ias=[{"slug": i["slug"], "model": i["model"]} for i in ias],
            prompt=prompt_texto,
            dossie=dossie_param,
            palpites_dir=PALPITES_DIR,
            max_paralelo=args.max_paralelo,
        )
    )
    ok = sum(1 for r in resultados if r["ok"])
    print(f"coletar: {ok}/{len(resultados)} sucesso")
    return 0 if ok == len(resultados) else 1


def _cmd_serve(_args: argparse.Namespace) -> int:
    WEB_DIR.mkdir(parents=True, exist_ok=True)
    os.chdir(WEB_DIR)
    handler = http.server.SimpleHTTPRequestHandler
    port = 8000
    with socketserver.TCPServer(("", port), handler) as httpd:
        print(f"serve: http://localhost:{port}  (Ctrl-C pra parar)")
        with contextlib.suppress(KeyboardInterrupt):
            httpd.serve_forever()
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="bolao",
        description="Bolão da Copa 2026 - pipeline de palpites de IAs",
    )
    parser.add_argument("--version", action="version", version=f"bolao {__version__}")
    sub = parser.add_subparsers(dest="cmd", required=False)

    handlers = {
        "parse": ("valida e parseia jogos, palpites e resultados", _cmd_parse),
        "score": (
            "calcula pontuação e grava reports/<data>/pontuacao.json",
            _cmd_score,
        ),
        "ranking": ("regenera web/data/ranking.json", _cmd_ranking),
        "resumo": ("gera resumo.txt pronto pra WhatsApp", _cmd_resumo),
        "rodada": ("executa parse + score + ranking + resumo", _cmd_rodada),
        "serve": ("serve web/ via http.server na porta 8000", _cmd_serve),
        "coletar": (
            "chama OpenRouter pra coletar palpites das IAs API",
            _cmd_coletar,
        ),
    }
    for name, (help_, _) in handlers.items():
        sp = sub.add_parser(name, help=help_)
        if name == "coletar":
            sp.add_argument(
                "--tier",
                default=None,
                help="filtra por tier (1..8) ou 'all' (default: all se sem --ia)",
            )
            sp.add_argument(
                "--ia",
                default=None,
                help="slug(s) separados por vírgula (sobrescreve --tier)",
            )
            sp.add_argument(
                "--dossie",
                default=None,
                help="path do dossiê .md (default: último em data/dossie/)",
            )
            sp.add_argument(
                "--dry-run",
                action="store_true",
                help="lista IAs alvo, não chama API",
            )
            sp.add_argument(
                "--apply",
                action="store_true",
                help="(no-op) explicita intenção de chamar a API; default já chama",
            )
            sp.add_argument(
                "--max-paralelo",
                type=int,
                default=5,
                help="máximo de requisições paralelas (default 5)",
            )

    args = parser.parse_args(argv)
    if args.cmd is None:
        parser.print_help()
        return 0
    return handlers[args.cmd][1](args)


if __name__ == "__main__":
    sys.exit(main())
