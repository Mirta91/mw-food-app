import { apiPlugin, storyblokInit } from "@storyblok/react/rsc";
import { type StoryblokApi, storyblokRegion } from "./client";

// Server-side Storyblok client for React Server Components.
export function getStoryblokApi(env: Record<string, string | undefined>): StoryblokApi {
  const getApi = storyblokInit({
    accessToken: env.STORYBLOK_ACCESS_TOKEN,
    use: [apiPlugin],
    apiOptions: { region: storyblokRegion(env) },
  });
  return getApi() as StoryblokApi;
}
