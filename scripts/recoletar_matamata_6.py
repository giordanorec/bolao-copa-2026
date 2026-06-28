#!/usr/bin/env python3
"""Re-coleta APENAS os 6 confrontos do R32 que mudaram de adversário depois da
3ª rodada dos grupos J/K/L (jogos 79, 80, 82, 83, 85, 87).

Por que: a coleta original (27/06 15h) saiu ANTES dos jogos 67-72; as IAs
palpitaram contra os adversários PROJETADOS. Estes 6 confrontos agora estão
definidos com adversários diferentes. Re-coletamos só eles e fazemos MERGE nas
6 linhas dos arquivos canônicos data/palpites_matamata/<slug>.md, preservando os
outros 10 jogos (que as pessoas já estão vendo).

Só modelos API (config/openrouter_mapping.json). Os '-web' são ignorados no site.

Uso:
    python scripts/recoletar_matamata_6.py --dry-run
    python scripts/recoletar_matamata_6.py --ia chatgpt-5     # teste 1 IA
    python scripts/recoletar_matamata_6.py                    # todas
"""

from __future__ import annotations

import argparse
import asyncio
import json
import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
BRT = timezone(timedelta(hours=-3))

JOGOS_ALVO = [79, 80, 82, 83, 85, 87]

# linha canônica corrigida por jogo (metadados + adversário REAL); {a}/{b} = gols
LINHA = {
    79: "| 79 | R32 | Ter 30/06 | 22h00 | Cidade do México | México | {a} | {b} | Equador |",
    80: "| 80 | R32 | Qua 01/07 | 13h00 | Atlanta | Inglaterra | {a} | {b} | Congo (RD) |",
    82: "| 82 | R32 | Qua 01/07 | 17h00 | Seattle | Bélgica | {a} | {b} | Senegal |",
    83: "| 83 | R32 | Qui 02/07 | 20h00 | Toronto | Portugal | {a} | {b} | Croácia |",
    85: "| 85 | R32 | Sex 03/07 | 00h00 | Vancouver | Suíça | {a} | {b} | Argélia |",
    87: "| 87 | R32 | Sex 03/07 | 22h30 | Kansas City | Colômbia | {a} | {b} | Gana |",
}

MAPPING_PATH = ROOT / "config" / "openrouter_mapping.json"
PROMPT_PATH = ROOT / "config" / "prompts" / "ia-palpiteira-mata-mata-redux.md"
DOSSIE_PATH = ROOT / "data" / "dossie" / "r32-redux-2026-06-28.md"
RESULTADOS_PATH = ROOT / "data" / "resultados" / "jogos.md"
PALPITES_DIR = ROOT / "data" / "palpites_matamata"
RAW_DIR = PALPITES_DIR / "_redux_raw"


def _tabela_resultados_md(path: Path) -> str:
    linhas = [
        ln for ln in path.read_text(encoding="utf-8").splitlines() if ln.strip().startswith("|")
    ]
    return "\n".join(linhas) if linhas else "(sem resultados)"


def _parse_gols(valor: str) -> int | None:
    m = re.search(r"-?\d+", valor)
    if not m:
        return None
    n = int(m.group())
    return n if n >= 0 else None


def parse_resposta(texto: str) -> dict[int, tuple[int, int]]:
    """Extrai {jogo: (gols_a, gols_b)} das linhas de tabela da resposta."""
    out: dict[int, tuple[int, int]] = {}
    for line in texto.splitlines():
        s = line.strip()
        if not s.startswith("|"):
            continue
        cells = [c.strip() for c in s.strip("|").split("|")]
        if not cells or not cells[0].lstrip("-").isdigit():
            continue
        num = int(cells[0])
        if num not in JOGOS_ALVO:
            continue
        # acha as 2 últimas células numéricas isoladas: gols_a, gols_b
        # formato esperado: num|fase|data|hora|local|timeA|golsA|golsB|timeB
        if len(cells) >= 9:
            ga, gb = _parse_gols(cells[6]), _parse_gols(cells[7])
        elif len(cells) >= 4:
            ga, gb = _parse_gols(cells[-3]), _parse_gols(cells[-2])
        else:
            ga, gb = None, None
        if ga is None or gb is None:
            continue
        out[num] = (ga, gb)
    return out


