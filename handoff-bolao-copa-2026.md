# Handoff — Projeto Bolão da Copa 2026

> Resumo da sessão de 05/06/2026 (Cowork, pasta "Bolao da Copa"). Serve para retomar o trabalho em qualquer sessão futura.

## Objetivo do projeto

Organizar um bolão da Copa do Mundo 2026 com duas frentes:

1. **Bolão humano** — amigos palpitando em plataforma online.
2. **Bolão das IAs** — comparar palpites dos principais modelos de IA (ChatGPT, Gemini, Grok, Claude, DeepSeek etc.), todos recebendo o mesmo prompt, com liberdade de pesquisa na internet.

## Arquivos na pasta

| Arquivo | Conteúdo |
|---|---|
| `tabela-jogos-copa-2026.md` | Os 104 jogos (72 grupos + 32 mata-mata), horário de Brasília, colunas: Jogo (nº oficial FIFA), Fase, Data, Hora, Local, Time A, Gols A (vazia), Gols B (vazia), Time B. Mata-mata com placeholders ("1º Grupo A", "Venc. J74"). |
| `prompt-bolao-ias.md` | Prompt único para colar em cada IA (copiar abaixo da linha `---`). Pede placar dos 72 jogos de grupos, devolvendo a tabela idêntica preenchida. |
| `handoff-bolao-copa-2026.md` | Este arquivo. |

## Decisões tomadas

- **Escopo dos palpites das IAs**: por enquanto só os 72 jogos da fase de grupos; mata-mata será palpitado quando os confrontos forem definidos.
- **Plataforma do bolão humano**: **Dacopa** (dacopa.com) — grátis, sem anúncios, sem limite de participantes, entrada por link (WhatsApp), ranking ao vivo, web+iOS+Android. Alternativa avaliada: Bolão AI (WhatsApp nativo, mas grátis só até 15 pessoas, com anúncios).
- **Regras de pontuação** (Dacopa, embutidas no prompt): placar exato 25 · vencedor+gols do vencedor 18 · vencedor+saldo 15 · vencedor+gols do perdedor 12 · só vencedor 10 · nada 0. Empate com placar errado = 0. Vale o tempo regulamentar. Mata-mata vale 2×.
- **Formato de resposta das IAs**: somente a tabela idêntica preenchida (Gols A/Gols B inteiros), mesma ordem, sem comentários — para comparação mecânica/automatizável.
- **Estratégia pedida às IAs**: maximizar valor esperado de pontos (não acertos de vencedor); odds podem ser consultadas mas não copiadas cegamente.

## Fatos importantes da tabela

- Fontes cruzadas: Trivela, Sky Sports (árbitro de horários), WorldCuply, Wikipedia (chaveamento).
- A Trivela tinha erros corrigidos: jogos de madrugada com dia trocado (ex.: Austrália×Turquia é 14/06 01h00 BRT) e a 2ª semifinal é em **Atlanta** (não Dallas).
- Verificação: 104 jogos, numeração FIFA 1–104 sem repetição.
- Copa: 11/06 a 19/07/2026. Abertura: México × África do Sul. Final: Nova York/NJ. Brasil no Grupo C: Marrocos (13/06 19h), Haiti (19/06 21h30), Escócia (24/06 19h).

## Automação (pesquisado)

- **Nenhuma plataforma de bolão tem MCP/API oficial** (Dacopa, Bolão AI, Superbru...).
- **Kicktipp**: única com automação madura não-oficial (bots Python no GitHub: antonengelhardt/kicktipp-bot, schwalle/kicktipp-betbot) — scraping, risco de ToS.
- **MCPs de dados de futebol** (para apuração automática de resultados): livescore-mcp, soccer-mcp-server, sportscore-mcp (GitHub).
- **Claude in Chrome está conectado** no Mac: Claude pode pilotar o Dacopa (preencher palpites em lote lendo da tabela .md). Login sempre feito pelo Giordano (Claude não cria contas nem digita senhas). Atenção: Dacopa proíbe múltiplas contas por pessoa — para as IAs, a via limpa é apuração fora da plataforma.
- **Arquitetura recomendada**: humanos no Dacopa; bolão das IAs apurado pelo Claude (tabelas .md + MCP de resultados + ranking automático + posts no WhatsApp).

## Próximos passos

1. Giordano cola o prompt em cada IA e traz as tabelas preenchidas.
2. Claude consolida comparativo dos palpites (e aponta consensos/divergências).
3. (Opcional) Teste-piloto do Claude pilotando o Dacopa via Chrome: bolão fake + ~5 palpites.
4. (Opcional) Instalar/testar livescore-mcp para apuração automática de resultados.
5. Criar o bolão real no Dacopa e divulgar o link.
6. Quando a fase de grupos definir os classificados: gerar palpites do mata-mata (mesmo processo).

## Convenções da sessão

- Espelhar respostas substantivas no grupo WhatsApp "Claude - Geral" (JID 120363407654704841@g.us), prefixo `[<ctx>]`.
- Comunicação em PT-BR, tom didático, perguntar antes de bifurcações relevantes.
