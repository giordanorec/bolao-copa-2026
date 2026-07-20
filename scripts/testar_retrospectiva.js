#!/usr/bin/env node
/* Testa /retrospectiva em produção em vários viewports: rola cena a cena,
 * mede overflow horizontal, cenas mais altas que o viewport e tira prints.
 * Uso: node scripts/testar_retrospectiva.js [url]
 * Saída: scripts/_shots/retro/<vp>/<cena>.png + relatório no stdout
 */
const path = require("path");
const fs = require("fs");
const ROOT = path.resolve(__dirname, "..");
const { chromium } = require(path.join(ROOT, "v4", "node_modules", "playwright"));

const URL = process.argv[2] || "https://bolao.arenadasias.com.br/retrospectiva";
const OUT = path.join(ROOT, "scripts", "_shots", "retro");

const VIEWPORTS = [
  { nome: "android-sm", width: 360, height: 700, dsf: 2, mobile: true },
  { nome: "iphone", width: 390, height: 844, dsf: 2, mobile: true },
  { nome: "notebook", width: 1366, height: 768, dsf: 1, mobile: false },
  { nome: "desktop", width: 1920, height: 1080, dsf: 1, mobile: false },
];

(async () => {
  const browser = await chromium.launch();
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.dsf,
      isMobile: vp.mobile,
      hasTouch: vp.mobile,
      userAgent: vp.mobile
        ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
        : undefined,
    });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(3000);

    const dir = path.join(OUT, vp.nome);
    fs.mkdirSync(dir, { recursive: true });

    const info = await page.evaluate(() => {
      const root = document.querySelector(".retro-root");
      const cenas = [...document.querySelectorAll(".cena")];
      return {
        temRoot: !!root,
        nCenas: cenas.length,
        classes: cenas.map((c) => c.className.replace(/\bin\b|\bcena\b/g, "").trim().split(" ")[0] || "sem-classe"),
      };
    });
    console.log(`\n=== ${vp.nome} (${vp.width}x${vp.height}) — ${info.nCenas} cenas ===`);

    const problemas = [];
    for (let i = 0; i < info.nCenas; i++) {
      await page.evaluate((idx) => {
        const c = document.querySelectorAll(".cena")[idx];
        c.scrollIntoView({ behavior: "instant", block: "start" });
      }, i);
      await page.waitForTimeout(1400); // reveals/animações
      const m = await page.evaluate((idx) => {
        const c = document.querySelectorAll(".cena")[idx];
        const r = c.getBoundingClientRect();
        const vw = window.innerWidth;
        // overflow horizontal: algum descendente passando da borda?
        let overflowX = 0;
        for (const el of c.querySelectorAll("*")) {
          const b = el.getBoundingClientRect();
          if (b.width > 0 && (b.right > vw + 2 || b.left < -2)) {
            overflowX = Math.max(overflowX, Math.ceil(Math.max(b.right - vw, -b.left)));
          }
        }
        return { h: Math.round(r.height), vh: window.innerHeight, overflowX };
      }, i);
      const nome = String(i + 1).padStart(2, "0") + "_" + info.classes[i];
      await page.screenshot({ path: path.join(dir, nome + ".png") });
      const flags = [];
      if (m.overflowX > 4) flags.push(`OVERFLOW-X ${m.overflowX}px`);
      if (m.h > m.vh * 1.35) flags.push(`ALTA (${m.h}px vs ${m.vh}px viewport)`);
      console.log(`  ${nome}: h=${m.h} ${flags.length ? "⚠ " + flags.join(" · ") : "ok"}`);
      if (flags.length) problemas.push(`${vp.nome}/${nome}: ${flags.join(", ")}`);
    }
    await ctx.close();
    if (problemas.length) console.log(`  >> problemas: ${problemas.length}`);
  }
  await browser.close();
  console.log("\nfim. prints em scripts/_shots/retro/");
})();
