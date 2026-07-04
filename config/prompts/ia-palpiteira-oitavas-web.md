# PROMPT Oitavas — versão WEB (pesquisa nativa)

> Use este prompt na interface web da IA (chatgpt.com, claude.ai, gemini.google.com,
> grok.com, perplexity.ai, chat.deepseek.com, copilot.microsoft.com, chat.mistral.ai,
> meta.ai, chat.qwen.ai, manus.im). A IA pode pesquisar na internet e deve usar modos avançados.
>
> **Antes de colar**, ative na interface o modo mais poderoso disponível:
> - ChatGPT: **Deep Research** / **Think longer** (GPT-5 Thinking)
> - Claude: **Extended Thinking** + **Research/Web Search**
> - Gemini: **Deep Research** (Gemini 2.5 Pro)
> - Grok: **DeepSearch** + **Think** (Grok 4 Heavy)
> - Perplexity: **Pro** / **Research**
> - DeepSeek: **DeepThink (R1)** + **Search**
> - Copilot: **Think Deeper**
> - Le Chat (Mistral): **Think** + busca web
> - Meta AI: pesquisa nativa (sem toggle dedicado)
> - Qwen: **Thinking** + busca web
> - Manus: **Agent mode**
>
> O coletor substitui `{{RESULTADOS}}` pelos resultados reais dos jogos 1–88.
> Se houver `{{PALPITES_PREVIOS}}`, será substituído pelos palpites anteriores desta IA.
>
> Cole tudo abaixo da linha tracejada.

---

Você é uma das **principais inteligências artificiais do planeta** competindo num bolão internacional contra ChatGPT, Claude, Gemini, Grok, DeepSeek, Perplexity, Copilot, Le Chat, Meta AI, Qwen e Manus. Seus palpites serão **comparados publicamente** com os de todos os outros. **Sua reputação está em jogo.**

Esta é a **coleta das Oitavas de Final**, focada nos **8 jogos das Oitavas** — jogos **89–96**, de 04/07 a 07/07/2026.

## Regras de pontuação do bolão (otimize para isto)

Mata-mata vale **2×**:

| Acerto | Pontos (2×) |
|---|---|
| **Placar exato** | **20** |
| **Vencedor + saldo de gols** | **14** |
| **Vencedor** (sem saldo) | **10** |
| **Empate** sem placar exato (regulamentar) | **10** |
| Nenhum acerto | 0 |

**Detalhes importantes**:
- Vale o placar do **tempo regulamentar (90 min)**. Prorrogação e pênaltis NÃO contam para o palpite de placar. Se palpitou 1×1 e foi 1×1 no regulamentar (com a classificação decidida nos pênaltis), você ganha os **10 pontos** de empate (ou 20 se cravou o 1×1).
- Vencer por pênaltis no jogo real **não** invalida o palpite de empate.

## Estratégia para Oitavas (pense nisto)

1. **2× multiplica tudo** — inclusive o downside de errar. Conservadorismo paga mais aqui.
2. **Empates são frequentes em mata-mata avançado** — Oitavas históricas têm ~28% de jogos empatados no regulamentar. Em confrontos parelhos (Portugal×Espanha, México×Inglaterra, Brasil×Noruega), palpitar empate rende 10 pts fácil.
3. **Placares baixos dominam** — 1×0, 0×0, 1×1, 2×1 cobrem a maioria. Goleadas nas Oitavas de 2022 = raras.
4. **Em mismatches** (França×Paraguai, Argentina×Egito), 2×0 e 2×1 pagam melhor que 3×0.

## O que você pode e deve fazer

Você está usando a interface web e **tem acesso à internet**. Use isso ativamente:
- **Pesquise lesões e suspensões** confirmadas pós-R32 para os 8 jogos.
- **Pesquise forma recente** (resultados, xG, posse) de cada seleção durante grupos e R32.
- **Pesquise odds de mercado** (Pinnacle, Bet365, Betfair) como probabilidade agregada — use como sinal, não copie cegamente (odds não otimizam placar exato).
- **Pesquise histórico de confronto direto** quando relevante para mismatches grandes.
- Não pesquise os resultados 1–88 — eles já estão inline abaixo como fatos fixos.

## Resultados 1–88 (fatos fixos)

Resultados **reais e definitivos** dos jogos 1–88 (fase de grupos + R32 completo). Trate como fatos imutáveis.

```
{{RESULTADOS}}
```

## Os 8 confrontos das Oitavas

Todos os 8 confrontos estão **DEFINIDOS** (o R32 terminou; jogos 73–88 completos).

| Jogo | Data | Hora BRT | Local | Confronto |
|---|---|---|---|---|
| 89 | Sáb 04/07 | 18h00 | Filadélfia | Paraguai × França |
| 90 | Sáb 04/07 | 14h00 | Houston | Canadá × Marrocos |
| 91 | Dom 05/07 | 17h00 | Nova York/NJ | Brasil × Noruega |
| 92 | Dom 05/07 | 21h00 | Cidade do México (Azteca) | México × Inglaterra |
| 93 | Seg 06/07 | 16h00 | Dallas | Portugal × Espanha |
| 94 | Seg 06/07 | 21h00 | Seattle | Estados Unidos × Bélgica |
| 95 | Ter 07/07 | 13h00 | Atlanta | Argentina × Egito |
| 96 | Ter 07/07 | 17h00 | Vancouver | Suíça × Colômbia |

## Palpites anteriores (para referência)

Abaixo está o que **você mesmo** já palpitou para estes 8 jogos (se disponível). Use como ponto de partida — mantenha onde sua leitura segue válida à luz da pesquisa; ajuste com convicção onde a informação nova muda o cenário.

```
{{PALPITES_PREVIOS}}
```

## Formato de resposta (obrigatório)

Devolva **somente** a tabela abaixo, completa, na **mesma ordem**, preenchendo as colunas **Gols A** e **Gols B** com inteiros ≥ 0. Não adicione comentários, justificativas, notas ou colunas extras. Vale o placar do tempo regulamentar (90 min).

**Acima da tabela**, adicione UMA linha com um comentário HTML invisível identificando você. Formato exato:

```
<!-- ia: <nome> <versão>; fase: oitavas; data: 2026-07-04 -->
```

Exemplos válidos: `<!-- ia: ChatGPT 5; fase: oitavas; data: 2026-07-04 -->`, `<!-- ia: Claude Opus 4.8; fase: oitavas; data: 2026-07-04 -->`.

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

Checklist final antes de responder: (1) o comentário HTML `<!-- ia: ... -->` está presente UMA vez acima da tabela; (2) as **8 linhas** estão presentes e na mesma ordem (jogos 89–96); (3) todas as células de Gols A e Gols B estão preenchidas com inteiros ≥ 0; (4) nada além do comentário e da tabela na resposta; (5) pesquisou lesões, suspensões, odds e forma antes de cravar; (6) os resultados dos jogos 1–88 foram usados como fatos fixos.

**Boa sorte. Que vença o melhor algoritmo.**
