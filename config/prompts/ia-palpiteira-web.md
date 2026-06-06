# PROMPT — versão WEB PRO (coleta manual com pesquisa profunda)

> Use este prompt na interface web da IA (chat.openai.com, claude.ai, gemini.google.com, grok.com, perplexity.ai, chat.deepseek.com etc.). A IA pode pesquisar internet, usar modos avançados (Deep Research / DeepSearch / Extended Thinking) e conectores próprios.
>
> **Antes de colar**, ative na interface da IA o modo mais poderoso disponível:
> - ChatGPT: **Deep Research** + GPT-5 Pro (Thinking)
> - Claude: **Extended Thinking** + **Web Search** + Connectors ativados
> - Gemini: **Deep Research** + Gemini 2.5 Pro
> - Grok: **DeepSearch** + **Think Mode** (Grok 4 Heavy)
> - Perplexity: **Pro Search** ou **Deep Research**
> - DeepSeek: **DeepThink (R1)** + Search ativado
>
> Cole tudo abaixo da linha tracejada.

---

# Briefing — Bolão das IAs · Copa do Mundo FIFA 2026

Você é uma das **principais inteligências artificiais do planeta** competindo num bolão internacional contra ChatGPT, Claude, Gemini, Grok, DeepSeek, Perplexity, Copilot, Le Chat, Meta AI e Qwen. Seus palpites serão **comparados publicamente** com os de todos os outros. **Sua reputação está em jogo**.

Seu trabalho: prever o **placar exato dos 72 jogos da fase de grupos** da Copa do Mundo de 2026 (11–27 de junho de 2026). Você pode usar **todos os recursos disponíveis**: pesquisa profunda, conectores, raciocínio estendido, decomposição em sub-agentes, varredura de literatura.

**Trate isso como um problema profissional de research + decisão sob incerteza. Não como um chute casual.**

---

## 1. Regras de pontuação (otimize para isto, não para "vencedores acertados")

| Acerto | Pontos |
|---|---|
| **Placar exato** | 10 |
| Vencedor + saldo de gols (cravou vencedor e diferença, mas placar exato não) | 7 |
| Vencedor (cravou só o vencedor, saldo errado) | 5 |
| Empate palpitado, deu empate mas com placar diferente | 5 |
| Errou | 0 |

- Vale **tempo regulamentar (90 min)**. Prorrogação/pênaltis ignorados.
- **Empate é categórico**: palpitou 1×1, deu 0×0 → 5 pontos. Diferente de bolões "Dacopa-like" em que isso seria 0.
- Saldo só conta se o vencedor está correto.
- Mata-mata vale 2× (fora do escopo deste prompt).

Sua função-objetivo: **maximizar valor esperado de pontos no total dos 72 jogos**, **não** acertar mais vencedores.

---

## 2. PROTOCOLO DE PESQUISA — faça isto antes de palpitar

### 2.1 Meta-pesquisa (PRIMEIRO, antes de tudo)

Pesquise na internet **como pesquisadores profissionais e quants resolvem este problema**:

- Literatura acadêmica sobre previsão de placares (Dixon-Coles, Poisson bivariado, Skellam, modelos hierárquicos bayesianos)
- xG (expected goals) e xGA recentes das 48 seleções
- Sistemas de rating (Elo, SPI da FiveThirtyEight, FIFA Ranking, ClubElo)
- Papers de 2020-2026 sobre forecasting de Copa do Mundo
- Modelos de mercado de apostas (Kelly criterion, market efficiency)
- Estatística histórica de Copas (modal scores, frequência de empates, surto de gols na 3ª rodada de grupos)

**Síntese**: descreva em 3-5 frases qual abordagem combinada você vai usar e por quê. Não pule esta etapa.

### 2.2 Decomposição em sub-questões (segundo)

Quebre o problema em sub-questões independentes. Para cada uma, **se sua interface permitir**, rode pesquisa profunda separada (sub-agente, deep research, council of models). Sub-questões mínimas:

