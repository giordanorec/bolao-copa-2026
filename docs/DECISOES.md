# DECISOES.md — log cronológico vivo

Cada entrada é **uma decisão não-trivial** com contexto. Preencher **no mesmo commit** que materializa a decisão.

Formato: `## YYYY-MM-DD — título curto` + seções *Contexto*, *Decisão*, *Por quê / alternativas*, *Consequências*.

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
