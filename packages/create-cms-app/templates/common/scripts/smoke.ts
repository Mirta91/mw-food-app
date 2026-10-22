// Runs the smoke tests (`pnpm test:smoke`). Without the required CMS variables the app refuses to
// start, so the tests are skipped with a message instead, and `pnpm check` passes without
// credentials.
import { spawnSync } from "node:child_process";
import { requiredEnv } from "../src/lib/cms/client.ts";
import { missingEnv } from "../src/lib/utils/env.ts";

try {
  process.loadEnvFile(".env");
} catch {
  // No .env: the variables may still come from the environment.
}

const missing = missingEnv(requiredEnv, process.env);
if (missing.length > 0) {
  console.log(
    `Smoke test skipped: missing ${missing.join(", ")}. Copy .env.example to .env to run it.`,
  );
  process.exit(0);
}
const result = spawnSync("pnpm", ["exec", "playwright", "test", "--grep", "@smoke"], {
  stdio: "inherit",
});
process.exit(result.status ?? 1);
