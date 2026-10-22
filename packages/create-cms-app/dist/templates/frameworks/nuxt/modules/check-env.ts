import { defineNuxtModule } from "nuxt/kit";
import { requiredEnv } from "../src/lib/cms/client";
import { exitOnMissingEnv } from "../src/lib/cms/env";

// `nuxt dev` keeps running when the Nitro worker exits in server/plugins/check-env.ts, so the dev
// server is checked here, in the main process. Builds skip the check: they must pass without .env.
export default defineNuxtModule({
  meta: { name: "check-env" },
  setup(_options, nuxt) {
    if (nuxt.options.dev) {
      exitOnMissingEnv(requiredEnv, process.env);
    }
  },
});
