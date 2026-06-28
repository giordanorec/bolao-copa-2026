/**
 * Renderização de reel por CAPTURA DE FRAMES (determinística).
 *
 * Em vez de gravar a tela em tempo real (recordVideo), que produz framerate
 * instável — daí o vídeo "travando" e cortando antes da animação terminar —,
 * este módulo CONGELA o relógio das animações e tira um screenshot por frame:
 *
 *   1. carrega o HTML no Playwright e espera as fontes (document.fonts.ready)
 *   2. para cada frame i (T = i * 1000/fps ms): pausa TODAS as animações via
 *      Web Animations API e seta currentTime = T, depois screenshot
 *   3. costura os PNGs com ffmpeg a framerate constante (libx264, yuv420p)
 *
 * Funciona porque todas as cenas usam `forwards` na entrada/saída — seekar pro
 * timestamp segura o estado exato daquele instante. Animações infinitas
 * (partículas, float, pulse) também respondem ao currentTime sem problema.
 *
 * API:
 *   const { renderReel } = require('./lib_reel_capture');
 *   await renderReel({ html, outDir, baseName, totalMs, posterMs, fps });
 *
 * Gera em outDir: <baseName>.mp4, poster.png (e <baseName>.webm se quiser).
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const FFMPEG_BIN =
  process.env.FFMPEG_BIN ||
  'C:/Users/grec/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1.2-full_build/bin/ffmpeg.exe';

function pad(n, w = 5) {
  return String(n).padStart(w, '0');
}

/**
 * @param {object} opts
 * @param {string} opts.html       HTML completo do reel (1080×1920)
 * @param {string} opts.outDir     pasta de saída
 * @param {string} opts.baseName   nome base do arquivo (sem extensão)
 * @param {number} opts.totalMs    duração total do timeline a capturar
 * @param {number} opts.posterMs   instante (ms) usado como poster.png
 * @param {number} [opts.fps=30]   frames por segundo
 * @param {boolean} [opts.webm=false]  também gerar .webm (vp9, mais lento)
 */
async function renderReel({ html, outDir, baseName, totalMs, posterMs, fps = 30, webm = false }) {
  const V4_ROOT = path.resolve(__dirname, '../../v4');
  const { chromium } = require(path.join(V4_ROOT, 'node_modules', 'playwright'));

  fs.mkdirSync(outDir, { recursive: true });
  const framesDir = path.join(outDir, '_frames');
  fs.rmSync(framesDir, { recursive: true, force: true });
  fs.mkdirSync(framesDir, { recursive: true });

  const htmlPath = path.join(outDir, `_${baseName}.html`);
  fs.writeFileSync(htmlPath, html, 'utf-8');

  const mp4Path = path.join(outDir, `${baseName}.mp4`);
  const webmPath = path.join(outDir, `${baseName}.webm`);
  const posterPath = path.join(outDir, 'poster.png');

  console.log('Iniciando Playwright (captura de frames)...');
  const browser = await chromium.launch({
    args: ['--disable-web-security', '--allow-file-access-from-files'],
  });
  const context = await browser.newContext({
    viewport: { width: 1080, height: 1920 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.goto('file://' + htmlPath.replace(/\\/g, '/'));

  // Espera fontes carregarem (senão o primeiro frame sai com fonte fallback).
  await page.evaluate(() => document.fonts.ready);
  // Pequeno settle pra layout/JS (partículas) estabilizar.
  await page.waitForTimeout(400);

  const frameStep = 1000 / fps;
  const nFrames = Math.ceil(totalMs / frameStep);
  console.log(`  capturando ${nFrames} frames @ ${fps}fps (${(totalMs / 1000).toFixed(1)}s)...`);

  let posterFrame = Math.round(posterMs / frameStep);

  for (let i = 0; i < nFrames; i++) {
    const t = i * frameStep;
    // Congela o relógio de todas as animações no instante t.
    await page.evaluate((ms) => {
      for (const a of document.getAnimations()) {
        try {
          a.pause();
          a.currentTime = ms;
        } catch (_) {}
      }
    }, t);
    const fp = path.join(framesDir, `f_${pad(i)}.png`);
    // NÃO usar animations:'disabled' — ele fast-forwarda cada sceneOut até o
    // fim (opacity 0) e some com tudo. Já congelamos via WAAPI acima.
    await page.screenshot({ path: fp });
    if (i === posterFrame) fs.copyFileSync(fp, posterPath);
    if (i % 30 === 0) process.stdout.write(`\r  frame ${i}/${nFrames}`);
  }
  process.stdout.write(`\r  frame ${nFrames}/${nFrames}\n`);

  await context.close();
  await browser.close();

  // Garante poster mesmo se posterFrame caiu fora do range.
  if (!fs.existsSync(posterPath)) {
    const last = path.join(framesDir, `f_${pad(nFrames - 1)}.png`);
    fs.copyFileSync(last, posterPath);
  }

  if (!fs.existsSync(FFMPEG_BIN)) {
    console.warn('  (ffmpeg não encontrado — frames ficaram em', framesDir, ')');
    return { mp4: null, poster: posterPath, framesDir };
  }

  const inPattern = path.join(framesDir, 'f_%05d.png');
  console.log('  costurando mp4 (libx264)...');
  execFileSync(
    FFMPEG_BIN,
    [
      '-y',
      '-framerate', String(fps),
      '-i', inPattern,
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-crf', '18',
      '-preset', 'slow',
      '-movflags', '+faststart',
      '-r', String(fps),
      mp4Path,
    ],
    { stdio: 'ignore' }
  );

  if (webm) {
    console.log('  costurando webm (vp9)...');
    execFileSync(
      FFMPEG_BIN,
      [
        '-y',
        '-framerate', String(fps),
        '-i', inPattern,
        '-c:v', 'libvpx-vp9',
        '-pix_fmt', 'yuv420p',
        '-b:v', '0',
        '-crf', '32',
        '-deadline', 'good',
        '-cpu-used', '4',
        '-r', String(fps),
        webmPath,
      ],
      { stdio: 'ignore' }
    );
  }

  // Limpa frames e html temporário.
  fs.rmSync(framesDir, { recursive: true, force: true });
  fs.rmSync(htmlPath, { force: true });

  console.log('  mp4    :', mp4Path);
  console.log('  poster :', posterPath);
  if (webm) console.log('  webm   :', webmPath);
  return { mp4: mp4Path, webm: webm ? webmPath : null, poster: posterPath };
}

module.exports = { renderReel, FFMPEG_BIN };
