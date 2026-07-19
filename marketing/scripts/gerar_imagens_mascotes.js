#!/usr/bin/env node
/*
 * Gera imagens VIRAIS dos mascotes da Série A via Gemini web (Nano Banana),
 * dirigindo o Chrome do usuário por CDP (porta 9222).
 *
 * Pré-requisito: scripts/abrir_chrome_debug.ps1 -Profile "Profile 7"
 *
 * Uso:
 *   node marketing/scripts/gerar_imagens_mascotes.js --list        # lista cenas
 *   node marketing/scripts/gerar_imagens_mascotes.js 01            # gera 1 cena
 *   node marketing/scripts/gerar_imagens_mascotes.js --all         # todas
 *
 * Saída: marketing/brainstorming_instagram/88_imagens_mascotes-nano-banana/<cena>.png
 *        + <cena>-shot.png (screenshot da conversa, pra diagnóstico)
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const { chromium } = require(path.join(ROOT, "v4", "node_modules", "playwright"));

const MASCOTS = path.join(ROOT, "v4", "public", "mascots");
const OUT = path.join(ROOT, "marketing", "brainstorming_instagram", "88_imagens_mascotes-nano-banana");

const NEW_CHAT = "https://gemini.google.com/u/1/app";

// Estilo base obrigatório (regra do projeto: pelúcia realista, NADA cartoon)
const STYLE = `
Photorealistic product-photography scene of REAL physical plush toys. Ultra-realistic soft minky fabric and felt textures, visible stitching and embroidered details, natural fabric wrinkles. Shot on a full-frame camera, 50mm lens, shallow depth of field, cinematic lighting. ABSOLUTELY NOT a cartoon, NOT an illustration, NOT 3D render — it must look like a professional photo of real stuffed toys. Vertical 4:5 aspect ratio for Instagram. Keep each plush toy EXACTLY as shown in the attached reference photos (same colors, same embroidered faces, same materials).`;

const SCENES = [
  {
    id: "01_campeao_chatgpt",
    refs: ["chatgpt-5-thinking-web.png"],
    prompt: `Create an image: the attached plush toy — a gray cloud with round glasses — is the CHAMPION. It stands alone at the center of a football stadium pitch at night, lifting a small shiny golden World Cup-style trophy above its head with both plush hands. Golden confetti rains down, stadium floodlights create dramatic backlight glow, blurred crowd bokeh in the background. Triumphant, epic champion energy.${STYLE}`,
  },
  {
    id: "02_podio_serie_a",
    refs: ["chatgpt-5-thinking-web.png", "grok-4-heavy-web.png", "claude-opus-4-8-web.png"],
    prompt: `Create an image: award podium ceremony at a football stadium with the three attached plush toys. On the tallest center block (1st place): the gray cloud plush with glasses, wearing a tiny golden crown and holding a small golden trophy. On the left block (2nd place): the plush rocket with the green three-eyed alien. On the right block (3rd place): the orange octopus plush, wearing a small bronze medal. White podium blocks with subtle "1", "2", "3" engravings. Confetti falling, night stadium lights, festive atmosphere.${STYLE}`,
  },
  {
    id: "03_claude_a_bruxa",
    refs: ["claude-opus-4-8-web.png"],
    prompt: `Create an image: the attached orange octopus plush toy as a mystical fortune teller. It sits behind a glowing crystal ball on a round table draped in deep purple velvet, tentacles resting on the table around tarot cards and small candles. INSIDE the crystal ball glows a tiny image of a golden trophy wrapped in the red-and-yellow flag of Spain. Purple mist, warm candlelight, mysterious and magical atmosphere — the fortune teller who KNEW who would win.${STYLE}`,
  },
  {
    id: "04_foto_oficial_time",
    refs: [
      "chatgpt-5-thinking-web.png",
      "claude-opus-4-8-web.png",
      "gemini-2-5-pro-web.png",
      "grok-4-heavy-web.png",
      "deepseek-r1-web.png",
      "copilot-microsoft-web.png",
      "perplexity-sonar-pro-web.png",
      "le-chat-mistral-web.png",
      "qwen-3-max-web.png",
      "manus-web.png",
    ],
    prompt: `Create an image: official end-of-tournament team photo of all ten attached plush toys, posed like a football squad photo on a stadium pitch — back row standing on a bench, front row kneeling on the grass, a small golden World Cup-style trophy placed on the grass front and center. Every plush from the reference photos must appear exactly once, faithful to its reference. Late afternoon golden-hour light, stadium stands softly blurred behind, gentle confetti in the air. Warm, nostalgic "end of an era" mood.${STYLE}`,
  },
  {
    id: "05_zebra_na_sala",
    refs: ["chatgpt-5-thinking-web.png", "claude-opus-4-8-web.png", "gemini-2-5-pro-web.png", "grok-4-heavy-web.png"],
    prompt: `Create an image: the four attached plush toys sit together on a cozy living-room sofa watching football on TV at night, all in comic shock — plush hands/tentacles pressed to their faces, leaning forward. Right in front of the TV, photobombing the scene, stands a realistic plush ZEBRA toy looking smugly at the camera. The TV screen shows a blurred goal celebration in red and yellow. Warm living-room lamp light, popcorn spilled on the rug from the shock. At the bottom of the image add a clean white meme-style caption with the EXACT Portuguese text: "ninguém viu a zebra chegando".${STYLE}`,
  },
  {
    id: "06_humano_entre_maquinas",
    refs: ["chatgpt-5-thinking-web.png", "claude-opus-4-8-web.png", "grok-4-heavy-web.png", "deepseek-r1-web.png", "perplexity-sonar-pro-web.png", "qwen-3-max-web.png"],
    prompt: `Create an image: a real human hand reaches down into a crowd of the six attached plush toys to grab a small golden medal on a pedestal, while all the plush toys look up at the hand in awe and applaud with their plush hands and tentacles. Dramatic single spotlight from above onto the hand and medal, dark stadium background. Symbolic scene: one human beating the machines. Respectful, epic, David-vs-Goliath mood.${STYLE}`,
  },
];

// ── Leva 2 (07-12) ──────────────────────────────────────────────────────────

SCENES.push(
  {
    id: "07_estrela_cadente",
    refs: ["gemini-2-5-pro-web.png"],
    prompt: `Create an image: the attached twin-star plush toy (blue and purple stars joined together) lies flat on its back on a football pitch at night, gazing up at the starry sky, with a tiny comical fabric bandage on one star's head. Around it, the empty stadium is dark and quiet, a single soft spotlight on the plush. A real shooting star streaks across the night sky above — the visual pun: "the fallen star". Melancholic but cute and funny mood, gentle blue night tones.${STYLE}`,
  },
  {
    id: "08_co_campeoes_taca_dividida",
    refs: ["le-chat-mistral-web.png", "grok-4-heavy-web.png"],
    prompt: `Create an image: the two attached plush toys — the orange tabby cat with beret and baguette, and the plush rocket with the green alien — stand side by side on a single champion's podium block, EACH holding one handle of the SAME golden trophy, both refusing to let go, like joint champions sharing one title. Confetti rain, night stadium floodlights, festive golden glow. Funny and heartwarming "co-champions" energy.${STYLE}`,
  },
  {
    id: "09_conselho_da_bola_de_cristal",
    refs: [
      "chatgpt-5-thinking-web.png",
      "claude-opus-4-8-web.png",
      "gemini-2-5-pro-web.png",
      "grok-4-heavy-web.png",
      "deepseek-r1-web.png",
      "le-chat-mistral-web.png",
      "qwen-3-max-web.png",
      "perplexity-sonar-pro-web.png",
    ],
    prompt: `Create an image: the eight attached plush toys sit in a circle on a football pitch at night around a large glowing crystal ball resting on the grass, like friends around a campfire — the crystal ball casts warm magical light on their plush faces. Inside the ball, a faint swirling galaxy of tiny football icons. Dark stadium around them, intimate and mystical "council of the oracle" mood.${STYLE}`,
  },
  {
    id: "10_zebra_campea",
    refs: [],
    prompt: `Create an image: a realistic plush ZEBRA toy wearing a tiny red football jersey with yellow trim (Spain colors), proudly holding a small golden World Cup-style trophy on the center circle of a stadium pitch, confetti falling, floodlights blazing. The smug champion zebra — the upset that came true. Epic and funny.${STYLE}`,
  },
  {
    id: "11_fossa_pos_copa",
    refs: ["chatgpt-5-thinking-web.png", "claude-opus-4-8-web.png", "grok-4-heavy-web.png", "gemini-2-5-pro-web.png"],
    prompt: `Create an image: the four attached plush toys slumped together on a living-room sofa in post-World-Cup emptiness — the TV shows only gray static, a deflated football lies on the rug, an empty popcorn bowl tipped over. Dim melancholic evening light from a window. One plush hugs the deflated ball. The universal "the World Cup is over, now what?" feeling. Sad-funny relatable meme energy.${STYLE}`,
  },
  {
    id: "12_ate_2030",
    refs: [
      "chatgpt-5-thinking-web.png",
      "claude-opus-4-8-web.png",
      "gemini-2-5-pro-web.png",
      "grok-4-heavy-web.png",
      "deepseek-r1-web.png",
      "copilot-microsoft-web.png",
      "perplexity-sonar-pro-web.png",
      "le-chat-mistral-web.png",
      "qwen-3-max-web.png",
      "manus-web.png",
    ],
    prompt: `Create an image: all ten attached plush toys in a big warm group hug pile on the center of a football pitch at golden-hour sunset, seen slightly from above, arranged in a heart-like cluster. Long soft shadows, the last confetti pieces on the grass around them, stadium empty and peaceful. Emotional farewell mood — "see you in 2030". Warm golden tones, gentle and touching.${STYLE}`,
  },
);

// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const a = { only: [] };
  for (let i = 2; i < argv.length; i++) {
    const t = argv[i];
    if (t === "--list") a.list = true;
    else if (t === "--all") a.all = true;
    else if (t === "--cdp") a.cdp = argv[++i];
    else a.only.push(t);
  }
  a.cdp = a.cdp || "http://localhost:9222";
  return a;
}

async function acharGemini(browser) {
  for (const ctx of browser.contexts()) {
    for (const pg of ctx.pages()) {
      try {
        if (pg.url().includes("gemini.google.com")) return pg;
      } catch {}
    }
  }
  const pg = await browser.contexts()[0].newPage();
  await pg.goto(NEW_CHAT, { waitUntil: "domcontentloaded" });
  return pg;
}

async function novaConversa(page) {
  await page.goto(NEW_CHAT, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4000);
}

async function acharInput(page) {
  const sels = ['div.ql-editor[contenteditable]', 'rich-textarea div[contenteditable="true"]', 'div[role="textbox"]'];
  for (let t = 0; t < 10; t++) {
    for (const sel of sels) {
      const loc = page.locator(sel).last();
      try {
        if (await loc.isVisible({ timeout: 1200 })) return loc;
      } catch {}
    }
    await page.waitForTimeout(2000);
  }
  return null;
}

const BTN_MENU = 'button[aria-label="Envio e ferramentas"]';

async function abrirMenu(page) {
  await page.locator(BTN_MENU).first().click();
  await page.waitForTimeout(900);
}

// Ativa a ferramenta "Criar imagem" (Nano Banana) no composer.
async function ativarCriarImagem(page) {
  try {
    await abrirMenu(page);
    await page.getByText("Criar imagem", { exact: true }).last().click({ timeout: 4000 });
    await page.waitForTimeout(800);
    return true;
  } catch (e) {
    console.log("  !! não achei 'Criar imagem':", e.message.split("\n")[0]);
    await page.keyboard.press("Escape").catch(() => {});
    return false;
  }
}

// Anexa via "Enviar arquivos" (abre file picker nativo → filechooser).
async function anexar(page, files) {
  const abs = files.map((f) => path.join(MASCOTS, f));
  try {
    await abrirMenu(page);
    const [fc] = await Promise.all([
      page.waitForEvent("filechooser", { timeout: 8000 }),
      page.getByText("Enviar arquivos", { exact: true }).last().click({ timeout: 4000 }),
    ]);
    await fc.setFiles(abs);
    return true;
  } catch (e) {
    console.log("  !! falha ao anexar:", e.message.split("\n")[0]);
    await page.keyboard.press("Escape").catch(() => {});
    return false;
  }
}

// Extrai a MAIOR imagem gerada (>=600px) via canvas. O <img> da geração só
// carrega de verdade depois de um clique no container `generated-image`
// (antes disso fica um loader eterno) — o chamador cuida do clique.
async function extrairImagem(page) {
  return await page.evaluate(() => {
    const imgs = [...document.querySelectorAll("img")]
      .filter((im) => (im.naturalWidth || 0) >= 600 && (im.naturalHeight || 0) >= 600);
    if (!imgs.length) return null;
    imgs.sort((a, b) => b.naturalWidth * b.naturalHeight - a.naturalWidth * a.naturalHeight);
    const img = imgs[0];
    try {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      c.getContext("2d").drawImage(img, 0, 0);
      return { dataUrl: c.toDataURL("image/png"), w: img.naturalWidth, h: img.naturalHeight };
    } catch {
      return null;
    }
  });
}

// Clica no container da imagem gerada pra forçar o load do <img> grande.
async function abrirImagemGerada(page) {
  return await page.evaluate(() => {
    const gi = document.querySelector("generated-image, single-image, .attachment-container.generated-images");
    if (!gi) return false;
    const alvo = gi.querySelector("img, button, [role=button]") || gi;
    alvo.click();
    return true;
  });
}

async function gerarCena(page, cena) {
  console.log(`\n=== ${cena.id} (${cena.refs.length} refs) ===`);
  await novaConversa(page);
  const input = await acharInput(page);
  if (!input) {
    console.log("  !! caixa de texto não encontrada");
    return false;
  }
  await ativarCriarImagem(page);
  if (!(await anexar(page, cena.refs))) return false;
  await page.waitForTimeout(3500 + cena.refs.length * 1500); // upload/preview
  await input.click();
  await page.keyboard.insertText(cena.prompt.trim());
  await page.waitForTimeout(600);
  await page.keyboard.press("Enter");
  console.log("  prompt enviado. aguardando geração...");

  const t0 = Date.now();
  let img = null;
  while (Date.now() - t0 < 360000) {
    await page.waitForTimeout(6000);
    // rola o chat pro fim e, se o bloco de imagem existir, clica pra carregar
    await page.evaluate(() => {
      for (const el of document.querySelectorAll("*"))
        if (el.scrollHeight > el.clientHeight + 100) el.scrollTop = el.scrollHeight;
    }).catch(() => {});
    const temBloco = await page.evaluate(() =>
      !!document.querySelector("generated-image, single-image")
    ).catch(() => false);
    if (temBloco) {
      await abrirImagemGerada(page).catch(() => {});
      await page.waitForTimeout(2500);
      try {
        img = await extrairImagem(page);
      } catch {}
      if (img) {
        // fecha o viewer (Escape) pra próxima cena começar limpa
        await page.keyboard.press("Escape").catch(() => {});
        break;
      }
    }
  }

  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  await page.screenshot({ path: path.join(OUT, `${cena.id}-shot.png`) }).catch(() => {});

  if (!img) {
    console.log("  !! nenhuma imagem gerada em 4min (veja o -shot.png)");
    return false;
  }
  const b64 = img.dataUrl.split(",")[1];
  const arq = path.join(OUT, `${cena.id}.png`);
  fs.writeFileSync(arq, Buffer.from(b64, "base64"));
  console.log(`  salvo: ${path.relative(ROOT, arq)} (${img.w}x${img.h}, ${Math.round(b64.length * 0.75 / 1024)} KB)`);
  return true;
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.list) {
    for (const s of SCENES) console.log(`${s.id}  [refs: ${s.refs.join(", ")}]`);
    return;
  }
  const alvo = args.all ? SCENES : SCENES.filter((s) => args.only.some((n) => s.id.startsWith(n)));
  if (!alvo.length) {
    console.log("nada a fazer. use --list, --all ou um prefixo de cena (ex.: 01).");
    return;
  }
  let browser;
  for (let t = 1; t <= 3 && !browser; t++) {
    try {
      browser = await chromium.connectOverCDP(args.cdp, { timeout: 120000 });
    } catch (e) {
      if (t === 3) throw e;
      console.log(`  CDP falhou (${t}/3), retentando...`);
    }
  }
  const page = await acharGemini(browser);
  await page.bringToFront();

  for (const cena of alvo) {
    try {
      await gerarCena(page, cena);
    } catch (e) {
      console.log(`  FAIL ${cena.id}: ${e.message.split("\n")[0]}`);
    }
  }
  await browser.close();
  console.log("\nfim.");
}

main();
