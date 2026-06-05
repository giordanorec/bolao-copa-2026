# Report — F4 / llm-prompt

**Agente**: llm-prompt
**Sprint**: F4 MVP (05–10/06/2026)
**Status**: idle (entregáveis prontos)

## Entregáveis

1. `config/prompts/ia-palpiteira.md` — **reescrito** com regras clássicas (10/7/5/5/0), os 72 jogos da fase de grupos preservados na mesma ordem do v0, e instrução de assinatura via comentário HTML invisível.
2. `config/prompts/ia-palpiteira-mata-mata.md` — esboço dos 32 jogos do mata-mata (R32, Oitavas, Quartas, Semis, 3º lugar, Final) com placeholders (`TBD-1A`, `Venc. J73`, etc.) e nota interna para o operador. Será preenchido na Fase 7.
3. `tests/prompts/casos.jsonl` — 10 mini-casos cobrindo todas as 5 faixas de pontuação × duas fases (grupos 1×, mata-mata 2×), incluindo `c10_sem_palpite` para o caso de IA omissa. Pronto para virar dataset de regressão quando integrarmos um "júri LLM" para validar parser/scoring cruzado.

## Diff conceitual — v0 Dacopa → v1 clássica

| Aspecto | v0 (Dacopa, descartado) | v1 (clássica, em produção) |
|---|---|---|
| Tabela | 25/18/15/12/10/0 (5 faixas) | 10/7/5/5/0 (4 faixas) |
| Empate sem placar exato | **0 pontos** ("tudo ou nada") | **5 pontos** ("empate é categórico") |
| Vencedor + saldo | 15 pts (faixa intermediária) | 7 pts (faixa intermediária única) |
| Vencedor + gols do vencedor | 18 pts (faixa explícita) | colapsa em "vencedor + saldo" = 7 pts |
| Vencedor + gols do perdedor | 12 pts | colapsa em "vencedor" simples = 5 pts |
| Multiplicador mata-mata | não existia no v0 | **2×** em todos os 32 jogos eliminatórios |
| Identificação do autor | ausente | comentário HTML `<!-- ia: <nome> <versão>; data: ... -->` no topo |
| Estratégia explícita | citada de passagem | seção dedicada com 5 heurísticas (modal, saldo, empate categórico, placares baixos, última rodada) |

Mantido idêntico: tom técnico-incentivador, autorização explícita pra pesquisar internet, formato de resposta (só a tabela), checklist final, 72 linhas dos jogos na ordem original.

## Argumentação estratégica — como as regras novas mudam o "ótimo"

A mudança mais impactante é a **categorização do empate**: no Dacopa, palpitar 1×1 num jogo que termina 0×0 dava 0 pontos — um cliff penalizador. Aqui dá **5 pontos**, igual a acertar um vencedor.

Consequências práticas:

1. **Empate genérico vira aposta de valor esperado positivo** em jogos parelhos. Antes, palpitar empate exigia cravar o placar exato (alta variância); agora, qualquer empate paga 5. Em jogos como Espanha×Uruguai, Países Baixos×Japão, ou a 3ª rodada quando ambos passam empatando, **o EV de "1×1 genérico" supera o de tentar adivinhar o vencedor improvável**.

2. **Saldo importa, mas com gradiente suave** (7 vs 5 = +40% relativo). No Dacopa o gradiente era íngreme (18 vs 10 vs 12 — três faixas só pra vitória), então valia muito esforço prever "Brasil vence por 2-1 ou 3-1?". Aqui só importa "Brasil vence por 1 gol ou 2 gols?" — uma decisão binária bem mais simples.

3. **Placar exato vale menos relativamente** (10/5 = 2× o vencedor simples, vs 25/10 = 2.5× no Dacopa). O "prêmio da audácia" é mais modesto, então a IA deve **convergir para placares modais** (1×0, 2×1, 2×0, 1×1, 0×0) e resistir à tentação de cravar 3×1 esperando o jackpot.

4. **Mata-mata 2× amplifica conservadorismo**. Erros pesam o dobro. A estratégia ótima vira "convergir para o placar modal histórico em mata-mata", que é fortemente concentrado em 1×0/2×1/0×0/1×1. Cravar goleadas em mata-mata é -EV.

5. **Sem efeito de "gols do perdedor"** — no Dacopa, 2×0 e 2×1 eram faixas separadas (vencedor + nº gols do perdedor = 12 vs vencedor + nº gols do vencedor = 18). Aqui colapsa: ambos os palpites dão 5 ou 7 (depende do saldo). Simplifica a otimização.

**Expectativa de comportamento das IAs**: convergência maior entre modelos (menos dispersão de placares), mais palpites de empate em jogos parelhos, e menos "tiros de longe" tipo 3×0 ou 4×1 (apenas em mismatches grandes tipo França×Iraque, Argentina×Argélia, Portugal×Congo RD).

