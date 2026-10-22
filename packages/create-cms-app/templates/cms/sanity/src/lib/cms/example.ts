import type { SanityClient } from "@sanity/client";
import { getClient } from "./client.ts";

export type Example = {
  title: string;
  body: string;
};

export const exampleQuery = `*[_type == "example"] | order(_createdAt asc)[0]{title, body}`;

export async function fetchExample(client: SanityClient = getClient()): Promise<Example | null> {
  const document = await client.fetch<{ title?: string; body?: string } | null>(exampleQuery);
  return document ? { title: document.title ?? "", body: document.body ?? "" } : null;
}
