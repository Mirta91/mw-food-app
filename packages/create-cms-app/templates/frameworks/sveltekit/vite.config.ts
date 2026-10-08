import adapter from "@sveltejs/adapter-node";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

// SvelteKit 3 takes its configuration here; it no longer reads svelte.config.ts.
export default defineConfig({ plugins: [sveltekit({ adapter: adapter() })] });
