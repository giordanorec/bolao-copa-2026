# DECISOES.md — log cronológico vivo

Cada entrada é **uma decisão não-trivial** com contexto. Preencher **no mesmo commit** que materializa a decisão.

Formato: `## YYYY-MM-DD — título curto` + seções *Contexto*, *Decisão*, *Por quê / alternativas*, *Consequências*.

---

## 2026-06-22 — v2: acesso por conta (allowlist) + liberação inline na /jogos + unlock via Instagram

### Contexto

A v2 nasceu com gate por **senha compartilhada** (cookie = hash da senha). Senha
única vaza fácil e não identifica quem contribuiu. Giordano quer amarrar o acesso
à **conta** da pessoa e, no fluxo de contribuição, fazer o contribuinte **mandar o
e-mail da conta pelo Instagram @arena.das.ias** — de propósito, pra puxar quem
acessa o site a seguir/assinar a conta e manter o canal de comunicação por lá.

### Decisão

- **Allowlist por conta:** tabela `public.contribuintes` (`email` PK, lower/trim
  por trigger; RLS sem policy de SELECT — só service_role). `isContribuinte(email)`
  em `lib/admin.ts`: admin curto-circuita `true` (grec@cin.ufpe.br funciona sem a
  tabela), demais consultam a allowlist. Fail-closed sem service_role.
- **Gate /analise-v2:** liberado = autenticado-na-allowlist **ou** admin; **senha
  permanece como fallback temporário** (divisor "ou use a senha"). Quem está
  logado mas fora da allowlist vê CTA pra `/colaborar`; quem não está logado vê
  CTA de login (`/login?redirect=/analise-v2`). Contribuinte logado vê banner de
  agradecimento (na /analise-v2 e na home, via `AgradecimentoContribuinte`).
- **/jogos inline:** pra contribuinte, jogos 41–72 não-encerrados trocam o
  `CadeadoV2` por `V2Revelado` (consenso v2 no card + link pro raio-x
  `/analise-v2#<jogo>`). v2 lido server-side só após confirmar direito
  (`carregarV2PorJogo`/`consensoV2` em `lib/palpites-v2.ts`). v2 cobre só 41–72,
  então **complementa** a /jogos (104 jogos), não a substitui.
- **Bug "nova na v2" corrigido:** v1 usa slug base, v2 usa sufixo `-web`; resolver
  `v1Para()` (exato → alias `claude-opus-4-8-web→claude-opus-4-7` → tira `-web`).
  O modal de comparação agora **sempre** mostra o placar v2 (antes só quando mudava).
- **/colaborar:** seção "Último passo: libere os palpites v2" com CTA pro
  Instagram pedindo (1) quem contribuiu e (2) o **e-mail da conta** — sem senha.

### Por quê / alternativas

- Conta > senha: identifica o contribuinte, permite revogar individualmente e some
  com o vazamento de senha única. Senha fica só como ponte até a allowlist encher.
- Unlock por Instagram (não in-site): decisão de marketing — converter visitante
  em seguidor pra comunicação contínua vale o atrito de um DM manual.

### Consequências

- Requer rodar `v4/sql/migrations/2026-06-22_contribuintes.sql` no Supabase pra
  liberar e-mails não-admin. Liberação é manual (inserir e-mail na tabela após o DM).
- Ler `cookies()`/`getUser()` torna /jogos e a home dinâmicas (custo aceito p/
  conteúdo por-usuário).

---

## 2026-06-22 — v2: recall dos palpites v1 por IA + dossiê enriquecido

### Contexto

Antes de coletar a v2, Giordano pediu duas coisas: (1) **relembrar cada IA do que
ela mesma palpitou na v1** (para reconsiderar à luz dos resultados), e (2) uma
**super-varredura** de informação nova (lesões, suspensões, forma, odds) num MD
rico para distribuir junto do prompt e também colar nas versões web.

### Decisão

- **Placeholder `{{PALPITES_V1}}`** nos dois prompts v2 (API e web). Na coleta API
  (`coletar-v2`), é substituído **por IA**, dentro de `_processar`, pela tabela
  dos palpites v1 daquela própria IA para os jogos 41–72 (helper
  `_tabela_palpites_v1` em `src/bolao/v2.py`). `{{DOSSIE}}` e `{{RESULTADOS}}`
  continuam globais (iguais p/ todas).
- **Web:** `scripts/gerar_recall_v1.py` gera, por IA da Série A, o prompt web
  completo já com o recall preenchido em `data/recall_v1/<slug>.web.md`. O v1 das
  IAs web está nos slugs **sem** `-web` (a variante web era placeholder em v1);
  override: `claude-opus-4-8-web → claude-opus-4-7` (Opus 4.8 nunca foi coletado
  via API em v1, usa-se o Opus mais recente que palpitou).
- **Dossiê** `data/dossie/v2-2026-06-22.md` enriquecido com dados reais por grupo
  (lesões com fonte, odds de grupo/confronto), preservando "sem dado confiável"
  onde não há fonte. Cartões de Eliminatórias **não** acumulam na Copa.

### Por quê / alternativas

- Injeção **por IA** (não global) porque cada IA só deve ver o próprio histórico —
  mostrar o de todas viciaria/confundiria. Tom do prompt: "mantenha onde fizer
  sentido, ajuste onde a info nova muda a leitura" (não mudar por mudar).
- Gerar o prompt web inteiro por IA (vs. só o bloco de recall) deixa pronto pra
  colar, reduzindo erro operacional na coleta manual das 12 da Série A.

### Consequências

