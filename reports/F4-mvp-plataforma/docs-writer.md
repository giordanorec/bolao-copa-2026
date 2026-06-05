# F4 — Report do docs-writer

**Sprint**: F4-mvp-plataforma
**Agente**: docs-writer
**Data**: 2026-06-05
**Status**: idle

## Arquivos criados/alterados

| Arquivo | Ação | Notas |
|---|---|---|
| `README.md` | **expansão revertida** | Tentei expandir (quickstart 5 passos, FAQ, placeholder de print, licença). A versão expandida foi revertida ao estado pré-F4 — assumo decisão do operador e não restauro sem pedido explícito. |
| `docs/USO.md` | criado | Manual de operação (5 seções + referência rápida + troubleshooting) |
| `docs/mensagem-divulgacao-whatsapp.md` | criado | 4 versões de mensagem: anúncio, resumo por rodada, fim de fase, encerramento |
| `docs/CONTRIBUTING.md` | **não criado** | Decisão registrada abaixo |
| `memory/docs-writer/MEMORY.md` | atualizado | Lições da sprint |

## Decisões tomadas

1. **README não foi materialmente alterado nesta sprint**. Versão
   expandida (~130 linhas com FAQ e licença) foi revertida ao estado
   anterior. Não restauro sem pedido explícito do Arquiteto. Conteúdo
   que seria do README ficou parcialmente coberto em `docs/USO.md`
   (passo a passo) e o restante (FAQ, print) fica pendente.

2. **Sem `docs/CONTRIBUTING.md` no MVP**. O spec diz "só se relevante,
   decida". Decidi não: projeto é one-operator (Giordano), não há fluxo
   de PR externo no MVP, e qualquer contribuição futura cai no fluxo
   multi-agente (`.claude/agents/`). Se houver abertura pública pós-Copa,
   reabrir essa decisão.

3. **Mensagem de divulgação em arquivo, não em comentário no README**.
   `docs/mensagem-divulgacao-whatsapp.md` consolida 4 versões da
   mensagem (anúncio inicial, template de resumo por rodada, fim de
   fase, encerramento). Isso facilita reusar e iterar o texto sem mexer
   no README.

4. **Tom**: pt-BR direto, sem emoji (exceto na mensagem de encerramento
   do WhatsApp — 🥇🥈🥉 — porque é celebração e padrão de pódio). Linha
   ≤ 100 cols em todos os arquivos.

5. **Manual de uso assume Windows + Git Bash** (ambiente real do
   Giordano), com nota lateral pra Mac/Linux. Comandos da venv usam
   `source .venv/Scripts/activate` por default.

## Amostra do conteúdo

### Trecho do docs/USO.md (rotina por rodada)

```markdown
### 2.1 Editar resultados

Abre `data/resultados/jogos.md` (pode ser no Notepad) e preenche
`Gols A` e `Gols B` dos jogos que terminaram. Use o **placar do tempo
regulamentar (90 min)** — prorrogação e pênaltis não entram nessa
coluna.
```

### Trecho do docs/USO.md (troubleshooting)

```markdown
### 3.1 Errou de digitar um resultado

Edita `data/resultados/jogos.md`, corrige o placar, roda
`python -m bolao rodada` de novo. O ranking é determinístico — ele é
recomputado do zero, então a correção propaga sem resíduo.
```

### Trecho da mensagem de divulgação (versão 1)

```
[bolao-copa] Galera, montei um bolão das IAs em paralelo ao nosso lá no Dacopa.

Mesmas regras clássicas (placar exato=10, vencedor+saldo=7, vencedor=5,
empate sem placar exato=5, errado=0, mata-mata 2x), mas com 5 IAs
palpitando: ChatGPT 5, Gemini 2.5 Pro, Claude Opus 4.7, Grok 4 e
DeepSeek R1.
```

## Pendências

1. **README** — Arquiteto decide se quer:
   (a) restaurar a versão expandida que estava preparada (quickstart 5
       passos, FAQ com 7 perguntas, licença, placeholder de print);
   (b) deixar o README mínimo atual e direcionar tudo pra `docs/USO.md`;
   (c) outra forma. Aguardo direção.

2. **Print do ranking no README** ainda não cabe enquanto README estiver
   no estado mínimo. Quando frontend-dev terminar templates + 1ª rodada
   (~13/06/2026), substituir.

3. **URL pública de GitHub Pages** está como "a definir". Vai depender
   da decisão de quando tornar o repo público — `DECISOES.md` sugere
   pós-fase-de-grupos pra evitar leak de palpites.

4. **Slugs das IAs em USO.md** (`chatgpt-5`, `gemini-2-5-pro`,
   `claude-opus-4-7`, `grok-4`, `deepseek-r1`) são minha sugestão.
   Confirmar com `llm-prompt` quando ele entregar — se ele padronizar
   diferente, atualizar a tabela em `docs/USO.md` seção 1.1.

5. **Formato exato do `resumo.txt`** que `pipeline-dev` vai gerar pode
   divergir do template que coloquei na Versão 2 da mensagem de
   WhatsApp. Quando o `python -m bolao resumo` rodar pela primeira vez
   com dados reais, alinhar o template à saída real (ou ajustar a saída
   pra bater com o template).

6. **CHANGELOG.md**: não criado nesta sprint (não estava no escopo). Se
   for relevante pra tag `v0.1.0-mvp` no fechamento da F4, abrir num
   próximo ciclo.

## Próximos passos sugeridos (fora desta sprint)

- Decisão do Arquiteto sobre o README (ver pendência 1).
- Atualizar README com print real após 1ª rodada (provavelmente Fase 6,
  ~13/06).
- Inicializar CHANGELOG.md no fechamento da F4 (tag `v0.1.0-mvp`).
- Pós-Copa: postmortem em `docs/DECISOES.md` + texto de encerramento
  (já preparado em `mensagem-divulgacao-whatsapp.md` versão 4).
