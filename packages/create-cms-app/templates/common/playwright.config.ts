import { defineConfig, devices } from "@playwright/test";

// Tests and the web server see the same variables as `pnpm dev`.
try {
  process.loadEnvFile(".env");
} catch {
  // No .env: the variables must come from the environment, or the app refuses to start.
  // `pnpm test:smoke` (scripts/smoke.ts) checks them before it starts Playwright.
}

const port = Number(process.env.E2E_PORT ?? 4173);
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "tests/e2e",
  forbidOnly: Boolean(process.env.CI),
  reporter: "list",
  use: { baseURL },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm build && pnpm start",
    url: baseURL,
    env: { PORT: String(port) },
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
