# 02 — Regras de Negócio

## Regras de pontuação (clássicas)

Cada palpite vale pontos conforme o acerto:

| Acerto | Pontos |
|---|---|
| **Placar exato** | 10 |
| **Vencedor + saldo de gols** (mas placar errado) | 7 |
| **Vencedor** (sem saldo, sem placar) | 5 |
| **Empate** sem placar exato (palpitou empate, deu empate, mas placares diferentes) | 5 |
| Nenhum acerto | 0 |

**Multiplicador**: jogos de **mata-mata** (R32, Oitavas, Quartas, Semifinal, 3º lugar, Final) valem **2×** a pontuação acima. Fase de grupos vale 1×.

Vale o **placar oficial da FIFA ao final da partida**: inclui prorrogação, exclui a disputa de pênaltis. Se o jogo foi decidido nos pênaltis, registra-se o placar do final da prorrogação (ou do regulamentar, se não houve prorrogação — ex.: J74 Alemanha 1×1 Paraguai, 1-1 no regulamentar e sem gols na prorrogação, Paraguai venceu 4×3 nos pênaltis → registrado 1-1). Se o jogo foi decidido dentro da prorrogação, vale o placar final da prorrogação (ex.: J82 Bélgica 3×2 Senegal, 2-2 no regulamentar, pênalti do Tielemans no 120' → registrado 3-2). A IA que se classificou para a próxima fase pode ser apurada em separado para fins de "vencedor" do mata-mata, mas não afeta a pontuação de placar.

## Regras de leitura de palpites

- Toda IA entrega um único arquivo `.md` em `data/palpites_ias/<slug-ia>.md`.
- Slug em kebab-case minúsculo: `chatgpt-5`, `gemini-2-5-pro`, `claude-opus-4-7`, `grok-4`, `deepseek-r1`.
- O arquivo deve ter a tabela igual ao `prompt-bolao-ias.md`, com colunas `Gols A` e `Gols B` preenchidas com inteiros ≥ 0.
- Jogos não preenchidos ou inválidos (não-inteiro, negativo, fora do range 0-15) são marcados como "sem palpite" e pontuam 0.
- IAs podem atualizar seu palpite **apenas até 1 hora antes do jogo começar** (regra de antifraude). Histórico das versões é mantido em `data/palpites_ias/historico/<slug>-<timestamp>.md`.

## Regras de resultados

- Resultado é entrado em `data/resultados/jogos.md` (mesmo formato da tabela), preenchendo `Gols A` e `Gols B`.
- Edição manual pelo Giordano, ou via MCP de futebol no futuro.
- Resultado de mata-mata: registrar placar oficial da FIFA (regulamentar + prorrogação, sem pênaltis). Se decidido nos pênaltis, opcionalmente anotar quem se classificou em comentário lateral (formato: `<!-- classificado: Brasil (pen 4x3) -->`).

## Invariantes (obrigatórias)

- **I1.** Os 104 números de jogo são únicos e cobrem 1-104. Numeração FIFA oficial.
- **I2.** Toda pontuação é função pura de (palpite, resultado, fase). Mesmo input → mesmo output. Determinístico.
- **I3.** Ranking é estável: empate de pontos é desempatado por (a) número de placares exatos, (b) número de vencedores acertados, (c) ordem alfabética do slug.
- **I4.** Mudança em palpite após o início do jogo é **rejeitada** pelo parser (lock por timestamp do arquivo vs `hora` do jogo na timezone BRT).
- **I5.** Jogo sem resultado registrado não contribui para nenhum total — fica como "pendente".
- **I6.** Histórico de palpites é append-only — nunca deletar arquivos de `data/palpites_ias/historico/`.

## Casos de borda explícitos pra QA

1. **Empate palpitado, deu empate com placar diferente**: palpite 1x1, resultado 0x0 → 5 pontos (regra empate sem placar exato).
2. **Empate palpitado, deu vitória**: palpite 1x1, resultado 2x1 → 0 pontos.
3. **Vitória palpitada com saldo certo**: palpite 2x0, resultado 3x1 → 7 pontos (vencedor + saldo de 2).
4. **Vitória palpitada com placar exato**: palpite 2x0, resultado 2x0 → 10 pontos.
5. **Vitória palpitada, deu vitória do outro lado**: palpite 2x0, resultado 0x1 → 0 pontos.
6. **Vitória palpitada, deu empate**: palpite 2x0, resultado 1x1 → 0 pontos.
7. **Mata-mata com placar exato**: palpite 1x0 na final, resultado 1x0 → 20 pontos (10 × 2).
8. **Mata-mata empate-empate sem placar exato**: palpite 1x1 nas oitavas, resultado 2x2 → 10 pontos (5 × 2).
9. **Jogo sem palpite**: IA pulou. 0 pontos. Não conta como "errado", só como "não palpitou" no contador.
10. **Resultado pendente**: jogo ainda não aconteceu (sem `Gols A`/`Gols B` em resultados). Não contribui.
11. **Palpite com número fora do range** (`-1`, `99`): parser rejeita; trata como sem palpite.
12. **Edição depois do jogo começar**: parser detecta `mtime > hora_jogo - 1h` e rejeita.
