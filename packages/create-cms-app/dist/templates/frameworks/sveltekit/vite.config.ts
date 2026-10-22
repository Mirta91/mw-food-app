import adapter from "@sveltejs/adapter-node";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig, loadEnv, type Plugin } from "vite";
import { requiredEnv } from "./src/lib/cms/client";
import { exitOnMissingEnv } from "./src/lib/cms/env";

// SvelteKit 3 takes its configuration here; it no longer reads svelte.config.ts.
export default defineConfig({ plugins: [sveltekit({ adapter: adapter() }), checkEnv()] });

// `vite dev` runs the init hook in src/hooks.server.ts only on the first request, so the dev
// server checks the required CMS variables when it starts. Builds skip it: they must pass
// without .env.
function checkEnv(): Plugin {
  return {
    name: "check-env",
    apply: "serve",
    configureServer(server) {
      exitOnMissingEnv(requiredEnv, loadEnv(server.config.mode, server.config.root, ""));
    },
  };
}
