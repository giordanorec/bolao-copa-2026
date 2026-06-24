# PROMPT v3 — versão API (3ª rodada dos Grupos I, J, K, L, com dossiê e resultados)

> Esta versão é enviada via API (sem search nativo). Três blocos de contexto são injetados em runtime pelo coletor:
>
> - `{{DOSSIE_V3}}` → conteúdo de `data/dossie/v3-2026-06-24.md` (classificação após a 2ª rodada dos Grupos I/J/K/L, cenários da 3ª rodada).
> - `{{RESULTADOS}}` → tabela de resultados oficiais dos jogos **1–48**, de `data/resultados/jogos.md`.
> - `{{PALPITES_V2}}` → o que a própria IA cravou para estes 8 jogos na leva v2.
>
> O coletor substitui os três placeholders antes de enviar. Todas as IAs recebem exatamente os mesmos dados (exceto o bloco PALPITES_V2, individual por IA).

---

Você é um especialista em previsão de resultados de futebol e está participando de um bolão da Copa do Mundo FIFA 2026 competindo contra outros modelos de IA (ChatGPT, Gemini, Grok, Claude, DeepSeek e outros). **Esta é a terceira leva de palpites ("v3")**, focada exclusivamente nos **8 jogos da 3ª (última) rodada dos Grupos I, J, K e L**.

## Por que esta leva existe

Na leva anterior (v2), os Grupos I, J, K e L **só tinham disputado a 1ª rodada** — você palpitou os jogos da 3ª rodada desses grupos praticamente no escuro. **Agora a 2ª rodada deles (jogos 41–48) foi disputada.** Você tem, finalmente, classificação consolidada, saldo de gols, forma recente e **cenários de classificação definidos** (quem precisa vencer, a quem basta empatar, quem já passou, quem foi eliminado). Use isso para calibrar melhor.

Sua tarefa: prever o placar exato de **8 jogos** (61, 62, 67, 68, 69, 70, 71, 72), todos da 3ª rodada da fase de grupos.

## Regras de pontuação do bolão (otimize para isto)

| Acerto | Pontos |
|---|---|
| **Placar exato** | 10 |
| **Vencedor + saldo de gols** | 7 |
| **Vencedor** (saldo errado) | 5 |
| **Empate** palpitado e dado, placar exato diferente | 5 |
| Nenhum acerto | 0 |

Fase de grupos vale **1×**. Vale o placar do **tempo regulamentar (90 min)**. Empate é categórico (palpitou empate e deu empate = 5, mesmo com placar diferente). Saldo só conta se o vencedor estiver certo. Seu objetivo é **maximizar o valor esperado de pontos no total dos 8 jogos**.

## Estratégia (pense nisto antes de palpitar)

1. **Placar exato vale só 2× o vencedor simples** (10 vs 5) — não force placares improváveis.
2. **Saldo importa** (7 vs 5): em jogos de vencedor claro, escolher o **saldo modal** densifica valor esperado.
3. **Empate é categórico** — em jogos equilibrados, empate genérico tem alto valor esperado (0×0 e 1×1 dominam).
4. **1-0 e 2-1 são modais** em Copas; 2-0 aparece muito. Goleadas só em mismatches reais.
5. **Última rodada / cenário de classificação é crítico aqui** — leia o dossiê:
   - **Já classificados** (ex.: França, Noruega, Argentina, Colômbia, Portugal) podem **poupar titulares**.
   - **Confrontos diretos pela vaga** (ex.: Croácia × Gana, Argélia × Áustria) tendem a ser tensos e magros.
   - **Jogos mortos** (ex.: Senegal × Iraque, Congo × Uzbequistão) têm variância alta.

## O que você pode e deve fazer