## Modelo recomendado por IA participante

Critério: usar a versão **estado-da-arte com acesso à web** (necessário para pesquisar convocações, lesões, odds em junho/2026). Para cada provedor, escolha o tier que tem ferramentas de busca + raciocínio estendido.

| Provedor | Modelo recomendado | Por quê | Custo aprox. (1 prompt completo) |
|---|---|---|---|
| OpenAI | **ChatGPT 5** (não o 5-mini) | Raciocínio para EV optimization + busca web nativa. 5-mini não tem pesquisa estendida confiável. | ~ $0,15 |
| Anthropic | **Claude Opus 4.7** | Long context (1M) cabe o prompt + pesquisa; raciocínio para otimizar EV; tool use para busca. Sonnet 4.6 também aceitável e ~4× mais barato. | ~ $0,40 (Opus) / ~ $0,10 (Sonnet) |
| Google | **Gemini 2.5 Pro** | Search nativo (Google) é vantagem competitiva pra dados de convocação. Flash não recomendado pela falta de raciocínio profundo. | ~ $0,08 |
| xAI | **Grok 4** | Live X/Twitter feed dá sinal recente sobre lesões/convocações que outros modelos não veem. | ~ $0,12 |
| DeepSeek | **DeepSeek R1** (reasoner) | Único reasoner OSS disponível com web search via Tavily/Perplexity wrapper. V3 não recomendado (sem raciocínio profundo). | ~ $0,02 |

**Convenção de slug** (combinada com pipeline-dev via `docs/03_SCHEMA.md`):
- `chatgpt-5.md`
- `claude-opus-4-7.md`
- `gemini-2-5-pro.md`
- `grok-4.md`
- `deepseek-r1.md`

**Custo total estimado pra um ciclo de coleta (5 IAs × 1 prompt fase grupos + 1 prompt mata-mata)**: ~ $1,50. Trivial — não é gargalo.

## Decisões discutíveis / dúvidas

1. **Assinatura via comentário HTML** (`<!-- ia: ChatGPT 5; data: ... -->`): escolhi HTML comment em vez de YAML frontmatter porque (a) algumas IAs estripam frontmatter; (b) comentário HTML é "invisível" no preview Markdown se alguém abrir o arquivo no GitHub; (c) parser do pipeline-dev pode ignorar facilmente. **Risco**: alguma IA pode achar que "não é parte da tabela" e omitir. Mitigação: o pipeline-dev já extrai slug do nome do arquivo, então a assinatura é só auditoria — não afeta scoring.

2. **Mata-mata com placeholders genéricos**: usei `TBD-1A`, `Venc. J73` etc. baseado em chaveamento típico de 48 times. Não consultei o bracket oficial da FIFA pra 2026 (varia entre 1A×3CDE e 1A×2B dependendo da edição). **A Fase 7 vai precisar revisar contra o bracket oficial divulgado após o sorteio das fases finais (≈ 27/06/2026)**.

3. **Dataset de regressão `casos.jsonl`**: 10 casos são suficientes pra cobrir as 5 faixas × 2 fases + 1 caso de "sem palpite". Quando integrarmos LLM-júri (fora do escopo da F4), expandir para ~50 casos com placares atípicos (0×0, 5×4, etc.).

## Métricas de regressão (baseline)

Sem dataset de execução ainda — primeiro ciclo de coleta acontece 09/06/2026 com palpites das 5 IAs.

Métricas que vou medir no próximo ciclo (registrar em `reports/<rodada>/llm-prompt-regressao.md`):
- **Aderência ao formato**: % de respostas que vieram com as 72 linhas, na ordem certa, com Gols A/B inteiros.
- **Taxa de assinatura**: % de respostas com o comentário HTML correto.
- **Cobertura**: % de jogos preenchidos por IA (esperado: 100%).
- **Concentração modal**: % dos palpites em (1×0, 2×1, 2×0, 1×1, 0×0). Hipótese: > 60%, vs ~ 45% que esperaria sob v0 Dacopa.
- **Frequência de empate genérico**: % de palpites de empate. Hipótese: ≥ 12% (sobe vs v0 que punia empate errado).

## Pendências

Nenhuma bloqueante. Tudo pronto pra Giordano coletar o primeiro ciclo de palpites a partir de 09/06/2026.

## Próximos passos (fora do escopo F4)

- **Fase 5 (08–09/06)**: coletar palpites das 5 IAs, parsear, validar formato. Eu (llm-prompt) revejo casos de não-conformidade e ajusto o prompt se alguma IA recusar/quebrar.
- **Fase 7 (27/06 pós-grupos)**: substituir placeholders do mata-mata pelos times reais e abrir segundo ciclo de coleta.