def merge_canonico(slug: str, palpites: dict[int, tuple[int, int]]) -> bool:
    """Substitui as 6 linhas no arquivo canônico. Retorna True se mergeou."""
    arq = PALPITES_DIR / f"{slug}.md"
    if not arq.exists():
        print(f"  SKIP {slug}: sem arquivo canônico", file=sys.stderr)
        return False
    if set(palpites) != set(JOGOS_ALVO):
        faltam = sorted(set(JOGOS_ALVO) - set(palpites))
        print(f"  FAIL {slug}: faltam jogos {faltam}", file=sys.stderr)
        return False
    texto = arq.read_text(encoding="utf-8")
    linhas = texto.splitlines()
    novas = []
    trocadas = 0
    for ln in linhas:
        s = ln.strip()
        if s.startswith("|") and s.strip("|").split("|")[0].strip().isdigit():
            num = int(s.strip("|").split("|")[0].strip())
            if num in JOGOS_ALVO:
                ga, gb = palpites[num]
                novas.append(LINHA[num].format(a=ga, b=gb))
                trocadas += 1
                continue
        novas.append(ln)
    if trocadas != len(JOGOS_ALVO):
        print(f"  FAIL {slug}: trocou {trocadas}/6 linhas (tabela inesperada)", file=sys.stderr)
        return False
    # atualiza coletado_em
    agora = datetime.now(BRT).isoformat(timespec="seconds")
    out = []
    for ln in novas:
        if ln.strip().startswith("<!-- coletado_em:"):
            out.append(f"<!-- coletado_em: {agora} -->")
        else:
            out.append(ln)
    arq.write_text("\n".join(out) + "\n", encoding="utf-8")
    return True


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--ia")
    ap.add_argument("--max-paralelo", type=int, default=5)
    ap.add_argument("--max-tokens", type=int, default=None)
    args = ap.parse_args()

    from dotenv import load_dotenv

    load_dotenv(ROOT / "config" / ".env")

    raw = json.loads(MAPPING_PATH.read_text(encoding="utf-8"))
    mapping = {k: v for k, v in raw.items() if not k.startswith("_")}
    ias = [
        {"slug": s, "model": c["model"]} for s, c in mapping.items() if not args.ia or s == args.ia
    ]
    if not ias:
        print("nenhuma IA selecionada", file=sys.stderr)
        return 1

    print(f"recoletar-6: {len(ias)} IA(s) · jogos={JOGOS_ALVO}")
    if args.dry_run:
        for it in ias:
            print(f"  - {it['slug']:32s} -> {it['model']}")
        print("(dry-run)")
        return 0

    prompt = PROMPT_PATH.read_text(encoding="utf-8")
    prompt = prompt.replace("{{DOSSIE}}", DOSSIE_PATH.read_text(encoding="utf-8"))
    prompt = prompt.replace("{{RESULTADOS}}", _tabela_resultados_md(RESULTADOS_PATH))
    RAW_DIR.mkdir(parents=True, exist_ok=True)

    async def _run():
        import httpx
        from bolao.coletor import _post_with_retry

        sem = asyncio.Semaphore(args.max_paralelo)
        res = []
        async with httpx.AsyncClient() as client:

            async def _proc(item):
                slug, modelo = item["slug"], item["model"]
                async with sem:
                    try:
                        payload = {
                            "model": modelo,
                            "messages": [{"role": "user", "content": prompt}],
                        }
                        if args.max_tokens:
                            payload["max_tokens"] = args.max_tokens
                        data = await _post_with_retry(client, payload)
                        conteudo = str(data["choices"][0]["message"]["content"])
                        (RAW_DIR / f"{slug}.txt").write_text(conteudo, encoding="utf-8")
                        palp = parse_resposta(conteudo)
                        ok = merge_canonico(slug, palp)
                        res.append({"slug": slug, "ok": ok})
                        print(
                            f"  {'OK  ' if ok else 'FAIL'} {slug}  {palp if not ok else ''}",
                            flush=True,
                        )
                    except Exception as e:
                        res.append({"slug": slug, "ok": False, "erro": str(e)})
                        print(f"  FAIL {slug}: {e}", file=sys.stderr, flush=True)

            await asyncio.gather(*(_proc(it) for it in ias))
        return res

    res = asyncio.run(_run())
    ok = sum(1 for r in res if r["ok"])
    print(f"\nrecoletar-6: {ok}/{len(res)} mergeados")
    falhas = [r["slug"] for r in res if not r["ok"]]
    if falhas:
        print("FALHARAM (continuam com palpite antigo):", ", ".join(falhas))
    return 0 if ok == len(res) else 1


if __name__ == "__main__":
    raise SystemExit(main())
