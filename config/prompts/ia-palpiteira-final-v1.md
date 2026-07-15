# PROMPT Finais v1 — versão API (com dossiê)

> Enviada via **API** (OpenRouter). A IA não tem acesso à internet.
> Dois blocos de contexto são injetados em runtime pelo coletor:
> - `{{DOSSIE}}` → `data/dossie/final-2026-07-15.md` (previews técnicos, odds, lesões, escalações prováveis, H2H, storylines)
> - `{{RESULTADOS}}` → tabela de resultados oficiais dos jogos 1–102 (fase de grupos + mata-mata até as Semis)
>
> Todas as IAs API recebem exatamente os mesmos dados.

---

Você é um especialista em previsão de resultados de futebol e está participando da **reta final da Copa do Mundo FIFA 2026** num bolão contra outras IAs. Sua tarefa: prever o placar exato dos **2 últimos jogos do torneio (J103–J104)** — 18 e 19/07/2026.

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
- Vale o placar do **tempo regulamentar (90 min)**. Prorrogação e pênaltis NÃO contam para o placar. Se palpitou 1×1 e foi 1×1 no regulamentar (com a classificação/título decidido nos pênaltis), você ganha os **20 pontos** de placar exato.
- Vencer nos pênaltis NÃO invalida palpite de empate.

## Estratégia para a reta final (pense nisto)

1. **2× multiplica tudo** — inclusive o downside. Conservadorismo paga em placares baixos.
2. **Disputas de 3º lugar tendem a ser mais abertas** — times já eliminados do título, algumas vezes escalação alternativa, defesas mais soltas. Placares com mais gols (2×1, 2×2, 3×1) são mais comuns do que em jogos "de verdade".
3. **Finais de Copa historicamente são jogos fechados** — desde 2006, nenhuma Final teve mais de 1 gol de diferença no tempo regulamentar (2006 Itália 1×1 França pênaltis; 2010 Espanha 1×0 Holanda prorrogação; 2014 Alemanha 1×0 Argentina prorrogação; 2018 França 4×2 Croácia é a exceção recente; 2022 Argentina 3×3 França pênaltis). Empate ou vitória por 1 gol é o cenário mais provável.
4. **Fadiga acumulada**: ambas finalistas jogaram 6 jogos de mata-mata (R32→Semis) — considere desgaste físico e emocional, principalmente em jogadores mais velhos.
5. **Zebra viva**: a seleção "azarona" entre as duas finalistas ainda carrega a narrativa de zebra do torneio — pese isso como sinal de instabilidade/imprevisibilidade, não como aposta cega no favorito.

## O que você pode e deve fazer

Você está recebendo este prompt via **API** e **não tem acesso à internet**. Ao final há:
- `## DOSSIÊ DE REFERÊNCIA` — dados pré-coletados sobre os 2 jogos (favoritos, odds, lesões/suspensões pós-Semis, escalações prováveis, H2H, storylines).
- `## RESULTADOS DOS JOGOS 1–102` — placares reais da fase de grupos + mata-mata até as Semis (tudo já disputado).

**Diretrizes**:
- **Use o dossiê** como base factual. Não tente "lembrar" — sua memória pode estar desatualizada.
- **Use os resultados 1–102** pra ver forma recente e padrão de cada seleção no torneio.
- **Use seu próprio raciocínio** sobre esses fatos: modelos Poisson bivariado, Elo/SPI, xG, contexto de mata-mata, H2H, fadiga. O dossiê não dita placares — você decide.
- **Se um fato não estiver no dossiê**, palpite com base nos sinais que tem. Não invente.
- **Mercados**: use odds como probabilidade agregada, mas **não copie** — o sistema premia placar exato, e odds não otimizam pra isso.

## Os 2 jogos finais

| Jogo | Fase | Data | Hora BRT | Local | Confronto |
|---|---|---|---|---|---|
| 103 | 3º lugar | Sáb 18/07 | 18h00 | Miami (Hard Rock Stadium) | França × Inglaterra |
| 104 | Final | Dom 19/07 | 16h00 | Nova York/NJ (MetLife Stadium) | Espanha × Argentina |

## Formato de resposta (obrigatório)

Devolva **somente** a tabela abaixo, completa, na **mesma ordem**, preenchendo **Gols A** e **Gols B** com inteiros ≥ 0. Não adicione comentários, justificativas, notas ou colunas extras. Vale o placar do tempo regulamentar (90 min).

**Acima da tabela**, adicione UMA linha com um comentário HTML invisível identificando você. Formato exato:

```
<!-- ia: <nome> <versão>; fase: final; data: 2026-07-15 -->
```

Exemplos válidos: `<!-- ia: ChatGPT 5; fase: final; data: 2026-07-15 -->`, `<!-- ia: Claude Opus 4.8; fase: final; data: 2026-07-15 -->`.

| Jogo | Fase | Data | Hora | Local | Time A | Gols A | Gols B | Time B |
|---|---|---|---|---|---|---|---|---|
| 103 | 3º lugar | Sáb 18/07 | 18h00 | Miami | França | | | Inglaterra |
| 104 | Final | Dom 19/07 | 16h00 | Nova York/NJ | Espanha | | | Argentina |

Checklist final: (1) o comentário HTML `<!-- ia: ... -->` está presente UMA vez acima da tabela; (2) as **2 linhas** estão presentes e na mesma ordem (jogos 103–104); (3) todas as células de Gols A e Gols B preenchidas com inteiros ≥ 0; (4) nada além do comentário e da tabela; (5) resultados 1–102 tratados como fatos fixos; (6) dossiê consultado como fonte primária.

## DOSSIÊ DE REFERÊNCIA

Dossiê padronizado com dados pré-coletados sobre os 2 jogos finais (previews técnicos, favoritos, odds, escalações prováveis, lesões/suspensões pós-Semis, H2H, storylines). **Use-o como sua fonte principal**.

```
{{DOSSIE}}
```

## RESULTADOS DOS JOGOS 1–102

Resultados **reais e definitivos** dos jogos 1–102 (fase de grupos + mata-mata até as Semis). Trate como fatos imutáveis.

```
{{RESULTADOS}}
```
