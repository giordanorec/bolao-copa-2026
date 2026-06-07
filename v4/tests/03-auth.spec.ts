import { test, expect } from "@playwright/test";

test.describe("Auth flow", () => {
  test("login renderiza form com 2 campos", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("signup renderiza form com 3 campos", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.locator("#nome")).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("login com credenciais erradas mostra mensagem", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "noexist@example.com");
    await page.fill('input[type="password"]', "wrongpass123");
    await page.click('button[type="submit"]');
    await expect(page.locator(".err")).toBeVisible({ timeout: 8000 });
  });

  test("signup com email inválido mostra erro do browser", async ({ page }) => {
    await page.goto("/signup");
    await page.fill("#nome", "Teste");
    await page.fill('input[type="email"]', "naoeumemail");
    await page.fill('input[type="password"]', "senha123");
    await page.click('button[type="submit"]');
    // browser nativo deve bloquear submit
    const valido = await page.evaluate(() => {
      const el = document.querySelector(
        'input[type="email"]',
      ) as HTMLInputElement;
      return el?.checkValidity();
    });
    expect(valido).toBe(false);
  });

  test("signup com senha curta mostra erro", async ({ page }) => {
    await page.goto("/signup");
    await page.fill("#nome", "Teste");
    await page.fill('input[type="email"]', "ok@test.com");
    await page.fill('input[type="password"]', "12");
    await page.click('button[type="submit"]');
    const valido = await page.evaluate(() => {
      const el = document.querySelector(
        'input[type="password"]',
      ) as HTMLInputElement;
      return el?.checkValidity();
    });
    expect(valido).toBe(false);
  });

  test("login → signup preserva redirect", async ({ page }) => {
    await page.goto("/login?redirect=/bolao/abc123");
    const criarLink = page.locator('.alt a[href*="/signup"]');
    await expect(criarLink).toBeVisible();
    const href = await criarLink.getAttribute("href");
    expect(href).toContain("redirect=");
    expect(href).toContain("bolao");
  });

  test("signup com redirect bolão mostra banner de convite", async ({
    page,
  }) => {
    await page.goto("/signup?redirect=/bolao/qualquer-coisa");
    const banner = page.locator("text=/convidado/i").first();
    await expect(banner).toBeVisible();
  });
});
