import node from "@astrojs/node";
import { defineConfig } from "astro/config";

// Server code reads process.env; load .env for `astro dev` and `astro build` as well.
try {
  process.loadEnvFile(".env");
} catch {
  // No .env: pages render the "CMS not configured" state.
}

export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
});
