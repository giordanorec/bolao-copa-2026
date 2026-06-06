# Deploy — site rodando em produção

**🌐 URL: https://giordanorec.github.io/bolao-copa-2026/**

Hospedado no **GitHub Pages**, branch `gh-pages`, conteúdo de `web/`.

## Atualizar (após coletar nova rodada, mudar tema, etc.)

```bash
bash scripts/deploy.sh
```

O script:
1. Roda `python -m bolao rodada` (regenera web/)
2. Commita no `main` e faz push (sem hooks)
3. Subtree-pushea `web/` pra branch `gh-pages`
4. GitHub Pages rebuilda em ~1 minuto

## Sem o script (manual)

```bash
python -m bolao rodada
git add -A && git commit --no-verify -m "rodada N"
git push --no-verify origin main
git -c core.hooksPath=/dev/null subtree push --prefix web origin gh-pages
```

## Custom domain

Em https://github.com/giordanorec/bolao-copa-2026/settings/pages:
- Custom domain: ex. `bolao-ias.com.br`
- Salve.
- No seu DNS, crie CNAME apontando pra `giordanorec.github.io`.
- Aguarde HTTPS provisioning (até 24h).

## Páginas vivas

```
/                    Home + ranking + hero
/jogos.html          104 jogos + bola de cristal + confiança
/ias.html            Todas as IAs por popularidade
/serie-a.html        Top 10 via web manual
/como-funciona.html  Infográfico do processo
/jogo/<N>.html       Detalhe do jogo (popup palpite-by-IA)
/ia/<slug>.html      Detalhe da IA com palpites jogo-a-jogo
```
