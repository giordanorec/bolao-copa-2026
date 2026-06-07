import { test, expect } from "@playwright/test";

test.describe("Home", () => {
  test("renderiza hero com título e CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Quem chuta melhor");
    await expect(page.locator(".hero-emojis")).toBeVisible();
    await expect(page.locator(".hero-cta a, .hero-cta button")).toHaveCount(3);
  });

  test("stats com 3 números visíveis", async ({ page }) => {
    await page.goto("/");
    const stats = page.locator(".stat .stat-num");
    await expect(stats).toHaveCount(3);
    await expect(stats.nth(0)).toContainText("122");
    await expect(stats.nth(1)).toContainText("104");
  });

  test("6 destino-cards visíveis", async ({ page }) => {
    await page.goto("/");
    const cards = page.locator(".destino-card");
    await expect(cards).toHaveCount(6);
    for (let i = 0; i < 6; i++) {
      await expect(cards.nth(i)).toBeVisible();
    }
  });

  test("tabela de regras mostra coluna pontos", async ({ page }) => {
    await page.goto("/");
    const pts = page.locator(".regras-table .pts").first();
    await expect(pts).toBeVisible();
    const box = await pts.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.x + box.width).toBeLessThanOrEqual(
        await page.evaluate(() => window.innerWidth),
      );
    }
  });

  test("footer com 3 colunas + links", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".footer-col")).toHaveCount(3);
    const githubLink = page.locator("footer a[href*='github']").first();
    await expect(githubLink).toBeVisible();
  });

  test("theme switcher abre e troca tema", async ({ page }) => {
    await page.goto("/");
    const switcher = page.locator(".theme-switcher");
    await expect(switcher).toBeVisible();
    await page.evaluate(() => {
      document.body.classList.remove("theme-switcher-closed");
    });
    // clicar via DOM evita problemas de viewport no mobile
    await page.evaluate(() => {
      const el = document.querySelector<HTMLInputElement>(
        'input[name="theme"][value="festivo-br"]',
      );
      el?.click();
    });
    await page.waitForTimeout(100);
    const themeAttr = await page.evaluate(() =>
      document.body.getAttribute("data-theme"),
    );
    expect(themeAttr).toBe("festivo-br");
  });

  test("body não tem scroll horizontal", async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(overflow).toBeFalsy();
  });

  test("não tem texto em inglês acidental", async ({ page }) => {
    await page.goto("/");
    const body = await page.locator("body").innerText();
    expect(body.toLowerCase()).not.toContain("lorem ipsum");
    expect(body.toLowerCase()).not.toContain("undefined");
    expect(body.toLowerCase()).not.toContain("null");
    expect(body).not.toContain("[object Object]");
  });

  test("não usa 'tu' no copy", async ({ page }) => {
    await page.goto("/");
    const body = await page.locator("body").innerText();
    // "tu " ou "tu," sem combinar com "tutorial", "túnel" etc
    expect(/\btu\b(?!\w)/.test(body.toLowerCase())).toBeFalsy();
  });
});
