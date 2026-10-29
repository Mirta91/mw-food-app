import { expect, test } from "@playwright/test";

test("home page renders the Lunch Finder @smoke", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "Lunch Finder" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Office" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Food options" })).toBeVisible();
  await expect(page.getByRole("slider", { name: "Max. lunch price" })).toBeVisible();
  await expect(page.getByText(/^\d+ places? found$/)).toBeVisible();
});
