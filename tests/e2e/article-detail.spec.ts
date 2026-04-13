import { expect, test } from "@playwright/test";

test("article detail loads from the list and comment submission completes", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator(".board-table__link").first().click();

  await expect
    .poll(async () => {
      return (await page.locator(".page-intro h2").textContent())?.trim() ?? "";
    })
    .not.toBe("Loading post...");

  await expect(
    page.getByRole("heading", { name: "Comments", exact: true }),
  ).toBeVisible();

  const commentForm = page
    .locator("section.panel")
    .filter({ hasText: "Write a comment" })
    .first();

  await commentForm.getByRole("textbox", { name: "Writer" }).fill("ui-check");
  await commentForm.getByRole("textbox", { name: "Body" }).fill("UI-only simulated comment.");
  await commentForm.getByRole("textbox", { name: "Password" }).fill("temp-pass-123");
  await commentForm.getByRole("button", { name: "Post comment" }).click();

  await expect(page.getByText("Your comment was posted.")).toBeVisible();
});
