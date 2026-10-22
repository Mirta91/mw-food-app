import { defineEnvVars } from "@sveltejs/kit/env";

export const variables = defineEnvVars({
  SANITY_PROJECT_ID: { schema: optional },
  SANITY_DATASET: { schema: optional },
});

// Optional at startup, so the home page can report missing variables instead of failing.
function optional(value: string | undefined): string | undefined {
  return value;
}