- `coletar-v2` agora lê `data/palpites_ias/` (somente leitura) para o recall.
  Continua sem tocar saídas públicas. Pre-commit (ruff+mypy --strict) e os testes
  passam.

---

## 2026-06-22 — Palpites Atualizados (v2): bifurcação premium informada

### Contexto

Já passaram ~2 rodadas da fase de grupos e o público cobra atualização. Giordano
quer oferecer uma **segunda leva de palpites das IAs** ("v2"), feita agora com
informação nova (classificação parcial, forma, lesões, suspensões, odds), como
**recompensa a quem contribui financeiramente** e como **análise estatística**
(v1 pré-Copa × v2 informado). Risco central: o repo é **público** — qualquer
arquivo/JSON commitado vaza o conteúdo premium. E não pode poluir nem quebrar o
bolão oficial que já está no ar.

### Decisão

- **Escopo:** v2 = jogos **41–72** da fase de grupos ainda não iniciados (≤ 32).
  Sem mata-mata (versão única depois). v2 **não entra no ranking/scoring oficiais**.
- **Isolamento absoluto:** comandos v2 não tocam `data/palpites_ias/` (v1),
  `web/data/*.json`, `v4/public/*.json`, ranking, cristal nem o fluxo `rodada`.
- **Armazenamento + gate:** tabela Supabase `palpite_v2` com RLS habilitado e
  **sem policy de SELECT** (só `service_role` lê, server-side). Página
  `/analise-v2` valida senha (`ANALISE_SENHA`), seta cookie httpOnly cujo valor é
  **sha256(`analise-v2:${senha}`)** — não forjável. Cadeado público nos cards
  41–72 com CTA pra `/colaborar` (Pix + e-mail no comentário + seguir
  @arena.das.ias pra receber a senha). Link de menu pra `/analise-v2` só após a
  fase de grupos.
- **Coleta:** todas as IAs. API via OpenRouter (`python -m bolao coletar-v2`,
  prompt `config/prompts/ia-palpiteira-v2.md`); as 12 da Série A manualmente via
  web (prompt `-v2-web.md`, guia em `docs/GUIA_COLETA_V2_WEB.md`). Comparação:
  `python -m bolao comparar-v2` → `data/analise_v2.json` (gitignored).
- **Arquivos gitignored:** `data/palpites_v2/`, `data/analise_v2.json`.
- **Processo:** seguido o fluxo multiagentes_giordano — discovery → especificação
  (`specs/F-palpites-v2-atualizados.md`) → orquestração de 6+ agentes em paralelo
  (dossiê, prompts, pipeline, dba/Supabase, frontend, docs) com o arquiteto
  integrando. Agentes não commitam.

### Por quê / alternativas

- **Supabase em vez de arquivo/JSON commitado:** num repo público, "senha" só
  significa algo se o dado nunca sai do servidor sem ela. RLS sem SELECT público
  + service_role server-side é o único gate real.
- **Cookie = hash da senha, não valor fixo:** um cookie `"ok"` seria burlável por
  qualquer um que o setasse no DevTools/curl. O hash exige conhecer a senha.
- **Rota `/analise-v2` separada da `/analise` existente:** `/analise` já é um
  painel exploratório público em produção; não dá pra colidir nem expor v2 nele.

### Consequências

- v1 e o bolão oficial intactos. v2 é artefato paralelo, premium, isolado.
- Fase 2 (aberto): métrica/visual final da comparação na `/analise-v2`; rotação
  de senha por lote de contribuintes.

### Housekeeping desta sessão (docs internos de marketing, não commitados a pedido)

- **Mascotes (carrosséis Instagram):** corrigida a lore em
  `marketing/scripts/brainstorm/mascotes_carrossel.js` e
  `marketing/brainstorming_instagram/ideacao/MASCOTES_CONCEITOS.md` —
  Meta Llama (nome vem de LLM; destacar óculos VR Meta Quest), Le Chat (Mistral é
  empresa **francesa**, daí as referências à França), Manus (o ícone é uma mão
  estalando os dedos), Fable (irmão do **Claude Opus**, não "do Claude").

---

## 2026-06-15 — Trava de palpite após kickoff (server-side via RLS)

### Contexto

**Bug grave de produto:** no `/bolao/[slug]/palpitar` o usuário conseguia
alterar/apagar palpite de jogo que **já tinha terminado**. A RLS antiga
(`auth.uid() = user_id`) protegia "quem é o dono", mas não havia gate de
**tempo**. O cliente fazia upsert direto no Supabase via anon key — não
passava por server route — então qualquer trava só no React seria teatro
de segurança (basta abrir DevTools).

### Decisão

- Criada tabela `public.jogo (numero PK, kickoff timestamptz)` com os 104
  jogos. Migration: `v4/sql/migrations/2026-06-15_lock_palpites_apos_kickoff.sql`.
- Criada função `public.palpite_aberto(int)` que retorna `now() < kickoff`
  (fail-closed: se jogo não existir, retorna false).
- Reescritas as policies `palpite_insert_self/update_self/delete_self` pra
  exigir `auth.uid() = user_id AND palpite_aberto(jogo_numero)`.
- `schema.sql` atualizado pra refletir o estado pós-migration.
- UI (`PalpitarForm`): inputs ficam `disabled` em jogos bloqueados, com
  badge "🔒 Travado". Não dispara save. "Apagar todos" só apaga os abertos
  (msg do confirm avisa). `aplicarLote` pula bloqueados.
- §8.1 da especificação documenta a regra e o "por que servidor, não cliente".

### Por quê / alternativas

