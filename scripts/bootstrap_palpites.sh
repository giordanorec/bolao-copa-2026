#!/usr/bin/env bash
# Cria placeholders em data/palpites_ias/<slug>.md para todas as IAs cadastradas
# em docs/IAS_PARTICIPANTES.md. Idempotente: não sobrescreve arquivos que já têm
# palpites reais (detecta presença de linha `| <numero> | ... | <gols> | ... |`).
#
# Uso:
#   scripts/bootstrap_palpites.sh                  # cria todos os 39 placeholders
#   scripts/bootstrap_palpites.sh --force          # sobrescreve mesmo se já tem palpite
#   scripts/bootstrap_palpites.sh add <slug> "Nome" "URL"   # adiciona uma IA nova

set -euo pipefail
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${PROJECT_DIR}"
PALPITES_DIR="data/palpites_ias"
mkdir -p "${PALPITES_DIR}"

# Tabela mestre (slug | nome display | url | tier)
# Editar aqui ao adicionar/remover IAs.
read -r -d '' IAS_TABLE <<'EOF' || true
# tier 1 — top mercado
chatgpt-5|ChatGPT 5|https://chat.openai.com|1
chatgpt-5-thinking|ChatGPT 5 Thinking|https://chat.openai.com (modo Deep Think)|1
claude-opus-4-7|Claude Opus 4.7|https://claude.ai|1
claude-sonnet-4-6|Claude Sonnet 4.6|https://claude.ai|1
claude-haiku-4-5|Claude Haiku 4.5|https://claude.ai|1
gemini-2-5-pro|Gemini 2.5 Pro|https://gemini.google.com|1
gemini-2-5-flash|Gemini 2.5 Flash|https://gemini.google.com|1
grok-4|Grok 4|https://grok.com|1
grok-4-heavy|Grok 4 Heavy|https://grok.com (Premium+)|1
deepseek-r1|DeepSeek R1|https://chat.deepseek.com|1
deepseek-v3-1|DeepSeek V3.1|https://chat.deepseek.com|1
perplexity-sonar-pro|Perplexity Sonar Pro|https://perplexity.ai|1
copilot-microsoft|Microsoft Copilot|https://copilot.microsoft.com|1
le-chat-mistral|Le Chat (Mistral Large)|https://chat.mistral.ai|1
meta-llama-4|Meta AI (Llama 4)|https://meta.ai|1
qwen-3-max|Qwen 3 Max|https://chat.qwen.ai|1
# tier 2 — extensão
cohere-command-a|Cohere Command A|https://cohere.com/playground|2
kimi-k2|Kimi K2|https://kimi.com|2
glm-4-5|GLM-4.5|https://chatglm.cn|2
phi-4|Phi-4|https://huggingface.co/chat|2
gemma-3|Gemma 3|https://aistudio.google.com|2
reka-core|Reka Core|https://chat.reka.ai|2
llama-3-3-70b|Llama 3.3 70B|https://groq.com|2
llama-3-1-405b|Llama 3.1 405B|https://openrouter.ai|2
yi-large|Yi-Large|https://yi.01.ai|2
# tier 3 — chinesas
ernie-4-5|Ernie 4.5|https://yiyan.baidu.com|3
doubao|Doubao|https://doubao.com|3
hunyuan|Hunyuan|https://hunyuan.tencent.com|3
sensechat|SenseChat|https://chat.sensetime.com|3
minimax-abab|MiniMax abab|https://chat.minimax.io|3
step-2|Step 2|https://yuewen.cn|3
baichuan-4|Baichuan 4|https://chat.baichuan-ai.com|3
# tier 4 — legacy
gpt-4o|GPT-4o (legacy)|https://platform.openai.com/playground|4
gpt-4-1|GPT-4.1 (legacy)|https://platform.openai.com/playground|4
o3|OpenAI o3 (legacy)|https://platform.openai.com/playground|4
claude-sonnet-3-7|Claude Sonnet 3.7 (legacy)|https://console.anthropic.com|4
gemini-2-0-pro|Gemini 2.0 Pro (legacy)|https://aistudio.google.com|4
deepseek-v3|DeepSeek V3 (legacy)|https://chat.deepseek.com|4
grok-3|Grok 3 (legacy)|https://grok.com|4
EOF

write_placeholder() {
    local slug="$1" nome="$2" url="$3" tier="$4"
    local file="${PALPITES_DIR}/${slug}.md"
    cat > "${file}" <<MARKDOWN
<!-- ia: ${nome} -->
<!-- slug: ${slug} -->
<!-- tier: ${tier} -->
<!-- url: ${url} -->
<!-- status: aguardando palpite -->

# Palpite — ${nome}

> **Placeholder.** Vazio até o operador colar a resposta da IA aqui.
>
> Como preencher:
> 1. Abra ${url}
> 2. Cole o prompt de \`config/prompts/ia-palpiteira.md\`
> 3. Aguarde a resposta da IA
> 4. Cole APENAS a tabela retornada (linhas começando com \`|\`) substituindo
>    este placeholder a partir desta linha:

<!-- COLAR TABELA ABAIXO -->
MARKDOWN
}

has_real_palpites() {
    local file="$1"
    [[ -f "${file}" ]] || return 1
    # Detecta linha de palpite real: começa com `|`, número, e duas colunas
    # numéricas (gols A e B). Se houver pelo menos uma, considera "preenchido".
    grep -Eq '^\|\s*[0-9]+\s*\|.*\|\s*[0-9]+\s*\|\s*[0-9]+\s*\|' "${file}"
}

FORCE=0
if [[ "${1:-}" == "--force" ]]; then
    FORCE=1
    shift
fi

if [[ "${1:-}" == "add" ]]; then
    slug="${2:?slug obrigatório}"
    nome="${3:?nome display obrigatório}"
    url="${4:?url obrigatória}"
    write_placeholder "${slug}" "${nome}" "${url}" "custom"
    echo "→ ${PALPITES_DIR}/${slug}.md criado"
    exit 0
fi

CRIADOS=0
PULADOS=0
while IFS='|' read -r slug nome url tier; do
    # ignora linhas em branco e comentários
    [[ -z "${slug}" || "${slug}" =~ ^# ]] && continue
    file="${PALPITES_DIR}/${slug}.md"
    if has_real_palpites "${file}" && [[ ${FORCE} -eq 0 ]]; then
        PULADOS=$((PULADOS + 1))
        continue
    fi
    write_placeholder "${slug}" "${nome}" "${url}" "${tier}"
    CRIADOS=$((CRIADOS + 1))
done <<< "${IAS_TABLE}"

echo "→ ${CRIADOS} placeholders criados/atualizados"
echo "→ ${PULADOS} pulados (já têm palpites reais — use --force pra sobrescrever)"
echo ""
echo "ls ${PALPITES_DIR}/ :"
ls "${PALPITES_DIR}/" | head -50
