# 11 — Especificação de Produto (decisões firmadas)

> **Este documento é a fonte de verdade das decisões de produto/UX.**
> Tudo aqui foi decidido pelo usuário (Giordano) e **NÃO pode ser revertido sem
> perguntar antes**. Se uma implementação conflitar com algo aqui, este documento
> ganha. Ao firmar uma decisão nova, registre em `docs/DECISOES.md` (log datado)
> e atualize a seção correspondente aqui.

Histórico cronológico e racional ("por quê") ficam em `docs/DECISOES.md`.
Regras de pontuação detalhadas (casos de borda) ficam em `docs/02_REGRAS_DE_NEGOCIO.md`.

---

## 1. Ranking & Pontuação

- **Empates ocupam a MESMA colocação.** Dois com a mesma pontuação são ambos
  "1º"; o próximo é "3º" (1º, 1º, 3º — nunca 1º, 2º, 3º). Vale em **todas** as
  páginas de ranking (ranking-ias, ranking-geral, serie-a, bolão privado).
- **Pontuação clássica:** placar exato = 10 · vencedor + saldo = 7 ·
  vencedor (sem saldo) = 5 · empate sem placar exato = 5 · errado = 0.
  Mata-mata vale **2×**. (Detalhe e casos de borda em `02_REGRAS_DE_NEGOCIO.md`.)
  - Quem crava o **resultado certo mas placar errado** pontua pelo acerto de
    resultado, não como placar exato. Ex.: previu empate 1×1, resultado foi
    2×2 → 5 pts (empate), não 10.
- **Desempate por popularidade.** Quando há empate de pontos, ordena por
  popularidade da família: OpenAI > Anthropic > Google > xAI > DeepSeek >
  Microsoft > Meta > Perplexity > Mistral > Alibaba. Dentro da família, flagship/
  via-web primeiro. Implementado em `v4/lib/ias.ts:scorePopularidade`. Essa ordem
  também é o **default** das Sugestões durante o palpitar.
- **Página `/ranking-ias` ordena por pontos.** Página `/jogos` ordena por **data
  do jogo**.
- **Todo ranking mostra os pontos de cada um** — inclusive Hall da Fama
  (`/ranking-geral`) e bolão privado. Os 12 da Série A aparecem no Hall da Fama.
- **`/ranking-geral` NÃO tem coluna "Palpitou".**

## 2. Páginas & Navegação

| Rota | Propósito |
|------|-----------|
| `/ias` | **Apresentação informativa** dos modelos, agrupados por empresa, com ícones dos PRODUTOS (não bandeiras). **Sem** rank/pontos competitivos. Série A pode aparecer no topo como vitrine. |
| `/ranking-ias` | Ranking **competitivo** das IAs, ordenado por pontos. Unifica o antigo `/serie-a`. Na vitrine, ícone do produto **ao lado** do mascote (coexistem). |
| `/ranking-geral` | **Hall da Fama** — competição unificada humanos + IAs + Bola de Cristal no mesmo placar. Única página com ranking geral. Sem coluna "Palpitou". |
| `/corrida-das-ias` | Visualizações animadas do ranking (ver §4). |
| `/cristal` | Bola de Cristal: placar de consenso (mais votado entre todas as IAs). |
| `/ia/[slug]` | Palpites de uma IA, jogo a jogo. Clicar numa IA abre esta página. |
| `/jogos` | Lista de jogos ordenada por data, com **grau de confiança** por jogo; faz **scroll automático para o próximo jogo** com base na data de hoje. |

- **Clicar numa IA abre os palpites dela** (`/ia/[slug]`).
- **Mudança global = todas as páginas.** Nunca aplicar uma mudança só na home;
  replicar em todas as rotas e nos 4 idiomas.

### 2.1 Regra do "palpite × resultado real" (TODA tela que mostra palpite)

**Qualquer tela que liste palpites de um jogo já encerrado tem que mostrar,
lado a lado:**

1. **O placar palpitado** (de cada IA, humano, ou Bola de Cristal).
2. **O placar real** da partida.
3. **Os pontos ganhos** naquele palpite (pill 10/7/5/0 — verde quando cravou).
4. Marcador visual de "✓ FIM" / linha verde quando o jogo terminou; destaque
   especial (`cravou`) quando o palpite foi exato.

**Onde isso vale (mantém todas em sincronia):**

