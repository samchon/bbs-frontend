import { expect, test } from "@playwright/test";

test("post creation form submits and routes to a new detail page", async ({ page }) => {
  await page.goto("/articles/new");
  await expect(page.getByRole("heading", { name: "Write a post", exact: true })).toBeVisible();

  await page.getByRole("textbox", { name: "Writer" }).fill("ui-check");
  await page.getByRole("textbox", { name: "Title" }).fill("Simulated post title");
  await page.getByRole("textbox", { name: "Body" }).fill("Simulated post body.");
  await page.getByRole("textbox", { name: "Password" }).fill("temp-pass-123");
  await page.getByRole("button", { name: "Post" }).click();

  await page.waitForURL(/\/articles\//, { timeout: 10000 });
  await expect
    .poll(async () => {
      return (await page.locator(".page-intro h2").textContent())?.trim() ?? "";
    })
    .not.toBe("Loading post...");
});
