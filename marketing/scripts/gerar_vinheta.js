/**
 * Vinheta animada (Reels 1080x1920) por jogo — "Bola de Cristal das IAs".
 * Renderiza um HTML com timeline de animação CSS e usa Playwright para:
 *   - gravar o vídeo (webm) da vinheta inteira
 *   - capturar 1 poster PNG no clímax (revelação do placar)
 *
 * Uso (na pasta v4, onde está o playwright):
 *   node ../marketing/scripts/gerar_vinheta.js <numero_jogo> [n2 n3 ...]
 *   node ../marketing/scripts/gerar_vinheta.js all      # oitavas 73-88
 *   (sem arg: usa o jogo 76 — Brasil x Japão, como exemplo)
 *
 * Saída: ../vinhetas/vinheta-J<num>-<a>-<b>.webm + .poster.png + .mp4
 *
 * mp4 (Instagram não aceita webm): convertido automaticamente se ffmpeg
 * estiver no PATH ou em FFMPEG_BIN. Comando equivalente:
 *   ffmpeg -i vinheta.webm -movflags +faststart -pix_fmt yuv420p vinheta.mp4
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const FFMPEG_BIN =
  process.env.FFMPEG_BIN ||
  "C:/Users/grec/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1.2-full_build/bin/ffmpeg.exe";

const V4_ROOT = path.resolve(__dirname, "../../v4");
const { chromium } = require(path.join(V4_ROOT, "node_modules", "playwright"));
const PUB = path.join(V4_ROOT, "public");
const OUT = path.resolve(__dirname, "../vinhetas");
fs.mkdirSync(OUT, { recursive: true });

const jogos = JSON.parse(fs.readFileSync(path.join(PUB, "jogos.json"), "utf-8"));
const listaJogos = Array.isArray(jogos) ? jogos : jogos.jogos || [];
const porJogo = JSON.parse(
  fs.readFileSync(path.join(PUB, "palpites_por_jogo.json"), "utf-8"),
);
const iso = JSON.parse(fs.readFileSync(path.join(PUB, "paises_iso.json"), "utf-8"));
delete iso._README;

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
function rotuloData(data) {
  if (!data) return "";
  const dt = new Date(`${data}T12:00:00Z`);
  const [, mes, dia] = data.split("-");
  return `${DIAS[dt.getUTCDay()]} ${dia}/${mes}`;
}
const flag = (t) =>
  `https://hatscripts.github.io/circle-flags/flags/${iso[t] || "xx"}.svg`;

// Lista de jogos pra renderizar (argv: números, "all" = 73-88, default 76)
const args = process.argv.slice(2);
let nums;
if (args.length === 0) nums = [76];
else if (args[0].toLowerCase() === "all")
  nums = Array.from({ length: 16 }, (_, i) => 73 + i);
else nums = args.map((a) => parseInt(a, 10)).filter((n) => !Number.isNaN(n));

function buildHtml(num) {
  const j = listaJogos.find((x) => x.numero === num);
  if (!j) return null;
  const dados = porJogo[String(num)] || {};
  const bola = dados.bola_de_cristal || null;
  const votos = bola ? bola.votos : 0;
  const faseRotulo =
    j.fase === "R32" || j.numero >= 73 ? "OITAVAS DE FINAL" : "FASE DE GRUPOS";
  const placar = bola
    ? `${bola.gols_a}<span class="x">×</span>${bola.gols_b}`
    : "?";
  const linhaVotos = bola
    ? `${votos} de 122 IAs cravam esse placar`
    : "as 122 IAs ainda não fecharam";
  const slug = `J${num}-${iso[j.time_a] || "a"}-${iso[j.time_b] || "b"}`;
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Archivo+Black&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body { width:1080px; height:1920px; overflow:hidden; }
  .stage {
    width:1080px; height:1920px; position:relative;
    background:
      radial-gradient(900px 900px at 50% 30%, #2a1257 0%, #150a2e 45%, #0a0518 100%);
    font-family:'Sora',sans-serif; color:#fff; overflow:hidden;
  }
  /* estrelas/partículas */
  .stars { position:absolute; inset:0; opacity:.5; }
  .stars i {
    position:absolute; width:3px; height:3px; border-radius:50%;
    background:#fff; animation:tw 2.4s ease-in-out infinite;
  }
  @keyframes tw { 0%,100%{opacity:.15;transform:scale(.6)} 50%{opacity:.9;transform:scale(1.2)} }
  .glow {
    position:absolute; left:50%; top:30%; width:760px; height:760px;
    transform:translate(-50%,-50%);
    background:radial-gradient(circle, rgba(157,78,221,.55) 0%, rgba(157,78,221,0) 65%);
    filter:blur(8px); animation:pulse 3.2s ease-in-out infinite;
  }
  @keyframes pulse { 0%,100%{opacity:.6;transform:translate(-50%,-50%) scale(.95)} 50%{opacity:1;transform:translate(-50%,-50%) scale(1.08)} }

  /* topo: marca */
  .brand {
    position:absolute; top:96px; left:0; right:0; text-align:center;
    opacity:0; animation:fadeDown .8s ease forwards .15s;
  }
  .brand .crystal { font-size:120px; line-height:1; filter:drop-shadow(0 0 30px rgba(157,78,221,.9)); }
  .brand .kicker {
    margin-top:8px; font-weight:800; letter-spacing:.22em; font-size:30px;
    color:#cdb4ff; text-transform:uppercase;
  }
  .fase {
    display:inline-block; margin-top:18px; padding:10px 26px; border-radius:999px;
    background:rgba(255,255,255,.08); border:1px solid rgba(205,180,255,.4);
    font-weight:700; letter-spacing:.14em; font-size:26px; color:#fff;
  }

  /* confronto */
  .match {
    position:absolute; top:560px; left:0; right:0;
    display:flex; align-items:center; justify-content:center; gap:60px;
  }
  .team { text-align:center; width:340px; }
  .team img { width:230px; height:230px; border-radius:50%; box-shadow:0 14px 50px rgba(0,0,0,.5); }
  .team .nome { margin-top:22px; font-weight:800; font-size:42px; }
  .teamA { opacity:0; animation:inL .9s cubic-bezier(.2,.9,.25,1) forwards 1.0s; }
  .teamB { opacity:0; animation:inR .9s cubic-bezier(.2,.9,.25,1) forwards 1.0s; }
  .vs {
    font-family:'Archivo Black',sans-serif; font-size:78px; color:#9d4edd;
    opacity:0; animation:pop .6s ease forwards 1.5s; text-shadow:0 0 30px rgba(157,78,221,.8);
  }

  /* placar revelado */
  .reveal {
    position:absolute; top:980px; left:0; right:0; text-align:center;
    opacity:0; animation:stamp .7s cubic-bezier(.18,1.5,.3,1) forwards 2.7s;
  }
  .reveal .label {
    font-weight:700; letter-spacing:.18em; font-size:30px; color:#cdb4ff; text-transform:uppercase;
  }
  .reveal .placar {
    font-family:'Archivo Black',sans-serif; font-size:230px; line-height:1; margin-top:6px;
    background:linear-gradient(180deg,#fff 0%,#cdb4ff 100%);
    -webkit-background-clip:text; background-clip:text; color:transparent;
    filter:drop-shadow(0 0 40px rgba(157,78,221,.6));
  }
  .reveal .placar .x { font-size:120px; padding:0 28px; color:#9d4edd; -webkit-text-fill-color:#9d4edd; }
  .reveal .votos {
    margin-top:4px; font-weight:700; font-size:38px; color:#ffd34d;
    opacity:0; animation:fadeUp .6s ease forwards 3.3s;
  }

  /* rodapé CTA */
  .cta {
    position:absolute; bottom:120px; left:0; right:0; text-align:center;
    opacity:0; animation:fadeUp .7s ease forwards 4.2s;
  }
  .cta .pergunta { font-weight:800; font-size:54px; }
  .cta .pergunta b { color:#ffd34d; }
  .cta .site {
    margin-top:26px; display:inline-block; padding:18px 44px; border-radius:18px;
    background:linear-gradient(135deg,#9d4edd,#6d28d9); font-weight:800; font-size:40px;
    box-shadow:0 14px 50px rgba(109,40,217,.6);
  }
  .cta .handle { margin-top:20px; font-size:32px; color:#cdb4ff; font-weight:700; }

  @keyframes fadeDown { from{opacity:0;transform:translateY(-30px)} to{opacity:1;transform:none} }
  @keyframes fadeUp   { from{opacity:0;transform:translateY(30px)}  to{opacity:1;transform:none} }
  @keyframes inL { from{opacity:0;transform:translateX(-120px)} to{opacity:1;transform:none} }
  @keyframes inR { from{opacity:0;transform:translateX(120px)}  to{opacity:1;transform:none} }
  @keyframes pop { 0%{opacity:0;transform:scale(.3)} 70%{transform:scale(1.25)} 100%{opacity:1;transform:scale(1)} }
  @keyframes stamp { 0%{opacity:0;transform:scale(2.2);filter:blur(8px)} 60%{opacity:1;transform:scale(.92)} 100%{opacity:1;transform:scale(1);filter:blur(0)} }
</style></head>
<body>
  <div class="stage">
    <div class="stars" id="stars"></div>
    <div class="glow"></div>

    <div class="brand">
      <div class="crystal">🔮</div>
      <div class="kicker">Bola de Cristal das IAs</div>
      <div><span class="fase">${faseRotulo} · ${rotuloData(j.data)}</span></div>
    </div>

    <div class="match">
      <div class="team teamA">
        <img src="${flag(j.time_a)}" />
        <div class="nome">${j.time_a}</div>
      </div>
      <div class="vs">×</div>
      <div class="team teamB">
        <img src="${flag(j.time_b)}" />
        <div class="nome">${j.time_b}</div>
      </div>
    </div>

    <div class="reveal">
      <div class="label">O placar mais votado</div>
      <div class="placar">${placar}</div>
      <div class="votos">${linhaVotos}</div>
    </div>

    <div class="cta">
      <div class="pergunta">E você, <b>concorda</b><br>com as máquinas?</div>
      <div class="site">bolao.arenadasias.com.br</div>
      <div class="handle">@arena.das.ias</div>
    </div>
  </div>
  <script>
    const s = document.getElementById('stars');
    let h = '';
    for (let i=0;i<70;i++){
      h += '<i style="left:'+(Math.random()*100)+'%;top:'+(Math.random()*100)+'%;animation-delay:'+(Math.random()*2.4)+'s"></i>';
    }
    s.innerHTML = h;
  </script>
</body></html>`;
  return { html, slug, j };
}

function toMp4(webm, mp4) {
  if (!fs.existsSync(FFMPEG_BIN)) {
    console.warn("  (ffmpeg não encontrado — pulando mp4)");
    return false;
  }
  execFileSync(
    FFMPEG_BIN,
    ["-y", "-i", webm, "-movflags", "+faststart", "-pix_fmt", "yuv420p", "-r", "30", mp4],
    { stdio: "ignore" },
  );
  return true;
}

async function renderOne(browser, num) {
  const built = buildHtml(num);
  if (!built) {
    console.error(`Jogo ${num} não encontrado — pulando.`);
    return;
  }
  const { html, slug } = built;
  const htmlPath = path.join(OUT, `_${slug}.html`);
  fs.writeFileSync(htmlPath, html, "utf-8");

  const context = await browser.newContext({
    viewport: { width: 1080, height: 1920 },
    deviceScaleFactor: 1,
    recordVideo: { dir: OUT, size: { width: 1080, height: 1920 } },
  });
  const page = await context.newPage();
  await page.goto("file://" + htmlPath.replace(/\\/g, "/"));
  await page.waitForTimeout(600);
  await page.waitForTimeout(2800); // poster no clímax
  await page.screenshot({ path: path.join(OUT, `vinheta-${slug}.poster.png`) });
  await page.waitForTimeout(2600); // resto da timeline
  await page.close();
  const tmp = await page.video().path();
  await context.close();
  const finalWebm = path.join(OUT, `vinheta-${slug}.webm`);
  fs.copyFileSync(tmp, finalWebm);
  fs.rmSync(tmp, { force: true });
  const mp4 = path.join(OUT, `vinheta-${slug}.mp4`);
  const hasMp4 = toMp4(finalWebm, mp4);
  fs.rmSync(htmlPath, { force: true });
  console.log(`OK J${num}: poster + webm${hasMp4 ? " + mp4" : ""} (${slug})`);
}

(async () => {
  const browser = await chromium.launch();
  for (const num of nums) {
    await renderOne(browser, num);
  }
  await browser.close();
  console.log(`\nFeito. ${nums.length} vinheta(s) em ${OUT}`);
})();
