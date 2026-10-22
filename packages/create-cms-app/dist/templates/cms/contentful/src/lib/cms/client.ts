import { createClient } from "contentful";
import type { Example } from "./example";

// The subset of the Contentful delivery client that the app uses.
export type ContentfulEntries = {
  getEntries(query: {
    content_type: string;
    limit: number;
    order: string[];
  }): Promise<{ items: Array<{ fields: Record<string, unknown> }> }>;
};

export const requiredEnv = ["CONTENTFUL_SPACE_ID", "CONTENTFUL_ACCESS_TOKEN"] as const;

export async function fetchExample(client: ContentfulEntries): Promise<Example | null> {
  const { items } = await client.getEntries({
    content_type: "example",
    limit: 1,
    order: ["sys.createdAt"],
  });
  const fields = items[0]?.fields;
  return fields ? { title: String(fields.title ?? ""), body: String(fields.body ?? "") } : null;
}

export function createExampleLoader(
  env: Record<string, string | undefined>,
): () => Promise<Example | null> {
  return () => {
    const client = createClient({
      space: env.CONTENTFUL_SPACE_ID ?? "",
      accessToken: env.CONTENTFUL_ACCESS_TOKEN ?? "",
      environment: env.CONTENTFUL_ENVIRONMENT || "master",
    });
    return fetchExample({ getEntries: (query) => client.getEntries(query as never) as never });
  };
}
