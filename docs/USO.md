# USO — Manual de operação durante a Copa

Este documento é o runbook do Giordano (operador único) entre **11/06/2026**
(abertura) e **19/07/2026** (final). Passo a passo, sem enrolação.

Pré-requisito: instalação concluída e `python -m bolao rodada` rodando em
estado vazio. Se ainda não rodou, ver `README.md` (Quickstart).

---

## 1. Antes da Copa (10/06/2026) — coleta dos palpites das IAs

A coleta vai por **duas vias paralelas** (decisão registrada em
`docs/DECISOES.md`):

| Via | Cobertura | Quando usar |
|---|---|---|
| **Web manual** | Tier 1 (16 IAs top) | Modelos com web search nativa; valor competitivo da pesquisa ao vivo |
| **API OpenRouter** | Todas com mapping (~80 das 105) | Comparação justa com dossiê padronizado; também duplica Tier 1 |

Tier 1 é colhido pelas **duas** vias — slug web ganha sufixo `-web`
(ex: `chatgpt-5-web`) e o slug "puro" (`chatgpt-5`) é o da API. Isso
permite comparar o mesmo modelo com search ao vivo vs com dossiê
padronizado.

Lista mestre e cobertura por IA: [`docs/IAS_PARTICIPANTES.md`](IAS_PARTICIPANTES.md).

### 1.1 Via web (manual) — Tier 1

Tier 1 são as 16 IAs top de mercado, todas com web search nativa
(ChatGPT 5, Claude Opus 4.7, Gemini 2.5 Pro, Grok 4, etc — lista
completa em `IAS_PARTICIPANTES.md`).

Pra cada IA do Tier 1:

1. Abre o chat da IA em sessão **nova** (sem contexto prévio).
2. Cola o prompt inteiro de `config/prompts/ia-palpiteira-web.md`.
   (Variante sem dossiê — a IA usa o search dela.)
3. Espera a resposta com a tabela completa (72 jogos da fase de grupos).
4. Copia **apenas a tabela Markdown** (do header `| Jogo | Fase | ...`
   até a última linha) e salva em `data/palpites_ias/<slug>-web.md`.
5. Confere o comentário HTML invisível no topo (`<!-- IA: ... -->`) —
   assinatura pra evitar confundir arquivos.

Esforço: ~10 min por IA × 16 = ~3h por ciclo de coleta.

### 1.2 Via API OpenRouter — todas com cobertura

Coletor automatizado: uma chamada cobre 80+ IAs em paralelo, todas
recebendo o **mesmo prompt + dossiê padronizado**, sem variação humana.

#### 1.2.1 Setup (uma vez só)

1. Cria conta em https://openrouter.ai e gera uma API key.
2. Coloca crédito (estimativa: ~US$ 15-30 cobre 2 ciclos completos das
   105 IAs — fase de grupos + mata-mata).
3. Copia `config/.env.example` pra `config/.env` e cola a key:

   ```bash
   cp config/.env.example config/.env
   # edita config/.env com a OPENROUTER_API_KEY
   ```

4. Confere que `config/.env` está no `.gitignore` (não vai pra
   repositório):

   ```bash
   git check-ignore config/.env   # deve imprimir o path
   ```

5. Roda o diagnóstico:

   ```bash
   scripts/check_env.sh           # deve indicar OPENROUTER_API_KEY OK
   ```

#### 1.2.2 Preparar o dossiê

Antes de coletar via API, gera o dossiê padronizado em
`data/dossie/<rodada>.md`. O dossiê é curado pelo Arquiteto
(Claude Opus 4.7 com web search) e contém fatos pré-coletados sobre
seleções e o torneio. Ele entra como contexto adicional pra todas as
IAs API.

Para o primeiro ciclo, o dossiê vive em
`data/dossie/2026-06-grupos.md`. Para o mata-mata,
`data/dossie/2026-06-mata-mata.md` (Fase 7).

#### 1.2.3 Rodar dry-run primeiro

```bash
python -m bolao coletar --tier 1 --dry-run
```

Lista quais IAs seriam consultadas, **sem** chamar a API. Sempre
confere antes de rodar pra valer — evita gastar crédito à toa.

Variantes:

```bash
python -m bolao coletar --ia chatgpt-5 --dry-run      # só uma
python -m bolao coletar --tier all --dry-run          # tudo com mapping
python -m bolao coletar --ia chatgpt-5,grok-4 --dry-run  # várias
```

#### 1.2.4 Rodar pra valer

