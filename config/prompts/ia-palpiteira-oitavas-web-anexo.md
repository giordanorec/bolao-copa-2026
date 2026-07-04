# PROMPT Oitavas — versão WEB com ANEXO (compact, ≤ 2.5k chars)

> Coletor anexa `data/resultados/jogos.md` (88 jogos) via input[type=file] antes
> de colar este prompt. Prompt curto pra caber em Manus (~3k) e Copilot (~10k).

---

Você é uma IA competindo num bolão internacional da Copa 2026 contra ChatGPT, Claude, Gemini, Grok, DeepSeek e mais. Seus palpites serão comparados publicamente. Palpite as **8 Oitavas de Final** (jogos 89–96) da Copa 2026.

O arquivo `jogos.md` anexado tem os resultados **REAIS** de todos os 88 jogos anteriores (grupos + R32). Use como fatos fixos.

## Regras de pontuação (mata-mata vale 2×)

- Placar exato: **20 pts**
- Vencedor + saldo de gols: 14
- Vencedor (sem saldo): 10
- Empate sem placar exato (no regulamentar): 10
- Errado: 0

Vale o placar do **tempo regulamentar (90 min)**. Empate + classificação nos pênaltis = você ganha 10 pts (ou 20 se cravou).

## 8 confrontos das Oitavas

| Jogo | Data BRT | Local | Confronto |
|---|---|---|---|
| 89 | Sáb 04/07 18h | Filadélfia | Paraguai × França |
| 90 | Sáb 04/07 14h | Houston | Canadá × Marrocos |
| 91 | Dom 05/07 17h | Nova York/NJ | Brasil × Noruega |
| 92 | Dom 05/07 21h | Cidade do México | México × Inglaterra |
| 93 | Seg 06/07 16h | Dallas | Portugal × Espanha |
| 94 | Seg 06/07 21h | Seattle | Estados Unidos × Bélgica |
| 95 | Ter 07/07 13h | Atlanta | Argentina × Egito |
| 96 | Ter 07/07 17h | Vancouver | Suíça × Colômbia |

## Formato de resposta (obrigatório)

Devolva SÓ esta tabela, mesma ordem (89→96), preenchendo Gols A e Gols B com inteiros ≥ 0. Sem comentários, sem colunas extras. Placar do tempo regulamentar (90 min).

Acima da tabela, UMA linha `<!-- ia: <seu nome>; fase: oitavas; data: 2026-07-04 -->`.

| Jogo | Fase | Data | Hora | Local | Time A | Gols A | Gols B | Time B |
|---|---|---|---|---|---|---|---|---|
| 89 | Oitavas | Sáb 04/07 | 18h00 | Filadélfia | Paraguai | | | França |
| 90 | Oitavas | Sáb 04/07 | 14h00 | Houston | Canadá | | | Marrocos |
| 91 | Oitavas | Dom 05/07 | 17h00 | Nova York/NJ | Brasil | | | Noruega |
| 92 | Oitavas | Dom 05/07 | 21h00 | Cidade do México | México | | | Inglaterra |
| 93 | Oitavas | Seg 06/07 | 16h00 | Dallas | Portugal | | | Espanha |
| 94 | Oitavas | Seg 06/07 | 21h00 | Seattle | Estados Unidos | | | Bélgica |
| 95 | Oitavas | Ter 07/07 | 13h00 | Atlanta | Argentina | | | Egito |
| 96 | Oitavas | Ter 07/07 | 17h00 | Vancouver | Suíça | | | Colômbia |

Pense usando os resultados do arquivo anexado como sinal de forma recente. Palpites conservadores em mata-mata pagam mais (empates são frequentes; 1×0, 1×1, 2×1 dominam).
