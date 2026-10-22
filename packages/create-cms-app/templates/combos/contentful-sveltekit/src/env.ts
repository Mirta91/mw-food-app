import { defineEnvVars } from "@sveltejs/kit/env";

export const variables = defineEnvVars({
  CONTENTFUL_SPACE_ID: { schema: optional },
  CONTENTFUL_ACCESS_TOKEN: { schema: optional },
  CONTENTFUL_ENVIRONMENT: { schema: optional },
});

// Optional, so `pnpm build` and `pnpm check-types` run without .env. src/hooks.server.ts checks
// the required ones when the server starts.
function optional(value: string | undefined): string | undefined {
  return value;
}