Alternativa rejeitada: validar só no front-end + chamar uma API route.
Validar só no front quebra com 30s de DevTools. Uma API route adicionaria
um proxy entre o cliente e o Supabase, mas a complexidade extra não vale —
RLS direto no banco é a defesa correta e mais simples (uma policy bem
escrita > N endpoints com checks duplicados).

Alternativa rejeitada: usar a coluna `data`/`hora` direto na função.
`data`/`hora` está em strings e timezone implícito. Tabela separada com
`timestamptz` é tipo certo, idempotente, e queryável.

### Consequências

- Precisa rodar a migration **uma vez** em prod (Supabase SQL editor) —
  procedimento documentado na própria migration e em §8.1 da especificação.
- Qualquer alteração futura no horário de um jogo deve `update jogo set
  kickoff = ... where numero = X` via service_role (admin).
- Bloqueio é absoluto: nem o próprio dono consegue burlar.

---

## 2026-06-15 — Regra do "palpite × resultado real" em toda tela de palpite

### Contexto

Usuário pediu para que, nas telas que listam palpites (ex.: `/ia/claude-sonnet-4-5`,
`/jogos`, páginas de bolão), apareça não só o placar palpitado mas também o
**resultado real** depois que o jogo terminou, **quem acertou**, **quantos pts**
fez, e quem errou. Sem essa visão, ver o palpite isolado pós-jogo é frustrante.

### Decisão

- `/ia/[slug]`: cada linha de palpite agora mostra `palpite × real × pts` (pill
  10/7/5/0). Linha em verde quando o palpite foi exato; badge "✓ FIM" no header
  da linha quando o jogo encerrou.
- `/jogos`: card de jogo encerrado troca o "consenso da Bola de Cristal" pelo
  **placar real em destaque** (verde, grande) e adiciona strip "X cravaram /
  totalIAs · 🔮 X×Y" indicando quantas IAs acertaram e o palpite da Bola de
  Cristal (verde se acertou). Jogo não encerrado segue como estava (consenso +
  topIAs + grau de confiança).
- `/jogo/[numero]`: já mostrava placar real + pts por IA; nada a mudar.
- `/bolao/[slug]`: `RankingDoBolao` refatorado — tabela virou lista de
  `<details>` por membro. Resumo (rank, nome, palpitou, pts) sempre visível;
  abrir mostra cada jogo encerrado com `palpite × real × pts`. Aplica a regra de
  empate = mesma colocação que já vale nas outras páginas.
- **§2.1 da especificação** documenta a regra, a tabela de páginas afetadas, e
  os helpers a reusar (`pontosJogo` + `jogos.json` com `gols_a`/`gols_b`).
- Memória do projeto atualizada com a regra resumida.

### Por quê / alternativas

Alternativa rejeitada: criar uma rota `/bolao/[slug]/membro/[uid]` para drill-down.
Mais "limpo" arquiteturalmente mas adiciona route + RLS extra; o `<details>` em
HTML resolve com zero JS e os dados já estavam carregados em
`RankingDoBolao`. Cabia perfeitamente.

Outra alternativa rejeitada: criar um componente compartilhado
`<PalpiteLinha>`. Cada página tem layout próprio (lista vertical, grid de cards,
linha de tabela) — abstrair agora seria prematuro. O helper compartilhado é o
`pontosJogo` (já existia em `v4/lib/scoring.ts`).

### Consequências

- Novo jogo registrado → pipeline + `v4_sync.py` atualizam `jogos.json` →
  todas as telas acima já refletem o placar real + pts sem código novo.
- Páginas de palpite criadas no futuro **devem** seguir o padrão da §2.1.

---

## 2026-06-14 — Consolidação das decisões de produto em especificação

### Contexto

Ao longo da sessão o usuário percebeu que decisões já firmadas estavam sendo
esquecidas/revertidas (exemplo citado: "empates aparecem na mesma colocação").
Pediu que toda a sessão fosse relida e que as decisões fossem gravadas em
documentação permanente — especificação do sistema + `CLAUDE.md` (+ memória e
`AGENTS.md` se fizesse sentido) — para a gestão melhorar e nada mais ser desfeito.

### Decisão

- Criado **`docs/11_ESPECIFICACAO_PRODUTO.md`** como fonte de verdade de
  produto/UX (ranking, páginas, Série A & mascotes, corrida/visualizações,
  UI/mobile, marketing, tom/idioma, runbook de resultado, deploy).
- **`CLAUDE.md`** ganhou seção "⚠️ Antes de mexer: decisões firmadas" + contexto
  do v4 + runbook de registrar resultado, e passou a apontar a especificação como
  leitura obrigatória antes do DECISOES.
- Criado **`AGENTS.md`** na raiz apontando para CLAUDE.md + especificação (regra
  cardinal: não reverter decisão firmada sem perguntar).
- Memória `project_decisoes_v4.md` atualizada com as decisões novas da sessão.

### Decisões novas firmadas nesta sessão (antes dispersas)

- Mascotes **só concorrem na Série A**; cards/prompts de imagem usam só o ranking
  da Série A. Estética dos mascotes = **pelúcia realista, nada de cartoon**.
- Conta Instagram oficial **@arena.das.ias** com botão visível (header/drawer/footer).
- Conceito visual de marketing: taça + campo + placar do ranking da Série A atrás.
- Prompts de imagem/vídeo entregues em **formato copiável**.
- Resultado de jogo é informado em linguagem natural → assistente roda o
  **runbook** completo (inclui conferir ordem Time A × Time B e atualizar animações).
- Claude via web = **"Opus 4.8"** (sem resíduo de 4.7).
- `/corrida-das-ias` default = Série A; Modo A com movimentação real + batida +
  nome à esquerda; bar race com logo de cada IA.