| Página | Como faz |
|---|---|
| `/ia/[slug]` | Cada linha de palpite mostra `palpite × real × pts`. Linha fica verde no placar exato. |
| `/jogo/[numero]` | Cabeçalho mostra o placar real; cada IA na grade tem pill de pts e destaque verde se cravou. |
| `/jogos` | Card de jogo encerrado mostra **placar real em destaque** (verde, grande) no lugar do consenso, com strip "X cravaram" e a previsão da Bola de Cristal marcada se acertou. |
| `/bolao/[slug]` | Cada membro do bolão abre num `<details>` mostrando, jogo a jogo (só encerrados), `palpite × real × pts`. |
| `/bolao/[slug]/palpitar` | Quando aplicável, exibe pts do palpite do próprio usuário em jogos já encerrados. |
| Hall da Fama, ranking-ias, ranking-geral | Já mostram pts totais; o **drill-down** (clicar na linha) é que abre a página com `palpite × real × pts`. |

**Helpers a reusar (não duplicar lógica):**
- `pontosJogo(palpite, jogo)` em `v4/lib/scoring.ts` — recebe o Jogo com
  `gols_a`/`gols_b` (populados pelo `v4_sync.py` quando o jogo encerra) e o
  palpite. Retorna 0 se faltar o resultado. Mata-mata 2× tratado lá dentro.
- `jogos.json` (gerado pelo pipeline) já carrega `gols_a`/`gols_b` por jogo —
  qualquer página que importa `carregarJogos()` recebe os resultados juntos.
- `resultados.json` tem só os jogos encerrados (lookup rápido).

**Quando um novo jogo é registrado** (runbook §8), o pipeline + `v4_sync.py`
atualizam `jogos.json`/`resultados.json` — todas as páginas acima passam a
mostrar o placar real + pts automaticamente, sem código novo. Se uma página
nova que mostre palpite for criada, ela **tem** que seguir esse padrão.

## 3. Série A & Mascotes

- **Série A = grupo de elite (12 modelos) com mascotes.** Os mascotes
  (personagens) **só concorrem na Série A**. Qualquer peça que mostre mascotes
  (cards, corrida, prompts de imagem/vídeo) usa **somente o ranking da Série A**,
  nunca o ranking completo.
- **Composição (12):** Claude Opus 4.8, ChatGPT 5 Thinking, Gemini 2.5 Pro,
  Grok 4 Heavy, DeepSeek R1, Microsoft Copilot, Perplexity Sonar, Meta Llama 4,
  Le Chat Mistral, Qwen 3 Max, Manus, Anthropic Fable. Config única em
  `v4/lib/serie-a.ts`.
- **Arquitetura `-web`/irmão:** os slugs `-web` são vitrines; os palpites reais
  vivem no irmão sem `-web` (`FALLBACK_NAO_WEB`). `claude-fable-5` usa slug
  próprio. Ao mostrar palpites jogo a jogo de um membro da Série A, **resolver o
  fallback** — nunca exibir "sem palpite" quando o irmão tem palpite.
- **Estética dos mascotes: realista, como bichos de pelúcia. NADA de cartoon.**
  Prompts de imagem/vídeo devem pedir textura de pelúcia/feltro, NÃO ilustração
  flat/cartoon.
- **Cada mascote tem um "fun fact"** que justifica seu visual.
- Mascote do **Manus = luva de goleiro**. Arquivos em `v4/public/mascots/`.

## 4. Corrida das IAs (visualizações)

- **Default dos seletores = Série A** (não "Todas"). Presets: Série A / Top 10 /
  Todas. Razão: no celular em pé, "Todas" vira centenas de linhas ilegíveis.
  Só carregar os nomes dos modelos quando o usuário escolher.
- **Modo A (vista de cima):** mostra a movimentação **real jogo a jogo** (guardar
  posições intermediárias), nunca interpolar direto até a posição final.
  Animação **fluida** (corrida de verdade, sem correr-e-parar). Quando uma IA
  zera um jogo, animação de "batida" (fumacinha + rodopio). **Nome à ESQUERDA**
  do ícone. Tem filtro só-Série-A.
- **Gráfico (linhas):** eixo X = jogos, eixo Y = pontos acumulados.
- **Modo D (variação):** fórmula centralizada — valores ao redor do meio, os
  melhores subindo e os piores descendo (não todos para o mesmo lado).
- **Bar race:** exibe a **logo de cada IA** (círculo branco sobreposto à barra).

## 5. UI / Mobile

