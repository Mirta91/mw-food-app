import StoryblokClient from "storyblok-js-client";
import { fetchExample, requiredEnv, type StoryblokApi, storyblokRegion } from "~/lib/cms/client";
import { loadCmsState, missingEnv } from "~/lib/cms/state";

export default defineEventHandler(() =>
  loadCmsState(missingEnv(requiredEnv, process.env), () =>
    fetchExample(
      new StoryblokClient({
        accessToken: process.env.STORYBLOK_ACCESS_TOKEN,
        region: storyblokRegion(process.env),
      }) as StoryblokApi,
    ),
  ),
);