### Consequências

- Próximas sessões devem ler `11_ESPECIFICACAO_PRODUTO.md` antes de mexer em
  ranking/páginas/animações/mascotes. Conflito → especificação ganha.
- Toda decisão nova: registrar aqui (datado) **e** refletir na especificação.

---

## 2026-06-14 — Copilot: palpites pré-jogo completos (1-72) e backdate de mtime

### Contexto

O Microsoft Copilot tinha sido salvo só parcialmente (jogos 1-58) e com `mtime`
de 2026-06-13 — depois de 8 jogos já terem rolado. O guard de integridade I4
(`parser.py`: rejeita palpite se `mtime` do arquivo > início do jogo − 1h)
barrava os 7 jogos já realizados, deixando o Copilot com 0 ponto. O operador
confirmou que esses palpites foram **colhidos antes do apito inicial** (são
predições genuinamente anteriores), e que a falha foi não ter alertado que
faltavam os palpites do Copilot.

### Decisão

- Conjunto completo gravado: jogos **1-72**.
- `mtime` do arquivo backdatado pra **2026-06-06 12:00 BRT** (mesma janela das
  outras coletas web da Série A), fazendo o guard I4 aceitar todos os jogos,
  inclusive os já realizados.
- Header marca `coletado_em: 2026-06-06` + nota explicando a coleta pré-jogo.

### Por quê / alternativas

O guard I4 usa `mtime` (sistema de arquivos, difícil de forjar) de propósito,
em vez de um header auto-declarado. Como o operador é a fonte confiável e
autorizou explicitamente, backdatar o `mtime` é o mecanismo que o próprio guard
já usa pras outras coletas pré-jogo — não foi preciso mexer no código. Alternativa
descartada: passar a confiar em `coletado_em` do header, que enfraqueceria o guard
pra todos os arquivos.

### Consequências

- Copilot passou a pontuar nos 6 jogos apurados (15 pts, 1 placar exato).
- Fragilidade: se o arquivo for reescrito no futuro, o `mtime` volta pro "agora"
  e os jogos já realizados seriam rejeitados de novo. Reaplicar o `touch -d` se
  reeditar.

---

## 2026-06-05 — Início do projeto: Bolão das IAs com plataforma própria

### Contexto

Giordano vinha planejando o Bolão da Copa 2026 com duas frentes paralelas (humanos no Dacopa + IAs comparadas offline). Os 3 arquivos da pasta (`handoff`, `prompt-bolao-ias`, `tabela-jogos-copa-2026`) já tinham objetivo, tabela e prompt prontos, mirando a plataforma Dacopa também pras IAs.

No init do fluxo multi-agente, Giordano redirecionou: **vamos construir uma plataforma própria** para registrar e ranquear os palpites das IAs, em vez de tentar encaixá-las no Dacopa.

### Decisão

- **Escopo**: plataforma Python local que recebe palpites em `.md`, calcula pontuação e renderiza ranking HTML estático. Dacopa continua sendo a plataforma dos humanos, **fora** deste repo.
- **Stack**: Python 3.11+ + Jinja2 + pytest + ruff. HTML estático com Tailwind via CDN. Sem servidor, sem DB.
- **Time**: Arquiteto + 6 especialistas (pipeline-dev, frontend-dev, llm-prompt, devops-installer, qa-tester, docs-writer).
- **Hospedagem**: local, com GitHub Pages opcional pós-fase-de-grupos (repo privado durante para evitar leak de palpites).
- **Compliance**: LGPD não se aplica (sem dados pessoais sensíveis; nomes de IAs e palpites são públicos por natureza).
- **Regras de pontuação**: clássicas (placar exato=10, vencedor+saldo=7, vencedor=5, empate sem placar exato=5, errado=0, mata-mata 2×). **Diferentes** das regras Dacopa que estavam no prompt original — o `llm-prompt` precisa reescrever o prompt das IAs.

### Por quê / alternativas

**Não-Dacopa pras IAs** porque: (a) ToS Dacopa proíbe múltiplas contas por pessoa, então cadastrar 5 IAs em nome do Giordano é fraude; (b) Dacopa não tem API/MCP, então automação dependeria de scraping/Chrome — frágil; (c) ter plataforma própria nos dá liberdade de mudar regras e formato de relatório.

**Filesystem + HTML estático** em vez de webapp porque: 5-10 IAs, 104 jogos, ~150 palpites por IA. Qualquer DB seria overkill. Markdown é editável com Notepad, versionável em git, e zero superfície de ataque.

**Regras clássicas** (10/7/5/5/0 + 2× mata-mata) em vez das Dacopa (25/18/15/12/10/0 + 2× mata-mata) porque: (a) Giordano pediu "regras clássicas"; (b) hierarquia "placar exato > vencedor+saldo > vencedor" é mais conhecida pelos amigos e pelos públicos que vão acompanhar o ranking; (c) facilita defender o resultado contra reclamações.

### Consequências

**Habilita**:
- Pipeline 100% offline, sem dependência de plataforma externa.
- Iteração rápida das regras e formato sem mexer em UI de terceiros.
- Comparação cruzada IA-vs-IA fica trivial (todos os dados em local).
- Repo se torna artefato compartilhável pós-Copa (case de uso "Bolão de IAs").

**Impede / posterga**:
- Comparação direta IA vs humanos do Dacopa (o Dacopa não exporta palpites; teríamos que rasparmuito manualmente).
- Pilotar Dacopa programaticamente — não é objetivo deste repo.
- Apuração em tempo real durante o jogo (sem WebSocket; ciclo é manual + por rodada).

