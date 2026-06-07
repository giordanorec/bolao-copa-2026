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

  test("links do header funcionam", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator(".site-nav");
    await expect(nav).toBeVisible();
    const links = nav.locator("a");
    const count = await links.count();
    expect(count).toBeGreaterThan(2);
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
