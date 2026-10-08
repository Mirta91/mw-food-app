// @sanity/sveltekit supports SvelteKit 2 only, so this combo uses @sanity/client directly.
import { createClient } from "@sanity/client";
import * as env from "$app/env/private";
import { apiVersion, fetchExample, requiredEnv } from "../lib/cms/client";
import { loadCmsState, missingEnv } from "../lib/cms/state";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => ({
  state: await loadCmsState(missingEnv(requiredEnv, env), () =>
    fetchExample(
      createClient({
        projectId: env.SANITY_PROJECT_ID,
        dataset: env.SANITY_DATASET,
        apiVersion,
        useCdn: true,
      }),
    ),
  ),
});