**Pendências decididas neste momento**:
- GitHub repo: `gh repo create` aguarda Giordano confirmar username.
- Spawn dos 6 especialistas + abertura do dashboard ocorre logo após o commit inicial (Fase 4 deste skill).

---

## 2026-06-05 — Adaptações para ambiente Windows (sem jq/uuidgen/tmux)

### Contexto

Os scripts do plugin `multiagentes-giordano` dependem de `jq`, `uuidgen` e `tmux`, que não estão disponíveis no Git Bash do Windows do Giordano. Sem essas ferramentas, `spawn.sh` falha imediatamente (uuidgen + jq) e `open_dashboard.sh` falha logo após (tmux).

Sandbox bloqueia download de binários (`jq.exe`) — esperado e correto.

### Decisão

- **`jq` e `uuidgen`**: shims puros-Python em `scripts/bin/` (`jq`, `_jq_impl.py`, `uuidgen`). Os scripts do plugin recebem `scripts/bin` no PATH pelo chamador (`export PATH="$(pwd)/scripts/bin:$PATH"` antes de `scripts/spawn.sh`).
- **`tmux`**: não substituído. Em vez disso, criamos `scripts/watch_logs.sh`, alternativa cross-plataforma que segue (`tail -F`) os logs de todos os agentes em paralelo, cada um com prefixo colorido — útil pra Windows nativo. Quem quiser o dashboard rico precisa rodar em WSL/Linux/macOS.

### Por quê / alternativas

**Por que shims em Python e não baixar jq.exe oficial?**
- Sandbox bloqueia download de executáveis (política correta).
- Python já está disponível no sistema (3.13).
- Shim minimal cobre exatamente os 4 padrões usados (keys[], get field, get com --arg, merge), e falha alto se vier um padrão novo — fácil de detectar e estender.
- Zero arquivo binário no repo.

**Por que não traduzir o dashboard tmux para Windows Terminal?**
- Trabalho desproporcional para o MVP. Windows Terminal + WSL é um caminho válido, mas mexer com PowerShell + WT panes seria mais um projetinho.
- `watch_logs.sh` cobre o caso de uso real (acompanhar os agentes trabalhando) com 60 linhas de bash.
- O Giordano pode evoluir pra WSL quando achar que vale a pena.

### Consequências

**Habilita**:
- Spawn dos 6 agentes funcionou: `pipeline-dev`, `llm-prompt`, `frontend-dev`, `devops-installer`, `qa-tester`, `docs-writer` — todos idle.
- `scripts/drive.sh <agente> "<prompt>"` e `scripts/take_over.sh <agente>` também passam a funcionar (usam jq, que agora resolve via shim).

**Pendências**:
- Toda invocação dos scripts do plugin **precisa** ter `export PATH="$(pwd)/scripts/bin:$PATH"` antes. Documentado em `docs/10_PRIMEIROS_PASSOS.md`.
- Dashboard tmux requer ambiente Unix. Em Windows: use `scripts/watch_logs.sh`.

---

## 2026-06-05 — F4 fechada: MVP da plataforma + ajustes pós-feedback

### Contexto

Fase 4 (MVP) entregue em paralelo por 6 especialistas. Durante o drive houve dois incidentes:

1. **`_stream_pretty.py` quebrou em Windows cp1252** ao escrever emoji UTF-8 no stdout. Pipe morreu mas os agentes continuaram trabalhando em filesystem.
2. **Race condition entre commits paralelos**: pipeline-dev relatou que `git add` de outros agentes arrastou seus arquivos não-staged. Conteúdo correto, atribuição de commits "torta".

### Decisão

**Aceitar a F4 como fechada** com correções pontuais aplicadas pelo arquiteto:

- `scripts/_stream_pretty.py`: fix permanente — `sys.stdout.reconfigure(encoding="utf-8")` no topo, robusto a Windows.
- `src/bolao/ranking.py`: aceita `Mapping[str, Iterable[Palpite]]` E `Iterable[Palpite]` via helper `_normalizar`. Resolve mismatch entre contrato de `01_ARQUITETURA.md` e impl do pipeline.
- `docs/01_ARQUITETURA.md`: atualizado para refletir as assinaturas reais (chave `slug` em vez de `ia`, type alias `PalpitesInput`).
- `src/bolao/py.typed`: marker adicionado pra `mypy --strict` não reclamar do pacote (achado do qa-tester).
- Race condition de commits: **não rebasei** — atribuição "torta" mas conteúdo OK. Próximos drives terão regra de "1 agente, 1 pasta, git add explícito por arquivo" pra evitar.

### Por quê / alternativas

**Aceitar a F4 com remendos pontuais em vez de re-driver** porque: (a) 54 testes verdes, cobertura 94%, todos critérios da F4 batidos; (b) re-drive consome muito token pra ganhar pouco; (c) o pipe-broken-mas-trabalho-feito virou um achado útil pra ajustar o `_stream_pretty.py` definitivo, beneficiando todos os projetos futuros que usarem o plugin no Windows.

### Consequências

**Habilita**:
- Tag `v0.1.0-mvp` criada. Plataforma pronta pra Fase 5 (coleta de palpites das IAs).
- Drive multi-agente futuro funciona robusto em Windows (encoding resolvido).

**Pendências reconhecidas**:
- Atribuição "torta" de commits da F4 fica como cicatriz histórica. Aceitável.
- Histórico append-only (regra I6) é manual por enquanto. Endereçar em F5.
- Pipeline `__main__.py` sem cobertura de testes (0%). Aceitável pra MVP, endereçar em F5+.
- `resumo.txt` é mínimo. Expandir em F5 com "diff vs rodada anterior", "viradas", "consensos errados".

