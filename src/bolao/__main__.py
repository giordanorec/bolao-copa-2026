"""CLI entry point: ``python -m bolao <subcomando>``.

Subcomandos:
    parse    valida e parseia jogos/palpites/resultados
    score    grava reports/<YYYY-MM-DD>/pontuacao.json
    ranking  grava web/data/ranking.json (HTML fica com frontend-dev)
    resumo   gera resumo.txt pronto pra WhatsApp
    rodada   parse + score + ranking + resumo
    serve    python -m http.server em web/ na porta 8000
"""

from __future__ import annotations

import argparse
import contextlib
import http.server
import json
import os
import socketserver
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

from . import __version__
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

_NOME_OVERRIDES = {
    "chatgpt-5": "ChatGPT 5",
    "gemini-2-5-pro": "Gemini 2.5 Pro",
    "claude-opus-4-7": "Claude Opus 4.7",
    "grok-4": "Grok 4",
    "deepseek-r1": "DeepSeek R1",
}


def _nome_display(slug: str) -> str:
    if slug in _NOME_OVERRIDES:
        return _NOME_OVERRIDES[slug]
    return slug.replace("-", " ").title()


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


def _cmd_ranking(_args: argparse.Namespace) -> int:
    jogos, palpites, resultados = _carregar_tudo()
    take_errors()
    ranking = ranking_geral(palpites, resultados, jogos)

    ias_json = [
        {
            "slug": r["slug"],
            "nome_display": _nome_display(r["slug"]),
            "pontos": r["pontos"],
            "placares_exatos": r["placares_exatos"],
            "vencedores_acertados": r["vencedores_acertados"],
            "jogos_palpitados": r["jogos_palpitados"],
        }
        for r in ranking
    ]

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
    }
    for name, (help_, _) in handlers.items():
        sub.add_parser(name, help=help_)

    args = parser.parse_args(argv)
    if args.cmd is None:
        parser.print_help()
        return 0
    return handlers[args.cmd][1](args)


if __name__ == "__main__":
    sys.exit(main())
