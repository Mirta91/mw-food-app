import { defineEnvVars } from "@sveltejs/kit/env";

export const variables = defineEnvVars({
  STORYBLOK_ACCESS_TOKEN: { schema: optional },
  STORYBLOK_REGION: { schema: optional },
});

// Optional at startup, so the home page can report missing variables instead of failing.
function optional(value: string | undefined): string | undefined {
  return value;
}
