# pipeline-dev — F4 MVP da Plataforma

**Status**: idle, entregue.
**Data**: 2026-06-05
**Commits**: `[F4-pipeline-dev]` em `main`.

## O que foi implementado

| Arquivo | Função(ões) exportada(s) | Commit |
|---|---|---|
| `src/bolao/models.py` | `Jogo`, `Palpite`, `Resultado` (dataclasses frozen) | `9d2b135` |
| `src/bolao/parser.py` | `carregar_jogos`, `carregar_palpites`, `carregar_resultados`, `take_errors` | `fce35b0` |
| `src/bolao/scoring.py` | `pontuar`, `fase_eh_mata_mata` | `5621943` |
| `src/bolao/ranking.py` | `pontos_por_ia`, `ranking_geral` (+ `IAStats`, `RankingRow` TypedDicts) | `1bff447`¹ |
| `src/bolao/__main__.py` | CLI: `parse`, `score`, `ranking`, `resumo`, `rodada`, `serve` | `5cb91d9` |

¹ *Nota de atribuição*: corrida concorrente entre agentes paralelos fez com
que `src/bolao/ranking.py` acabasse fisicamente no commit `34a4a9c` do
frontend-dev (que rodou `git add` enquanto meu arquivo estava unstaged) e
meu commit subsequente `1bff447` registrasse, com minha mensagem, os
artefatos que estavam no staging do devops. **Conteúdo correto, atribuição
torta.** Detalhes em ## Pendências.

## Dependências adicionadas

Nenhuma. Implementação 100% stdlib (`argparse`, `dataclasses`, `re`, `datetime`,
`pathlib`, `json`, `http.server`, `socketserver`, `contextlib`). Sem precisar
de `python-dateutil` (data/hora bate em regex simples).

## Decisões de design não-óbvias

1. **Range de gols `[0, 15]`** em `_parse_gols`. O case 11 de regras de
   negócio cita `-1` e `99` como inválidos; cravei 15 como teto razoável
   (maior placar histórico em Copa é 10x1 de Hungria 1982). Decisão
   defensável e fácil de mexer.
2. **Lock I4 é per-palpite, não per-arquivo**. Se a IA edita o `.md` 30min
   antes do jogo #1, só o palpite do jogo #1 é rejeitado — palpites para
   jogos #80+ continuam válidos (porque o cutoff deles ainda está no
   futuro). Caso o Arquiteto prefira lock por arquivo inteiro (mais
   conservador), trocar o `continue` em `carregar_palpites` por `break`.
3. **`carregar_palpites(dir_path, jogos=None)`** — `jogos` é opcional pra
   manter o contrato de assinatura simples documentado em
   `docs/01_ARQUITETURA.md` e pra que `qa-tester` consiga testar parsing
   puro sem ter que instanciar 104 `Jogo`. Sem `jogos`, o lock I4 é
   pulado.
4. **`take_errors()`** acumula contador global de erros de parse. Solução
   ao pedido "exit code != 0 se erros" sem mudar a assinatura dos parsers
   (que devolvem `list[Jogo]` etc., não `tuple[list, errors]`). Side-effect
   é assumido — não é função pura, e é o único bit de estado mutável do
   módulo.
5. **`ranking.py` aceita `dict[str, list[Palpite]]` OU `Iterable[Palpite]`**
   — o contrato em `docs/01_ARQUITETURA.md` define `list[Palpite]` (linha
   flat); o pipeline interno usa `dict` (mais eficiente). O helper
   `_normalizar` foi adicionado por qa-tester (ver nota no diff de
   ranking.py) para casar com os testes que seguem o contrato. Mantido.
6. **`resumo.txt` simples**: o `04_PIPELINE.md` menciona "diff vs rodada
   anterior, viradas, consensos errados" — fora do escopo MVP, deixei só
   ranking parcial. Pendência registrada abaixo.
7. **`fase_eh_mata_mata` aceita `"Semifinal"` E `"Semifinais"`** — defesa
   contra typos em `data/jogos.md`. Hoje o arquivo usa `"Semifinal"`
   (singular).

## Smoke test feito

```bash
PYTHONPATH=src python -m bolao rodada
# parse: 104 jogos, 0 IAs, 0 palpites válidos, 0 resultados, 0 erro(s)
# score: reports/2026-06-05/pontuacao.json (0 IAs apuradas)
# ranking: web/data/ranking.json (0 IAs)
# resumo: resumo.txt
```

Em estado vazio: rodada completa em **<1s**, exit 0, ranking JSON com schema
correto (`{atualizado_em, ias: [], jogos_apurados: 0, jogos_totais: 104}`).

Fixture-test com 1 IA, 4 palpites (1 exato, 1 empate-sem-placar-exato, 1 com
gol `-1` rejeitado, 1 vazio) e 2 resultados:
- Pontos: 15 (10 placar exato + 5 empate-empate). ✓
- placares_exatos: 1, vencedores_acertados: 2, jogos_palpitados: 2. ✓

Lock I4 testado setando `mtime` para depois do cutoff do jogo #1: parser
rejeita só o palpite do jogo #1 com mensagem `arquivo:linha: motivo` em
stderr, mantém o do jogo #2 (cutoff ainda futuro). Exit code 1 em `parse`.

Suite do qa-tester: **54 testes, todos passando**, cobertura `scoring.py`
100%, `ranking.py` 91% (target ≥80% ✓).

## Pendências / dúvidas pro Arquiteto

1. **Race condition entre commits paralelos**. Confirmação: `[F4-pipeline-dev]
   1bff447` carrega conteúdo de devops com minha mensagem; meu `ranking.py`
   foi commitado por frontend-dev em `34a4a9c`. Causa: pre-commit faz
   `git stash --include-untracked` e em paralelo outros agentes fizeram
   `git add` que arrastou meus arquivos não-staged. Não rebasei pra não
   travar o time. **Decisão sua**: aceito como está, ou abro PR de
   "história limpa" pós-F4?
2. **Resumo MVP é mínimo**. `docs/04_PIPELINE.md` pede "diff vs rodada
   anterior, viradas, consensos errados, melhores palpites do dia". Não
   entregue — pendente pra F5 (pós-MVP). Hoje cobre só ranking parcial +
   contagem de jogos apurados. OK pra abrir a Copa?
3. **`__main__.py` sem testes**. qa-tester focou em scoring/parser/ranking
   (correto, é onde mora a lógica). Subcomandos só smoke-tested manualmente.
   Cobertura `__main__` é 0% — aceitável pra MVP?
4. **`serve` faz `os.chdir(WEB_DIR)`** e não restaura. Se alguém chamar
   `bolao serve` no meio de um script, o CWD muda definitivamente.
   Aceitável porque `serve` é fire-and-forget até Ctrl-C, mas vale uma
   nota se virar problema.
5. **Não há comando `migrate`** (docs/03_SCHEMA fala dele pra futuras
   mudanças de formato). Fora do escopo MVP — adicionar quando precisar.
