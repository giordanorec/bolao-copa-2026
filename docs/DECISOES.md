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