1. **Status atual de cada uma das 48 seleções** — convocações finais (1/jun/2026), lesões pré-Copa, suspensões, treinador, formação tática, forma recente nos 6 últimos jogos
2. **Confrontos diretos** (head-to-head dos últimos 10 anos) entre as 4 seleções de cada grupo
3. **Condições de venue** — altitude (Cidade do México 2240m), calor/umidade (Dallas, Miami, Monterrey), viagens entre jogos, dias de descanso
4. **Mercados de apostas** — odds Pinnacle/Bet365 fechamento, linha total de gols (over/under), handicap asiático, movimentação de linha nas últimas 24h antes de cada jogo
5. **Cenários de classificação da 3ª rodada** — quando ambos os times de um jogo podem avançar empatando, ou quando um time já está classificado/eliminado
6. **Padrões históricos** — distribuição de placares em estreias vs últimas rodadas, frequência de 0×0 vs 1×0 vs 2×1, empates em jogos decisivos de grupo

Para cada sub-questão, gere uma resposta **independente e profunda** antes de juntar.

### 2.3 Ativação de modos especiais (terceiro)

Use **explicitamente** o modo mais profundo que sua interface oferece:

- **Pense por extenso** antes de cravar cada placar (mostra teu raciocínio interno — usuário não vê na resposta final, mas a qualidade do output melhora)
- **Council of models** ou multi-agent reasoning: se você consegue simular várias perspectivas (analista técnico, analista estatístico, analista psicológico de seleções), faça-o internamente e agregue
- **Conectores**: se você tem acesso a Google Search, Bing, Browse, Code Interpreter, Sandbox, **use-os ativamente** — não confie só em conhecimento estático
- **Function calling/tools**: se você consegue rodar código Python pra calcular Poisson, simulações Monte Carlo, ou regressão, **faça-o**

### 2.4 Sinais fracos (quarto)

Procure ativamente sinais que outras IAs talvez ignorem:

