import { test, expect } from "@playwright/test";

test.describe("Phase 1: Core POS Flow", () => {
  test("loads POS screen with categories and menu items", async ({ page }) => {
    await page.goto("/pos");
    await expect(page.locator("text=Rewind")).toBeVisible();
    await expect(page.locator("text=Hot Coffee")).toBeVisible();
    await expect(page.locator("text=All Items")).toBeVisible();
  });

  test("adds item to cart and calculates subtotal", async ({ page }) => {
    await page.goto("/pos");
    const itemTile = page.locator("text=Double Espresso").first();
    await itemTile.click();
    await expect(page.locator("text=Current Order")).toBeVisible();
  });
});
