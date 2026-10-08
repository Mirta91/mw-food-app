import type { Example } from "./state";

export const requiredEnv = ["STORYBLOK_ACCESS_TOKEN"] as const;

export type StoryblokRegion = "eu" | "us" | "ap" | "ca" | "cn";
const regions: readonly StoryblokRegion[] = ["eu", "us", "ap", "ca", "cn"];

export function storyblokRegion(env: Record<string, string | undefined>): StoryblokRegion {
  const region = env.STORYBLOK_REGION?.trim() as StoryblokRegion | undefined;
  return region && regions.includes(region) ? region : "eu";
}

// The subset of the Storyblok delivery client that the app uses; every binding's
// useStoryblokApi()/getStoryblokApi() returns a compatible client.
export interface StoryblokApi {
  get(
    path: string,
    params: Record<string, unknown>,
  ): Promise<{ data: { stories?: Array<{ content?: Record<string, unknown> }> } }>;
}

export async function fetchExample(api: StoryblokApi): Promise<Example | null> {
  const { data } = await api.get("cdn/stories", {
    content_type: "example",
    per_page: 1,
    sort_by: "created_at:asc",
    version: "published",
  });
  const content = data.stories?.[0]?.content;
  return content ? { title: String(content.title ?? ""), body: String(content.body ?? "") } : null;
}
