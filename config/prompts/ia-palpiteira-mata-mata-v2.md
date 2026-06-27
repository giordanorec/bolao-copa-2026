# PROMPT mata-mata v2 — versão API (R32 · com dossiê)

> Esta versão é enviada via **API** (OpenRouter). A IA **não tem acesso à internet**.
> Em vez disso, dois blocos de contexto são injetados em runtime pelo coletor:
>
> - `{{DOSSIE}}` → conteúdo de `data/dossie/r32-2026-06-27.md` (forma na fase de grupos,
>   lesões, suspensões, odds atualizadas, cenários dos confrontos R32).
> - `{{RESULTADOS}}` → tabela de resultados oficiais dos jogos **1–72**, extraída de
>   `data/resultados/jogos.md`.
>
> O coletor substitui ambos os placeholders antes de enviar. Todas as IAs API recebem
> exatamente os mesmos dados.
> Para coleta via interface web (com busca nativa), use
> `config/prompts/ia-palpiteira-mata-mata-web.md`.

---

Você é um especialista em previsão de resultados de futebol e está participando do **mata-mata da Copa do Mundo FIFA 2026** num bolão contra outros modelos de IA. Sua tarefa nesta rodada: prever o placar exato dos **16 jogos dos 16-avos de final (R32)** — de 28/06 a 03/07/2026.

## Regras de pontuação do bolão (otimize para isto)

Cada palpite é pontuado assim (regras clássicas, **mata-mata vale 2×**):

| Acerto | Pontos no mata-mata (2×) |
|---|---|
| **Placar exato** | **20** |
| **Vencedor + saldo de gols** | **14** |
| **Vencedor** (sem saldo) | **10** |
| **Empate** sem placar exato (regulamentar) | **10** |
| Nenhum acerto | 0 |

**Detalhes importantes**:
- Vale o placar do **tempo regulamentar (90 min)**. Prorrogação e pênaltis NÃO contam para o palpite de placar. Se palpitou 1×1 e foi 1×1 no regulamentar (com a classificação decidida nos pênaltis), você ganha os **10 pontos** de empate (ou 20 se cravou o 1×1).
- Vencer por pênaltis no jogo real **não** invalida o palpite de empate.

## Estratégia para mata-mata (pense nisto)

1. **2× multiplica tudo** — inclusive o downside de errar. Conservadorismo paga mais aqui.
2. **Empates são frequentes em mata-mata** — muitos jogos vão à prorrogação. Palpitar empate no regulamentar em jogos parelhos rende 10 pontos garantidos se houver empate aos 90 (≈ 25-30% dos eliminatórios recentes terminaram empatados no regulamentar).
3. **Placares baixos dominam** — 1×0, 0×0, 1×1, 2×1 cobrem a maioria. Goleadas existem, mas são cauda.
4. **Em mismatches grandes** (cabeça-de-chave forte vs terceiro fraco), 2×0 e 2×1 ainda são as melhores apostas. Resista a 3×0.

## O que você pode e deve fazer

Você está recebendo este prompt via **API** e **não tem acesso à internet**. Em vez disso, ao final deste prompt há:
- `## DOSSIÊ DE REFERÊNCIA` — dados pré-coletados sobre forma na fase de grupos, lesões, suspensões por cartão, odds atualizadas e análise dos confrontos R32.
- `## RESULTADOS DOS JOGOS DA FASE DE GRUPOS` — os placares reais dos jogos 1–72 já disputados.

**Diretrizes de uso:**
- **Use o dossiê** como base factual para estado atual das seleções. Não tente "lembrar" de convocações, lesões, suspensões ou resultados que não estejam nele — sua memória de treino pode estar desatualizada.
- **Use os resultados dos jogos 1–72** para confirmar classificação final dos grupos, forma recente e padrão de jogo de cada seleção ao longo da fase de grupos.
- **Use seu próprio raciocínio** sobre esses fatos: modelos de previsão de placares (Poisson bivariado, Elo/SPI, xG), contexto de mata-mata, histórico de confronto direto. O dossiê não dita placares — você decide.
- **Se um fato necessário não estiver no dossiê**, palpite com base nos sinais que tem e siga em frente. Não invente dados.
- **Mercados de apostas no dossiê**: use como probabilidade agregada, mas **não copie cegamente** — o sistema de pontuação acima premia placar exato, e odds não otimizam para isso.

## Os confrontos dos 16-avos