- **Mobile é restrição de primeira classe.** Na corrida vista de cima, todos
  visíveis num celular na horizontal; sobreposição no meio é tolerável, mas a
  **posição final** deve ter pouca ou nenhuma sobreposição.
- **Tipografia mínima 13px** para texto de leitura no celular.
- Em cards de IA em destaque: nome do **modelo** ligeiramente menor que o do
  **produto**, mas ainda legível; nome do produto sempre cabe na linha
  (ellipsis/word-break sensato).
- **Não quebrar a diagramação** ao mudar coisas. Nomes sempre legíveis, sem
  sobreposição nas animações.

## 6. Marketing / Instagram

- **Conta oficial: @arena.das.ias.** Botão visível no site apontando pra lá
  (header + drawer + footer).
- **Cards usam os MASCOTES** (não só os ícones de marca), quando o contexto é
  Série A.
- **Conceito visual preferido (imagem/vídeo):** taça da Copa + campo de futebol +
  placar atrás mostrando o ranking atual **da Série A**. Estética pelúcia
  realista.
- **Prompts (Nano Banana / Veo) usam SÓ o ranking da Série A** e são entregues em
  **formato copiável**.
- **Cards de jogos do dia:** um card por dia com todos os jogos daquele dia
  (`marketing/scripts/gerar_cards_dia.js`).
- **Cards de celebração** quando a Bola de Cristal/IAs cravam: título escala
  ("pela 2ª vez", "pela 3ª vez"). Tom divertido, provocando curiosidade/surpresa
  (ex.: brincadeira com IAs que "secaram" o Brasil).
- Remover mensagens datadas que envelheceram (ex.: "em breve a abertura da Copa"
  depois que a Copa começou).

## 7. Tom & Idioma

- **PT-BR**, tom didático. Site e cards em **4 idiomas: pt / en / es / fr**.
- Marketing: divertido, curiosidade/surpresa, brincadeiras.
- **Nome do Claude via web = "Opus 4.8"** (não 4.7). Não deixar resíduo de "4.7"
  em lugar nenhum (inclusive animações).

## 8. Runbook — registrar resultado de um jogo

Quando o usuário informar um placar em linguagem natural (ex.: "Alemanha 7 x 1
Curaçao"), **atualizar TUDO**:

1. Localizar o jogo em `data/jogos.md` (conferir a **ordem Time A × Time B** — não
   inverter os gols). Se o usuário informar a ordem trocada, mapear corretamente.
2. Adicionar/corrigir a linha em `data/resultados/jogos.md` com os gols.
3. `.venv/Scripts/python.exe -m bolao rodada` (parse + score + cristal + ranking
   + render dos HTML nos 4 idiomas).
4. `.venv/Scripts/python.exe scripts/v4_sync.py` (sincroniza JSON pro `v4/public/`).
5. Ranking das IAs + Hall da Fama (`/ranking-geral`) atualizam sozinhos (mesma
   fonte `ranking-ias.json`). Animações (corrida, bar race, gráficos) leem os
   mesmos JSON — conferir que refletem o novo placar.
6. Commit + push (Vercel e GitHub Pages publicam no push).
   - **Pré-commit `end-of-file-fixer` mexe nos HTML no meio do commit** → o 1º
     commit não entra; **re-stage e faça um NOVO commit** (nunca `--amend`).
7. Se for caso de cravada da Bola de Cristal, considerar gerar card de celebração.

**Confirmar placares suspeitos** antes de propagar. Corrigir quando o usuário
apontar erro (ex.: era 2×2, não 1×1) refazendo do passo 2.

## 9. Workflow / Processo

- **Resultados entram em linguagem natural**; o assistente faz o resto (runbook §8).
- **"Atualize tudo" inclui as animações.**
- **Palpites pré-coletados de jogos já realizados são legítimos** (registro de
  predição anterior, não trapaça). Mecanismo: backdate do `mtime` via `touch -d`
  para dentro da janela de coleta (o guard I4 usa `mtime`). Ver `DECISOES.md`
  2026-06-14 (Copilot).
- **Alertar quando faltam palpites** de algum modelo.
- **Remover do site IAs sem palpites.**

## 10. Deploy / Domínio

- **Produção: bolao.arenadasias.com.br** — v4 (Next.js 15) na **Vercel**,
  auto-deploy no push para `main`. v1 legado (estático) no GitHub Pages,
  redirecionado pro domínio novo.
- **O pipeline de deploy já está montado — não quebrar.** Mudanças de
  config de deploy só com confirmação.
