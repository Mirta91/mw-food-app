import { defineEnvVars } from "@sveltejs/kit/env";

// Optional at startup, so the home page can report missing variables instead of failing.
const optional = (value: string | undefined) => value;

export const variables = defineEnvVars({
  CONTENTFUL_SPACE_ID: { schema: optional },
  CONTENTFUL_ACCESS_TOKEN: { schema: optional },
  CONTENTFUL_ENVIRONMENT: { schema: optional },
});
