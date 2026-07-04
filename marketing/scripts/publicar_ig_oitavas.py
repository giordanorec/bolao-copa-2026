# ruff: noqa: RUF001, RUF002
"""
Publica os 8 reels + 8 cards das Oitavas (J89-J96) na página /admin/instagram-posts.

Fluxo:
  1. Para cada jogo (89-96):
     - cria pasta 39-46_reel_oitavas-<time_a>-x-<time_b>/ e move mp4 + poster
     - cria pasta 47-54_card_oitavas-<time_a>-x-<time_b>/ e move card.png
     - gera LEGENDA.md (multilíngue com hashtags)
     - gera ROTEIRO.md pros reels
  2. Roda build_ig_manifest.mjs + upload_ig_to_supabase.mjs

Uso: python marketing/scripts/publicar_ig_oitavas.py
"""

from __future__ import annotations

import json
import re
import shutil
import subprocess
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
BRAINSTORM = ROOT / "marketing" / "brainstorming_instagram"
CARDS_DIR = ROOT / "marketing" / "cards"
REELS_DIR = ROOT / "marketing" / "reels_partida"

# Base numérica: próximo ID livre
NEXT_REEL_START = 39  # 39-46
NEXT_CARD_START = 47  # 47-54

JOGOS_ALVO = list(range(89, 97))


def slugify(s: str) -> str:
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode("ascii")
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return s


def carregar_dados_jogo(numero: int) -> dict:
    jogos = json.loads((ROOT / "v4" / "public" / "jogos.json").read_text("utf-8"))
    palp = json.loads((ROOT / "v4" / "public" / "palpites_por_jogo.json").read_text("utf-8"))
    jogo = next((j for j in jogos if j["numero"] == numero), None)
    if not jogo:
        raise SystemExit(f"jogo {numero} não achado")
    dados = palp.get(str(numero), {})
    return {"jogo": jogo, "dados": dados}


def legenda_reel(jogo: dict, dados: dict) -> str:
    bola = dados.get("bola_de_cristal") or {}
    total = len(dados.get("palpites", {}))
    votos = bola.get("votos", 0)
    pct = round(votos / total * 100) if total else 0
    placar = f"{bola.get('gols_a')}×{bola.get('gols_b')}" if bola else "—"
    ta, tb = jogo["time_a"], jogo["time_b"]
    return f"""🔮 **{ta} × {tb}** — as IAs cravaram: **{placar}**

Nas Oitavas da Copa 2026, {votos} das {total} IAs que palpitaram este jogo apontaram **{placar}** como placar mais provável ({pct}% do consenso).

Todos os 58 palpites (ChatGPT, Claude, Gemini, Grok, DeepSeek, Perplexity, Le Chat, Meta, Copilot, Qwen e mais 48) estão públicos no site.

Vai bater as IAs? 👉 bolao.arenadasias.com.br

#BolaoDasIAs #Copa2026 #FifaWorldCup2026 #Oitavas #{slugify(ta).replace('-','')} #{slugify(tb).replace('-','')} #ChatGPT #Claude #Gemini #Grok #IA #InteligenciaArtificial #ArenaDasIAs
"""


def legenda_card(jogo: dict, dados: dict) -> str:
    bola = dados.get("bola_de_cristal") or {}
    total = len(dados.get("palpites", {}))
    votos = bola.get("votos", 0)
    pct = round(votos / total * 100) if total else 0
    placar = f"{bola.get('gols_a')}×{bola.get('gols_b')}" if bola else "—"
    ta, tb = jogo["time_a"], jogo["time_b"]
    return f"""**{ta} × {tb}** — palpite consenso das IAs: **{placar}** 🔮

Nas Oitavas da Copa 2026, {pct}% das {total} IAs que palpitaram este jogo apontaram **{placar}**.

Card mostra o consenso e como ChatGPT, Claude, Gemini e Grok se posicionaram individualmente. Todos os 58 palpites completos em bolao.arenadasias.com.br

#BolaoDasIAs #Copa2026 #FifaWorldCup2026 #Oitavas #{slugify(ta).replace('-','')} #{slugify(tb).replace('-','')} #ChatGPT #Claude #Gemini #Grok #IA #ArenaDasIAs
"""


