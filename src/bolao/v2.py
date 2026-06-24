"""Pipeline v2: coleta isolada e comparacao v1 x v2.

v2 cobre apenas os jogos 41-72 que ainda nao comecaram no instante da coleta.
Nenhuma funcao aqui toca web/data/, v4/public/, ranking, cristal ou
data/palpites_ias/ (v1). Isolamento absoluto conforme spec F-palpites-v2.

Exporta:
    coletar_v2_cmd  -- logica do subcomando ``coletar-v2``
    comparar_v2_cmd -- logica do subcomando ``comparar-v2``
"""

from __future__ import annotations

import asyncio
import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .models import Jogo, Palpite

BRT = timezone(timedelta(hours=-3))

# Intervalo fixo de jogos cobertos pelo v2
V2_JOGO_MIN = 41
V2_JOGO_MAX = 72


# ---------------------------------------------------------------------------
# Helpers de kickoff
# ---------------------------------------------------------------------------


def _jogo_aberto(jogo_data: str, jogo_hora: str, agora: datetime) -> bool:
    """True se o jogo ainda nao comecou (kickoff estritamente no futuro)."""
    inicio = datetime.fromisoformat(f"{jogo_data}T{jogo_hora}:00").replace(tzinfo=BRT)
    return agora < inicio


# ---------------------------------------------------------------------------
# Construcao do bloco RESULTADOS para injecao no prompt
# ---------------------------------------------------------------------------


def _tabela_resultados_md(resultados_path: Path) -> str:
    """Extrai a tabela Markdown dos resultados existentes (jogos 1-40).

    Devolve o texto bruto da tabela (cabecalho + linhas de dados) pronto para
    substituir o placeholder {{RESULTADOS}} no prompt v2.
    """
    if not resultados_path.exists():
        return "(sem resultados disponiveis)"

    linhas_tabela: list[str] = []
    for linha in resultados_path.read_text(encoding="utf-8").splitlines():
        stripped = linha.strip()
        # Inclui cabecalho, separador e linhas de dados da tabela markdown
        if stripped.startswith("|"):
            linhas_tabela.append(linha)

    return "\n".join(linhas_tabela) if linhas_tabela else "(sem resultados disponiveis)"


# ---------------------------------------------------------------------------
# Bloco PALPITES_V1: o que a propria IA cravou na 1a leva (jogos 41-72)
# ---------------------------------------------------------------------------


def _tabela_palpites_v1(
    palpites_slug: list[Palpite],
    jogos_por_numero: dict[int, Jogo],
) -> str:
    """Markdown com os palpites v1 da propria IA para os jogos 41-72.

    Serve para relembrar cada IA do que ela mesma palpitou na primeira leva,
    para que reconsidere a luz dos resultados e do dossie. Devolve uma nota
    quando a IA nao tem palpites v1 para o intervalo.
    """
    por_numero = {p.jogo_numero: p for p in palpites_slug}
    linhas = [
        "| Jogo | Time A | Gols A (seu v1) | Gols B (seu v1) | Time B |",
        "|---|---|---|---|---|",
    ]
    tem_algum = False
    for n in range(V2_JOGO_MIN, V2_JOGO_MAX + 1):
        jogo = jogos_por_numero.get(n)
        p = por_numero.get(n)
        if jogo is None or p is None:
            continue
        tem_algum = True
        linhas.append(f"| {n} | {jogo.time_a} | {p.gols_a} | {p.gols_b} | {jogo.time_b} |")

    if not tem_algum:
        return "(voce nao registrou palpites v1 para os jogos 41-72)"
    return "\n".join(linhas)


# ---------------------------------------------------------------------------
# Salvar palpite v2 com header correto
# ---------------------------------------------------------------------------


def _salvar_palpite_v2(
    palpites_v2_dir: Path,
    slug: str,
    modelo: str,
    conteudo: str,
    corte: str,
) -> Path:
    """Grava data/palpites_v2/<slug>.md com header v2.

    Difere do v1 em dois pontos:
    - Adiciona ``<!-- versao: v2 -->`` e ``<!-- corte: <data> -->``
    - Nao tenta ler metadados de placeholder: v2 nao tem placeholders pre-existentes
    """
    palpites_v2_dir.mkdir(parents=True, exist_ok=True)
    arq = palpites_v2_dir / f"{slug}.md"

    coletado_em = datetime.now(BRT).isoformat(timespec="seconds")
    headers = [
        f"<!-- ia: {slug} -->",
        f"<!-- slug: {slug} -->",
        "<!-- versao: v2 -->",
        f"<!-- corte: {corte} -->",
        "<!-- modo: api -->",
        f"<!-- modelo: {modelo} -->",
        f"<!-- coletado_em: {coletado_em} -->",
        "<!-- status: palpitou via api -->",
        "",
        f"# Palpite v2 — {slug} (via OpenRouter)",
        "",
    ]
    arq.write_text("\n".join(headers) + conteudo.rstrip() + "\n", encoding="utf-8")
    return arq


