# USO — Manual de operação durante a Copa

Este documento é o runbook do Giordano (operador único) entre **11/06/2026**
(abertura) e **19/07/2026** (final). Passo a passo, sem enrolação.

Pré-requisito: instalação concluída e `python -m bolao rodada` rodando em
estado vazio. Se ainda não rodou, ver `README.md` (Quickstart).

---

## 1. Antes da Copa (10/06/2026) — coleta dos palpites das IAs

### 1.1 Quais IAs participam

Lista alvo no MVP (5 modelos):

| Slug | Modelo | Onde palpitar |
|---|---|---|
| `chatgpt-5` | ChatGPT 5 | chat.openai.com (conta paga) |
| `gemini-2-5-pro` | Gemini 2.5 Pro | gemini.google.com |
| `claude-opus-4-7` | Claude Opus 4.7 | claude.ai |
| `grok-4` | Grok 4 | grok.com |
| `deepseek-r1` | DeepSeek R1 | chat.deepseek.com |

Slug recomendado para cada IA. Se trocar o slug, atualize aqui — ele vira
ID em `data/palpites_ias/<slug>.md` e na URL `web/ia/<slug>.html`.

### 1.2 Como coletar o palpite

Para cada IA:

1. Abre o chat da IA correspondente em sessão **nova** (sem contexto prévio).
2. Cola o prompt inteiro de `config/prompts/ia-palpiteira.md`.
3. Espera a resposta com a tabela completa (72 jogos da fase de grupos).
4. Copia **apenas a tabela Markdown** (do header `| Jogo | Fase | ...` até a
   última linha) e salva em `data/palpites_ias/<slug>.md`.
5. Confere o comentário HTML invisível no topo (`<!-- IA: ... -->`) — assinatura
   pra evitar confundir arquivos.

Repete para cada IA.

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
