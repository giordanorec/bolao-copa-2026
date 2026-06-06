"""Coletor de palpites via OpenRouter API.

Chamadas em paralelo controlado (asyncio + httpx + Semaphore). Cada IA é
isolada: falha em uma não derruba as outras. Resposta crua é salva em
``data/palpites_ias/<slug>.md`` com metadados HTML que o parser do bolão
ignora silenciosamente.

Auth:
    Lê ``OPENROUTER_API_KEY`` do env (carregar via python-dotenv no entrypoint
    de quem chama, se quiser .env). Opcionalmente ``OPENROUTER_REFERER`` —
    recomendado pelo provedor pra atribuição.

Política de retry:
    Timeout 120s. 3 tentativas com backoff exponencial (1s, 3s, 9s) somente
    para HTTP 429/5xx e erros de rede. 4xx (exceto 429) falha imediato.
"""

from __future__ import annotations

import asyncio
import json
import os
import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import httpx

BRT = timezone(timedelta(hours=-3))
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
TIMEOUT_S = 120.0
RETRY_DELAYS: tuple[float, ...] = (1.0, 3.0, 9.0)
_RETRY_STATUS = frozenset({429, 500, 502, 503, 504})


class OpenRouterError(RuntimeError):
    """Erro de comunicação ou contrato da API OpenRouter."""


def _api_key() -> str:
    key = os.environ.get("OPENROUTER_API_KEY")
    if not key:
        raise RuntimeError(
            "OPENROUTER_API_KEY ausente do ambiente. "
            "Copie config/.env.example pra config/.env e preencha; "
            "ou exporte na shell antes de rodar."
        )
    return key


def _headers() -> dict[str, str]:
    h = {
        "Authorization": f"Bearer {_api_key()}",
        "Content-Type": "application/json",
    }
    referer = os.environ.get("OPENROUTER_REFERER")
    if referer:
        h["HTTP-Referer"] = referer
        h["X-Title"] = "Bolao da Copa 2026"
    return h


async def _post_with_retry(client: httpx.AsyncClient, payload: dict[str, Any]) -> dict[str, Any]:
    """POST com até 4 tentativas (1 inicial + 3 retries). Apenas para
    erros transientes (429, 5xx, timeout, rede). 4xx outras falham na hora."""
    last_err: Exception | None = None
    delays = (0.0, *RETRY_DELAYS)
    headers = _headers()
    for delay in delays:
        if delay > 0:
            await asyncio.sleep(delay)
        try:
            r = await client.post(OPENROUTER_URL, json=payload, headers=headers, timeout=TIMEOUT_S)
        except (httpx.TimeoutException, httpx.NetworkError) as e:
            last_err = e
            continue
        if r.status_code == 200:
            return r.json()  # type: ignore[no-any-return]
        if r.status_code in _RETRY_STATUS:
            last_err = OpenRouterError(f"HTTP {r.status_code}: {r.text[:200]}")
            continue
        # 4xx não-transiente → falha imediata
        raise OpenRouterError(f"HTTP {r.status_code}: {r.text[:500]}")
    raise OpenRouterError(f"falhou após {len(delays)} tentativas: {last_err}")


async def coletar_via_openrouter(
    client: httpx.AsyncClient,
    slug: str,
    modelo: str,
    prompt: str,
    dossie: str,
) -> str:
    """Chama OpenRouter e devolve o ``content`` da resposta.

    O ``slug`` é só pra log; o que vai pra API é ``modelo``. Se ``dossie``
    for vazio, não anexa seção (caller pode ter pré-substituído ``{{DOSSIE}}``
    no prompt).
    """
    _ = slug
    conteudo_msg = f"{prompt}\n\n## DOSSIÊ DE REFERÊNCIA\n\n{dossie}" if dossie.strip() else prompt
    payload = {
        "model": modelo,
        "messages": [{"role": "user", "content": conteudo_msg}],
    }
    data = await _post_with_retry(client, payload)
    try:
        return str(data["choices"][0]["message"]["content"])
    except (KeyError, IndexError, TypeError) as e:
        raise OpenRouterError(
            f"resposta inesperada: {e}; payload[:300]={json.dumps(data)[:300]}"
        ) from e


