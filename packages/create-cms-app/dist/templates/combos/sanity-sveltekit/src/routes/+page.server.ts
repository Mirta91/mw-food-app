// @sanity/sveltekit supports SvelteKit 2 only, so this combo uses @sanity/client directly.
import { createClient } from "@sanity/client";
import * as env from "$app/env/private";
import { error } from "@sveltejs/kit";
import { apiVersion, fetchExample } from "../lib/cms/client";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const example = await fetchExample(
    createClient({
      projectId: env.SANITY_PROJECT_ID,
      dataset: env.SANITY_DATASET,
      apiVersion,
      useCdn: true,
    }),
  );
  if (!example) {
    error(404, "No example content");
  }
  return { example };
};
