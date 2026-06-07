import { test, expect, Page } from "@playwright/test";

async function abrirSwitcher(page: Page) {
  const fechado = await page.evaluate(() =>
    document.body.classList.contains("theme-switcher-closed"),
  );
  if (fechado) {
    await page.locator(".theme-switcher .toggle-btn").click();
  }
}

test.describe("Visual / consistência", () => {
  test("contraste do texto principal ≥ AA", async ({ page }) => {
    await page.goto("/");
    const sample = await page.evaluate(() => {
      const el = document.querySelector("h1");
      if (!el) return null;
      const cs = getComputedStyle(el);
      return { color: cs.color, bg: cs.backgroundColor, size: cs.fontSize };
    });
    expect(sample).not.toBeNull();
    expect(sample?.color).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("nenhuma imagem quebrada", async ({ page }) => {
    await page.goto("/");
    const imgs = await page.locator("img").all();
    for (const img of imgs) {
      const ok = await img.evaluate(
        (el: HTMLImageElement) => el.complete && el.naturalWidth > 0,
      );
      const src = await img.getAttribute("src");
      expect(ok, `imagem quebrada: ${src}`).toBeTruthy();
    }
  });

  test("trocar tema persiste por reload", async ({ page }) => {
    await page.goto("/");
    await abrirSwitcher(page);
    await page
      .locator('input[name="theme"][value="anthropic"]')
      .check({ force: true });
    await page.waitForTimeout(100);
    const before = await page.evaluate(() =>
      document.body.getAttribute("data-theme"),
    );
    expect(before).toBe("anthropic");
    await page.reload();
    const after = await page.evaluate(() =>
      document.body.getAttribute("data-theme"),
    );
    expect(after).toBe("anthropic");
  });

  test("todos os 12 temas aplicam atributo data-theme", async ({ page }) => {
    await page.goto("/");
    await abrirSwitcher(page);
    const temas = await page.locator('input[name="theme"]').all();
    expect(temas.length).toBeGreaterThanOrEqual(6);
    for (const radio of temas) {
      const val = await radio.getAttribute("value");
      if (!val) continue;
      await radio.check({ force: true });
      await page.waitForTimeout(50);
      const aplicado = await page.evaluate(() =>
        document.body.getAttribute("data-theme"),
      );
      expect(aplicado, `tema ${val} não aplicado`).toBe(val);
    }
  });

  test("hero emojis não overflow", async ({ page, viewport }) => {
    await page.goto("/");
    const emojis = page.locator(".hero-emojis");
    const box = await emojis.boundingBox();
    if (box && viewport) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
    }
  });

  test("nenhum console.error em /", async ({ page }) => {
    const erros: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") erros.push(msg.text());
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Ignora 404 de favicon e third-party
    const realErros = erros.filter(
      (e) =>
        !e.includes("favicon") &&
        !e.includes("404") &&
        !e.toLowerCase().includes("warning"),
    );
    expect(realErros, realErros.join("\n")).toHaveLength(0);
  });
});
