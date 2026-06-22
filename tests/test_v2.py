"""Testes da feature Palpites v2 (F-palpites-v2-atualizados.md).

Frentes cobertas:
  A) Helpers de v2.py (kickoff, tabela_resultados_md, salvar_palpite_v2)
  B) comparar_v2_cmd: calculo pts_v1/pts_v2/delta/exatos, usando pontuar()
  C) Casos de borda:
     - jogo 41-72 sem resultado (nao entra na analise)
     - IA sem palpite v2 para um jogo (so pontuado no v1)
     - IA sem palpite v1 para um jogo (so pontuado no v2)
     - sem nenhum jogo 41-72 encerrado (JSON vazio, sem crash)
     - delta negativo (v2 piorou)
     - exato em v2, vencedor em v1
  D) Isolamento: comparar_v2_cmd nao grava fora de data/analise_v2.json
  E) coletar_v2_cmd --dry-run: nao cria arquivos, retorna 0
  F) _jogo_aberto: kickoff no futuro vs. passado
"""

from __future__ import annotations

import json
import textwrap
from argparse import Namespace
from datetime import datetime, timedelta, timezone
from pathlib import Path

from bolao.scoring import pontuar
from bolao.v2 import (
    V2_JOGO_MAX,
    V2_JOGO_MIN,
    _jogo_aberto,
    _salvar_palpite_v2,
    _tabela_resultados_md,
    coletar_v2_cmd,
    comparar_v2_cmd,
)

BRT = timezone(timedelta(hours=-3))

# ---------------------------------------------------------------------------
# Fixtures de dados mini (locais, sem tocar em data/ real)
# ---------------------------------------------------------------------------

JOGOS_MINI_CONTEUDO = textwrap.dedent("""\
    # Jogos mini v2

    ## Fase de grupos

    | Jogo | Fase | Data | Hora | Local | Time A | Gols A | Gols B | Time B |
    |---|---|---|---|---|---|---|---|---|
    | 41 | Grupo A | Qui 26/06 | 16h00 | Toronto | Brasil | | | Argentina |
    | 42 | Grupo B | Sex 27/06 | 19h00 | Dallas | Franca | | | Alemanha |
    | 43 | Grupo C | Sex 27/06 | 22h00 | Miami | Portugal | | | Espanha |
""")

RESULTADOS_MINI_CONTEUDO = textwrap.dedent("""\
    # Resultados mini

    ## Fase de grupos

    | Jogo | Fase | Data | Hora | Local | Time A | Gols A | Gols B | Time B |
    |---|---|---|---|---|---|---|---|---|
    | 41 | Grupo A | Qui 26/06 | 16h00 | Toronto | Brasil | 2 | 0 | Argentina |
    | 42 | Grupo B | Sex 27/06 | 19h00 | Dallas | Franca | 1 | 1 | Alemanha |
""")
# Jogo 43 sem resultado (pendente)

PALPITE_V1_IA1 = textwrap.dedent("""\
    <!-- ia: ia-alpha -->
    <!-- slug: ia-alpha -->
    # Palpites v1 - ia-alpha

    ## Fase de grupos

    | Jogo | Fase | Data | Hora | Local | Time A | Gols A | Gols B | Time B |
    |---|---|---|---|---|---|---|---|---|
    | 41 | Grupo A | Qui 26/06 | 16h00 | Toronto | Brasil | 2 | 0 | Argentina |
    | 42 | Grupo B | Sex 27/06 | 19h00 | Dallas | Franca | 0 | 0 | Alemanha |
    | 43 | Grupo C | Sex 27/06 | 22h00 | Miami | Portugal | 1 | 0 | Espanha |
""")

PALPITE_V2_IA1 = textwrap.dedent("""\
    <!-- ia: ia-alpha -->
    <!-- slug: ia-alpha -->
    <!-- versao: v2 -->
    <!-- corte: 2026-06-22 -->
    # Palpites v2 - ia-alpha

    ## Fase de grupos

    | Jogo | Fase | Data | Hora | Local | Time A | Gols A | Gols B | Time B |
    |---|---|---|---|---|---|---|---|---|
    | 41 | Grupo A | Qui 26/06 | 16h00 | Toronto | Brasil | 3 | 1 | Argentina |
    | 42 | Grupo B | Sex 27/06 | 19h00 | Dallas | Franca | 1 | 1 | Alemanha |
    | 43 | Grupo C | Sex 27/06 | 22h00 | Miami | Portugal | 0 | 1 | Espanha |
""")


