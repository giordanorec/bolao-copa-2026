# PROMPT Quartas de Final v1 — versão API (com dossiê)

> Enviada via **API** (OpenRouter). A IA não tem acesso à internet.
> Dois blocos de contexto são injetados em runtime pelo coletor:
> - `{{DOSSIE}}` → `data/dossie/quartas-2026-07-08.md` (previews técnicos, odds, lesões, escalações prováveis, H2H, storylines)
> - `{{RESULTADOS}}` → tabela de resultados oficiais dos jogos 1–96 (fase de grupos + R32 + Oitavas completos)
>
> Todas as IAs API recebem exatamente os mesmos dados.

---

Você é um especialista em previsão de resultados de futebol e está participando das **Quartas de Final da Copa do Mundo FIFA 2026** num bolão contra outras IAs. Sua tarefa: prever o placar exato dos **4 jogos das Quartas (J97–J100)** — de 09/07 a 11/07/2026.

## Regras de pontuação (otimize para isto)

Mata-mata vale **2×**:

| Acerto | Pontos (2×) |
|---|---|
| **Placar exato** | **20** |
| **Vencedor + saldo de gols** | **14** |
| **Vencedor** (sem saldo) | **10** |
| **Empate** sem placar exato (regulamentar) | **10** |
| Nenhum acerto | 0 |

**Detalhes**:
- Vale o placar do **tempo regulamentar (90 min)**. Prorrogação e pênaltis NÃO contam para o placar. Se palpitou 1×1 e foi 1×1 no regulamentar (com a classificação nos pênaltis), você ganha os **20 pontos** de placar exato.
- Vencer nos pênaltis NÃO invalida palpite de empate.

## Estratégia para Quartas (pense nisto)

1. **2× multiplica tudo** — inclusive o downside. Conservadorismo paga em placares baixos.
2. **Empates são MAIS frequentes em Quartas do que em Oitavas** — ~35% das QF de Copa 2010–2022 empataram no regulamentar (7 de 20 jogos). Em confrontos parelhos (França×Marrocos, Argentina×Suíça), palpitar empate rende 10 pts fácil.
3. **Placares baixos dominam Quartas históricas** — 1×0 (~25%) e 1×1 (~20%) são os placares exatos mais frequentes. Média histórica: ~2,15 gols/jogo.
4. **Em favoritos claros** (Espanha×Bélgica), 1×0 e 2×1 pagam melhor que 3×0 ou 4×1.
5. **Zebras vivas**: Marrocos, Bélgica, Noruega e Suíça — todas com odds implícitas de 15–20% de vitória. Nenhuma é fantasma.
6. **Fadiga & lesões contam**: Argentina desgastada emocionalmente após 2 mata-mata na corda bamba; Noruega com doença viral no elenco; Bélgica sem Onana; França pode perder Tchouaméni; Marrocos possivelmente sem Saibari; Inglaterra sem Reece James, Henderson e Quansah.

## O que você pode e deve fazer

Você está recebendo este prompt via **API** e **não tem acesso à internet**. Ao final há:
- `## DOSSIÊ DE REFERÊNCIA` — dados pré-coletados sobre os 4 confrontos (favoritos, odds Bet365/FanDuel/DraftKings, forma Oitavas, lesões, escalações prováveis, H2H, storylines).
- `## RESULTADOS DOS JOGOS 1–96` — placares reais da fase de grupos + R32 + Oitavas (tudo já disputado).

**Diretrizes**:
- **Use o dossiê** como base factual. Não tente "lembrar" — sua memória pode estar desatualizada.
- **Use os resultados 1–96** pra ver forma recente e padrão de cada seleção no torneio.
- **Use seu próprio raciocínio** sobre esses fatos: modelos Poisson bivariado, Elo/SPI, xG, contexto de mata-mata, H2H, fadiga. O dossiê não dita placares — você decide.
- **Se um fato não estiver no dossiê**, palpite com base nos sinais que tem. Não invente.
- **Mercados**: use odds como probabilidade agregada, mas **não copie** — o sistema premia placar exato, e odds não otimizam pra isso.

## Os 4 confrontos das Quartas

| Jogo | Data | Hora BRT | Local | Confronto |
|---|---|---|---|---|
| 97 | Qui 09/07 | 17h00 | Boston (Gillette Stadium) | França × Marrocos |
| 98 | Sex 10/07 | 16h00 | Los Angeles (SoFi Stadium) | Espanha × Bélgica |
| 99 | Sáb 11/07 | 18h00 | Miami (Hard Rock Stadium) | Noruega × Inglaterra |
| 100 | Sáb 11/07 | 22h00 | Kansas City (Arrowhead Stadium) | Argentina × Suíça |

## Formato de resposta (obrigatório)

Devolva **somente** a tabela abaixo, completa, na **mesma ordem**, preenchendo **Gols A** e **Gols B** com inteiros ≥ 0. Não adicione comentários, justificativas, notas ou colunas extras. Vale o placar do tempo regulamentar (90 min).

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

Checklist final: (1) o comentário HTML `<!-- ia: ... -->` está presente UMA vez acima da tabela; (2) as **4 linhas** estão presentes e na mesma ordem (jogos 97–100); (3) todas as células de Gols A e Gols B preenchidas com inteiros ≥ 0; (4) nada além do comentário e da tabela; (5) resultados 1–96 tratados como fatos fixos; (6) dossiê consultado como fonte primária.

## DOSSIÊ DE REFERÊNCIA

Dossiê padronizado com dados pré-coletados sobre os 4 confrontos das Quartas (previews técnicos, favoritos, odds Bet365/FanDuel/DraftKings, escalações prováveis, forma Oitavas, lesões, H2H, storylines). **Use-o como sua fonte principal**.

```
{{DOSSIE}}
```

## RESULTADOS DOS JOGOS 1–96

Resultados **reais e definitivos** dos jogos 1–96 (fase de grupos + R32 + Oitavas completos). Trate como fatos imutáveis.

```
{{RESULTADOS}}
```
