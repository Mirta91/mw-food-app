import StoryblokClient from "storyblok-js-client";
import { fetchExample, type StoryblokApi, storyblokRegion } from "~/lib/cms/client";

export default defineEventHandler(async () => {
  const example = await fetchExample(
    new StoryblokClient({
      accessToken: process.env.STORYBLOK_ACCESS_TOKEN,
      region: storyblokRegion(process.env),
    }) as StoryblokApi,
  );
  if (!example) {
    throw createError({ statusCode: 404, statusMessage: "No example content" });
  }
  return example;
});