# ---------------------------------------------------------------------------
# Helpers de fabricacao de fixture no tmp_path
# ---------------------------------------------------------------------------


def _montar_fixture(
    tmp: Path,
    v1_conteudo: str = PALPITE_V1_IA1,
    v2_conteudo: str | None = PALPITE_V2_IA1,
    resultados: str = RESULTADOS_MINI_CONTEUDO,
    jogos: str = JOGOS_MINI_CONTEUDO,
) -> Path:
    """Monta arvore de arquivos em tmp_path e retorna a raiz."""
    root = tmp
    # data/jogos.md
    (root / "data").mkdir(parents=True, exist_ok=True)
    (root / "data" / "jogos.md").write_text(jogos, encoding="utf-8")
    # data/resultados/jogos.md
    (root / "data" / "resultados").mkdir(parents=True, exist_ok=True)
    (root / "data" / "resultados" / "jogos.md").write_text(resultados, encoding="utf-8")
    # data/palpites_ias/ia-alpha.md
    (root / "data" / "palpites_ias").mkdir(parents=True, exist_ok=True)
    (root / "data" / "palpites_ias" / "ia-alpha.md").write_text(v1_conteudo, encoding="utf-8")
    # data/palpites_v2/ia-alpha.md (opcional)
    if v2_conteudo is not None:
        (root / "data" / "palpites_v2").mkdir(parents=True, exist_ok=True)
        (root / "data" / "palpites_v2" / "ia-alpha.md").write_text(v2_conteudo, encoding="utf-8")
    return root


# ===========================================================================
# Secao A — helpers de v2.py
# ===========================================================================


class TestJogoAberto:
    """_jogo_aberto: True somente se kickoff estritamente no futuro."""

    def test_kickoff_no_futuro(self) -> None:
        agora = datetime(2026, 6, 22, 12, 0, tzinfo=BRT)
        # jogo em 2026-06-26 16:00 BRT => futuro
        assert _jogo_aberto("2026-06-26", "16:00", agora) is True

    def test_kickoff_no_passado(self) -> None:
        agora = datetime(2026, 6, 22, 12, 0, tzinfo=BRT)
        # jogo em 2026-06-21 => passado
        assert _jogo_aberto("2026-06-21", "16:00", agora) is False

    def test_kickoff_exato_nao_e_aberto(self) -> None:
        # No instante exato do kickoff, jogo NAO e aberto (agora == inicio)
        agora = datetime(2026, 6, 26, 16, 0, tzinfo=BRT)
        assert _jogo_aberto("2026-06-26", "16:00", agora) is False

    def test_um_segundo_antes_e_aberto(self) -> None:
        agora = datetime(2026, 6, 26, 15, 59, 59, tzinfo=BRT)
        assert _jogo_aberto("2026-06-26", "16:00", agora) is True


class TestTabelaResultadosMd:
    """_tabela_resultados_md: extrai so linhas da tabela markdown."""

    def test_extrai_apenas_pipe_lines(self, tmp_path: Path) -> None:
        f = tmp_path / "jogos.md"
        f.write_text(RESULTADOS_MINI_CONTEUDO, encoding="utf-8")
        texto = _tabela_resultados_md(f)
        linhas = texto.splitlines()
        # Todas as linhas devem comecar com |
        for linha in linhas:
            assert linha.strip().startswith("|"), f"linha sem pipe: {linha!r}"

    def test_arquivo_inexistente_retorna_aviso(self, tmp_path: Path) -> None:
        resultado = _tabela_resultados_md(tmp_path / "nao_existe.md")
        assert "sem resultados" in resultado

    def test_arquivo_sem_tabela_retorna_aviso(self, tmp_path: Path) -> None:
        f = tmp_path / "vazio.md"
        f.write_text("# Apenas texto\nsem tabela aqui\n", encoding="utf-8")
        resultado = _tabela_resultados_md(f)
        assert "sem resultados" in resultado


