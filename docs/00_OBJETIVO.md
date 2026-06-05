# 00 — Objetivo

## O que se quer alcançar

Construir uma plataforma própria de bolão da Copa do Mundo FIFA 2026 que:

1. **Recebe palpites de modelos de IA** (ChatGPT, Gemini, Grok, Claude, DeepSeek e outros) via upload de arquivos `.md` no formato da tabela oficial.
2. **Apura placares reais** dos 104 jogos da Copa (11/06 a 19/07/2026) — manualmente ou via MCP de futebol (livescore-mcp/sportscore-mcp).
3. **Calcula pontuação** com regras clássicas de bolão.
4. **Publica ranking** atualizado em HTML estático, com possibilidade de hospedar em GitHub Pages.
5. **Gera resumos comparativos** (consensos, divergências, melhor IA, IA mais "ousada" etc.) prontos pra postar no WhatsApp.

Em paralelo, os **amigos humanos** palpitam no Dacopa (plataforma externa, fora do escopo de código). Este projeto cobre apenas o "Bolão das IAs".

## Público-alvo

- **Operador**: Giordano (sozinho). Roda os scripts no laptop.
- **Participantes**: 5+ modelos de IA. Sem login, sem UI de inscrição — Giordano cadastra cada uma colocando o arquivo `.md` correspondente em `data/palpites_ias/`.
- **Audiência**: amigos do grupo WhatsApp "Claude - Geral" que acompanham o ranking entre as rodadas.

## Escopo dentro

- Parser do formato `.md` de palpites (mesmo formato de `tabela-jogos-copa-2026.md`).
- Engine de scoring com regras clássicas (placar exato=10, vencedor+saldo=7, vencedor/empate=5, errado=0, mata-mata 2×).
- Cadastro dos resultados reais dos jogos (entrada manual via `.md` editável + opção futura de MCP de resultados).
- Ranking ao vivo (HTML estático regenerado a cada novo resultado).
- Comparativo cruzado de palpites das IAs (consenso/divergência por jogo).
- Geração de mensagens de resumo prontas para WhatsApp.

## Escopo fora

- Plataforma para humanos palpitarem (usaremos Dacopa).
- Login / autenticação / cadastro online — Giordano gerencia tudo localmente.
- App mobile.
- Banco de dados relacional (filesystem `.md`/`.json` resolve).
- Apuração automatizada em tempo real durante o jogo (só pós-jogo).
- Pilotar Dacopa programaticamente (proibido pelo ToS pra múltiplas contas; Claude in Chrome pode fazer pra Giordano-humano, mas é manual).

## Critério de sucesso

1. Até **10/06/2026** (1 dia antes da Copa): plataforma rodando localmente, com tabela de jogos carregada, pelo menos 3 palpites de IAs já parseados, e ranking inicial renderizado (com zero pontos, pois ainda não houve jogo).
2. Após cada rodada: 1-comando atualiza resultados e regenera ranking em < 30s.
3. Mensagem-resumo da rodada gerada automaticamente, copiada e colada no WhatsApp.
4. Até **fim da fase de grupos (27/06/2026)**: ranking comparativo completo das IAs com 72 jogos apurados.
5. Após a final (19/07/2026): ranking final + texto de "premiação" das IAs vencedoras.
