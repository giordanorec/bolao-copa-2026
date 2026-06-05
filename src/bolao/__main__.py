"""CLI entry point: python -m bolao <subcomando>."""

from __future__ import annotations

import argparse
import sys

from . import __version__


def _todo(cmd: str) -> int:
    print(f"[scaffold] subcomando '{cmd}' será implementado pelo pipeline-dev na Fase 4")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="bolao",
        description="Bolão da Copa 2026 - pipeline de palpites de IAs",
    )
    parser.add_argument("--version", action="version", version=f"bolao {__version__}")
    sub = parser.add_subparsers(dest="cmd", required=False)

    for name, help_ in [
        ("parse", "valida e parseia jogos, palpites e resultados"),
        ("score", "calcula pontuação por palpite"),
        ("ranking", "gera ranking HTML estático"),
        ("resumo", "gera texto de resumo pra WhatsApp"),
        ("rodada", "executa parse + score + ranking + resumo"),
        ("serve", "serve web/ via http.server"),
    ]:
        sub.add_parser(name, help=help_)

    args = parser.parse_args(argv)

    if args.cmd is None:
        parser.print_help()
        return 0

    return _todo(args.cmd)


if __name__ == "__main__":
    sys.exit(main())
