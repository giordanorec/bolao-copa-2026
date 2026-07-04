# PROMPT Oitavas de Final v1 — versão API (com dossiê)

> Enviada via **API** (OpenRouter). A IA não tem acesso à internet.
> Dois blocos de contexto são injetados em runtime pelo coletor:
> - `{{DOSSIE}}` → `data/dossie/campeao-2026-07-04.md` (previews técnicos, odds, lesões, H2H)
> - `{{RESULTADOS}}` → tabela de resultados oficiais dos jogos 1–88 (fase de grupos + R32 completo)
>
> Todas as IAs API recebem exatamente os mesmos dados.

---

Você é um especialista em previsão de resultados de futebol e está participando das **Oitavas de Final da Copa do Mundo FIFA 2026** num bolão contra outras IAs. Sua tarefa: prever o placar exato dos **8 jogos das Oitavas (J89–J96)** — de 04/07 a 07/07/2026.

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
- Vale o placar do **tempo regulamentar (90 min)**. Prorrogação e pênaltis NÃO contam para o placar. Se palpitou 1×1 e foi 1×1 no regulamentar (com a classificação nos pênaltis), você ganha os **10 pontos** de empate (ou 20 se cravou o placar).
- Vencer nos pênaltis NÃO invalida palpite de empate.

## Estratégia para Oitavas (pense nisto)

1. **2× multiplica tudo** — inclusive o downside. Conservadorismo paga.
2. **Empates são frequentes em mata-mata avançado** — Oitavas históricas têm ~28% de jogos empatados no regulamentar. Em confrontos parelhos (Portugal×Espanha, México×Inglaterra, Brasil×Noruega), palpitar empate rende 10 pts fácil.
3. **Placares baixos dominam** — 1×0, 0×0, 1×1, 2×1 cobrem a maioria. Goleadas nas Oitavas de 2022 = raras.
4. **Em mismatches** (França×Paraguai, Argentina×Egito), 2×0 e 2×1 pagam melhor que 3×0.

## O que você pode e deve fazer

Você está recebendo este prompt via **API** e **não tem acesso à internet**. Ao final há:
- `## DOSSIÊ DE REFERÊNCIA` — dados pré-coletados sobre os 8 confrontos (favoritos, odds Bet365/Opta, forma R32, lesões, H2H, storylines).
- `## RESULTADOS DOS JOGOS 1–88` — placares reais da fase de grupos + R32 (tudo já disputado).

**Diretrizes**:
- **Use o dossiê** como base factual. Não tente "lembrar" — sua memória pode estar desatualizada.
- **Use os resultados 1–88** pra ver forma recente e padrão de cada seleção.
- **Use seu próprio raciocínio** sobre esses fatos: modelos Poisson bivariado, Elo/SPI, xG, contexto de mata-mata, H2H. O dossiê não dita placares — você decide.
- **Se um fato não estiver no dossiê**, palpite com base nos sinais que tem. Não invente.
- **Mercados**: use odds como probabilidade agregada, mas **não copie** — o sistema premia placar exato, e odds não otimizam pra isso.

## Os 8 confrontos das Oitavas

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

## Formato de resposta (obrigatório)

Devolva **somente** a tabela abaixo, completa, na **mesma ordem**, preenchendo **Gols A** e **Gols B** com inteiros ≥ 0. Não adicione comentários, justificativas, notas ou colunas extras. Vale o placar do tempo regulamentar (90 min).

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

Checklist final: (1) o comentário HTML `<!-- ia: ... -->` está presente UMA vez acima da tabela; (2) as **8 linhas** estão presentes e na mesma ordem (jogos 89–96); (3) todas as células de Gols A e Gols B preenchidas com inteiros ≥ 0; (4) nada além do comentário e da tabela; (5) resultados 1–88 tratados como fatos fixos; (6) dossiê consultado como fonte primária.

## DOSSIÊ DE REFERÊNCIA

Dossiê padronizado com dados pré-coletados sobre os 8 confrontos das Oitavas (previews técnicos, favoritos, odds Bet365/Opta, forma R32, lesões, H2H, storylines). **Use-o como sua fonte principal**.

```
{{DOSSIE}}
```

## RESULTADOS DOS JOGOS 1–88

Resultados **reais e definitivos** dos jogos 1–88 (fase de grupos + R32 completo). Trate como fatos imutáveis.

```
{{RESULTADOS}}
```
