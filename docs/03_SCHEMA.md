# 03 — Schema

## Modelo de dados

Sem banco. Tudo em arquivos. Quatro entidades:

### Jogo (canônico, imutável após Fase 3)

Fonte: `data/jogos.md` — tabela Markdown com 104 linhas.

| Campo | Tipo | Descrição | Notas |
|---|---|---|---|
| numero | int | 1-104, numeração FIFA | Único |
| fase | str | "Grupo A" .. "Grupo L", "R32", "Oitavas", "Quartas", "Semifinal", "3º lugar", "Final" | Determina multiplicador |
| data | str (ISO) | YYYY-MM-DD | Timezone implícita: BRT |
| hora | str | HH:MM | BRT |
| local | str | Cidade-sede | Informativo |
| time_a | str | Nome do time A | Para mata-mata aceita placeholder "1º Grupo A" etc |
| time_b | str | Nome do time B | Idem |

### Palpite

Fonte: `data/palpites_ias/<slug>.md` — tabela igual ao Jogo + colunas `Gols A`/`Gols B`.

| Campo | Tipo | Descrição | Notas |
|---|---|---|---|
| ia | str (slug) | Derivado do nome do arquivo | kebab-case |
| jogo_numero | int | FK → Jogo.numero | |
| gols_a | int? | Inteiro ≥ 0, ou null | null = "sem palpite" |
| gols_b | int? | Inteiro ≥ 0, ou null | |
| timestamp_arquivo | datetime | mtime do .md | Para validar regra de lock |

### Resultado

Fonte: `data/resultados/jogos.md` — mesma tabela, preenchida conforme rolam os jogos.

| Campo | Tipo | Descrição | Notas |
|---|---|---|---|
| jogo_numero | int | FK → Jogo.numero | |
| gols_a | int? | Resultado real no tempo regulamentar | null se não jogou ainda |
| gols_b | int? | Idem | |
| classificado | str? | Time que avançou (mata-mata) | Em comentário HTML |

### Pontuação (computada)

Não persistida — derivada em tempo de execução por `src/scoring.py`. Cacheada em `reports/<rodada>/pontuacao.json` quando o `arquiteto` rodar o ciclo de fechamento de rodada.

## Retenção

- **Jogos**: vida do projeto.
- **Palpites**: vida do projeto + histórico append-only em `data/palpites_ias/historico/`.
- **Resultados**: vida do projeto.
- **HTML gerado em `web/`**: regenerado a cada `python -m bolao ranking`. Versionado pra GitHub Pages funcionar.

## Migrações

Não aplicável (sem schema relacional). Mudanças no formato `.md` que quebrem o parser exigem:
1. Bump de versão no header dos arquivos (`<!-- schema: v1 -->`).
2. Parser detecta versão e roteia para função apropriada.
3. Migração em massa via `python -m bolao migrate --from v1 --to v2`.