---

## 2026-06-06 — F9: v4 Bolão para Humanos (scaffold)

**Decisão**: Implementar v4 (do `specs/descricao inicial.md`) como app **separado** em `v4/`, stack **Next.js 15 + Supabase + Vercel**.

**Por que separado do v1**:
- v1 é site **100% estático** (GitHub Pages). v4 precisa de DB+Auth → exige runtime dinâmico.
- Tentar amalgamar quebraria o pipeline Python e dobraria a complexidade.
- Separação permite deploy independente: v1 muda → push GitHub Pages; v4 muda → push Vercel.

**Stack escolhida**:
- **Next.js 15** (App Router, TS) — SSR/RSC nativo, prima do TS.
- **Supabase** (free tier 500MB DB, 50k MAU) — Auth + DB + RLS num pacote só.
- **Vercel** (free tier 100GB bw) — autodetect Next.js, deploy automático do `v4/` como root.
- **Tailwind v4** (PostCSS plugin).

**Schema** (`v4/sql/schema.sql`):
- `profiles`, `bolao`, `bolao_membro`, `palpite` com **RLS** ativo em todas.
- Palpites são **por usuário**, não por bolão — reutilizados em N bolões.

**Sync com v1**: `scripts/v4_sync.py` copia `web/data/jogos.json` e `ranking.json` pra `v4/public/`. Roda manual por enquanto.

**Setup operacional** (Giordano):
1. Criar projeto Supabase + rodar `v4/sql/schema.sql`
2. Copiar URL+anon key pra `v4/.env.local`
3. Import no Vercel com root `v4/` + vars de ambiente
4. URL inicial: `bolao-copa-2026.vercel.app`

**CTA na home v1**: botão "🎯 Crie o seu Bolão" linkando pra Vercel.

**Escopo MVP**: signup/login, criar bolão, link `/bolao/{slug}`, entrar pelo link, palpitar 104 jogos, ranking interno.

**Fora do MVP**: Stripe, Google OAuth, batch import de palpite IA, cards Instagram, ranking-geral combinado.


## 2026-06-07 — Noite de implementação (Arquiteto trabalhou enquanto user dormiu)

**Entregas no v1**:
- **Bola de Cristal** (`src/bolao/cristal.py`): consenso por jogo entre todas as IAs. Em caso de empate, escolhe o placar com maior soma de gols. Renderizada em `cristal.html` nas 4 línguas. Aparece no ranking como 122ª "IA".
- Nav atualizada com `🔮 Bola de Cristal`.

**Entregas no v4 (arena-de-ias.vercel.app)**:
- **Visual sincronizado com v1** (tema Airbnb): Fraunces + Inter, rosa Rausch + teal Babu + amarelo BR. Removeu Tailwind v4 (estava causando bugs).
- **/como-funciona**: explica pontuação, FAQ, disclaimers.
- **/ias**: lista 121 IAs agrupadas por empresa.
- **/ranking-geral**: humanos opt-in + IAs + Bola de Cristal combinados.
- **/doar**: PIX + placeholder Stripe (sem implementação de pagamento ainda).
- **/criar protegida server-side** (era acessível sem login).
- **PWA**: manifest.json + sw.js + ícones 192/512.
- **Cards de share**: Canvas API gera PNG 1080×1080 com top 5 ranking + link.
- **Microinterações**: ripple no btn, hover stats/steps, fade-up no hero, focus-visible accessibility.
- **Mobile refinado**: breakpoints, safe-area-inset iOS, jogos linha responsiva.
- **Open Graph + manifest meta** corretos.

**Bugs corrigidos** (do report do qa-tester):
1. `/criar` protegida server-side via redirect.
2. Link "Ranking" abre em nova aba com `rel="noopener noreferrer"`.
3. `robots: index, follow` explícito.

**Decisões**:
- Email confirmation desativada via Supabase Management API (`mailer_autoconfirm: true`).
- Site URL + redirect URLs configurados via API.
- Vercel SSO desativado via API (site público).
- Framework Vercel setado pra `nextjs` via API (estava `null` causando 404).
- Hardcoded `SUPABASE_URL` e `SUPABASE_ANON_KEY` em `lib/supabase-config.ts` como fallback (são públicas por design).
- Middleware removido — Supabase SSR crasha no Edge Runtime do Next 15.5; auth check inline nas Server Components.

**Pendências do usuário**:
- Confirmar user antigo no Supabase Auth (criado antes do `mailer_autoconfirm`).
- Revogar tokens (Vercel + Supabase PAT) depois do MVP estabilizado.
- Decidir nome final / domínio próprio.

---

## 2026-06-07 (Giordano) — Decisões de UX firmadas

Decisões que devem perdurar (não reverter sem confirmação):

### Ranking & ordenação
- **Empates aparecem com mesmo número** (1º, 1º, 3º — nunca 1º, 2º, 3º).
- **Ordenação por popularidade** quando há empate de pontos. Ordem das famílias: OpenAI > Anthropic > Google > xAI > DeepSeek > Microsoft > Meta > Perplexity > Mistral > Alibaba. Dentro da família, modelos flagship/via-web primeiro. Implementado em `v4/lib/ias.ts:scorePopularidade`.
- Ordem de popularidade é o **default** na lista de Sugestões durante palpitar.

### Separação de páginas
- **`/ias`**: APRESENTAÇÃO informativa, NÃO competição.
  - Lista das 122 organizadas por empresa, com ícones dos produtos.
  - Sem rank/pontos competitivos misturados (confunde com /ranking-geral).
  - Série A pode aparecer no topo como vitrine.