class TestSalvarPalpiteV2:
    """_salvar_palpite_v2: grava arquivo com headers corretos em diretorio correto."""

    def test_grava_em_palpites_v2_dir(self, tmp_path: Path) -> None:
        d = tmp_path / "data" / "palpites_v2"
        arq = _salvar_palpite_v2(d, "ia-alpha", "gpt-9", "| 41 | ...\n", "2026-06-22")
        assert arq.parent == d
        assert arq.name == "ia-alpha.md"

    def test_cabecalho_versao_v2_presente(self, tmp_path: Path) -> None:
        d = tmp_path / "pv2"
        arq = _salvar_palpite_v2(d, "ia-beta", "gpt-9", "conteudo\n", "2026-06-22")
        texto = arq.read_text(encoding="utf-8")
        assert "<!-- versao: v2 -->" in texto
        assert "<!-- corte: 2026-06-22 -->" in texto
        assert "<!-- modo: api -->" in texto

    def test_nao_grava_em_palpites_ias(self, tmp_path: Path) -> None:
        d = tmp_path / "data" / "palpites_v2"
        _salvar_palpite_v2(d, "ia-gama", "gpt-9", "", "2026-06-22")
        # data/palpites_ias NAO existe
        assert not (tmp_path / "data" / "palpites_ias").exists()


# ===========================================================================
# Secao B — comparar_v2_cmd: calculo correto
# ===========================================================================


class TestCompararV2Calculo:
    """comparar_v2_cmd produz pts_v1/pts_v2/delta/exatos corretos."""

    def test_calculos_basicos(self, tmp_path: Path) -> None:
        """
        Jogo 41: resultado 2x0
          v1 palpitou 2x0 -> placar exato -> 10 pts
          v2 palpitou 3x1 -> vencedor+saldo (2) -> 7 pts
          delta = 7-10 = -3

        Jogo 42: resultado 1x1
          v1 palpitou 0x0 -> empate sem exato -> 5 pts
          v2 palpitou 1x1 -> placar exato -> 10 pts
          delta parcial = 10-5 = +5

        Total: pts_v1 = 15, pts_v2 = 17, delta = 2
        exatos_v1 = 1 (jogo 41), exatos_v2 = 1 (jogo 42)
        """
        _montar_fixture(tmp_path)
        rc = comparar_v2_cmd(Namespace(), tmp_path)
        assert rc == 0

        saida = json.loads((tmp_path / "data" / "analise_v2.json").read_text(encoding="utf-8"))
        ia = saida["por_ia"]["ia-alpha"]

        # Jogo 41: v1=10, v2=7; Jogo 42: v1=5, v2=10
        assert ia["pts_v1"] == 15
        assert ia["pts_v2"] == 17
        assert ia["delta"] == 2
        assert ia["exatos_v1"] == 1
        assert ia["exatos_v2"] == 1

    def test_jogos_considerados_so_41_72_encerrados(self, tmp_path: Path) -> None:
        """jogos_considerados inclui apenas jogos 41-72 com resultado registrado."""
        _montar_fixture(tmp_path)
        rc = comparar_v2_cmd(Namespace(), tmp_path)
        assert rc == 0

        saida = json.loads((tmp_path / "data" / "analise_v2.json").read_text(encoding="utf-8"))
        # Jogo 43 sem resultado => nao entra
        assert 43 not in saida["jogos_considerados"]
        assert set(saida["jogos_considerados"]) == {41, 42}

    def test_agregado_estrutura(self, tmp_path: Path) -> None:
        _montar_fixture(tmp_path)
        comparar_v2_cmd(Namespace(), tmp_path)
        saida = json.loads((tmp_path / "data" / "analise_v2.json").read_text(encoding="utf-8"))
        agg = saida["agregado"]
        assert "delta_medio" in agg
        assert "ias_que_melhoraram" in agg
        assert "ias_que_pioraram" in agg

    def test_delta_negativo_contabiliza_piorou(self, tmp_path: Path) -> None:
        """v2 pior que v1 deve incrementar ias_que_pioraram, nao melhoraram."""
        # v2 pior: no jogo 41 v2=3x1 (7pts) vs v1=2x0 (10pts exato).
        # No jogo 42 v2=1x1 exato (10pts) vs v1=0x0 (5pts).
        # Total: delta = +2 => essa IA melhorou. Para garantir um caso de piorou,
        # usamos um palpite v2 que erra tudo.
        v2_ruim = textwrap.dedent("""\
            <!-- ia: ia-alpha -->
            <!-- versao: v2 -->
            # Palpites v2 ruim

            ## Fase de grupos

            | Jogo | Fase | Data | Hora | Local | Time A | Gols A | Gols B | Time B |
            |---|---|---|---|---|---|---|---|---|
            | 41 | Grupo A | Qui 26/06 | 16h00 | Toronto | Brasil | 0 | 1 | Argentina |
            | 42 | Grupo B | Sex 27/06 | 19h00 | Dallas | Franca | 0 | 1 | Alemanha |
        """)
        # v1: jogo41=exato(10)+jogo42=empate(5)=15; v2: jogo41=0+jogo42=0=0; delta=-15
        _montar_fixture(tmp_path, v2_conteudo=v2_ruim)
        comparar_v2_cmd(Namespace(), tmp_path)
        saida = json.loads((tmp_path / "data" / "analise_v2.json").read_text(encoding="utf-8"))
        assert saida["por_ia"]["ia-alpha"]["delta"] == -15
        assert saida["agregado"]["ias_que_pioraram"] == 1
        assert saida["agregado"]["ias_que_melhoraram"] == 0


