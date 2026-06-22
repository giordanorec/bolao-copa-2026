# PROMPT v2 — versão API (coleta automatizada via OpenRouter, com dossiê e resultados)

> Esta versão é enviada via API (sem search nativo). Dois blocos de contexto são injetados em runtime pelo coletor:
>
> - `{{DOSSIE}}` → conteúdo de `data/dossie/v2-2026-06-22.md` (classificação parcial, lesões, suspensões, odds atualizadas após as rodadas 1–2).
> - `{{RESULTADOS}}` → tabela de resultados oficiais dos jogos **1–40**, extraída de `data/resultados/jogos.md`.
>
> O coletor substitui ambos os placeholders antes de enviar. Todas as IAs API recebem exatamente os mesmos dados.
> Para coleta manual via interface web (com search nativo), use `config/prompts/ia-palpiteira-v2-web.md`.

---

Você é um especialista em previsão de resultados de futebol e está participando de um bolão da Copa do Mundo FIFA 2026 competindo contra outros modelos de IA (ChatGPT, Gemini, Grok, Claude, DeepSeek e outros). **Esta é a segunda leva de palpites ("v2")**: a Copa já começou, as rodadas 1 e 2 da fase de grupos foram disputadas, e você agora tem informação real para tomar decisões mais calibradas.

Sua tarefa: prever o placar exato dos **32 jogos restantes da fase de grupos** (jogos 41–72, de 22 a 27 de junho de 2026).

## Contexto: o que já aconteceu

Os jogos 1–40 já foram disputados. Os resultados reais estão na seção `## RESULTADOS DOS JOGOS 1–40` ao final deste prompt — trate-os como **fatos fixos e imutáveis**. Não os questione, não tente "lembrar" de resultados diferentes. Esses placares definem a classificação parcial de cada grupo.

## Regras de pontuação do bolão (otimize para isto)

Cada palpite é pontuado assim (regras clássicas):

| Acerto | Pontos |
|---|---|
| **Placar exato** | 10 |
| **Vencedor + saldo de gols** (cravou o vencedor e a diferença de gols, mas o placar exato não) | 7 |
| **Vencedor** (cravou o vencedor, mas o saldo errado) | 5 |
| **Empate** palpitado e dado, mas com placar exato diferente do palpitado | 5 |
| Nenhum acerto | 0 |

**Mata-mata vale 2×.** Esta tabela cobre **apenas os jogos restantes da fase de grupos**, que vale **1×**. Você não precisa palpitar mata-mata — outro prompt cuida disso.

**Detalhes importantes:**
- Vale o placar do **tempo regulamentar (90 min)**. Prorrogação e pênaltis não contam.
- Empate palpitado com placar diferente do real (ex.: palpite 1×1, resultado 0×0) vale **5 pontos** — empate é categórico.
- Vitória palpitada com saldo certo (ex.: palpite 2×0, resultado 3×1) vale **7 pontos**.
- Vitória palpitada do lado certo mas saldo errado (ex.: palpite 2×0, resultado 4×1) vale **5 pontos**.
- Saldo só conta se o vencedor estiver certo.

Seu objetivo é **maximizar o valor esperado de pontos no total dos 32 jogos**, não acertar o máximo de vencedores.

## Estratégia (pense nisto antes de palpitar)

A geometria desse sistema de pontuação muda em relação a sistemas como o do Dacopa (25/18/15/12/10):

1. **Placar exato vale apenas 2× o vencedor simples** (10 vs 5). Não force placares "improváveis mas saborosos" achando que o jackpot compensa; o downside de errar é alto.
2. **Saldo de gols passa a importar de verdade** (7 vs 5 do vencedor sem saldo). Em jogos com convicção do vencedor mas hesitação no placar, escolher o **saldo modal** (mais provável) é alta densidade de valor esperado: você ganha 7 ao acertar o saldo e ainda fica com 5 se errou só o placar.
3. **Empate é categórico** — palpitar empate vale 5 pontos garantidos se houver empate (não importa o placar). Em jogos genuinamente equilibrados, empate genérico vira aposta de valor esperado alto. Se for cravar o placar do empate, **0×0 e 1×1 dominam** (empates mais prováveis no futebol moderno).
4. **2×1 e 1×0 são os placares modais** em Copas do Mundo recentes (≈25-30% combinados). 2×0 também aparece muito. Placares 3-gols-pro-favorito (3×0, 3×1) só fazem sentido em mismatches grandes.
5. **Última rodada de grupo (jogos 49–72):** muitas vezes os times jogam por resultado conveniente (ambos passam empatando, ou um precisa ganhar por X gols). **Este fator é crítico aqui** — com classificação parcial em mãos, estude o cenário de cada grupo antes da 3ª rodada. Times já classificados podem poupar titulares; times eliminados podem reduzir intensidade; dois times que se classificam empatando têm incentivo real para não arriscar.

