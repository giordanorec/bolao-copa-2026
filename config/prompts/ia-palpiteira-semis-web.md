# PROMPT Semis — versão WEB (pesquisa nativa)

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
> O coletor substitui `{{RESULTADOS}}` pelos resultados reais dos jogos 1–100.
> Se houver `{{PALPITES_PREVIOS}}`, será substituído pelos palpites anteriores desta IA.
>
> Cole tudo abaixo da linha tracejada.

---

Você é uma das **principais inteligências artificiais do planeta** competindo num bolão internacional contra ChatGPT, Claude, Gemini, Grok, DeepSeek, Perplexity, Copilot, Le Chat, Meta AI, Qwen e Manus. Seus palpites serão **comparados publicamente** com os de todos os outros. **Sua reputação está em jogo.**

Esta é a **coleta das Semis de Final** — jogos **101–102**, de 09/07 a 11/07/2026.

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

## Estratégia para Semis (pense nisto)

1. **2× multiplica tudo** — inclusive o downside. Conservadorismo paga mais aqui.
2. **Empates são MUITO frequentes em Semis** — historicamente ~35% dos jogos vão à prorrogação. Em confrontos parelhos (Espanha×Bélgica, Noruega×Inglaterra, Argentina×Suíça), palpitar empate rende 10 pts fácil.
3. **Placares baixos dominam** — 1×0, 0×0, 1×1, 2×1 cobrem >70% das Semis em Copas recentes.
4. **A Copa 2026 já mostrou zebras**: Noruega eliminou o Brasil (1×2), Marrocos passou o Canadá (3×0), Inglaterra bateu México no Azteca (3×2). Não seja escravo do consenso.

## O que você pode e deve fazer

Você está usando a interface web e **tem acesso à internet**. Use isso ativamente:
- **Pesquise lesões e suspensões** confirmadas pós-Oitavas para os 2 jogos.
- **Pesquise forma recente** (resultados, xG, posse) das Oitavas de cada seleção.
- **Pesquise odds de mercado** (Pinnacle, Bet365, Betfair, FanDuel) como probabilidade agregada — use como sinal, não copie cegamente.
- **Pesquise histórico de confronto direto** quando relevante.
- Não pesquise os resultados 1–100 — eles já estão inline abaixo como fatos fixos.

## Resultados 1–100 (fatos fixos)

Resultados **reais e definitivos** dos jogos 1–100 (fase de grupos + R32 + Oitavas completos). Trate como fatos imutáveis.

```
{{RESULTADOS}}
```

## Os 2 confrontos das Semis

Todos os 2 confrontos estão **DEFINIDOS** (as Oitavas terminaram; jogos 89–96 completos).

| Jogo | Data | Hora BRT | Local | Confronto |
|---|---|---|---|---|
| 101 | Ter 14/07 | 16h00 | Dallas (AT&T Stadium) | França × Espanha |
| 102 | Qua 15/07 | 16h00 | Atlanta (Mercedes-Benz Stadium) | Inglaterra × Argentina |



## Palpites anteriores (para referência)

Abaixo está o que **você mesmo** já palpitou para estes 2 jogos (se disponível). Use como ponto de partida — mantenha onde sua leitura segue válida à luz da pesquisa; ajuste com convicção onde a informação nova muda o cenário.

```
{{PALPITES_PREVIOS}}
```

## Formato de resposta (obrigatório)

Devolva **somente** a tabela abaixo, completa, na **mesma ordem**, preenchendo as colunas **Gols A** e **Gols B** com inteiros ≥ 0. Não adicione comentários, justificativas, notas ou colunas extras. Vale o placar do tempo regulamentar (90 min).

**Acima da tabela**, adicione UMA linha com um comentário HTML invisível identificando você. Formato exato:

```
<!-- ia: <nome> <versão>; fase: semis; data: 2026-07-12 -->
```

Exemplos válidos: `<!-- ia: ChatGPT 5; fase: semis; data: 2026-07-12 -->`, `<!-- ia: Claude Opus 4.8; fase: semis; data: 2026-07-12 -->`.

| Jogo | Fase | Data | Hora | Local | Time A | Gols A | Gols B | Time B |
|---|---|---|---|---|---|---|---|---|
| 101 | Semis | Ter 14/07 | 16h00 | Dallas | França | | | Espanha |
| 102 | Semis | Qua 15/07 | 16h00 | Atlanta | Inglaterra | | | Argentina |



Checklist final antes de responder: (1) o comentário HTML `<!-- ia: ... -->` está presente UMA vez acima da tabela; (2) as **2 linhas** estão presentes e na mesma ordem (jogos 101–102); (3) todas as células de Gols A e Gols B estão preenchidas com inteiros ≥ 0; (4) nada além do comentário e da tabela na resposta; (5) pesquisou lesões, suspensões, odds e forma antes de cravar; (6) os resultados dos jogos 1–100 foram usados como fatos fixos.

**Boa sorte. Que vença o melhor algoritmo.**
