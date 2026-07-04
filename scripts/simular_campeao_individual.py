#!/usr/bin/env python3
"""Simulação INDIVIDUAL de cada IA (jornada completa da Copa numa chamada).

Diferença pro simular_campeao_api.py (waterfall consenso):
- Aqui cada IA responde a Copa INTEIRA sozinha, do R32 até o campeão.
- Não usa consenso entre fases — cada IA segue sua própria escolha.
- Jornada individual 100% coerente com o bracket dela.

Serve pra alimentar /predicoes-campeao (jornada individual por IA).
O Cristal (consenso) continua vindo do simular_campeao_api.py.

Uso:
    python scripts/simular_campeao_individual.py --rodada=2026-07-03T09-00
    python scripts/simular_campeao_individual.py --rodada=... --ias=chatgpt,claude
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
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from dotenv import load_dotenv  # noqa: E402

load_dotenv(ROOT / "config" / ".env")
KEY = os.getenv("OPENROUTER_API_KEY", "")
assert KEY, "OPENROUTER_API_KEY faltando em config/.env"

URL = "https://openrouter.ai/api/v1/chat/completions"

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

# R32 já decidido em campo (13 jogos). J86/87/88 pendentes.
R32_DECIDIDOS = {
    73: "Canadá",
    74: "Paraguai",
    75: "Marrocos",
    76: "Brasil",
    77: "França",
    78: "Noruega",
    79: "México",
    80: "Inglaterra",
    81: "Estados Unidos",
    82: "Bélgica",
    83: "Portugal",
    84: "Espanha",
    85: "Suíça",
    86: "Argentina",
    87: "Colômbia",
    88: "Egito",
}
R32_PENDENTES: list[dict] = []

# Pairings do bracket (mesmos do simular_campeao_api.py)
PAIRINGS = {
    "Oitavas": [
        {"j": 89, "wa": 74, "wb": 77},  # Paraguai x França
        {"j": 90, "wa": 73, "wb": 75},  # Canadá x Marrocos
        {"j": 91, "wa": 76, "wb": 78},  # Brasil x Noruega
        {"j": 92, "wa": 79, "wb": 80},  # México x Inglaterra
        {"j": 93, "wa": 83, "wb": 84},  # Portugal x Espanha
        {"j": 94, "wa": 81, "wb": 82},  # EUA x Bélgica
        {"j": 95, "wa": 86, "wb": 88},  # W86 x W88
        {"j": 96, "wa": 85, "wb": 87},  # Suíça x W87
    ],
    "Quartas": [
        {"j": 97, "wa": 89, "wb": 90},
        {"j": 98, "wa": 93, "wb": 94},
        {"j": 99, "wa": 91, "wb": 92},
        {"j": 100, "wa": 95, "wb": 96},
    ],
    "Semifinal": [
        {"j": 101, "wa": 97, "wb": 98},
        {"j": 102, "wa": 99, "wb": 100},
    ],
    "Final": [
        {"j": 104, "wa": 101, "wb": 102},
    ],
}


def buildPrompt(dossie: str) -> str:
    r32_dec_txt = ", ".join(f"J{j}={t}" for j, t in R32_DECIDIDOS.items())
    r32_pend_txt = "\n".join(f"| J{c['j']} | {c['a']} vs {c['b']} |" for c in R32_PENDENTES)
    pairings_txt = []
    for fase, jogos in PAIRINGS.items():
        pairings_txt.append(f"\n{fase}:")
        for g in jogos:
            pairings_txt.append(f"  J{g['j']} = Vencedor(J{g['wa']}) x Vencedor(J{g['wb']})")
    pairings_str = "\n".join(pairings_txt)

    return f"""Bolão Copa 2026 — Sua simulação INDIVIDUAL do campeão.

Você vai simular a Copa do Mundo 2026 INTEIRA sozinho, do R32 até o Campeão.
NÃO é consenso — a jornada é SÓ SUA. Cada escolha sua na Oitavas define
o confronto que ela mesma vai jogar nas Quartas, e assim por diante.

Use o DOSSIÊ como base factual. NÃO invente dados. NÃO pesquise.

=== DOSSIÊ ===
{dossie}
=== FIM DO DOSSIÊ ===

## Estado atual do bracket

R32 já decidido em campo (não mude): {r32_dec_txt}

R32 pendente (você escolhe o vencedor):
| Jogo | Confronto |
|------|-----------|
{r32_pend_txt}

## Bracket das fases seguintes (pairings oficiais FIFA)
{pairings_str}

## Sua tarefa

Escolha os vencedores dos R32 pendentes E TODOS os jogos do mata-mata até
a Final. Cada Oitavas segue seus R32 pendentes. Cada Quartas segue suas
Oitavas. Cada Semi segue suas Quartas. A Final segue suas Semis.

