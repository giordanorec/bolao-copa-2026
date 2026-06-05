# PROMPT — copie tudo abaixo da linha e cole no modelo de IA

---

Você é um especialista em previsão de resultados de futebol e vai participar de um bolão da Copa do Mundo FIFA 2026 competindo contra outros modelos de IA (ChatGPT, Gemini, Grok, Claude, DeepSeek e outros). Sua tarefa: prever o placar exato dos **72 jogos da fase de grupos** (11 a 27 de junho de 2026).

## Regras de pontuação do bolão (otimize para isto)

Cada palpite é pontuado assim (regras clássicas):

| Acerto | Pontos |
|---|---|
| **Placar exato** | 10 |
| **Vencedor + saldo de gols** (cravou o vencedor e a diferença de gols, mas o placar exato não) | 7 |
| **Vencedor** (cravou o vencedor, mas o saldo errado) | 5 |
| **Empate** palpitado e dado, mas com placar exato diferente do palpitado | 5 |
| Nenhum acerto | 0 |

**Mata-mata vale 2×**. Esta tabela cobre **apenas a fase de grupos**, que vale **1×** (você não precisa pensar em mata-mata agora — outro prompt cuida disso depois).

**Detalhes importantes**:
- Vale o placar do **tempo regulamentar (90 min)**. Prorrogação e pênaltis não contam.
- Empate palpitado com placar diferente do real (ex.: palpite 1×1, resultado 0×0) vale **5 pontos** — diferente de muitos bolões "Dacopa-like" onde isso seria 0. Aqui empate é categórico: se você cravou empate e deu empate, ganha 5 mesmo errando o placar.
- Vitória palpitada com saldo certo (ex.: palpite 2×0, resultado 3×1 — vencedor certo, saldo de 2 gols certo) vale **7 pontos**.
- Vitória palpitada do lado certo mas saldo errado (ex.: palpite 2×0, resultado 4×1) vale **5 pontos**.
- Saldo só conta se o vencedor estiver certo. Saldo "acidentalmente certo" no lado errado não pontua.

Seu objetivo é **maximizar o valor esperado de pontos no total dos 72 jogos**, não acertar o máximo de vencedores.

## Estratégia (pense nisto antes de palpitar)

A geometria desse sistema de pontuação muda em relação a sistemas como o do Dacopa (25/18/15/12/10):

1. **Placar exato vale apenas 2× o vencedor simples** (10 vs 5). É um prêmio mais modesto do que parece — não force placares "improváveis mas saborosos" achando que vai compensar; o downside de errar é grande.
2. **Saldo de gols passa a importar de verdade** (7 vs 5 do vencedor sem saldo). Em jogos onde você tem convicção do vencedor mas hesita no placar, escolher o **saldo modal** (mais provável) é alta densidade de valor esperado: você ganha 7 quando acerta o saldo, e ainda fica com 5 garantido se errou só o placar.
3. **Empate é categórico aqui** — palpitar empate vale 5 pontos garantidos se houver empate (não importa o placar). Em jogos genuinamente equilibrados (Espanha×Uruguai, Países Baixos×Japão, jogos decisivos da última rodada quando ambos passam empatando), empate genérico vira aposta de valor esperado alto. Se você for cravar o placar do empate, **0×0 e 1×1 dominam** (são os empates mais prováveis no futebol moderno).
4. **2×1 e 1×0 são os placares modais** em Copas do Mundo recentes (≈25-30% combinados). 2×0 também aparece muito. Placares 3-gols-pro-favorito (3×0, 3×1) só fazem sentido em mismatches grandes (ex.: França×Iraque, Argentina×Argélia).
5. **Última rodada de grupo**: muitas vezes os times jogam por resultado conveniente (ambos passam empatando, ou um precisa ganhar por X). Vale pesquisar o cenário de classificação antes da última rodada de cada grupo.

## O que você pode e deve fazer

Você está **autorizado e incentivado a pesquisar na internet** o que quiser antes de palpitar:

- **Estratégia**: literatura sobre previsão de placares (Poisson bivariado, Elo/SPI, xG), estratégias ótimas para bolões com essa estrutura específica de pontuação.
- **Informação atualizada**: convocações, lesões, suspensões, forma recente, amistosos pré-Copa, condições (altitude da Cidade do México, calor, gramados, viagens).
- **Mercados de apostas**: odds e linhas de gols são úteis como probabilidade agregada — mas **não copie cegamente o favoritismo do mercado**; o sistema de pontuação acima premia placar exato, e o mercado não otimiza para isso.
- **Sinais fracos**: estatística histórica (distribuição típica de placares em estreias de Copa, jogos decididos no último minuto, times que jogam fechados) ou qualquer notícia que ajude a calibrar.

## Formato de resposta (obrigatório)

Devolva **somente** a tabela abaixo, completa, na **mesma ordem**, preenchendo as colunas **Gols A** e **Gols B** com números inteiros ≥ 0. Não adicione comentários, justificativas, notas ou colunas extras. Não altere nomes de times, datas ou qualquer outra célula. Horários no fuso de Brasília.

**Acima da tabela**, adicione UMA linha com um comentário HTML invisível identificando você. Formato exato:

```
<!-- ia: <nome> <versão>; data: <YYYY-MM-DD> -->
```

Exemplos válidos: `<!-- ia: ChatGPT 5; data: 2026-06-08 -->`, `<!-- ia: Claude Opus 4.7; data: 2026-06-08 -->`, `<!-- ia: Gemini 2.5 Pro; data: 2026-06-08 -->`. Isto ajuda o operador a confirmar quem produziu o arquivo. Não inclua nada além desse comentário antes da tabela.

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

Checklist final antes de responder: (1) o comentário HTML `<!-- ia: ... -->` está presente UMA vez acima da tabela; (2) as 72 linhas estão presentes e na mesma ordem; (3) todas as células de Gols A e Gols B estão preenchidas com inteiros ≥ 0; (4) nada além do comentário e da tabela na resposta.
