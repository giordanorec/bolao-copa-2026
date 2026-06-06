"""Remove fundo verde chroma + crop bbox + resize 512px + otimiza PNG.

Uso:
    .venv/Scripts/python.exe scripts/process_mascots.py
"""
from __future__ import annotations

from pathlib import Path

from collections import deque

from PIL import Image, ImageDraw  # noqa: F401 (kept for compatibility)

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT / "web" / "assets"
OUT_DIR = ROOT / "web" / "assets" / "mascots"
OUT_DIR.mkdir(parents=True, exist_ok=True)

FILE_TO_SLUG = {
    "chatgpt.png": "chatgpt-5-thinking-web",
    "claude.png": "claude-opus-4-7-web",
    "gemini.png": "gemini-2-5-pro-web",
    "grok.png": "grok-4-heavy-web",
    "deepseek.png": "deepseek-r1-web",
    "perplexity.png": "perplexity-sonar-pro-web",
    "copilot.png": "copilot-microsoft-web",
    "mistral.png": "le-chat-mistral-web",
    "meta.png": "meta-llama-4-web",
    "qwen.png": "qwen-3-max-web",
}

TARGET = 512  # lado maior final
PADDING = 16  # margem ao redor da bbox


def is_green_bg(r: int, g: int, b: int) -> bool:
    """Verde de fundo (liberal — pega vinheta e AA)."""
    return g > 90 and g > r + 20 and g > b + 20


def is_green_strict(r: int, g: int, b: int) -> bool:
    """Verde claramente saturado — usado pra AA residual interno."""
    return g > 120 and g > r + 40 and g > b + 40


def chroma_remove(img: Image.Image) -> Image.Image:
    """Identifica todos pixels verde-fundo, faz BFS a partir das bordas.
    Só pixels verdes ALCANÇÁVEIS desde as bordas viram transparente.
    Verdes isolados no interior do mascote (ex: pele do marciano,
    olhos do gato) são preservados."""
    img = img.convert("RGBA")
    w, h = img.size
    src_px = img.load()
    original = img.copy()  # snapshot pra amostragem do bg depois

    # máscara: True onde pixel é "verde-fundo" candidato
    is_bg = [[False] * w for _ in range(h)]
    for y in range(h):
        for x in range(w):
            r, g, b, _a = src_px[x, y]
            if is_green_bg(r, g, b):
                is_bg[y][x] = True

    # BFS começando de todos pixels da borda que são verde-fundo
    visited = [[False] * w for _ in range(h)]
    queue: deque[tuple[int, int]] = deque()
    for x in range(w):
        for y in (0, h - 1):
            if is_bg[y][x] and not visited[y][x]:
                visited[y][x] = True
                queue.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if is_bg[y][x] and not visited[y][x]:
                visited[y][x] = True
                queue.append((x, y))

    while queue:
        x, y = queue.popleft()
        for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and is_bg[ny][nx] and not visited[ny][nx]:
                visited[ny][nx] = True
                queue.append((nx, ny))

    # aplica transparência nos visitados (verde conectado à borda)
    for y in range(h):
        for x in range(w):
            if visited[y][x]:
                src_px[x, y] = (0, 0, 0, 0)

    # AA residual: pixel verde-saturado tocando transparente vira transparente
    for _ in range(2):
        snapshot = img.copy()
        sp = snapshot.load()
        for y in range(h):
            for x in range(w):
                r, g, b, a = sp[x, y]
                if a == 0 or not is_green_strict(r, g, b):
                    continue
                for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and sp[nx, ny][3] == 0:
                        src_px[x, y] = (0, 0, 0, 0)
                        break

    # Pass extra: remove ilhas internas de verde com cor quase
    # idêntica ao fundo (buracos cercados pelo objeto, ex:
    # vão interno do clipe Clippy, abertura do dragão Qwen).
    # Calcula cor média do fundo amostrando linhas das bordas
    # da imagem ORIGINAL (antes da remoção).
    border_pixels: list[tuple[int, int, int]] = []
    for x in range(0, w, 4):
        border_pixels.append(original.getpixel((x, 0))[:3])
        border_pixels.append(original.getpixel((x, h - 1))[:3])
    for y in range(0, h, 4):
        border_pixels.append(original.getpixel((0, y))[:3])
        border_pixels.append(original.getpixel((w - 1, y))[:3])
    # Filtra só verdes (descarta amostras que já podem estar fora)
    greens = [(r, g, b) for r, g, b in border_pixels if is_green_bg(r, g, b)]
    if greens:
        bg_r = sum(p[0] for p in greens) / len(greens)
        bg_g = sum(p[1] for p in greens) / len(greens)
        bg_b = sum(p[2] for p in greens) / len(greens)
        thresh_sq = 42 ** 2
        orig_px = original.load()
        for y in range(h):
            for x in range(w):
                if src_px[x, y][3] == 0:
                    continue
                r, g, b = orig_px[x, y][:3]
                d_sq = (r - bg_r) ** 2 + (g - bg_g) ** 2 + (b - bg_b) ** 2
                if d_sq < thresh_sq:
                    src_px[x, y] = (0, 0, 0, 0)
    return img


def crop_bbox(img: Image.Image) -> Image.Image:
    bbox = img.getbbox()
    if bbox is None:
        return img
    x0, y0, x1, y1 = bbox
    w, h = img.size
    x0 = max(0, x0 - PADDING)
    y0 = max(0, y0 - PADDING)
    x1 = min(w, x1 + PADDING)
    y1 = min(h, y1 + PADDING)
    return img.crop((x0, y0, x1, y1))


def resize_max(img: Image.Image, target: int) -> Image.Image:
    w, h = img.size
    scale = target / max(w, h)
    if scale >= 1:
        return img
    nw, nh = int(w * scale), int(h * scale)
    return img.resize((nw, nh), Image.LANCZOS)


def process(src: Path, dst: Path) -> None:
    print(f"-> {src.name}", end=" ", flush=True)
    img = Image.open(src)
    img = chroma_remove(img)
    img = crop_bbox(img)
    img = resize_max(img, TARGET)
    img.save(dst, format="PNG", optimize=True)
    src_kb = src.stat().st_size // 1024
    dst_kb = dst.stat().st_size // 1024
    print(f"({src_kb}KB -> {dst_kb}KB, {img.size[0]}x{img.size[1]})")


def main() -> None:
    for fname, slug in FILE_TO_SLUG.items():
        src = SRC_DIR / fname
        if not src.exists():
            print(f"!! falta {src}")
            continue
        dst = OUT_DIR / f"{slug}.png"
        process(src, dst)
    print(f"\nok -> {OUT_DIR}")


if __name__ == "__main__":
    main()