# ---------------------------------------------------------------------------
# coletar_v2_cmd
# ---------------------------------------------------------------------------


def coletar_v2_cmd(args: object, root: Path) -> int:
    """Implementa ``python -m bolao coletar-v2``.

    Reutiliza coletor.coletar_lote. Injeta {{DOSSIE}} e {{RESULTADOS}} no
    prompt v2. Grava em data/palpites_v2/. Nao toca em nada do fluxo v1.
    """

    a = args
    # -- caminhos fixos v2 --
    mapping_path = root / "config" / "openrouter_mapping.json"
    prompt_v2_path = root / "config" / "prompts" / "ia-palpiteira-v2.md"
    resultados_path = root / "data" / "resultados" / "jogos.md"
    jogos_path = root / "data" / "jogos.md"
    palpites_v2_dir = root / "data" / "palpites_v2"

    # -- carregar mapping --
    if not mapping_path.is_file():
        print(f"erro: mapping nao encontrado: {mapping_path}", file=sys.stderr)
        return 1
    raw_mapping = json.loads(mapping_path.read_text(encoding="utf-8"))
    mapping = {k: v for k, v in raw_mapping.items() if not k.startswith("_")}

    # -- filtrar IAs --
    from .__main__ import _filtrar_ias_coletar

    tier_arg = getattr(a, "tier", None)
    ia_arg = getattr(a, "ia", None)
    ias = _filtrar_ias_coletar(mapping, tier_arg, ia_arg)
    if not ias:
        print("erro: nenhuma IA selecionada pelos filtros", file=sys.stderr)
        return 1

    # -- dossiê v2: argumento ou ultimo em data/dossie/ com prefixo v2- --
    dossie_arg = getattr(a, "dossie", None)
    if dossie_arg:
        dossie_path = Path(dossie_arg)
    else:
        dossie_dir = root / "data" / "dossie"
        candidatos = sorted(dossie_dir.glob("v2-*.md")) if dossie_dir.is_dir() else []
        dossie_path = candidatos[-1] if candidatos else None  # type: ignore[assignment]

    dry_run = getattr(a, "dry_run", False)

    if not dry_run:
        if dossie_path is None or not dossie_path.is_file():
            print(
                "erro: dossiê v2 nao encontrado. Use --dossie <path> ou crie data/dossie/v2-*.md",
                file=sys.stderr,
            )
            return 1
        if not prompt_v2_path.is_file():
            print(f"erro: prompt v2 nao encontrado em {prompt_v2_path}", file=sys.stderr)
            return 1

    # -- filtrar jogos v2 abertos no momento --
    from .parser import carregar_jogos

    jogos_todos = carregar_jogos(jogos_path)
    agora = datetime.now(BRT)
    jogos_v2_abertos = [
        j
        for j in jogos_todos
        if V2_JOGO_MIN <= j.numero <= V2_JOGO_MAX and _jogo_aberto(j.data, j.hora, agora)
    ]

    if not jogos_v2_abertos and not dry_run:
        print(
            "aviso: nenhum jogo 41-72 com kickoff no futuro encontrado. "
            "Verifique data/jogos.md e o horario atual.",
            file=sys.stderr,
        )
        # Nao e erro fatal em dry_run; em coleta real, continua mas avisa

    dossie_label = dossie_path.name if dossie_path else "(nenhum)"
    print(
        f"coletar-v2: {len(ias)} IA(s) · dossiê={dossie_label} · "
        f"jogos v2 abertos={len(jogos_v2_abertos)}"
    )
    for item in ias:
        print(f"  - {item['slug']:32s} -> {item['model']}  (tier {item['tier']})")
    if jogos_v2_abertos:
        nums = sorted(j.numero for j in jogos_v2_abertos)
        print(f"  jogos abertos: {nums[0]}-{nums[-1]} ({len(nums)} total)")

    if dry_run:
        print("(dry-run; nenhuma chamada feita)")
        return 0

    # -- construir prompt com substituicao dos placeholders globais --
    # {{DOSSIE}} e {{RESULTADOS}} sao iguais para todas as IAs; {{PALPITES_V1}}
    # e substituido por IA, dentro de _processar, pois cada uma ve so o seu.
    assert dossie_path is not None
    prompt_texto = prompt_v2_path.read_text(encoding="utf-8")
    dossie_texto = dossie_path.read_text(encoding="utf-8")
    resultados_texto = _tabela_resultados_md(resultados_path)

    prompt_texto = prompt_texto.replace("{{DOSSIE}}", dossie_texto)
    prompt_texto = prompt_texto.replace("{{RESULTADOS}}", resultados_texto)

    # -- palpites v1 por IA, para relembrar cada uma do que cravou na 1a leva --
    from .parser import carregar_palpites, take_errors

    palpites_v1_dir = root / "data" / "palpites_ias"
    palpites_v1 = carregar_palpites(palpites_v1_dir)
    take_errors()  # nao deixar erros de parse do v1 poluirem a coleta
    jogos_por_numero = {j.numero: j for j in jogos_todos}

    import importlib.util

    if importlib.util.find_spec("httpx") is None:
        print("erro: falta httpx. 'pip install -e .'", file=sys.stderr)
        return 1

    corte = agora.strftime("%Y-%m-%d")
    max_paralelo = getattr(a, "max_paralelo", 5)

    # Wrapper que grava em palpites_v2/ com header v2 correto
    async def _coletar_e_salvar() -> list[dict]:  # type: ignore[type-arg]
        import httpx  # type: ignore[import-not-found]

        from .coletor import _post_with_retry

        sem = asyncio.Semaphore(max_paralelo)
        resultados_coleta: list[dict] = []  # type: ignore[type-arg]

        async with httpx.AsyncClient() as client:

            async def _processar(item: dict) -> None:  # type: ignore[type-arg]
                slug = str(item["slug"])
                modelo = str(item["model"])
                async with sem:
                    try:
                        palpites_slug = palpites_v1.get(slug) or palpites_v1.get(slug.lower()) or []
                        tabela_v1 = _tabela_palpites_v1(palpites_slug, jogos_por_numero)
                        prompt_individual = prompt_texto.replace("{{PALPITES_V1}}", tabela_v1)
                        payload = {
                            "model": modelo,
                            "messages": [{"role": "user", "content": prompt_individual}],
                        }
                        data = await _post_with_retry(client, payload)
                        conteudo = str(data["choices"][0]["message"]["content"])
                        arq = _salvar_palpite_v2(palpites_v2_dir, slug, modelo, conteudo, corte)
                        resultados_coleta.append(
                            {"slug": slug, "ok": True, "erro": None, "arquivo": str(arq)}
                        )
                        print(f"  OK   {slug}  -> {arq.name}", flush=True)
                    except Exception as e:
                        resultados_coleta.append(
                            {"slug": slug, "ok": False, "erro": str(e), "arquivo": None}
                        )
                        print(f"  FAIL {slug}: {e}", file=sys.stderr, flush=True)

            await asyncio.gather(*(_processar(it) for it in ias))

        return resultados_coleta

    resultados_coleta = asyncio.run(_coletar_e_salvar())
    ok = sum(1 for r in resultados_coleta if r["ok"])
    print(f"coletar-v2: {ok}/{len(resultados_coleta)} sucesso")
    return 0 if ok == len(resultados_coleta) else 1


