import type { Example } from "./state";

// The subset of @sanity/client that the app uses; bindings such as next-sanity return
// compatible clients.
export type SanityFetcher = {
  fetch<T>(query: string): Promise<T>;
};

export const requiredEnv = ["SANITY_PROJECT_ID", "SANITY_DATASET"] as const;

export const apiVersion = "2026-10-01";

export const exampleQuery = `*[_type == "example"] | order(_createdAt asc)[0]{title, body}`;

export async function fetchExample(client: SanityFetcher): Promise<Example | null> {
  const document = await client.fetch<{ title?: string; body?: string } | null>(exampleQuery);
  return document ? { title: document.title ?? "", body: document.body ?? "" } : null;
}