Remove o `--dry-run`:

```bash
python -m bolao coletar --tier all
```

O coletor:
- Lê `config/openrouter_mapping.json` pra resolver slug → modelo.
- Chama cada IA em paralelo (max 5 simultâneas).
- Salva resposta em `data/palpites_ias/<slug>.md` com header
  `<!-- modo: api -->`, `<!-- modelo: <openrouter_id> -->`,
  `<!-- coletado_em: <ISO> -->`.
- Pula IAs que falharem (timeout, 4xx, parse) e continua.
- No fim, imprime relatório: quantas OK, quantas falharam, quais e por quê.

Esforço: 1 comando, ~5-15 min de execução pras 80+ IAs.

#### 1.2.5 Validar a coleta

```bash
python -m bolao parse
```

Mesma validação da via web. Se uma IA voltou resposta fora do formato,
ela aparece como erro estrutural — edita à mão ou descarta o arquivo e
rodar `coletar --ia <slug>` de novo.

### 1.3 Validar tudo antes da abertura

```bash
python -m bolao parse
```

Saída esperada:
- Lista de IAs encontradas.
- Para cada IA: total de palpites válidos, jogos faltando, palpites
  rejeitados (não-inteiro, fora do range).
- Exit code `0` se tudo OK; `!= 0` se há erro estrutural.

Se uma IA palpitou só parte: tudo bem, ela participa mesmo assim.
Se uma IA mandou bagunça: edita o `.md` à mão pra ajustar a tabela
(pode usar Notepad) e roda `parse` de novo.

### 1.4 Renderizar o ranking inicial (zerado)

```bash
python -m bolao rodada
```

Abre `web/index.html` no browser. Confere se todas as IAs aparecem com
0 pontos. Esse é o estado de largada.

---

## 2. Durante a Copa — rotina por rodada

Uma rodada = 1 a 6 jogos por dia. A rotina é a mesma todo dia que tiver
jogo finalizado.

### 2.1 Editar resultados

Abre `data/resultados/jogos.md` (pode ser no Notepad) e preenche
`Gols A` e `Gols B` dos jogos que terminaram. Use o **placar do tempo
regulamentar (90 min)** — prorrogação e pênaltis não entram nessa
coluna.

Jogo de mata-mata que foi pra pênaltis: registra o placar do
regulamentar e adiciona, na mesma linha ou em comentário lateral:

```markdown
| 85 | Oitavas | ... | Brasil | 1 | 1 | França | <!-- classificado: Brasil (pen 4x3) -->
```

Salva o arquivo. Não precisa commitar ainda.

### 2.2 Rodar o ciclo completo

```bash
python -m bolao rodada
```

Em < 30 segundos, isso faz:
- `parse` — relê tudo e valida.
- `score` — calcula pontos por palpite, salva
  `reports/<YYYY-MM-DD>/pontuacao.json`.
- `ranking` — regenera `web/index.html` e `web/data/ranking.json`.
- `resumo` — escreve `resumo.txt` com texto pronto pra WhatsApp.

Se algum erro aparecer, leia em `arquivo:linha: motivo` e corrija o
`.md` que está reclamando.

### 2.3 Conferir o ranking no browser

```bash
python -m bolao serve
```

Abre http://localhost:8000 — confere que:
- Posições mudaram conforme esperado.
- IA com placar exato pulou na frente.
- Coluna "jogos palpitados" bate com a quantidade de jogos com resultado.

`Ctrl+C` pra parar o servidor quando terminar.

### 2.4 Postar resumo no WhatsApp

Abre `resumo.txt`, copia o conteúdo, cola no grupo
**"Claude - Geral"**. Formato esperado:

```
[bolao-copa] Rodada 2026-06-13 — top 3

1. ChatGPT 5 — 45 pts (2 exatos)
2. Claude Opus 4.7 — 38 pts (1 exato)
3. Gemini 2.5 Pro — 30 pts (0 exatos)

Destaques:
- Brasil 3x1 Marrocos: só o Grok cravou o vencedor com saldo (+7)
- Consenso errado: todas as 5 IAs apostaram em vitória da Alemanha
  contra Curaçao 2x0; deu 1x1 (todas zeraram)

Ranking completo: <URL ou "compartilho aqui">
```

Pode ajustar o texto na hora, mas mantém o prefixo `[bolao-copa]` pro
pessoal filtrar mensagens.

### 2.5 (Opcional) Publicar no GitHub Pages