| Jogo | Confronto | Situação |
|---|---|---|
| 73 | África do Sul × Canadá | DEFINIDO |
| 74 | Alemanha × Paraguai | Alemanha definida; Paraguai = terceiro mais provável (28%) |
| 75 | Países Baixos × Marrocos | DEFINIDO |
| 76 | Brasil × Japão | DEFINIDO |
| 77 | França × Suécia | França definida; Suécia = terceiro mais provável (51%) |
| 78 | Costa do Marfim × Noruega | DEFINIDO |
| 79 | México × Senegal | México definido; Senegal = terceiro mais provável (46%) |
| 80 | Inglaterra × Equador | Inglaterra 1º do L mais provável (58%); Equador terceiro (20%) |
| 81 | Estados Unidos × Bósnia-Herzegovina | EUA definidos; Bósnia = terceiro mais provável (91%) |
| 82 | Bélgica × Coreia do Sul | Bélgica definida; Coreia = terceiro mais provável (28%) |
| 83 | Portugal × Gana | Portugal 2º do K mais provável (54%); Gana 2º do L (44%) |
| 84 | Espanha × Áustria | Espanha definida; Áustria 2º do J mais provável (69%) |
| 85 | Suíça × Irã | Suíça definida; Irã = terceiro mais provável (91%) |
| 86 | Argentina × Cabo Verde | Argentina 1º do J mais provável (99%); Cabo Verde definido |
| 87 | Colômbia × Croácia | Colômbia 1º do K mais provável (55%); Croácia terceiro (34%) |
| 88 | Austrália × Egito | DEFINIDO |

## Formato de resposta (obrigatório)

Devolva **somente** a tabela abaixo, completa, na **mesma ordem**, preenchendo as colunas **Gols A** e **Gols B** com inteiros ≥ 0. Não adicione comentários, justificativas, notas ou colunas extras. Vale o placar do tempo regulamentar (90 min).

**Acima da tabela**, adicione UMA linha com um comentário HTML invisível identificando você. Formato exato:

```
<!-- ia: <nome> <versão>; fase: mata-mata; data: <YYYY-MM-DD> -->
```

Exemplos válidos: `<!-- ia: ChatGPT 5; fase: mata-mata; data: 2026-06-27 -->`, `<!-- ia: Claude Opus 4.8; fase: mata-mata; data: 2026-06-27 -->`.

| Jogo | Fase | Data | Hora | Local | Time A | Gols A | Gols B | Time B |
|---|---|---|---|---|---|---|---|---|
| 73 | R32 | Dom 28/06 | 16h00 | Los Angeles | África do Sul | | | Canadá |
| 74 | R32 | Seg 29/06 | 17h30 | Boston | Alemanha | | | Paraguai |
| 75 | R32 | Seg 29/06 | 22h00 | Monterrey | Países Baixos | | | Marrocos |
| 76 | R32 | Seg 29/06 | 14h00 | Houston | Brasil | | | Japão |
| 77 | R32 | Ter 30/06 | 18h00 | Nova York/NJ | França | | | Suécia |
| 78 | R32 | Ter 30/06 | 14h00 | Dallas | Costa do Marfim | | | Noruega |
| 79 | R32 | Ter 30/06 | 22h00 | Cidade do México | México | | | Senegal |
| 80 | R32 | Qua 01/07 | 13h00 | Atlanta | Inglaterra | | | Equador |
| 81 | R32 | Qua 01/07 | 21h00 | San Francisco | Estados Unidos | | | Bósnia-Herzegovina |
| 82 | R32 | Qua 01/07 | 17h00 | Seattle | Bélgica | | | Coreia do Sul |
| 83 | R32 | Qui 02/07 | 20h00 | Toronto | Portugal | | | Gana |
| 84 | R32 | Qui 02/07 | 16h00 | Los Angeles | Espanha | | | Áustria |
| 85 | R32 | Sex 03/07 | 00h00 | Vancouver | Suíça | | | Irã |
| 86 | R32 | Sex 03/07 | 19h00 | Miami | Argentina | | | Cabo Verde |
| 87 | R32 | Sex 03/07 | 22h30 | Kansas City | Colômbia | | | Croácia |
| 88 | R32 | Sex 03/07 | 15h00 | Dallas | Austrália | | | Egito |

Checklist final antes de responder: (1) o comentário HTML `<!-- ia: ... -->` está presente UMA vez acima da tabela; (2) as **16 linhas** estão presentes e na mesma ordem (jogos 73–88); (3) todas as células de Gols A e Gols B estão preenchidas com inteiros ≥ 0; (4) nada além do comentário e da tabela na resposta; (5) os resultados dos jogos 1–72 foram usados como fatos fixos, não questionados; (6) o dossiê foi consultado como fonte primária de fatos sobre lesões, suspensões e forma.

## DOSSIÊ DE REFERÊNCIA

Abaixo está um dossiê padronizado com dados pré-coletados sobre o estado atual das seleções ao final da fase de grupos (lesões, suspensões, classificação final, odds atualizadas para os confrontos R32). **Use-o como sua fonte principal de fatos** — não tente "lembrar" de informações que não estejam nele. Você pode (e deve) usar seu raciocínio próprio sobre esses fatos para estimar placares, mas não invente fatos novos.

```
{{DOSSIE}}
```

## RESULTADOS DOS JOGOS DA FASE DE GRUPOS

Estes são os resultados **reais e definitivos** dos jogos 1–72 já disputados. Trate-os como fatos imutáveis — não os altere mentalmente nem questione. Use-os para confirmar a classificação final dos grupos e a forma recente de cada seleção.

```
{{RESULTADOS}}
```
