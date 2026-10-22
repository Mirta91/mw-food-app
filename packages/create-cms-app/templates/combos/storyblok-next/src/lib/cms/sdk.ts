import { apiPlugin, storyblokInit } from "@storyblok/react/rsc";
import { type StoryblokApi, storyblokRegion } from "./client";
import { once } from "./once";

// Server-side Storyblok client for React Server Components, created on first use from the
// runtime environment; see once.ts.
export const getClient = once(() => {
  const getApi = storyblokInit({
    accessToken: process.env.STORYBLOK_ACCESS_TOKEN,
    use: [apiPlugin],
    apiOptions: { region: storyblokRegion(process.env) },
  });
  return getApi() as StoryblokApi;
});