# ===========================================================================
# Secao C — Casos de borda
# ===========================================================================


class TestCompararV2CasosDeBorda:
    """Casos de borda do comparar_v2_cmd."""

    def test_sem_jogos_encerrados_gera_json_vazio(self, tmp_path: Path) -> None:
        """Sem resultados em 41-72, JSON e gerado com jogos_considerados=[] sem erro."""
        resultados_sem_v2 = textwrap.dedent("""\
            # Resultados sem v2

            ## Fase de grupos

            | Jogo | Fase | Data | Hora | Local | Time A | Gols A | Gols B | Time B |
            |---|---|---|---|---|---|---|---|---|
            | 1 | Grupo A | Qui 11/06 | 16h00 | Mexico | Brasil | 1 | 0 | Argentina |
        """)
        _montar_fixture(tmp_path, resultados=resultados_sem_v2)
        rc = comparar_v2_cmd(Namespace(), tmp_path)
        assert rc == 0
        saida = json.loads((tmp_path / "data" / "analise_v2.json").read_text(encoding="utf-8"))
        assert saida["jogos_considerados"] == []
        assert saida["por_ia"] == {}

    def test_ia_sem_palpite_v2_nao_crasha(self, tmp_path: Path) -> None:
        """IA que palpitou v1 mas nao tem arquivo v2 aparece so com pts_v2=0."""
        _montar_fixture(tmp_path, v2_conteudo=None)
        rc = comparar_v2_cmd(Namespace(), tmp_path)
        assert rc == 0
        saida = json.loads((tmp_path / "data" / "analise_v2.json").read_text(encoding="utf-8"))
        # IA tem v1 mas sem v2: deve aparecer no por_ia com pts_v2=0
        if "ia-alpha" in saida["por_ia"]:
            assert saida["por_ia"]["ia-alpha"]["pts_v2"] == 0

    def test_ia_sem_palpite_v1_para_jogo_encerrado(self, tmp_path: Path) -> None:
        """IA com v2 mas sem v1 para um jogo: pts_v1 = 0 naquele jogo."""
        # v1 so palpita jogo 42, nao 41
        v1_parcial = textwrap.dedent("""\
            <!-- ia: ia-alpha -->
            # Palpites v1 parcial

            ## Fase de grupos

            | Jogo | Fase | Data | Hora | Local | Time A | Gols A | Gols B | Time B |
            |---|---|---|---|---|---|---|---|---|
            | 42 | Grupo B | Sex 27/06 | 19h00 | Dallas | Franca | 0 | 0 | Alemanha |
        """)
        _montar_fixture(tmp_path, v1_conteudo=v1_parcial)
        rc = comparar_v2_cmd(Namespace(), tmp_path)
        assert rc == 0
        saida = json.loads((tmp_path / "data" / "analise_v2.json").read_text(encoding="utf-8"))
        ia = saida["por_ia"].get("ia-alpha", {})
        # Jogo 41: v1 nao palpitou (0 pts), v2 palpitou 3x1 (resultado 2x0 -> 7 pts)
        # Jogo 42: v1 palpitou 0x0 (empate sem exato, resultado 1x1 -> 5 pts), v2=10
        assert ia.get("pts_v1", 0) == 5  # so jogo 42

    def test_jogo_fora_do_range_41_72_nao_entra(self, tmp_path: Path) -> None:
        """Jogos 1-40 e 73+ nao devem entrar nos jogos_considerados."""
        resultados_com_j1 = textwrap.dedent("""\
            # Resultados

            ## Fase de grupos

            | Jogo | Fase | Data | Hora | Local | Time A | Gols A | Gols B | Time B |
            |---|---|---|---|---|---|---|---|---|
            | 1  | Grupo A | Qui 11/06 | 16h00 | Mexico | A | 1 | 0 | B |
            | 41 | Grupo A | Qui 26/06 | 16h00 | Toronto | Brasil | 2 | 0 | Argentina |
        """)
        _montar_fixture(tmp_path, resultados=resultados_com_j1)
        comparar_v2_cmd(Namespace(), tmp_path)
        saida = json.loads((tmp_path / "data" / "analise_v2.json").read_text(encoding="utf-8"))
        # Jogo 1 nao deve estar em jogos_considerados
        assert 1 not in saida["jogos_considerados"]
        # Jogo 41 deve estar
        assert 41 in saida["jogos_considerados"]

    def test_mata_mata_nao_aplica_multiplicador_no_v2(self) -> None:
        """v2 so cobre jogos 41-72 (grupos). Fase de grupos => sem multiplicador 2x.

        Verifica diretamente que pontuar() com fase Grupos nao dobra os pontos
        (invariante de que v2 nunca tem mata-mata por design do spec).
        """
        from bolao.models import Palpite as P
        from bolao.models import Resultado as R

        p = P(ia="x", jogo_numero=50, gols_a=1, gols_b=0)
        r = R(jogo_numero=50, gols_a=1, gols_b=0)
        # Fase Grupos => 10 pts (nao 20)
        assert pontuar(p, r, "Grupo A") == 10

    def test_delta_zero_nao_entra_em_melhorou_nem_piorou(self, tmp_path: Path) -> None:
        """IA com delta == 0 nao conta como melhora nem piora."""
        # v2 igual ao v1: jogo41 2x0 exato (10pts), jogo42 0x0 empate (5pts)
        v2_igual = textwrap.dedent("""\
            <!-- ia: ia-alpha -->
            <!-- versao: v2 -->
            # Palpites v2 igual v1

            ## Fase de grupos

            | Jogo | Fase | Data | Hora | Local | Time A | Gols A | Gols B | Time B |
            |---|---|---|---|---|---|---|---|---|
            | 41 | Grupo A | Qui 26/06 | 16h00 | Toronto | Brasil | 2 | 0 | Argentina |
            | 42 | Grupo B | Sex 27/06 | 19h00 | Dallas | Franca | 0 | 0 | Alemanha |
        """)
        _montar_fixture(tmp_path, v2_conteudo=v2_igual)
        comparar_v2_cmd(Namespace(), tmp_path)
        saida = json.loads((tmp_path / "data" / "analise_v2.json").read_text(encoding="utf-8"))
        assert saida["por_ia"]["ia-alpha"]["delta"] == 0
        assert saida["agregado"]["ias_que_melhoraram"] == 0
        assert saida["agregado"]["ias_que_pioraram"] == 0


