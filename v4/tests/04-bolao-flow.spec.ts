import { test, expect } from "@playwright/test";

// Bolão público criado pela emulação anterior
const BOLAO_TESTE = "/bolao/teste-1780844996";

test.describe("Bolão público", () => {
  test("página do bolão renderiza sem login", async ({ page }) => {
    await page.goto(BOLAO_TESTE);
    await expect(page.locator("h1")).toContainText("Bolão");
    await expect(page.locator(".members-count")).toBeVisible();
  });

  test("CTA banner aparece pra anon", async ({ page }) => {
    await page.goto(BOLAO_TESTE);
    const banner = page.locator("text=/convidado/i").first();
    await expect(banner).toBeVisible();
  });

  test("ranking do bolão visível com 3 membros", async ({ page }) => {
    await page.goto(BOLAO_TESTE);
    const tabela = page.locator(".ranking-table");
    await expect(tabela).toBeVisible();
    const linhas = page.locator(".ranking-table tbody tr");
    const count = await linhas.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test("copy link funciona (botão visível)", async ({ page }) => {
    await page.goto(BOLAO_TESTE);
    const btn = page.locator('button:has-text("Copiar link")');
    await expect(btn).toBeVisible();
  });

  test("clicar 'Entrar pra participar' leva ao login com redirect", async ({
    page,
  }) => {
    await page.goto(BOLAO_TESTE);
    const cta = page.locator('a:has-text("Entrar no bolão")').first();
    await expect(cta).toBeVisible();
    await cta.click();
    await page.waitForURL(/\/login\?redirect=/);
    expect(page.url()).toContain("login");
    expect(page.url()).toContain("redirect=");
  });

  test("404 em bolão inexistente", async ({ page }) => {
    const resp = await page.goto("/bolao/xxxxxxxxxx-naoexiste");
    expect(resp?.status()).toBe(404);
  });
});
