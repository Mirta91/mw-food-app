import { apiPlugin, storyblokInit, useStoryblokApi } from "@storyblok/svelte";
import * as env from "$app/env/private";
import { fetchExample, requiredEnv, type StoryblokApi, storyblokRegion } from "../lib/cms/client";
import { loadCmsState, missingEnv } from "../lib/cms/state";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => ({
  state: await loadCmsState(missingEnv(requiredEnv, env), () => {
    storyblokInit({
      accessToken: env.STORYBLOK_ACCESS_TOKEN,
      use: [apiPlugin],
      apiOptions: { region: storyblokRegion(env) },
    });
    return fetchExample(useStoryblokApi() as StoryblokApi);
  }),
});
