import adapter from "@sveltejs/adapter-node";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig, type Plugin } from "vite";
import { requiredEnv } from "./src/lib/cms/client";
import { exitOnMissingEnv } from "./src/lib/utils/env";

// SvelteKit 3 takes its configuration here; it no longer reads svelte.config.ts.
export default defineConfig({ plugins: [sveltekit({ adapter: adapter() }), cmsEnv()] });

// The CMS client reads process.env, as in every framework. `vite dev` does not load .env into
// process.env, and runs the init hook in src/hooks.server.ts only on the first request, so the dev
// server loads .env and checks the required CMS variables when it starts. Builds skip both: they
// must pass without .env.
function cmsEnv(): Plugin {
  return {
    name: "cms-env",
    apply: "serve",
    configureServer() {
      try {
        process.loadEnvFile(".env");
      } catch {
        // No .env: the check below names the missing variables.
      }
      exitOnMissingEnv(requiredEnv, process.env);
    },
  };
}
