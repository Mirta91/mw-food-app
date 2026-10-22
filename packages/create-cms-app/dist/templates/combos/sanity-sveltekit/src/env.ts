import { defineEnvVars } from "@sveltejs/kit/env";

export const variables = defineEnvVars({
  SANITY_PROJECT_ID: { schema: optional },
  SANITY_DATASET: { schema: optional },
});

// Optional, so `pnpm build` and `pnpm check-types` run without .env. src/hooks.server.ts checks
// the required ones when the server starts.
function optional(value: string | undefined): string | undefined {
  return value;
}
