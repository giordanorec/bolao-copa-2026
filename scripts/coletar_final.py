#!/usr/bin/env python3
"""Coleta os 2 jogos finais via API: J103 (3º lugar) e J104 (Final).

Isolamento: NAO toca web/, v4/public/, ranking, cristal, nem palpites de
outras fases. So le data/resultados/jogos.md e grava data/palpites_final/.

Uso:
    python scripts/coletar_final.py --dry-run
    python scripts/coletar_final.py --ia chatgpt-5   # 1 IA (teste)
    python scripts/coletar_final.py                  # todas as IAs do mapping
    python scripts/coletar_final.py --tier 1 --max-paralelo 5
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

# 2 jogos finais: 103 = 3º lugar, 104 = Final
MM_JOGOS = [103, 104]

MAPPING_PATH = ROOT / "config" / "openrouter_mapping.json"
PROMPT_PATH = ROOT / "config" / "prompts" / "ia-palpiteira-final-v1.md"
DOSSIE_PATH = ROOT / "data" / "dossie" / "final-2026-07-15.md"
RESULTADOS_PATH = ROOT / "data" / "resultados" / "jogos.md"
PALPITES_DIR = ROOT / "data" / "palpites_final"


def _tabela_resultados_md(path: Path) -> str:
    if not path.exists():
        return "(sem resultados disponiveis)"
    linhas = [
        ln for ln in path.read_text(encoding="utf-8").splitlines() if ln.strip().startswith("|")
    ]
    return "\n".join(linhas) if linhas else "(sem resultados disponiveis)"


def _salvar_palpite(slug: str, modelo: str, conteudo: str, corte: str) -> Path:
    PALPITES_DIR.mkdir(parents=True, exist_ok=True)
    arq = PALPITES_DIR / f"{slug}.md"
    coletado_em = datetime.now(BRT).isoformat(timespec="seconds")
    headers = [
        f"<!-- ia: {slug} -->",
        f"<!-- slug: {slug} -->",
        "<!-- versao: final -->",
        "<!-- fase: Final -->",
        f"<!-- corte: {corte} -->",
        "<!-- modo: api -->",
        f"<!-- modelo: {modelo} -->",
        f"<!-- coletado_em: {coletado_em} -->",
        "<!-- status: palpitou via api -->",
        "",
        f"# Palpite Final — {slug} (via OpenRouter)",
        "",
    ]
    arq.write_text("\n".join(headers) + conteudo.rstrip() + "\n", encoding="utf-8")
    return arq


def main() -> int:
    ap = argparse.ArgumentParser(description="Coleta final (jogos 103-104).")
    ap.add_argument("--dry-run", action="store_true", help="lista IAs e sai, sem chamar API")
    ap.add_argument("--ia", help="coleta so esta IA (slug do mapping)")
    ap.add_argument("--tier", help="filtra por tier")
    ap.add_argument("--max-paralelo", type=int, default=5)
    ap.add_argument("--max-tokens", type=int, default=None, help="limita max_tokens (evita 402)")
    args = ap.parse_args()

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

    print(f"coletar-final: {len(ias)} IA(s) · jogos={MM_JOGOS[0]}-{MM_JOGOS[-1]}")
    for it in ias:
        print(f"  - {it['slug']:32s} -> {it['model']}  (tier {it['tier']})")

    if args.dry_run:
        print("(dry-run; nenhuma chamada feita)")
        return 0

    if not PROMPT_PATH.is_file():
        print(f"erro: prompt ausente: {PROMPT_PATH}", file=sys.stderr)
        return 1

    if not DOSSIE_PATH.is_file():
        print(
            f"erro: dossiê ausente: {DOSSIE_PATH}\n"
            "Crie o arquivo antes de rodar a coleta (sem dossiê as IAs API não têm contexto).",
            file=sys.stderr,
        )
        return 1

    dossie_conteudo = DOSSIE_PATH.read_text(encoding="utf-8")

    prompt_base = PROMPT_PATH.read_text(encoding="utf-8")
    # Remove o cabeçalho de instrução para o operador (tudo até a linha "---")
    idx = prompt_base.find("\n---\n")
    if idx > 0:
        prompt_base = prompt_base[idx + 5 :]
    prompt_base = prompt_base.replace("{{DOSSIE}}", dossie_conteudo)
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
                        payload = {
                            "model": modelo,
                            "messages": [{"role": "user", "content": prompt_base}],
                        }
                        if args.max_tokens:
                            payload["max_tokens"] = args.max_tokens
                        data = await _post_with_retry(client, payload)
                        conteudo = str(data["choices"][0]["message"]["content"])
                        arq = _salvar_palpite(slug, modelo, conteudo, corte)
                        resultados.append({"slug": slug, "ok": True})
                        print(f"  OK   {slug}  -> {arq.name}", flush=True)
                    except Exception as e:
                        resultados.append({"slug": slug, "ok": False, "erro": str(e)})
                        print(f"  FAIL {slug}: {e}", file=sys.stderr, flush=True)

            await asyncio.gather(*(_proc(it) for it in ias))
        return resultados

    resultados = asyncio.run(_run())
    ok = sum(1 for r in resultados if r["ok"])
    print(f"coletar-final: {ok}/{len(resultados)} sucesso")
    return 0 if ok == len(resultados) else 1


if __name__ == "__main__":
    raise SystemExit(main())
