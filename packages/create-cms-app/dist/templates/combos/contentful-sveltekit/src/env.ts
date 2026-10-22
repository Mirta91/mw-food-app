import { defineEnvVars } from "@sveltejs/kit/env";

export const variables = defineEnvVars({
  CONTENTFUL_SPACE_ID: { schema: optional },
  CONTENTFUL_ACCESS_TOKEN: { schema: optional },
  CONTENTFUL_ENVIRONMENT: { schema: optional },
});

// Optional at startup, so the home page can report missing variables instead of failing.
function optional(value: string | undefined): string | undefined {
  return value;
}
