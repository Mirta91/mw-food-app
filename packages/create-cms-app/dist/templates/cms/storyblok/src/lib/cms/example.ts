import type StoryblokClient from "storyblok-js-client";
import { getClient } from "./client.ts";

export type Example = {
  title: string;
  body: string;
};

export async function fetchExample(client: StoryblokClient = getClient()): Promise<Example | null> {
  const { data } = await client.get("cdn/stories", {
    content_type: "example",
    per_page: 1,
    sort_by: "created_at:asc",
    version: "published",
  });
  const content = data.stories?.[0]?.content;
  return content ? { title: String(content.title ?? ""), body: String(content.body ?? "") } : null;
}
