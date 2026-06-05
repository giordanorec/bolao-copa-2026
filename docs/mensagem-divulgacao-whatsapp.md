# Mensagem de divulgação — WhatsApp "Claude - Geral"

Texto pronto pra copiar e colar no grupo "Claude - Geral" (JID
`120363407654704841@g.us`) antes da abertura da Copa em 11/06/2026.

Prefixo `[bolao-copa]` é fixo — facilita o pessoal filtrar mensagens do
bolão dos outros papos do grupo.

---

## Versão 1 — anúncio inicial (postar até 10/06/2026)

```
[bolao-copa] Galera, montei um bolão das IAs em paralelo ao nosso lá no Dacopa.

Mesmas regras clássicas (placar exato=10, vencedor+saldo=7, vencedor=5,
empate sem placar exato=5, errado=0, mata-mata 2x), mas com 5 IAs
palpitando: ChatGPT 5, Gemini 2.5 Pro, Claude Opus 4.7, Grok 4 e
DeepSeek R1.

Cada uma recebeu o mesmo prompt e devolveu sua tabela de palpites pros
72 jogos da fase de grupos. Eu rodo a apuração aqui depois de cada
rodada e mando o ranking atualizado.

Quem vai ganhar? Aposto que o consenso vai errar feio em pelo menos um
jogo "óbvio". A gente vê.

Ranking ao vivo: compartilho aqui depois da 1ª rodada.
Bora ver IA vs IA enquanto a gente disputa o de humano.
```

---

## Versão 2 — resumo por rodada (template, postar após `python -m bolao rodada`)

Este formato é o que `python -m bolao resumo` deve produzir em
`resumo.txt`. Aqui só pra alinhar expectativa de como vai sair:

```
[bolao-copa] Rodada <YYYY-MM-DD> — <N> jogos apurados

Top 3:
1. <IA líder> — <pts> pts (<exatos> exatos, <vencedores> vencedores)
2. <IA 2ª> — <pts> pts (<exatos> exatos)
3. <IA 3ª> — <pts> pts (<exatos> exatos)

Destaques do dia:
- <Jogo placar>: <quem cravou exato> (+10) | <quem errou feio>
- Consenso errado: todas as IAs apostaram em <X>, deu <Y>
- Virada na tabela: <IA> subiu <N> posições

Ranking completo: <URL GitHub Pages ou "compartilho HTML">
```

---

## Versão 3 — fim da fase de grupos (postar em ~27/06/2026)

```
[bolao-copa] Fechou a fase de grupos. 72 jogos apurados, ranking parcial:

1. <IA1> — <pts> pts (<exatos> placares exatos)
2. <IA2> — <pts> pts
3. <IA3> — <pts> pts
4. <IA4> — <pts> pts
5. <IA5> — <pts> pts

Curiosidades:
- IA mais "exata" (mais placares cravados): <IA>
- IA mais "ousada" (menos empates palpitados): <IA>
- Maior consenso errado: <jogo + placar>
- Surpresa positiva: <IA> que ninguém esperava na briga

Agora vem o mata-mata, que vale 2x. Cada IA vai entregar novo palpite
sabendo os classificados. Quem está à frente pode perder a ponta fácil.

HTML ao vivo: <URL>
```

---

## Versão 4 — encerramento (postar pós-19/07/2026)

```
[bolao-copa] Acabou. Ranking final do Bolão das IAs:

🥇 1. <IA campeã> — <pts> pts
🥈 2. <IA vice> — <pts> pts
🥉 3. <IA 3ª> — <pts> pts
4. <IA 4ª> — <pts> pts
5. <IA 5ª> — <pts> pts

Postmortem rapidinho:
- IA que mais cravou placar exato: <IA> com <N>
- IA mais consistente (menos zerados): <IA>
- Maior fracasso individual: <IA> no jogo <X> (apostou <Y>, deu <Z>)
- IA que mais surpreendeu (pra cima ou pra baixo): <IA>

Repo público com tudo (palpites, scoring, ranking): <URL>
Obrigado quem acompanhou. Bora pra próxima.
```

> Nota: emoji 🥇🥈🥉 só na mensagem de encerramento porque é
> celebração — em mensagens de rotina, mantém texto puro pra ficar
> legível em qualquer cliente.
