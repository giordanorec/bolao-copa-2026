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

Fonte de verdade única: `data/resultados/jogos.md`. Tudo o mais é derivado.
Se você quiser fazer sem o assistente, siga o passo a passo abaixo.

### 8.0 Regra crítica de placar em mata-mata

**Placar oficial FIFA ao final da partida**: inclui prorrogação, exclui
pênaltis. Detalhes:

- Jogo decidido nos pênaltis (0 gols no OT): registra o placar do fim da
  prorrogação (ou do regulamentar se não teve prorrogação). Ex.: J74 Alemanha
  1×1 Paraguai, 1-1 no regulamentar e no OT, Paraguai venceu 4×3 nos pênaltis
  → **registrado 1-1**.
- Jogo decidido dentro da prorrogação: vale o placar final da prorrogação.
  Ex.: J82 Bélgica 3×2 Senegal, 2-2 no regulamentar, gol do Tielemans no 120'
  → **registrado 3-2**.
- Ver §8 completa em `docs/02_REGRAS_DE_NEGOCIO.md` (fonte canônica das regras
  de scoring).

**Se anotar o classificado por pênaltis** (para bracket): comentário lateral
na linha, formato `<!-- classificado: Paraguai (pen 4x3) -->`. NÃO afeta
pontuação; ajuda o bracket em `/chaveamento` (ver `PENALTY_WINNER` em
`v4/app/chaveamento/page.tsx`).

### 8.1 Passo a passo — pipeline completo (recomendado)

Ordem obrigatória. Cada passo depende do anterior.

**1) Editar `data/resultados/jogos.md`**

- Localizar o jogo em `data/jogos.md` PRIMEIRO pra conferir a ordem
  `Time A × Time B` (não inverter os gols).
- Adicionar/corrigir a linha em `data/resultados/jogos.md` com o mesmo
  formato: `| N | Fase | Data | Hora | Local | Time A | Gols A | Gols B | Time B |`.
- Mata-mata: seguir §8.0.

**2) Rodar o pipeline Python**

```bash
.venv/Scripts/python.exe -m bolao rodada
```

Gera/atualiza:
- `web/data/{jogos,resultados,palpites,ranking,bola_de_cristal}.json`
- `web/index.html` + `web/jogos/*.html` + `web/ia/*.html` (4 idiomas)
- `reports/<data>/pontuacao.json` + `resumo.txt`

Checar o resumo: "Jogos apurados: N/104" tem que refletir os placares
novos, e o top do ranking parcial faz sentido.

**3) Rodar o sync pro v4**

```bash
.venv/Scripts/python.exe scripts/v4_sync.py
```

Copia/regenera em `v4/public/`:
- `resultados.json`, `jogos.json` (com `gols_a/gols_b` mergidos)
- `ranking-ias.json`, `ranking-ias-v2.json` (bifurcado v1 grupos + v2 grupos)
- `bola_de_cristal.json`
- `palpites_por_jogo.json`, `ias_dict.json`, `ias_paises.json`
- `analise.json` (features + clusters, 66 IAs)
- `predicoes_campeao.json` (jornada de campeão por IA — se `data/predicoes_campeao/` tem rodada)

**4) Verificar propagação (o que atualiza sozinho vs. manual)**

| Área | Como é alimentado | Precisa mexer? |
|---|---|---|
| `/ranking-ias`, `/ranking-geral` (competitivo) | `ranking-ias.json` + Supabase (humanos) | Não |
| `/analise` | `analise.json` | Não |
| `/jogos` + `/jogo/[num]` | `jogos.json` + `palpites_por_jogo.json` | Não |
| `/chaveamento` | `resultados.json` + `jogos.json` | Não |
| `/cristal`, `/ranking/hall-da-fama` | `bola_de_cristal.json` | Não |
| `/ia/[slug]` | pipeline gerou HTML estático (v1) + Next.js (v4) | Não |
| `CelebracaoMataMata` (home) | dinâmico via `resultados.json` + `palpites_por_jogo.json` | Não |
| `BannerR32` (home) | **estático**, hardcoded em `v4/components/BannerR32.tsx` | **SIM** |
| `NovoMomentoBanner`, banners pontuais | estático | SIM (se ainda relevante) |
| Instagram cards/reels (`marketing/brainstorming_instagram/`) | estático — cada jogo é um post separado | Opcional |
| Grafos por IA (`web/ia/*.html`) | pipeline regenerou no passo 2 | Não |

**5) Atualizar `BannerR32` manualmente** (se ainda estiver visível na home)

- Arquivo: `v4/components/BannerR32.tsx`.
- Padrão: bloco `<h3>{titulo}</h3><p>{linha}</p>` por jogo — copiar um
  existente e adaptar. Usar `pt/en/es/fr` (regra global: 4 idiomas).
