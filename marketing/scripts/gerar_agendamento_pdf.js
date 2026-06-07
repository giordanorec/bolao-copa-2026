/**
 * Gera marketing/AGENDAMENTO_INSTAGRAM.pdf
 *
 * Uso (na pasta v4):
 *   node ../marketing/scripts/gerar_agendamento_pdf.js
 */

const fs = require("fs");
const path = require("path");

const V4_ROOT = path.resolve(__dirname, "../../v4");
const { chromium } = require(path.join(V4_ROOT, "node_modules", "playwright"));
const OUT = path.resolve(__dirname, "..", "AGENDAMENTO_INSTAGRAM.pdf");

const HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Agendamento Instagram — Arena das IAs</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, 'Segoe UI', system-ui, sans-serif;
    color: #1A1A1A;
    line-height: 1.55;
    font-size: 11pt;
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
    font-size: 10pt; color: #666; font-weight: 600;
    margin-top: 2pt;
  }
  h1 {
    font-size: 18pt; font-weight: 900;
    color: #002776; margin-top: 18pt; margin-bottom: 8pt;
    letter-spacing: -0.02em;
    page-break-after: avoid;
  }
  h2 {
    font-size: 13pt; font-weight: 800;
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
  ul li, ol li { margin-bottom: 3pt; }
  strong { color: #002776; }
  em { color: #DD2A7B; font-style: italic; font-weight: 600; }
  code, .mono {
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    background: #F4F5F7;
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 10pt;
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
    font-size: 10pt;
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
  }
  tr:nth-child(even) td { background: #FAFBFD; }
  .badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 9pt;
    font-weight: 800;
  }
  .badge-ok { background: #E8F5EC; color: #009C3B; }
  .badge-x { background: #FCE7E7; color: #C0392B; }
  .badge-mid { background: #FFF4D6; color: #B07800; }
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
  .footer {
    margin-top: 28pt;
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
  <div class="icon">📅</div>
  <div>
    <div class="title">Agendamento de posts no Instagram</div>
    <div class="sub">Comparativo de plataformas + recomendação prática · Arena das IAs · jun/2026</div>
  </div>
</div>

<div class="destaque">
  <strong>TL;DR</strong> — A própria Meta tem a melhor opção grátis: <strong>Meta Business Suite</strong>.
  Oficial, ilimitado, aceita carrossel e agenda até 75 dias à frente.
  Único requisito: conta Instagram <strong>Business</strong> ou <strong>Creator</strong> (conversão gratuita, 30 segundos).
</div>

<h1>🏆 Recomendação: Meta Business Suite</h1>

<p><strong>Por que é a melhor opção:</strong></p>
<ul>
  <li><strong>Oficial da Meta</strong> — sem risco de quebrar com mudança de API/política</li>
  <li><strong>Grátis sem limite</strong> de posts agendados</li>
  <li>Aceita <strong>carrossel</strong> (seus 5 cards inteiros), reels, stories, posts simples</li>
  <li>Agenda <strong>até 75 dias à frente</strong></li>
  <li>Cross-post pra Facebook (se tiver Page) automático</li>
  <li>Web (<span class="mono">business.facebook.com</span>) e app mobile</li>
  <li>Analytics básico incluso</li>
</ul>

<div class="checklist">
  <h3 style="margin-top:0; color:#002776;">Como começar (passo a passo)</h3>
  <ol>
    <li><strong>Converter</strong> a conta <span class="mono">@arena.das.ias</span> pra Business no app do Instagram:<br>
        Perfil → ☰ Configurações → Conta → <strong>"Mudar para conta profissional"</strong></li>
    <li>Abrir <span class="mono">business.facebook.com</span> no desktop (login com a conta Facebook conectada ao Instagram)</li>
    <li>Menu lateral → <strong>"Planejador"</strong> (ou "Planner")</li>
    <li><strong>"+ Criar publicação"</strong> → escolhe Instagram → arrasta os 5 PNGs (vira carrossel automático)</li>
    <li>Cola a legenda → <strong>"Agendar"</strong> → escolhe data/hora</li>
    <li>Pronto. O post sai sozinho no horário marcado.</li>
  </ol>
</div>

<h1>📊 Alternativas (e por que não compensam)</h1>

<table>
  <thead>
    <tr>
      <th>Plataforma</th>
      <th>Free tier</th>
      <th>Posts agendados</th>
      <th>Veredito</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Meta Business Suite</strong></td>
      <td>Grátis pra sempre</td>
      <td>♾️ ilimitado</td>
      <td><span class="badge badge-ok">USA ESTA</span></td>
    </tr>
    <tr>
      <td>Metricool</td>
      <td>Sim</td>
      <td>50/mês</td>
      <td><span class="badge badge-mid">Bom se quiser analytics</span></td>
    </tr>
    <tr>
      <td>Buffer</td>
      <td>Sim</td>
      <td>10 por canal</td>
      <td><span class="badge badge-mid">Limitado demais</span></td>
    </tr>
    <tr>
      <td>Later</td>
      <td>Sim</td>
      <td>30/mês</td>
      <td><span class="badge badge-mid">Visual planner bonito</span></td>
    </tr>
    <tr>
      <td>Planoly</td>
      <td>Sim</td>
      <td>30/mês</td>
      <td><span class="badge badge-mid">Foco em grade visual</span></td>
    </tr>
    <tr>
      <td>Publer</td>
      <td>Sim</td>
      <td>10 ativos</td>
      <td><span class="badge badge-mid">Rascunhos ilimitados</span></td>
    </tr>
    <tr>
      <td>Hootsuite</td>
      <td>❌ Removeu em 2024</td>
      <td>—</td>
      <td><span class="badge badge-x">US$ 99/mês, não vale</span></td>
    </tr>
    <tr>
      <td>SocialBee / Loomly</td>
      <td>Trial 14 dias</td>
      <td>—</td>
      <td><span class="badge badge-x">Pago</span></td>
    </tr>
  </tbody>
</table>

<p style="font-size: 10pt; color: #666;">
  <strong>Tailwind</strong> é bom mas foco em Pinterest, perde no Insta.
  <strong>Iconosquare</strong> é pago e corporativo demais.
</p>

<h1>🤖 Pra automação via código (escalar depois)</h1>

<p><strong>Instagram Graph API</strong> (parte do Facebook Graph API):</p>
<ul>
  <li>Permite <strong>postar 100% automatizado</strong> via script</li>
  <li>Pode rodar via cronjob, GitHub Actions, Vercel Cron</li>
  <li>Suporta carrossel, reels, stories</li>
  <li><strong>Complicado de configurar</strong>: precisa de Meta Developers App + Business Verification + Long-lived Access Token</li>
  <li>Limites: 25 posts/dia/conta</li>
</ul>

<div class="destaque">
  <strong>Caso de uso</strong> — postar os 104 cards de partida automaticamente, 1 hora antes de cada jogo. Posso te ajudar a montar isso depois.
  Pra o lançamento agora, <strong>Meta Business Suite</strong> resolve.
</div>

<h1>🎯 Plano prático pros próximos dias</h1>

<div class="checklist">
  <ol>
    <li>Hoje à noite: <strong>converter conta pra Business</strong> (30s)</li>
    <li>Agendar o <strong>post de lançamento</strong> (5 cards de <span class="mono">post_jun07/</span>) pra <strong>07/jun · 19h-21h BRT</strong> — horário de pico do Instagram</li>
    <li>Agendar os <strong>cards de hype</strong> (1 por dia até 11/jun) usando os 104 da pasta <span class="mono">cards/</span></li>
    <li>Sai do app, vai ver o jogo de abertura. 🇧🇷</li>
  </ol>
</div>

<div class="footer">
  <p>
    <span class="pill pill-site">🌐 bolao.arenadasias.com.br</span>
    <span class="pill pill-insta">📸 @arena.das.ias</span>
  </p>
  <p style="margin-top: 8pt;">
    <strong>Arena das IAs</strong> · experimentos divertidos com inteligência artificial · jun/2026
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
