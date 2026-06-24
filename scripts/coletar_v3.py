#!/usr/bin/env python3
"""Coleta v3: re-pergunta os 8 jogos da 3a rodada dos Grupos I, J, K, L.

Os Grupos I/J/K/L, no instante da coleta v2, so tinham jogado a 1a rodada.
Agora a 2a rodada (jogos 41-48) ja foi disputada, com classificacao e
cenarios definidos. Esta leva (v3) re-pergunta a cada IA os 8 jogos da 3a
rodada desses grupos, lembrando-a do que ela mesma cravou no v2.

Isolamento (igual v2): NAO toca web/data/, v4/public/, ranking, cristal,
nem data/palpites_ias/ (v1). So le data/palpites_v2/ e grava data/palpites_v3/.

Uso:
    python scripts/coletar_v3.py --dry-run        # so lista, nao chama API
    python scripts/coletar_v3.py --ia chatgpt-5   # 1 IA (teste)
    python scripts/coletar_v3.py                  # todas as IAs do mapping
    python scripts/coletar_v3.py --max-paralelo 5
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

BRT = timezone(timedelta(hours=-3))

# 8 jogos da 3a rodada dos Grupos I, J, K, L (na ordem do prompt)
V3_JOGOS = [61, 62, 67, 68, 69, 70, 71, 72]

MAPPING_PATH = ROOT / "config" / "openrouter_mapping.json"
PROMPT_PATH = ROOT / "config" / "prompts" / "ia-palpiteira-v3.md"
DOSSIE_PATH = ROOT / "data" / "dossie" / "v3-2026-06-24.md"
RESULTADOS_PATH = ROOT / "data" / "resultados" / "jogos.md"
JOGOS_PATH = ROOT / "data" / "jogos.md"
PALPITES_V2_DIR = ROOT / "data" / "palpites_v2"
PALPITES_V3_DIR = ROOT / "data" / "palpites_v3"


def _tabela_resultados_md(path: Path) -> str:
    if not path.exists():
        return "(sem resultados disponiveis)"
    linhas = [
        ln for ln in path.read_text(encoding="utf-8").splitlines() if ln.strip().startswith("|")
    ]
    return "\n".join(linhas) if linhas else "(sem resultados disponiveis)"


def _tabela_palpites_v2(palpites_slug, jogos_por_numero) -> str:
    por_numero = {p.jogo_numero: p for p in palpites_slug}
    linhas = [
        "| Jogo | Time A | Gols A (seu v2) | Gols B (seu v2) | Time B |",
        "|---|---|---|---|---|",
    ]
    tem_algum = False
    for n in V3_JOGOS:
        jogo = jogos_por_numero.get(n)
        p = por_numero.get(n)
        if jogo is None or p is None:
            continue
        tem_algum = True
        linhas.append(f"| {n} | {jogo.time_a} | {p.gols_a} | {p.gols_b} | {jogo.time_b} |")
    if not tem_algum:
        return "(voce nao registrou palpites v2 para estes 8 jogos)"
    return "\n".join(linhas)


def _salvar_palpite_v3(slug: str, modelo: str, conteudo: str, corte: str) -> Path:
    PALPITES_V3_DIR.mkdir(parents=True, exist_ok=True)
    arq = PALPITES_V3_DIR / f"{slug}.md"
    coletado_em = datetime.now(BRT).isoformat(timespec="seconds")
    headers = [
        f"<!-- ia: {slug} -->",
        f"<!-- slug: {slug} -->",
        "<!-- versao: v3 -->",
        f"<!-- corte: {corte} -->",
        "<!-- modo: api -->",
        f"<!-- modelo: {modelo} -->",
        f"<!-- coletado_em: {coletado_em} -->",
        "<!-- status: palpitou via api -->",
        "",
        f"# Palpite v3 — {slug} (via OpenRouter)",
        "",
    ]
    arq.write_text("\n".join(headers) + conteudo.rstrip() + "\n", encoding="utf-8")
    return arq


def main() -> int:
    ap = argparse.ArgumentParser(description="Coleta v3 (8 jogos da 3a rodada dos Grupos I/J/K/L).")
    ap.add_argument("--dry-run", action="store_true", help="lista IAs e sai, sem chamar API")
    ap.add_argument("--ia", help="coleta so esta IA (slug do mapping)")
    ap.add_argument("--tier", help="filtra por tier")
    ap.add_argument("--max-paralelo", type=int, default=5)
    args = ap.parse_args()

    # .env (OPENROUTER_API_KEY)
    from dotenv import load_dotenv

    load_dotenv(ROOT / "config" / ".env")

    if not MAPPING_PATH.is_file():
        print(f"erro: mapping nao encontrado: {MAPPING_PATH}", file=sys.stderr)
        return 1
    raw = json.loads(MAPPING_PATH.read_text(encoding="utf-8"))
    mapping = {k: v for k, v in raw.items() if not k.startswith("_")}

    ias = []
    for slug, cfg in mapping.items():
        if args.ia and slug != args.ia:
            continue
        if args.tier and str(cfg.get("tier")) != args.tier:
            continue
        ias.append({"slug": slug, "model": cfg["model"], "tier": cfg.get("tier", "?")})

    if not ias:
        print("erro: nenhuma IA selecionada pelos filtros", file=sys.stderr)
        return 1

    from bolao.parser import carregar_jogos, carregar_palpites, take_errors

    jogos = carregar_jogos(JOGOS_PATH)
    take_errors()
    jogos_por_numero = {j.numero: j for j in jogos}

    palpites_v2 = carregar_palpites(PALPITES_V2_DIR)
    take_errors()

    print(f"coletar-v3: {len(ias)} IA(s) · jogos={V3_JOGOS}")
    for it in ias:
        tem_v2 = bool(palpites_v2.get(it["slug"]) or palpites_v2.get(it["slug"].lower()))
        print(
            f"  - {it['slug']:32s} -> {it['model']}  (tier {it['tier']}) {'[v2 ok]' if tem_v2 else '[sem v2]'}"
        )

    if args.dry_run:
        print("(dry-run; nenhuma chamada feita)")
        return 0

    for p in (PROMPT_PATH, DOSSIE_PATH):
        if not p.is_file():
            print(f"erro: arquivo necessario ausente: {p}", file=sys.stderr)
            return 1

    prompt_base = PROMPT_PATH.read_text(encoding="utf-8")
    prompt_base = prompt_base.replace("{{DOSSIE_V3}}", DOSSIE_PATH.read_text(encoding="utf-8"))
    prompt_base = prompt_base.replace("{{RESULTADOS}}", _tabela_resultados_md(RESULTADOS_PATH))

    corte = datetime.now(BRT).strftime("%Y-%m-%d")

    async def _run():
        import httpx
        from bolao.coletor import _post_with_retry

        sem = asyncio.Semaphore(args.max_paralelo)
        resultados = []
        async with httpx.AsyncClient() as client:

            async def _proc(item):
                slug = item["slug"]
                modelo = item["model"]
                async with sem:
                    try:
                        pv2 = palpites_v2.get(slug) or palpites_v2.get(slug.lower()) or []
                        tabela = _tabela_palpites_v2(pv2, jogos_por_numero)
                        prompt = prompt_base.replace("{{PALPITES_V2}}", tabela)
                        payload = {
                            "model": modelo,
                            "messages": [{"role": "user", "content": prompt}],
                        }
                        data = await _post_with_retry(client, payload)
                        conteudo = str(data["choices"][0]["message"]["content"])
                        arq = _salvar_palpite_v3(slug, modelo, conteudo, corte)
                        resultados.append({"slug": slug, "ok": True})
                        print(f"  OK   {slug}  -> {arq.name}", flush=True)
                    except Exception as e:
                        resultados.append({"slug": slug, "ok": False, "erro": str(e)})
                        print(f"  FAIL {slug}: {e}", file=sys.stderr, flush=True)

            await asyncio.gather(*(_proc(it) for it in ias))
        return resultados

    resultados = asyncio.run(_run())
    ok = sum(1 for r in resultados if r["ok"])
    print(f"coletar-v3: {ok}/{len(resultados)} sucesso")
    return 0 if ok == len(resultados) else 1


if __name__ == "__main__":
    raise SystemExit(main())
