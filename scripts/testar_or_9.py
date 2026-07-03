#!/usr/bin/env python3
"""Testa acesso via OpenRouter aos 9 modelos alvo do bolão."""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from dotenv import load_dotenv  # noqa: E402

load_dotenv(ROOT / "config" / ".env")
KEY = os.getenv("OPENROUTER_API_KEY", "")
assert KEY, "OPENROUTER_API_KEY faltando em config/.env"

MODELOS = {
    "ChatGPT": "openai/gpt-5",
    "Claude": "anthropic/claude-opus-4.8",
    "Gemini": "google/gemini-2.5-pro",
    "Grok": "x-ai/grok-4.20-multi-agent",
    "Mistral": "mistralai/mistral-medium-3.1",
    "Meta Llama": "meta-llama/llama-4-maverick",
    "DeepSeek": "deepseek/deepseek-r1",
    "Qwen": "qwen/qwen3-max",
    "Kimi K2": "moonshotai/kimi-k2",
    "Perplexity": "perplexity/sonar-pro",
    "Copilot A": "openai/gpt-4o",
    "Copilot B": "openai/gpt-4.1",
}

URL = "https://openrouter.ai/api/v1/chat/completions"


def ping(model: str) -> tuple[bool, str]:
    body = {
        "model": model,
        "messages": [{"role": "user", "content": "responda com uma única palavra: FUNCIONA"}],
        "max_tokens": 4000,
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
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            data = json.loads(r.read())
            msg = data["choices"][0]["message"]
            # Reasoning models (o-series, r1) podem devolver em reasoning
            txt = (
                msg.get("content") or msg.get("reasoning") or msg.get("reasoning_content") or ""
            ).strip()[:60]
            return True, txt or "(vazio; keys=" + ",".join(msg.keys()) + ")"
    except urllib.error.HTTPError as e:
        try:
            err = json.loads(e.read()).get("error", {}).get("message", str(e))
        except Exception:
            err = str(e)
        return False, err[:120]
    except Exception as e:
        return False, str(e)[:120]


print(f"{'Marca':<12} {'Modelo':<40} STATUS  RESPOSTA")
print("-" * 100)
for marca, model in MODELOS.items():
    ok, msg = ping(model)
    icone = "OK  " if ok else "FAIL"
    print(f"{marca:<12} {model:<40} {icone}    {msg}")
