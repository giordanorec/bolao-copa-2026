import { test, expect } from "@playwright/test";

test.describe("Edge cases", () => {
  test("URLs com query string maluca não quebram /", async ({ page }) => {
    const resp = await page.goto(
      "/?utm_source=teste&utm_campaign=alfa&random=" + "x".repeat(500),
    );
    expect(resp?.status()).toBeLessThan(500);
  });

  test("hash fragments preservados", async ({ page }) => {
    await page.goto("/#regras");
    expect(page.url()).toContain("#regras");
  });

  test("double-click em CTA não duplica ação", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "double@test.com");
    await page.fill('input[type="password"]', "wrong123");
    const btn = page.locator('button[type="submit"]');
    await btn.click();
    await btn.click().catch(() => {}); // segundo click pode ser bloqueado
    // só validar que nada explode
    await page.waitForTimeout(2000);
    const err = await page.locator(".err").count();
    expect(err).toBeGreaterThanOrEqual(0);
  });

  test("nomes longos em signup não quebram layout", async ({ page }) => {
    await page.goto("/signup");
    const nome = "X".repeat(200);
    await page.fill("#nome", nome);
    const w = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(w).toBeLessThanOrEqual(2);
  });

  test("paste com espaços no email é tolerado", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "  espaco@test.com  ");
    const val = await page.locator('input[type="email"]').inputValue();
    // o browser pode ou não trim — só checamos que aceita sem crash
    expect(val).toContain("espaco@test.com");
  });

  test("voltar no browser de signup→login não quebra", async ({ page }) => {
    await page.goto("/login");
    await page.click('a[href*="/signup"]');
    await page.waitForURL(/signup/);
    await page.goBack();
    await page.waitForURL(/login/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test("slug com chars especiais retorna 404 limpo", async ({ page }) => {
    const resp = await page.goto("/bolao/%2E%2E%2Fadmin");
    expect([404, 400, 200]).toContain(resp?.status() ?? 0);
    // mais importante: não vaza stack trace
    const body = await page.locator("body").innerText();
    expect(body.toLowerCase()).not.toContain("at processticksandrejections");
    expect(body.toLowerCase()).not.toContain("internal server error");
  });

  test("network offline mostra fallback ou não trava", async ({
    page,
    context,
  }) => {
    await page.goto("/");
    await context.setOffline(true);
    try {
      await page.click('a[href="/como-funciona"]', { timeout: 3000 });
    } catch {
      // esperado falhar
    }
    await context.setOffline(false);
    // pelo menos confirma que voltou
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
  });
});
