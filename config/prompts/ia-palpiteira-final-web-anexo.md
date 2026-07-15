# PROMPT Final — versão WEB com ANEXO (compact, ≤ 2.5k chars)

> Coletor anexa `data/resultados/jogos.md` (102 jogos) via input[type=file] antes
> de colar este prompt. Prompt curto pra caber em Manus (~3k) e Copilot (~10k).

---

Você é uma IA competindo num bolão internacional da Copa 2026 contra ChatGPT, Claude, Gemini, Grok, DeepSeek e mais. Seus palpites serão comparados publicamente. Esta é a **coleta final** — palpite os **2 últimos jogos do torneio** (jogos 103–104), em 18 e 19/07/2026.

O arquivo `jogos.md` anexado tem os resultados **REAIS** de todos os 102 jogos anteriores (grupos + mata-mata até as Semis). Use como fatos fixos.

## Regras de pontuação (mata-mata vale 2×)

- Placar exato: **20 pts**
- Vencedor + saldo de gols: 14
- Vencedor (sem saldo): 10
- Empate sem placar exato (no regulamentar): 10
- Errado: 0

Vale o placar do **tempo regulamentar (90 min)**. Empate + classificação/título decidido nos pênaltis = você ganha 10 pts (ou 20 se cravou).

## Os 2 jogos finais (ambos DEFINIDOS)

| Jogo | Data BRT | Hora | Local | Confronto |
|---|---|---|---|---|
| 103 | Sáb 18/07 | 18h00 | Miami (Hard Rock Stadium) | França × Inglaterra (3º lugar) |
| 104 | Dom 19/07 | 16h00 | Nova York/NJ (MetLife Stadium) | Espanha × Argentina (FINAL) |

## Pesquise antes de responder

Lesões/suspensões pós-Semifinal, forma recente no mata-mata, odds de mercado, H2H relevante entre os pares (inclusive Finais anteriores). Não pesquise os 102 jogos anteriores — já estão no anexo.

## Formato de resposta (obrigatório)

Devolva SÓ esta tabela, mesma ordem (103→104), preenchendo Gols A e Gols B com inteiros ≥ 0. Sem comentários, sem colunas extras. Placar do tempo regulamentar (90 min).

Acima da tabela, UMA linha `<!-- ia: <seu nome>; fase: final; data: 2026-07-15 -->`.

| Jogo | Fase | Data | Hora | Local | Time A | Gols A | Gols B | Time B |
|---|---|---|---|---|---|---|---|---|
| 103 | 3º lugar | Sáb 18/07 | 18h00 | Miami | França | | | Inglaterra |
| 104 | Final | Dom 19/07 | 16h00 | Nova York/NJ | Espanha | | | Argentina |

Pense usando o arquivo anexado como sinal de forma recente. Finais de Copa historicamente são jogos fechados (empate ou 1 gol de diferença); disputas de 3º lugar tendem a ter mais gols.
