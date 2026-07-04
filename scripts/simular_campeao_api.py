#!/usr/bin/env python3
"""Simulador de campeão via OpenRouter (waterfall, 11 IAs).

Substitui `scripts/simular_campeao_web.js` que dependia de Playwright/CDP
com todos os problemas de driver. Aqui cada IA responde uma fase por vez
via API, prompt estruturado com dossiê, resposta em JSON. Consenso
majoritário define os confrontos da fase seguinte.

Uso:
    python scripts/simular_campeao_api.py --rodada=2026-07-02T15-30
    python scripts/simular_campeao_api.py --rodada=2026-07-02T15-30 --ias=chatgpt,claude
"""

from __future__ import annotations

import argparse
import concurrent.futures as futures
import json
import os
import sys
import time
import urllib.error
import urllib.request
from collections import Counter
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from dotenv import load_dotenv  # noqa: E402

load_dotenv(ROOT / "config" / ".env")
KEY = os.getenv("OPENROUTER_API_KEY", "")
assert KEY, "OPENROUTER_API_KEY faltando em config/.env"

URL = "https://openrouter.ai/api/v1/chat/completions"

# Mapping marca → { slug (JSON path), model (OpenRouter) }
IAS = {
    "chatgpt": {"slug": "chatgpt-5-thinking-web", "nome": "ChatGPT 5", "model": "openai/gpt-5"},
    "claude": {
        "slug": "claude-opus-4-8-web",
        "nome": "Claude Opus 4.8",
        "model": "anthropic/claude-opus-4.8",
    },
    "copilot": {
        "slug": "copilot-microsoft-web",
        "nome": "Microsoft Copilot",
        "model": "openai/gpt-4o",
    },
    "gemini": {
        "slug": "gemini-2-5-pro-web",
        "nome": "Gemini 2.5 Pro",
        "model": "google/gemini-2.5-pro",
    },
    "grok": {
        "slug": "grok-4-heavy-web",
        "nome": "Grok 4 Heavy",
        "model": "x-ai/grok-4.20-multi-agent",
    },
    "mistral": {
        "slug": "le-chat-mistral-web",
        "nome": "Le Chat (Mistral)",
        "model": "mistralai/mistral-medium-3.1",
    },
    "meta": {
        "slug": "meta-llama-4-web",
        "nome": "Meta AI (Llama 4)",
        "model": "meta-llama/llama-4-maverick",
    },
    "deepseek": {"slug": "deepseek-r1-web", "nome": "DeepSeek R1", "model": "deepseek/deepseek-r1"},
    "perplexity": {
        "slug": "perplexity-sonar-pro-web",
        "nome": "Perplexity Sonar Pro",
        "model": "perplexity/sonar-pro",
    },
    "qwen": {"slug": "qwen-3-max-web", "nome": "Qwen 3 Max", "model": "qwen/qwen3-max"},
    "kimi": {"slug": "kimi-k2-web", "nome": "Kimi K2", "model": "moonshotai/kimi-k2"},
}

# R32 100% decidido (jogos 73-88, todos jogados). Sem pendentes.
R32_DECIDIDOS = {
    73: ("Canadá", None),
    74: ("Paraguai", None),
    75: ("Marrocos", None),
    76: ("Brasil", None),
    77: ("França", None),
    78: ("Noruega", None),
    79: ("México", None),
    80: ("Inglaterra", None),
    81: ("Estados Unidos", None),
    82: ("Bélgica", None),
    83: ("Portugal", None),
    84: ("Espanha", None),
    85: ("Suíça", None),
    86: ("Argentina", None),
    87: ("Colômbia", None),
    88: ("Egito", None),
}
R32_PENDENTES: list[dict] = []

