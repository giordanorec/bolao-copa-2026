# PROMPT — MATA-MATA (esboço, será preenchido na Fase 7)

> **STATUS**: rascunho. Os placeholders (`Venc. J73`, `Class. 1A`, etc.) serão substituídos pelos nomes reais dos classificados após o último jogo da fase de grupos (27/06/2026). Datas e locais já estão no calendário oficial FIFA 2026, mas confirme antes de enviar.

---

Você é um especialista em previsão de resultados de futebol e está participando do **mata-mata da Copa do Mundo FIFA 2026** num bolão contra outros modelos de IA. Sua tarefa: prever o placar exato dos **32 jogos do mata-mata** (R32, Oitavas, Quartas, Semifinal, 3º lugar, Final — 28/06 a 19/07/2026).

## Regras de pontuação do bolão (otimize para isto)

Cada palpite é pontuado assim (regras clássicas, **mata-mata vale 2×**):

| Acerto | Pontos (1×) | **Pontos no mata-mata (2×)** |
|---|---|---|
| **Placar exato** | 10 | **20** |
| **Vencedor + saldo de gols** | 7 | **14** |
| **Vencedor** (sem saldo) | 5 | **10** |
| **Empate** sem placar exato (regulamentar) | 5 | **10** |
| Nenhum acerto | 0 | 0 |

**Detalhes importantes**:
- Vale o placar do **tempo regulamentar (90 min)**. Prorrogação e pênaltis NÃO contam para o palpite de placar. Se palpitou 1×1 e foi 1×1 no regulamentar (com a classificação decidida nos pênaltis), você ganha os **10 pontos** de empate sem placar exato (ou 20 se cravou o 1×1).
- Vencer por pênaltis no jogo real **não** invalida o palpite de empate.

## Estratégia para mata-mata (pense nisto)

A geometria muda em relação à fase de grupos:

1. **2× multiplica tudo** — inclusive o downside de errar. Cravar 3×2 num jogo onde 1×0 era modal **agora custa 20 pontos** de oportunidade em vez de 10. Conservadorismo paga mais aqui.
2. **Empates são mais frequentes em mata-mata** do que parecem — muitos jogos vão para a prorrogação. Palpitar empate no regulamentar em jogos genuinamente parelhos rende **10 pontos garantidos** se houver empate aos 90, e isso acontece com frequência (≈ 25-30% dos jogos eliminatórios recentes terminaram empatados no regulamentar).
3. **Placares baixos dominam** — 1×0, 0×0, 1×1, 2×1 cobrem a grande maioria. Goleadas em mata-mata existem (Brasil 7×1, Alemanha 5×4) mas são caudais — não baseie palpites nelas.
4. **Em mismatches grandes do R32** (ex.: cabeça-de-chave do grupo forte vs melhor terceiro fraco), 2×0 e 2×1 ainda são as melhores apostas. Resista à tentação de 3×0.

## O que você pode e deve fazer

Você está **autorizado e incentivado a pesquisar na internet**:
- Caminho real dos times no bracket (quem caiu para o lado de cima/baixo, próximo adversário, descanso).
- Forma na fase de grupos (gols a favor/contra, jogos sofridos, lesões adquiridas).
- Histórico de confronto direto, especialmente em copas anteriores.
- Mercados de apostas como sinal agregado, mas sem copiar o favoritismo cegamente.

## Formato de resposta (obrigatório)

Devolva **somente** a tabela abaixo, completa, na **mesma ordem**, preenchendo as colunas **Gols A** e **Gols B** com números inteiros ≥ 0. Não adicione comentários, justificativas, notas ou colunas extras. Vale o placar do tempo regulamentar (90 min).

**Acima da tabela**, adicione UMA linha com um comentário HTML invisível identificando você. Formato exato:

```
<!-- ia: <nome> <versão>; fase: mata-mata; data: <YYYY-MM-DD> -->
```

Exemplos válidos: `<!-- ia: ChatGPT 5; fase: mata-mata; data: 2026-06-28 -->`, `<!-- ia: Claude Opus 4.7; fase: mata-mata; data: 2026-06-28 -->`.

