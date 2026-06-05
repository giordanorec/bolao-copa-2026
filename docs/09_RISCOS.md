# 09 — Riscos

Cada risco tem mitigação. Arquiteto monitora; cada agente lê este arquivo antes de começar.

## R1. Bug no scoring → ranking inteiro inválido

**Risco**: regras clássicas têm 5 níveis de pontuação (10/7/5/5/0) + multiplicador. Fácil errar a hierarquia (ex: "vencedor + saldo" vs "vencedor + gols do vencedor"). Um bug aqui torna o ranking inteiro inconfiável durante a Copa.

**Mitigação**:
- Os 12 casos de borda do `02_REGRAS_DE_NEGOCIO.md` viram testes obrigatórios.
- `qa-tester` valida com fixtures conhecidas antes de cada release.
- Função de scoring é pura, determinística → fácil de testar.
- Pre-commit roda `pytest -x` antes de cada commit.

## R2. Prazo apertado (6 dias) → entrega incompleta

**Risco**: Copa começa 11/06/2026, hoje é 05/06. Fase 4 (MVP) precisa estar pronta antes de 10/06.

**Mitigação**:
- Escopo do MVP foi propositalmente mínimo: parse + score + ranking + HTML básico. Sem comparativo cross-IA sofisticado, sem MCP de resultados, sem comparativo com humanos no Dacopa.
- Spec da Fase 4 é única e bem delimitada.
- Agentes spawnados em paralelo permitem trabalho concorrente em src/, tests/, web/, config/prompts/.
- Time pequeno (7) para reduzir overhead de coordenação.

## R3. Formato `.md` das IAs vem fora do padrão

**Risco**: cada IA pode interpretar o prompt de forma levemente diferente — colunas trocadas, números escritos por extenso, comentários no meio da tabela, IA recusa, etc.

**Mitigação**:
- Parser robusto: regex tolerante a espaçamento, mas estrito quanto a estrutura.
- Erro de parse não derruba outros arquivos; lista consolidada no fim.
- Mensagem clara: `chatgpt-5.md:linha 47: 'Gols A' não é número inteiro: 'um'`.
- Giordano tem opção de editar o `.md` manualmente para corrigir.
- Prompt das IAs (Fase 4 do `llm-prompt`) inclui checklist final de validação para o modelo conferir antes de responder.

## R4. IA "atualiza" palpite depois do jogo começar

**Risco**: Giordano cola palpite, IA percebe erro depois, edita o arquivo. Vira fraude.

**Mitigação**:
- Parser detecta `mtime > hora_jogo - 1h` e rejeita o palpite para aquele jogo (vale o histórico anterior).
- Histórico append-only em `data/palpites_ias/historico/` permite auditoria.
- Commit por rodada cristaliza estado.

## R5. Resultados entrados manualmente errados

**Risco**: Giordano digita resultado errado → ranking inteiro fica torto até alguém perceber.

**Mitigação**:
- `python -m bolao score` exibe **diff** vs última pontuação salva. Mudanças bruscas (uma IA que sobe 200 pontos de uma vez) ficam visíveis.
- Posts do WhatsApp incluem placar oficial visível → amigos detectam typo rapidamente.
- Quando MCP de resultados for plugado (pós-MVP), passa a ser fonte primária; manual vira fallback.

## R6. Conflito de horários: dois jogos simultâneos no fim da fase de grupos

**Risco**: na última rodada da fase de grupos (24-27/06) dois jogos do mesmo grupo começam ao mesmo tempo. Parser precisa estar OK com isso.

**Mitigação**:
- Esquema não pressupõe unicidade temporal — só `numero` é único.
- Testes cobrem fixture com 2 jogos em mesmo `data`+`hora`.

## R7. GitHub Pages expõe palpites antes do jogo começar

**Risco**: Se Giordano fizer `git push` cedo demais, IAs concorrentes podem ler os palpites das outras antes de palpitar.

**Mitigação**:
- Repo é **privado** até o fim da fase de grupos.
- Só vira público após 27/06/2026 (quando todos os 72 palpites já estão cristalizados e os jogos jogados).
- Para visualização durante a fase de grupos: rodar localmente (`python -m bolao serve`).

---

## Riscos comuns em projetos multi-agente persistente (do template)

- **Dois agentes tocam a mesma coisa** — `01_ARQUITETURA.md` define divisão explícita; Arquiteto revisa specs antes de despachar e rejeita sobreposição.
- **Concorrência humano vs Arquiteto** — `drive.sh` respeita `status/` `human_driving`; `take_over.sh` seta e resseta.
- **Sessões crescendo demais** — Arquiteto roda `/compact` pós-feature; memória principal mora em `memory/`, não no history.
- **Gargalo no Arquiteto** — specs bem escritas deixam especialistas autônomos por mais tempo; reports em lote.
