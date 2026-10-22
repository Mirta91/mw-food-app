import StoryblokClient from "storyblok-js-client";
import { type StoryblokApi, storyblokRegion } from "./client";
import { once } from "./once";

// Created on first use from the runtime environment; see once.ts.
export const getClient = once(
  () =>
    new StoryblokClient({
      accessToken: process.env.STORYBLOK_ACCESS_TOKEN,
      region: storyblokRegion(process.env),
    }) as StoryblokApi,
);
