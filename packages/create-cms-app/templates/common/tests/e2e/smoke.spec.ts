import { expect, test } from "@playwright/test";
import { requiredEnv } from "../../src/lib/cms/client";

test("home page renders a CMS state @smoke", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  const status = page.locator("[data-cms-state]");
  await expect(status).toBeVisible();
  if ((await status.getAttribute("data-cms-state")) === "missing-env") {
    for (const name of requiredEnv.filter((name) => !process.env[name]?.trim())) {
      await expect(status).toContainText(name);
    }
  }
});