Sua jornada precisa ser COERENTE com o bracket: se você disse que México
vence J92, então nas Quartas J99 = Vencedor(J91) x México. Não coloque
Inglaterra em J99 se você mandou ela pra casa nas Oitavas.

Responda EXCLUSIVAMENTE em JSON no formato exato abaixo:

{{
  "R32": {{"86": "NomeTime", "87": "NomeTime", "88": "NomeTime"}},
  "Oitavas": {{"89": "NomeTime", "90": "NomeTime", "91": "NomeTime", "92": "NomeTime", "93": "NomeTime", "94": "NomeTime", "95": "NomeTime", "96": "NomeTime"}},
  "Quartas": {{"97": "NomeTime", "98": "NomeTime", "99": "NomeTime", "100": "NomeTime"}},
  "Semifinal": {{"101": "NomeTime", "102": "NomeTime"}},
  "Final": {{"104": "NomeTime"}}
}}

Sem texto extra. Sem markdown. Sem código. Só o objeto JSON."""


def perguntar(model: str, prompt: str) -> tuple[bool, str]:
    body = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 8000,
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
            with urllib.request.urlopen(req, timeout=240) as r:
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


def parseJornada(texto: str) -> dict[str, dict[str, str]] | None:
    """Extrai a jornada completa do JSON na resposta."""
    for start in range(len(texto)):
        if texto[start] != "{":
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
                        if isinstance(obj, dict) and any(
                            f in obj for f in ("R32", "Oitavas", "Final")
                        ):
                            return obj
                    except Exception:
                        pass
                    break
    return None


# Sinônimos aceitos como igual ao nome canônico (evita falsa incoerência
# tipo "EUA" != "Estados Unidos" ou "Costa do Marfim" != "Costa do Marfil").
SINONIMOS = {
    "EUA": "Estados Unidos",
    "USA": "Estados Unidos",
    "United States": "Estados Unidos",
    "Estados Unidos da América": "Estados Unidos",
    "Coréia do Sul": "Coreia do Sul",
    "Coreia": "Coreia do Sul",
    "Bosnia": "Bósnia-Herzegovina",
    "Bósnia": "Bósnia-Herzegovina",
    "Congo": "Congo (RD)",
    "RD Congo": "Congo (RD)",
    "República Democrática do Congo": "Congo (RD)",
    "Costa do Marfil": "Costa do Marfim",
    "Marfim": "Costa do Marfim",
    "Ivory Coast": "Costa do Marfim",
    "Netherlands": "Países Baixos",
    "Holanda": "Países Baixos",
    "Bosnia and Herzegovina": "Bósnia-Herzegovina",
    "Saudi Arabia": "Arábia Saudita",
}


def canonizar(t: str | None) -> str | None:
    if not t:
        return t
    ts = t.strip()
    return SINONIMOS.get(ts, ts)


def validar_coerencia(jornada: dict, r32_completo: dict) -> list[str]:
    """Checa se a jornada respeita o bracket. Retorna lista de erros."""
    erros = []
    vencedores = dict(r32_completo)  # {j: time canônico}
    # R32 pendentes
    r32_j = jornada.get("R32", {}) or {}
    for c in R32_PENDENTES:
        j = str(c["j"])
        t = canonizar(r32_j.get(j))
        if not t:
            erros.append(f"R32 J{j}: sem palpite")
            continue
        if t not in (c["a"], c["b"]):
            erros.append(f"R32 J{j}: '{t}' não estava no confronto ({c['a']} vs {c['b']})")
            continue
        vencedores[c["j"]] = t
    # Fases seguintes
    for fase, jogos in PAIRINGS.items():
        f_j = jornada.get(fase, {}) or {}
        for g in jogos:
            j = str(g["j"])
            wa = vencedores.get(g["wa"])
            wb = vencedores.get(g["wb"])
            t = canonizar(f_j.get(j))
            if not t:
                erros.append(f"{fase} J{j}: sem palpite")
                continue
            candidatos = [x for x in (wa, wb) if x]
            if candidatos and t not in candidatos:
                erros.append(f"{fase} J{j}: '{t}' não estava no confronto ({wa} vs {wb})")
                continue
            vencedores[g["j"]] = t
    return erros


def normalizar_jornada(jornada: dict) -> dict[str, dict[str, str]]:
    """Preenche R32 completo (decididos + pendentes) e canoniza nomes."""
    out = {}
    r32 = {str(j): t for j, t in R32_DECIDIDOS.items()}
    for j, t in (jornada.get("R32", {}) or {}).items():
        r32[str(j)] = canonizar(str(t)) if t else "???"
    for c in R32_PENDENTES:
        r32.setdefault(str(c["j"]), "???")
    out["R32"] = r32
    for fase in ("Oitavas", "Quartas", "Semifinal", "Final"):
        m = jornada.get(fase, {}) or {}
        out[fase] = {str(j): (canonizar(str(t)) if t else "???") for j, t in m.items()}
        for g in PAIRINGS.get(fase, []):
            out[fase].setdefault(str(g["j"]), "???")
    return out


def rodar_uma(
    key: str, dossie: str, max_retries: int = 3
) -> tuple[str, dict | None, list[str], str]:
    """Roda 1 IA. Se a resposta tiver incoerências (time fora do confronto),
    reformula o prompt com o feedback específico e pede pra IA corrigir.
    Continua até 0 incoerências OU esgotar tentativas."""
    cfg = IAS[key]
    prompt_base = buildPrompt(dossie)
    ultima_jornada = None
    ultimos_erros = ["nunca rodou"]
    log_iter = []
    r32_ref = {j: t for j, t in R32_DECIDIDOS.items()}
    for tent in range(1, max_retries + 1):
        if tent == 1:
            prompt = prompt_base
        else:
            # Feedback: mostra os erros específicos e pede correção
            feedback = "\n".join(f"- {e}" for e in ultimos_erros[:12])
            prompt = (
                prompt_base
                + "\n\n---\n\n"
                + f"Sua tentativa {tent - 1} teve INCOERÊNCIAS com o bracket:\n\n"
                + feedback
                + "\n\nUma vitória num jogo só é válida se o time ESTAVA no confronto "
                + "(um dos 2 vencedores das fases anteriores segundo o pairing). "
                + "Reveja seus palpites e responda o JSON completo de novo, "
                + "corrigindo especificamente esses erros. Não invente times "
                + "que não estão no bracket. Só o JSON."
            )
        ok, txt = perguntar(cfg["model"], prompt)
        if not ok:
            log_iter.append(f"t{tent}=API-FAIL")
            continue
        jornada = parseJornada(txt)
        if not jornada:
            log_iter.append(f"t{tent}=parse-fail")
            continue
        normalizada = normalizar_jornada(jornada)
        erros = validar_coerencia(normalizada, r32_ref)
        ultima_jornada = normalizada
        ultimos_erros = erros
        log_iter.append(f"t{tent}={len(erros)}err")
        if not erros:
            campeao = normalizada.get("Final", {}).get("104", "???")
            return key, normalizada, [], (f"OK campeao={campeao} [{', '.join(log_iter)}]")
    campeao = (ultima_jornada or {}).get("Final", {}).get("104", "???")
    return (
        key,
        ultima_jornada,
        ultimos_erros,
        (f"parcial campeao={campeao}, {len(ultimos_erros)} incoerência(s) [{', '.join(log_iter)}]"),
    )


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--rodada", default=datetime.now().strftime("%Y-%m-%dT%H-%M"))
    ap.add_argument("--ias", help="csv de keys (default: todas)")
    ap.add_argument("--dossie", help="path do dossiê (default: data/dossie/campeao-YYYY-MM-DD.md)")
    ap.add_argument("--max-paralelo", type=int, default=6)
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
        print(f"Dossiê: {len(dossie)} chars")

    rodada_dir = ROOT / "data" / "predicoes_campeao" / args.rodada
    rodada_dir.mkdir(parents=True, exist_ok=True)
    print(f"Rodada: {args.rodada}")
    print(f"Alvo: {len(alvo)} IAs — {', '.join(alvo)}")

    rodada_em = datetime.now().isoformat(timespec="seconds")
    with futures.ThreadPoolExecutor(max_workers=args.max_paralelo) as ex:
        for key, jornada, erros, log in ex.map(lambda k: rodar_uma(k, dossie), alvo):
            cfg = IAS[key]
            print(f"  [{cfg['nome']:25}] {log}")
            for e in erros[:3]:
                print(f"    ! {e}")
            if not jornada:
                # Grava JSON vazio pra sinalizar que a IA falhou
                dados = {
                    "slug": cfg["slug"],
                    "rodada_em": rodada_em,
                    "campeao": "???",
                    "jornada": normalizar_jornada({}),
                }
            else:
                campeao = jornada.get("Final", {}).get("104", "???")
                dados = {
                    "slug": cfg["slug"],
                    "rodada_em": rodada_em,
                    "campeao": campeao,
                    "jornada": jornada,
                }
            arq = rodada_dir / f"{cfg['slug']}.json"
            arq.write_text(json.dumps(dados, ensure_ascii=False, indent=2), encoding="utf-8")
            print(f"    salvo: {arq.relative_to(ROOT)}")

    print("\nOK. Cristal (_bola-de-cristal.json) NÃO tocado — ele vem do simular_campeao_api.py.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