FASES = [
    {
        "nome": "Oitavas",
        "jogos": [
            {"j": 89, "wa": 74, "wb": 77},  # Paraguai x França
            {"j": 90, "wa": 73, "wb": 75},  # Canadá x Marrocos
            {"j": 91, "wa": 76, "wb": 78},  # Brasil x Noruega
            {"j": 92, "wa": 79, "wb": 80},  # México x Inglaterra
            {"j": 93, "wa": 83, "wb": 84},  # Portugal x Espanha
            {"j": 94, "wa": 81, "wb": 82},  # EUA x Bélgica
            {"j": 95, "wa": 86, "wb": 88},  # W86 x W88
            {"j": 96, "wa": 85, "wb": 87},  # Suíça x W87
        ],
    },
    {
        "nome": "Quartas",
        "jogos": [
            {"j": 97, "wa": 89, "wb": 90},
            {"j": 98, "wa": 93, "wb": 94},
            {"j": 99, "wa": 91, "wb": 92},
            {"j": 100, "wa": 95, "wb": 96},
        ],
    },
    {
        "nome": "Semifinal",
        "jogos": [
            {"j": 101, "wa": 97, "wb": 98},
            {"j": 102, "wa": 99, "wb": 100},
        ],
    },
    {
        "nome": "Final",
        "jogos": [
            {"j": 104, "wa": 101, "wb": 102},
        ],
    },
]


def buildPrompt(fase: str, confrontos: list[dict], dossie: str) -> str:
    linhas_tab = ["| Jogo | Confronto |", "|------|-----------|"]
    for c in confrontos:
        linhas_tab.append(f"| J{c['j']} | {c['a']} vs {c['b']} |")
    tabela = "\n".join(linhas_tab)
    return f"""Bolão Copa 2026 — Simulação de campeão (fase: {fase}).

Você é uma IA participando de um bolão coletivo contra as principais IAs do mundo (ChatGPT, Claude, Gemini, Grok, Meta Llama, DeepSeek, Qwen, Kimi K2, Mistral, Copilot, Perplexity). Cada fase é decidida por CONSENSO majoritário das nossas respostas.

Use o DOSSIÊ abaixo como base factual. NÃO invente dados. NÃO pesquise.

=== DOSSIÊ ===
{dossie}
=== FIM DO DOSSIÊ ===

Fase atual: **{fase}**. Confrontos:

{tabela}

Responda EXCLUSIVAMENTE em JSON no formato:

{{"vencedores": {{"J<numero>": "NomeDoTime", ...}}}}

Sem texto extra. Sem markdown. Sem código. Só o objeto JSON."""


def perguntar(model: str, prompt: str) -> tuple[bool, str]:
    body = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 4000,
        "temperature": 0.7,
    }
    req = urllib.request.Request(
        URL,
        method="POST",
        headers={
            "Authorization": f"Bearer {KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://bolao.arenadasias.com.br",
        },
        data=json.dumps(body).encode("utf-8"),
    )
    for tent in range(3):
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                data = json.loads(r.read())
                msg = data["choices"][0]["message"]
                txt = (msg.get("content") or msg.get("reasoning") or "").strip()
                return True, txt
        except urllib.error.HTTPError as e:
            try:
                err = json.loads(e.read()).get("error", {}).get("message", str(e))
            except Exception:
                err = str(e)
            if tent < 2:
                time.sleep(3 + tent * 2)
                continue
            return False, err[:200]
        except Exception as e:
            if tent < 2:
                time.sleep(3 + tent * 2)
                continue
            return False, str(e)[:200]
    return False, "esgotou tentativas"


def parseVencedores(texto: str, jogos_esperados: list[int]) -> dict[int, str]:
    """Extrai {jogo: time} de resposta JSON (com fallback pra linha "J89: X")."""
    result = {}
    esperados = set(jogos_esperados)
    # 1) Tenta JSON no meio do texto
    for start in range(len(texto)):
        if texto[start] not in "{":
            continue
        depth = 0
        for end in range(start, len(texto)):
            if texto[end] == "{":
                depth += 1
            elif texto[end] == "}":
                depth -= 1
                if depth == 0:
                    try:
                        obj = json.loads(texto[start : end + 1])
                        venc = obj.get("vencedores") or obj
                        if isinstance(venc, dict):
                            for k, v in venc.items():
                                # k pode ser "J89" ou "89"
                                num = int(str(k).lstrip("Jj").strip())
                                if num in esperados and isinstance(v, str) and v.strip():
                                    result[num] = v.strip()
                            if result:
                                return result
                    except Exception:
                        pass
                    break
        if result:
            break
    # 2) Fallback: procura "J89: X" ou "89: X" linha por linha
    import re

    re_line = re.compile(r"[Jj]?(\d{1,3})\s*[:.\-—→]\s*([^\n,;|]+)")
    for m in re_line.finditer(texto):
        num = int(m.group(1))
        if num in esperados and num not in result:
            time = m.group(2).strip().strip("*_`\"'")
            if time and "vs" not in time.lower():
                result[num] = time
    return result


