# AGENTS.md

Guia para qualquer agente de IA (Claude Code, Codex, etc.) que trabalhe neste
repositório. Espelha o `CLAUDE.md` — leia-o também.

## Regra cardinal

**Não reverta decisões já firmadas sem perguntar ao usuário.**
A fonte de verdade de produto/UX é **`docs/11_ESPECIFICACAO_PRODUTO.md`**. Antes de
mexer em ranking, ordenação, scoring, páginas, animações, mascotes ou tipografia,
leia a especificação. Em caso de conflito, a especificação ganha.

## Ordem de leitura

1. `CLAUDE.md`
2. `docs/11_ESPECIFICACAO_PRODUTO.md` (decisões firmadas)
3. `docs/DECISOES.md` (log datado com o "por quê")
4. `docs/00_OBJETIVO.md` … `docs/10_PRIMEIROS_PASSOS.md`

## Lembretes de alto risco de esquecimento

- Empates ocupam a **mesma colocação** (1º, 1º, 3º).
- Mascotes **só na Série A**; peças visuais usam só o ranking da Série A.
- Mascotes em **pelúcia realista, nada de cartoon**.
- Mudança global = **todas as páginas** e **4 idiomas** (pt/en/es/fr).
- Claude via web = **"Opus 4.8"**.
- Resultado de jogo → **Runbook §8** da especificação (atualizar tudo, conferir
  ordem Time A × Time B, re-stage após o pré-commit, novo commit nunca `--amend`).

## Ao firmar uma decisão nova

Registre em `docs/DECISOES.md` (datado, com o "por quê") **e** atualize a seção
correspondente de `docs/11_ESPECIFICACAO_PRODUTO.md`. Se for durável entre
sessões, atualize também a memória do projeto.
