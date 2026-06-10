/**
 * Gera marketing/Post_jun09/RESUMO_POST_09JUN.pdf
 *
 * Uso (na pasta v4):
 *   node ../marketing/scripts/gerar_pdf_post_09jun.js
 */

const fs = require("fs");
const path = require("path");

const V4_ROOT = path.resolve(__dirname, "../../v4");
const { chromium } = require(path.join(V4_ROOT, "node_modules", "playwright"));
const OUT = path.resolve(__dirname, "..", "Post_jun09", "RESUMO_POST_09JUN.pdf");

const HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Post 09/jun — Bolão das IAs · Personificamos as IAs</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, 'Segoe UI', system-ui, sans-serif;
    color: #1A1A1A;
    line-height: 1.55;
    font-size: 10.5pt;
  }
  .top-stripe {
    height: 4px;
    background: linear-gradient(90deg, #009C3B 0%, #FFCE00 50%, #002776 100%);
    margin-bottom: 18pt;
  }
  .header {
    display: flex; align-items: center; gap: 12px;
    padding-bottom: 14pt; margin-bottom: 16pt;
    border-bottom: 1px solid #DDD;
  }
  .header .icon { font-size: 32pt; line-height: 1; }
  .header .title {
    font-size: 22pt; font-weight: 900;
    color: #002776; letter-spacing: -0.02em;
    line-height: 1.1;
  }
  .header .sub {
    font-size: 9.5pt; color: #666; font-weight: 600;
    margin-top: 2pt;
  }
  h1 {
    font-size: 17pt; font-weight: 900;
    color: #002776; margin-top: 18pt; margin-bottom: 8pt;
    letter-spacing: -0.02em;
    page-break-after: avoid;
  }
  h2 {
    font-size: 12.5pt; font-weight: 800;
    color: #002776; margin-top: 14pt; margin-bottom: 6pt;
    page-break-after: avoid;
  }
  h3 {
    font-size: 11pt; font-weight: 800;
    color: #009C3B; margin-top: 10pt; margin-bottom: 4pt;
    page-break-after: avoid;
  }
  p { margin-bottom: 6pt; }
  ul, ol { margin: 4pt 0 8pt 18pt; }
  ul li, ol li { margin-bottom: 4pt; }
  strong { color: #002776; }
  em { color: #DD2A7B; font-style: italic; font-weight: 600; }
  code, .mono {
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    background: #F4F5F7;
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 9.5pt;
  }
  .destaque {
    background: linear-gradient(135deg, rgba(0,156,59,0.06), rgba(255,206,0,0.04));
    border-left: 4px solid #009C3B;
    padding: 10pt 14pt;
    margin: 10pt 0;
    border-radius: 0 8px 8px 0;
  }
  .destaque strong { color: #009C3B; }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 8pt 0 12pt;
    font-size: 9.5pt;
    page-break-inside: avoid;
  }
  th {
    background: #002776; color: #fff;
    text-align: left; padding: 6pt 8pt;
    font-weight: 700;
  }
  td {
    padding: 6pt 8pt;
    border-bottom: 1px solid #EEE;
    vertical-align: top;
  }
  tr:nth-child(even) td { background: #FAFBFD; }
  .checklist {
    background: #F8FAFC;
    border: 1.5px solid #009C3B;
    border-radius: 12px;
    padding: 14pt 16pt;
    margin: 12pt 0;
    page-break-inside: avoid;
  }
  .checklist ol { margin-left: 16pt; }
  .checklist li {
    margin-bottom: 6pt;
    font-size: 10.5pt;
    line-height: 1.5;
  }
  .checklist li::marker { font-weight: 900; color: #009C3B; }
  .caption-box {
    background: #1A1A1A;
    color: #F5F5F5;
    padding: 14pt 16pt;
    border-radius: 10px;
    margin: 10pt 0;
    font-family: 'JetBrains Mono', monospace;
    font-size: 9.5pt;
    line-height: 1.5;
    white-space: pre-wrap;
    page-break-inside: avoid;
  }
  .footer {
    margin-top: 24pt;
    padding-top: 14pt;
    border-top: 2px dashed #DDD;
    text-align: center;
    font-size: 9pt;
    color: #888;
  }
  .footer strong { color: #002776; font-weight: 800; }
  .pill {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3pt 8pt;
    border-radius: 999px;
    font-size: 9pt; font-weight: 700;
    color: #fff;
    margin: 2pt 2pt 2pt 0;
  }
  .pill-site { background: #009C3B; }
  .pill-insta {
    background: linear-gradient(135deg, #F58529, #DD2A7B, #8134AF);
  }
  hr {
    border: 0;
    border-top: 1px solid #E5E7EB;
    margin: 12pt 0;
  }
</style>
</head>
<body>

<div class="top-stripe"></div>

<div class="header">
  <div class="icon">🤖</div>
  <div>
    <div class="title">Post de hoje — 09/jun/2026</div>
    <div class="sub">Carrossel "Personificamos as 10 IAs" · D-2 da Copa · Bolão das IAs</div>
  </div>
</div>

<div class="destaque">
  <strong>Tema</strong> — Personificamos as 10 IAs do bolão. Adivinha qual delas é você?
  Carrossel de 12 cards no formato Buzzfeed-quiz para alta viralidade (identificação + marca-amigo + comentários).
</div>

<h1>📦 Carrossel pronto</h1>

<p>
  12 cards (1080×1080) em <span class="mono">marketing/Post_jun09/</span> +
  <span class="mono">post_jun09.zip</span> no Desktop (800 KB).
</p>

<table>
  <thead>
    <tr>
      <th style="width: 38pt;">#</th>
      <th>Conteúdo</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>01</td><td><strong>Capa</strong> — "A gente personificou as 10 IAs. Adivinha qual delas é você? 👀"</td></tr>
    <tr><td>02</td><td><strong>ChatGPT</strong> — 🧐 O Estatístico ("Calculei. Vai dar 2-1.")</td></tr>
    <tr><td>03</td><td><strong>Claude</strong> — 🤔 O Filósofo do Empate ("Tudo é 1-1 no fundo, né?")</td></tr>
    <tr><td>04</td><td><strong>Gemini</strong> — 🇧🇷 O Otimista Brasileiro ("Brasil 4-0, bora!")</td></tr>
    <tr><td>05</td><td><strong>Grok</strong> — 🍻 O Maluco do Bar ("5-3, escreve aí.")</td></tr>
    <tr><td>06</td><td><strong>DeepSeek</strong> — 🥷 O Ninja ("1-0. Próximo.")</td></tr>
    <tr><td>07</td><td><strong>Copilot</strong> — 💼 O Office ("Conforme o padrão: 2-1.")</td></tr>
    <tr><td>08</td><td><strong>Perplexity</strong> — 🔍 O Pesquisador ("Cruzei 12 fontes: 2-1.")</td></tr>
    <tr><td>09</td><td><strong>Llama (Meta)</strong> — 📱 O Influencer ("O trending tá 3-1.")</td></tr>
    <tr><td>10</td><td><strong>Le Chat</strong> — 🥂 Le Sommelier ("Un bonito 1-0.")</td></tr>
    <tr><td>11</td><td><strong>Qwen</strong> — ☯️ O Mestre Zen ("1-1. Equilíbrio.")</td></tr>
    <tr><td>12</td><td><strong>CTA</strong> — "E aí, qual IA você é?" + botão "Criar bolão em 30s"</td></tr>
  </tbody>
</table>

<h1>⏰ Horário ideal pra hoje (terça, 09/jun)</h1>

<div class="destaque">
  <strong>Janela ótima: 19h-21h BRT</strong>, com <strong>pico estratégico às 19h30</strong>.
</div>

<p><strong>Por quê hoje (terça pré-Copa):</strong></p>
<ul>
  <li>Pessoal voltou do trabalho, jantou, vai pro feed</li>
  <li>Conversas sobre Copa começam pegar tração (quarta tem "véspera" — terça é quando o assunto está esquentando)</li>
  <li>Posts longos tipo carrossel (12 cards) <strong>funcionam bem porque retêm atenção</strong> — Insta lê o tempo gasto e empurra mais</li>
</ul>

<p>
  <strong>Postar exatamente 19h30</strong> e ficar online por 1h pra responder TODO comentário
  (responder cedo é o que mais empurra o algoritmo).
</p>

<h1>📝 Caption pronta pra colar</h1>

<div class="caption-box">PERSONIFICAMOS AS 10 IAs DO BOLÃO. 🤖✨

A gente pegou ChatGPT, Claude, Gemini, Grok, DeepSeek, Copilot, Perplexity, Llama, Le Chat e Qwen — todos palpitando a Copa 2026 — e demos uma personalidade pra cada.

Spoiler:
🧐 ChatGPT é o cara que pensa demais antes de chutar 2-1
🤔 Claude vê empate em tudo
🇧🇷 Gemini é o otimista que crava Brasil 4-0
🍻 Grok é o maluco do bar
🥷 DeepSeek é o ninja minimalista
...e mais 5 que você precisa ver pra acreditar.

E aí — qual delas é você?

👉 Marca aquele AMIGO Grok do grupo
👉 Marca o COLEGA Claude do escritório
👉 Marca a TIA GEMINI do churrasco

🌐 bolao.arenadasias.com.br (cria teu bolão, palpita os 104 jogos, e descobre se você apostou igual a uma delas)
📸 segue @arena.das.ias

#BolaoDaCopa #Copa2026 #FifaWorldCup2026 #ChatGPT #Claude #Gemini #Grok #IA #BolaoDasIAs #ArenaDasIAs #BolaoDaFamilia #BrasilNaCopa #PalpitesDaCopa #TechBR #InteligenciaArtificial</div>

<h1>🚀 Táticas pra dar empurrada</h1>
<p style="font-size: 10pt; color: #666;">
  5 min de trabalho, alto impacto na primeira hora após postar.
</p>

<div class="checklist">
  <h3 style="margin-top: 0; color: #002776;">Checklist pós-publicação</h3>
  <ol>
    <li>
      <strong>Stories (logo após postar feed)</strong>:
      <ul style="margin-top: 4pt;">
        <li>Story 1: print do CTA + adesivo "🆕 NOVO POST"</li>
        <li>Story 2: enquete "Qual IA é você?" com 4 opções</li>
        <li>Story 3: print do feed pedindo "vai lá conferir"</li>
      </ul>
    </li>
    <li>
      <strong>WhatsApp (efeito multiplicador)</strong>:
      <br>Manda o Card 1 + link do post em 3-5 grupos onde você está ativo.
      Texto curto: <em>"Fiz um quiz aqui rs, qual IA você acha que é?"</em>
    </li>
    <li>
      <strong>DM pra 5-10 amigos próximos</strong>:
      Pede pra curtir + comentar nas primeiras 30min ("preciso do empurrão inicial pro algoritmo, valeu 🙏").
      É a tática mais efetiva de growth orgânico.
    </li>
    <li>
      <strong>Repost no LinkedIn (versão profissional)</strong>:
      "Brincando com IA — personifiquei 10 LLMs como brasileiros. Resultado divertido + reflexão sobre como cada modelo aborda problemas." Tech recruiters adoram, vira viral rápido lá.
    </li>
    <li>
      <strong>Comentário em pages grandes</strong>:
      Globo Esporte, GE, OneFootball, SporTV postam sobre Copa hoje à tarde/noite —
      comenta algo divertido relacionado ao tema usando o "qual IA você é" → tráfego orgânico free.
    </li>
  </ol>
</div>

<h1>💡 Por que esse formato (e não outro)</h1>

<table>
  <thead>
    <tr>
      <th>Característica</th>
      <th>Por que importa</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Identificação</strong></td>
      <td>Todo mundo quer "ser uma IA" → efeito Buzzfeed quiz, retém atenção</td>
    </tr>
    <tr>
      <td><strong>Marca-amigo</strong></td>
      <td>"Marca o Claude desse grupo aqui" — comportamento natural no Insta BR</td>
    </tr>
    <tr>
      <td><strong>Comentários</strong></td>
      <td>"Sou o Grok kkkk" — o algoritmo lê isso como conta interativa e empurra mais</td>
    </tr>
    <tr>
      <td><strong>Não polariza</strong></td>
      <td>Humor leve, sem queimar Brasil ou polemizar — sem risco de backlash</td>
    </tr>
    <tr>
      <td><strong>Vira série</strong></td>
      <td>"Qual IA seria nas eleições?", "Qual IA é seu chefe?", "Qual IA é seu pai?"…</td>
    </tr>
  </tbody>
</table>

<div class="footer">
  <p>
    <span class="pill pill-site">🌐 bolao.arenadasias.com.br</span>
    <span class="pill pill-insta">📸 @arena.das.ias</span>
  </p>
  <p style="margin-top: 8pt;">
    <strong>Bolão das IAs</strong> · Post de 09/jun/2026 · D-2 da Copa 2026
  </p>
</div>

</body>
</html>`;

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(HTML, { waitUntil: "networkidle" });
  await page.pdf({
    path: OUT,
    format: "A4",
    printBackground: true,
    margin: { top: "12mm", bottom: "12mm", left: "12mm", right: "12mm" },
  });
  await browser.close();
  const stats = fs.statSync(OUT);
  console.log(`✓ PDF gerado: ${OUT}`);
  console.log(`  ${(stats.size / 1024).toFixed(1)} KB`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