def coletar_fase(
    fase: str, confrontos: list[dict], dossie: str, alvo: list[str], max_paralelo: int = 6
) -> dict[str, dict[int, str]]:
    prompt = buildPrompt(fase, confrontos, dossie)
    jogos_esperados = [c["j"] for c in confrontos]
    print(f"\n=== {fase} ({len(confrontos)} jogos) — {len(alvo)} IAs em paralelo ===")
    respostas: dict[str, dict[int, str]] = {}

    def _uma(key: str) -> tuple[str, dict[int, str], str]:
        cfg = IAS[key]
        ok, txt = perguntar(cfg["model"], prompt)
        if not ok:
            return key, {j: "???" for j in jogos_esperados}, f"FAIL {txt}"
        parsed = parseVencedores(txt, jogos_esperados)
        preview = ", ".join(f"J{j}={parsed.get(j, '???')}" for j in jogos_esperados[:3])
        return (
            key,
            {j: parsed.get(j, "???") for j in jogos_esperados},
            f"OK  {preview}{'...' if len(jogos_esperados) > 3 else ''}",
        )

    with futures.ThreadPoolExecutor(max_workers=max_paralelo) as ex:
        for key, r, log in ex.map(_uma, alvo):
            respostas[IAS[key]["slug"]] = r
            print(f"  [{fase}] {IAS[key]['nome']:25} {log}")

    return respostas


def consenso(
    respostas: dict[str, dict[int, str]],
    jogos: list[int],
    fallback_a: dict[int, str] | None = None,
    fallback_b: dict[int, str] | None = None,
) -> dict[int, str]:
    out = {}
    for j in jogos:
        votos = [r.get(j) for r in respostas.values() if r.get(j) and r.get(j) != "???"]
        if not votos:
            fa = (fallback_a or {}).get(j, "??")
            fb = (fallback_b or {}).get(j, "??")
            out[j] = f"{fa} vs {fb}"
            continue
        cnt = Counter(votos)
        out[j] = cnt.most_common(1)[0][0]
    return out


