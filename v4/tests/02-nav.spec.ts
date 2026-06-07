import { test, expect } from "@playwright/test";

const rotas = [
  { path: "/", titulo: /Bolão/i },
  { path: "/login", titulo: /Bolão/i },
  { path: "/signup", titulo: /Bolão/i },
  { path: "/como-funciona", titulo: /Bolão/i },
  { path: "/ias", titulo: /Bolão/i },
  { path: "/ranking-geral", titulo: /Bolão/i },
  { path: "/doar", titulo: /Bolão/i },
];

test.describe("Navegação", () => {
  for (const r of rotas) {
    test(`${r.path} carrega sem erro`, async ({ page }) => {
      const erros: string[] = [];
      page.on("pageerror", (e) => erros.push(e.message));
      const resp = await page.goto(r.path);
      expect(resp?.status()).toBeLessThan(500);
      await expect(page).toHaveTitle(r.titulo);
      expect(erros, `Erros JS em ${r.path}: ${erros.join(", ")}`).toHaveLength(
        0,
      );
    });
  }

  test("links do header funcionam", async ({ page, viewport }) => {
    await page.goto("/");
    const nav = page.locator(".site-nav");
    // mobile: drawer fica hidden até abrir o hamburger
    if (viewport && viewport.width < 900) {
      await page.locator(".nav-hamburger").click();
    }
    await expect(nav).toBeVisible();
    const links = nav.locator("a");
    const count = await links.count();
    expect(count).toBeGreaterThan(2);
  });

  test("mobile: hamburger abre e fecha drawer", async ({ page, viewport }) => {
    if (!viewport || viewport.width >= 900) test.skip();
    await page.goto("/");
    const hamb = page.locator(".nav-hamburger");
    await expect(hamb).toBeVisible();
    const nav = page.locator(".site-nav");
    expect(await hamb.getAttribute("aria-expanded")).toBe("false");
    await hamb.click();
    await expect(nav).toBeVisible();
    expect(await hamb.getAttribute("aria-expanded")).toBe("true");
    // fecha clicando no hamburger novamente
    await hamb.click();
    await page.waitForTimeout(300);
    expect(await hamb.getAttribute("aria-expanded")).toBe("false");
  });

  test("rotas protegidas redirecionam pra login", async ({ page }) => {
    const protegidas = ["/dashboard", "/criar", "/perfil"];
    for (const p of protegidas) {
      await page.goto(p);
      const url = page.url();
      expect(url).toContain("/login");
      expect(url).toContain("redirect=");
    }
  });

  test("404 em rota inexistente é tratada", async ({ page }) => {
    const resp = await page.goto("/rota-que-nao-existe-12345");
    expect(resp?.status()).toBe(404);
  });
});