| Jogo | Fase | Data | Hora | Local | Time A | Gols A | Gols B | Time B |
|---|---|---|---|---|---|---|---|---|
| 73 | R32 | Dom 28/06 | TBD | TBD | TBD-1A | | | TBD-3C/D/E |
| 74 | R32 | Dom 28/06 | TBD | TBD | TBD-1C | | | TBD-3D/E/F |
| 75 | R32 | Dom 28/06 | TBD | TBD | TBD-2A | | | TBD-2C |
| 76 | R32 | Dom 28/06 | TBD | TBD | TBD-1B | | | TBD-3A/D/E/F |
| 77 | R32 | Seg 29/06 | TBD | TBD | TBD-1F | | | TBD-3A/B/C |
| 78 | R32 | Seg 29/06 | TBD | TBD | TBD-2B | | | TBD-2F |
| 79 | R32 | Seg 29/06 | TBD | TBD | TBD-1E | | | TBD-3A/B/C/D |
| 80 | R32 | Seg 29/06 | TBD | TBD | TBD-2D | | | TBD-2E |
| 81 | R32 | Ter 30/06 | TBD | TBD | TBD-1H | | | TBD-3B/E/F/G |
| 82 | R32 | Ter 30/06 | TBD | TBD | TBD-1J | | | TBD-3A/H/I/L |
| 83 | R32 | Ter 30/06 | TBD | TBD | TBD-2G | | | TBD-2I |
| 84 | R32 | Ter 30/06 | TBD | TBD | TBD-2H | | | TBD-2J |
| 85 | R32 | Qua 01/07 | TBD | TBD | TBD-1G | | | TBD-3A/B/F/H |
| 86 | R32 | Qua 01/07 | TBD | TBD | TBD-1K | | | TBD-3E/H/I/J |
| 87 | R32 | Qua 01/07 | TBD | TBD | TBD-1D | | | TBD-3B/E/F/H |
| 88 | R32 | Qua 01/07 | TBD | TBD | TBD-2K | | | TBD-2L |
| 89 | Oitavas | Sáb 04/07 | TBD | TBD | Venc. J73 | | | Venc. J74 |
| 90 | Oitavas | Sáb 04/07 | TBD | TBD | Venc. J75 | | | Venc. J76 |
| 91 | Oitavas | Dom 05/07 | TBD | TBD | Venc. J77 | | | Venc. J78 |
| 92 | Oitavas | Dom 05/07 | TBD | TBD | Venc. J79 | | | Venc. J80 |
| 93 | Oitavas | Seg 06/07 | TBD | TBD | Venc. J81 | | | Venc. J82 |
| 94 | Oitavas | Seg 06/07 | TBD | TBD | Venc. J83 | | | Venc. J84 |
| 95 | Oitavas | Ter 07/07 | TBD | TBD | Venc. J85 | | | Venc. J86 |
| 96 | Oitavas | Ter 07/07 | TBD | TBD | Venc. J87 | | | Venc. J88 |
| 97 | Quartas | Qui 09/07 | TBD | TBD | Venc. J89 | | | Venc. J90 |
| 98 | Quartas | Qui 09/07 | TBD | TBD | Venc. J91 | | | Venc. J92 |
| 99 | Quartas | Sáb 11/07 | TBD | TBD | Venc. J93 | | | Venc. J94 |
| 100 | Quartas | Sáb 11/07 | TBD | TBD | Venc. J95 | | | Venc. J96 |
| 101 | Semifinal | Ter 14/07 | TBD | TBD | Venc. J97 | | | Venc. J98 |
| 102 | Semifinal | Qua 15/07 | TBD | TBD | Venc. J99 | | | Venc. J100 |
| 103 | 3º lugar | Sáb 18/07 | TBD | TBD | Perd. J101 | | | Perd. J102 |
| 104 | Final | Dom 19/07 | TBD | TBD | Venc. J101 | | | Venc. J102 |

Checklist final antes de responder: (1) o comentário HTML `<!-- ia: ... -->` está presente UMA vez acima da tabela; (2) as 32 linhas estão presentes e na mesma ordem; (3) todas as células de Gols A e Gols B estão preenchidas com inteiros ≥ 0; (4) nada além do comentário e da tabela na resposta.

---

## Notas internas (operador — apagar antes de enviar à IA)

- **Bracket placeholders**: os pares `1A vs 3C/D/E` etc. são chutes baseados no chaveamento típico de 48 times. **Confirmar com o chaveamento oficial FIFA após o sorteio do bracket** (ocorre após a última rodada da fase de grupos, ≈ 27/06/2026).
- **Datas/horários**: a FIFA divulga os horários exatos após o sorteio do mata-mata. Preencher os `TBD` antes de enviar.
- **Locais**: idem — preencher com as sedes oficiais.
- **Workflow Fase 7**: agente `llm-prompt` reabre este arquivo, substitui placeholders pelos times reais, salva como `config/prompts/ia-palpiteira-mata-mata-v1.md`, e remove esta seção de notas. Histórico da v0 fica no git.
