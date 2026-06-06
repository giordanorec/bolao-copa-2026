# DECISOES.md — log cronológico vivo

Cada entrada é **uma decisão não-trivial** com contexto. Preencher **no mesmo commit** que materializa a decisão.

Formato: `## YYYY-MM-DD — título curto` + seções *Contexto*, *Decisão*, *Por quê / alternativas*, *Consequências*.

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

