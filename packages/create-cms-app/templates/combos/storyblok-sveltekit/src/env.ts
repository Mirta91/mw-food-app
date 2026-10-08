import { defineEnvVars } from "@sveltejs/kit/env";

// Optional at startup, so the home page can report missing variables instead of failing.
const optional = (value: string | undefined) => value;

export const variables = defineEnvVars({
  STORYBLOK_ACCESS_TOKEN: { schema: optional },
  STORYBLOK_REGION: { schema: optional },
});