def salvar(rodada_dir: Path, dados: dict) -> None:
    rodada_dir.mkdir(parents=True, exist_ok=True)
    arq = rodada_dir / f"{dados['slug']}.json"
    arq.write_text(json.dumps(dados, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"  salvo: {arq.relative_to(ROOT)}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--rodada", default=datetime.now().strftime("%Y-%m-%dT%H-%M"))
    ap.add_argument("--ias", help="csv de keys (default: todas)")
    ap.add_argument("--dossie", help="path do dossiê (default: data/dossie/campeao-YYYY-MM-DD.md)")
    args = ap.parse_args()

    alvo = [k.strip() for k in (args.ias.split(",") if args.ias else IAS.keys()) if k.strip()]
    for k in alvo:
        if k not in IAS:
            print(f"IA desconhecida: {k}. Válidas: {', '.join(IAS.keys())}", file=sys.stderr)
            return 1

    dossie_path = (
        (ROOT / args.dossie)
        if args.dossie
        else ROOT / "data" / "dossie" / f"campeao-{args.rodada[:10]}.md"
    )
    dossie_path = dossie_path.resolve()
    if not dossie_path.is_file():
        print(f"AVISO: dossiê não achado em {dossie_path}. Rodando SEM contexto.")
        dossie = ""
    else:
        dossie = dossie_path.read_text(encoding="utf-8")
        try:
            print(f"Dossiê: {dossie_path.relative_to(ROOT)} ({len(dossie)} chars)")
        except ValueError:
            print(f"Dossiê: {dossie_path} ({len(dossie)} chars)")

    rodada_dir = ROOT / "data" / "predicoes_campeao" / args.rodada
    print(f"Rodada: {args.rodada}")
    print(f"Output: {rodada_dir.relative_to(ROOT)}")
    print(f"Alvo: {len(alvo)} IAs — {', '.join(alvo)}")

    # Estrutura: jornada[slug][fase][j] = time
    jornadas = {
        IAS[k]["slug"]: {"R32": {j: R32_DECIDIDOS[j][0] for j in R32_DECIDIDOS}} for k in alvo
    }
    vencedores = {j: R32_DECIDIDOS[j][0] for j in R32_DECIDIDOS}
    cristal_jornada = {"R32": {j: R32_DECIDIDOS[j][0] for j in R32_DECIDIDOS}}

    # === R32 pendentes ===
    if R32_PENDENTES:
        respostas = coletar_fase(
            "R32 (pendentes)",
            [{"j": c["j"], "a": c["a"], "b": c["b"]} for c in R32_PENDENTES],
            dossie,
            alvo,
        )
        cons = consenso(
            respostas,
            [c["j"] for c in R32_PENDENTES],
            {c["j"]: c["a"] for c in R32_PENDENTES},
            {c["j"]: c["b"] for c in R32_PENDENTES},
        )
        print(f"  [R32 consenso] {cons}")
        for j, t in cons.items():
            cristal_jornada["R32"][j] = t
            vencedores[j] = t
        for k in alvo:
            slug = IAS[k]["slug"]
            for c in R32_PENDENTES:
                jornadas[slug]["R32"][c["j"]] = respostas[slug].get(c["j"], "???")

    # === Fases seguintes ===
    for fase in FASES:
        confrontos = [
            {
                "j": g["j"],
                "a": vencedores.get(g["wa"], f"W{g['wa']}"),
                "b": vencedores.get(g["wb"], f"W{g['wb']}"),
            }
            for g in fase["jogos"]
        ]
        respostas = coletar_fase(fase["nome"], confrontos, dossie, alvo)
        jogos = [g["j"] for g in fase["jogos"]]
        cons = consenso(
            respostas,
            jogos,
            {c["j"]: c["a"] for c in confrontos},
            {c["j"]: c["b"] for c in confrontos},
        )
        print(f"  [{fase['nome']} consenso] {cons}")
        cristal_jornada[fase["nome"]] = dict(cons)
        for j, t in cons.items():
            vencedores[j] = t
        for k in alvo:
            slug = IAS[k]["slug"]
            jornadas[slug][fase["nome"]] = {j: respostas[slug].get(j, "???") for j in jogos}

    # === Salvar ===
    rodada_em = datetime.now().isoformat(timespec="seconds")
    for k in alvo:
        slug = IAS[k]["slug"]
        campeao = jornadas[slug].get("Final", {}).get(104, "???")
        salvar(
            rodada_dir,
            {
                "slug": slug,
                "rodada_em": rodada_em,
                "campeao": campeao,
                "jornada": {
                    f: {str(j): t for j, t in vs.items()} for f, vs in jornadas[slug].items()
                },
            },
        )

    cristal_campeao = cristal_jornada.get("Final", {}).get(104, "???")
    salvar(
        rodada_dir,
        {
            "slug": "_bola-de-cristal",
            "rodada_em": rodada_em,
            "campeao": cristal_campeao,
            "jornada": {f: {str(j): t for j, t in vs.items()} for f, vs in cristal_jornada.items()},
            "votos_totais": len(alvo),
        },
    )
    salvar(
        rodada_dir,
        {
            "slug": "_resumo",
            "rodada": args.rodada,
            "campeoes": {
                IAS[k]["slug"]: jornadas[IAS[k]["slug"]].get("Final", {}).get(104, "???")
                for k in alvo
            }
            | {"_bola-de-cristal": cristal_campeao},
        },
    )

    print(f"\n🏆 Bola de Cristal: {cristal_campeao}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
