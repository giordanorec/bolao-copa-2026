#!/usr/bin/env python
"""Shim jq para Windows: cobre apenas os usos do plugin multiagentes-giordano.

Padrões suportados:
  jq -r 'keys[]' file.json
  jq -r '.field // "default"' file.json
  jq -r --arg KEY VAL '.[$KEY] // empty' file.json
  jq --arg K1 V1 --arg K2 V2 '. + {($K1): $K2}' file.json   (uso: adiciona/atualiza chave)

Para qualquer outro padrão, sai com erro claro.
"""

from __future__ import annotations

import json
import re
import sys


def fatal(msg: str) -> None:
    sys.stderr.write(f"jq-shim: {msg}\n")
    sys.exit(2)


def main() -> int:
    args = sys.argv[1:]
    raw_mode = False
    arg_vars: dict[str, str] = {}
    positional: list[str] = []

    i = 0
    while i < len(args):
        a = args[i]
        if a == "-r" or a == "--raw-output":
            raw_mode = True
        elif a == "--arg":
            if i + 2 >= len(args):
                fatal("--arg precisa de NOME VALOR")
            arg_vars[args[i + 1]] = args[i + 2]
            i += 2
        elif a.startswith("--"):
            fatal(f"flag não suportada pelo shim: {a}")
        else:
            positional.append(a)
        i += 1

    if not positional:
        fatal("expressão jq ausente")

    expr = positional[0]
    file_path = positional[1] if len(positional) > 1 else None

    if file_path:
        with open(file_path, encoding="utf-8") as f:
            data = json.load(f)
    else:
        data = json.load(sys.stdin)

    result = evaluate(expr, data, arg_vars)
    emit(result, raw_mode)
    return 0


def evaluate(expr: str, data, arg_vars: dict[str, str]):
    e = expr.strip()

    # 'keys[]' → lista as chaves
    if e == "keys[]":
        if not isinstance(data, dict):
            fatal("keys[] requer objeto")
        return list(data.keys())

    # '.field // default'  ou  '.field'
    m = re.match(r'^\.([A-Za-z_][\w]*)\s*(?://\s*("[^"]*"|""))?$', e)
    if m:
        field = m.group(1)
        default_raw = m.group(2)
        if isinstance(data, dict) and field in data and data[field] is not None:
            return data[field]
        if default_raw is None:
            return None
        return json.loads(default_raw)

    # '.[$VAR] // empty'  ou  '.[$VAR]'
    m = re.match(r'^\.\[\$([A-Za-z_]\w*)\]\s*(?://\s*(empty|""|"[^"]*"))?$', e)
    if m:
        var_name = m.group(1)
        default_raw = m.group(2)
        if var_name not in arg_vars:
            fatal(f"variável $${var_name} não foi passada com --arg")
        key = arg_vars[var_name]
        if isinstance(data, dict) and key in data:
            return data[key]
        if default_raw is None or default_raw == "empty":
            return _EMPTY
        return json.loads(default_raw)

    # '. + {($K): $V}'  → adiciona/sobrescreve chave $K com valor $V (string)
    m = re.match(r"^\.\s*\+\s*\{\(\$([A-Za-z_]\w*)\)\s*:\s*\$([A-Za-z_]\w*)\}$", e)
    if m:
        key_var, val_var = m.group(1), m.group(2)
        if key_var not in arg_vars or val_var not in arg_vars:
            fatal("variáveis ausentes para merge")
        out = dict(data) if isinstance(data, dict) else {}
        out[arg_vars[key_var]] = arg_vars[val_var]
        return out

    fatal(f"expressão não suportada pelo shim: {expr!r}")
    return None


_EMPTY = object()


def emit(value, raw: bool) -> None:
    if value is _EMPTY or value is None and raw:
        # jq -r '.x // empty' não imprime nada
        return
    if isinstance(value, list):
        for item in value:
            emit(item, raw)
        return
    if raw and isinstance(value, str):
        print(value)
    else:
        print(json.dumps(value, ensure_ascii=False))


if __name__ == "__main__":
    sys.exit(main())
