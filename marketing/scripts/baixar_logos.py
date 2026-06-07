"""Baixa logos oficiais de cada familia de IA em SVG, fallback bonito se nao achar.

Salva em v4/public/logos/{familia}.svg
"""

from __future__ import annotations

import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
OUT = ROOT / "v4" / "public" / "logos"
OUT.mkdir(parents=True, exist_ok=True)

# (familia, simpleicons_slug ou None, cor_marca, nome_para_fallback)
# Simple Icons URL: https://cdn.simpleicons.org/{slug}/{hex_color_no_hash}
FAMILIAS = [
    # principais (Serie A)
    ("openai", "openai", "000000", "OpenAI"),
    ("anthropic", "claude", "D97757", "Anthropic"),
    ("google", "googlegemini", "4285F4", "Gemini"),
    ("xai", "x", "000000", "xAI"),  # X (twitter) por enquanto pro Grok
    ("deepseek", "deepseek", "4D6BFE", "DeepSeek"),
    ("microsoft", "microsoft", "5E5E5E", "Copilot"),  # logo Microsoft
    ("perplexity", "perplexity", "20808D", "Perplexity"),
    ("meta", "meta", "0866FF", "Meta"),
    ("mistral", "mistralai", "FF7000", "Mistral"),
    ("alibaba", "alibabadotcom", "FF6A00", "Alibaba"),
    # outras famílias
    ("cohere", None, "39594D", "Cohere"),
    ("ai21", None, "9B6FFF", "AI21"),
    ("inflection", None, "FF6B35", "Inflection"),
    ("reka", None, "F18F01", "Reka"),
    ("moonshot", None, "5B8DEF", "Moonshot"),
    ("01ai", None, "00A98F", "01.AI"),
    ("minimax", None, "0066FF", "MiniMax"),
    ("baichuan", None, "1A1A1A", "Baichuan"),
    ("databricks", "databricks", "FF3621", "Databricks"),
    ("bytedance", "bytedance", "000000", "ByteDance"),
    ("baidu", "baidu", "2932E1", "Baidu"),
    ("tii", None, "00A0DD", "TII"),
    ("zhipu", None, "1E40AF", "Zhipu AI"),
    ("tencent", "tencent", "00A4FF", "Tencent"),
    ("ibm", "ibm", "0530AD", "IBM"),
    ("liquid", None, "00C9FF", "Liquid AI"),
    ("nvidia", "nvidia", "76B900", "NVIDIA"),
    ("nous", None, "8B5CF6", "Nous Research"),
    ("sensetime", None, "FF0066", "SenseTime"),
    ("snowflake", "snowflake", "29B5E8", "Snowflake"),
    ("iflytek", None, "1989FA", "iFlytek"),
    ("stability", None, "FF6B6B", "Stability AI"),
    ("stepfun", None, "0066CC", "StepFun"),
    ("allenai", None, "F4623C", "Allen AI"),
    ("cristal", None, "A855F7", "Bola de Cristal"),
]

UA = "Mozilla/5.0 (compatible; bolao-logo-bot/1.0)"
# CDN principal: jsDelivr (mais robusto que cdn.simpleicons.org)
SI_BASE = "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons"


def fallback_svg(inicial: str, cor: str, bg: str = "FFFFFF") -> str:
    """SVG bonito com inicial estilizada + fundo gradiente."""
    cor = "#" + cor
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="{cor}" stop-opacity="0.92"/>
      <stop offset="100%" stop-color="{cor}" stop-opacity="0.65"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="18" fill="url(#g)"/>
  <text x="50" y="68" font-family="-apple-system,Segoe UI,system-ui,sans-serif"
        font-size="56" font-weight="900" fill="#fff"
        text-anchor="middle" letter-spacing="-0.05em">{inicial}</text>
</svg>"""


def tentar_baixar(slug: str, cor_marca: str | None = None) -> bytes | None:
    """Tenta jsDelivr (SVG bruto) e injeta a cor da marca via fill."""
    url = f"{SI_BASE}/{slug}.svg"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=15) as r:
            data = r.read()
            if not data or len(data) < 50 or b"<svg" not in data or b"Couldn't" in data:
                return None
            # injetar cor: SI vem com fill="currentColor" default;
            # adicionar fill="#cor_marca" no <svg> raiz se nao tiver
            text = data.decode("utf-8", errors="ignore")
            if cor_marca and 'fill="' not in text[:200]:
                text = text.replace("<svg ", f'<svg fill="#{cor_marca}" ', 1)
            return text.encode("utf-8")
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError):
        return None


LOBE_BASE = "https://unpkg.com/@lobehub/icons-static-svg/icons"
# overrides (familia → URL específica, prioritária sobre SimpleIcons)
OVERRIDES = {
    # Microsoft Copilot colorido (LobeHub)
    "microsoft": f"{LOBE_BASE}/copilot-color.svg",
    # Grok só símbolo (LobeHub monochrome; ajustamos cor depois)
    "xai": f"{LOBE_BASE}/grok.svg",
    # ChatGPT-Logo Wikimedia (versão verde tradicional)
    "openai": "https://upload.wikimedia.org/wikipedia/commons/e/ef/ChatGPT-Logo.svg",
    # Gemini icon 2025 colorido (Wikimedia)
    "google": "https://upload.wikimedia.org/wikipedia/commons/1/1d/Google_Gemini_icon_2025.svg",
}


def baixar_override(fam: str, cor: str | None) -> bytes | None:
    url = OVERRIDES.get(fam)
    if not url:
        return None
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=15) as r:
            data = r.read()
            if not data or len(data) < 50 or b"<svg" not in data:
                return None
            text = data.decode("utf-8", errors="ignore")
            # Lobe usa fill="currentColor" - substitui pela cor da marca
            if "currentColor" in text and cor:
                text = text.replace('fill="currentColor"', f'fill="#{cor}"')
            return text.encode("utf-8")
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError):
        return None


def main() -> None:
    sucesso = 0
    fallback = 0
    for fam, si_slug, cor, nome in FAMILIAS:
        # 1. tenta override (Wikimedia/LobeHub - logos mais coloridas/precisas)
        baixado = baixar_override(fam, cor)
        if baixado:
            (OUT / f"{fam}.svg").write_bytes(baixado)
            print(f"  ★ {fam}: override")
            sucesso += 1
            continue
        out = OUT / f"{fam}.svg"
        baixado = None
        if si_slug:
            baixado = tentar_baixar(si_slug, cor)
            if baixado:
                # SI retorna SVG com cor de marca padrao. Garantir fundo branco quando exibido.
                out.write_bytes(baixado)
                print(f"  + {fam}: oficial ({si_slug})")
                sucesso += 1
                continue
        # fallback: inicial estilizada
        inicial = nome[0].upper()
        if fam == "cristal":
            inicial = "?"  # bola de cristal
        out.write_text(fallback_svg(inicial, cor), encoding="utf-8")
        print(f"  ~ {fam}: fallback ({nome[0]} em #{cor})")
        fallback += 1
    print(f"\n{sucesso} oficiais + {fallback} fallbacks em {OUT}")


if __name__ == "__main__":
    main()
