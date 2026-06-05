"""Smoke test: garante que o pacote é importável e o CLI responde."""

from __future__ import annotations

import subprocess
import sys

import bolao


def test_versao_definida() -> None:
    assert bolao.__version__


def test_cli_help_nao_falha() -> None:
    result = subprocess.run(
        [sys.executable, "-m", "bolao", "--help"],
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0
    assert "bolao" in result.stdout.lower()