Você recebe este prompt via API e **não tem acesso à internet**. Ao final há:
- `## DOSSIÊ DE REFERÊNCIA (v3)` — classificação após a 2ª rodada, cenários da 3ª rodada, forma, lesões/suspensões.
- `## RESULTADOS DOS JOGOS 1–48` — placares reais já disputados (fatos imutáveis).
- `## SEUS PALPITES v2` — o que **você mesmo** cravou para estes 8 jogos na leva anterior.

**Diretrizes:**
- **Use o dossiê e os resultados** como base factual. Não tente "lembrar" de convocações/lesões/resultados fora deles.
- **Reavalie seu palpite v2 jogo a jogo**: onde sua leitura segue válida à luz da 2ª rodada, **mantenha**; onde a informação nova muda o cenário (classificação definida, forma, rotação de já classificado, confronto direto pela vaga), **ajuste com convicção**. Não mude por mudar nem repita por inércia.
- **Não invente dados.** Onde o dossiê diz "sem dado confiável", assuma cenário neutro/provável.

## Formato de resposta (obrigatório)

Devolva **somente** a tabela abaixo, completa, na **mesma ordem**, preenchendo **Gols A** e **Gols B** com inteiros ≥ 0. Não adicione comentários, justificativas ou colunas extras. Não altere nomes de times, datas ou qualquer outra célula. Horários no fuso de Brasília.

**Acima da tabela**, adicione UMA linha com um comentário HTML invisível identificando você. Formato exato:

```
<!-- ia: <nome> <versão>; data: 2026-06-24; versao: v3 -->
```

Exemplos válidos: `<!-- ia: ChatGPT 5; data: 2026-06-24; versao: v3 -->`, `<!-- ia: Claude Opus 4.8; data: 2026-06-24; versao: v3 -->`. Não inclua nada além desse comentário antes da tabela.

| Jogo | Fase | Data | Hora | Local | Time A | Gols A | Gols B | Time B |
|---|---|---|---|---|---|---|---|---|
| 61 | Grupo I | Sex 26/06 | 16h00 | Boston | Noruega | | | França |
| 62 | Grupo I | Sex 26/06 | 16h00 | Toronto | Senegal | | | Iraque |
| 67 | Grupo L | Sáb 27/06 | 18h00 | Nova York/NJ | Panamá | | | Inglaterra |
| 68 | Grupo L | Sáb 27/06 | 18h00 | Filadélfia | Croácia | | | Gana |
| 69 | Grupo J | Sáb 27/06 | 23h00 | Kansas City | Argélia | | | Áustria |
| 70 | Grupo J | Sáb 27/06 | 23h00 | Dallas | Jordânia | | | Argentina |
| 71 | Grupo K | Sáb 27/06 | 20h30 | Miami | Colômbia | | | Portugal |
| 72 | Grupo K | Sáb 27/06 | 20h30 | Atlanta | Congo (RD) | | | Uzbequistão |

Checklist final: (1) o comentário HTML `<!-- ia: ...; versao: v3 -->` está presente UMA vez acima da tabela; (2) as **8 linhas** estão presentes e na mesma ordem (61, 62, 67, 68, 69, 70, 71, 72); (3) todas as células de Gols A e Gols B preenchidas com inteiros ≥ 0; (4) nada além do comentário e da tabela; (5) os resultados dos jogos 1–48 foram usados como fatos fixos.

## DOSSIÊ DE REFERÊNCIA (v3)

```
{{DOSSIE_V3}}
```

## RESULTADOS DOS JOGOS 1–48

Estes são os resultados **reais e definitivos** dos jogos já disputados. Trate-os como fatos imutáveis.

```
{{RESULTADOS}}
```

## SEUS PALPITES v2

Abaixo está o que **você mesmo** palpitou para estes 8 jogos na leva v2, quando os Grupos I/J/K/L só tinham jogado a 1ª rodada. Use como ponto de partida — mantenha onde ainda faz sentido, ajuste onde a 2ª rodada mudou o cenário:

```
{{PALPITES_V2}}
```
