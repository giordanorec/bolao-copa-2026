# PROMPT mata-mata REDUX — versão API (R32 · 6 confrontos definidos)

> Esta versão é enviada via **API** (OpenRouter). A IA **não tem acesso à internet**.
> Dois blocos são injetados em runtime pelo coletor: `{{DOSSIE}}` (dossiê redux
> 2026-06-28) e `{{RESULTADOS}}` (resultados oficiais dos jogos 1–72).

---

Você é um especialista em previsão de resultados de futebol e está participando do **mata-mata da Copa do Mundo FIFA 2026** num bolão contra outros modelos de IA.

**Contexto desta rodada**: a fase de grupos terminou e **6 confrontos dos 16-avos de final (R32) que antes eram projetados agora estão DEFINIDOS** — alguns mudaram de adversário. Sua tarefa: prever o placar exato **apenas destes 6 jogos**, com os adversários reais.

## Regras de pontuação do bolão (otimize para isto)

Cada palpite é pontuado assim (regras clássicas, **mata-mata vale 2×**):

| Acerto | Pontos no mata-mata (2×) |
|---|---|
| **Placar exato** | **20** |
| **Vencedor + saldo de gols** | **14** |
| **Vencedor** (sem saldo) | **10** |
| **Empate** sem placar exato (regulamentar) | **10** |
| Nenhum acerto | 0 |

**Detalhes**:
- Vale o placar do **tempo regulamentar (90 min)**. Prorrogação e pênaltis NÃO contam.
- Vencer por pênaltis no jogo real **não** invalida o palpite de empate.

## Estratégia para mata-mata

1. **2× multiplica tudo** — inclusive o downside de errar. Conservadorismo paga mais.
2. **Empates são frequentes** — palpitar empate no regulamentar em jogos parelhos rende 10 pts garantidos se houver empate aos 90.
3. **Placares baixos dominam** — 1×0, 0×0, 1×1, 2×1 cobrem a maioria.
4. **Em mismatches grandes**, 2×0 e 2×1 ainda são as melhores apostas. Resista a 3×0.

## O que você pode e deve fazer

Você recebe este prompt via **API** e **não tem acesso à internet**. Ao final há:
- `## DOSSIÊ DE REFERÊNCIA` — classificação final dos grupos, forma, notas dos 6 confrontos.
- `## RESULTADOS DOS JOGOS DA FASE DE GRUPOS` — placares reais dos jogos 1–72.

Use o dossiê e os resultados como fatos fixos; use seu próprio raciocínio para estimar placares. Não invente dados que não estejam no dossiê.

## Os 6 confrontos a palpitar (DEFINIDOS)

| Jogo | Confronto |
|---|---|
| 79 | México × Equador |
| 80 | Inglaterra × Congo (RD) |
| 82 | Bélgica × Senegal |
| 83 | Portugal × Croácia |
| 85 | Suíça × Argélia |
| 87 | Colômbia × Gana |

## Formato de resposta (obrigatório)

Devolva **somente** a tabela abaixo, completa, na **mesma ordem**, preenchendo **Gols A** e **Gols B** com inteiros ≥ 0. Não adicione comentários, justificativas nem colunas extras. Vale o placar do tempo regulamentar (90 min).

**Acima da tabela**, adicione UMA linha com um comentário HTML invisível identificando você. Formato exato:

```
<!-- ia: <nome> <versão>; fase: mata-mata; data: <YYYY-MM-DD> -->
```

| Jogo | Fase | Data | Hora | Local | Time A | Gols A | Gols B | Time B |
|---|---|---|---|---|---|---|---|---|
| 79 | R32 | Ter 30/06 | 22h00 | Cidade do México | México | | | Equador |
| 80 | R32 | Qua 01/07 | 13h00 | Atlanta | Inglaterra | | | Congo (RD) |
| 82 | R32 | Qua 01/07 | 17h00 | Seattle | Bélgica | | | Senegal |
| 83 | R32 | Qui 02/07 | 20h00 | Toronto | Portugal | | | Croácia |
| 85 | R32 | Sex 03/07 | 00h00 | Vancouver | Suíça | | | Argélia |
| 87 | R32 | Sex 03/07 | 22h30 | Kansas City | Colômbia | | | Gana |

Checklist final: (1) comentário HTML `<!-- ia: ... -->` presente UMA vez acima da tabela; (2) as **6 linhas** estão presentes e na mesma ordem (jogos 79, 80, 82, 83, 85, 87); (3) todas as células de Gols A e Gols B preenchidas com inteiros ≥ 0; (4) nada além do comentário e da tabela.

## DOSSIÊ DE REFERÊNCIA

```
{{DOSSIE}}
```

## RESULTADOS DOS JOGOS DA FASE DE GRUPOS

Resultados **reais e definitivos** dos jogos 1–72. Trate-os como fatos imutáveis.

```
{{RESULTADOS}}
```
