import { expect, test } from "@playwright/test";

test("home list controls work", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Posts", exact: true })).toBeVisible();

  await page.getByRole("button", { name: /compact/i }).click();
  await expect(page.locator(".board-table--compact")).toBeVisible();

  await page.getByRole("button", { name: /preview/i }).click();
  await expect(page.locator(".board-table--preview")).toBeVisible();

  await page.getByLabel("Page size").selectOption("5");
  await expect(page.getByLabel("Page size")).toHaveValue("5");
  await expect(page.locator(".board-table")).toBeVisible();

  await page.getByLabel("Sort").selectOption("title_asc");
  await expect(page.getByLabel("Sort")).toHaveValue("title_asc");
  await expect(page.locator(".board-table__link").first()).toBeVisible();

  await page.getByRole("button", { name: /search/i }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("textbox", { name: "Writer" }).fill("alpha");
  await dialog.getByRole("button", { name: /apply search/i }).click();

  await expect(page.locator(".filter-summary")).toContainText("Writer: alpha");
  await page.getByRole("button", { name: /clear search/i }).click();
  await expect(page.locator(".filter-summary")).toHaveCount(0);
});

test("home layout stays within the viewport on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const metrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
});
