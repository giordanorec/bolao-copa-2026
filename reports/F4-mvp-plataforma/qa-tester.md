# F4 — qa-tester

**Status**: ✅ entregue, 54 testes verdes.
**Branch**: `main` (commits `[F4-qa]`).
**Autor**: qa-tester (sessão atual). Este report substitui a versão de
consolidação que o Arquiteto escreveu manualmente durante o crash anterior
do `_stream_pretty.py` — os nomes de teste e métricas aqui são os reais.

## Entregáveis

| Arquivo | Conteúdo |
|---|---|
| `tests/conftest.py` | Adiciona `tests/` ao `sys.path` pra que `_paths` seja importável de qualquer test_*.py. |
| `tests/_paths.py` | Constantes de caminho de fixtures + helper `id_da_ia()` (aceita `slug` ou `ia` no dict de ranking até o arquiteto uniformizar). |
| `tests/test_scoring.py` | **12 casos canônicos** (1 por caso de borda) + parametrize de `fase_eh_mata_mata` (8 fases) + 3 testes de invariantes auxiliares. |
| `tests/test_parser.py` | Parse de jogos/palpites/resultados, rejeição de `gols_a="um"`, range 0..15 (4 valores parametrize), negativo em B, **lock por mtime (I4) com `monkeypatch.setattr(os.path, "getmtime", ...)`**, invariante I1. |
| `tests/test_ranking.py` | Agregação por slug, multiplicador 2x na agregação, `jogos_palpitados` conta só apurados, 4 testes de desempate cobrindo I3. |
| `tests/test_e2e.py` | Pipeline completo (parse → score → ranking), ordenação correta, estado vazio sem crash, schema JSON serializável. |
| `tests/fixtures/jogos_mini.md` | 5 jogos (3 grupos + 1 oitavas + 1 final). |
| `tests/fixtures/palpites/chatgpt-mini.md` | Palpita os 5 jogos. |
| `tests/fixtures/palpites/gemini-mini.md` | Palpita 3, deixa 89 e 104 em branco (exercita "IA pulou jogo"). |
| `tests/fixtures/resultados_mini.md` | 3 dos 5 jogos apurados (exercita "resultado pendente"). |

## Validação

```
$ pytest -q
54 passed in 0.55s

$ pytest --cov=bolao --cov-report=term
src/bolao/__init__.py    1 stmts    100%
src/bolao/models.py     22 stmts    100%
src/bolao/scoring.py    28 stmts    100%   ← target 80% ✅
src/bolao/ranking.py    59 stmts     91%   ← target 80% ✅
src/bolao/parser.py    156 stmts     78%   (faltam apenas paths de erro em stderr)

$ ruff check tests/
All checks passed!
```

Target da F4 (80% em scoring + ranking) **batido com folga**.

## Mapeamento 12 casos → testes

| # | Regra `docs/02_REGRAS_DE_NEGOCIO.md` | Teste |
|---:|---|---|
| 1 | Empate palpitado, placar errado → 5 | `test_caso_01_empate_palpitado_placar_errado` |
| 2 | Empate palpitado, deu vitória → 0 | `test_caso_02_empate_palpitado_deu_vitoria` |
| 3 | Vitória + saldo certo → 7 | `test_caso_03_vitoria_com_saldo_certo` |
| 4 | Vitória, placar exato → 10 | `test_caso_04_vitoria_placar_exato` |
| 5 | Vitória, deu o oposto → 0 | `test_caso_05_vitoria_palpitada_deu_derrota` |
| 6 | Vitória, deu empate → 0 | `test_caso_06_vitoria_palpitada_deu_empate` |
| 7 | Mata-mata + placar exato → 20 | `test_caso_07_mata_mata_placar_exato` |
| 8 | Mata-mata + empate s/ placar exato → 10 | `test_caso_08_mata_mata_empate_sem_placar_exato` |
| 9 | IA pulou o jogo → não conta | `test_caso_09_jogo_sem_palpite` |
| 10 | Resultado pendente → não contribui | `test_caso_10_resultado_pendente` |
| 11 | Palpite fora do range → rejeitado | `test_caso_11_palpite_fora_do_range` |
| 12 | Edição depois do jogo → rejeitado | `test_caso_12_edicao_depois_do_jogo` |

**Casos 1-8** batem em `pontuar()` direto. **Casos 9-12** batem em
`pontos_por_ia()` porque "sem palpite" / "resultado pendente" / "palpite
rejeitado pelo parser" só fazem sentido na visão de conjunto — o palpite
inválido nunca chega ao scoring.

## Cobertura das invariantes I1-I6