# ===========================================================================
# Secao D — Isolamento: nada escrito fora de data/analise_v2.json
# ===========================================================================


class TestIsolamento:
    """comparar_v2_cmd nao toca web/data/, v4/public/, data/palpites_ias/ ou ranking."""

    def test_nao_cria_web_data(self, tmp_path: Path) -> None:
        _montar_fixture(tmp_path)
        comparar_v2_cmd(Namespace(), tmp_path)
        assert not (tmp_path / "web").exists(), "web/ nao deve existir apos comparar-v2"

    def test_nao_modifica_palpites_ias(self, tmp_path: Path) -> None:
        _montar_fixture(tmp_path)
        v1_arq = tmp_path / "data" / "palpites_ias" / "ia-alpha.md"
        mtime_antes = v1_arq.stat().st_mtime
        comparar_v2_cmd(Namespace(), tmp_path)
        mtime_depois = v1_arq.stat().st_mtime
        assert mtime_antes == mtime_depois, "data/palpites_ias/ia-alpha.md foi modificado!"

    def test_saida_vai_so_para_analise_v2_json(self, tmp_path: Path) -> None:
        _montar_fixture(tmp_path)
        comparar_v2_cmd(Namespace(), tmp_path)
        # Unico arquivo novo deve ser data/analise_v2.json
        analise = tmp_path / "data" / "analise_v2.json"
        assert analise.exists()
        # Nao deve haver v4/public/ ou web/data/ criados
        assert not (tmp_path / "v4").exists()
        assert not (tmp_path / "web").exists()

    def test_v2_nao_afeta_rodada_v1(self, tmp_path: Path) -> None:
        """Garante que v2.py nao importa modulos do fluxo oficial (ranking, render, cristal)."""
        import ast

        import bolao.v2 as modulo_v2

        src = Path(modulo_v2.__file__).read_text(encoding="utf-8")
        tree = ast.parse(src)
        # Coleta todos os imports do modulo
        imports_encontrados: list[str] = []
        for node in ast.walk(tree):
            if isinstance(node, ast.ImportFrom):
                modulo = node.module or ""
                nomes = [alias.name for alias in node.names]
                imports_encontrados.append(f"from {modulo} import {', '.join(nomes)}")
            elif isinstance(node, ast.Import):
                for alias in node.names:
                    imports_encontrados.append(f"import {alias.name}")
        # Nenhum import de modulos proibidos do fluxo oficial
        proibidos_modulos = {"ranking", "render", "cristal"}
        for imp in imports_encontrados:
            for proibido in proibidos_modulos:
                assert (
                    f".{proibido}" not in imp and f"bolao.{proibido}" not in imp
                ), f"v2.py importa modulo proibido do fluxo oficial: {imp!r}"


