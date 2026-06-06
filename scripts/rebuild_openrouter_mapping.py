#!/usr/bin/env python
"""Reconstrói config/openrouter_mapping.json com IDs validados contra
config/openrouter_models_live.json (snapshot da API GET /api/v1/models).

Estratégia:
1. Tabela explícita slug -> openrouter id (curada).
2. Valida que cada ID está na lista live.
3. Pula sluges sem match (não entram no mapping).
4. Imprime relatório de quem entrou e quem ficou de fora.

Uso:
    python scripts/rebuild_openrouter_mapping.py
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# slug -> (openrouter_id, tier)  — IDs verificados em 2026-06-05 contra a lista live
CURADO: dict[str, tuple[str, int]] = {
    # ─── Tier 1 ───
    "chatgpt-5": ("openai/gpt-5", 1),
    "chatgpt-5-thinking": ("openai/gpt-5-pro", 1),
    "claude-opus-4-7": ("anthropic/claude-opus-4.7", 1),
    "claude-sonnet-4-6": ("anthropic/claude-sonnet-4.6", 1),
    "claude-haiku-4-5": ("anthropic/claude-haiku-4.5", 1),
    "gemini-2-5-pro": ("google/gemini-2.5-pro", 1),
    "gemini-2-5-flash": ("google/gemini-2.5-flash", 1),
    "grok-4": ("x-ai/grok-4.20", 1),
    "grok-4-heavy": ("x-ai/grok-4.20-multi-agent", 1),
    "deepseek-r1": ("deepseek/deepseek-r1", 1),
    "deepseek-v3-1": ("deepseek/deepseek-chat-v3.1", 1),
    "perplexity-sonar-pro": ("perplexity/sonar-pro", 1),
    "le-chat-mistral": ("mistralai/mistral-large-2512", 1),
    "meta-llama-4": ("meta-llama/llama-4-maverick", 1),
    "qwen-3-max": ("qwen/qwen3-max", 1),
    # copilot-microsoft não tem API direta — fica fora

    # ─── Tier 2 — variantes mid/light ───
    "chatgpt-5-mini": ("openai/gpt-5-mini", 2),
    "chatgpt-5-nano": ("openai/gpt-5-nano", 2),
    "o3": ("openai/o3", 2),
    "o4-mini": ("openai/o4-mini", 2),
    "claude-opus-4-5": ("anthropic/claude-opus-4.5", 2),
    "claude-sonnet-4-5": ("anthropic/claude-sonnet-4.5", 2),
    "gemini-2-5-flash-lite": ("google/gemini-2.5-flash-lite", 2),
    "grok-4-fast": ("x-ai/grok-4.3", 2),
    "deepseek-v3-2": ("deepseek/deepseek-v3.2", 2),
    "mistral-medium-3": ("mistralai/mistral-medium-3.1", 2),
    "mistral-small-3": ("mistralai/mistral-small-3.2-24b-instruct", 2),
    "cohere-command-r-plus": ("cohere/command-r-plus-08-2024", 2),
    # gemini-2-0-pro / gemini-2-0-flash / grok-3 / grok-3-mini não estão mais no OR

    # ─── Tier 3 — open source ───
    "llama-4-maverick": ("meta-llama/llama-4-maverick", 3),
    "llama-4-scout": ("meta-llama/llama-4-scout", 3),
    "llama-3-3-70b": ("meta-llama/llama-3.3-70b-instruct", 3),
    "llama-3-1-70b": ("meta-llama/llama-3.1-70b-instruct", 3),
    "mixtral-8x22b": ("mistralai/mixtral-8x22b-instruct", 3),
    "ministral-8b": ("mistralai/ministral-8b-2512", 3),
    "codestral": ("mistralai/codestral-2508", 3),
    "qwen-3-235b": ("qwen/qwen3-235b-a22b", 3),
    "qwen-3-coder": ("qwen/qwen3-coder", 3),
    "qwen-2-5-72b": ("qwen/qwen-2.5-72b-instruct", 3),
    # llama-3-1-405b, llama-3-2-90b-vision, mathstral, pixtral-large, nemotron, dbrx, snowflake-arctic, nous-hermes-3
    # — verificar caso a caso; muitos podem ter saído do OR

    # ─── Tier 4 — chineses (poucos no OR) ───
    "minimax-abab": None,  # placeholder; muitos chineses só via UI

    # ─── Tier 5 — legacy ───
    "gpt-4o": ("openai/gpt-4o", 5),
    "gpt-4-1": ("openai/gpt-4.1", 5),
    "o1": ("openai/o1", 5),
    "claude-haiku-3-5": ("anthropic/claude-3.5-haiku", 5),
    "deepseek-v3": ("deepseek/deepseek-chat-v3-0324", 5),
    "llama-3-70b": ("meta-llama/llama-3-70b-instruct", 5),
    "gemma-2-27b": ("google/gemma-2-27b-it", 5),
    # claude-sonnet-3-7 / sonnet-3-5 / opus-3 não estão mais
    # gemini-1-5-pro/flash não vi
    # grok-2 / mixtral-8x7b / pixtral-12b — pular

    # ─── Tier 6 — especializadas ───
    "gemma-3-27b": ("google/gemma-3-27b-it", 6),
    "gemma-3-12b": ("google/gemma-3-12b-it", 6),
    "phi-4": ("microsoft/phi-4", 6),
    "phi-4-mini": ("microsoft/phi-4-mini-instruct", 6),
    "wizardlm-2-8x22b": ("microsoft/wizardlm-2-8x22b", 6),
    # qwen-vl-max, molmo-72b, cohere-aya-expanse — verificar

    # ─── Tier 7 — diversificadas ───
    "cohere-command-a": ("cohere/command-a", 7),
    "cohere-command-r": ("cohere/command-r-08-2024", 7),
    "kimi-k2": ("moonshotai/kimi-k2", 7),
    "jamba-1-5-large": ("ai21/jamba-large-1.7", 7),
    # yi-large, yi-lightning, reka-core, reka-flash, falcon-3-10b, falcon-180b, olmo-2-32b, tulu-3-405b — pular

    # ─── Tier 8 — curiosidades ───
    "perplexity-sonar-reasoning": ("perplexity/sonar-reasoning-pro", 8),
    "perplexity-sonar-large": ("perplexity/sonar", 8),
    "inflection-3": ("inflection/inflection-3-productivity", 8),
    "inflection-pi": ("inflection/inflection-3-pi", 8),
    "lfm-40b": ("liquid/lfm-2-24b-a2b", 8),
    # ibm-granite, stablelm — pular (não estão no OR)
}


def main() -> int:
    live_path = ROOT / "config" / "openrouter_models_live.json"
    mapping_path = ROOT / "config" / "openrouter_mapping.json"

    if not live_path.is_file():
        print(f"ERRO: {live_path} não existe. Rode o snapshot primeiro.")
        return 1

    live = json.loads(live_path.read_text(encoding="utf-8"))
    live_ids = {m["id"] for m in live}

    novo: dict[str, dict[str, object]] = {
        "_README": (
            "Mapping slug -> modelo OpenRouter. Reconstruído por "
            "scripts/rebuild_openrouter_mapping.py contra snapshot de "
            "openrouter_models_live.json. Mantenha o snapshot atualizado."
        ),
    }
    aprovados: list[str] = []
    drops: list[str] = []

    for slug, entry in CURADO.items():
        if entry is None:
            drops.append(f"{slug}: descartado (placeholder None)")
            continue
        model_id, tier = entry
        if model_id not in live_ids:
            drops.append(f"{slug}: {model_id} fora da lista live")
            continue
        novo[slug] = {"model": model_id, "tier": tier}
        aprovados.append(f"{slug} -> {model_id} (tier {tier})")

    mapping_path.write_text(
        json.dumps(novo, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    print(f"=== mapping reconstruído: {len(aprovados)} IAs ===")
    for line in aprovados:
        print(f"  OK  {line}")
    if drops:
        print(f"\n=== descartados ({len(drops)}) ===")
        for line in drops:
            print(f"  --  {line}")
    print(f"\nescrito em: {mapping_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