- Adicionar entradas em `farewells` (eliminados) e `congrats` (classificados)
  com frase na língua nativa do país (padrão: idioma oficial ou majoritário).
- Atualizar `proximos` pra refletir os jogos do dia seguinte.
- Se o banner ficar longo demais (>5 jogos): considerar zerar e reiniciar
  com os últimos 3-4 jogos, migrando o resto pra retrospectiva.

**6) Instagram — cards/vídeos por jogo (opcional, task #95)**

- Dir: `marketing/brainstorming_instagram/`.
- Padrão de sequência numerada (`33_carrossel_novo-momento/`, etc.).
- Cada jogo grande gera um card + reel opcional. Não é obrigatório —
  fazer só pros jogos com narrativa (viradas, cravadas, azarões).

**7) Commit + push**

```bash
git add data/resultados/jogos.md v4/public web/data web/*.html web/en web/es web/fr web/ia web/jogos web/cristal.html v4/components/BannerR32.tsx
git commit -m "resultados: J## Time A N×M Time B (Fase)"
```

**Armadilha do pre-commit** (leia com atenção):
- `end-of-file-fixer` e `trim-trailing-whitespace` mexem em vários HTML
  no meio do commit → o 1º commit **não entra** (ele volta pra você com
  arquivos "corrigidos" não stagedos).
- Solução: **re-stage** os arquivos corrigidos e **crie um NOVO commit**.
  **NUNCA use `--amend`**: como o commit anterior não foi criado, `--amend`
  vai bater no commit ERRADO (o anterior) e pode destruir trabalho.
- Padrão que funciona sempre:
  ```bash
  git diff --name-only | grep -v "^\.claude/" > /tmp/ps.txt
  git add --pathspec-from-file=/tmp/ps.txt
  git commit -m "..."
  # Se falhar por HTML fixes:
  git diff --name-only | grep -v "^\.claude/" > /tmp/ps.txt
  git add --pathspec-from-file=/tmp/ps.txt
  git commit -m "..."   # mesmo message, é um NOVO commit
  ```

**8) Deploy — merge homologacao → main**

- Trabalho vai em `homologacao` (staging).
- Produção só publica com `main`. Fazer fast-forward:
  ```bash
  git push origin homologacao        # backup do staging
  git checkout main
  git merge --ff-only homologacao
  git push origin main               # Vercel + GH Pages publicam daqui
  git checkout homologacao
  ```
- Se `main` divergiu (raro), abortar e investigar antes de forçar.

### 8.2 Passo a passo — patch cirúrgico (só emergência)

Se por algum motivo você NÃO puder rodar o pipeline (Python quebrado,
diff enorme demais, etc.), dá pra atualizar SÓ o v4 à mão:

1. `data/resultados/jogos.md` — adicionar linha (mesmo do fluxo normal).
2. `v4/public/resultados.json` — adicionar objeto `{jogo_numero, gols_a, gols_b}`.
3. `v4/public/jogos.json` — patchar `gols_a`, `gols_b` no jogo correto.
4. `v4/public/ranking-ias.json` + `ranking-ias-v2.json` — recomputar delta
   à mão (pontos por IA baseado nos palpites em `palpites_por_jogo.json` e
   nas regras de scoring). **É fácil errar**; conferir top-8 contra Cristal.
5. `v4/public/bola_de_cristal.json` — o cristal é derivado dos palpites,
   não muda com resultado; só recalcular delta de pontuação do cristal.
6. `v4/public/analise.json` — patchar `n_jogos_encerrados` e agregados por
   perfil (exatos, vencedores, pontos, taxa_acerto). Similaridade/clusters
   podem ficar stale — próxima rodada full reconcilia.
