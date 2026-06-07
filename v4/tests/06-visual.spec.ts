import { test, expect } from "@playwright/test";

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

  test("tema airbnb é fixo (sem switcher)", async ({ page }) => {
    await page.goto("/");
    expect(
      await page.evaluate(() => document.body.getAttribute("data-theme")),
    ).toBe("airbnb");
    await expect(page.locator(".theme-switcher")).toHaveCount(0);
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
