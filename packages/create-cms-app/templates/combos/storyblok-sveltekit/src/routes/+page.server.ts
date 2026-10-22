import { apiPlugin, storyblokInit, useStoryblokApi } from "@storyblok/svelte";
import * as env from "$app/env/private";
import { error } from "@sveltejs/kit";
import { fetchExample, type StoryblokApi, storyblokRegion } from "../lib/cms/client";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  storyblokInit({
    accessToken: env.STORYBLOK_ACCESS_TOKEN,
    use: [apiPlugin],
    apiOptions: { region: storyblokRegion(env) },
  });
  const example = await fetchExample(useStoryblokApi() as StoryblokApi);
  if (!example) {
    error(404, "No example content");
  }
  return { example };
};
