import { apiPlugin, storyblokInit, useStoryblokApi } from "@storyblok/svelte";
import * as env from "$app/env/private";
import { type StoryblokApi, storyblokRegion } from "./client";
import { once } from "./once";

// Created on first use from the runtime environment; see once.ts.
export const getClient = once(() => {
  storyblokInit({
    accessToken: env.STORYBLOK_ACCESS_TOKEN,
    use: [apiPlugin],
    apiOptions: { region: storyblokRegion(env) },
  });
  return useStoryblokApi() as StoryblokApi;
});
