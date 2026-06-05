# F4 — frontend-dev report

**Status**: ✅ entregue, smoke verde.
**Data**: 2026-06-05
**Branch**: `main` (commits `[F4-frontend-dev] ...`)

## O que foi entregue

### Templates Jinja2 (`web/templates/`)

| Arquivo | Propósito |
|---|---|
| `base.html.j2` | Layout comum: header sticky, footer, Tailwind CDN + custom config (paleta `bg-*`, `accent`, `gold`), import de `assets/style.css` e `assets/script.js`. Suporta variável `asset_prefix` (vazia no root, `"../"` nas subpastas). |
| `index.html.j2` | Ranking principal. Tabela com colunas: posição, IA, pontos, placares exatos, vencedores acertados, jogos palpitados. Cabeçalhos `sortable`. Pódio (1º/2º/3º) com medalhas. Empty state com instrução de como cadastrar IA. |
| `ia.html.j2` | Página por IA. Cards de KPI (pontos, posição, placares exatos, vencedores) + tabela jogo-a-jogo (palpite × resultado × pontos ganhos). Link de volta pro ranking e cross-link pra página do jogo. |
| `jogo.html.j2` | Página por jogo. Cabeçalho com fase / data / hora / local, badge de resultado (ou "aguardando placar"), tabela de palpites de cada IA ordenada por pontos desc. |

### Assets (`web/assets/`)

- `style.css` — overrides custom mínimos sobre Tailwind: estilos de sort (`.sortable::after` com ↕/↑/↓ em verde), fix de `border-collapse` pra evitar jitter, `color-scheme: dark`, fallback `.bolao-fallback` caso CDN do Tailwind falhe.
- `script.js` — sort de tabela por clique. Zero deps, ~50 linhas. Lê `data-sort="num"|"str"` no `<th>`; suporta também Enter/Space (a11y), `role=button`, `tabindex=0`. Locale-aware na ordenação de strings (pt-BR).

### Pipeline integration (`src/bolao/render.py`)

Função pública: `renderizar_html(ranking_json: Path, web_dir: Path, *, templates_dir: Path | None = None) -> None`.

Comportamento:
1. **Sempre** lê `web/data/ranking.json` (schema do spec) e regenera `web/index.html`.
2. **Opcionalmente** procura `web/data/{jogos,palpites,resultados,pontuacoes}.json`. Se `jogos.json` e `palpites.json` existirem, gera também `web/ia/<slug>.html` e `web/jogo/<numero>.html`.
3. Usa `StrictUndefined` (erro explícito em variável faltando — força contratos limpos).
4. `templates_dir` parametrizável pra qa-tester poder testar com fixtures.

### Dados estáticos comprometidos

- `web/data/ranking.json` — placeholder em estado vazio (0 IAs, 0/104 apurados). Apaga assim que o pipeline-dev rodar `python -m bolao ranking` pela primeira vez.
- `web/index.html` — gerado a partir do placeholder; mostra o empty state com instruções.

## Schema do `web/data/ranking.json` (contrato com pipeline-dev)

Conforme spec, **sem mudanças**:

```json
{
  "atualizado_em": "2026-06-13T22:30:00-03:00",  // ISO 8601 com TZ
  "ias": [
    {
      "slug": "chatgpt-5",
      "nome_display": "ChatGPT 5",
      "pontos": 45,
      "placares_exatos": 2,
      "vencedores_acertados": 5,
      "jogos_palpitados": 8
    }
  ],
  "jogos_apurados": 8,
  "jogos_totais": 104
}
```

**Ordem da lista `ias`** = ordem de exibição. O frontend confia na ordenação já aplicada pelo pipeline (invariante I3). O sort de coluna no JS é só UX.

## Schema extra proposto (pra páginas IA / jogo)

O spec só formaliza `ranking.json`. Pra renderizar `ia/<slug>.html` e `jogo/<numero>.html` precisamos de dados de palpite/resultado/pontos jogo-a-jogo. Defini o seguinte contrato auxiliar em `web/data/`:

| Arquivo | Schema |
|---|---|
| `jogos.json` | `list[{numero:int, fase:str, data:str, hora:str, local:str, time_a:str, time_b:str}]` |
| `palpites.json` | `{slug_ia: [{jogo_numero:int, gols_a:int, gols_b:int}]}` |
| `resultados.json` | `list[{jogo_numero:int, gols_a:int, gols_b:int}]` |
| `pontuacoes.json` | `list[{slug:str, jogo_numero:int, pontos:int}]` |

