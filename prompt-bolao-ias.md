# PROMPT — copie tudo abaixo da linha e cole no modelo de IA

---

Você é um especialista em previsão de resultados de futebol e vai participar de um bolão da Copa do Mundo FIFA 2026 competindo contra outros modelos de IA. Sua tarefa: prever o placar exato dos **72 jogos da fase de grupos** (11 a 27 de junho de 2026).

## Regras de pontuação do bolão (otimize para isto)

Cada palpite é pontuado assim (plataforma Dacopa):

| Acerto | Pontos |
|---|---|
| Placar exato | 25 |
| Vencedor + nº de gols do vencedor | 18 |
| Vencedor + diferença de gols | 15 |
| Vencedor + nº de gols do perdedor | 12 |
| Apenas o vencedor (ou apenas que houve empate, sem placar exato... atenção: empate com placar errado vale 0) | 10 |
| Nenhum acerto | 0 |

Detalhes importantes: vale o placar do **tempo regulamentar (90 min)**. Empate palpitado com placar errado vale **0** (ex.: palpite 1×1, resultado 0×0 → 0 pontos) — empates são apostas "tudo ou nada" no placar exato. Seu objetivo é **maximizar o valor esperado de pontos no total dos 72 jogos**, não acertar o máximo de vencedores. Pense em qual placar concentra mais pontos esperados dadas as probabilidades (ex.: às vezes 2×1 domina 1×0 mesmo sendo um pouco menos provável).

## O que você pode e deve fazer

Você está **autorizado e incentivado a pesquisar na internet** o que quiser antes de palpitar:

- **Estratégia**: literatura sobre previsão de placares (Poisson bivariado, Elo/SPI, xG), estratégias ótimas para bolões com essa estrutura de pontuação.
- **Informação atualizada**: convocações, lesões, suspensões, forma recente, amistosos pré-Copa, condições (altitude da Cidade do México, calor, gramados, viagens).
- **Mercados de apostas**: odds e linhas de gols são úteis como probabilidade agregada — mas **não copie cegamente o favoritismo do mercado**; o sistema de pontuação acima premia placar exato, e o mercado não otimiza para isso.
- **Sinais fracos**: qualquer estatística, padrão histórico (ex.: distribuição típica de placares em estreias de Copa, times que jogam fechados) ou notícia que ajude a calibrar placares.

## Formato de resposta (obrigatório)

Devolva **somente** a tabela abaixo, completa, na **mesma ordem**, preenchendo as colunas **Gols A** e **Gols B** com números inteiros ≥ 0. Não adicione comentários, justificativas, notas ou colunas extras. Não altere nomes de times, datas ou qualquer outra célula. Horários no fuso de Brasília.

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

Checklist final antes de responder: (1) as 72 linhas estão presentes e na mesma ordem; (2) todas as células de Gols A e Gols B estão preenchidas com inteiros; (3) nada além da tabela na resposta.