- **`/ranking-geral`**: COMPETIÇÃO geral (humanos + IAs no mesmo placar).
  - Única página com o ranking competitivo unificado.
- **`/serie-a`**: TOP 10 com pontos. Campeonato premium das flagship.

### Tipografia mobile
- **Mínimo 13px** para qualquer texto de leitura (não usar fontes ilegíveis no celular).
- Em cards de IA na home (variante destaque): nome do **modelo** ligeiramente menor que nome do **produto**, mas ainda legível.
- Nome do produto sempre cabe na linha (ellipsis ok se nome muito longo; preferir word-break sensato).

### Regra geral
Decisões firmadas neste log são especificação. Não revisitar sem perguntar ao usuário.

---

## 2026-06-07 (Giordano) — Unificação /serie-a + /ias

- **Unificar /serie-a e /ias** em uma única rota: **/ranking-ias**.
- Header NÃO precisa mais do link "Série A" separado — só "Ranking de IAs".
- Na vitrine de IAs (mascotes da Série A), mostrar **ícone do produto AO LADO do mascote** (não substituir; coexistir).

## Marketing & infra (não-funcional)

- **Cards de partida pra Instagram**: gerar 1 PNG por partida com resultado Bola de Cristal. Salvar local em `marketing/cards/`. Será agendado depois.
- **Domínio próprio**: `bolao.arenadasias.com.br` (já comprado). Apontar via DNS CNAME pro Vercel.
- **Stripe final**: Payment Link sem nome do dono aparecendo (configurar business_name genérico tipo "Arena de IAs").
- **Agendamento Instagram**: investigar Meta Business Suite (nativo, grátis) ou alternativas (Buffer, Later free tier).

---

## 2026-06-24 — Tiers de colaboração viram só prestígio (sem perks funcionais)

### Contexto

A /colaborar tinha listado perks funcionais por tier (R$10 Apoiador, R$25
Mantenedor, R$100 Padrinho): grupo de WhatsApp, voto em IA nova, "voz ativa",
acesso antecipado, nome no rodapé etc. Giordano achou que isso deixou o site com
cara de produto comercial e que funcionalidade por tier = dificuldade de gestão.

### Decisão

- O **v2 continua restrito a quem pagou** (allowlist `contribuintes`, REGRA DE
  OURO mantida). Não foi aberto ao público geral.
- Tiers **não diferenciam funcionalidade**: qualquer valor libera os mesmos
  recursos (palpites v2 + sugestões). A diferença é só o **selo** (💛/🛟/👑).
- **Sugestões abertas a todos** (inclusive quem não pagou) — já era o caso.
- Valor sugerido do Padrinho volta de **R$100 → R$50** (desde a mudança pra 100,
  ninguém pagou 100).
- Banner de contribuinte passa a exibir `contribuintes.nota` quando preenchida
  (mensagens de liberação por parceria, ex.: grant gratuito).

### Por quê / alternativas

Abrir o v2 pra todos foi considerado e **rejeitado**: o perk pago é justamente o
palpite futuro. Simplificar = acesso uniforme entre pagantes + diferença só
simbólica, em vez de matriz de perks por valor.

### Consequências

- `v4/app/colaborar/page.tsx`: RECOMPENSAS só com selo; hero e nota reescritos;
  R$50. `lib/admin.ts`: novo `notaContribuinte()`. `AgradecimentoContribuinte`
  mostra a nota personalizada.
- **Não reverter** abrindo o v2 pra todos — "todos" do usuário = "todos que
  pagaram, sem diferenciar tier".

---

## 2026-06-27 — Bolão Humanos × IAs + rankings por fase (grupos / mata-mata / geral)

### Contexto

Giordano quis um "Bolão do Mata-Mata" pra comparar humanos × IAs de verdade, com
card de recrutamento no site e três rankings (fase de grupos, mata-mata, geral),
cada um contabilizando IAs (Série A ou todas) **e** humanos. O mapeamento do
código mostrou que quase toda a infra já existe: humanos já palpitam (`palpite`,
`/bolao/[slug]/palpitar`, trava server-side), `/ranking-geral` já mistura humanos
+ IAs + Cristal, a engine de pontuação é idêntica em Python e TS (2× mata-mata
pronto), `/dashboard` já é o "Meus Bolões", e **a cópia de palpites de uma IA ou
da Bola de Cristal já existe** (`PrePreencherBar` em massa + `SugestaoIA`
jogo-a-jogo, respeitando a trava).

### Decisões

- **D1 — Bolão central é uma linha real em `bolao`** (não conceito). Slug
  `humanos-vs-ias`, nome "Humanos × IAs — Mata-mata". Nova coluna
  `bolao.publico boolean default false`; a linha central tem `publico=true`.
  Entrar nele exige **consentimento explícito** de tornar os palpites públicos →
  o join seta `profiles.opt_in_geral = true`. Aparece em "Meus Bolões"
  (`/dashboard`) como qualquer outro. Bolões privados continuam privados (não
  forçam público).
- **D2 — Uma página, três abas** (Grupos · Mata-mata · Geral), evoluindo
  `/ranking-geral`. Não criar três páginas.
- **D3 — Filtro de escopo em 3 níveis progressivos** (padrão já usado no site):
  *Só Série A* → *Série A + demais IAs* → *Todas as IAs + Humanos*. Humanos só
  aparecem no nível 3. Bola de Cristal aparece em todos (linha de referência 🔮).