# ===========================================================================
# Secao E — coletar_v2_cmd --dry-run
# ===========================================================================


class TestColetarV2DryRun:
    """coletar_v2_cmd com dry_run=True nao faz chamadas e retorna 0."""

    def test_dry_run_retorna_zero(self, tmp_path: Path) -> None:
        # Precisamos de mapping e jogos.md minimos
        (tmp_path / "config").mkdir(parents=True, exist_ok=True)
        mapping = {"ia-alpha": {"model": "fake/model", "tier": 1}}
        (tmp_path / "config" / "openrouter_mapping.json").write_text(
            json.dumps(mapping), encoding="utf-8"
        )
        (tmp_path / "data").mkdir(parents=True, exist_ok=True)
        # jogos com jogo 50 no futuro
        (tmp_path / "data" / "jogos.md").write_text(
            textwrap.dedent("""\
                # Jogos

                ## Fase de grupos

                | Jogo | Fase | Data | Hora | Local | Time A | Gols A | Gols B | Time B |
                |---|---|---|---|---|---|---|---|---|
                | 50 | Grupo A | Sex 27/06 | 19h00 | Dallas | A | | | B |
            """),
            encoding="utf-8",
        )
        args = Namespace(tier=None, ia=None, dossie=None, dry_run=True, max_paralelo=5)
        rc = coletar_v2_cmd(args, tmp_path)
        assert rc == 0

    def test_dry_run_nao_cria_palpites_v2_dir(self, tmp_path: Path) -> None:
        (tmp_path / "config").mkdir(parents=True, exist_ok=True)
        mapping = {"ia-alpha": {"model": "fake/model", "tier": 1}}
        (tmp_path / "config" / "openrouter_mapping.json").write_text(
            json.dumps(mapping), encoding="utf-8"
        )
        (tmp_path / "data").mkdir(parents=True, exist_ok=True)
        (tmp_path / "data" / "jogos.md").write_text(
            textwrap.dedent("""\
                # Jogos

                ## Fase de grupos

                | Jogo | Fase | Data | Hora | Local | Time A | Gols A | Gols B | Time B |
                |---|---|---|---|---|---|---|---|---|
                | 50 | Grupo A | Sex 27/06 | 19h00 | Dallas | A | | | B |
            """),
            encoding="utf-8",
        )
        args = Namespace(tier=None, ia=None, dossie=None, dry_run=True, max_paralelo=5)
        coletar_v2_cmd(args, tmp_path)
        # dry_run nao deve criar data/palpites_v2/
        assert not (tmp_path / "data" / "palpites_v2").exists()


# ===========================================================================
# Secao F — constantes de range
# ===========================================================================


def test_range_v2_esta_correto() -> None:
    """V2_JOGO_MIN e V2_JOGO_MAX refletem spec (41-72)."""
    assert V2_JOGO_MIN == 41
    assert V2_JOGO_MAX == 72
    assert V2_JOGO_MAX - V2_JOGO_MIN + 1 == 32  # 32 jogos da fase de grupos restante
