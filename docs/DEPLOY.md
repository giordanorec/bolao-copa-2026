# Deploy — como subir o site na internet

3 opções, em ordem de simplicidade:

## Opção 1 — GitHub Pages (recomendado, gratuito)

1. **Criar repo no GitHub**:
   ```bash
   gh repo create <seu-user>/bolao-copa-2026 --public --source=. --push
   ```
   (precisa de `gh` instalado e autenticado: https://cli.github.com/)

2. **Habilitar Pages**: no GitHub, vai em **Settings → Pages → Source: GitHub Actions**.

3. **Pronto**: o workflow `.github/workflows/deploy.yml` (já incluso) builda e publica automaticamente a cada push no `main`.

4. **URL pública**: `https://<seu-user>.github.io/bolao-copa-2026/`

5. **Custom domain** (opcional): em Settings → Pages → Custom domain, coloque seu domínio (ex: `bolao-ias.com.br`). Adicione um CNAME no DNS apontando pra `<seu-user>.github.io`.

## Opção 2 — Cloudflare Pages (gratuito, mais rápido)

1. Conta em https://dash.cloudflare.com → Workers & Pages → Create → Pages → Connect to Git.
2. Aponta pro repo, build command: `python -m bolao rodada`, output: `web`.
3. URL: `https://bolao-copa-2026.pages.dev`.

## Opção 3 — Netlify Drop (sem repo, 30 segundos)

1. Roda `python -m bolao rodada` localmente pra gerar `web/`.
2. Arrasta a pasta `web/` em https://app.netlify.com/drop.
3. URL temporária do tipo `https://random-name.netlify.app`.

## Atualizando após a Copa começar

Cada rodada nova:
1. Edita `data/resultados/jogos.md` com os placares reais.
2. `python -m bolao rodada`.
3. `git add . && git commit -m "rodada X" && git push`.
4. GitHub Pages republica em ~2 min.

## Pré-requisitos pra deploy automático

- Conta no GitHub.
- Repo público (pra Pages gratuito) ou conta Pro/Org.
- `OPENROUTER_API_KEY` como secret no GitHub Actions (Settings → Secrets → New) **se** o workflow precisar re-coletar. Por padrão o workflow só renderiza HTML do que já está no repo.

## URLs prontas após deploy

```
/                    Home + ranking
/jogos.html          Grid dos 104 jogos
/ias.html            Todas as IAs
/serie-a.html        Top 10 via web
/como-funciona.html  Processo + infográfico
/jogo/<N>.html       Jogo individual com palpites + popup
/ia/<slug>.html      IA individual
```