- **D4 — Cópia de palpites já existe; estender ao mata-mata.** Garantir que os
  palpites de IA do mata-mata (hoje em `palpite_v2`, premium) cheguem ao loader
  `carregarPalpitesIAs()`/JSON respeitando o **gating atual**: Cristal é livre;
  placar de IA específica no mata-mata continua premium (só contribuinte copia).
- **Contrato de dados — ranking por fase:** o pipeline passa a emitir, por IA, um
  recorte por fase no `ranking-ias.json` (sub-objetos `grupos` / `matamata` /
  `geral`, cada um com `pontos`, `placares_exatos`, `vencedores_acertados`,
  `jogos_palpitados`). Fase = grupos (jogos 1–72) vs mata-mata (≥73). Humanos são
  recortados no front pela mesma régua via `scoring.ts`.
- **Integração mata-mata IA no scoring:** o pipeline precisa pontuar os palpites
  de IA do mata-mata contra os resultados quando os jogos 73+ acontecerem (hoje a
  pontuação só cobre grupos). Mata-mata ainda não foi jogado, então o ranking de
  mata-mata nasce vazio e enche conforme os jogos fecham — mas a integração tem
  de estar correta pro primeiro resultado já pontuar.

### Por quê / alternativas

- Bolão central como linha real (vs. conceito puro) foi escolhido porque o
  usuário quer que apareça em "Meus Bolões" e que "entrar" seja um ato explícito
  com consentimento de tornar público. Coluna `publico` generaliza (pode haver
  outros bolões públicos no futuro) sem hard-code de slug.
- Empates seguem na mesma colocação e a ordenação/desempate seguem o §1 da
  especificação (pontos → placares_exatos → vencedores_acertados →
  popularidade). Isso vale dentro de **cada** aba.

### Consequências

- SQL: `alter table bolao add column publico boolean default false;` + seed da
  linha `humanos-vs-ias` com `publico=true`. RLS de `bolao_membro` já é pública.
- Join com consentimento: variante do `EntrarButton` pra bolão `publico` (modal
  de consentimento → upsert `bolao_membro` + set `opt_in_geral=true`).
- `src/bolao/ranking.py` + `scripts/v4_sync.py`: recorte por fase no JSON +
  ingestão dos palpites de IA do mata-mata.
- `/ranking-geral`: 3 abas + filtro 3 níveis; humanos agregados por fase.
- Card de recrutamento na home (4 idiomas) apontando pro bolão central.
- **Não reverter** sem perguntar: o nível 3 do filtro é o único que mostra
  humanos; entrar no bolão central sempre implica palpites públicos.

---

## 2026-06-28 — Escopo de jogos por bolão + estratégia do ranking geral da Copa

### Contexto

Havia confusão sobre como calcular um ranking geral "final" da Copa, dado que: (a)
existe um **bolão público do mata-mata** (Humanos × IAs) que só deve considerar os
jogos do mata-mata; (b) há **bolões privados** que cobrem a Copa toda; (c) os
palpites das IAs têm várias versões; e (d) uma pessoa pode estar em vários bolões.

A chave que dissolve a confusão está no schema: a tabela `palpite` tem PK
`(user_id, jogo_numero)` — ou seja, **cada usuário tem UM único conjunto de
palpites, reaproveitado em todos os bolões**. Não há `bolao_id` em `palpite`, nem
escopo de jogos por bolão no banco.

### Decisão

- **Bolão = associação (`bolao_membro`) + ESCOPO de jogos.** A única coisa que
  distingue um bolão de outro na pontuação é o intervalo de jogos que conta. O
  escopo vive em código (`v4/lib/bolao-escopo.ts`), não no banco:
  - `humanos-vs-ias` (público) → **só mata-mata, jogos 73–104**. Nenhum ponto da
    fase de grupos entra.
  - Qualquer outro bolão (privados) → **Copa toda, jogos 1–104**.
- **Ranking geral da Copa** = `/ranking-geral` ("copa toda"): soma dos palpites de
  cada participante sobre **todos os 104 jogos** (humanos opt-in + todas as IAs).
  Como o palpite é global, a pessoa pontua de forma consistente em qualquer recorte
  de fase, sem dupla contagem.
- **Importar palpites entre bolões é desnecessário (moot).** Como o palpite já é
  global por `(user_id, jogo_numero)`, entrar num segundo bolão reusa
  automaticamente os mesmos palpites. Não há o que importar.

### Por quê / alternativas

- Não criar `bolao_id` em `palpite` nem duplicar palpites por bolão: manteria N
  cópias divergentes do mesmo chute e quebraria o ranking geral. O modelo global
  é mais simples e já é o que o schema garante.
- Escopo em código (allowlist por slug) em vez de coluna no banco: o conjunto de
  bolões com escopo especial é pequeno e raro de mudar; evita migração e DDL.

### Consequências

- `v4/lib/bolao-escopo.ts`: `escopoDoBolao(slug)` (default 1–104; `humanos-vs-ias`
  → 73–104), `jogoNoEscopo`, `jogosNoEscopo`.
- `RankingDoBolao.tsx`, `bolao/[slug]/page.tsx`, `palpitar/page.tsx`,
  `PalpitarForm.tsx`: filtram jogos exibidos, pontuação, progresso e "apagar
  todos" pelo escopo do bolão. O bolão do mata-mata mostra só os jogos 73–104 e
  rotula "Só conta o Mata-mata".
- `palpitar`: "apagar todos" passa a apagar só os palpites **do escopo** (não some
  com os palpites de grupos de quem está no bolão do mata-mata).
- **Não reverter** sem perguntar: bolão do mata-mata jamais conta pontos de
  grupos; ranking geral continua somando a Copa toda.
