#!/usr/bin/env bash
# Cria placeholders em data/palpites_ias/<slug>.md para todas as IAs cadastradas.
# Idempotente: não sobrescreve arquivos que já têm palpites reais.
#
# Uso:
#   scripts/bootstrap_palpites.sh                  # cria todos os placeholders
#   scripts/bootstrap_palpites.sh --force          # sobrescreve mesmo com palpite
#   scripts/bootstrap_palpites.sh add <slug> "Nome" "URL"   # adiciona uma IA nova

set -euo pipefail
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${PROJECT_DIR}"
PALPITES_DIR="data/palpites_ias"
mkdir -p "${PALPITES_DIR}"

# Tabela mestre — formato: slug|nome display|url|tier
read -r -d '' IAS_TABLE <<'EOF' || true
# === TIER 1 — Top de mercado, web search nativa (16) ===
chatgpt-5|ChatGPT 5|https://chat.openai.com|1
chatgpt-5-thinking|ChatGPT 5 Thinking|https://chat.openai.com (Deep Think)|1
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
# === TIER 2 — Variantes mid/light dos provedores grandes (16) ===
chatgpt-5-mini|ChatGPT 5 mini|https://chat.openai.com|2
chatgpt-5-nano|ChatGPT 5 nano|https://platform.openai.com/playground|2
o3|OpenAI o3|https://platform.openai.com/playground|2
o4-mini|OpenAI o4-mini|https://platform.openai.com/playground|2
claude-opus-4-5|Claude Opus 4.5|https://claude.ai (legacy picker)|2
claude-sonnet-4-5|Claude Sonnet 4.5|https://claude.ai (legacy picker)|2
gemini-2-5-flash-lite|Gemini 2.5 Flash-Lite|https://aistudio.google.com|2
gemini-2-0-pro|Gemini 2.0 Pro|https://aistudio.google.com|2
gemini-2-0-flash|Gemini 2.0 Flash|https://aistudio.google.com|2
grok-4-fast|Grok 4 Fast Reasoning|https://grok.com|2
grok-3|Grok 3|https://grok.com|2
grok-3-mini|Grok 3 mini|https://grok.com|2
deepseek-v3-2|DeepSeek V3.2|https://chat.deepseek.com|2
mistral-medium-3|Mistral Medium 3|https://chat.mistral.ai|2
mistral-small-3|Mistral Small 3|https://chat.mistral.ai|2
cohere-command-r-plus|Cohere Command R+|https://cohere.com/playground|2
# === TIER 3 — Open source via Groq/HF/OpenRouter (20) ===
llama-4-maverick|Llama 4 Maverick|https://groq.com|3
llama-4-scout|Llama 4 Scout|https://groq.com|3
llama-3-3-70b|Llama 3.3 70B|https://groq.com|3
llama-3-1-405b|Llama 3.1 405B|https://openrouter.ai|3
llama-3-1-70b|Llama 3.1 70B|https://groq.com|3
llama-3-2-90b-vision|Llama 3.2 90B Vision|https://openrouter.ai|3
mixtral-8x22b|Mixtral 8x22B|https://chat.mistral.ai|3
ministral-8b|Ministral 8B|https://chat.mistral.ai|3
codestral|Codestral|https://chat.mistral.ai|3
pixtral-large|Pixtral Large|https://chat.mistral.ai|3
mathstral|Mathstral|https://huggingface.co/chat|3
qwen-3-235b|Qwen 3 235B|https://chat.qwen.ai|3
qwen-3-coder|Qwen 3 Coder|https://huggingface.co/chat|3
qwq-32b|QwQ 32B (reasoner)|https://huggingface.co/chat|3
qwen-2-5-72b|Qwen 2.5 72B|https://chat.qwen.ai|3
nemotron-70b|NVIDIA Nemotron 70B|https://build.nvidia.com|3
nemotron-340b|NVIDIA Nemotron 340B|https://build.nvidia.com|3
dbrx-instruct|Databricks DBRX Instruct|https://huggingface.co/chat|3
snowflake-arctic|Snowflake Arctic|https://huggingface.co/chat|3
nous-hermes-3|Nous Hermes 3|https://openrouter.ai|3
# === TIER 4 — Modelos chineses (telefone/VPN comum) (10) ===
ernie-4-5|Ernie 4.5|https://yiyan.baidu.com|4
doubao|Doubao|https://doubao.com|4
hunyuan|Hunyuan|https://hunyuan.tencent.com|4
sensechat|SenseChat|https://chat.sensetime.com|4
minimax-abab|MiniMax abab|https://chat.minimax.io|4
step-2|Step 2|https://yuewen.cn|4
baichuan-4|Baichuan 4|https://chat.baichuan-ai.com|4
spark-4-ultra|iFlytek Spark 4.0 Ultra|https://xinghuo.xfyun.cn|4
glm-4-5|GLM-4.5|https://chatglm.cn|4
glm-4-5-air|GLM-4.5 Air|https://chatglm.cn|4
# === TIER 5 — Legacy / gerações anteriores (15) ===
gpt-4o|GPT-4o (legacy)|https://platform.openai.com/playground|5
gpt-4-1|GPT-4.1 (legacy)|https://platform.openai.com/playground|5
o1|OpenAI o1 (legacy)|https://platform.openai.com/playground|5
claude-sonnet-3-7|Claude Sonnet 3.7 (legacy)|https://console.anthropic.com|5
claude-sonnet-3-5|Claude Sonnet 3.5 (legacy)|https://console.anthropic.com|5
claude-opus-3|Claude Opus 3 (legacy)|https://console.anthropic.com|5
claude-haiku-3-5|Claude Haiku 3.5 (legacy)|https://console.anthropic.com|5
gemini-1-5-pro|Gemini 1.5 Pro (legacy)|https://aistudio.google.com|5
gemini-1-5-flash|Gemini 1.5 Flash (legacy)|https://aistudio.google.com|5
deepseek-v3|DeepSeek V3 (legacy)|https://chat.deepseek.com|5
grok-2|Grok 2 (legacy)|https://platform.x.ai|5
llama-3-70b|Llama 3 70B (legacy)|https://groq.com|5
mixtral-8x7b|Mixtral 8x7B (legacy)|https://chat.mistral.ai|5
pixtral-12b|Pixtral 12B (legacy)|https://huggingface.co/chat|5
gemma-2-27b|Gemma 2 27B (legacy)|https://huggingface.co/chat|5
# === TIER 6 — Especializadas: visão / código / math (8) ===
gemma-3-27b|Gemma 3 27B|https://aistudio.google.com|6
gemma-3-12b|Gemma 3 12B|https://huggingface.co/chat|6
phi-4|Phi-4|https://huggingface.co/chat|6
phi-4-mini|Phi-4 mini|https://huggingface.co/chat|6
wizardlm-2-8x22b|WizardLM 2 8x22B|https://huggingface.co/chat|6
qwen-vl-max|Qwen VL Max (vision)|https://chat.qwen.ai|6
molmo-72b|Allen AI Molmo 72B (vision)|https://molmo.allenai.org|6
cohere-aya-expanse|Cohere Aya Expanse 32B|https://cohere.com/playground|6
# === TIER 7 — Diversificados / nicho (12) ===
cohere-command-a|Cohere Command A|https://cohere.com/playground|7
cohere-command-r|Cohere Command R|https://cohere.com/playground|7
kimi-k2|Kimi K2|https://kimi.com|7
yi-large|Yi-Large|https://yi.01.ai|7
yi-lightning|Yi-Lightning|https://yi.01.ai|7
reka-core|Reka Core|https://chat.reka.ai|7
reka-flash|Reka Flash|https://chat.reka.ai|7
falcon-3-10b|TII Falcon 3 10B|https://huggingface.co/chat|7
falcon-180b|TII Falcon 180B|https://huggingface.co/chat|7
olmo-2-32b|Allen AI OLMo 2 32B|https://playground.allenai.org|7
tulu-3-405b|Allen AI Tülu 3 405B|https://playground.allenai.org|7
jamba-1-5-large|AI21 Jamba 1.5 Large|https://studio.ai21.com|7
# === TIER 8 — Conversacionais e curiosidades (8) ===
inflection-pi|Inflection Pi|https://pi.ai|8
inflection-3|Inflection 3|https://pi.ai|8
perplexity-sonar-reasoning|Perplexity Sonar Reasoning|https://perplexity.ai|8
perplexity-sonar-large|Perplexity Sonar Large|https://perplexity.ai|8
ibm-granite-3-1-8b|IBM Granite 3.1 8B|https://huggingface.co/chat|8
lfm-40b|Liquid AI LFM-40B|https://chat.liquid.ai|8
lfm-7b|Liquid AI LFM-7B|https://chat.liquid.ai|8
stablelm-2-12b|Stability StableLM 2 12B|https://huggingface.co/chat|8
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
TIERS=()
while IFS='|' read -r slug nome url tier; do
    [[ -z "${slug}" || "${slug}" =~ ^# ]] && continue
    file="${PALPITES_DIR}/${slug}.md"
    if has_real_palpites "${file}" && [[ ${FORCE} -eq 0 ]]; then
        PULADOS=$((PULADOS + 1))
        continue
    fi
    write_placeholder "${slug}" "${nome}" "${url}" "${tier}"
    CRIADOS=$((CRIADOS + 1))
    TIERS+=("${tier}")
done <<< "${IAS_TABLE}"

echo "→ ${CRIADOS} placeholders criados/atualizados"
echo "→ ${PULADOS} pulados (use --force pra sobrescrever)"
echo ""
echo "distribuição por tier:"
printf '%s\n' "${TIERS[@]}" | sort | uniq -c | awk '{printf "  tier %s: %s IAs\n", $2, $1}'
echo ""
echo "total atual em ${PALPITES_DIR}/:"
ls "${PALPITES_DIR}/" | wc -l
