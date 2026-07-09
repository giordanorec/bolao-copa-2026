# PROMPT Quartas — versão WEB (pesquisa nativa)

> Use este prompt na interface web da IA (chatgpt.com, claude.ai, gemini.google.com,
> grok.com, perplexity.ai, chat.deepseek.com, copilot.microsoft.com, chat.mistral.ai,
> meta.ai, chat.qwen.ai, manus.im). A IA pode pesquisar na internet.
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
> O coletor substitui `{{RESULTADOS}}` pelos resultados reais dos jogos 1–96.
> Se houver `{{PALPITES_PREVIOS}}`, será substituído pelos palpites anteriores desta IA.
>
> Cole tudo abaixo da linha tracejada.

---

Você é uma das **principais inteligências artificiais do planeta** competindo num bolão internacional contra ChatGPT, Claude, Gemini, Grok, DeepSeek, Perplexity, Copilot, Le Chat, Meta AI, Qwen e Manus. Seus palpites serão **comparados publicamente** com os de todos os outros. **Sua reputação está em jogo.**

Esta é a **coleta das Quartas de Final** — jogos **97–100**, de 09/07 a 11/07/2026.

## Regras de pontuação do bolão (otimize para isto)

Mata-mata vale **2×**:

| Acerto | Pontos (2×) |
|---|---|
| **Placar exato** | **20** |
| **Vencedor + saldo de gols** | **14** |
| **Vencedor** (sem saldo) | **10** |
| **Empate** sem placar exato (regulamentar) | **10** |
| Nenhum acerto | 0 |

**Detalhes**:
- Vale o placar do **tempo regulamentar (90 min)**. Prorrogação e pênaltis NÃO contam para o palpite de placar. Se palpitou 1×1 e foi 1×1 no regulamentar (com a classificação decidida nos pênaltis), você ganha os **10 pontos** de empate (ou 20 se cravou o 1×1).
- Vencer por pênaltis no jogo real **não** invalida o palpite de empate.

## Estratégia para Quartas (pense nisto)

1. **2× multiplica tudo** — inclusive o downside. Conservadorismo paga mais aqui.
2. **Empates são MUITO frequentes em Quartas** — historicamente ~35% dos jogos vão à prorrogação. Em confrontos parelhos (Espanha×Bélgica, Noruega×Inglaterra, Argentina×Suíça), palpitar empate rende 10 pts fácil.
3. **Placares baixos dominam** — 1×0, 0×0, 1×1, 2×1 cobrem >70% das Quartas em Copas recentes.
4. **A Copa 2026 já mostrou zebras**: Noruega eliminou o Brasil (1×2), Marrocos passou o Canadá (3×0), Inglaterra bateu México no Azteca (3×2). Não seja escravo do consenso.

## O que você pode e deve fazer

Você está usando a interface web e **tem acesso à internet**. Use isso ativamente:
- **Pesquise lesões e suspensões** confirmadas pós-Oitavas para os 4 jogos.
- **Pesquise forma recente** (resultados, xG, posse) das Oitavas de cada seleção.
- **Pesquise odds de mercado** (Pinnacle, Bet365, Betfair, FanDuel) como probabilidade agregada — use como sinal, não copie cegamente.
- **Pesquise histórico de confronto direto** quando relevante.
- Não pesquise os resultados 1–96 — eles já estão inline abaixo como fatos fixos.

## Resultados 1–96 (fatos fixos)

Resultados **reais e definitivos** dos jogos 1–96 (fase de grupos + R32 + Oitavas completos). Trate como fatos imutáveis.

```
{{RESULTADOS}}
```

## Os 4 confrontos das Quartas

Todos os 4 confrontos estão **DEFINIDOS** (as Oitavas terminaram; jogos 89–96 completos).

| Jogo | Data | Hora BRT | Local | Confronto |
|---|---|---|---|---|
| 97 | Qui 09/07 | 17h00 | Boston (Gillette Stadium) | França × Marrocos |
| 98 | Sex 10/07 | 16h00 | Los Angeles (SoFi Stadium) | Espanha × Bélgica |
| 99 | Sáb 11/07 | 18h00 | Miami (Hard Rock Stadium) | Noruega × Inglaterra |
| 100 | Sáb 11/07 | 22h00 | Kansas City (Arrowhead Stadium) | Argentina × Suíça |

## Palpites anteriores (para referência)

Abaixo está o que **você mesmo** já palpitou para estes 4 jogos (se disponível). Use como ponto de partida — mantenha onde sua leitura segue válida à luz da pesquisa; ajuste com convicção onde a informação nova muda o cenário.

```
{{PALPITES_PREVIOS}}
```

## Formato de resposta (obrigatório)

Devolva **somente** a tabela abaixo, completa, na **mesma ordem**, preenchendo as colunas **Gols A** e **Gols B** com inteiros ≥ 0. Não adicione comentários, justificativas, notas ou colunas extras. Vale o placar do tempo regulamentar (90 min).

**Acima da tabela**, adicione UMA linha com um comentário HTML invisível identificando você. Formato exato:

```
<!-- ia: <nome> <versão>; fase: quartas; data: 2026-07-08 -->
```

Exemplos válidos: `<!-- ia: ChatGPT 5; fase: quartas; data: 2026-07-08 -->`, `<!-- ia: Claude Opus 4.8; fase: quartas; data: 2026-07-08 -->`.

| Jogo | Fase | Data | Hora | Local | Time A | Gols A | Gols B | Time B |
|---|---|---|---|---|---|---|---|---|
| 97 | Quartas | Qui 09/07 | 17h00 | Boston | França | | | Marrocos |
| 98 | Quartas | Sex 10/07 | 16h00 | Los Angeles | Espanha | | | Bélgica |
| 99 | Quartas | Sáb 11/07 | 18h00 | Miami | Noruega | | | Inglaterra |
| 100 | Quartas | Sáb 11/07 | 22h00 | Kansas City | Argentina | | | Suíça |

Checklist final antes de responder: (1) o comentário HTML `<!-- ia: ... -->` está presente UMA vez acima da tabela; (2) as **4 linhas** estão presentes e na mesma ordem (jogos 97–100); (3) todas as células de Gols A e Gols B estão preenchidas com inteiros ≥ 0; (4) nada além do comentário e da tabela na resposta; (5) pesquisou lesões, suspensões, odds e forma antes de cravar; (6) os resultados dos jogos 1–96 foram usados como fatos fixos.

**Boa sorte. Que vença o melhor algoritmo.**
