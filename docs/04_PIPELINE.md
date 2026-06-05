# 04 — Pipeline / Fluxo de execução

## Fluxo principal

```
   ┌────────────────────────────────────────────────────────────┐
   │ 1. Giordano coloca .md no data/palpites_ias/<slug>.md      │
   │    (uma vez por IA, antes do primeiro jogo da Copa)        │
   └────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
   ┌────────────────────────────────────────────────────────────┐
   │ 2. python -m bolao parse                                   │
   │    valida formato, gera data/cache/palpites.json           │
   │    reporta IAs faltando jogos ou com palpites inválidos    │
   └────────────────────────────┬───────────────────────────────┘
                                │
                                ▼ (após cada rodada)
   ┌────────────────────────────────────────────────────────────┐
   │ 3. Giordano edita data/resultados/jogos.md preenchendo     │
   │    Gols A/Gols B dos jogos novos                           │
   └────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
   ┌────────────────────────────────────────────────────────────┐
   │ 4. python -m bolao score                                   │
   │    calcula pontos por palpite, gera reports/<data>/        │
   │    pontuacao.json + diff vs rodada anterior                │
   └────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
   ┌────────────────────────────────────────────────────────────┐
   │ 5. python -m bolao ranking                                 │
   │    regenera web/index.html + web/data/ranking.json         │
   └────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
   ┌────────────────────────────────────────────────────────────┐
   │ 6. python -m bolao resumo > resumo.txt                     │
   │    gera texto pronto pra WhatsApp                          │
   └────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
   ┌────────────────────────────────────────────────────────────┐
   │ 7. Giordano copia resumo, posta no "Claude - Geral"        │
   │    e (opcional) git push pra atualizar GitHub Pages        │
   └────────────────────────────────────────────────────────────┘
```

Comando único de rodada completa: `python -m bolao rodada` (executa 2→6 em sequência).

## Estágios

1. **parse** — lê `data/jogos.md`, `data/palpites_ias/*.md`, `data/resultados/jogos.md`. Valida tipos, ranges, formato de tabela. Erros → stderr com `arquivo:linha`. Output: `data/cache/*.json`.
2. **score** — para cada (IA, jogo, palpite, resultado) com resultado disponível, calcula pontos via `src/scoring.py`. Saída: `reports/<YYYY-MM-DD>/pontuacao.json`.
3. **ranking** — agrega pontuação por IA, ordena, aplica desempates. Renderiza `web/index.html` via Jinja2. Salva `web/data/ranking.json` para consumo externo.
4. **resumo** — escreve texto curto: líderes da rodada, viradas, melhores e piores palpites do dia, consensos errados (todas IAs erraram). Formato pronto pra WhatsApp.
5. **serve** — `python -m http.server` em `web/` na porta 8000. Útil pra preview local.

## Tratamento de erro

- **Parser**: erro de formato é fatal pra aquele arquivo. Outros arquivos continuam. Saída: lista consolidada de problemas no fim.
- **Scoring**: jogo sem resultado é pulado silenciosamente. Palpite sem valor é pulado silenciosamente (0 pontos). Inconsistências (resultado existe mas jogo não existe na tabela) → assert error, programa para.
- **Ranking**: sempre executável, mesmo com 0 palpites e 0 resultados (gera ranking vazio).
- **Resumo**: se nenhum jogo novo apurado desde a última rodada, imprime "sem novidades" e exita 0.
- **Retry**: nenhum (sem rede no caminho crítico). MCPs de futebol terão retry isolado quando integrados.