_HEADER_REGEX = {
    "ia": re.compile(r"^<!--\s*ia:\s*(.+?)\s*-->\s*$", re.MULTILINE),
    "tier": re.compile(r"^<!--\s*tier:\s*(.+?)\s*-->\s*$", re.MULTILINE),
    "url": re.compile(r"^<!--\s*url:\s*(.+?)\s*-->\s*$", re.MULTILINE),
}


def _ler_metadados_placeholder(arq: Path) -> dict[str, str]:
    if not arq.exists():
        return {}
    try:
        texto = arq.read_text(encoding="utf-8")
    except OSError:
        return {}
    out: dict[str, str] = {}
    for chave, regex in _HEADER_REGEX.items():
        m = regex.search(texto)
        if m:
            out[chave] = m.group(1).strip()
    return out


def salvar_palpite(
    palpites_dir: Path,
    slug: str,
    modelo: str,
    conteudo: str,
) -> Path:
    """Grava resposta da IA em ``<dir>/<slug>.md`` com header de metadados.

    Preserva ``<!-- ia: ... -->`` / ``<!-- tier: ... -->`` / ``<!-- url: ... -->``
    do placeholder existente quando possível.
    """
    palpites_dir.mkdir(parents=True, exist_ok=True)
    arq = palpites_dir / f"{slug}.md"
    meta = _ler_metadados_placeholder(arq)
    ia_nome = meta.get("ia", slug)
    tier = meta.get("tier", "?")
    url = meta.get("url", "")
    coletado_em = datetime.now(BRT).isoformat(timespec="seconds")

    headers = [
        f"<!-- ia: {ia_nome} -->",
        f"<!-- slug: {slug} -->",
        f"<!-- tier: {tier} -->",
    ]
    if url:
        headers.append(f"<!-- url: {url} -->")
    headers += [
        "<!-- modo: api -->",
        f"<!-- modelo: {modelo} -->",
        f"<!-- coletado_em: {coletado_em} -->",
        "<!-- status: palpitou via api -->",
        "",
        f"# Palpite — {ia_nome} (via OpenRouter)",
        "",
    ]
    arq.write_text("\n".join(headers) + conteudo.rstrip() + "\n", encoding="utf-8")
    return arq


async def coletar_lote(
    ias: list[dict[str, Any]],
    prompt: str,
    dossie: str,
    palpites_dir: Path,
    max_paralelo: int = 5,
) -> list[dict[str, Any]]:
    """Chama as IAs em paralelo controlado.

    ``ias``: lista de ``{"slug": str, "model": str}`` (chaves adicionais
    são ignoradas). Retorna lista de
    ``{"slug", "ok", "erro", "arquivo"}`` na ordem de conclusão.
    """
    sem = asyncio.Semaphore(max_paralelo)
    resultados: list[dict[str, Any]] = []

    async with httpx.AsyncClient() as client:

        async def _processar(item: dict[str, Any]) -> None:
            slug = item["slug"]
            modelo = item["model"]
            async with sem:
                try:
                    conteudo = await coletar_via_openrouter(client, slug, modelo, prompt, dossie)
                    arq = salvar_palpite(palpites_dir, slug, modelo, conteudo)
                    resultados.append({"slug": slug, "ok": True, "erro": None, "arquivo": str(arq)})
                    print(f"  OK   {slug}  → {arq.name}", flush=True)
                except Exception as e:
                    resultados.append({"slug": slug, "ok": False, "erro": str(e), "arquivo": None})
                    print(f"  FAIL {slug}: {e}", file=sys.stderr, flush=True)

        await asyncio.gather(*(_processar(it) for it in ias))

    return resultados