**Decisão**: render fica resiliente — se esses arquivos não existirem, o subcomando `ranking` ainda funciona, gerando só o `index.html`. Pipeline-dev decide se quer popular esses arquivos no subcomando `ranking` (recomendado) ou em outro estágio.

**Ação pra pipeline-dev**: nessa F4, popule pelo menos `jogos.json` e `palpites.json` em `web/data/` ao final de `python -m bolao ranking`. `resultados.json` e `pontuacoes.json` ficam opcionais.

## Smoke tests executados

1. **Estado vazio** (`web/data/ranking.json` placeholder, sem aux):
   ```
   PYTHONPATH=src python -c "from bolao.render import renderizar_html; \
     renderizar_html(Path('web/data/ranking.json'), Path('web'))"
   ```
   Resultado: `web/index.html` gerado (3056b), tabela vazia com instrução de cadastro.

2. **Estado povoado** (3 IAs, 3 jogos, todos com resultado e pontuação):
   - `index.html` (5851b) — ranking com pódio
   - `ia/{claude-opus-4-7,chatgpt-5,gemini-2-5-pro}.html` (~6.2kb cada)
   - `jogo/{1,2,7}.html` (~4.7kb cada)
   - Render: ~80ms total.

3. **HTTP local** (`python -m http.server 8765 --directory web`):
   - `GET /index.html` → 200
   - `GET /assets/style.css` → 200
   - `GET /assets/script.js` → 200
   - `GET /data/ranking.json` → 200

## Como rodar localmente (durante a Copa)

```bash
# após pipeline-dev escrever web/data/ranking.json:
python -m bolao ranking          # internamente chama renderizar_html()
python -m bolao serve            # http://localhost:8000 (a implementar — pipeline-dev)
# alternativa direta:
python -m http.server 8000 --directory web
```

## Pendências e dependências

| Item | Bloqueio | Quem resolve |
|---|---|---|
| `python -m bolao serve` | pipeline-dev precisa implementar no `__main__.py` | pipeline-dev |
| `web/data/{jogos,palpites,resultados,pontuacoes}.json` | precisam ser escritos pelo subcomando `ranking` (ou `score`) — ver schema proposto acima | pipeline-dev |
| Testes E2E do render | render.py não tem teste unitário próprio (escopo qa-tester) | qa-tester |
| Validação visual no dispositivo móvel | só validei estrutura HTML + sizes; não testei em viewport real | follow-up pós-MVP |

## Decisões de design (não-óbvias)

1. **Tailwind via CDN** (não build step) — autorizado pelo spec; zero infraestrutura, edição rápida. O custo é: requer internet pra carregar. Mitigação: `style.css` tem fallback class `.bolao-fallback` que dá pelo menos cores legíveis se CDN cair (não usei automaticamente; é só uma rede de segurança disponível).

2. **`StrictUndefined`** no Jinja2 — quebra cedo quando o pipeline passa schema diferente do esperado. Vai facilitar pegar regressões.

3. **`asset_prefix`** como variável de template — em vez de `<base href>` que tem caveats (afeta links relativos no JS, etc), uso prefixo explícito. Root = `""`, subpastas = `"../"`. Funciona sem JS e sem servidor.

4. **Sort no JS é UX, não fonte da verdade** — a ordem inicial vem do `ranking.json` (autoritativa). Clique reordena, recarregar restaura.

5. **Schema auxiliar (`jogos.json` etc.) em `web/data/`** em vez de em `data/cache/` — porque `web/` é o que vai pro GitHub Pages no futuro. Pipeline-dev pode duplicar dados de `data/cache/` pra `web/data/` no subcomando `ranking` se preferir manter `data/cache/` como caminho interno.

6. **Mobile-first**: colunas "P. Exatos" e "Vencedores" colapsam num resumo inline (`<div class="sm:hidden">`) em viewports < 640px. "Palpitados" some abaixo de 768px.

## Lições pra MEMORY

- StrictUndefined + ternários jinja com comparação `>=` quebram se valor é None — ordem dos elif importa.
- Em template Jinja com herança, `super()` não é necessário pra blocks vazios; `{% block content %}{% endblock %}` no base é suficiente.
- Render rodou em <100ms até com 3 IAs × 3 jogos; deve escalar tranquilo pra 10 × 104.