# ---------------------------------------------------------------------------
# comparar_v2_cmd
# ---------------------------------------------------------------------------


def comparar_v2_cmd(args: object, root: Path) -> int:
    """Implementa ``python -m bolao comparar-v2``.

    Le v1 de data/palpites_ias/, v2 de data/palpites_v2/, e resultados.
    Para cada jogo 41-72 ja encerrado, calcula pts_v1 e pts_v2.
    Grava data/analise_v2.json. Sem jogos encerrados ainda, gera JSON vazio
    sem erro.

    Nao toca em nada do fluxo v1 nem em saidas publicas.
    """
    palpites_v1_dir = root / "data" / "palpites_ias"
    palpites_v2_dir = root / "data" / "palpites_v2"
    resultados_path = root / "data" / "resultados" / "jogos.md"
    jogos_path = root / "data" / "jogos.md"
    saida_path = root / "data" / "analise_v2.json"

    from .parser import carregar_jogos, carregar_palpites, carregar_resultados, take_errors
    from .scoring import pontuar

    # -- carregar dados --
    jogos = carregar_jogos(jogos_path)
    take_errors()  # nao deixar erros de parse vazarem

    jogos_por_numero = {j.numero: j for j in jogos}

    resultados_lista = carregar_resultados(resultados_path)
    take_errors()
    resultados_por_jogo = {r.jogo_numero: r for r in resultados_lista}

    # Jogos 41-72 que ja encerraram (tem resultado registrado)
    jogos_v2_encerrados = [
        n for n in range(V2_JOGO_MIN, V2_JOGO_MAX + 1) if n in resultados_por_jogo
    ]

    if not jogos_v2_encerrados:
        print("comparar-v2: nenhum jogo 41-72 encerrado ainda. Gerando analise vazia.")
        payload: dict[str, object] = {
            "gerado_em": datetime.now(BRT).isoformat(timespec="seconds"),
            "jogos_considerados": [],
            "por_ia": {},
            "agregado": {
                "delta_medio": 0.0,
                "ias_que_melhoraram": 0,
                "ias_que_pioraram": 0,
            },
        }
        saida_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"comparar-v2: {saida_path}")
        return 0

    # -- carregar palpites v1 e v2 --
    # v1: sem lock por mtime (ja existem, so leitura)
    palpites_v1 = carregar_palpites(palpites_v1_dir)
    take_errors()

    # v2: leitura identica, mas de outro diretorio; sem lock por mtime
    palpites_v2 = carregar_palpites(palpites_v2_dir)
    take_errors()

    # Uniao: qualquer IA com palpite em v1 OU v2 entra. Quem so tem um lado
    # pontua 0 no lado faltante (comparacao justa, sem sumir com a IA).
    slugs_relevantes = set(palpites_v1.keys()) | set(palpites_v2.keys())

    por_ia: dict[str, dict] = {}  # type: ignore[type-arg]

    for slug in sorted(slugs_relevantes):
        v1_lista = {p.jogo_numero: p for p in palpites_v1.get(slug, [])}
        v2_lista = {p.jogo_numero: p for p in palpites_v2.get(slug, [])}

        # So considera jogos encerrados nos dois lados
        jogos_slug = [n for n in jogos_v2_encerrados if n in v1_lista or n in v2_lista]
        if not jogos_slug:
            continue

        pts_v1 = 0
        pts_v2 = 0
        exatos_v1 = 0
        exatos_v2 = 0

        for num in jogos_slug:
            resultado = resultados_por_jogo[num]
            jogo = jogos_por_numero.get(num)
            fase = jogo.fase if jogo else "Grupos"

            p1 = v1_lista.get(num)
            p2 = v2_lista.get(num)

            if p1 is not None:
                pt = pontuar(p1, resultado, fase)
                pts_v1 += pt
                if p1.gols_a == resultado.gols_a and p1.gols_b == resultado.gols_b:
                    exatos_v1 += 1

            if p2 is not None:
                pt = pontuar(p2, resultado, fase)
                pts_v2 += pt
                if p2.gols_a == resultado.gols_a and p2.gols_b == resultado.gols_b:
                    exatos_v2 += 1

        por_ia[slug] = {
            "pts_v1": pts_v1,
            "pts_v2": pts_v2,
            "delta": pts_v2 - pts_v1,
            "exatos_v1": exatos_v1,
            "exatos_v2": exatos_v2,
        }

    # -- calcular agregado --
    if por_ia:
        deltas = [v["delta"] for v in por_ia.values()]
        delta_medio = round(sum(deltas) / len(deltas), 2)
        melhoraram = sum(1 for d in deltas if d > 0)
        pioraram = sum(1 for d in deltas if d < 0)
    else:
        delta_medio = 0.0
        melhoraram = 0
        pioraram = 0

    payload = {
        "gerado_em": datetime.now(BRT).isoformat(timespec="seconds"),
        "jogos_considerados": sorted(jogos_v2_encerrados),
        "por_ia": por_ia,
        "agregado": {
            "delta_medio": delta_medio,
            "ias_que_melhoraram": melhoraram,
            "ias_que_pioraram": pioraram,
        },
    }

    saida_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(
        f"comparar-v2: {saida_path} "
        f"({len(por_ia)} IAs, {len(jogos_v2_encerrados)} jogos encerrados, "
        f"delta_medio={delta_medio})"
    )
    return 0
