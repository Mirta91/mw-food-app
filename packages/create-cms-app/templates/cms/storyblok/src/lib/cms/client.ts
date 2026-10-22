import type { Example } from "./example";

export type StoryblokRegion = "eu" | "us" | "ap" | "ca" | "cn";

// The subset of the Storyblok delivery client that the app uses; every binding's
// useStoryblokApi()/getStoryblokApi() returns a compatible client.
export type StoryblokApi = {
  get(
    path: string,
    params: Record<string, unknown>,
  ): Promise<{ data: { stories?: Array<{ content?: Record<string, unknown> }> } }>;
};

export const requiredEnv = ["STORYBLOK_ACCESS_TOKEN"] as const;

export function storyblokRegion(env: Record<string, string | undefined>): StoryblokRegion {
  const region = env.STORYBLOK_REGION?.trim() as StoryblokRegion | undefined;
  return region && regions.includes(region) ? region : "eu";
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

const regions: readonly StoryblokRegion[] = ["eu", "us", "ap", "ca", "cn"];
