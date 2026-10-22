import node from "@astrojs/node";
import type { AstroIntegration } from "astro";
import { defineConfig } from "astro/config";
import { requiredEnv } from "./src/lib/cms/client";
import { exitOnMissingEnv } from "./src/lib/cms/env";

// Server code reads process.env; load .env for `astro dev` and `astro build` as well.
try {
  process.loadEnvFile(".env");
} catch {
  // No .env: `astro dev` stops in the check-env integration below.
}

export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
  integrations: [checkEnv()],
});

// Checks the required CMS variables when `astro dev` starts. Builds and `astro check` skip it:
// they must pass without .env. `pnpm start` runs scripts/check-env.ts instead.
function checkEnv(): AstroIntegration {
  return {
    name: "check-env",
    hooks: {
      "astro:config:setup": ({ command }) => {
        if (command === "dev") {
          exitOnMissingEnv(requiredEnv, process.env);
        }
      },
    },
  };
}
