import StoryblokClient from "storyblok-js-client";
import type { Example } from "./example.ts";
import { once } from "../utils/once.ts";

export type StoryblokRegion = "eu" | "us" | "ap" | "ca" | "cn";

export const requiredEnv = ["STORYBLOK_ACCESS_TOKEN"] as const;

// Created on first use; see src/lib/utils/once.ts.
export const getClient = once(
  () =>
    new StoryblokClient({
      accessToken: process.env.STORYBLOK_ACCESS_TOKEN,
      region: storyblokRegion(process.env),
    }),
);

export async function fetchExample(client: StoryblokClient): Promise<Example | null> {
  const { data } = await client.get("cdn/stories", {
    content_type: "example",
    per_page: 1,
    sort_by: "created_at:asc",
    version: "published",
  });
  const content = data.stories?.[0]?.content;
  return content ? { title: String(content.title ?? ""), body: String(content.body ?? "") } : null;
}

export function storyblokRegion(env: Record<string, string | undefined>): StoryblokRegion {
  const region = env.STORYBLOK_REGION?.trim() as StoryblokRegion | undefined;
  return region && regions.includes(region) ? region : "eu";
}

const regions: readonly StoryblokRegion[] = ["eu", "us", "ap", "ca", "cn"];
