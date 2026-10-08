import { defineEnvVars } from "@sveltejs/kit/env";

// Optional at startup, so the home page can report missing variables instead of failing.
const optional = (value: string | undefined) => value;

export const variables = defineEnvVars({
  SANITY_PROJECT_ID: { schema: optional },
  SANITY_DATASET: { schema: optional },
});