## O que você pode e deve fazer

Você está recebendo este prompt via API e **não tem acesso à internet**. Em vez disso, ao final deste prompt há:
- `## DOSSIÊ DE REFERÊNCIA` — dados pré-coletados sobre lesões, suspensões por cartão, forma recente, odds atualizadas, classificação parcial dos grupos após as rodadas 1–2.
- `## RESULTADOS DOS JOGOS 1–40` — os placares reais dos jogos já disputados.

**Diretrizes de uso:**
- **Use o dossiê** como base factual para estado atual das seleções. Não tente "lembrar" de convocações, lesões, suspensões ou resultados que não estejam nele — sua memória de treino pode estar desatualizada.
- **Use os resultados dos jogos 1–40** para inferir classificação dos grupos, forma recente e padrão de jogo de cada seleção.
- **Use seu próprio raciocínio** sobre esses fatos: modelos de previsão de placares (Poisson bivariado, Elo/SPI, xG), heurísticas de última rodada, value betting. O dossiê não dita placares — você decide.
- **Se um fato necessário não estiver no dossiê**, palpite com base nos sinais que tem e siga em frente. Não invente dados.
- **Mercados de apostas no dossiê**: use como probabilidade agregada, mas **não copie cegamente** — o sistema de pontuação acima premia placar exato, e odds não otimizam para isso.

## Formato de resposta (obrigatório)

Devolva **somente** a tabela abaixo, completa, na **mesma ordem**, preenchendo as colunas **Gols A** e **Gols B** com números inteiros ≥ 0. Não adicione comentários, justificativas, notas ou colunas extras. Não altere nomes de times, datas ou qualquer outra célula. Horários no fuso de Brasília.

**Acima da tabela**, adicione UMA linha com um comentário HTML invisível identificando você. Formato exato:

```
<!-- ia: <nome> <versão>; data: <YYYY-MM-DD>; versao: v2 -->
```

Exemplos válidos: `<!-- ia: ChatGPT 5; data: 2026-06-22; versao: v2 -->`, `<!-- ia: Claude Opus 4.8; data: 2026-06-22; versao: v2 -->`. Não inclua nada além desse comentário antes da tabela.

| Jogo | Fase | Data | Hora | Local | Time A | Gols A | Gols B | Time B |
|---|---|---|---|---|---|---|---|---|
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

Checklist final antes de responder: (1) o comentário HTML `<!-- ia: ...; versao: v2 -->` está presente UMA vez acima da tabela; (2) as **32 linhas** estão presentes e na mesma ordem (jogos 41–72); (3) todas as células de Gols A e Gols B estão preenchidas com inteiros ≥ 0; (4) nada além do comentário e da tabela na resposta; (5) os resultados dos jogos 1–40 foram usados como fatos fixos, não questionados.

## DOSSIÊ DE REFERÊNCIA

Abaixo está um dossiê padronizado com dados pré-coletados sobre o estado atual das seleções após as rodadas 1–2 (lesões, suspensões, classificação parcial dos grupos, odds atualizadas). **Use-o como sua fonte principal de fatos** — não tente "lembrar" de informações que não estejam nele. Você pode (e deve) usar seu raciocínio próprio sobre esses fatos pra estimar placares, mas não invente fatos novos.

```
{{DOSSIE}}
```

## RESULTADOS DOS JOGOS 1–40

Estes são os resultados **reais e definitivos** dos jogos já disputados. Trate-os como fatos imutáveis — não os altere mentalmente nem questione. Use-os para inferir classificação dos grupos e forma recente de cada seleção.

```
{{RESULTADOS}}
```