| Inv | Como é testado |
|---|---|
| **I1** — 104 jogos únicos 1..104 | `test_invariante_I1_data_oficial_tem_104_jogos_unicos` (lê `data/jogos.md` real) |
| **I2** — pontuar determinístico | `test_invariante_I2_pontuar_eh_deterministico` (50 chamadas, mesmo output) |
| **I3** — ordenação estável | 4 testes em `test_ranking.py`: `test_ranking_ordenado_por_pontos_desc`, `test_ranking_desempata_por_placares_exatos`, `test_ranking_desempata_por_vencedores_acertados`, `test_ranking_desempate_final_por_slug_alfabetico` |
| **I4** — lock por mtime | `test_lock_por_mtime_rejeita_palpite_editado_apos_inicio` (monkeypatcha `os.path.getmtime` pra forçar timestamp pós-jogo) |
| **I5** — jogo pendente não contribui | `test_caso_10_resultado_pendente` |
| **I6** — histórico append-only | ⚠️ **não testado** — feature ainda não tem código próprio. Fica pra F5+. |

## Pontuação esperada nas fixtures (E2E)

Verificada em `test_pipeline_completo_pontuacao_correta`:

| IA | Pts | Exatos | Detalhe |
|---|---:|---:|---|
| `chatgpt-mini` | **25** | 2 | j1: 10 (exato), j2: 5 (empate s/ placar), j3: 10 (exato), j89/j104: pendentes |
| `gemini-mini`  | **17** | 1 | j1: 0 (errou), j2: 10 (exato), j3: 7 (vencedor + saldo 2), j89/j104: sem palpite |

## Achados (não-bloqueantes)

### 1. Assinatura real diverge de `docs/01_ARQUITETURA.md`

`01_ARQUITETURA.md` declara:
```python
def ranking_geral(palpites: list[Palpite], ...) -> list[dict]:
```

Pipeline-dev implementou (e faz mais sentido):
```python
def ranking_geral(palpites: dict[str, list[Palpite]], ...) -> list[RankingRow]:
def pontos_por_ia(palpites: dict[str, list[Palpite]], ...) -> dict[str, IAStats]:
```

O dict casa direto com o output de `carregar_palpites()`. Alinhei os testes
com a impl real. **Recomendo arquiteto atualizar `docs/01_ARQUITETURA.md`**.

### 2. Chave `slug` vs `ia` no dict de ranking

- `01_ARQUITETURA.md` exemplo: `[{'ia': ..., ...}]`
- `F4-mvp-plataforma.md` schema: `[{"slug": ..., ...}]`
- Impl: `slug`.

Helper `_paths.id_da_ia()` aceita as duas até decisão. **Recomendo adotar
`slug`** (canônico em kebab-case, alinha com schema de `web/data/ranking.json`).

### 3. Pacote `bolao` sem marker `py.typed`

`mypy --strict tests/` reclama de `missing library stubs or py.typed marker`
em todos os imports de `bolao.*`. **Não é problema dos testes** — é o pacote
sob `src/bolao/` que precisa de `src/bolao/py.typed` (arquivo vazio) ou ajuste
no `pyproject.toml`. **Item pro devops-installer**.

### 4. Convenção de `jogos_palpitados` validada

Conta apenas palpites com resultado correspondente (`test_jogos_palpitados_so_conta_jogos_apurados`).
Combina com caso 9. Boa decisão do pipeline-dev.

## Decisões de design

1. **Sem mocks** — testes são funções puras sobre dataclasses ou leitura de
   fixtures reais. Suíte roda em 0.5s.
2. **Helpers minimais** (`_jogo`, `_p`, `_r`) em cada test file. Não consolidei
   em conftest porque pytest trata conftest como especial — `_paths.py` resolve
   a parte de constantes; o resto fica local pra clareza.
3. **`xfail` evitado** — todas as limitações conhecidas viraram comentário ou
   pendência neste report.
4. **Casos 9-12 em `pontos_por_ia()`**, não em `pontuar()` — testar o caminho
   real do pipeline (que inclui filtros) é mais útil que pular pra função base.

## Recomendação

**Aprovar.** Suíte verde, cobertura acima do target, 12 casos canônicos
nomeados conforme o spec, invariantes cobertas (exceto I6 que depende de
código futuro).

Pendências pra outros agentes:
- **arquiteto**: atualizar `docs/01_ARQUITETURA.md` (dict ao invés de list, +
  decidir `slug` vs `ia`).
- **devops-installer**: adicionar `src/bolao/py.typed` ou ajustar pyproject
  pra mypy strict não reclamar do pacote `bolao`.
