"""Gera mascote do Claude Fable 5 a partir do mascote do Claude Opus 4.8 web.

Aplica: inversao de cores RGB (mantem alpha) + glow externo, pra dar uma
identidade visual distinta de "variante misteriosa/nova".

Uso: .venv/Scripts/python.exe scripts/gerar_mascote_fable.py
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "v4" / "public" / "mascots" / "claude-opus-4-8-web.png"
DST = ROOT / "v4" / "public" / "mascots" / "claude-fable-5.png"


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Mascote do Opus nao encontrada em {SRC}")

    src = Image.open(SRC).convert("RGBA")
    w, h = src.size

    # Inverte RGB mantendo alpha original
    r, g, b, a = src.split()
    r_inv = r.point(lambda v: 255 - v)
    g_inv = g.point(lambda v: 255 - v)
    b_inv = b.point(lambda v: 255 - v)
    inverted = Image.merge("RGBA", (r_inv, g_inv, b_inv, a))

    # Glow externo: usa a propria alpha como mascara, expande e borra,
    # pinta de magenta-azulado (#a855f7 ~ purple do tema do bolao)
    glow_color = (168, 85, 247)  # roxo
    glow_canvas = Image.new("RGBA", (w + 80, h + 80), (0, 0, 0, 0))
    # mascara de alpha agigantada e borrada
    alpha_big = a.resize((w, h))
    alpha_mask = Image.new("L", (w + 80, h + 80), 0)
    alpha_mask.paste(alpha_big, (40, 40))
    alpha_blur = alpha_mask.filter(ImageFilter.GaussianBlur(18))
    # cor solida onde tem alpha
    glow_layer = Image.new("RGBA", (w + 80, h + 80), (*glow_color, 0))
    glow_layer.putalpha(alpha_blur)

    # Compoe glow embaixo, mascote invertida em cima (com pad pra centralizar)
    out = glow_canvas
    out = Image.alpha_composite(out, glow_layer)
    inv_padded = Image.new("RGBA", (w + 80, h + 80), (0, 0, 0, 0))
    inv_padded.paste(inverted, (40, 40), inverted)
    out = Image.alpha_composite(out, inv_padded)

    DST.parent.mkdir(parents=True, exist_ok=True)
    out.save(DST, "PNG", optimize=True)
    print(f"OK -> {DST} ({out.size[0]}x{out.size[1]})")


if __name__ == "__main__":
    main()
