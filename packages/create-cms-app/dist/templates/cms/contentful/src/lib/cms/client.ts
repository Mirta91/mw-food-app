import { type ContentfulClientApi, createClient } from "contentful";
import type { Example } from "./example.ts";
import { once } from "./once.ts";

export const requiredEnv = ["CONTENTFUL_SPACE_ID", "CONTENTFUL_ACCESS_TOKEN"] as const;

// Created on first use; see once.ts.
export const getClient = once(() =>
  createClient({
    space: process.env.CONTENTFUL_SPACE_ID ?? "",
    accessToken: process.env.CONTENTFUL_ACCESS_TOKEN ?? "",
    environment: process.env.CONTENTFUL_ENVIRONMENT || "master",
  }),
);

export async function fetchExample(
  client: ContentfulClientApi<undefined>,
): Promise<Example | null> {
  const { items } = await client.getEntries({
    content_type: "example",
    limit: 1,
    order: ["sys.createdAt"],
  });
  const fields = items[0]?.fields;
  return fields ? { title: String(fields.title ?? ""), body: String(fields.body ?? "") } : null;
}
