import { test, expect } from "@playwright/test";

// Esses testes não dependem de sessão — checam UI estática
// das páginas públicas de palpitar (caso o usuário entre sem login,
// o middleware deve redirecionar pra /login)

test.describe("Página de palpitar (acesso anônimo)", () => {
  test("anon em /bolao/[slug]/palpitar é redirecionado", async ({ page }) => {
    await page.goto("/bolao/teste-1780844996/palpitar");
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("login");
    expect(page.url()).toContain("redirect=");
  });
});

test.describe("CSS / responsividade global", () => {
  test("home não estoura largura no mobile", async ({ page, viewport }) => {
    await page.goto("/");
    const w = viewport?.width ?? 0;
    if (w > 500) test.skip();
    const scrollW = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    expect(scrollW).toBeLessThanOrEqual(w + 1);
  });

  test("destino-card é tocável (>= 44px altura)", async ({ page }) => {
    await page.goto("/");
    const card = page.locator(".destino-card").first();
    const box = await card.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });

  test("todos os botões têm tamanho mínimo touch", async ({ page }) => {
    await page.goto("/");
    const buttons = page.locator(
      ".hero-cta a, .hero-cta button, .destino-card a",
    );
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      const box = await buttons.nth(i).boundingBox();
      if (box) {
        expect(box.height, `Botão ${i} muito baixo`).toBeGreaterThanOrEqual(36);
      }
    }
  });
});