def roteiro_reel(jogo: dict, dados: dict) -> str:
    bola = dados.get("bola_de_cristal") or {}
    total = len(dados.get("palpites", {}))
    votos = bola.get("votos", 0)
    pct = round(votos / total * 100) if total else 0
    placar = f"{bola.get('gols_a')}×{bola.get('gols_b')}" if bola else "—"
    ta, tb = jogo["time_a"], jogo["time_b"]
    return f"""# Reel — Oitavas J{jogo['numero']}: {ta} × {tb}

**Duração:** 8s · 1080×1920

| t | cena |
|---|---|
| 0.0-2.0s | Capa: badge OITAVAS + bandeiras + confronto {ta} VS {tb} |
| 2.0-4.5s | Placar consenso enorme: **{placar}** com "{pct}% das {total} IAs cravaram" e badge de força do consenso |
| 4.5-7.0s | 4 IAs famosas (ChatGPT, Claude, Gemini, Grok) e seus palpites individuais |
| 7.0-8.0s | CTA: "Palpita antes das IAs" + link do site |

**Áudio:** batida épica/orquestral crescente com hit no reveal do placar (~2.5s).

**Poster:** frame do placar consenso (3.5s).

Gerado por `marketing/scripts/gerar_reel_partida.js`.
"""


def escrever_arquivo(path: Path, conteudo: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(conteudo, encoding="utf-8")


def main():
    if not (CARDS_DIR / "partida-089.png").exists():
        raise SystemExit(
            "cards não gerados — rode primeiro node ../marketing/scripts/gerar_cards.js"
        )
    if not (REELS_DIR / "partida-089" / "partida-089.mp4").exists():
        raise SystemExit(
            "reels não gerados — rode primeiro node ../marketing/scripts/gerar_reel_partida.js"
        )

    for i, numero in enumerate(JOGOS_ALVO):
        d = carregar_dados_jogo(numero)
        jogo = d["jogo"]
        dados = d["dados"]
        slug_confronto = f"{slugify(jogo['time_a'])}-x-{slugify(jogo['time_b'])}"

        # --- REEL ---
        reel_id = f"{NEXT_REEL_START + i:02d}_reel_oitavas-{slug_confronto}"
        reel_dir = BRAINSTORM / reel_id
        reel_dir.mkdir(exist_ok=True)
        origem_reel = REELS_DIR / f"partida-{numero:03d}"
        # Copia mp4 renomeado
        shutil.copy(
            origem_reel / f"partida-{numero:03d}.mp4", reel_dir / f"oitavas-{slug_confronto}.mp4"
        )
        shutil.copy(origem_reel / "poster.png", reel_dir / "poster.png")
        escrever_arquivo(reel_dir / "LEGENDA.md", legenda_reel(jogo, dados))
        escrever_arquivo(reel_dir / "ROTEIRO.md", roteiro_reel(jogo, dados))
        print(f"  reel {reel_id} · {jogo['time_a']} × {jogo['time_b']}")

        # --- CARD ---
        card_id = f"{NEXT_CARD_START + i:02d}_card_oitavas-{slug_confronto}"
        card_dir = BRAINSTORM / card_id
        card_dir.mkdir(exist_ok=True)
        shutil.copy(CARDS_DIR / f"partida-{numero:03d}.png", card_dir / "card.png")
        escrever_arquivo(card_dir / "LEGENDA.md", legenda_card(jogo, dados))
        print(f"  card {card_id}")

    print("\n== Rebuild manifest ==")
    subprocess.run(["node", "marketing/scripts/build_ig_manifest.mjs"], cwd=str(ROOT), check=True)
    print("\n== Upload PNGs pro Supabase ==")
    subprocess.run(
        ["node", "marketing/scripts/upload_ig_to_supabase.mjs"], cwd=str(ROOT), check=True
    )


if __name__ == "__main__":
    main()