- Movimento de linha de aposta nas últimas 6 horas antes do jogo (sharps vs público)
- Posts recentes de jornalistas embedded em concentrações (Globo, Marca, L'Équipe, Telegraph)
- Mudanças de última hora de escalação (lesão em treino reportada em redes)
- Clima previsto pro horário do jogo (chuva muda dinâmica, calor ≥ 32°C reduz gols ~15%)
- Conflitos internos de seleção (Saudita trocou treinador em abril; Brasil tem Ancelotti recém-chegado)
- Reservas e folegô (times eliminados na 3ª rodada costumam mandar reservas)
- Distância de viagem entre cidades dos jogos consecutivos

---

## 3. ESTRATÉGIA COMPETITIVA (game theory)

Você está competindo contra outras IAs do mesmo calibre. Não basta ser bom — precisa ser **diferente** quando isso aumenta valor esperado.

### 3.1 Calibração de confiança

Para cada jogo, **estime mentalmente sua confiança** no placar modal (1 = altíssima, 5 = baixíssima):

- **Confiança 1-2 (~25 jogos)** — jogos de mismatch claro (França×Iraque, Argentina×Argélia, Espanha×Cabo Verde). Aqui siga o consenso técnico (2×0, 2×1, 3×0). Errar por bravata custa 5-10 pontos sem benefício.

- **Confiança 3 (~30 jogos)** — favorito moderado contra azarão competente (Brasil×Marrocos, Inglaterra×Croácia, Portugal×Colômbia). Placar modal é o caminho (1×0, 2×1). Aqui placar exato vale 10 e é alcançável.

- **Confiança 4-5 (~17 jogos)** — jogos genuinamente equilibrados (Holanda×Japão, Egito×Irã, Sérvia eliminada × Brasil já passado). Aqui você tem 2 caminhos:
  - (A) **Seguir consenso**: palpitar empate 1×1 ou vitória mínima 1×0 do favorito leve. EV ~3-4 pontos.
  - (B) **Diferenciar-se**: palpitar um placar incomum mas defensável (2×2, 3×2, 0×1 do azarão). EV ~2-3 pontos em valor médio mas **variance alta** — quando acerta, vai longe; quando erra, perdeu 5 que provavelmente teria ganhado.

### 3.2 Quando arriscar (use com parcimônia)

Use a estratégia (B) — placar incomum mas defensável — em **no máximo 8-12 dos 72 jogos** (10-15%). Critérios para ativar:

1. Sua confiança é baixa (≥ 4)
2. Há motivo técnico concreto pro placar incomum (ex: dois times que precisam vencer e vão expor defesas → 2×2 ou 3×2; dois times que já passaram → 0×0)
3. Você consegue articular em 1 frase **por que** as outras IAs vão errar isso

Em outras palavras: arrisque quando você acha que tem **insight que o mercado e o consenso de IAs não tem**. Não arrisque por covardia de palpitar empate previsível.

### 3.3 Quando aceitar o consenso

Se o mercado e a literatura concordam em 2×0 pra um jogo e você não tem motivo concreto pra discordar, **palpite 2×0**. Não tente parecer original. Originalidade sem fundamento perde pontos.

---

## 4. MATEMÁTICA DE PONTOS — escolha o placar modal certo

Dada a estrutura 10/7/5/5/0:

- **Placar exato dá só 2× o vencedor simples** (10 vs 5). O prêmio é modesto. Não force "3×1 sangue na areia" achando que o jackpot compensa.
- **Saldo importa** (7 pra vencedor+saldo vs 5 pra só vencedor). Em jogos com convicção do vencedor, calibrar o saldo modal vale ouro: você ganha 7 se acerta o saldo, ainda fica com 5 se erra o placar mas saldo certo.
- **Empate é categórico** — palpitar empate vale 5 garantidos. Em jogos equilibrados, é alta densidade de EV. **0×0 e 1×1 dominam** entre os empates modernos.
- **Placares modais em Copas recentes**: 1×0 (~18%), 2×1 (~14%), 2×0 (~12%), 1×1 (~10%), 0×0 (~8%), 2×2 (~6%). Combinados ≈ 68% dos jogos. Placares 3-pra-um-lado (3×0, 3×1) ≈ 15% (concentrados em mismatches).
- **Última rodada de grupo**: assimetria forte entre times que precisam ganhar vs times com vaga garantida. Estude o cenário antes.

---

## 5. SÍNTESE E CHECKLIST FINAL

Antes de cravar a tabela:

- [ ] Pesquisei meta-metodologia (~5 min de leitura sobre forecasting)
- [ ] Decompus em ≥ 5 sub-questões e respondi cada uma
- [ ] Ativei o modo profundo disponível (Deep Research / Thinking)
- [ ] Coletei status atual das 48 seleções (lesões, escalação, forma)
- [ ] Consultei odds de mercado como sinal agregado
- [ ] Identifiquei ≥ 3 sinais fracos que vou explorar
- [ ] Para cada jogo, calibrei minha confiança (1-5)
- [ ] Escolhi 8-12 jogos pra estratégia "diferenciar-se" e justifiquei cada um
- [ ] Para o resto, escolhi placar modal alinhado ao consenso técnico
- [ ] Verifiquei coerência interna (Brasil ganha de Marrocos e Haiti? Argentina passa em primeiro?)
- [ ] Conferi cenários de 3ª rodada considerando classificações
- [ ] Recalibrei placares de saldos (saldo modal pra cada favorito)
- [ ] Conferi placar com no mínimo 2 fontes (modelo Elo + odds + xG)

---

## 6. FORMATO DE RESPOSTA (obrigatório)

Devolva **somente** a tabela abaixo, completa, na **mesma ordem**, preenchendo **Gols A** e **Gols B** com inteiros ≥ 0. Não adicione comentários, justificativas, notas ou colunas extras. Não altere nomes de times, datas ou outras células. Horários no fuso de Brasília.

**Acima da tabela**, adicione UMA linha de comentário HTML invisível identificando você:

```
<!-- ia: <nome> <versão>; data: 2026-06-08; modo: <Deep Research|Extended Thinking|DeepSearch|...> -->
```

Exemplos válidos:
- `<!-- ia: ChatGPT 5 Pro; data: 2026-06-08; modo: Deep Research -->`
- `<!-- ia: Claude Opus 4.7; data: 2026-06-08; modo: Extended Thinking + Web Search -->`
- `<!-- ia: Gemini 2.5 Pro; data: 2026-06-08; modo: Deep Research -->`
- `<!-- ia: Grok 4 Heavy; data: 2026-06-08; modo: DeepSearch + Think -->`

Não inclua nada além desse comentário antes da tabela. Não escreva nada depois da tabela.

| Jogo | Fase | Data | Hora | Local | Time A | Gols A | Gols B | Time B |
|---|---|---|---|---|---|---|---|---|
| 1 | Grupo A | Qui 11/06 | 16h00 | Cidade do México | México | | | África do Sul |
| 2 | Grupo A | Qui 11/06 | 23h00 | Guadalajara | Coreia do Sul | | | República Tcheca |
| 3 | Grupo B | Sex 12/06 | 16h00 | Toronto | Canadá | | | Bósnia-Herzegovina |
| 4 | Grupo D | Sex 12/06 | 22h00 | Los Angeles | Estados Unidos | | | Paraguai |
| 8 | Grupo B | Sáb 13/06 | 16h00 | San Francisco | Qatar | | | Suíça |
| 7 | Grupo C | Sáb 13/06 | 19h00 | Nova York/NJ | Brasil | | | Marrocos |
| 5 | Grupo C | Sáb 13/06 | 22h00 | Boston | Haiti | | | Escócia |
| 6 | Grupo D | Dom 14/06 | 01h00 | Vancouver | Austrália | | | Turquia |
| 10 | Grupo E | Dom 14/06 | 14h00 | Houston | Alemanha | | | Curaçao |
| 11 | Grupo F | Dom 14/06 | 17h00 | Dallas | Países Baixos | | | Japão |
| 9 | Grupo E | Dom 14/06 | 20h00 | Filadélfia | Costa do Marfim | | | Equador |
| 12 | Grupo F | Dom 14/06 | 23h00 | Monterrey | Suécia | | | Tunísia |
| 14 | Grupo H | Seg 15/06 | 13h00 | Atlanta | Espanha | | | Cabo Verde |
| 16 | Grupo G | Seg 15/06 | 16h00 | Seattle | Bélgica | | | Egito |
| 13 | Grupo H | Seg 15/06 | 19h00 | Miami | Arábia Saudita | | | Uruguai |
| 15 | Grupo G | Seg 15/06 | 22h00 | Los Angeles | Irã | | | Nova Zelândia |
| 17 | Grupo I | Ter 16/06 | 16h00 | Nova York/NJ | França | | | Senegal |
| 18 | Grupo I | Ter 16/06 | 19h00 | Boston | Iraque | | | Noruega |
| 19 | Grupo J | Ter 16/06 | 22h00 | Kansas City | Argentina | | | Argélia |
| 20 | Grupo J | Qua 17/06 | 01h00 | San Francisco | Áustria | | | Jordânia |
| 23 | Grupo K | Qua 17/06 | 14h00 | Houston | Portugal | | | Congo (RD) |
| 22 | Grupo L | Qua 17/06 | 17h00 | Dallas | Inglaterra | | | Croácia |
| 21 | Grupo L | Qua 17/06 | 20h00 | Toronto | Gana | | | Panamá |
| 24 | Grupo K | Qua 17/06 | 23h00 | Cidade do México | Uzbequistão | | | Colômbia |
| 25 | Grupo A | Qui 18/06 | 13h00 | Atlanta | República Tcheca | | | África do Sul |
| 26 | Grupo B | Qui 18/06 | 16h00 | Los Angeles | Suíça | | | Bósnia-Herzegovina |
| 27 | Grupo B | Qui 18/06 | 19h00 | Vancouver | Canadá | | | Qatar |
| 28 | Grupo A | Qui 18/06 | 22h00 | Guadalajara | México | | | Coreia do Sul |
| 32 | Grupo D | Sex 19/06 | 16h00 | Seattle | Estados Unidos | | | Austrália |
| 30 | Grupo C | Sex 19/06 | 19h00 | Boston | Escócia | | | Marrocos |
| 29 | Grupo C | Sex 19/06 | 21h30 | Filadélfia | Brasil | | | Haiti |
| 31 | Grupo D | Sáb 20/06 | 00h00 | San Francisco | Turquia | | | Paraguai |
| 35 | Grupo F | Sáb 20/06 | 14h00 | Houston | Países Baixos | | | Suécia |
| 33 | Grupo E | Sáb 20/06 | 17h00 | Toronto | Alemanha | | | Costa do Marfim |
| 34 | Grupo E | Sáb 20/06 | 21h00 | Kansas City | Equador | | | Curaçao |
| 36 | Grupo F | Dom 21/06 | 01h00 | Monterrey | Tunísia | | | Japão |
| 38 | Grupo H | Dom 21/06 | 13h00 | Atlanta | Espanha | | | Arábia Saudita |
| 39 | Grupo G | Dom 21/06 | 16h00 | Los Angeles | Bélgica | | | Irã |
| 37 | Grupo H | Dom 21/06 | 19h00 | Miami | Uruguai | | | Cabo Verde |
| 40 | Grupo G | Dom 21/06 | 22h00 | Vancouver | Nova Zelândia | | | Egito |
| 43 | Grupo J | Seg 22/06 | 14h00 | Dallas | Argentina | | | Áustria |
| 42 | Grupo I | Seg 22/06 | 18h00 | Filadélfia | França | | | Iraque |
| 41 | Grupo I | Seg 22/06 | 21h00 | Nova York/NJ | Noruega | | | Senegal |
| 44 | Grupo J | Ter 23/06 | 00h00 | San Francisco | Jordânia | | | Argélia |
| 47 | Grupo K | Ter 23/06 | 14h00 | Houston | Portugal | | | Uzbequistão |
| 45 | Grupo L | Ter 23/06 | 17h00 | Boston | Inglaterra | | | Gana |
| 46 | Grupo L | Ter 23/06 | 20h00 | Toronto | Panamá | | | Croácia |
| 48 | Grupo K | Ter 23/06 | 23h00 | Guadalajara | Colômbia | | | Congo (RD) |
| 51 | Grupo B | Qua 24/06 | 16h00 | Vancouver | Suíça | | | Canadá |
| 52 | Grupo B | Qua 24/06 | 16h00 | Seattle | Bósnia-Herzegovina | | | Qatar |
| 50 | Grupo C | Qua 24/06 | 19h00 | Atlanta | Marrocos | | | Haiti |
| 49 | Grupo C | Qua 24/06 | 19h00 | Miami | Escócia | | | Brasil |
| 53 | Grupo A | Qua 24/06 | 22h00 | Cidade do México | República Tcheca | | | México |
| 54 | Grupo A | Qua 24/06 | 22h00 | Monterrey | África do Sul | | | Coreia do Sul |
| 55 | Grupo E | Qui 25/06 | 17h00 | Filadélfia | Curaçao | | | Costa do Marfim |
| 56 | Grupo E | Qui 25/06 | 17h00 | Nova York/NJ | Equador | | | Alemanha |
| 57 | Grupo F | Qui 25/06 | 20h00 | Dallas | Japão | | | Suécia |
| 58 | Grupo F | Qui 25/06 | 20h00 | Kansas City | Tunísia | | | Países Baixos |
| 59 | Grupo D | Qui 25/06 | 23h00 | Los Angeles | Turquia | | | Estados Unidos |
| 60 | Grupo D | Qui 25/06 | 23h00 | San Francisco | Paraguai | | | Austrália |
| 61 | Grupo I | Sex 26/06 | 16h00 | Boston | Noruega | | | França |
| 62 | Grupo I | Sex 26/06 | 16h00 | Toronto | Senegal | | | Iraque |
| 65 | Grupo H | Sex 26/06 | 21h00 | Houston | Cabo Verde | | | Arábia Saudita |
| 66 | Grupo H | Sex 26/06 | 21h00 | Guadalajara | Uruguai | | | Espanha |
| 64 | Grupo G | Sáb 27/06 | 00h00 | Vancouver | Nova Zelândia | | | Bélgica |
| 63 | Grupo G | Sáb 27/06 | 00h00 | Seattle | Egito | | | Irã |
| 67 | Grupo L | Sáb 27/06 | 18h00 | Nova York/NJ | Panamá | | | Inglaterra |
| 68 | Grupo L | Sáb 27/06 | 18h00 | Filadélfia | Croácia | | | Gana |
| 71 | Grupo K | Sáb 27/06 | 20h30 | Miami | Colômbia | | | Portugal |
| 72 | Grupo K | Sáb 27/06 | 20h30 | Atlanta | Congo (RD) | | | Uzbequistão |
| 69 | Grupo J | Sáb 27/06 | 23h00 | Kansas City | Argélia | | | Áustria |
| 70 | Grupo J | Sáb 27/06 | 23h00 | Dallas | Jordânia | | | Argentina |

Checklist final antes de responder:
1. O comentário HTML `<!-- ia: ... -->` está presente UMA vez acima da tabela
2. As 72 linhas estão presentes e na mesma ordem
3. Todas as células de Gols A e Gols B estão preenchidas com inteiros ≥ 0
4. Nada além do comentário e da tabela na resposta
5. Eu segui o protocolo de pesquisa profunda — não dei chute casual
6. Eu escolhi 8-12 jogos pra diferenciar-me e o resto seguindo consenso técnico

**Boa sorte. Que vença o melhor algoritmo.**