7. **web/** NÃO É ATUALIZADO** nesse fluxo — GitHub Pages fica stale.
   Só faça pipeline full na próxima vez.
8. Commit + push + merge main (como no 8.1 passos 7-8).

**Quando isso é aceitável:** quando você precisa desbloquear rápido e sabe
que vai rodar o pipeline full na próxima. Não como padrão.

### 8.3 Confirmar placares suspeitos

- Antes de propagar, tenha CERTEZA. Web search + citar fonte (ESPN, FIFA,
  Al Jazeera, etc.) no commit body.
- Se o usuário apontar erro (ex.: era 2×2 no regulamentar, não 3×2), refazer
  do passo 1 com o placar correto e recomitar. Não confiar em memória.

### 8.4 Sanity checks pós-atualização

Depois do push, abrir `https://bolao.arenadasias.com.br` e conferir:

- Home mostra o(s) jogo(s) novo(s) na CelebracaoMataMata (top exatos).
- `/chaveamento`: bandeiras dos vencedores animam do R32 pro R16.
- `/ranking-ias`: top-3 faz sentido; a IA que cravou +14 pts subiu.
- `/jogos` no jogo específico: placar bate, palpites destaque os exatos.
- `/cristal`: se o Cristal cravou (exato ou vencedor+saldo), os pontos
  atualizaram.
- Ranking geral (humanos+IAs): rodar `carregarTodosHumanos()` é lazy;
  se `opt_in_geral=true` funcionar, a lista humanos atualiza sozinha.

## 8.2 Palpite público quando opt_in_geral=true

**Regra:** quem marca `opt_in_geral = true` no perfil **autoriza qualquer
visitante** (anônimo inclusive) a ver seus palpites no Hall da Fama. Quem
não marca, palpite só é legível pelo dono e por companheiros de bolão.

**Implementação:** RLS policy `palpite_select_opt_in_publico` em
`public.palpite` permite SELECT quando o `user_id` corresponde a um
`profiles` com `opt_in_geral=true`. Convive (via OR) com a policy
anterior `palpite_select_meu_ou_companheiro` que protege quem NÃO fez
opt-in. Migration:
`v4/sql/migrations/2026-06-17_palpite_publico_se_opt_in.sql`.

A página `/ranking-geral` continua usando `createAdminClient() ?? supabase`
como fallback (caso a service_role esteja disponível, bypassa RLS direto),
mas hoje funciona puramente via essa policy — não precisa de service_role
em produção.

## 8.1 Trava de palpite após o kickoff (SEGURANÇA)

**Regra absoluta:** ninguém pode criar, alterar ou apagar um palpite **depois
que o jogo começou**. A hora usada é a do **servidor Postgres** (`now()` em
UTC) — nunca o relógio do cliente. Não dá pra burlar trocando hora do
computador.

**Como está implementado:**

- Tabela `public.jogo (numero, kickoff timestamptz)` com a hora de cada jogo
  (104 linhas, americas/Sao_Paulo).
- Função `public.palpite_aberto(p_numero int) returns boolean` retorna
  `now() < kickoff` (e `false` se o jogo não existir — fail-closed).
- RLS policies `palpite_insert_self`, `palpite_update_self` e
  `palpite_delete_self` exigem `auth.uid() = user_id AND palpite_aberto(jogo_numero)`.
- Migration: `v4/sql/migrations/2026-06-15_lock_palpites_apos_kickoff.sql`.
  `v4/sql/schema.sql` reflete o estado atual.
- UI (`/bolao/[slug]/palpitar`): inputs ficam **disabled** nos jogos bloqueados,
  com badge "🔒 Travado". O server-side é o que de fato protege; a UI é só
  feedback.
- O `service_role` (admin) continua passando por cima de RLS. Não usar pra
  alterar palpites de usuários comuns.

**Por que tem que ser servidor:** o relógio do cliente é manipulável (basta
abrir DevTools ou trocar a hora do sistema). Validar só na UI é teatro de
segurança.

**Quando rodar a migration:** ao subir o schema num ambiente novo, rodar
**schema.sql** primeiro e depois cada migration em `v4/sql/migrations/`
em ordem cronológica. Em produção, rodar a migration nova no SQL editor do
Supabase Dashboard.

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

## 11. Palpites Atualizados (v2) — premium

> Contrato técnico detalhado: `specs/F-palpites-v2-atualizados.md`. Decidido por
> Giordano em 2026-06-22. Esta seção é o resumo de produto.

Uma **segunda leva de palpites das IAs** ("v2"), feita após as rodadas 1 e 2 da
fase de grupos, incorporando informação nova (classificação parcial, forma,
lesões, suspensões, odds atualizadas). Dois propósitos: recompensar quem
contribui financeiramente (conteúdo exclusivo por senha) e análise estatística
(v1 pré-Copa × v2 informado nos mesmos jogos).

**Decisões firmadas (não reverter sem perguntar):**

1. **Bifurcação única, só nesta janela.** v2 cobre **apenas os jogos 41–72** da
   fase de grupos que **ainda não começaram** no momento da coleta (≤ 32 jogos).
   Acabada a fase de grupos, não há mais bifurcação — o mata-mata é palpitado por
   todos numa versão única.
2. **v2 NÃO entra no bolão.** Ranking/pontuação oficiais continuam usando **só o
   v1**. v2 é artefato paralelo, isolado. Proibido tocar em `data/palpites_ias/`,
   no scoring/ranking oficiais ou nos JSONs públicos.
3. **Sem mata-mata no v2.**
4. **Gating por senha única.** Repo é público → v2 vive no **Supabase** (tabela
   `palpite_v2`, RLS sem policy de SELECT pública), servido server-side só após a
   senha. **Nada de palpite v2 commitado nem em `v4/public/`.**
5. **Todas as IAs.** API (OpenRouter, automático) + as 12 da Série A (web, manual).
6. **Página `/analise-v2`** (gated por senha; cookie httpOnly com token = sha256
   da senha, não forjável). **Link no menu só depois** de a fase de grupos acabar;
   até lá, acesso só por quem tem URL + senha.
7. **Cadeado público** nos cards dos jogos 41–72 não encerrados: selo "🔒 Palpite
   atualizado disponível" + CTA pra `/colaborar` (contribuir via Pix com e-mail no
   comentário; seguir @arena.das.ias pra receber a senha). Não expõe palpite.

**Pipeline:** `python -m bolao coletar-v2` e `python -m bolao comparar-v2`
(isolados; sem efeito no fluxo `rodada`). Upload: `scripts/upload_v2_supabase.py`.

## 12. Runbook — processar Pix / contribuições

Quando o Giordano reporta um Pix (nome, às vezes valor) ou sobe uma **foto/extrato
de Pix** no painel `/admin/contribuicoes`, o assistente processa **sozinho**.
Fonte de verdade desta mecânica; **se algo der errado, é aqui que se confere.**

### 12.1 Modelo de dados (duas tabelas, papéis distintos)

- **`contribuicoes`** = registro de **dinheiro**. Colunas: `id, nome, email,
  valor, data, hora, instagram, comprovante_url, status (rascunho|processado),
  nota, criado_em, processado_em`.
  - **Total arrecadado = SUM(valor) WHERE status='processado'.**
  - O **selo** de cada pessoa vem do SUM(valor) agrupado por email:
    ≥50 Padrinho 👑 · ≥25 Mantenedor 🛟 · ≥10 Apoiador 💛 · R$0 Cortesia 🎁.
- **`contribuintes`** = **allowlist de acesso** à Análise v2 (PK `email`, cols
  `nome, instagram, nota, liberado_em`). **Só dá acesso — não registra dinheiro.**

> **A regra que eu esqueci (2026-06-25):** processar um Pix são **DUAS gravações**.
> Liberar em `contribuintes` (acesso) **E** criar a linha em `contribuicoes`
> (dinheiro). Liberar sem gravar a contribuição deixa o total parado e a pessoa
> aparece como **Cortesia R$0** em vez de Apoiador. Nunca fazer só metade.

### 12.2 Estados — TODO Pix processado vira **liberado** OU **pendente**

Não existe meio-termo. Depois de processar uma imagem, **nada** pode ficar como
"📷 Foto de Pix (a identificar)" nem como rascunho valor=0.

- **Liberado** (casou com uma conta, confiança ≥ média): linha em `contribuicoes`
  com `status='processado'`, `email` preenchido, `nome` completo, `valor`; **e**
  upsert em `contribuintes` (`on_conflict=email`, `Prefer: resolution=merge-duplicates`).
- **Pendente** (não achou conta): linha em `contribuicoes` com `status='processado'`,
  **`email=null`**, mas **com `nome` completo e `valor`** — assim o dinheiro **conta**
  e a pessoa fica listada na fila de pendentes pra identificar depois (quando criar
  conta, usar `identificarPendente`). **Nunca** deixar a pessoa fora do registro.

### 12.3 Foto/extrato de Pix (1+ contribuintes)

O form "📷 Foto de Pix" cria **um** rascunho placeholder `nome="📷 Foto de Pix
(a identificar)"` valor=0, só com a imagem. Esse placeholder é um **container**:

1. Baixar a imagem do bucket `comprovantes` (Storage API) e **ler cada Pix**
   (nome + valor). Pix **não traz email** → cruzar cada nome com as contas
   (`profiles.display_name` → pega `id` → `auth.users` por id pega o email;
   casar também contra a parte local do email, iniciais contam).
2. Cada Pix vira **uma** linha de `contribuicoes` → liberado ou pendente (§12.2).
   Não duplicar quem já tem linha de extrato anterior.
3. **Apagar o placeholder** depois de desdobrado (a info da imagem já foi
   processada → é ignorada). Precedente: id 69 foi apagado ao virar 70.
   **Nunca** deixar o placeholder como processado valor=0 — isso é o "pix não
   identificado" que polui a lista.

### 12.4 Mecânica (service_role direto no PostgREST)

Credenciais em `v4/.env.local` (`NEXT_PUBLIC_SUPABASE_URL` +
`SUPABASE_SERVICE_ROLE_KEY`) — **nunca pedir ao Giordano**. Acentos no corpo do
curl (`-d`) causam PGRST102/falha silenciosa → **sempre `--data-binary @arquivo.json`**.
Saída Python no Git Bash: `PYTHONIOENCODING=utf-8`.

- Guardar **nome completo** em `contribuicoes.nome` E `contribuintes.nome` (Giordano
  confere a lista pelo nome; nome truncado = ele acha que a pessoa não foi liberada).
- Regra de confiança: **"melhor liberar por engano do que barrar quem pagou"**
  (confiança ≥ média ⇒ liberar direto, sem perguntar).
