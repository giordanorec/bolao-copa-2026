/**
 * pw-chav.mjs — Playwright screenshot validator for /chaveamento.
 *
 * Usage:
 *   node scripts/pw-chav.mjs <url> <output.png> [width] [height]
 *
 * Examples:
 *   node scripts/pw-chav.mjs "http://localhost:3000/chaveamento" "/tmp/mobile.png" 390 844
 *   node scripts/pw-chav.mjs "http://localhost:3000/chaveamento" "/tmp/desktop.png" 1400 900
 */

import { chromium } from "@playwright/test";

const [, , url = "http://localhost:3000/chaveamento", output = "/tmp/test.png", w = "390", h = "844"] = process.argv;
const width = parseInt(w, 10);
const height = parseInt(h, 10);

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width, height },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();

console.log(`Navigating to ${url} at ${width}x${height}...`);
await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

// Basic checks
const title = await page.title();
console.log(`Page title: ${title}`);

// Count game cards
const cardCount = await page.locator('[aria-label^="Jogo"]').count();
console.log(`Game cards found: ${cardCount} (expected 31)`);

// Check horizontal overflow
const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
const viewportWidth = await page.evaluate(() => window.innerWidth);
console.log(`Scroll width: ${bodyScrollWidth}, Viewport: ${viewportWidth}`);
if (bodyScrollWidth > viewportWidth) {
  console.warn(`WARNING: Horizontal overflow detected! scrollWidth(${bodyScrollWidth}) > viewport(${viewportWidth})`);
} else {
  console.log("OK: No horizontal overflow");
}

// Check trophy presence
const trophy = await page.locator('[role="img"][aria-label="Troféu"]').count();
console.log(`Trophy element: ${trophy > 0 ? "found" : "MISSING"}`);

// Check Brasil highlighted
const brasilCards = await page.locator('[aria-label*="Brasil"]').count();
console.log(`Brasil cards: ${brasilCards}`);

// Scroll to bottom
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(300);

// Screenshot
await page.screenshot({ path: output, fullPage: true });
console.log(`Screenshot saved to: ${output}`);

// Element size checks on flags
const firstFlag = page.locator('img[alt]').first();
const flagBox = await firstFlag.boundingBox();
if (flagBox) {
  console.log(`First flag size: ${flagBox.width.toFixed(0)}x${flagBox.height.toFixed(0)}px (expected >=32)`);
}

await browser.close();
console.log("Done.");