```bash
git add data/resultados/jogos.md web/ reports/
git commit -m "rodada 2026-06-13: 4 jogos apurados"
git push
```

GitHub Pages atualiza em 1-2 min. Compartilha a URL no grupo.

---

## 3. Corrigir um erro

### 3.1 Errou de digitar um resultado

Edita `data/resultados/jogos.md`, corrige o placar, roda
`python -m bolao rodada` de novo. O ranking é determinístico — ele é
recomputado do zero, então a correção propaga sem resíduo.

### 3.2 Esqueceu de apurar um jogo

Mesma coisa: preenche `Gols A`/`Gols B`, roda `rodada`. Os jogos sem
placar ficam como "pendente" e não afetam pontuação até serem
preenchidos.

### 3.3 Quer revogar um palpite por desconfiança

**Não revogar.** Histórico é append-only (regra I6). Se a IA mandou
bobagem, ela perde pontos — faz parte do experimento. Documentar o caso
no `docs/DECISOES.md` se merecer registro.

### 3.4 O parser está reclamando de timestamp travado

A regra I4 bloqueia edição do palpite após `hora_jogo - 1h`. Se você
precisou mexer no arquivo do palpite por motivo legítimo (ex.: BOM
encoding, encoding errado), o jeito é:

1. Não mexer no palpite.
2. Documentar o problema no log da rodada.
3. Se for caso de corrupção real do arquivo, restaurar via `git checkout
   data/palpites_ias/<slug>.md` (volta ao último commit).

---

## 4. Antes do mata-mata (27/06 → 28/06)

Quando a fase de grupos terminar, os 32 classificados são conhecidos.
Aí entra a Fase 7:

1. `llm-prompt` atualiza `config/prompts/ia-palpiteira-mata-mata.md`
   substituindo placeholders ("1º Grupo A", "Venc. J73") pelos times
   reais.
2. Você cola esse prompt novo em cada IA, coleta as respostas.
3. Salva em `data/palpites_ias/<slug>-mm.md` (sufixo `-mm` pra separar
   de fase de grupos).
4. Roda `python -m bolao parse` pra validar.
5. Os palpites de mata-mata pontuam **2×** automaticamente (o `scoring`
   trata o multiplicador pela `fase`).

---

## 5. Encerramento (pós-19/07)

Depois da final:

1. Apurar o último jogo, rodar `python -m bolao rodada` uma última vez.
2. Print do ranking final → atualizar `README.md`.
3. Postar mensagem de encerramento no grupo.
4. Postmortem em `docs/DECISOES.md`: o que funcionou, o que falhou, qual
   IA acertou mais, surpresas.
5. Tornar o repo público (se estava privado) ou tagar `v1.0-final`.

---

## Comandos de referência rápida

```bash
python -m bolao parse        # valida arquivos sem calcular nada
python -m bolao score        # só calcula pontos
python -m bolao ranking      # só regenera HTML
python -m bolao resumo       # só gera resumo.txt
python -m bolao rodada       # tudo acima em sequência (uso normal)
python -m bolao serve        # preview local em http://localhost:8000
python -m bolao coletar --tier 1 --dry-run    # lista IAs Tier 1 sem chamar API
python -m bolao coletar --tier all            # coleta via OpenRouter (gasta crédito)
python -m bolao coletar --ia <slug>           # coleta uma IA específica
python -m bolao --help       # lista subcomandos
```

Diagnóstico:

```bash
scripts/check_env.sh         # confere Python, pip, git, shims
pytest -q                    # roda a suíte de testes
ruff check src/ tests/       # lint
mypy --strict src/           # type check
```

Multi-agente:

```bash
scripts/open_dashboard.sh        # tmux com todos os agentes
scripts/watch_logs.sh            # alternativa Windows
scripts/spawn.sh <agente>        # cria sessão
scripts/drive.sh <agente> "..."  # manda prompt
scripts/take_over.sh <agente>    # humano assume
```

---

## Quando travar

1. Erro no parser? Lê `arquivo:linha: motivo`, conserta o `.md` reclamado.
2. Erro no scoring? Roda `pytest tests/test_scoring.py -q` — se os 12
   casos de borda passarem, o bug é em dado, não em código.
3. Ranking estranho? Inspeciona `reports/<data>/pontuacao.json` — é o
   raw de pontos por (IA, jogo). Daí dá pra confirmar à mão.
4. Tudo travado? Abre issue ou chama o Arquiteto via
   `scripts/drive.sh arquiteto "..."`.
