# PROMPT Quartas — versão WEB com ANEXO (compact, ≤ 2.5k chars)

> Coletor anexa `data/resultados/jogos.md` (96 jogos) via input[type=file] antes
> de colar este prompt. Prompt curto pra caber em Manus (~3k) e Copilot (~10k).

---

Você é uma IA competindo num bolão internacional da Copa 2026 contra ChatGPT, Claude, Gemini, Grok, DeepSeek e mais. Seus palpites serão comparados publicamente. Palpite as **4 Quartas de Final** (jogos 97–100) da Copa 2026.

O arquivo `jogos.md` anexado tem os resultados **REAIS** de todos os 96 jogos anteriores (grupos + R32 + Oitavas). Use como fatos fixos.

## Regras de pontuação (mata-mata vale 2×)

- Placar exato: **20 pts**
- Vencedor + saldo de gols: 14
- Vencedor (sem saldo): 10
- Empate sem placar exato (no regulamentar): 10
- Errado: 0

Vale o placar do **tempo regulamentar (90 min)**. Empate + classificação nos pênaltis = você ganha 10 pts (ou 20 se cravou).

## 4 confrontos das Quartas

| Jogo | Data BRT | Local | Confronto |
|---|---|---|---|
| 97 | Qui 09/07 17h | Boston | França × Marrocos |
| 98 | Sex 10/07 16h | Los Angeles | Espanha × Bélgica |
| 99 | Sáb 11/07 18h | Miami | Noruega × Inglaterra |
| 100 | Sáb 11/07 22h | Kansas City | Argentina × Suíça |

## Formato de resposta (obrigatório)

Devolva SÓ esta tabela, mesma ordem (97→100), preenchendo Gols A e Gols B com inteiros ≥ 0. Sem comentários, sem colunas extras. Placar do tempo regulamentar (90 min).

Acima da tabela, UMA linha `<!-- ia: <seu nome>; fase: quartas; data: 2026-07-08 -->`.

| Jogo | Fase | Data | Hora | Local | Time A | Gols A | Gols B | Time B |
|---|---|---|---|---|---|---|---|---|
| 97 | Quartas | Qui 09/07 | 17h00 | Boston | França | | | Marrocos |
| 98 | Quartas | Sex 10/07 | 16h00 | Los Angeles | Espanha | | | Bélgica |
| 99 | Quartas | Sáb 11/07 | 18h00 | Miami | Noruega | | | Inglaterra |
| 100 | Quartas | Sáb 11/07 | 22h00 | Kansas City | Argentina | | | Suíça |

Pense usando os resultados do arquivo anexado como sinal de forma recente. Palpites conservadores em mata-mata pagam mais (empates são frequentes; 1×0, 1×1, 2×1 dominam Quartas).
