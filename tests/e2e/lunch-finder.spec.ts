import { expect, type Page, test } from "@playwright/test";

// These tests depend on the page structure only, so they pass with any published content. Tests
// that need more content than the space has are skipped.

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("the price slider hides restaurants above the maximum", async ({ page }) => {
  const slider = page.getByRole("slider", { name: "Max. lunch price" });
  await slider.fill(await slider.getAttribute("min").then((min) => min ?? "5"));
  for (const price of await prices(page)) {
    expect(price).toBeLessThanOrEqual(5);
  }
});

test("a food option filter never adds restaurants", async ({ page }) => {
  const group = page.getByRole("group", { name: "Food options" });
  const option = group.getByRole("button").nth(1);
  test.skip((await group.getByRole("button").count()) < 2, "No food options in the CMS");
  const before = await count(page);
  await option.click();
  await expect(option).toHaveAttribute("aria-pressed", "true");
  await expect(group.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "false");
  expect(await count(page)).toBeLessThanOrEqual(before);
});

test("a row opens its details with a Google Maps link", async ({ page }) => {
  await page.getByRole("slider", { name: "Max. lunch price" }).fill("30");
  const rows = page.locator("main li > button");
  test.skip((await rows.count()) === 0, "No restaurants for this office");
  const row = rows.first();
  await row.click();
  await expect(row).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("link", { name: /Open in Google Maps/ })).toBeVisible();
  await row.click();
  await expect(row).toHaveAttribute("aria-expanded", "false");
});

test("Surprise Me opens exactly one restaurant", async ({ page }) => {
  await page.getByRole("slider", { name: "Max. lunch price" }).fill("30");
  test.skip((await count(page)) === 0, "No restaurants for this office");
  await page.getByRole("button", { name: /Surprise Me/ }).click();
  await expect(page.locator('main li > button[aria-expanded="true"]')).toHaveCount(1);
});

test("switching the office updates the URL and the active office", async ({ page }) => {
  const links = page.getByRole("navigation", { name: "Office" }).getByRole("link");
  test.skip((await links.count()) < 2, "Fewer than two offices in the CMS");
  const second = links.nth(1);
  await second.click();
  await expect(page).toHaveURL(/\?office=/);
  await expect(second).toHaveAttribute("aria-current", "page");
});

async function count(page: Page): Promise<number> {
  const text = await page.getByText(/^\d+ places? found$/).textContent();
  return Number.parseInt(text ?? "0", 10);
}

async function prices(page: Page): Promise<number[]> {
  const texts = await page.locator("main li > button .price").allTextContents();
  return texts.map((text) => Number.parseFloat(text));
}
